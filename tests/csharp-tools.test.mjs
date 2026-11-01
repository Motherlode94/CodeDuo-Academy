import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const js=readFileSync(new URL('../js/csharp-tools.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(js,context);
const analyze=context.CodeDuoCSharp.analyze;

test('balanced console program has no structural errors',()=>{
 const result=analyze('using System; class Program { static void Main(){ Console.WriteLine("OK"); } }');
 assert.equal(result.filter(x=>x.severity==='error').length,0);
});
test('unmatched brace reports line',()=>{
 const result=analyze('class Program {\n  void Main() {\n}');
 assert.ok(result.some(x=>x.severity==='error'&&x.line===1));
});
test('ignores braces in strings and comments',()=>{
 const result=analyze('class A { string s = "}"; // {\n}');
 assert.equal(result.filter(x=>x.severity==='error').length,0);
});
test('Unity scripts explain separate runtime dependency',()=>{
 assert.ok(analyze('using UnityEngine; class A:MonoBehaviour {}').some(x=>x.message.includes('Unity')));
});
