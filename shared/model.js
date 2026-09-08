import { validateAttachments } from './attachments.js';
const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, required: true, ...extra });
const city = f('cityId', 'Cidade', 'select', { source: 'cidades' });
const name = f('name', 'Nome');
const note = f('description', 'Descrição', 'textarea', { required: false });
export const schemas = {
  pedidos: { title: 'Pedidos', singular: 'pedido', add: 'Novo pedido', description: 'Gerencie orçamentos e pedidos', fields: [f('familyId','Família','select',{source:'familias'}),f('responsibleId','Responsável','select',{source:'responsaveis'}),city,f('productId','Produto','select',{source:'produtos'}),f('quantity','Quantidade','number',{min:1,step:1}),f('unitPrice','Valor unitário (R$)','number',{min:0}),f('commissionRate','Comissão (%)','number',{min:0,max:100}),f('deadline','Prazo','datetime-local'),f('status','Status','select',{options:['Orçamento','Em preparação','Concluído']}),note] },
  lavagem: { title: 'Lavagem de dinheiro', singular: 'transação', add: 'Nova transação', description: 'Movimentações de lavagem registradas no roleplay', fields: [name,city,f('gross','Valor bruto (R$)','number',{min:0.01}),f('rate','Taxa (%)','number',{min:0,max:100}),f('type','Tipo','select',{options:['Externa','Interna']}),f('status','Status','select',{options:['Pendente','Finalizado']})] },
  avisos: { title:'Avisos',singular:'aviso',add:'Novo aviso',description:'Comunicados da organização',fields:[name,city,f('description','Mensagem','textarea')] },
  acoes: { title:'Ações',singular:'ação',add:'Nova ação',description:'Organize as atividades da família',fields:[name,city,f('actionId','Tipo de ação','select',{source:'configurar'}),f('scheduledAt','Data e hora','datetime-local'),f('status','Status','select',{options:['Agendada','Em andamento','Concluída','Cancelada']}),note] },
  usuarios: { title:'Usuários',singular:'usuário',add:'Novo usuário',description:'Pessoas autorizadas a acessar o sistema',fields:[name,f('discordId','ID do Discord','text',{pattern:'[0-9]{17,20}',hint:'ID numérico, obtido em Copiar ID do usuário no Discord.'}),f('discordName','Nome de usuário Discord','text',{required:false}),f('email','E-mail','email',{required:false}),f('roleId','Cargo','select',{source:'cargos'}),city,f('active','Usuário ativo','checkbox'),f('admin','Administrador','checkbox')] },
  cargos: { title:'Cargos',singular:'cargo',add:'Novo cargo',description:'Permissões de acesso dos membros',fields:[name,f('permissions','Pode editar','permissions')] },
  cidades: { title:'Cidades',singular:'cidade',add:'Nova cidade',description:'Cidades atendidas pela organização',fields:[name,note] },
  familias: { title:'Famílias',singular:'família',add:'Nova família',description:'Famílias e parcerias por cidade',fields:[name,city,f('partner','Família parceira','checkbox')] },
  responsaveis: { title:'Responsáveis',singular:'responsável',add:'Novo responsável',description:'Contatos para atendimento e entrega',fields:[name,f('phone','Telefone','tel',{required:false}),f('familyId','Família','select',{source:'familias'}),city] },
  produtos: { title:'Produtos',singular:'produto',add:'Novo produto',description:'Catálogo de produtos da organização',fields:[name,note,f('inStock','Em estoque','checkbox'),f('materialId','Material utilizado','select',{source:'materiais',required:false}),f('materialQuantity','Material por unidade','number',{min:0,required:false})] },
  materiais: { title:'Materiais',singular:'material',add:'Novo material',description:'Materiais utilizados na produção',fields:[name,f('quantity','Quantidade em estoque','number',{min:0}),f('unit','Unidade'),note] },
  precos: { title:'Preços por cidade',singular:'preço',add:'Novo preço',description:'Valores de venda por produto e perfil de cliente',fields:[f('productId','Produto','select',{source:'produtos'}),city,f('normal','Cliente normal (R$)','number',{min:0}),f('partner','Família parceira (R$)','number',{min:0}),f('solo','Sem família (R$)','number',{min:0})] },
  configurar: { title:'Configurar ações',singular:'tipo de ação',add:'Novo tipo de ação',description:'Tipos de atividades disponíveis para agendamento',fields:[name,f('participants','Participantes','number',{min:1,step:1}),note] },
  valores: { title:'Investigativa',singular:'categoria',add:'Nova categoria',description:'Organize categorias por cores e subcategorias',fields:[f('name','Categoria'),f('color','Cor da categoria','color'),f('subcategories','Subcategorias','subcategories',{required:false})] },
  investigativa: { title:'Famílias e valores',singular:'categoria',add:'Nova categoria',description:'Categorias com observações e anexos de investigação',fields:[f('name','Categoria'),f('description','Descrição','textarea',{required:false}),f('observations','Observações','textarea',{required:false}),f('attachments','Anexos','attachments',{required:false})] }
};
schemas.pedidos.fields.splice(3,0,f('clientType','Tipo de cliente','select',{required:false,options:['CNPJ','Parceria','CPF']}));
export const adminEntities = ['usuarios','cargos'];
export const editableEntities = Object.keys(schemas).filter(key => !adminEntities.includes(key));
export const wikiEntities = ['valores','investigativa'];
export const emptyData = () => Object.fromEntries(Object.keys(schemas).map(key => [key, []]));
export const orderTotal = row => Math.round(Number(row.quantity) * Number(row.unitPrice) * 100) / 100;
export function allowed(user, entity, data) {
  return !!user && (user.admin || (!adminEntities.includes(entity) && (data.cargos.find(role => role.id === user.roleId)?.permissions || []).includes(entity)));
}
export function validate(entity, input, data) {
  const schema = schemas[entity];
  if (!schema) throw new Error('Cadastro desconhecido.');
  const result = {};
  for (const field of schema.fields) {
    let value = input[field.key];
    if (field.type === 'attachments') { result[field.key] = validateAttachments(value); continue; }
    if (field.type === 'subcategories') {
      if (!Array.isArray(value)) throw new Error('Subcategorias: formato inválido.');
      result[field.key] = value.map(item => {
        if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.icon !== 'string' || typeof item.observations !== 'string' || item.name.trim().length < 1 || item.name.length > 200 || item.observations.length > 10000) throw new Error('Subcategoria inválida.');
        return { id:item.id, name:item.name.trim(), icon:item.icon.slice(0,16), observations:item.observations, attachments:validateAttachments(item.attachments || []) };
      });
      continue;
    }
    if (field.type === 'checkbox') { result[field.key] = value === true; continue; }
    if (field.type === 'permissions') {
      if (!Array.isArray(value) || value.some(item => !editableEntities.includes(item))) throw new Error('Permissões inválidas.');
      result[field.key] = [...new Set(value)]; continue;
    }
    if (value === '' || value === undefined || value === null) {
      if (field.required) throw new Error(`Preencha ${field.label}.`);
      result[field.key] = field.type === 'number' ? 0 : ''; continue;
    }
    if (field.type === 'number') {
      value = Number(value);
      if (!Number.isFinite(value) || value < (field.min ?? 0) || value > (field.max ?? 1e12) || (field.step === 1 && !Number.isInteger(value))) throw new Error(`${field.label}: valor inválido.`);
      value = Math.round(value * 100) / 100;
    } else {
      if (typeof value !== 'string') throw new Error(`${field.label}: formato inválido.`);
      value = value.trim();
      if ((field.required && !value) || value.length > (field.type === 'textarea' ? 10000 : 200)) throw new Error(`${field.label}: texto inválido.`);
      if (field.options && !field.options.includes(value)) throw new Error(`${field.label}: opção inválida.`);
      if (field.source && !data[field.source].some(row => row.id === value)) throw new Error(`${field.label}: cadastro não encontrado.`);
      if (field.pattern && !new RegExp(`^${field.pattern}$`).test(value)) throw new Error(`${field.label}: formato inválido.`);
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('E-mail inválido.');
      if (field.type === 'datetime-local' && !Number.isFinite(Date.parse(value))) throw new Error('Data inválida.');
    }
    result[field.key] = value;
  }
  if (entity === 'usuarios' && data.usuarios.some(row => row.discordId === result.discordId && row.id !== input.id)) throw new Error('Este Discord já está cadastrado.');
  if (entity === 'precos' && data.precos.some(row => row.cityId === result.cityId && row.productId === result.productId && row.id !== input.id)) throw new Error('Já existe preço para este produto nesta cidade.');
  if (entity === 'pedidos') {
    const family = data.familias.find(row => row.id === result.familyId);
    const responsible = data.responsaveis.find(row => row.id === result.responsibleId);
    if (family.cityId !== result.cityId || responsible.cityId !== result.cityId || responsible.familyId !== family.id) throw new Error('Família e responsável devem corresponder à cidade do pedido.');
    if (orderTotal(result) > 1e12) throw new Error('Valor total muito alto.');
  }
  return result;
}
export function deletionError(entity, id, data) {
  for (const [key, schema] of Object.entries(schemas)) {
    for (const field of schema.fields.filter(item => item.source === entity)) {
      if (data[key].some(row => row[field.key] === id)) return `Este registro está em uso em ${schema.title}. Atualize os vínculos antes de excluir.`;
    }
  }
  return '';
}
export function stampRecord(entity, values, previous, user, now = new Date().toISOString()) {
  const result = { ...values, id: previous?.id || crypto.randomUUID(), createdAt: previous?.createdAt || now, createdBy: previous?.createdBy || user.name, updatedAt: now };
  const completed = entity === 'pedidos' ? values.status === 'Concluído' : entity === 'lavagem' ? values.status === 'Finalizado' : false;
  result.completedAt = completed ? previous?.completedAt || now : null;
  return result;
}
