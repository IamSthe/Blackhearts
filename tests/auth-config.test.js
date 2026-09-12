import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicApiUrl, verifyAuthService } from '../scripts/auth-config.js';
test('configuração pública aceita origem HTTPS e rejeita credenciais e URLs indevidas',()=>{
  assert.equal(publicApiUrl(''),'');assert.equal(publicApiUrl(' https://api.example.com/ '),'https://api.example.com');
  for(const url of ['http://api.example.com','https://user:secret@api.example.com','https://api.example.com/auth/callback','https://api.example.com/?token=x','https://api.example.com/#token','invalid'])assert.throws(()=>publicApiUrl(url));
});
test('publicação verifica saúde, configuração e CORS do backend',async()=>{
  const frontend='https://iamsthe.github.io/Blackhearts/';
  const response=(body,origin='https://iamsthe.github.io',status=200)=>async()=>new Response(JSON.stringify(body),{status,headers:{'Access-Control-Allow-Origin':origin}});
  await verifyAuthService('https://api.example.com',frontend,response({ok:true,authConfigured:true}));
  await assert.rejects(verifyAuthService('https://api.example.com',frontend,response({ok:true,authConfigured:false})),/DISCORD_CLIENT_ID/);
  await assert.rejects(verifyAuthService('https://api.example.com',frontend,response({ok:true,authConfigured:true},'https://other.example')),/FRONTEND_URL/);
  await assert.rejects(verifyAuthService('https://api.example.com',frontend,response({},'',503)),/503/);
});
