// Dedicated Cloudflare Worker, reachable only through the authenticated Pages service binding.
// Requires PAIR_SECRET on both the Pages project and this Worker (same random secret).
const dec64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));
async function verifyTicket(ticket,secret){
 if(typeof ticket!=='string'||ticket.length>1600)return null;
 const parts=ticket.split('.');if(parts.length!==2)return null;
 try{
  const payload=dec64(parts[0]),signature=dec64(parts[1]);
  if(signature.length!==32)return null;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),'HMAC',{hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',key,signature,payload))return null;
  const data=JSON.parse(new TextDecoder().decode(payload));
  if(typeof data.room!=='string'||!/^[a-f0-9-]{36}$/.test(data.room)||typeof data.user!=='string'||data.user.length>100
    ||!Number.isFinite(data.exp)||data.exp<Date.now()||data.exp>Date.now()+30000)return null;
  return data;
 }catch{return null}
}
const validFiles=files=>files&&['html','css','javascript'].every(k=>typeof files[k]==='string'&&files[k].length<=16000);
export default {
 async fetch(request,env){
  if(request.headers.get('upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket only',{status:426});
  if(!env.PAIR_SECRET||!env.PAIR_ROOMS)return new Response('Unconfigured',{status:503});
  const ticket=await verifyTicket(request.headers.get('x-codeduo-ticket'),env.PAIR_SECRET);
  if(!ticket)return new Response('Unauthorized',{status:401});
  const id=env.PAIR_ROOMS.idFromName(ticket.room);
  const stub=env.PAIR_ROOMS.get(id);
  return stub.fetch(new Request('https://room.internal/ws',{headers:{
   upgrade:'websocket','x-user':ticket.user,'x-room':ticket.room
  }}));
 }
};
export class PairRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 broadcast(message,except=null){
  const serialized=JSON.stringify(message);
  for(const socket of this.ctx.getWebSockets())if(socket!==except&&socket.readyState===1){
   try{socket.send(serialized)}catch{}
  }
 }
 async fetch(request){
  if(request.headers.get('upgrade')?.toLowerCase()!=='websocket')return new Response('Upgrade required',{status:426});
  const user=request.headers.get('x-user');
  if(!user)return new Response('Unauthorized',{status:401});
  const sockets=this.ctx.getWebSockets(),users=new Set(sockets.map(ws=>ws.deserializeAttachment()?.user).filter(Boolean));
  if(!users.has(user)&&users.size>=2)return new Response('Room full',{status:409});
  if(sockets.length>=6)return new Response('Too many connections',{status:429});
  const pair=new WebSocketPair(),[client,server]=Object.values(pair);
  this.ctx.acceptWebSocket(server);
  server.serializeAttachment({user,time:0,count:0});
  const doc=await this.ctx.storage.get('document')||{revision:0,files:{html:'',css:'',javascript:''}};
  server.send(JSON.stringify({type:'snapshot',revision:doc.revision,files:doc.files,users:[...new Set([...users,user])].length}));
  this.broadcast({type:'presence',users:[...new Set([...users,user])].length},server);
  return new Response(null,{status:101,webSocket:client});
 }
 async webSocketMessage(ws,message){
  if(typeof message!=='string'||message.length>52000){ws.close(1009,'Payload too large');return}
  const meta=ws.deserializeAttachment()||{},now=Date.now();
  if(now-meta.time>1000){meta.time=now;meta.count=0}
  meta.count++;
  if(meta.count>12){ws.close(1008,'Too many edits');return}
  ws.serializeAttachment(meta);
  let item;try{item=JSON.parse(message)}catch{ws.send(JSON.stringify({type:'error',error:'Invalid JSON'}));return}
  if(item?.type==='ping'){ws.send(JSON.stringify({type:'pong'}));return}
  if(item?.type!=='edit'||!Number.isInteger(item.revision)||!validFiles(item.files)){
   ws.send(JSON.stringify({type:'error',error:'Invalid edit'}));return
  }
  // Serial processing inside one Durable Object ensures optimistic concurrency.
  await this.ctx.blockConcurrencyWhile(async()=>{
   const doc=await this.ctx.storage.get('document')||{revision:0,files:{html:'',css:'',javascript:''}};
   if(item.revision!==doc.revision){ws.send(JSON.stringify({type:'conflict',revision:doc.revision,files:doc.files}));return}
   const next={revision:doc.revision+1,files:{html:item.files.html,css:item.files.css,javascript:item.files.javascript}};
   await this.ctx.storage.put('document',next);
   this.broadcast({type:'update',revision:next.revision,files:next.files,by:meta.user});
  });
 }
 webSocketClose(ws){try{ws.close(1000,'Disconnected')}catch{}
  const connected=this.ctx.getWebSockets().filter(x=>x!==ws&&x.readyState===1);
  const users=new Set(connected.map(x=>x.deserializeAttachment()?.user).filter(Boolean));
  this.broadcast({type:'presence',users:users.size},ws)
 }
 webSocketError(ws){try{ws.close(1011,'Connection failure')}catch{}}
}
