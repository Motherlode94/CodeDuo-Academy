(()=>{'use strict';const $=id=>document.getElementById(id);
const storage = {
 getItem(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
 setItem(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } },
 removeItem(key) { try { window.localStorage.removeItem(key); } catch {} }
};const samples={javascript:"// Premier programme\nconst prenom = 'CodeDuo';\nlet points = 5;\nconsole.log('Bienvenue ' + prenom);\nconsole.log('Points :', points + 3);",html:"<h1>Bonjour CodeDuo !</h1>\n<p>Ma première page web.</p>\n<button onclick=\"document.querySelector('p').textContent='Bravo !'\">Clique ici</button>",csharp:"using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        Console.WriteLine(\"Bonjour CodeDuo !\");\n    }\n}"};let profile=storage.getItem('codeduo-demo-profile')||'';const code=$('editor'),lang=$('language'),pre=$('highlight'),highlight=$('highlightCode');const getLang=()=>lang.value==='html'?'markup':lang.value==='csharp'?'csharp':'javascript';function paint(){let src=code.value+'\n';const l=getLang();if(window.Prism?.languages?.[l])highlight.innerHTML=Prism.highlight(src,Prism.languages[l],l);else highlight.textContent=src}let draftTimer=null,editorVersion=0,activeEditorLanguage='javascript';
async function setLanguage(name){
 const version=++editorVersion;
 if(draftTimer){clearTimeout(draftTimer);draftTimer=null;await flushDraft(activeEditorLanguage,code.value)}
 activeEditorLanguage=name;lang.value=name;
 $('openCSharpCompiler').hidden=name!=='csharp';
 $('filelabel').textContent=name==='html'?'index.html':name==='csharp'?'Program.cs':'main.js';
 code.value=samples[name];paint();$('preview').hidden=true;$('output').hidden=false;
 $('output').textContent='Prêt à exécuter.';$('saveStatus').textContent='Chargement du brouillon…';
 try{const draft=await window.CodeDuoSync.draft(name);
  if(version!==editorVersion)return;
  code.value=draft??samples[name];paint();$('saveStatus').textContent=window.CodeDuoSync.isAuthenticated()?'Brouillon du compte étudiant':'Brouillon local sur cet appareil';
 }catch{if(version===editorVersion)$('saveStatus').textContent='Brouillon serveur inaccessible : exporte ton code pour le conserver.'}
}
async function flushDraft(language=activeEditorLanguage,source=code.value){
 try{await window.CodeDuoSync.saveDraft(language,source);
  if(language===activeEditorLanguage)$('saveStatus').textContent=window.CodeDuoSync.isAuthenticated()?'Enregistré dans ton compte':'Brouillon local enregistré';
 }catch{if(language===lang.value)$('saveStatus').textContent='Sauvegarde impossible : exporte ton code pour le conserver.'}
}
lang.onchange=()=>setLanguage(lang.value);
code.addEventListener('input',()=>{paint();$('saveStatus').textContent='Enregistrement…';
 if(draftTimer)clearTimeout(draftTimer);
 draftTimer=setTimeout(()=>{draftTimer=null;flushDraft()},850);
});code.addEventListener('scroll',()=>{pre.scrollTop=code.scrollTop;pre.scrollLeft=code.scrollLeft});code.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();code.setRangeText('    ',code.selectionStart,code.selectionEnd,'end');code.dispatchEvent(new Event('input'))}});$('clearOutput').onclick=()=>{$('output').textContent='';$('preview').srcdoc='';$('output').hidden=false;$('preview').hidden=true};
$('execute').onclick=async()=>{const language=lang.value;const source=code.value;if(language==='csharp'){
 $('preview').hidden=true;$('output').hidden=false;
 $('output').textContent='Compilation réelle avec Roslyn (.NET SDK)…';
 if(source.length>16000){$('output').textContent='Code trop volumineux : maximum 16 000 caractères.';return}
 try{
  const response=await fetch('/api/csharp/compile',{method:'POST',credentials:'same-origin',
   headers:{'content-type':'application/json'},body:JSON.stringify({code:source})});
  const result=await response.json();
  if(!response.ok){$('output').textContent=(result.error||'Compilateur indisponible')+
   (response.status===503?'\nLe service .NET doit être déployé et configuré.':'');return}
  const diagnostics=(result.diagnostics||[]).join('\n');
  $('output').textContent=(result.ok?'✓ Compilation C# réussie.':'✗ Compilation C# échouée.')+
    '\n'+(diagnostics||'Aucun diagnostic.')+
    '\nCompilation native .NET ; exécution du programme désactivée pour la sécurité.';
 }catch{$('output').textContent='Service .NET inaccessible. Le code reste enregistré dans ton compte.'}
 return
}if(language==='html'){$('output').hidden=true;$('preview').hidden=false;$('preview').srcdoc=source;return} $('preview').hidden=true;$('output').hidden=false;$('output').textContent='Exécution JavaScript isolée…';const iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.style.display='none';document.body.appendChild(iframe);let token='cd_'+Math.random().toString(36).slice(2),lines=[],done=false;const render=()=>{$('output').textContent=lines.join('\n')||'(Aucune sortie console)'};const onMessage=e=>{if(e.source!==iframe.contentWindow||e.data?.token!==token)return;if(e.data.type==='line'){lines.push(String(e.data.text));render()}if(e.data.type==='done'){done=true;cleanup()}};const cleanup=()=>{window.removeEventListener('message',onMessage);iframe.remove()};window.addEventListener('message',onMessage);const payload=JSON.stringify(source).replaceAll('<','\\u003c');iframe.srcdoc='<script>const token='+JSON.stringify(token)+';const send=(type,text)=>parent.postMessage({token,type,text},"*");console.log=(...a)=>send("line",a.map(String).join(" "));console.error=(...a)=>send("line","ERREUR: "+a.map(String).join(" "));window.onerror=(msg)=>send("line","ERREUR: "+msg);try{const fn=new Function('+payload+');const result=fn();if(result&&typeof result.then==="function")result.then(()=>send("done","")).catch(e=>{send("line",String(e));send("done","")});else send("done","")}catch(e){send("line",e.name+": "+e.message);send("done","")}</script>';setTimeout(()=>{if(!done){lines.push('Temps maximal atteint pour ce test.');render();cleanup()}},2000)};
$('openCSharpCompiler').onclick=async()=>{if(lang.value!=='csharp')return;const target='https://learn.microsoft.com/dotnet/csharp/';const tab=window.open(target,'_blank','noopener,noreferrer');try{await navigator.clipboard.writeText(code.value);$('saveStatus').textContent='Code C# copié : la compilation native se lance avec « Exécuter » après configuration du service.';}catch{$('saveStatus').textContent='Copie ton code manuellement si tu veux le conserver hors de l’atelier.';}if(!tab)$('output').textContent='La compilation native nécessite le service C# CodeDuo.';};
$('saveCode').onclick=()=>{const ext={javascript:'js',html:'html',csharp:'cs'}[lang.value];const blob=new Blob([code.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='codeduo-exercice.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
const modal=$('authModal');function openAuth(){modal.hidden=false;$('studentName').focus()}$('signup').onclick=()=>{location.href='./connexion.html?mode=register'};$('enter').onclick=()=>{location.href='./connexion.html'};$('closeAuth').onclick=()=>modal.hidden=true;modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});$('tryLab').onclick=()=>$('atelier').scrollIntoView({behavior:'smooth'});$('authForm').onsubmit=e=>{e.preventDefault();profile=$('studentName').value.trim();if(profile.length<2)return;storage.setItem('codeduo-demo-profile',profile);modal.hidden=true;openStudent()};function openStudent(){updateProgress();$('student').hidden=false;$('welcomeName').textContent=profile;document.body.style.overflow='hidden'}function closeStudent(){$('student').hidden=true;document.body.style.overflow=''}$('exitStudent').onclick=closeStudent;$('logout').onclick=()=>{closeStudent();profile='';storage.removeItem('codeduo-demo-profile');openAuth()};
const lessons = [
 {title:'01 / Les variables', instruction:'Crée une variable age égale à 18, puis affiche sa valeur avec console.log(age).', hint:'Une variable se déclare avec let. Exemple : let points = 5;'},
 {title:'02 / Les fonctions', instruction:'Crée une fonction double(n) qui retourne n * 2, puis affiche double(7). Le résultat attendu est 14.', hint:'Une fonction peut renvoyer un résultat avec return.'},
 {title:'03 / Les conditions', instruction:'Déclare age, puis utilise if / else pour afficher « majeur » si age vaut au moins 18, sinon « mineur ». Essaie avec 16 puis 20.', hint:'La comparaison age >= 18 vérifie si l’âge est supérieur ou égal à 18.'}
];
let activeLesson = null;
function completedLessons() {
 try {
  const value = JSON.parse(storage.getItem('codeduo-completed') || '[]');
  return Array.isArray(value) ? [...new Set(value.filter(n => Number.isInteger(n) && n >= 0 && n < lessons.length))] : [];
 } catch { return []; }
}
function updateProgress() {
 const completed = completedLessons();
 $('lessonProgress').value = completed.length;
 $('progressText').textContent = completed.length + ' / 3 exercices marqués comme terminés sur cet appareil.';
 document.querySelectorAll('[data-lesson]').forEach(btn => {
  btn.textContent = completed.includes(Number(btn.dataset.lesson)) ? '✓ Revoir l’exercice' : 'Ouvrir l’exercice';
 });
}
document.querySelectorAll('[data-lesson]').forEach(btn => btn.onclick = () => {
 activeLesson = Number(btn.dataset.lesson);
 const lesson = lessons[activeLesson];
 closeStudent();
 setLanguage('javascript');
 $('lessonPanel').hidden = false;
 $('lessonTitle').textContent = lesson.title;
 $('lessonInstruction').textContent = lesson.instruction;
 $('lessonHint').textContent = lesson.hint;
 $('lessonStatus').textContent = completedLessons().includes(activeLesson) ? 'Tu as déjà marqué cet exercice comme terminé.' : 'Teste ton code, puis explique le résultat à ton binôme.';
 $('atelier').scrollIntoView({behavior:'smooth'});
 code.focus({preventScroll:true});
});
$('completeLesson').onclick = () => {
 if (activeLesson === null) return;
 const completed = completedLessons();
 if (!completed.includes(activeLesson)) completed.push(activeLesson);
 const saved = storage.setItem('codeduo-completed', JSON.stringify(completed));
 $('lessonStatus').textContent = saved ? '✓ Exercice marqué comme terminé. Bravo pour ta progression !' : 'Progression non enregistrée : le stockage du navigateur est indisponible.';
 updateProgress();
};
code.addEventListener('keydown', e => {
 if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('execute').click(); }
});
let authTrigger;
const originalOpenAuth = openAuth;
openAuth = function() { authTrigger = document.activeElement; originalOpenAuth(); };
function closeAuth() { modal.hidden = true; authTrigger?.focus(); }
$('closeAuth').onclick = closeAuth;
modal.addEventListener('keydown', e => {
 if (e.key !== 'Tab') return;
 const fields = [...modal.querySelectorAll('button,input')];
 const first = fields[0], last = fields[fields.length - 1];
 if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
 else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('pointermove',e=>{const g=$('pointerGlow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'},{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!modal.hidden)closeAuth();if(!$('student').hidden){closeStudent();$('enter').focus()}}});setLanguage('javascript')})();