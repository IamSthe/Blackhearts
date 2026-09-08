import { schemas, wikiEntities, editableEntities, emptyData, allowed, validate, deletionError, orderTotal, stampRecord } from './shared/model.js';
import { createDemo } from './demo.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const date = value => value ? new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—';
const today = () => new Date().toLocaleDateString('en-CA');
const paths = {dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',pedidos:'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',lavagem:'M2 6h20v12H2z M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M5 9v6 M19 9v6',avisos:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4z M10 21h4',acoes:'m4 3 16 17 M14 3l7 7-4 4-7-7z M3 21l7-7 M3 15l6 6',wiki:'M12 5C8 2 3 4 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-1-7-2-10 1z M12 5v15',usuarios:'M8 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M1 21v-3a7 7 0 0 1 14 0v3 M16 3a4 4 0 0 1 0 8 M18 14a6 6 0 0 1 5 7',cargos:'m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z',cidades:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0 M9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0',produtos:'m12 2 10 5v10l-10 5-10-5V7z M2 7l10 5 10-5 M12 12v10 M7 4l10 5',precos:'M12 2v20 M18 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H5',clock:'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20 M12 6v6l4 3',check:'M21 11v1a9 9 0 1 1-5-8 M9 11l3 3 9-9'};
const icon = key => `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[key] || paths.produtos}"/></svg>`;
const config = window.BLACKHEARTS_CONFIG || {};
const apiBase = String(config.apiBaseUrl || '').replace(/\/$/,'');
let data = emptyData(), user = null, demo = false, cityId = '', route = 'dashboard', token = sessionStorage.getItem('bh-session') || '';
let filters = { query:'',status:'',role:'',sort:'newest',overdue:false,from:'',to:'',days:30 };
let editing = null, refreshTimer, toastTimer;
const label = (entity,id) => data[entity].find(row => row.id === id)?.name || '—';
const can = entity => demo || allowed(user,entity,data);
const rowsInCity = entity => data[entity].filter(row => !row.cityId || !cityId || row.cityId === cityId);
const badge = value => `<span class="badge ${['Concluído','Finalizado','Concluída','Ativo'].includes(value)?'green':['Em preparação','Em andamento'].includes(value)?'blue':['Orçamento','Pendente','Agendada'].includes(value)?'amber':''}">${esc(value)}</span>`;
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').hidden=false; toastTimer=setTimeout(()=>$('#toast').hidden=true,5000); }
function loginMessage(message) { $('#loginMessage').hidden=false; $('#loginMessage').textContent=message; }
async function api(path,options={}) {
  const response = await fetch(`${apiBase}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...options.headers}});
  const result = await response.json();
  if (!response.ok) {
    if (response.status===401) { token=''; sessionStorage.removeItem('bh-session'); showLogin(); }
    throw new Error(result.error || 'Não foi possível concluir a solicitação.');
  }
  return result;
}
function navigation() {
  const link = (key,title) => `<a class="side-link" href="#${key}" data-route="${key}">${icon(key==='familias'||key==='responsaveis'?'usuarios':wikiEntities.includes(key)?'pedidos':key)}${title || schemas[key]?.title || 'Dashboard'}</a>`;
  $('#navigation').innerHTML = ['dashboard','pedidos','lavagem','avisos','acoes'].map(key=>link(key,key==='lavagem'?'Lavagem':null)).join('')+`<details open><summary>${icon('wiki')}Wiki</summary><div class="sub-nav">${wikiEntities.map(key=>link(key)).join('')}</div></details><details open><summary>${icon('pedidos')}Cadastros</summary><div class="sub-nav">${['usuarios','cargos','cidades','familias','responsaveis','produtos','materiais','precos','configurar'].filter(key=>key!=='usuarios'||user?.admin).map(key=>link(key)).join('')}</div></details>`;
}
function updateCities() {
  if (!data.cidades.some(row=>row.id===cityId)) cityId=data.cidades[0]?.id || '';
  $('#citySelect').innerHTML = data.cidades.length ? data.cidades.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('') : '<option value="">Cadastre uma cidade</option>';
  $('#citySelect').value=cityId;
}
function showApp() {
  $('#loginView').hidden=true; $('#dashboardView').hidden=false; $('#demoBanner').hidden=!demo;
  $('#modeLabel').textContent=demo?'Demonstração':'Sistema interno';
  $('#userName').textContent=user.name;
  $('#userAvatar').textContent=user.name.split(' ').slice(0,2).map(item=>item[0]).join('');
  if (user.avatar && /^https:\/\/cdn\.discordapp\.com\//.test(user.avatar)) $('#userAvatar').innerHTML=`<img alt="" src="${esc(user.avatar)}">`;
  navigation();updateCities();navigate();
  $('#menuToggle').setAttribute('aria-expanded',String(window.innerWidth>760));
  clearInterval(refreshTimer);
  if (!demo) refreshTimer=setInterval(async()=>{try { const result=await api('/api/data');data=result.data;user=result.user;updateCities();if(!$('#editor').open&&!$('#confirmDialog').open)render(); } catch(error){toast(error.message);}},30000);
}
function showLogin() {
  clearInterval(refreshTimer);$('#loginView').hidden=false;$('#dashboardView').hidden=true;$('#editor').close();$('#confirmDialog').close();user=null;data=emptyData();
}
function navigate() {
  const requested=location.hash.slice(1);route=requested==='wiki'?'docs':requested;
  if (route!=='dashboard'&&!schemas[route]) route='dashboard';
  if (route==='usuarios'&&!user?.admin) route='dashboard';
  filters={query:'',status:'',role:'',sort:'newest',overdue:false,from:'',to:'',days:30};
  if (user) render();
}
function heading(title,description,actions='') { return `<div class="page-heading"><div><h1 tabindex="-1">${esc(title)}</h1><p>${esc(description)}</p></div><div class="heading-actions">${actions}</div></div>`; }
function newButton() { return can(route)?`<button class="button primary" data-action="new"><span aria-hidden="true">＋</span>${schemas[route].add}</button>`:''; }
function actions(row) {
  if (!can(route)) return '—';
  const complete = (route==='pedidos'&&row.status!=='Concluído')||(route==='lavagem'&&row.status!=='Finalizado');
  return `<div class="row-actions">${complete?`<button class="button primary" data-action="complete" data-id="${esc(row.id)}">${icon('check')}${route==='pedidos'?'Concluir':'Finalizar'}</button>`:''}<button class="icon-button" data-action="edit" data-id="${esc(row.id)}" aria-label="Editar ${esc(row.name || schemas[route].singular)}">✎</button><button class="icon-button" data-action="delete" data-id="${esc(row.id)}" aria-label="Excluir ${esc(row.name || schemas[route].singular)}">×</button></div>`;
}
function table(headers,rows) { return `<div class="table-wrap"><table><thead><tr>${headers.map(item=>`<th scope="col">${item}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(cells=>`<tr>${cells.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty-state"><strong>Nenhum registro encontrado</strong>Adicione um registro ou ajuste os filtros.</td></tr>`}</tbody></table></div><p class="record-count">${rows.length} registro${rows.length===1?'':'s'}</p>`; }
function filtered(entity) {
  const normalized = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return rowsInCity(entity).filter(row=>{
    const text=Object.values(row).join(' ')+' '+label('familias',row.familyId)+' '+label('responsaveis',row.responsibleId)+' '+label('produtos',row.productId);
    const created=(row.createdAt || '').slice(0,10);
    return normalized(text).includes(normalized(filters.query)) && (!filters.status || (entity==='usuarios'?(row.active?'Ativo':'Inativo'):row.status)===filters.status) && (!filters.role || row.roleId===filters.role) && (!filters.from || created>=filters.from) && (!filters.to || created<=filters.to) && (!filters.overdue || (row.status!=='Concluído' && new Date(row.deadline)<new Date()));
  }).sort((a,b)=> filters.sort==='name' ? String(a.name || label('familias',a.familyId)).localeCompare(String(b.name || label('familias',b.familyId)),'pt-BR') : String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id))*(filters.sort==='oldest'?-1:1));
}
function filterBar() {
  const statusOptions=route==='usuarios'?['Ativo','Inativo']:schemas[route].fields.find(f=>f.key==='status')?.options;
  return `<div class="toolbar"><input id="searchInput" class="search" type="search" placeholder="${route==='pedidos'?'Buscar família, responsável, produto…':route==='usuarios'?'Buscar por nome, Discord ou e-mail…':'Buscar…'}" aria-label="Buscar registros" value="${esc(filters.query)}">${statusOptions?`<select data-filter="status" aria-label="Filtrar status"><option value="">Todos os status</option>${statusOptions.map(value=>`<option ${filters.status===value?'selected':''}>${esc(value)}</option>`).join('')}</select>`:''}${route==='usuarios'?`<select data-filter="role" aria-label="Filtrar cargo"><option value="">Todos os cargos</option>${data.cargos.map(row=>`<option value="${esc(row.id)}" ${filters.role===row.id?'selected':''}>${esc(row.name)}</option>`).join('')}</select>`:''}${route==='pedidos'?`<button class="button ${filters.overdue?'selected':''}" data-action="overdue" aria-pressed="${filters.overdue}">△ Atrasados</button><label class="filter-label">De<input type="date" data-filter="from" value="${filters.from}"></label><label class="filter-label">Até<input type="date" data-filter="to" value="${filters.to}"></label>`:''}<select data-filter="sort" aria-label="Ordenação">${[['newest','Mais recente'],['oldest','Mais antigo'],['name','Nome A–Z']].map(([key,title])=>`<option value="${key}" ${filters.sort===key?'selected':''}>${title}</option>`).join('')}</select></div>`;
}
function rowsView() {
  const rows=filtered(route);
  if (route==='pedidos') return table(['Status','Família','Responsável','Itens','Valor','Prazo','Criado','Concluído','Ações'],rows.map(row=>[badge(row.status),esc(label('familias',row.familyId)),`${esc(label('responsaveis',row.responsibleId))}<small>${esc(data.responsaveis.find(r=>r.id===row.responsibleId)?.phone || '')}</small>`,`${row.quantity}<small>${esc(label('produtos',row.productId))}</small>`,money(orderTotal(row)),esc(date(row.deadline)),`${esc(date(row.createdAt))}<small>${esc(row.createdBy)}</small>`,esc(date(row.completedAt)),actions(row)]));
  if (route==='lavagem') return table(['Status','Criado em','Nome','Valor bruto','Valor final','Tipo','Registrado por','Finalizado em','Ações'],rows.map(row=>[badge(row.status),esc(date(row.createdAt)),esc(row.name),money(row.gross),money(row.gross*(1-row.rate/100)),badge(row.type),esc(row.createdBy),esc(date(row.completedAt)),actions(row)]));
  if (route==='usuarios') return table(['Usuário','@ Discord','Cargo','Cidade','Status','Ações'],rows.map(row=>[`${esc(row.name)} ${row.admin?badge('Admin'):''}<small>${esc(row.email)}</small>`,`${esc(row.discordName || row.discordId)}<small>${esc(row.discordId)}</small>`,badge(label('cargos',row.roleId)),esc(label('cidades',row.cityId)),badge(row.active?'Ativo':'Inativo'),actions(row)]));
  if (route==='cargos') return table(['Nome','Permissões de edição','Usuários','Ações'],rows.map(row=>[esc(row.name),`${row.permissions.length} permissões`,user.admin?data.usuarios.filter(u=>u.roleId===row.id).length:'—',actions(row)]));
  if (route==='familias') return table(['Nome','Cidade','Parceria','Ações'],rows.map(row=>[esc(row.name),esc(label('cidades',row.cityId)),row.partner?'Sim':'Não',actions(row)]));
  if (route==='produtos') return table(['Nome','Descrição','Em estoque','Ações'],rows.map(row=>[esc(row.name),esc(row.description || '—'),row.inStock?'Sim':'Não',actions(row)]));
  if (route==='precos') return table(['Produto','Cidade','Cliente normal','Família parceira','Sem família','Ações'],rows.map(row=>[esc(label('produtos',row.productId)),esc(label('cidades',row.cityId)),money(row.normal),money(row.partner),money(row.solo),actions(row)]));
  if (route==='avisos'||wikiEntities.includes(route)) return `<div class="notice-grid">${rows.length?rows.map(row=>`<article class="panel notice-card"><h2>${esc(row.name)}</h2><p>${esc(row.description)}</p><footer><small class="muted">${esc(row.createdBy || 'Blackhearts')}${row.createdAt?' · '+esc(date(row.createdAt)):''}</small>${actions(row)}</footer></article>`).join(''):'<div class="panel empty-state"><strong>Nenhum conteúdo cadastrado</strong>Os novos registros aparecerão aqui.</div>'}</div>`;
  const columns=schemas[route].fields.filter(field=>!['textarea','permissions'].includes(field.type));
  return table([...columns.map(field=>field.label),'Ações'],rows.map(row=>[...columns.map(field=>field.source?esc(label(field.source,row[field.key])):field.type==='datetime-local'?esc(date(row[field.key])):field.key==='status'?badge(row[field.key]):field.type==='checkbox'?(row[field.key]?'Sim':'Não'):esc(row[field.key])),actions(row)]));
}
function dashboard() {
  const end=filters.to?new Date(filters.to+'T23:59:59'):new Date();
  const start=filters.from?new Date(filters.from+'T00:00:00'):new Date(new Date(end).setDate(end.getDate()-filters.days+1));start.setHours(0,0,0,0);
  const orders=rowsInCity('pedidos').filter(row=>new Date(row.createdAt)>=start&&new Date(row.createdAt)<=end);
  const completed=orders.filter(row=>row.status==='Concluído');const total=completed.reduce((sum,row)=>sum+orderTotal(row),0);const commission=completed.reduce((sum,row)=>sum+orderTotal(row)*row.commissionRate/100,0);
  const hours=completed.length?completed.reduce((sum,row)=>sum+Math.max(0,(new Date(row.completedAt)-new Date(row.createdAt))/3600000),0)/completed.length:0;
  const metrics=[['Receita total',money(total),'precos'],['Pedidos',orders.length,'pedidos'],['Concluídos',completed.length,'check'],['Ticket médio',money(completed.length?total/completed.length:0),'precos'],['Comissão total',money(commission),'lavagem'],['Líquido das vendas',money(total-commission),'lavagem'],['Taxa de conclusão',`${orders.length?Math.round(completed.length/orders.length*100):0}%`,'check'],['Tempo médio de entrega',completed.length?`${Math.floor(hours/24)}d ${Math.round(hours%24)}h`:'—','clock']];
  return heading('Dashboard',`Dados gerais de venda — ${label('cidades',cityId)}`,`<label class="filter-label">De<input type="date" data-filter="from" value="${filters.from}"></label><label class="filter-label">Até<input type="date" data-filter="to" value="${filters.to}"></label>${[7,30,90].map(days=>`<button class="button ${filters.days===days&&!filters.from&&!filters.to?'selected':''}" data-days="${days}">${days} dias</button>`).join('')}`)+`<section class="metric-grid" aria-label="Indicadores">${metrics.map(([title,value,key])=>`<article class="metric-card"><span>${title}</span>${icon(key)}<strong>${value}</strong></article>`).join('')}</section><section class="chart-grid"><article class="panel"><h2>Evolução no tempo</h2><p>Receita concluída e pedidos por dia</p>${lineChart(orders,start,end)}<div class="chart-legend"><span><i class="legend-dot" style="background:#22c55e"></i>Receita (eixo esquerdo)</span><span><i class="legend-dot" style="background:#4b8eea"></i>Pedidos (eixo direito)</span></div></article><article class="panel"><h2>Vendas por produto</h2><p>Receita dos pedidos concluídos no período</p>${productChart(completed)}</article></section>`;
}
function lineChart(orders,start,end) {
  const count=Math.min(366,Math.max(2,Math.ceil((end-start)/86400000)));
  const bins=Array.from({length:count},(_,i)=>({date:new Date(start.getTime()+i*86400000),revenue:0,count:0}));
  for(const row of orders) {const index=Math.min(count-1,Math.floor((new Date(row.createdAt)-start)/86400000));if(index>=0){bins[index].count++;if(row.status==='Concluído')bins[index].revenue+=orderTotal(row);}}
  const maxMoney=Math.max(1,...bins.map(bin=>bin.revenue));const maxCount=Math.max(1,...bins.map(bin=>bin.count));
  const points=(key,max)=>bins.map((bin,i)=>`${52+i/(count-1)*396},${220-bin[key]/max*195}`).join(' ');
  const compact=n=>Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(n);
  return `<svg class="chart" viewBox="0 0 500 250" role="img" aria-label="Evolução de ${orders.length} pedidos no período">${[0,1,2,3,4].map(i=>`<line class="grid" x1="52" y1="${25+i*48.75}" x2="448" y2="${25+i*48.75}"/><text text-anchor="end" x="45" y="${29+i*48.75}">${compact(maxMoney*(1-i/4))}</text><text x="458" y="${29+i*48.75}">${+(maxCount*(1-i/4)).toFixed(1)}</text>`).join('')}<polyline fill="none" stroke="#22c55e" stroke-width="2" points="${points('revenue',maxMoney)}"/><polyline fill="none" stroke="#4b8eea" stroke-width="2" points="${points('count',maxCount)}"/>${[0,1,2,3,4].map(i=>`<text text-anchor="middle" x="${52+i*99}" y="242">${bins[Math.round(i*(count-1)/4)].date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</text>`).join('')}</svg>`;
}
function productChart(orders) { const totals={};for(const row of orders)totals[row.productId]=(totals[row.productId]||0)+orderTotal(row);const sorted=Object.entries(totals).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...Object.values(totals));return `<div class="product-bars">${sorted.length?sorted.map(([id,total])=>`<div><div class="product-bar-label"><span>${esc(label('produtos',id))}</span><span class="muted">${money(total)}</span></div><div class="product-bar-track"><span style="width:${Math.max(1,total/max*100)}%"></span></div></div>`).join(''):'<div class="empty-state">Nenhuma venda concluída neste período.</div>'}</div>`; }
function render() {
  document.title=`Blackhearts | ${schemas[route]?.title || 'Dashboard'}`;
  document.querySelectorAll('[data-route]').forEach(link=>{const active=link.dataset.route===route;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  if(route==='dashboard'){ $('#pageContent').innerHTML=dashboard();return; }
  const summary=route==='pedidos'?`<div class="summary-grid">${[['Orçamento','Orçamentos','amber'],['Em preparação','Em preparação','blue'],['Concluído','Concluídos','green']].map(([status,title,color])=>`<div class="summary-card ${color}">${title}<strong>${rowsInCity('pedidos').filter(row=>row.status===status).length}</strong></div>`).join('')}</div>`:'';
  $('#pageContent').innerHTML=heading(schemas[route].title,schemas[route].description,`${route==='pedidos'?'<button class="button" data-action="materials">'+icon('produtos')+'Materiais totais</button>':''}${newButton()}`)+summary+filterBar()+`<div id="records">${rowsView()}</div>`;
}
function fieldHtml(field, row) {
  const value=row[field.key] ?? (field.key==='cityId'?cityId:field.key==='active'?true:field.key==='quantity'?1:field.key==='commissionRate'?5:'');
  const attrs=`id="field-${field.key}" name="${field.key}" ${field.required?'required':''}`;
  if(field.type==='checkbox') return `<label class="field checkbox-field"><input type="checkbox" name="${field.key}" ${value?'checked':''}>${field.label}</label>`;
  if(field.type==='permissions')return `<fieldset><legend>Pode editar</legend><div class="form-fields">${editableEntities.map(key=>`<label class="checkbox-field"><input type="checkbox" name="permissions" value="${key}" ${(value || []).includes(key)?'checked':''}>${schemas[key].title}</label>`).join('')}</div></fieldset>`;
  let control;
  if(field.type==='select') {const options=field.source?data[field.source].map(item=>({id:item.id,name:item.name})):field.options.map(item=>({id:item,name:item}));control=`<select ${attrs}><option value="">${field.required?'Selecione…':'Nenhum'}</option>${options.map(option=>`<option value="${esc(option.id)}" ${option.id===value?'selected':''}>${esc(option.name)}</option>`).join('')}</select>${field.source&&!options.length?`<small class="field-hint">Cadastre um registro em ${schemas[field.source].title} primeiro.</small>`:''}`;}
  else if(field.type==='textarea') control=`<textarea ${attrs} maxlength="10000">${esc(value)}</textarea>`;
  else control=`<input ${attrs} type="${field.type}" value="${esc(value)}" ${field.type==='number'?`min="${field.min ?? 0}" max="${field.max ?? 1e12}" step="${field.step || '0.01'}"`:'maxlength="200"'} ${field.pattern?`pattern="${field.pattern}"`:''}>`;
  return `<div class="field"><label for="field-${field.key}">${field.label}</label>${control}${field.hint?`<small class="field-hint">${field.hint}</small>`:''}</div>`;
}
function openEditor(id) {
  const row=data[route].find(item=>item.id===id) || {};
  editing={entity:route,id:row.id};$('#editorTitle').textContent=row.id?`Editar ${schemas[route].singular}`:schemas[route].add;
  $('#editorFields').innerHTML=schemas[route].fields.map(field=>fieldHtml(field,row)).join('');$('#formError').textContent='';$('#saveButton').hidden=false;$('#saveButton').disabled=false;$('#editor').showModal();
}
function confirmAction(message,title='Confirmar exclusão',button='Excluir') {
  return new Promise(resolve=>{const dialog=$('#confirmDialog');$('#confirmTitle').textContent=title;$('#confirmMessage').textContent=message;$('#acceptConfirm').textContent=button;$('#acceptConfirm').onclick=()=>dialog.close('yes');$('#cancelConfirm').onclick=()=>dialog.close('no');dialog.onclose=()=>resolve(dialog.returnValue==='yes');dialog.returnValue='';dialog.showModal();});
}
async function save(entity,input,id) {
  if(demo) {
    const values=validate(entity,{...input,id},data);const previous=data[entity].find(row=>row.id===id);
    if(entity==='usuarios'&&id===user.id&&(!values.admin||!values.active))throw new Error('Mantenha seu próprio acesso administrativo ativo.');
    const record=stampRecord(entity,values,previous,user);
    const next={...data,[entity]:id?data[entity].map(row=>row.id===id?record:row):[...data[entity],record]};
    localStorage.setItem('bh-demo-v2',JSON.stringify(next));data=next;
    if(entity==='usuarios'&&id===user.id)user=record;
  } else { await api(`/api/${entity}${id?'/'+encodeURIComponent(id):''}`,{method:id?'PUT':'POST',body:JSON.stringify(input)});const result=await api('/api/data');data=result.data;user=result.user; }
  updateCities();render();
}
async function remove(id) {
  const error=deletionError(route,id,data);if(error)throw new Error(error);
  if(route==='usuarios'&&id===user.id)throw new Error('Você não pode excluir seu próprio acesso.');
  if(!await confirmAction(`Excluir este registro de ${schemas[route].title}? Esta ação não pode ser desfeita.`))return;
  if(demo){const next={...data,[route]:data[route].filter(row=>row.id!==id)};localStorage.setItem('bh-demo-v2',JSON.stringify(next));data=next;}
  else {await api(`/api/${route}/${encodeURIComponent(id)}`,{method:'DELETE'});data=(await api('/api/data')).data;}
  updateCities();render();toast('Registro excluído.');
}
function materials() {
  const totals={};for(const order of filtered('pedidos').filter(row=>row.status!=='Concluído')){const product=data.produtos.find(row=>row.id===order.productId);if(product?.materialId)totals[product.materialId]=(totals[product.materialId]||0)+order.quantity*product.materialQuantity;}
  $('#editorTitle').textContent='Materiais dos pedidos em aberto';$('#editorFields').innerHTML=table(['Material','Necessário','Em estoque'],Object.entries(totals).map(([id,quantity])=>[esc(label('materiais',id)),quantity,data.materiais.find(row=>row.id===id)?.quantity || 0]));$('#formError').textContent='';$('#saveButton').hidden=true;editing=null;$('#editor').showModal();
}
$('#pageContent').addEventListener('input',event=>{if(event.target.id==='searchInput'){filters.query=event.target.value;$('#records').innerHTML=rowsView();}});
$('#pageContent').addEventListener('change',event=>{if(event.target.dataset.filter){filters[event.target.dataset.filter]=event.target.value;if(filters.from&&filters.to&&filters.from>filters.to){toast('A data inicial deve ser anterior à data final.');filters.to=filters.from;}render();}});
$('#pageContent').addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.days){filters.days=Number(target.dataset.days);filters.from='';filters.to='';render();return;}
  try {const action=target.dataset.action;if(action==='new')openEditor();if(action==='edit')openEditor(target.dataset.id);if(action==='delete')await remove(target.dataset.id);if(action==='materials')materials();if(action==='overdue'){filters.overdue=!filters.overdue;render();}if(action==='complete'){target.disabled=true;const row=data[route].find(item=>item.id===target.dataset.id);await save(route,{...row,status:route==='pedidos'?'Concluído':'Finalizado'},row.id);toast('Registro concluído.');}}
  catch(error){target.disabled=false;toast(error.message);}
});
$('#editorForm').addEventListener('change',event=>{
  if(editing?.entity!=='pedidos'||!['familyId','productId','cityId'].includes(event.target.name))return;
  const form=event.currentTarget;const family=data.familias.find(row=>row.id===form.elements.familyId.value);
  const price=data.precos.find(row=>row.cityId===form.elements.cityId.value&&row.productId===form.elements.productId.value);
  if(price)form.elements.unitPrice.value=family?.partner?price.partner:price.normal;
});
$('#editorForm').addEventListener('submit',async event=>{event.preventDefault();if(!editing)return;const button=$('#saveButton');button.disabled=true;$('#formError').textContent='';try {const form=new FormData(event.currentTarget);const input={};for(const field of schemas[editing.entity].fields)input[field.key]=field.type==='checkbox'?form.has(field.key):field.type==='permissions'?form.getAll(field.key):form.get(field.key);await save(editing.entity,input,editing.id);$('#editor').close();toast('Registro salvo.');}catch(error){$('#formError').textContent=error.message;}finally{button.disabled=false;}});
$('#closeEditor').onclick=()=>$('#editor').close();
$('#citySelect').onchange=event=>{cityId=event.target.value;render();};
$('#menuToggle').onclick=()=>{if(window.innerWidth<=760){const open=$('#sidebar').classList.toggle('mobile-open');$('#menuToggle').setAttribute('aria-expanded',String(open));}else{const collapsed=document.body.classList.toggle('sidebar-collapsed');$('#menuToggle').setAttribute('aria-expanded',String(!collapsed));}};
$('#navigation').onclick=event=>{if(event.target.closest('a')&&window.innerWidth<=760){$('#sidebar').classList.remove('mobile-open');$('#menuToggle').setAttribute('aria-expanded','false');}};
window.addEventListener('hashchange',navigate);
$('#previewButton').hidden=config.allowDemo===false;
$('#previewButton').onclick=()=>{try{const stored=localStorage.getItem('bh-demo-v2');data=stored?JSON.parse(stored):createDemo();if(!data.usuarios?.find(row=>row.id==='demo-user'))data=createDemo();demo=true;user=data.usuarios.find(row=>row.id==='demo-user');showApp();}catch{data=createDemo();demo=true;user=data.usuarios[0];showApp();toast('Não foi possível recuperar a demonstração salva.');}};
$('#resetDemo').onclick=async()=>{if(await confirmAction('Restaurar os exemplos e apagar as alterações locais da demonstração?','Restaurar demonstração','Restaurar')){data=createDemo();localStorage.removeItem('bh-demo-v2');user=data.usuarios[0];updateCities();render();toast('Demonstração restaurada.');}};
$('#logoutButton').onclick=async()=>{if(!demo){try{await api('/auth/logout',{method:'POST'});}catch(error){toast(error.message);}}token='';sessionStorage.removeItem('bh-session');demo=false;showLogin();history.replaceState(null,'',location.pathname+location.search);};
$('#discordLogin').onclick=async()=>{
  if(!apiBase){loginMessage('A entrada pelo Discord aguarda a configuração do serviço de autenticação. A demonstração está disponível abaixo.');return;}
  const button=$('#discordLogin');button.disabled=true;
  try {const result=await api('/auth/start',{method:'POST'});if(!/^https:\/\/discord\.com\/oauth2\/authorize\?/.test(result.url))throw new Error('Endereço de autenticação inválido.');sessionStorage.setItem('bh-login-verifier',result.verifier);location.assign(result.url);}catch(error){loginMessage(error.message);button.disabled=false;}
};
async function init() {
  const params=new URLSearchParams(location.hash.slice(1));
  if(params.has('auth_error')){history.replaceState(null,'',location.pathname+location.search);loginMessage('Não foi possível autorizar sua conta. Confira se seu Discord está pré-cadastrado e ativo.');}
  if(params.has('auth_code')){
    const code=params.get('auth_code');history.replaceState(null,'',location.pathname+location.search);
    try {const verifier=sessionStorage.getItem('bh-login-verifier');sessionStorage.removeItem('bh-login-verifier');const result=await api('/auth/exchange',{method:'POST',body:JSON.stringify({code,verifier})});token=result.token;sessionStorage.setItem('bh-session',token);}catch(error){loginMessage(error.message);return;}
  }
  if(token&&apiBase){try{const result=await api('/api/data');data=result.data;user=result.user;demo=false;showApp();}catch(error){loginMessage(error.message);}}
}
init();
