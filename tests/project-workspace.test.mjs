import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {onRequest} from '../functions/api/[[path]].js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('workspace scripts parse, page exposes three real editable files',()=>{
 const js=read('js/project-workspace.js'),checks=read('js/project-checks.js'),html=read('atelier-projet.html');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.doesNotThrow(()=>new vm.Script(checks));
 for(const id of ['projectEditor','projectPreview','projectTests','projectConsole','runProject','saveProject','exportProject'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const file of ['html','css','javascript'])assert.ok(html.includes('data-file="'+file+'"'));
 assert.match(html,/sandbox="allow-scripts"/);assert.match(js,/default-src 'none'/);assert.match(js,/connect-src 'none'/);
});
test('DOM exercise checks evaluate real click outcomes, not source keywords',async()=>{
 const context={window:{},setTimeout};vm.runInNewContext(read('js/project-checks.js'),context);
 const run=context.window.CodeDuoProjectChecks.run;
 const nodes={'h1':{textContent:'My title'},'p':{textContent:'Some paragraph'},'style[data-code-duo]':{textContent:'h1 { color: blue }'}};
 const doc={querySelector:q=>nodes[q]||null};
 let result=await run(doc,'introduction');assert.equal(result.length,3);assert.ok(result.every(r=>r.pass));
 const status={textContent:'Waiting'},button={click(){status.textContent='Done'}};
 const inter={querySelector:q=>q==='#action'?button:q==='#status'?status:null};
 result=await run(inter,'interaction');assert.equal(result.filter(r=>r.pass).length,3);
 const count={textContent:'0'},increment={click(){count.textContent=String(Number(count.textContent)+1)}};
 result=await run({querySelector:q=>q==='#increment'?increment:q==='#count'?count:null},'compteur');
 assert.ok(result.every(r=>r.pass));assert.equal(count.textContent,'2');
 result=await run({querySelector:()=>null},'compteur');assert.equal(result.filter(r=>r.pass).length,0);
});
const token='d'.repeat(64),tokenHash=createHash('sha256').update(token).digest('hex');
function database(){
 const sessions=new Map([[tokenHash,{id:'student-a',username:'a',role:'student'}]]);
 const projects=new Map();
 return {sessions,projects,prepare(sql){let params=[];return {bind(...p){params=p;return this},async first(){
  if(sql.includes('FROM sessions JOIN users'))return sessions.get(params[0])||null;
  if(sql.includes('FROM student_projects'))return projects.get(params[0]+':'+params[1])||null;
  return null;
 },async run(){
  if(sql.startsWith('INSERT INTO student_projects')){const [user_id,project_id,html,css,javascript,updated_at]=params;projects.set(user_id+':'+project_id,{html,css,javascript,updated_at})}
  return {success:true};
 }}}};
}
function request(db,method='GET',payload,authed=true){
 return onRequest({request:new Request('https://codeduo.test/api/project',{
  method,headers:{...(authed?{cookie:'cd_session='+token}:{}),...(method==='PUT'?{'content-type':'application/json',origin:'https://codeduo.test'}:{})},
  ...(payload===undefined?{}:{body:JSON.stringify(payload)})
 }),env:{DB:db}});
}
test('projects require authentication, validate payloads and isolate student accounts',async()=>{
 const db=database(),payload={html:'<h1>Hi</h1>',css:'h1 {color:blue}',javascript:'console.log(1)'};
 assert.equal((await request(db,'GET',undefined,false)).status,401);
 assert.equal((await request(db,'PUT',payload,false)).status,401);
 assert.equal((await request(db,'PUT',{...payload,html:'X'.repeat(16001)})).status,400);
 assert.equal((await request(db,'PUT',{...payload,css:null})).status,400);
 assert.equal((await request(db,'PUT',payload)).status,200);
 assert.equal((await(await request(db)).json()).project.html,payload.html);
 db.sessions.set(tokenHash,{id:'student-b',username:'b',role:'student'});
 assert.equal((await(await request(db)).json()).project,null);
 assert.equal((await request(db,'PUT',{...payload,html:'<h2>Student B</h2>'})).status,200);
 assert.equal(db.projects.size,2);
 assert.equal(db.projects.get('student-a:web-starter').html,payload.html);
});
test('project storage migration retains tenant boundary',()=>{
 const sql=read('migrations/0003_student_projects.sql');
 assert.match(sql,/PRIMARY KEY\(user_id, project_id\)/);
 assert.match(sql,/FOREIGN KEY\(user_id\) REFERENCES users\(id\)/);
});
