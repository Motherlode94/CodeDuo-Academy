const enc = new TextEncoder();
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()',...headers}});
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function digest(s){return hex(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:100000},key,256))}
function cookie(request){return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cd_session='))?.slice(11)||''}
async function current(request,db){const token=cookie(request);if(!/^[a-f0-9]{64}$/.test(token))return null;return db.prepare('SELECT users.id, users.username, users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(await digest(token),Date.now()).first()}
const sessionCookie=(t,max)=>'cd_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+max;
const stripCookie='cd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
export async function onRequest(context) {
  try {
    return await handleRequest(context);
  } catch (error) {
    console.error('CodeDuo API failure:', error instanceof Error ? error.stack : String(error));
    return json({error:'Erreur serveur lors de la connexion. Consulte les journaux Cloudflare.'},500);
  }
}
async function handleRequest({request,env}) {
  if(['POST','PUT'].includes(request.method) && Number(request.headers.get('content-length')||0)>(new URL(request.url).pathname==='/api/project'?48000:24000))return json({error:'Requête trop volumineuse'},413);
  if(!env.DB)return json({error:'Base de données indisponible'},503);
  const db=env.DB;const origin=request.headers.get('origin');if(request.method!=='GET'&&origin&&origin!==new URL(request.url).origin)return json({error:'Origine non autorisée'},403);const path=new URL(request.url).pathname.replace(/^\/api\/?/,'');const method=request.method;
  if(method==='GET'&&path==='health'){const probe=await db.prepare('SELECT 1 AS ok').first();return json({ok:probe?.ok===1,service:'codeduo-auth'});}
  if(path.startsWith('pair/')){
    const actor=await current(request,db);
    if(!actor)return json({error:'Connexion étudiante requise'},401);
    const route=path.slice(5),now=Date.now();
    if(method==='GET'&&route==='room'){
      const rows=await db.prepare('SELECT pair_rooms.id, pair_rooms.expires_at FROM pair_members JOIN pair_rooms ON pair_rooms.id=pair_members.room_id WHERE pair_members.user_id=? AND pair_rooms.expires_at>? ORDER BY pair_members.joined_at DESC LIMIT 10').bind(actor.id,now).all();
      return json({rooms:rows.results||[]});
    }
    if(method==='POST'&&route==='create'){
      const count=await db.prepare('SELECT COUNT(*) AS total FROM pair_rooms WHERE owner_id=? AND expires_at>?').bind(actor.id,now).first();
      if((count?.total||0)>=5)return json({error:'Maximum cinq salons actifs'},429);
      const room=crypto.randomUUID(),invite=hex(crypto.getRandomValues(new Uint8Array(16))),expiry=now+7*86400000;
      await db.prepare('INSERT INTO pair_rooms(id,owner_id,invite_hash,expires_at,created_at) VALUES(?,?,?,?,?)')
        .bind(room,actor.id,await digest(invite),expiry,now).run();
      await db.prepare('INSERT INTO pair_members(room_id,user_id,joined_at) VALUES(?,?,?)').bind(room,actor.id,now).run();
      return json({room,invite,expiresAt:expiry},201);
    }
    if(method==='POST'&&route==='join'){
      let body;try{const raw=await request.text();if(raw.length>1000)return json({error:'Invitation invalide'},400);body=JSON.parse(raw)}catch{return json({error:'Invitation invalide'},400)}
      const code=body?.invite;if(typeof code!=='string'||!/^[a-f0-9]{32}$/.test(code))return json({error:'Code incorrect'},400);
      const room=await db.prepare('SELECT id FROM pair_rooms WHERE invite_hash=? AND expires_at>?').bind(await digest(code),now).first();
      if(!room)return json({error:'Invitation expirée ou inconnue'},404);
      await db.prepare('INSERT OR IGNORE INTO pair_members(room_id,user_id,joined_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM pair_members WHERE room_id=?)<2')
        .bind(room.id,actor.id,now,room.id).run();
      const member=await db.prepare('SELECT user_id FROM pair_members WHERE room_id=? AND user_id=?').bind(room.id,actor.id).first();
      if(!member)return json({error:'Salon complet : deux étudiants maximum'},409);
      return json({room:room.id,joined:true});
    }
    if(method==='GET'&&route==='socket'){
      const room=new URL(request.url).searchParams.get('room');
      if(!room||!/^[a-f0-9-]{36}$/.test(room))return json({error:'Salon invalide'},400);
      const member=await db.prepare('SELECT pair_rooms.id FROM pair_members JOIN pair_rooms ON pair_rooms.id=pair_members.room_id WHERE pair_rooms.id=? AND pair_members.user_id=? AND pair_rooms.expires_at>?')
        .bind(room,actor.id,now).first();
      if(!member)return json({error:'Salon interdit ou expiré'},403);
      if(request.headers.get('upgrade')?.toLowerCase()!=='websocket')return json({error:'WebSocket requis'},426);
      if(!env.PAIR_REALTIME||!env.PAIR_SECRET)return json({error:'Collaboration non configurée'},503);
      const expiry=now+30000,payload=JSON.stringify({room,user:actor.id,exp:expiry,nonce:crypto.randomUUID()});
      const bytes=enc.encode(payload),key=await crypto.subtle.importKey('raw',enc.encode(env.PAIR_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,bytes));
      const b64=arr=>btoa(String.fromCharCode(...arr)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
      return env.PAIR_REALTIME.fetch('https://internal/connect',{headers:{upgrade:'websocket','x-codeduo-ticket':b64(bytes)+'.'+b64(mac)}});
    }
    return json({error:'Route binôme inconnue'},404);
  }
  if(path==='csharp/compile'){
    if(method!=='POST')return json({error:'Méthode non autorisée'},405);
    const actor=await current(request,db);
    if(!actor)return json({error:'Connecte-toi pour compiler en C#'},401);
    if(!env.CSHARP_COMPILER_URL||!env.CSHARP_COMPILER_TOKEN)return json({error:'Service .NET non configuré : compilation indisponible'},503);
    let code;try{const body=await request.text();if(body.length>18000)return json({error:'Source trop volumineuse'},413);
      const data=JSON.parse(body);code=data?.code;
    }catch{return json({error:'Corps JSON invalide'},400)}
    if(typeof code!=='string'||code.length>16000)return json({error:'Code C# invalide'},400);
    let response;try{
      const timeout=AbortSignal.timeout(16000);
      response=await fetch(env.CSHARP_COMPILER_URL,{method:'POST',
        headers:{'content-type':'application/json','authorization':'Bearer '+env.CSHARP_COMPILER_TOKEN},
        body:JSON.stringify({code}),signal:timeout});
    }catch{return json({error:'Compilateur .NET temporairement indisponible'},503)}
    if(!response.ok)return json({error:response.status===429?'Compilateur occupé':'Compilateur indisponible'},response.status===429?429:503);
    let result;try{result=await response.json()}catch{return json({error:'Réponse du compilateur invalide'},502)}
    if(typeof result?.ok!=='boolean'||!Array.isArray(result.diagnostics))return json({error:'Réponse du compilateur invalide'},502);
    return json({ok:result.ok,diagnostics:result.diagnostics.filter(x=>typeof x==='string').slice(0,30).map(x=>x.slice(0,450)),
      compiler:'Roslyn via .NET SDK 8',executed:false});
  }
  if(path==='project'){
    const actor=await current(request,db);
    if(!actor)return json({error:'Connexion requise'},401);
    if(!['GET','PUT'].includes(method))return json({error:'Méthode non autorisée'},405,{'allow':'GET, PUT'});
    const projectId='web-starter';
    if(method==='GET'){
      const row=await db.prepare('SELECT html,css,javascript,updated_at FROM student_projects WHERE user_id=? AND project_id=?')
        .bind(actor.id,projectId).first();
      return json({project:row||null});
    }
    // Enforce a hard body budget even when Content-Length is not provided.
    const sizeLimit=48000,reader=request.body?.getReader();
    if(!reader)return json({error:'Corps manquant'},400);
    let bytes=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
      if(bytes>sizeLimit){await reader.cancel().catch(()=>{});return json({error:'Projet trop volumineux'},413)}
      chunks.push(value)}
    const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length}
    let payload;try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data))}catch{return json({error:'Projet JSON invalide'},400)}
    const html=payload?.html,css=payload?.css,javascript=payload?.javascript;
    if(typeof html!=='string'||typeof css!=='string'||typeof javascript!=='string'
      ||html.length>16000||css.length>16000||javascript.length>16000)
      return json({error:'Fichiers invalides (16 000 caractères maximum par fichier)'},400);
    await db.prepare('INSERT INTO student_projects(user_id,project_id,html,css,javascript,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,project_id) DO UPDATE SET html=excluded.html,css=excluded.css,javascript=excluded.javascript,updated_at=excluded.updated_at')
      .bind(actor.id,projectId,html,css,javascript,Date.now()).run();
    return json({ok:true,updatedAt:Date.now()});
  }
  // User-owned learning data. Every query is scoped to the authenticated session.
  if(['progress','drafts'].includes(path)){
    const actor=await current(request,db);
    if(!actor)return json({error:'Connexion requise'},401);
    if(!['GET','PUT'].includes(method))return json({error:'Méthode non autorisée'},405,{'allow':'GET, PUT'});
    if(method==='GET'){
      if(path==='progress'){
        const rows=await db.prepare('SELECT track,lesson_id,completed_at FROM student_progress WHERE user_id=? ORDER BY track,lesson_id').bind(actor.id).all();
        return json({completed:rows.results||[]});
      }
      const rows=await db.prepare('SELECT language,source,updated_at FROM student_drafts WHERE user_id=? ORDER BY language').bind(actor.id).all();
      return json({drafts:rows.results||[]});
    }
    let raw;try{raw=await request.text()}catch{return json({error:'Requête invalide'},400)}
    if(raw.length>24000)return json({error:'Données trop volumineuses'},413);
    let body;try{body=JSON.parse(raw)}catch{return json({error:'JSON invalide'},400)}
    if(path==='progress'){
      const track=body?.track,lessonId=body?.lessonId;
      if(!['code','mao'].includes(track)||!Number.isInteger(lessonId)||lessonId<1||lessonId>(track==='code'?14:12)||body?.completed!==true)
        return json({error:'Progression invalide'},400);
      await db.prepare('INSERT INTO student_progress(user_id,track,lesson_id,completed_at) VALUES(?,?,?,?) ON CONFLICT(user_id,track,lesson_id) DO NOTHING')
        .bind(actor.id,track,lessonId,Date.now()).run();
      return json({ok:true,track,lessonId});
    }
    const language=body?.language,source=body?.source;
    if(!['javascript','html','csharp'].includes(language)||typeof source!=='string'||source.length>20000)
      return json({error:'Brouillon invalide (20 000 caractères maximum)'},400);
    await db.prepare('INSERT INTO student_drafts(user_id,language,source,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,language) DO UPDATE SET source=excluded.source,updated_at=excluded.updated_at')
      .bind(actor.id,language,source,Date.now()).run();
    return json({ok:true,language});
  }
  if(method==='GET'&&path==='users'){const actor=await current(request,db);if(!actor||actor.role!=='admin')return json({error:'Accès réservé'},403);const rows=await db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();return json({users:rows.results||[]});}
  if(method==='GET'&&path==='me'){const user=await current(request,db);return json({user:user||null});}
  if(method==='POST'&&path==='password'){const user=await current(request,db);if(!user)return json({error:'Connexion requise'},401);let b;try{b=await request.json()}catch{return json({error:'Requête invalide'},400)}const old=String(b?.currentPassword||''),next=String(b?.newPassword||'');if(next.length<12||next.length>200||old.length>200)return json({error:'Mot de passe trop court ou invalide'},400);const record=await db.prepare('SELECT salt,password_hash FROM users WHERE id=?').bind(user.id).first();if(!record||(await derive(old,record.salt))!==record.password_hash)return json({error:'Mot de passe actuel incorrect'},403);const salt=crypto.randomUUID(),hash=await derive(next,salt);await db.prepare('UPDATE users SET salt=?, password_hash=? WHERE id=?').bind(salt,hash,user.id).run();await db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id).run();return json({ok:true,notice:'Mot de passe changé. Reconnectez-vous.'},200,{'set-cookie':stripCookie});}
  if(method==='POST'&&path==='logout'){const t=cookie(request);if(/^[a-f0-9]{64}$/.test(t))await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(t)).run();return json({ok:true},200,{'set-cookie':stripCookie});}
  if(method!=='POST'||!['register','login'].includes(path))return json({error:'Route inexistante'},404);
  let body;try{body=await request.json()}catch{return json({error:'JSON invalide'},400)}
  const username=String(body?.username||'').trim().toLowerCase(),password=String(body?.password||'');
  if(!/^[a-z0-9_-]{3,32}$/.test(username)||password.length<(path==='register'?12:1)||password.length>200)return json({error:path==='register'?'Inscription : mot de passe de 12 caractères minimum.':'Identifiant ou mot de passe invalide.'},400);
  // Each login attempt performs a PBKDF2 derivation; reject large bursts via Cloudflare WAF rate limiting in production.
  const ip=request.headers.get('cf-connecting-ip')||'unknown';const attemptKey=await digest(ip+':'+username+':'+path);const now=Date.now();const prev=await db.prepare('SELECT attempts,window_start FROM login_attempts WHERE attempt_key=?').bind(attemptKey).first();if(prev&&now-prev.window_start<900000&&prev.attempts>=10)return json({error:'Trop de tentatives. Réessaie dans 15 minutes.'},429,{'retry-after':'900'});await db.prepare('INSERT INTO login_attempts(attempt_key,attempts,window_start) VALUES (?,?,?) ON CONFLICT(attempt_key) DO UPDATE SET attempts=CASE WHEN ?-window_start>900000 THEN 1 ELSE attempts+1 END, window_start=CASE WHEN ?-window_start>900000 THEN ? ELSE window_start END').bind(attemptKey,1,now,now,now,now).run();
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
