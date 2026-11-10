import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {onRequest} from '../functions/api/[[path]].js';

const sha=s=>createHash('sha256').update(s).digest('hex');
const cookies=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex'),randomBytes(32).toString('hex')];
function mockDb(){
 const users=cookies.map((cookie,i)=>({id:'u'+i,username:'student'+i,role:'student',cookie}));
 const rooms=new Map(),members=new Map();
 const count=id=>[...rooms.values()].filter(r=>r.owner_id===id&&r.expires_at>Date.now()).length;
 const memberKey=(room,user)=>room+':'+user;
 return {users,rooms,members,prepare(sql){
   let params=[];
   return {
    bind(...values){params=values;return this},
    async first(){
     if(sql.includes('FROM sessions JOIN users'))return users.find(u=>sha(u.cookie)===params[0])||null;
     if(sql.startsWith('SELECT COUNT(*) AS total'))return {total:count(params[0])};
     if(sql.includes('WHERE invite_hash=?'))return [...rooms.values()].find(x=>x.invite_hash===params[0]&&x.expires_at>params[1])||null;
     if(sql.startsWith('SELECT user_id FROM pair_members'))return members.has(memberKey(params[0],params[1]))?{user_id:params[1]}:null;
     if(sql.startsWith('SELECT pair_rooms.id FROM pair_members'))return members.has(memberKey(params[0],params[1]))&&rooms.get(params[0])?.expires_at>params[2]?{id:params[0]}:null;
     return null;
    },
    async all(){
     if(sql.startsWith('SELECT pair_rooms.id, pair_rooms.expires_at'))return {results:[...rooms.values()].filter(x=>members.has(memberKey(x.id,params[0]))&&x.expires_at>params[1]).map(x=>({id:x.id,expires_at:x.expires_at}))};
     return {results:[]}
    },
    async run(){
     if(sql.startsWith('INSERT INTO pair_rooms')){const [id,owner_id,invite_hash,expires_at,created_at]=params;rooms.set(id,{id,owner_id,invite_hash,expires_at,created_at})}
     if(sql.startsWith('INSERT INTO pair_members')){const [room_id,user_id,joined_at]=params;members.set(memberKey(room_id,user_id),{room_id,user_id,joined_at})}
     if(sql.startsWith('INSERT OR IGNORE INTO pair_members')){const [room_id,user_id,joined_at]=params;
      if([...members.values()].filter(x=>x.room_id===room_id).length<2)members.set(memberKey(room_id,user_id),{room_id,user_id,joined_at})}
     return {success:true}
    }
   }
 }};
}
async function call(db,index,path,method='GET',body,envExtra={}){
 const request=new Request('https://codeduo.test/api/'+path,{
  method,headers:{...(index!==null?{cookie:'cd_session='+cookies[index]}:{}),...(method==='POST'?{'content-type':'application/json',origin:'https://codeduo.test'}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)})
 });
 return onRequest({request,env:{DB:db,...envExtra}});
}
test('anonymous users cannot create, join or enumerate private pair rooms',async()=>{
 const db=mockDb();for(const [path,method] of [['pair/room','GET'],['pair/create','POST'],['pair/join','POST']]){
  const r=await call(db,null,path,method,method==='POST'?{invite:'0'.repeat(32)}:undefined);
  assert.equal(r.status,401);
 }
});
test('pair invite is hashed, room has exactly two members and isolates a third student',async()=>{
 const db=mockDb();const create=await call(db,0,'pair/create','POST');
 assert.equal(create.status,201);
 const {room,invite}=await create.json();
 assert.equal(invite.length,32);
 assert.equal(db.rooms.get(room).invite_hash,sha(invite));
 assert.equal((await call(db,1,'pair/join','POST',{invite})).status,200);
 assert.equal((await call(db,2,'pair/join','POST',{invite})).status,409);
 assert.equal((await call(db,1,'pair/room')).status,200);
 assert.deepEqual((await(await call(db,2,'pair/room')).json()).rooms,[]);
 assert.equal((await call(db,2,'pair/socket?room='+room)).status,403);
 assert.equal((await call(db,0,'pair/socket?room='+room)).status,426);
 assert.equal(db.members.size,2);
});
test('expired and malformed invitations are rejected',async()=>{
 const db=mockDb();
 assert.equal((await call(db,1,'pair/join','POST',{invite:'not-a-token'})).status,400);
 const created=await(await call(db,0,'pair/create','POST')).json();
 db.rooms.get(created.room).expires_at=Date.now()-1000;
 assert.equal((await call(db,1,'pair/join','POST',{invite:created.invite})).status,404);
});
test('native C# compile route is guarded and fails closed until configured',async()=>{
 const db=mockDb();const body={code:'using System; class Program { static void Main() { Console.WriteLine("hi"); }}'};
 assert.equal((await call(db,null,'csharp/compile','POST',body)).status,401);
 assert.equal((await call(db,0,'csharp/compile','POST',body)).status,503);
 assert.equal((await call(db,0,'csharp/compile','POST',{code:'x'.repeat(16001)})).status,503);
});
test('pair Worker, C# runtime source and UI include required safeguards',()=>{
 const worker=readFileSync(new URL('../services/pair-realtime/src/index.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../atelier-projet.html',import.meta.url),'utf8');
 const cs=readFileSync(new URL('../services/csharp-compiler/Program.cs',import.meta.url),'utf8');
 const pair=readFileSync(new URL('../js/pair-client.js',import.meta.url),'utf8');
 assert.match(worker,/crypto.subtle.verify/);
 assert.match(worker,/blockConcurrencyWhile/);
 assert.match(worker,/type:'conflict'/);
 assert.match(worker,/this.ctx.acceptWebSocket/);
 assert.match(cs,/dotnet", "build/);
 assert.match(cs,/NEVER executed/);
 assert.match(app,/api\/csharp\/compile/);
 assert.match(page,/id="pairJoin"/);
 assert.match(pair,/codeduo-local-edit/);
 assert.doesNotThrow(()=>new vm.Script(pair));
 const migration=readFileSync(new URL('../migrations/0004_pair_rooms.sql',import.meta.url),'utf8');
 assert.match(migration,/invite_hash TEXT NOT NULL UNIQUE/);
});
