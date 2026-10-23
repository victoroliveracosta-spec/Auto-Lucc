(function(){
const $=id=>document.getElementById(id);
const login=$('loginCard'),workspace=$('workspace'),entries=$('entries');
const statuses=['Aguardando','Em lavagem','Finalização','Pronto para retirada'];
let sb;
function notice(element,text,isError=false){element.textContent=text;element.classList.toggle('error',isError);}
function showLogin(){workspace.hidden=true;login.hidden=false;}
async function checkAdmin(){
  const {data,error}=await sb.from('auto_lucc_admins').select('user_id').limit(1);
  if(error||!data||data.length===0)throw new Error('Seu usuário não está autorizado no painel. Peça ao proprietário para liberar o acesso.');
}
async function showWorkspace(){
  await checkAdmin();
  const {data:{user}}=await sb.auth.getUser();
  $('userEmail').textContent=user?.email||'';
  login.hidden=true;workspace.hidden=false;
  await refresh();
}
function formatDate(date){return new Date(date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}
function shareLink(code){const link=new URL('index.html',window.location.href);link.searchParams.set('codigo',code);link.hash='acompanhar';return link.href;}
function appendEntry(entry){
 const row=document.createElement('div');row.className='entry';
 const info=document.createElement('div');const code=document.createElement('strong');code.textContent=entry.code;
 const model=document.createElement('p');model.textContent=entry.vehicle+' · '+formatDate(entry.updated_at);
 const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar código e link';
 copy.addEventListener('click',async()=>{
  const msg='Auto Lucc: acompanhe sua lavagem em '+shareLink(entry.code)+'\nCódigo: '+entry.code;
  try{await navigator.clipboard.writeText(msg);copy.textContent='Copiado!';setTimeout(()=>copy.textContent='Copiar código e link',1800)}
  catch{window.prompt('Copie e envie ao cliente:',msg)}
 });
 info.append(code,model,copy);
 const statusBox=document.createElement('div');statusBox.className='status-box';
 const label=document.createElement('label');label.textContent='Situação da lavagem';
 const select=document.createElement('select');
 statuses.forEach(st=>{const option=new Option(st,st,st===entry.status,st===entry.status);select.add(option)});
 select.addEventListener('change',async()=>{
   const old=entry.status;select.disabled=true;
   try{
     const {error}=await sb.from('auto_lucc_lavagens').update({status:select.value}).eq('id',entry.id);
     if(error)throw error;
     entry.status=select.value;
     notice($('workspaceMessage'),'Status atualizado: '+entry.code+' — '+entry.status);
     await refresh();
   }catch(e){select.value=old;notice($('workspaceMessage'),'Não foi possível atualizar: '+e.message,true)}
   finally{select.disabled=false}
 });
 statusBox.append(label,select);row.append(info,statusBox);entries.appendChild(row);
}
async function refresh(){
 const {data,error}=await sb.from('auto_lucc_lavagens').select('id,code,vehicle,status,updated_at').order('created_at',{ascending:false}).limit(250);
 if(error)throw error;
 entries.replaceChildren();
 if(data.length===0){entries.textContent='Ainda não há lavagens cadastradas.';return;}
 data.forEach(appendEntry);
}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('loginButton');btn.disabled=true;
 notice($('loginMessage'),'Validando acesso...');
 try{
   sb=window.autoLuccCreateClient();
   const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
   if(error)throw error;
   await showWorkspace();
   $('password').value='';
   notice($('loginMessage'),'');
 }catch(e){notice($('loginMessage'),'Não foi possível entrar: '+e.message,true);showLogin()}
 finally{btn.disabled=false}
});
$('createForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=$('createButton');btn.disabled=true;
 try{
   const vehicle=$('vehicle').value.trim();
   if(!vehicle)throw Error('Informe o veículo.');
   const {data,error}=await sb.from('auto_lucc_lavagens').insert({vehicle,status:$('stage').value}).select('code').single();
   if(error)throw error;
   $('vehicle').value='';
   notice($('created'),'Acompanhamento criado! Código: '+data.code+'. Use o botão “Copiar código e link” para enviar ao cliente.');
   await refresh();
 }catch(err){notice($('created'),'Falha ao cadastrar: '+err.message,true)}
 finally{btn.disabled=false}
});
$('logoutButton').addEventListener('click',async()=>{await sb.auth.signOut();showLogin();notice($('loginMessage'),'Você saiu do painel.')});
$('refreshButton').addEventListener('click',async()=>{try{await refresh();notice($('workspaceMessage'),'Lista atualizada.')}catch(e){notice($('workspaceMessage'),e.message,true)}});
(async()=>{
 try{
   sb=window.autoLuccCreateClient();
   const {data:{session}}=await sb.auth.getSession();
   if(session)await showWorkspace();
 }catch(e){showLogin();notice($('loginMessage'),e.message,true)}
})();
})();
