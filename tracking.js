(function(){
  const form=document.getElementById('trackingForm');
  const result=document.getElementById('trackingResult');
  const input=document.getElementById('trackingCode');
  const statuses=['Aguardando','Em lavagem','Finalização','Pronto para retirada'];
  let ultimoCodigo='';
  let ocupada=false;
  const renderText=(message)=>{result.classList.add('show');result.textContent=message;};
  async function consultar(mostrarCarregando=true){
    if(ocupada)return;
    const codigo=input.value.trim().toUpperCase();
    if(!/^AL-[A-F0-9]{20}$/.test(codigo)){
      renderText('Confira seu código. Ele começa com AL- e tem 20 caracteres depois do hífen.');
      return;
    }
    ocupada=true;
    ultimoCodigo=codigo;
    if(mostrarCarregando)renderText('Consultando status...');
    try{
      const sb=window.autoLuccCreateClient();
      const {data,error}=await sb.rpc('consultar_lavagem',{codigo});
      if(error)throw error;
      const j=Array.isArray(data)?data[0]:null;
      if(!j){renderText('Código não encontrado. Confirme o código com a equipe Auto Lucc.');return;}
      result.classList.add('show');result.replaceChildren();
      const heading=document.createElement('h3');
      heading.textContent=j.etapa;
      heading.style.cssText='color:#e9bd65;font-size:29px;margin:0 0 12px';
      const desc=document.createElement('p');
      desc.textContent=j.etapa==='Pronto para retirada'?'Seu veículo está pronto! Você já pode consultar a equipe para fazer a retirada.':'Sua lavagem está em andamento. O status será atualizado pela equipe.';
      const date=document.createElement('p');date.className='track-small';
      date.textContent='Última atualização: '+new Date(j.atualizado_em).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
      const steps=document.createElement('div');steps.className='track-step-list';
      statuses.forEach((name,i)=>{
        const d=document.createElement('div');
        d.className='track-step'+(i<=statuses.indexOf(j.etapa)?' done':'');
        d.textContent=name;steps.appendChild(d);
      });
      result.append(heading,desc,date,steps);
    }catch(e){
      console.error('Falha no acompanhamento',e);
      renderText(e?.message?.includes('Configuração')?e.message:'A consulta está indisponível no momento. Tente novamente ou contate a Auto Lucc no WhatsApp.');
    }finally{ocupada=false;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();consultar(true);});
  // Se o cliente abrir um link individual da equipe, preencher e consultar automaticamente.
  const codigoDaUrl=new URLSearchParams(window.location.search).get('codigo');
  if(codigoDaUrl && /^AL-[A-F0-9]{20}$/.test(codigoDaUrl.trim().toUpperCase())){
    input.value=codigoDaUrl.trim().toUpperCase();
    consultar(true);
  }
  // Atualiza o status enquanto o cliente acompanha, sem precisar recarregar a página.
  setInterval(()=>{if(ultimoCodigo&&!document.hidden&&input.value.trim().toUpperCase()===ultimoCodigo)consultar(false);},30000);
})();
