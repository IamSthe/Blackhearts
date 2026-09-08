import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardBreakdown } from '../shared/analytics.js';
import { validateAttachments } from '../shared/attachments.js';
import { validate } from '../shared/model.js';
import { createDemo } from '../demo.js';
test('gráficos somam apenas receita concluída e distribuem todos os status',()=>{
  const family={id:'f',name:'Família',partner:true};
  const orders=[{familyId:'f',quantity:2,unitPrice:100,status:'Concluído',createdBy:'Ana'},{quantity:1,unitPrice:50,status:'Concluído',createdBy:'Bia'},{familyId:'f',clientType:'CNPJ',quantity:1,unitPrice:20,status:'Concluído',createdBy:'Ana'},{quantity:10,unitPrice:999,status:'Orçamento'},{status:'Em preparação'}];
  const stats=dashboardBreakdown(orders,[family]);
  assert.deepEqual(stats.types,[{name:'CNPJ',value:20},{name:'Parceria',value:200},{name:'CPF',value:50}]);
  assert.deepEqual(stats.sellers,[{name:'Ana',value:220},{name:'Bia',value:50}]);
  assert.equal(stats.families[0].value,220);assert.equal(stats.statuses.reduce((s,r)=>s+r.value,0),5);
  assert.equal(dashboardBreakdown([],[]).types.reduce((s,r)=>s+r.value,0),0);
});
test('anexos e observações preservam conteúdo e rejeitam arquivos inválidos',()=>{
  const file={id:'file-test',name:'observacao.txt',type:'text/plain',size:5,data:'data:text/plain;base64,aGVsbG8='};
  assert.deepEqual(validateAttachments([file]),[file]);
  assert.throws(()=>validateAttachments(Array(6).fill(file)),/5 anexos/);
  assert.throws(()=>validateAttachments([{...file,size:3000000}]),/2 MB/);
  assert.throws(()=>validateAttachments([{...file,type:'image/svg+xml'}]),/inválido/);
  assert.throws(()=>validateAttachments([{...file,type:'image/png',data:'data:image/png;base64,aGVsbG8='}]),/não corresponde/);
  const data=createDemo();const row={name:'Veículos',description:'Descrição antiga',observations:'Placa observada',attachments:[file]};
  assert.deepEqual(validate('investigativa',row,data),row);
  assert.deepEqual(validate('investigativa',{name:'Antigo',description:'Preservado'},data).attachments,[]);
});
