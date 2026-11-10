import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {onRequest} from '../functions/api/[[path]].js';
const sha=text=>createHash('sha256').update(text).digest('hex');
function mockD1(){
 const users=new Map(),sessions=new Map(),attempts=new Map();
 return {users,sessions,prepare(sql){
 let p=[];
 return {bind(...values){p=values;return this},
  async first(){
   if(sql.startsWith('SELECT 1 AS ok'))return {ok:1};
   if(sql.includes('FROM login_attempts'))return attempts.get(p[0])||null;
   if(sql.includes('FROM users WHERE username'))return [...users.values()].find(x=>x.username===p[0])||null;
   if(sql.includes('FROM users WHERE id'))return users.get(p[0])||null;
   if(sql.includes('FROM sessions JOIN users')){const session=sessions.get(p[0]);if(!session||session.expires_at<=Date.now())return null;const user=users.get(session.user_id);return user&&{id:user.id,username:user.username,role:user.role}}
   return null;
  },
  async all(){if(sql.includes('FROM users ORDER BY'))return {results:[...users.values()].map(({id,username,role,created_at})=>({id,username,role,created_at}))};return {results:[]}},
  async run(){
   if(sql.startsWith('INSERT INTO login_attempts')){const [k,n,t]=p;const old=attempts.get(k);attempts.set(k,old&&t-old.window_start<900000?{attempts:old.attempts+1,window_start:old.window_start}:{attempts:n,window_start:t})}
   if(sql.startsWith('INSERT INTO users')){const [id,username,role,salt,password_hash,created_at]=p;if([...users.values()].some(u=>u.username===username))throw Error('unique');users.set(id,{id,username,role,salt,password_hash,created_at})}
   if(sql.startsWith('INSERT INTO sessions')){const [token_hash,user_id,expires_at]=p;sessions.set(token_hash,{user_id,expires_at})}
   if(sql.startsWith('UPDATE users SET')){const [salt,password_hash,id]=p;Object.assign(users.get(id),{salt,password_hash})}
   if(sql.startsWith('DELETE FROM sessions WHERE user_id'))for(const [k,v]of sessions)if(v.user_id===p[0])sessions.delete(k);
   if(sql.startsWith('DELETE FROM sessions WHERE token_hash'))sessions.delete(p[0]);
   return {success:true};
  }
 }}};
}
const url='https://codeduo.test';
async function call(db,route,method='GET',data,cookie='',origin=url){
 const req=new Request(url+'/api/'+route,{method,headers:{...(cookie?{cookie}:{}),...(method==='POST'?{origin,'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
 return onRequest({request:req,env:{DB:db}});
}
test('register, sign in, user session and logout work as a complete flow',async()=>{
 const db=mockD1(),user={username:'eleve01',password:'SecurePassword1234!'};
 let r=await call(db,'register','POST',user);
 assert.equal(r.status,200);
 const initialCookie=r.headers.get('set-cookie');
 assert.match(initialCookie,/HttpOnly; Secure; SameSite=Lax/);
 assert.equal((await r.json()).user.role,'student');
 r=await call(db,'me','GET',undefined,initialCookie);
 assert.equal((await r.json()).user.username,'eleve01');
 r=await call(db,'users','GET',undefined,initialCookie);assert.equal(r.status,403);
 r=await call(db,'logout','POST',undefined,initialCookie);assert.equal(r.status,200);
 assert.equal((await(await call(db,'me','GET',undefined,initialCookie)).json()).user,null);
 assert.equal((await call(db,'login','POST',{...user,password:'wrong'})).status,401);
 r=await call(db,'login','POST',user);assert.equal(r.status,200);
 assert.match(r.headers.get('set-cookie'),/cd_session=/);
});
test('password change revokes existing sessions and requires current password',async()=>{
 const db=mockD1(),user={username:'etudiant02',password:'StartPassword123!'},changed='NewPassword45678!';
 let res=await call(db,'register','POST',user),cookie=res.headers.get('set-cookie');
 assert.equal((await call(db,'password','POST',{currentPassword:'bad',newPassword:changed},cookie)).status,403);
 res=await call(db,'password','POST',{currentPassword:user.password,newPassword:changed},cookie);
 assert.equal(res.status,200);
 assert.match(res.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal((await(await call(db,'me','GET',undefined,cookie)).json()).user,null);
 assert.equal((await call(db,'login','POST',user)).status,401);
 assert.equal((await call(db,'login','POST',{...user,password:changed})).status,200);
});
