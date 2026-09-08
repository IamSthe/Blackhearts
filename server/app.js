import http from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { schemas, emptyData, allowed, validate, deletionError, stampRecord } from '../shared/model.js';

const random = () => randomBytes(32).toString('base64url');
const hash = value => createHash('sha256').update(String(value)).digest('hex');
const same = (a,b) => typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createApp({ database=':memory:', frontendUrl, apiUrl, clientId='', clientSecret='', adminDiscordId='', fetchImpl=fetch }) {
  const front=new URL(frontendUrl);const db=new DatabaseSync(database);
  db.exec('CREATE TABLE IF NOT EXISTS records (entity TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(entity,id)); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);');
  const states=new Map(), codes=new Map();
  const load=()=>{const data=emptyData();for(const row of db.prepare('SELECT * FROM records').all())if(data[row.entity])data[row.entity].push(JSON.parse(row.body));return data;};
  const put=(entity,row)=>db.prepare('INSERT OR REPLACE INTO records VALUES(?,?,?)').run(entity,row.id,JSON.stringify(row));
  // Only the explicitly configured owner is bootstrapped; an arbitrary first visitor is never admin.
  if(adminDiscordId && !/^\d{17,20}$/.test(adminDiscordId))throw new Error('ADMIN_DISCORD_ID inválido.');
  if(adminDiscordId&&!load().usuarios.some(row=>row.discordId===adminDiscordId))put('usuarios',{id:random(),discordId:adminDiscordId,name:'Administrador',discordName:'',email:'',roleId:'',cityId:'',active:true,admin:true});
  function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
  function fail(status,message){const error=new Error(message);error.status=status;throw error;}
  async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>65536)fail(413,'Solicitação muito grande.');}try{return text?JSON.parse(text):{};}catch{fail(400,'JSON inválido.');}}
  function session(req){const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];if(!bearer)fail(401,'Entre novamente com Discord.');const row=db.prepare('SELECT * FROM sessions WHERE hash=? AND expires>?').get(hash(bearer),Date.now());if(!row)fail(401,'Sessão expirada. Entre novamente.');const user=load().usuarios.find(item=>item.id===row.user_id);if(!user?.active)fail(401,'Acesso desativado.');return user;}
  function cleanup(){const now=Date.now();for(const map of [states,codes])for(const [key,value] of map)if(value.expires<now)map.delete(key);db.prepare('DELETE FROM sessions WHERE expires<?').run(now);}
  function redirect(res,path){res.writeHead(302,{Location:path});res.end();}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const origin=req.headers.origin;
    if(origin===front.origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');}
    if(origin&&origin!==front.origin)return send(res,403,{error:'Origem não autorizada.'});
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    const url=new URL(req.url,apiUrl);
    try{
      cleanup();
      if(url.pathname==='/health'&&req.method==='GET')return send(res,200,{ok:true,authConfigured:!!(clientId&&clientSecret&&adminDiscordId)});
      if(url.pathname==='/auth/start'&&req.method==='POST'){
        if(!clientId||!clientSecret||!adminDiscordId)fail(503,'A autenticação Discord ainda não foi configurada.');
        if(states.size>500)fail(429,'Muitas tentativas. Tente novamente em alguns minutos.');
        const state=random(),verifier=random();states.set(state,{verifierHash:hash(verifier),expires:Date.now()+600000});
        const target=new URL('https://discord.com/oauth2/authorize');target.search=new URLSearchParams({client_id:clientId,redirect_uri:`${apiUrl}/auth/callback`,response_type:'code',scope:'identify',state}).toString();
        return send(res,200,{url:target.href,verifier});
      }
      if(url.pathname==='/auth/callback'&&req.method==='GET'){
        const state=url.searchParams.get('state');const pending=states.get(state);states.delete(state);
        if(!pending||pending.expires<Date.now()||url.searchParams.has('error')||!url.searchParams.get('code'))return redirect(res,`${frontendUrl}#auth_error=denied`);
        try{
          const exchange=await fetchImpl('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:`${apiUrl}/auth/callback`}),signal:AbortSignal.timeout(15000)});
          if(!exchange.ok)throw new Error('OAuth');const oauth=await exchange.json();
          const profileResponse=await fetchImpl('https://discord.com/api/users/@me',{headers:{Authorization:`Bearer ${oauth.access_token}`},signal:AbortSignal.timeout(15000)});
          if(!profileResponse.ok)throw new Error('Discord');const profile=await profileResponse.json();
          const user=load().usuarios.find(row=>row.discordId===profile.id&&row.active);if(!user)throw new Error('Unauthorized');
          user.discordName=String(profile.username || '').slice(0,200);user.avatar=/^[a-zA-Z0-9_]+$/.test(profile.avatar || '')?`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`:'';put('usuarios',user);
          const code=random();codes.set(hash(code),{userId:user.id,verifierHash:pending.verifierHash,expires:Date.now()+60000});
          return redirect(res,`${frontendUrl}#auth_code=${code}`);
        }catch{return redirect(res,`${frontendUrl}#auth_error=denied`);}
      }
      if(url.pathname==='/auth/exchange'&&req.method==='POST'){
        const input=await body(req);const key=hash(input.code);const pending=codes.get(key);
        if(!pending||pending.expires<Date.now()||!same(pending.verifierHash,hash(input.verifier)))fail(401,'Autorização inválida. Entre novamente.');
        codes.delete(key);const user=load().usuarios.find(row=>row.id===pending.userId&&row.active);if(!user)fail(403,'Acesso desativado.');
        const token=random();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+8*3600000);return send(res,200,{token});
      }
      if(url.pathname==='/auth/logout'&&req.method==='POST'){session(req);db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(req.headers.authorization.slice(7)));return send(res,200,{ok:true});}
      const user=session(req);const data=load();
      if(url.pathname==='/api/data'&&req.method==='GET'){if(!user.admin)data.usuarios=[];return send(res,200,{data,user});}
      const match=url.pathname.match(/^\/api\/([a-z]+)(?:\/([A-Za-z0-9_-]+))?$/);const [,entity,id]=match || [];
      if(!schemas[entity])fail(404,'Rota não encontrada.');
      if(!allowed(user,entity,data))fail(403,'Seu cargo não permite alterar este cadastro.');
      if(!['POST','PUT','DELETE'].includes(req.method)||(req.method==='POST'&&id)||(req.method!=='POST'&&!id))fail(405,'Método não permitido.');
      const previous=data[entity].find(row=>row.id===id);if(id&&!previous)fail(404,'Registro não encontrado.');
      if(req.method==='DELETE'){
        if(entity==='usuarios'&&id===user.id)fail(400,'Você não pode excluir seu próprio acesso.');
        const error=deletionError(entity,id,data);if(error)fail(409,error);
        db.prepare('DELETE FROM records WHERE entity=? AND id=?').run(entity,id);if(entity==='usuarios')db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
        return send(res,200,{ok:true});
      }
      const input=await body(req);let values;try{values=validate(entity,{...input,id},data);}catch(error){fail(400,error.message);}
      if(entity==='usuarios'&&id===user.id&&(!values.admin||!values.active))fail(400,'Mantenha seu próprio acesso administrativo ativo.');
      const record=stampRecord(entity,values,previous,user);put(entity,record);
      if(entity==='usuarios'&&!record.active)db.prepare('DELETE FROM sessions WHERE user_id=?').run(record.id);
      return send(res,req.method==='POST'?201:200,{record});
    }catch(error){return send(res,error.status || 500,{error:error.status?error.message:'Erro interno. Tente novamente.'});}
  });
  return {server,db,load,close:()=>new Promise(resolve=>server.close(()=>{db.close();resolve();}))};
}
