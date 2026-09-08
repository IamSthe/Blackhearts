import { emptyData, editableEntities } from './shared/model.js';
export function createDemo() {
  const data = emptyData();
  const now = new Date();
  const ago = days => new Date(now.getTime() - days * 86400000).toISOString();
  data.cidades = [{id:'city-1',name:'Cidade dos anjos',description:''},{id:'city-2',name:'Cidade alternativa',description:''}];
  data.cargos = ['Frente','Gerente','Lavagem','Membro','Recruta'].map((name,i) => ({id:`role-${i}`,name,permissions:i < 2 ? editableEntities : i === 2 ? ['lavagem'] : ['pedidos','acoes']}));
  data.usuarios = [{id:'demo-user',name:'Administrador de demonstração',discordId:'100000000000000001',discordName:'demo.blackhearts',email:'',roleId:'role-0',cityId:'city-1',active:true,admin:true}];
  data.familias = ['Aura','Balaklava','Ballas','Cartel','Families','Hells Angels','Hydra','La Guardia','Meraki'].map((name,i) => ({id:`family-${i}`,name,cityId:'city-1',partner:i===4}));
  data.responsaveis = data.familias.map((family,i) => ({id:`person-${i}`,name:`Contato ${i+1}`,phone:'',familyId:family.id,cityId:'city-1'}));
  data.materiais = [{id:'material-1',name:'Metal',quantity:5000,unit:'unidades',description:'Material fictício de roleplay.'}];
  data.produtos = ['M16','Maçarico','Rastreador Ilegal','Seringa Crack'].map((name,i)=>({id:`product-${i}`,name,description:['Fuzil de roleplay','Item para desmanche de veículos no jogo','Item de rastreamento no jogo','Item de roleplay'][i],inStock:i!==2,materialId:i===0?'material-1':'',materialQuantity:i===0?20:0}));
  data.precos = data.produtos.map((product,i) => ({id:`price-${i}`,productId:product.id,cityId:'city-1',normal:[195000,3400,1000,750][i],partner:[175000,3000,1000,750][i],solo:[230000,3400,1200,975][i]}));
  data.pedidos = Array.from({length:28},(_,i) => ({id:`order-${i}`,familyId:`family-${i%9}`,responsibleId:`person-${i%9}`,cityId:'city-1',productId:`product-${i%7===0?1:0}`,quantity:[2,3,1,14,8,5,12][i%7],unitPrice:i%7===0?3400:195000,commissionRate:5,status:i<5?'Em preparação':i===5?'Orçamento':'Concluído',deadline:ago(i<5?-2:i-1).slice(0,16),createdAt:ago(i),createdBy:'Equipe de demonstração',completedAt:i>5?ago(i-1):null,description:''}));
  data.lavagem = [108000,15675,68000].map((gross,i)=>({id:`wash-${i}`,name:`Transação exemplo ${i+1}`,cityId:'city-1',gross,rate:i===1?11:20,type:i===1?'Interna':'Externa',status:'Finalizado',createdAt:ago(i+2),completedAt:ago(i+1),createdBy:'Equipe de demonstração'}));
  data.configurar = [{id:'action-type-1',name:'Reunião da família',participants:10,description:'Alinhamento das atividades de roleplay.'}];
  data.acoes = [{id:'action-1',name:'Reunião semanal',cityId:'city-1',actionId:'action-type-1',scheduledAt:ago(-2).slice(0,16),status:'Agendada',description:'Organização dos próximos pedidos e atividades.'}];
  data.avisos = [{id:'notice-1',name:'Bem-vindo ao sistema Blackhearts',cityId:'city-1',description:'Este ambiente é uma demonstração com registros fictícios. Explore as abas, cadastre pedidos e acompanhe os indicadores. Os dados desta demonstração ficam somente no seu navegador.',createdAt:ago(0),createdBy:'Blackhearts'}];
  data.valores = ['AURA 🟣 ⚫','BALLAS 🟣','CARTEL ⚪','FAMILIES 🟢','HELLS ANGELS','HYDRA 🔴','MERAKI 🟡 ⚪','NOX 🔴','VENDETTA','VOID 🔵'].map((name,i)=>({id:`value-${i}`,name,description:i===0?'1. PT:\n   M19 - 30k\n   Ati - 46.5k (só faz com up)\n\n2. Munição:\n   PT - 90un\n   SUB - 120un\n   FUZIL - 165un\n\n3. Droga:\n   Crack - preço da mesa':'Cadastre aqui os acordos e valores desta família.'}));
  data.investigativa = ['Pessoas','Veículos','Locais','Ocorrências'].map((name,i)=>({id:`investigation-${i}`,name,description:'',observations:'',attachments:[]}));
  data.pedidos.forEach((row,i)=>{row.createdBy=['Vendedor 01','Vendedor 02','Vendedor 03','Vendedor 04','Vendedor 05'][i%5];row.clientType=i%11===0?'CPF':data.familias.find(family=>family.id===row.familyId)?.partner?'Parceria':'CNPJ';});
  return data;
}
