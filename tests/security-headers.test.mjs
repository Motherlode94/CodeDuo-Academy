import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const api=readFileSync(new URL('../functions/api/[[path]].js',import.meta.url),'utf8');
const headers=readFileSync(new URL('../_headers',import.meta.url),'utf8');

test('Pages responses have baseline browser protections',()=>{
 for(const name of ['X-Content-Type-Options','Referrer-Policy','X-Frame-Options','Permissions-Policy','Strict-Transport-Security'])
   assert.ok(headers.includes(name),name+' missing');
});
test('authentication API disables MIME sniffing, embedding and referrers',()=>{
 for(const name of ['x-content-type-options','x-frame-options','referrer-policy','permissions-policy'])
   assert.ok(api.includes(name),name+' missing');
});
test('credential responses prohibit caching and set secure HttpOnly session cookies',()=>{
 assert.match(api,/cache-control':'no-store/);
 assert.match(api,/HttpOnly; Secure; SameSite=Lax/);
 assert.match(api,/sessionCookie\(token,604800\)/);
});
test('origin checking, access roles and request limit stay enabled',()=>{
 assert.match(api,/Origine non autorisée/);
 assert.match(api,/actor\.role!=='admin'/);
 assert.match(api,/Requête trop volumineuse/);
 assert.match(api,/Trop de tentatives/);
});
