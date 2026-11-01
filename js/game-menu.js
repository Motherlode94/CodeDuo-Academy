(()=>{'use strict';
const cards=[...document.querySelectorAll('[data-quest]')],title=document.getElementById('questDetailTitle'),desc=document.getElementById('questDetailText'),launch=document.getElementById('questLaunch'),progress=document.getElementById('questProgress'),count=document.getElementById('questCount');
if(!cards.length)return;
const quests=[
 {name:'Départ : apprendre',description:'Explorer les 14 chapitres d’informatique et de programmation.',url:'./cours.html'},
 {name:'Terrain d’entraînement',description:'Ouvrir le laboratoire, écrire et tester du JavaScript ou du HTML ; diagnostiquer les erreurs C#.',url:'#atelier'},
 {name:'Missions en duo',description:'Découvrir les six défis guidés et construire un projet.',url:'./projets.html'}
];
const storageKey='codeduo-quest-visits-v1';
let seen=[];try{const value=JSON.parse(localStorage.getItem(storageKey)||'[]');seen=Array.isArray(value)?value.filter(n=>Number.isInteger(n)&&n>=0&&n<quests.length):[]}catch{}
let selected=0;
function render(){cards.forEach((c,i)=>{c.setAttribute('aria-pressed',String(i===selected));c.querySelector('.quest-progress-tag').textContent=seen.includes(i)?'✓ VISITÉ':'À DÉCOUVRIR'});title.textContent=quests[selected].name;desc.textContent=quests[selected].description;progress.value=seen.length;count.textContent=seen.length+' / '+quests.length;}
function select(i){selected=(i+quests.length)%quests.length;render();cards[selected].focus();}
cards.forEach((c,i)=>{c.addEventListener('click',()=>{selected=i;render()});c.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();select(i+1)}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();select(i-1)}else if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();launch.click()}})});
launch.addEventListener('click',()=>{if(!seen.includes(selected)){seen.push(selected);try{localStorage.setItem(storageKey,JSON.stringify(seen))}catch{}}render();const target=quests[selected].url;if(target==='#atelier'){document.getElementById('atelier')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.getElementById('editor')?.focus({preventScroll:true})}else location.href=target});
render();
})();