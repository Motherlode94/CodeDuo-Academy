/* Deterministic formative checks, executed in the sandbox document, not a secure exam. */
(function(root){
 'use strict';
 async function run(doc,exercise){
  const results=[];
  const add=(name,pass,hint)=>results.push({name,pass:!!pass,hint});
  const visibleText=(selector)=>doc.querySelector(selector)?.textContent?.trim()||'';
  if(exercise==='introduction'){
   add('Un titre <h1>',!!visibleText('h1'),'Ajoute un <h1> dans index.html.');
   add('Un paragraphe explicatif',!!visibleText('p'),'Ajoute un paragraphe <p> descriptif.');
   add('Le style est appliqué',!!doc.querySelector('style[data-code-duo]')?.textContent?.trim(),'Ajoute des règles dans style.css.');
  } else if(exercise==='interaction'){
   const button=doc.querySelector('#action'),status=doc.querySelector('#status');
   add('Bouton avec id="action"',!!button,'Ajoute <button id="action">…</button>.');
   add('Zone de retour id="status"',!!status,'Ajoute un élément id="status".');
   if(button&&status){const before=status.textContent;try{button.click()}catch{}
    await new Promise(resolve=>setTimeout(resolve,80));
    add('Cliquer change le message',status.textContent!==before&&!!status.textContent.trim(),'Ajoute un addEventListener("click") dans main.js et change #status.')}
  } else if(exercise==='compteur'){
   const button=doc.querySelector('#increment'),target=doc.querySelector('#count');
   add('Bouton id="increment"',!!button,'Crée un bouton avec id="increment".');
   add('Compteur id="count"',!!target,'Crée un élément avec id="count".');
   if(button&&target){const before=Number(target.textContent);try{button.click();button.click()}catch{}
    await new Promise(resolve=>setTimeout(resolve,80));
    add('Deux clics ajoutent 2',Number.isFinite(before)&&Number(target.textContent)===before+2,'Attache le clic au bouton et incrémente le compteur de 1.')}
  } else {add('Exercice connu',false,'Choisis un exercice dans la liste.')}
  return results;
 }
 root.CodeDuoProjectChecks={run};
})(typeof window!=='undefined'?window:globalThis);
