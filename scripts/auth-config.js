export function publicApiUrl(value) {
  const raw=String(value || '').trim();
  if(!raw)return '';
  let url;try{url=new URL(raw);}catch{throw new Error('BLACKHEARTS_API_URL deve ser uma URL HTTPS válida.');}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('BLACKHEARTS_API_URL deve conter somente a origem HTTPS do backend, sem senha, caminho, parâmetros ou fragmento.');
  return url.origin;
}
export async function verifyAuthService(baseUrl,frontendUrl,fetchImpl=fetch) {
  const origin=new URL(frontendUrl).origin;
  const response=await fetchImpl(`${publicApiUrl(baseUrl)}/health`,{headers:{Origin:origin},signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok)throw new Error(`Backend indisponível: /health retornou HTTP ${response.status}.`);
  if(response.headers.get('access-control-allow-origin')!==origin)throw new Error('Configure FRONTEND_URL no backend com a URL do GitHub Pages. A origem não foi autorizada.');
  const health=await response.json();
  if(health.ok!==true||health.authConfigured!==true)throw new Error('Configure DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET e ADMIN_DISCORD_ID no backend antes de publicar a integração.');
}
