import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const base=(process.env.CODEDUO_E2E_URL||'https://codeduo-academy.pages.dev').replace(/\/$/,'');
const credentials=[
 {username:process.env.CODEDUO_E2E_USER_A,password:process.env.CODEDUO_E2E_PASSWORD_A},
 {username:process.env.CODEDUO_E2E_USER_B,password:process.env.CODEDUO_E2E_PASSWORD_B}
];
if(credentials.some(c=>!c.username||!c.password)||credentials[0].username===credentials[1].username){
 console.error('SKIPPED: provide two distinct pre-authorized student test accounts via environment secrets.');
 process.exit(2);
}
const browser=await chromium.launch({headless:true});
const pages=[],contexts=[];
const errors=[];
const marker='CodeDuo E2E '+Date.now().toString(36);
const log=(step)=>console.log('PASS '+step);
async function api(context,method,path,body){
 const response=await context.request.fetch(base+path,{method,data:body,headers:body?{'content-type':'application/json'}:undefined});
 const json=await response.json().catch(()=>({}));
 assert.ok(response.ok(),path+' HTTP '+response.status()+': '+json.error);
 return json;
}
async function waitForCode(page,file,expected,timeout=12000){
 await page.locator('[data-file="'+file+'"]').click();
 await page.waitForFunction(({value})=>document.querySelector('#projectEditor')?.value.includes(value),{value:expected},{timeout});
}
async function updateFile(page,file,value){
 await page.locator('[data-file="'+file+'"]').click();
 await page.locator('#projectEditor').fill(value);
}
async function waitConnected(page,label){
 await page.locator('#pairDisconnect').waitFor({state:'visible',timeout:20000});
 await page.locator('#pairStatus').waitFor({state:'visible'});
 console.log('PASS WebSocket connected for '+label);
}
try{
 for(let i=0;i<2;i++){
  const ctx=await browser.newContext();
  contexts.push(ctx);
  const login=await api(ctx,'POST','/api/login',credentials[i]);
  assert.equal(login.user?.username,credentials[i].username.toLowerCase());
  const page=await ctx.newPage();pages.push(page);
  page.on('pageerror',error=>errors.push('Browser '+(i+1)+': '+error.message));
  await page.goto(base+'/atelier-projet.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pairCreate').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('#pairCreate')?.disabled,{timeout:15000});
 }
 log('two separate authenticated Chromium contexts');
 const [a,b]=pages;
 await a.locator('#pairCreate').click();
 await a.waitForFunction(()=>/^[a-f0-9]{32}$/.test(document.querySelector('#pairInvite')?.value||''),{timeout:15000});
 const invite=await a.locator('#pairInvite').inputValue();
 assert.match(invite,/^[a-f0-9]{32}$/);
 await waitConnected(a,'A');
 log('private room creation and invite');
 await b.locator('#pairInvite').fill(invite);
 await b.locator('#pairJoin').click();
 await waitConnected(b,'B');
 log('student B joined room from independent browser');
 // Initial room snapshot may require an explicit acceptance; this is intentional
 // so one student's existing code cannot be silently overwritten.
 if(await b.locator('#pairTakeRemote').isVisible()){
  b.once('dialog',dialog=>dialog.accept());
  await b.locator('#pairTakeRemote').click();
 }
 await updateFile(a,'html','<h1>'+marker+' from A</h1>');
 await b.waitForFunction(({marker})=>
  document.querySelector('#pairTakeRemote')?.hidden===false||
  window.CodeDuoPairBridge?.getFiles()?.html.includes(marker),
  {marker},{timeout:17000});
 if(await b.locator('#pairTakeRemote').isVisible()){
  b.once('dialog',dialog=>dialog.accept());
  await b.locator('#pairTakeRemote').click();
 }
 await waitForCode(b,'html',marker+' from A');
 log('A → B HTML sync');
 // Wait until the last edited files have been persisted before sending the other direction.
 await b.waitForTimeout(1300);
 await updateFile(b,'css','body { color: rgb(28, 65, 97) } /* '+marker+' B */');
 await a.waitForFunction(({marker})=>
  document.querySelector('#pairTakeRemote')?.hidden===false||
  window.CodeDuoPairBridge?.getFiles()?.css.includes(marker),
  {marker},{timeout:17000});
 if(await a.locator('#pairTakeRemote').isVisible()){
  a.once('dialog',dialog=>dialog.accept());
  await a.locator('#pairTakeRemote').click();
 }
 await waitForCode(a,'css',marker+' B');
 log('B → A CSS sync');
 await b.locator('#pairDisconnect').click();
 await b.locator('#pairDisconnect').waitFor({state:'hidden'});
 await b.locator('#pairInvite').fill(invite);
 await b.locator('#pairJoin').click();
 await waitConnected(b,'B reconnected');
 log('reconnection succeeds');
 const third=await browser.newContext();contexts.push(third);
 const outsider=await third.request.get(base+'/api/pair/room');
 assert.equal(outsider.status(),401,'anonymous room access must be rejected');
 log('unauthenticated API denied');
 assert.deepEqual(errors,[],'browser script exceptions');
 console.log('PASS production two-browser collaboration test complete.');
}finally{
 for(const ctx of contexts)await ctx.close().catch(()=>{});
 await browser.close();
}
