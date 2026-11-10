import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/api/[[path]].js';
const token='a'.repeat(64),tokenHash=createHash('sha256').update(token).digest('hex');
function database(){
 const sessions=new Map([[tokenHash,{id:'student-one',username:'alice',role:'student'}]]);
 const progress=new Map(),drafts=new Map();
 return {sessions,progress,drafts,prepare(sql){
  let args=[];
  return {bind(...values){args=values;return this},async first(){
    if(sql.includes('FROM sessions JOIN users'))return sessions.get(args[0])||null;
    if(sql.includes('SELECT 1 AS ok'))return {ok:1};
    return null;
   },async all(){
    if(sql.includes('FROM student_progress'))return {results:[...progress.values()].filter(v=>v.user_id===args[0]).map(({track,lesson_id,completed_at})=>({track,lesson_id,completed_at}))};
    if(sql.includes('FROM student_drafts'))return {results:[...drafts.values()].filter(v=>v.user_id===args[0]).map(({language,source,updated_at})=>({language,source,updated_at}))};
    return {results:[]}
   },async run(){
    if(sql.startsWith('INSERT INTO student_progress')){const [user_id,track,lesson_id,completed_at]=args;progress.set(user_id+':'+track+':'+lesson_id,{user_id,track,lesson_id,completed_at})}
    if(sql.startsWith('INSERT INTO student_drafts')){const [user_id,language,source,updated_at]=args;drafts.set(user_id+':'+language,{user_id,language,source,updated_at})}
    return {success:true}
   }}
 }};
}
async function request(db,path,method='GET',body,authenticated=true,origin='https://codeduo.test'){
 const req=new Request('https://codeduo.test/api/'+path,{method,headers:{...(authenticated?{cookie:'cd_session='+token}:{}),...(method!=='GET'?{'content-type':'application/json',origin}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 return onRequest({request:req,env:{DB:db}});
}
test('unauthed user cannot access or update student progress',async()=>{
 const db=database();
 assert.equal((await request(db,'progress','GET',undefined,false)).status,401);
 assert.equal((await request(db,'drafts','PUT',{language:'csharp',source:'class A {}'},false)).status,401);
 assert.equal(db.drafts.size,0);
});
test('authenticated progress is idempotent and isolated by session user',async()=>{
 const db=database();
 assert.equal((await request(db,'progress','PUT',{track:'code',lessonId:3,completed:true})).status,200);
 assert.equal((await request(db,'progress','PUT',{track:'code',lessonId:3,completed:true})).status,200);
 assert.equal(db.progress.size,1);
 assert.equal((await(await request(db,'progress')).json()).completed[0].lesson_id,3);
 db.sessions.set(tokenHash,{id:'student-two',username:'bob',role:'student'});
 assert.equal((await(await request(db,'progress')).json()).completed.length,0);
});
test('drafts remain separated between accounts and support replacement',async()=>{
 const db=database();
 assert.equal((await request(db,'drafts','PUT',{language:'javascript',source:'console.log(1)'})).status,200);
 assert.equal((await request(db,'drafts','PUT',{language:'javascript',source:'console.log(2)'})).status,200);
 assert.equal((await(await request(db,'drafts')).json()).drafts[0].source,'console.log(2)');
 db.sessions.set(tokenHash,{id:'student-two',username:'bob',role:'student'});
 assert.deepEqual((await(await request(db,'drafts')).json()).drafts,[]);
});
test('validation rejects invalid progress and oversized or unknown drafts',async()=>{
 const db=database();
 assert.equal((await request(db,'progress','PUT',{track:'code',lessonId:99,completed:true})).status,400);
 assert.equal((await request(db,'drafts','PUT',{language:'python',source:'hi'})).status,400);
 assert.equal((await request(db,'drafts','PUT',{language:'javascript',source:'x'.repeat(20001)})).status,400);
 assert.equal((await request(db,'drafts','PUT',{language:'javascript',source:'hello'},true,'https://attacker.test')).status,403);
 assert.equal(db.progress.size,0);assert.equal(db.drafts.size,0);
});
test('D1 migration defines account-indexed unique progress and drafts',()=>{
 const sql=readFileSync(new URL('../migrations/0002_student_learning.sql',import.meta.url),'utf8');
 assert.match(sql,/PRIMARY KEY\(user_id, track, lesson_id\)/);
 assert.match(sql,/PRIMARY KEY\(user_id, language\)/);
 assert.match(sql,/FOREIGN KEY\(user_id\)/);
});
