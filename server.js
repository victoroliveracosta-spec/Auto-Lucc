"use strict";
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const PORT=Number(process.env.PORT||3000),PASSWORD=process.env.ADMIN_PASSWORD,DB=process.env.DATA_FILE||path.join(__dirname,'vehicles.json');
if(!PASSWORD||PASSWORD.length<12){console.error('Defina ADMIN_PASSWORD com 12 ou mais caracteres antes de iniciar.');process.exit(1)}
const states=['Aguardando','Em lavagem','Finalização','Pronto para retirada'];
let vehicles=[];try{vehicles=JSON.parse(fs.readFileSync(DB,'utf8'));if(!Array.isArray(vehicles))throw Error('Formato inválido')}catch(e){if(e.code!=='ENOENT')throw e}
function save(){const tmp=DB+'.tmp';fs.writeFileSync(tmp,JSON.stringify(vehicles,null,2),{mode:0o600});fs.renameSync(tmp,DB)}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function authed(req){const a=Buffer.from(String(req.headers['x-admin-password']||'')),b=Buffer.from(PASSWORD);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>5000){reject(Error('Dados excessivos'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('JSON inválido'))}});req.on('error',reject)})}
const recent=new Map();function limited(ip){const now=Date.now(),a=(recent.get(ip)||[]).filter(t=>now-t<60000);a.push(now);recent.set(ip,a);return a.length>45}
const files={'/':'index.html','/index.html':'index.html','/admin.html':'admin.html'};
const server=http.createServer(async(req,res)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{return send(res,400,{error:'URL inválida'})}const route=u.pathname;
if(route.startsWith('/api/')){if(limited(req.socket.remoteAddress||'?'))return send(res,429,{error:'Muitas consultas. Tente novamente em um minuto.'});
if(req.method==='GET'&&route.startsWith('/api/status/')){const code=decodeURIComponent(route.slice('/api/status/'.length)).toUpperCase();const v=vehicles.find(x=>x.code===code);return v?send(res,200,{vehicle:v.vehicle,status:v.status,updatedAt:v.updatedAt}):send(res,404,{error:'Código não encontrado. Confira com a equipe.'})}
if(!authed(req))return send(res,401,{error:'Senha inválida'});
if(req.method==='GET'&&route==='/api/admin/vehicles')return send(res,200,{vehicles:vehicles.slice().reverse()});
if(req.method==='POST'&&route==='/api/admin/vehicles'){try{const j=await body(req);if(typeof j.vehicle!=='string'||!j.vehicle.trim()||j.vehicle.length>60||!states.includes(j.status))return send(res,400,{error:'Preencha modelo e etapa corretamente.'});let code;do{code='AL-'+crypto.randomBytes(5).toString('hex').toUpperCase()}while(vehicles.some(v=>v.code===code));const v={code,vehicle:j.vehicle.trim(),status:j.status,updatedAt:new Date().toISOString()};vehicles.push(v);save();return send(res,201,v)}catch{return send(res,400,{error:'Não foi possível criar acompanhamento.'})}}
if(req.method==='PATCH'&&route.startsWith('/api/admin/vehicles/')){try{const j=await body(req);const v=vehicles.find(x=>x.code===decodeURIComponent(route.slice('/api/admin/vehicles/'.length)));if(!v)return send(res,404,{error:'Veículo não encontrado'});if(!states.includes(j.status))return send(res,400,{error:'Etapa inválida'});v.status=j.status;v.updatedAt=new Date().toISOString();save();return send(res,200,v)}catch{return send(res,400,{error:'Não foi possível atualizar.'})}}
return send(res,404,{error:'Rota não encontrada'})}
if(req.method!=='GET')return send(res,405,{error:'Método não permitido'});
const f=files[route];if(!f){res.writeHead(404);return res.end('Página não encontrada')}
res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(__dirname,f)).pipe(res)
});server.listen(PORT,()=>console.log('Auto Lucc disponível na porta '+PORT));
