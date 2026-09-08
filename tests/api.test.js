import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { createDemo } from '../demo.js';
import { validate, deletionError } from '../shared/model.js';

test('OAuth: pré-cadastro, state, vínculo ao navegador, sessão e permissões',async()=>{
  let profileId='100000000000000001';
  const app=createApp({frontendUrl:'http://127.0.0.1:4173/',apiUrl:'http://127.0.0.1:3000',clientId:'example-client',clientSecret:'test-only',adminDiscordId:profileId,fetchImpl:async url=>new Response(JSON.stringify(url.includes('/token')?{access_token:'test-only'}:{id:profileId,username:'test-user',avatar:null}),{status:200})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${app.server.address().port}`;
  const request=(path,method='GET',body,token)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:4173',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
  async function login(){const start=await(await request('/auth/start','POST')).json();const state=new URL(start.url).searchParams.get('state');const callback=await request(`/auth/callback?state=${state}&code=test`);return {start,callback,code:new URLSearchParams(new URL(callback.headers.get('location')).hash.slice(1)).get('auth_code')};}
  try{
    assert.equal((await request('/api/data')).status,401);
    assert.equal((await fetch(base+'/health',{headers:{Origin:'https://evil.example'}})).status,403);
    assert.match((await request('/auth/callback?state=invalid&code=test')).headers.get('location'),/auth_error/);
    const auth=await login();assert.ok(auth.code);
    assert.equal((await request('/auth/exchange','POST',{code:auth.code,verifier:'wrong'})).status,401);
    const token=(await(await request('/auth/exchange','POST',{code:auth.code,verifier:auth.start.verifier})).json()).token;assert.ok(token);
    assert.equal((await request('/auth/exchange','POST',{code:auth.code,verifier:auth.start.verifier})).status,401);
    const initial=await(await request('/api/data','GET',null,token)).json();assert.equal(initial.user.admin,true);assert.equal(initial.data.pedidos.length,0);
    const city=await(await request('/api/cidades','POST',{name:'Cidade teste',description:''},token)).json();assert.ok(city.record.id);
    const role=await(await request('/api/cargos','POST',{name:'Leitura',permissions:[]},token)).json();
    const memberId='100000000000000002';const member=await(await request('/api/usuarios','POST',{name:'Membro teste',discordId:memberId,discordName:'member',email:'',roleId:role.record.id,cityId:city.record.id,active:true,admin:false},token)).json();assert.ok(member.record.id);
    assert.equal((await request(`/api/cidades/${city.record.id}`,'DELETE',null,token)).status,409);
    assert.equal((await request(`/api/usuarios/${initial.user.id}`,'DELETE',null,token)).status,400);
    assert.equal((await request('/api/cargos','POST',{name:'Inválido',permissions:['usuarios']},token)).status,400);
    profileId=memberId;const memberAuth=await login();const memberToken=(await(await request('/auth/exchange','POST',{code:memberAuth.code,verifier:memberAuth.start.verifier})).json()).token;
    assert.equal((await request('/api/cidades','POST',{name:'Não autorizado'},memberToken)).status,403);
    const memberData=await(await request('/api/data','GET',null,memberToken)).json();assert.deepEqual(memberData.data.usuarios,[]);
    await request(`/api/usuarios/${member.record.id}`,'PUT',{...member.record,active:false},token);
    assert.equal((await request('/api/data','GET',null,memberToken)).status,401);
    assert.match((await login()).callback.headers.get('location'),/auth_error/);
    profileId='100000000000000003';assert.match((await login()).callback.headers.get('location'),/auth_error/);
    await request('/auth/logout','POST',{},token);assert.equal((await request('/api/data','GET',null,token)).status,401);
  }finally{await app.close();}
});
test('validação de pedidos, referências e valores',()=>{
  const data=createDemo();const row=data.pedidos[0];
  assert.equal(validate('pedidos',row,data).quantity,row.quantity);
  assert.throws(()=>validate('pedidos',{...row,quantity:-1},data));
  assert.throws(()=>validate('pedidos',{...row,quantity:1.2},data));
  assert.throws(()=>validate('pedidos',{...row,cityId:'city-2'},data),/cidade/);
  assert.throws(()=>validate('pedidos',{...row,responsibleId:'person-1'},data),/corresponder/);
  assert.match(deletionError('produtos',row.productId,data),/em uso/);
  assert.throws(()=>validate('precos',{...data.precos[0],id:'another'},data),/Já existe/);
});
