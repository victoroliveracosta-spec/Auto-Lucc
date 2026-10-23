/* Cliente compartilhado para o site público e o painel administrativo. */
(function(){
  let client=null;
  window.autoLuccCreateClient=function(){
    const cfg=window.AUTO_LUCC_CONFIG||{};
    if(!cfg.url||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url)||
       !cfg.publishableKey||cfg.publishableKey==='COLE_A_CHAVE_PUBLICAVEL_AQUI'){
      throw new Error('Configuração pendente: conecte o Supabase no arquivo config.js.');
    }
    if(!window.supabase||typeof window.supabase.createClient!=='function'){
      throw new Error('Não foi possível carregar a biblioteca de conexão. Verifique sua internet.');
    }
    if(!client){
      client=window.supabase.createClient(cfg.url,cfg.publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:window.sessionStorage}
      });
    }
    return client;
  };
})();
