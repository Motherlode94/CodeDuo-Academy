/* Shared account-aware progress/drafts; anonymous data stays local and is never merged silently. */
(function(root){
 'use strict';
 let actor=null,ready=null;
 const storage={
  get(k){try{return localStorage.getItem(k)}catch{return null}},
  set(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
 };
 async function call(path,method='GET',body){
  const r=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',
   ...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error('HTTP '+r.status);
  return r.json();
 }
 function init(){return ready||=call('me').then(data=>{actor=data.user||null;return actor}).catch(()=>{actor=null;return null})}
 function normalize(ids,max){return [...new Set((Array.isArray(ids)?ids:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=max))]}
 async function completed(track){
  await init();const limit=track==='mao'?12:14;
  if(!actor){let ids=[];try{ids=JSON.parse(storage.get(track==='mao'?'codeduo-mao-progress':'codeduo-learning-completed')||'[]')}catch{}return normalize(ids,limit)}
  const data=await call('progress');return normalize((data.completed||[]).filter(x=>x.track===track).map(x=>x.lesson_id),limit);
 }
 async function complete(track,lessonId){
  await init();if(actor)return call('progress','PUT',{track,lessonId,completed:true});
  const key=track==='mao'?'codeduo-mao-progress':'codeduo-learning-completed';
  let ids=[];try{ids=JSON.parse(storage.get(key)||'[]')}catch{}
  storage.set(key,JSON.stringify(normalize([...ids,lessonId],track==='mao'?12:14)));
  return {ok:true,local:true};
 }
 async function draft(language){
  await init();if(actor){const data=await call('drafts');return (data.drafts||[]).find(x=>x.language===language)?.source??null}
  return storage.get('codeduo-code-'+language);
 }
 async function saveDraft(language,source){
  await init();if(actor)return call('drafts','PUT',{language,source});
  storage.set('codeduo-code-'+language,source);return {ok:true,local:true};
 }
 root.CodeDuoSync={init,completed,complete,draft,saveDraft,isAuthenticated:()=>!!actor,currentUser:()=>actor};
})(window);
