import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root=resolve('dist');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403);res.end();return;}const target=path===root?resolve(root,'index.html'):path;const content=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});res.end(content);}catch{if(!res.headersSent)res.writeHead(404);res.end('Não encontrado');}}).listen(4173,'127.0.0.1',()=>console.log('Site em http://127.0.0.1:4173'));
