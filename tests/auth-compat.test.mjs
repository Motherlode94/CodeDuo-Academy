import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pbkdf2Sync} from 'node:crypto';
import {readFileSync} from 'node:fs';

test('Workers PBKDF2 parameters remain compatible with persisted credentials', () => {
 const api=readFileSync(new URL('../functions/api/[[path]].js',import.meta.url),'utf8');
 assert.match(api,/name:'PBKDF2',hash:'SHA-256',salt:enc\.encode\(salt\),iterations:100000/);
 assert.match(api,/const hash=await derive\(password,u\?\.salt/);
 assert.match(api,/hash!==u\.password_hash/);
});
test('PBKDF2 uses the UTF-8 salt string, not UUID bytes',()=>{
 const salt='37e33b9e-c6ae-442c-9b9c-1876b48e0ae1';
 const result=pbkdf2Sync('sample-password-123',Buffer.from(salt,'utf8'),100000,32,'sha256').toString('hex');
 assert.equal(result.length,64);
 assert.equal(result,pbkdf2Sync('sample-password-123',salt,100000,32,'sha256').toString('hex'));
});
