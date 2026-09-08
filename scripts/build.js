import { mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const destination=resolve('dist');
if(destination!==resolve(process.cwd(),'dist'))throw new Error('Destino inválido.');
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
for(const file of ['index.html','styles.css','script.js','config.js','demo.js','assets','shared'])await cp(file,`${destination}/${file}`,{recursive:true});
console.log('Frontend gerado em dist/ (sem backend, banco ou credenciais).');
