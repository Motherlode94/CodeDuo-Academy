import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const code=readFileSync(new URL('../services/pair-realtime/src/index.js',import.meta.url),'utf8');
const {PairRoom,default:worker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function socket(user){
 let meta={user,time:0,count:0},closed=false;const messages=[];
 return {readyState:1,messages,get closed(){return closed},send(text){messages.push(JSON.parse(text))},serializeAttachment(v){meta=v},deserializeAttachment(){return meta},close(){closed=true;this.readyState=3}};
}
function room(){
 const memory=new Map(),sockets=[socket('alice'),socket('bob')];
 const ctx={storage:{get:async k=>memory.get(k),put:async(k,v)=>{memory.set(k,v)}},getWebSockets:()=>sockets,blockConcurrencyWhile:fn=>fn()};
 return {room:new PairRoom(ctx,{}),memory,sockets};
}
const files=(value)=>({html:'<h1>'+value+'</h1>',css:'body {}',javascript:'console.log(1)'});
test('Durable Object accepts edit, persists it, and broadcasts revision to both members',async()=>{
 const t=room();
 await t.room.webSocketMessage(t.sockets[0],JSON.stringify({type:'edit',revision:0,files:files('first')}));
 assert.equal(t.memory.get('document').revision,1);
 assert.equal(t.sockets[1].messages.at(-1).type,'update');
 assert.equal(t.sockets[1].messages.at(-1).files.html,files('first').html);
});
test('concurrent stale edits are rejected without overwriting partner data',async()=>{
 const t=room();
 await t.room.webSocketMessage(t.sockets[0],JSON.stringify({type:'edit',revision:0,files:files('A')}));
 await t.room.webSocketMessage(t.sockets[1],JSON.stringify({type:'edit',revision:0,files:files('B')}));
 assert.equal(t.memory.get('document').revision,1);
 assert.equal(t.memory.get('document').files.html,files('A').html);
 assert.equal(t.sockets[1].messages.at(-1).type,'conflict');
 assert.equal(t.sockets[1].messages.at(-1).files.html,files('A').html);
 await t.room.webSocketMessage(t.sockets[1],JSON.stringify({type:'edit',revision:1,files:files('B')}));
 assert.equal(t.memory.get('document').revision,2);
});
test('invalid payloads and message flooding are rejected',async()=>{
 const t=room();
 await t.room.webSocketMessage(t.sockets[0],JSON.stringify({type:'edit',revision:0,files:{html:'h',css:'c'}}));
 assert.equal(t.sockets[0].messages.at(-1).type,'error');
 for(let i=0;i<14;i++)await t.room.webSocketMessage(t.sockets[0],JSON.stringify({type:'ping'}));
 assert.equal(t.sockets[0].closed,true);
});
test('Worker rejects forged tickets before opening any room',async()=>{
 const secret='0'.repeat(48);
 const bad=await worker.fetch(new Request('https://pair.example/connect',{headers:{upgrade:'websocket','x-codeduo-ticket':'invalid'}}),{PAIR_SECRET:secret,PAIR_ROOMS:{}});
 assert.equal(bad.status,401);
 const msg={room:'f734831b-b7c7-49d5-bbbd-dd5067fcb362',user:'alice',exp:Date.now()+15000,nonce:'test'};
 const payload=new TextEncoder().encode(JSON.stringify(msg)),key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(secret),'HMAC',{hash:'SHA-256'},false,['sign']);
 const mac=new Uint8Array(await webcrypto.subtle.sign('HMAC',key,payload));
 const base=b=>Buffer.from(b).toString('base64url');
 let target=null;
 const env={PAIR_SECRET:secret,PAIR_ROOMS:{idFromName:r=>r,get:r=>({fetch:request=>{target=request;return new Response('stub',{status:200})}})}};
 const ok=await worker.fetch(new Request('https://pair.example/connect',{headers:{upgrade:'websocket','x-codeduo-ticket':base(payload)+'.'+base(mac)}}),env);
 assert.equal(ok.status,200);assert.equal(target.headers.get('x-user'),'alice');
 assert.equal(target.headers.get('x-room'),msg.room);
});
