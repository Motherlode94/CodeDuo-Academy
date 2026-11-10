(()=>{'use strict';
const $=id=>document.getElementById(id),message=text=>$('pairStatus').textContent=text;
let socket=null,room=null,revision=0,pending=false,queued=false,timer=null,remote=null,manualClose=false;
const bridge=()=>window.CodeDuoPairBridge;
async function request(path,method='GET',body){
 const r=await fetch('/api/pair/'+path,{method,credentials:'same-origin',cache:'no-store',
  ...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'Erreur HTTP '+r.status);
 return data;
}
function close(){
 manualClose=true;clearTimeout(timer);pending=false;queued=false;
 if(socket){socket.close(1000,'Quitter le salon');socket=null}
 $('pairDisconnect').hidden=true;message('Déconnecté du salon. Les fichiers locaux restent disponibles.');
}
function offerRemote(files){
 remote=files;$('pairTakeRemote').hidden=false;
 message('Conflit : une version existe dans le salon. Ton code local est conservé. Choisis « Charger la version du salon » pour la remplacer.');
}
function schedule(){
 clearTimeout(timer);timer=setTimeout(flush,450);
}
function flush(){
 if(!queued||pending||socket?.readyState!==WebSocket.OPEN)return;
 const files=bridge()?.getFiles();if(!files)return;
 pending=true;queued=false;
 socket.send(JSON.stringify({type:'edit',revision,files}));
 message('Synchronisation en cours…');
}
function connect(roomId){
 close();manualClose=false;room=roomId;revision=0;remote=null;
 $('pairTakeRemote').hidden=true;
 const protocol=location.protocol==='https:'?'wss:':'ws:';
 const endpoint=protocol+'//'+location.host+'/api/pair/socket?room='+encodeURIComponent(roomId);
 socket=new WebSocket(endpoint);
 socket.onopen=()=>{message('Connecté au salon : synchronisation initiale…');$('pairDisconnect').hidden=false};
 socket.onmessage=event=>{
  let data;try{data=JSON.parse(event.data)}catch{return}
  if(data.type==='snapshot'){
   revision=data.revision;
   message('Salon connecté · '+data.users+' étudiant(s). Révision '+revision+'.');
   if(revision===0&&!Object.values(data.files||{}).some(v=>v)){queued=true;schedule()}
   else if(data.files)offerRemote(data.files);
  }
  if(data.type==='presence'){message('Salon actif · '+data.users+' étudiant(s) en ligne.')}
  if(data.type==='update'){
   revision=data.revision;
   if(data.by===CodeDuoSync.currentUser()?.id){
    pending=false;
    message('✓ Révision '+revision+' synchronisée.');
    if(queued)schedule();
   }else if(queued||pending||bridge()?.isDirty()){
    pending=false;queued=false;offerRemote(data.files);
   }else{
    bridge()?.applyFiles(data.files);
    message('✓ Fichiers actualisés par ton binôme (révision '+revision+').');
   }
  }
  if(data.type==='conflict'){revision=data.revision;pending=false;queued=false;offerRemote(data.files)}
  if(data.type==='error'){pending=false;message('Erreur de synchronisation : '+data.error)}
 };
 socket.onclose=event=>{socket=null;pending=false;$('pairDisconnect').hidden=true;
  if(!manualClose)message('Connexion au salon interrompue (code '+event.code+'). Tes modifications locales sont conservées.')};
 socket.onerror=()=>message('Échec de la connexion au binôme. Vérifie la configuration du Worker Cloudflare.');
}
window.addEventListener('codeduo-local-edit',()=>{
 if(!socket||socket.readyState!==WebSocket.OPEN)return;
 queued=true;schedule()
});
$('pairCreate').onclick=async()=>{
 try{message('Création du salon…');const result=await request('create','POST');
  $('pairCode').textContent='Code privé à partager avec ton partenaire : '+result.invite;
  $('pairInvite').value=result.invite;
  connect(result.room);
 }catch(error){message(error.message)}
};
$('pairJoin').onclick=async()=>{
 try{
  const invite=$('pairInvite').value.trim().toLowerCase();
  if(!/^[a-f0-9]{32}$/.test(invite)){message('Un code d’invitation de 32 caractères est nécessaire.');return}
  message('Vérification de l’invitation…');const result=await request('join','POST',{invite});
  $('pairCode').textContent='Tu as rejoint le salon · partage uniquement avec ton partenaire.';
  connect(result.room);
 }catch(error){message(error.message)}
};
$('pairDisconnect').onclick=close;
$('pairTakeRemote').onclick=()=>{
 if(!remote)return;
 if(!confirm('Remplacer tes trois fichiers locaux par ceux du salon ? Pense à exporter ton travail avant.'))return;
 bridge()?.applyFiles(remote);remote=null;$('pairTakeRemote').hidden=true;
 message('Version du salon chargée : tu peux modifier les fichiers ensemble.');
};
window.addEventListener('pagehide',()=>{manualClose=true;socket?.close()});
CodeDuoSync.init().then(user=>{
 if(!user){$('pairCreate').disabled=true;$('pairJoin').disabled=true;message('Connecte-toi pour créer ou rejoindre un binôme.');return}
 return request('room').then(data=>{if(data.rooms?.length)message('Tu as '+data.rooms.length+' salon(s) actif(s). Utilise une invitation pour rejoindre un binôme.');else message('Crée un salon et partage son code privé avec un second étudiant.')});
}).catch(()=>message('Service binôme indisponible.'));
})();