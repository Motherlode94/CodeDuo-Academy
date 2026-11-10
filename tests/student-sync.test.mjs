import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../js/student-sync.js',import.meta.url),'utf8');
function start(user,backendOnline=true){
 const requests=[],store=new Map([
  ['codeduo-learning-completed','[1,2,3]'],
  ['codeduo-code-javascript','console.log("ancien invité")']
 ]);
 const state={
  progress:[{track:'code',lesson_id:9}],drafts:[{language:'javascript',source:'console.log("compte")'}]
 };
 const context={window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  fetch:async(uri,options)=>{
   requests.push({uri,options});
   if(!backendOnline)throw Error('Network unavailable');
   const name=uri.split('/').at(-1);
   const payload=name==='me'?{user}:name==='progress'?{completed:state.progress}:{drafts:state.drafts};
   if(options.method==='PUT'){
    const item=JSON.parse(options.body);
    if(name==='drafts')state.drafts=[{language:item.language,source:item.source}];
    if(name==='progress')state.progress.push({track:item.track,lesson_id:item.lessonId});
   }
   return {ok:true,json:async()=>payload}
  }
 };
 vm.runInNewContext(code,context,{filename:'student-sync.js'});
 return {api:context.window.CodeDuoSync,store,requests,state};
}
test('authenticated students never inherit shared guest progress or drafts',async()=>{
 const {api,requests}=start({id:'alice',username:'alice',role:'student'});
 assert.deepEqual(Array.from(await api.completed('code')),[9]);
 assert.equal(await api.draft('javascript'),'console.log("compte")');
 await api.complete('code',10);
 await api.saveDraft('javascript','console.log("nouveau")');
 assert.equal(requests.some(x=>x.uri.endsWith('/progress')&&x.options.method==='PUT'),true);
 assert.equal(requests.some(x=>x.uri.endsWith('/drafts')&&x.options.method==='PUT'),true);
 assert.equal(api.isAuthenticated(),true);
});
test('anonymous guests can continue local drafts without creating an account',async()=>{
 const {api,store}=start(null);
 assert.deepEqual(Array.from(await api.completed('code')),[1,2,3]);
 assert.equal(await api.draft('javascript'),'console.log("ancien invité")');
 await api.complete('code',4);
 await api.saveDraft('javascript','code invité');
 assert.deepEqual(JSON.parse(store.get('codeduo-learning-completed')),[1,2,3,4]);
 assert.equal(store.get('codeduo-code-javascript'),'code invité');
});
test('network/auth service failure never exposes local data as signed-in user data',async()=>{
 const {api}=start({id:'alice'},false);
 await assert.rejects(()=>api.completed('code'),/Network unavailable/);
 await assert.rejects(()=>api.draft('javascript'),/Network unavailable/);
});
