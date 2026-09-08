import { orderTotal } from './model.js';
export function dashboardBreakdown(orders, families) {
  const types = { CNPJ:0, Parceria:0, CPF:0 }, sellers = new Map(), clients = new Map();
  const statuses = { 'Orçamento':0, 'Em preparação':0, 'Concluído':0 };
  for (const order of orders) {
    if (order.status in statuses) statuses[order.status]++;
    if (order.status !== 'Concluído') continue;
    const family = families.find(row => row.id === order.familyId);
    const type = ['CNPJ','Parceria','CPF'].includes(order.clientType) ? order.clientType : !order.familyId ? 'CPF' : family?.partner ? 'Parceria' : 'CNPJ';
    const amount = orderTotal(order);types[type] += amount;
    const seller = order.createdBy || 'Não informado';sellers.set(seller,(sellers.get(seller)||0)+amount);
    const name = family?.name || 'Sem família';clients.set(name,(clients.get(name)||0)+amount);
  }
  const rank = map => [...map].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  return { types:Object.entries(types).map(([name,value])=>({name,value})), sellers:rank(sellers).slice(0,5), families:rank(clients).slice(0,10), statuses:Object.entries(statuses).map(([name,value])=>({name,value})) };
}
