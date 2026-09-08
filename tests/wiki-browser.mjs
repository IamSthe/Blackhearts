import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:4173/');
  assert.ok(await page.locator('.login-crest').evaluate(img=>img.complete&&img.naturalWidth===500));
  await page.getByRole('button',{name:'Explorar demonstração'}).click();
  for(const title of ['Receita por tipo de cliente','Ranking de vendedores','Top famílias','Pedidos por status'])await page.getByRole('heading',{name:title,exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Docs',exact:true}).count(),0);assert.equal(await page.getByRole('link',{name:'Divulgações',exact:true}).count(),0);
  await page.screenshot({path:'artifacts/dashboard-graphs.png',fullPage:true});
  await page.getByRole('combobox',{name:'Cidade',exact:true}).selectOption('city-2');await expect(page.locator('.extra-charts')).toContainText('Nenhuma venda concluída');await page.getByRole('combobox',{name:'Cidade',exact:true}).selectOption('city-1');
  await page.getByRole('link',{name:'Famílias e valores',exact:true}).click();const aura=page.locator('details.category').filter({hasText:'AURA'});await aura.locator('summary').click();await expect(aura.locator('.category-text')).toContainText('M19 - 30k');await page.screenshot({path:'artifacts/familias-valores.png',fullPage:true});
  await aura.locator('summary').click();await expect(aura.locator('.category-text')).toBeHidden();
  await page.getByRole('link',{name:'Investigativa',exact:true}).click();let vehicles=page.locator('details.category').filter({has:page.locator('.category-title',{hasText:'Veículos'})});await vehicles.locator('summary').click();
  await vehicles.getByLabel('Observações',{exact:true}).fill('Observação de teste <script>alert(1)</script>');await vehicles.getByRole('button',{name:'Salvar observações',exact:true}).click();await page.getByText('Observações salvas.',{exact:true}).waitFor();
  await vehicles.locator('input[type=file]').setInputFiles({name:'evidencia.txt',mimeType:'text/plain',buffer:Buffer.from('Evidência de teste em UTF-8.')});await vehicles.getByText('evidencia.txt',{exact:true}).waitFor();
  const downloadPromise=page.waitForEvent('download');await vehicles.getByRole('button',{name:'Baixar evidencia.txt'}).click();const download=await downloadPromise;assert.equal((await readFile(await download.path())).toString(),'Evidência de teste em UTF-8.');
  await page.screenshot({path:'artifacts/investigativa.png',fullPage:true});
  await page.reload();await page.getByRole('button',{name:'Explorar demonstração'}).click();vehicles=page.locator('details.category').filter({has:page.locator('.category-title',{hasText:'Veículos'})});await vehicles.locator('summary').click();await expect(vehicles.getByLabel('Observações',{exact:true})).toHaveValue('Observação de teste <script>alert(1)</script>');await vehicles.getByText('evidencia.txt',{exact:true}).waitFor();
  await vehicles.getByRole('button',{name:'Editar Veículos',exact:true}).click();await page.getByLabel('Categoria',{exact:true}).fill('Veículos monitorados');await page.getByRole('button',{name:'Salvar',exact:true}).click();await vehicles.getByText('evidencia.txt',{exact:true}).waitFor();
  await vehicles.getByRole('button',{name:'Remover evidencia.txt'}).click();await page.getByRole('button',{name:'Remover',exact:true}).click();await expect(vehicles).toContainText('Nenhum anexo');
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);await page.screenshot({path:'artifacts/investigativa-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS: logo original, quatro gráficos, filtros, categorias expansíveis, observações, upload, download, persistência, edição sem perder anexos, remoção e mobile.');
}finally{await browser.close();}
