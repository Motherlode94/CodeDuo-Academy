(()=>{'use strict';
const $=id=>document.getElementById(id),editor=$('projectEditor'),preview=$('projectPreview'),output=$('projectConsole'),status=$('projectStatus'),tests=$('projectTests');
const examples={
 introduction:{html:'<h1>Bienvenue</h1><p>Ma première page Web.</p>',css:'body { font-family: sans-serif; padding: 24px; color: #213f5a; }',javascript:'console.log("Bonjour CodeDuo !")'},
 interaction:{html:'<h1>Interaction</h1><button id="action">Clique</button><p id="status">En attente</p>',css:'button { padding: 12px; }',javascript:'document.querySelector("#action").addEventListener("click", () => { document.querySelector("#status").textContent = "Bravo !"; });'},
 compteur:{html:'<h1>Compteur</h1><p id="count">0</p><button id="increment">Ajouter</button>',css:'#count { font-size: 3rem; }',javascript:'let count=0;document.querySelector("#increment").addEventListener("click",()=>{count++;document.querySelector("#count").textContent=String(count)});'}
};
let files={...examples.introduction},selected='html',loaded=false,dirty=false,timer=0,version=0,checkText=null;
const valid=v=>v&&['html','css','javascript'].every(k=>typeof v[k]==='string'&&v[k].length<=16000);
const escapeScript=value=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
function guest(){try{const o=JSON.parse(localStorage.getItem('codeduo-web-project')||'null');return valid(o)?o:null}catch{return null}}
function request(method='GET',payload){
 return fetch('/api/project',{method,credentials:'same-origin',cache:'no-store',
  ...(payload?{headers:{'content-type':'application/json'},body:JSON.stringify(payload)}:{})}).then(async r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()});
}
function currentFiles(){files[selected]=editor.value;return {html:files.html,css:files.css,javascript:files.javascript}}
function showFile(file){currentFiles();selected=file;editor.value=files[file];$('editorLabel').textContent={html:'index.html',css:'style.css',javascript:'main.js'}[file];
 document.querySelectorAll('[data-file]').forEach(b=>{const active=b.dataset.file===file;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1})}
async function load(){
 try{const user=await CodeDuoSync.init(),project=user?(await request()).project:guest();
  if(valid(project))files={html:project.html,css:project.css,javascript:project.javascript};
  status.textContent=user?'Projet associé à ton compte étudiant.':'Projet invité, enregistré dans ce navigateur.';
 }catch{status.textContent='Sauvegarde inaccessible : exporte tes fichiers pour les conserver.'}
 loaded=true;editor.value=files[selected];
}
async function save(){
 if(!loaded)return;const project=currentFiles();if(!valid(project)){status.textContent='Chaque fichier est limité à 16 000 caractères.';return}
 try{const user=await CodeDuoSync.init();if(user)await request('PUT',project);else localStorage.setItem('codeduo-web-project',JSON.stringify(project));
  dirty=false;status.textContent=user?'✓ Projet sauvegardé sur ton compte':'✓ Projet sauvegardé localement';
 }catch{status.textContent='Sauvegarde impossible : exporte les fichiers pour éviter toute perte.'}
}
function schedule(){dirty=true;status.textContent='Modifications en attente…';clearTimeout(timer);timer=setTimeout(save,1000)}
function exportFiles(){
 currentFiles();for(const [key,name] of [['html','index.html'],['css','style.css'],['javascript','main.js']]){
  const url=URL.createObjectURL(new Blob([files[key]],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),9000)
 }status.textContent='Export demandé : autorise plusieurs téléchargements dans ton navigateur.';
}
async function run(){
 const id=++version,project=currentFiles(),exercise=$('exercise').value;
 output.textContent='Exécution du projet…';tests.replaceChildren();
 if(!valid(project)){output.textContent='Fichier trop volumineux.';return}
 try{if(checkText===null){const r=await fetch('./js/project-checks.js');if(!r.ok)throw Error('Tests indisponibles');checkText=await r.text()}}
 catch(error){output.textContent=error.message;return}
 if(id!==version)return;
 const token=Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
 // No access to first-party cookies/storage, no external network. These are formative tests, not secured examinations.
 const runtime=[
 '(async()=>{',
 'const token='+escapeScript(token)+';',
 'const send=(type,payload)=>parent.postMessage({codeduo:true,token,type,payload},"*");',
 'console.log=(...args)=>send("console",args.map(String).join(" "));',
 'console.error=(...args)=>send("console","ERREUR : "+args.map(String).join(" "));',
 'window.addEventListener("error",e=>send("console","Erreur : "+e.message));',
 'try {',
 'const source='+escapeScript(project)+';',
 'const parsed=new DOMParser().parseFromString(source.html,"text/html");',
 'document.getElementById("student-root").replaceChildren(...Array.from(parsed.body.childNodes).map(n=>document.importNode(n,true)));',
 'const style=document.createElement("style");style.setAttribute("data-code-duo","");style.textContent=source.css;document.head.appendChild(style);',
 'new Function(source.javascript)();',
 'await new Promise(r=>setTimeout(r,130));',
 'new Function('+escapeScript(checkText)+')();',
 'const results=await window.CodeDuoProjectChecks.run(document,'+escapeScript(exercise)+');',
 'send("tests",results);',
 '}catch(error){send("console",error.name+": "+error.message);send("tests",[])}',
 '})();'
 ].join('\n');
 const csp="default-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; form-action 'none'; base-uri 'none'";
 const srcdoc='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+csp+'"></head><body><div id="student-root"></div><script>'+runtime.replaceAll('</script','<\\/script')+'</script></body></html>';
 const handler=event=>{
  if(id!==version||event.source!==preview.contentWindow||event.data?.codeduo!==true||event.data.token!==token)return;
  if(event.data.type==='console'){const line=String(event.data.payload).slice(0,1500);output.textContent=(output.textContent==='Exécution du projet…'?'':output.textContent+'\n')+line}
  if(event.data.type==='tests'){
   const results=Array.isArray(event.data.payload)?event.data.payload:[];
   tests.replaceChildren();const title=document.createElement('strong');
   title.textContent=results.filter(v=>v.pass).length+' / '+results.length+' vérifications réussies';tests.append(title);
   for(const result of results){const row=document.createElement('p');row.className=result.pass?'passed':'failed';
    row.textContent=(result.pass?'✓ ':'✗ ')+result.name+(result.pass?'':' — '+result.hint);tests.append(row)}
   window.removeEventListener('message',handler);
  }
 };
 window.addEventListener('message',handler);preview.srcdoc=srcdoc;
 setTimeout(()=>window.removeEventListener('message',handler),4000);
}
document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>showFile(b.dataset.file));
editor.oninput=schedule;
editor.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');schedule()}};
$('saveProject').onclick=save;$('runProject').onclick=run;$('exportProject').onclick=exportFiles;
$('loadExample').onclick=()=>{if(!confirm('Remplacer les trois fichiers par cet exemple ?'))return;files={...examples[$('exercise').value]};editor.value=files[selected];schedule()};
$('exercise').onchange=()=>{tests.replaceChildren();output.textContent='Choisis un modèle ou adapte ton projet à cet exercice.'};
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();save()}});
window.addEventListener('pagehide',()=>{if(dirty&&!CodeDuoSync.isAuthenticated()){try{localStorage.setItem('codeduo-web-project',JSON.stringify(currentFiles()))}catch{}}});
load();
})();