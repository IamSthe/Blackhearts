import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto('http://127.0.0.1:4173');await page.getByRole('heading',{name:'ACESSO RESTRITO'}).waitFor();
  await page.screenshot({path:'artifacts/login-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Entrar com Discord'}).click();await page.getByRole('status').filter({hasText:'aguarda a configuração'}).waitFor();
  assert.equal(await page.locator('#dashboardView').isVisible(),false);
  await page.getByRole('button',{name:'Explorar demonstração'}).click();await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
  await page.screenshot({path:'artifacts/dashboard-desktop.png',fullPage:true});
  const tabs=['Pedidos','Lavagem','Avisos','Ações','Divulgações','Docs','Famílias e valores','Investigativa','Usuários','Cargos','Cidades','Famílias','Responsáveis','Produtos','Materiais','Preços por cidade','Configurar ações'];
  for(const tab of tabs){await page.getByRole('link',{name:tab,exact:true}).click();await page.getByRole('heading',{name:tab==='Lavagem'?'Lavagem de dinheiro':tab,exact:true}).waitFor();}
  await page.getByRole('link',{name:'Famílias',exact:true}).click();await page.getByRole('button',{name:'Nova família',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Família de teste');await page.getByLabel('Família parceira',{exact:true}).check();await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('cell',{name:'Família de teste',exact:true}).waitFor();
  await page.getByRole('searchbox').fill('Família de teste');assert.equal(await page.locator('tbody tr').count(),1);
  await page.getByRole('button',{name:'Editar Família de teste',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Família alterada');await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('searchbox').fill('Família alterada');await page.getByRole('cell',{name:'Família alterada',exact:true}).waitFor();
  await page.getByRole('button',{name:'Excluir Família alterada',exact:true}).click();await page.getByRole('button',{name:'Excluir',exact:true}).click();await page.getByText('Nenhum registro encontrado',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Pedidos',exact:true}).click();await page.getByRole('button',{name:'Concluir',exact:true}).first().click();await page.getByText('Registro concluído.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Novo pedido',exact:true}).click();await page.getByLabel('Família',{exact:true}).selectOption('family-0');await page.getByLabel('Responsável',{exact:true}).selectOption('person-0');await page.getByLabel('Produto',{exact:true}).selectOption('product-0');await page.getByLabel('Quantidade',{exact:true}).fill('2');await page.getByLabel('Prazo',{exact:true}).fill('2026-10-01T18:00');await page.getByLabel('Status',{exact:true}).selectOption('Em preparação');await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.locator('#editor').waitFor({state:'hidden'});
  await page.screenshot({path:'artifacts/pedidos-desktop.png',fullPage:true});
  await page.getByRole('combobox',{name:'Cidade',exact:true}).selectOption('city-2');await page.getByText('Nenhum registro encontrado',{exact:true}).waitFor();await page.getByRole('combobox',{name:'Cidade',exact:true}).selectOption('city-1');
  await page.reload();await page.getByRole('button',{name:'Explorar demonstração'}).click();await page.getByRole('heading',{name:'Pedidos',exact:true}).waitFor();assert.equal(await page.locator('tbody tr').count(),29);
  await page.getByRole('link',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:'7 dias',exact:true}).click();await page.getByRole('button',{name:'90 dias',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);await page.screenshot({path:'artifacts/dashboard-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Alternar navegação'}).click();await page.getByRole('link',{name:'Pedidos',exact:true}).click();await expect.poll(()=>page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);await page.screenshot({path:'artifacts/pedidos-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Alternar navegação'}).click();await page.getByRole('button',{name:'Sair',exact:true}).click();await page.getByRole('heading',{name:'ACESSO RESTRITO'}).waitFor();assert.deepEqual(errors,[]);
  console.log('PASS: login sem bypass, 17 abas, criar/editar/excluir, busca, concluir/criar pedido, cidade, persistência, filtros, desktop, mobile e logout. Sem erros de JavaScript.');
}finally{await browser.close();}
