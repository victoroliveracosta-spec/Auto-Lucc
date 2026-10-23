AUTO LUCC - SITE + ACOMPANHAMENTO DE VEÍCULOS

O site agora possui consulta pública por código e um painel restrito para a equipe.

IMPORTANTE: o acompanhamento SÓ funciona com o servidor Node.js. Abrir o index.html diretamente no celular NÃO ativa o painel compartilhado. O agendamento por WhatsApp permanece independente.

REQUISITOS: Node.js 18 ou superior e hospedagem com Node.js e armazenamento persistente.

COMO RODAR:
1. Abra um terminal dentro desta pasta.
2. Linux/macOS: export ADMIN_PASSWORD='SUA_SENHA_FORTE_COM_12_OU_MAIS_CARACTERES'
   Windows PowerShell: $env:ADMIN_PASSWORD='SUA_SENHA_FORTE_COM_12_OU_MAIS_CARACTERES'
3. Execute: node server.js
4. Abra: http://localhost:3000
5. Equipe: http://localhost:3000/admin.html

FUNCIONAMENTO:
A equipe entra no painel, registra o modelo do veículo e recebe um código AL-XXXXXXXXXX. Ela informa o código ao cliente e atualiza o status. O cliente entra no site, seção 'Acompanhar lavagem', e consulta esse código.

ETAPAS: Aguardando, Em lavagem, Finalização, Pronto para retirada.

HOSPEDAGEM: configurar HTTPS, variável de ambiente ADMIN_PASSWORD e armazenamento persistente do arquivo vehicles.json (ou usar DATA_FILE apontando para volume persistente). Criar backups do arquivo; sem armazenamento persistente os registros poderão ser perdidos. Não publicar server.js ou vehicles.json em servidores estáticos.

SEGURANÇA: a senha não está no HTML; usar senha forte exclusiva e conexão HTTPS. Para operação em escala, recomendamos autenticação de funcionários, banco de dados gerenciado e bloqueios/rate limits mais robustos.
