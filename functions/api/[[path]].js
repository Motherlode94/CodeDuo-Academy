const enc = new TextEncoder();
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function digest(s){return hex(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:210000},key,256))}
function cookie(request){return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cd_session='))?.slice(11)||''}
async function current(request,db){const token=cookie(request);if(!/^[a-f0-9]{64}$/.test(token))return null;return db.prepare('SELECT users.id, users.username, users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(await digest(token),Date.now()).first()}
const sessionCookie=(t,max)=>'cd_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+max;
const stripCookie='cd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
export async function onRequest({request,env}){
  if(!env.DB)return json({error:'Base de données indisponible'},503);
  const db=env.DB;const origin=request.headers.get('origin');if(request.method!=='GET'&&origin&&origin!==new URL(request.url).origin)return json({error:'Origine non autorisée'},403);const path=new URL(request.url).pathname.replace(/^\/api\/?/,'');const method=request.method;
  if(method==='GET'&&path==='users'){const actor=await current(request,db);if(!actor||actor.role!=='admin')return json({error:'Accès réservé'},403);const rows=await db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();return json({users:rows.results||[]});}
  if(method==='GET'&&path==='me'){const user=await current(request,db);return json({user:user||null});}
  if(method==='POST'&&path==='logout'){const t=cookie(request);if(/^[a-f0-9]{64}$/.test(t))await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(t)).run();return json({ok:true},200,{'set-cookie':stripCookie});}
  if(method!=='POST'||!['register','login'].includes(path))return json({error:'Route inexistante'},404);
  let body;try{body=await request.json()}catch{return json({error:'JSON invalide'},400)}
  const username=String(body?.username||'').trim().toLowerCase(),password=String(body?.password||'');
  if(!/^[a-z0-9_-]{3,32}$/.test(username)||password.length<12||password.length>200)return json({error:'Identifiant ou mot de passe invalide (12 caractères minimum).'},400);
  // Each login attempt performs a PBKDF2 derivation; reject large bursts via Cloudflare WAF rate limiting in production.
  if(path==='register'){
    const salt=crypto.randomUUID(),id=crypto.randomUUID(),hash=await derive(password,salt);
    try{await db.prepare('INSERT INTO users (id,username,role,salt,password_hash,created_at) VALUES (?,?,?,?,?,?)').bind(id,username,'student',salt,hash,Date.now()).run()}catch{return json({error:'Identifiant indisponible.'},409)}
  }
  const u=await db.prepare('SELECT id,username,role,salt,password_hash FROM users WHERE username=?').bind(username).first();
  // Constant-work invalid-user path, avoiding straightforward account enumeration on login.
  const hash=await derive(password,u?.salt||'fixed-invalid-user-salt-2026');
  if(!u||hash!==u.password_hash)return json({error:'Identifiants incorrects.'},401);
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));const expires=Date.now()+7*24*3600*1000;
  await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),u.id,expires).run();
  return json({ok:true,user:{id:u.id,username:u.username,role:u.role}},200,{'set-cookie':sessionCookie(token,604800)});
}
