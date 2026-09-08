import { dashboardBreakdown } from './shared/analytics.js';
const esc = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const compact = value => Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(value);
const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function donut(rows,colors,title,currency=false) {
  const total=rows.reduce((sum,row)=>sum+row.value,0);let offset=0;
  const circles=rows.filter(row=>row.value>0).map(row=>{
    const i=rows.indexOf(row),part=row.value/total*100;
    const point=(radius,percent)=>{const angle=percent/100*Math.PI*2-Math.PI/2;return `${180+radius*Math.cos(angle)},${140+radius*Math.sin(angle)}`;};
    const titleText=`<title>${esc(row.name)}: ${currency?money(row.value):row.value}</title>`;
    const html=part>99.999999?`<circle cx="180" cy="140" r="86" fill="none" stroke="${colors[i]}" stroke-width="40">${titleText}</circle>`:`<path fill="${colors[i]}" d="M ${point(106,offset)} A 106 106 0 ${part>50?1:0} 1 ${point(106,offset+part)} L ${point(66,offset+part)} A 66 66 0 ${part>50?1:0} 0 ${point(66,offset)} Z">${titleText}</path>`;
    offset+=part;return html;
  }).join('');
  return `<div class="donut-chart"><svg viewBox="0 0 360 280" role="img" aria-label="${esc(title)}: ${rows.map(row=>`${esc(row.name)} ${currency?money(row.value):row.value}`).join(', ')}"><circle cx="180" cy="140" r="86" fill="none" stroke="#292929" stroke-width="40"/>${circles}<text x="180" y="135" text-anchor="middle" class="donut-total">${currency?compact(total):total}</text><text x="180" y="158" text-anchor="middle" class="donut-caption">${total?'Total no período':'Sem registros'}</text></svg><div class="donut-legend">${rows.map((row,i)=>`<span><i style="background:${colors[i]}"></i>${esc(row.name)}<strong>${currency?money(row.value):row.value}</strong></span>`).join('')}</div></div>`;
}
function ranking(rows,color,title) {
  const max=Math.max(1,...rows.map(row=>row.value));
  return `<div class="ranking-chart" role="img" aria-label="${esc(title)}">${rows.length?rows.map(row=>`<div class="ranking-row"><span class="ranking-name" title="${esc(row.name)}">${esc(row.name)}</span><div class="ranking-track"><span style="width:${row.value/max*100}%;background:${color}"></span></div><span class="ranking-value">${money(row.value)}</span></div>`).join(''):'<div class="empty-state">Nenhuma venda concluída neste período.</div>'}</div>`;
}
export function extraCharts(orders,families) {
  const stats=dashboardBreakdown(orders,families);
  return `<section class="chart-grid extra-charts" aria-label="Análises de vendas"><article class="panel"><h2>Receita por tipo de cliente</h2><p>CNPJ, Parceria e CPF</p>${donut(stats.types,['#3883f5','#f9cc12','#b355d8'],'Receita por tipo de cliente',true)}</article><article class="panel"><h2>Ranking de vendedores</h2><p>Top vendedores por receita · autor do pedido</p>${ranking(stats.sellers,'#3883f5','Ranking de vendedores')}</article><article class="panel"><h2>Top famílias</h2><p>Maiores clientes por receita</p>${ranking(stats.families,'#b355d8','Top famílias')}</article><article class="panel"><h2>Pedidos por status</h2><p>Distribuição no período</p>${donut(stats.statuses,['#f9cc12','#3883f5','#1cc65e'],'Pedidos por status')}</article></section>`;
}
