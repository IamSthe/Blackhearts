# Blackhearts — sistema interno

Interface preta baseada nas referências, com dashboard, pedidos, lavagem (roleplay), avisos, ações, Wiki e cadastros. A logo original enviada está em `assets/blackhearts-logo.png`, preservada sem alteração do arquivo; o CSS a exibe em branco no fundo escuro.

## O que funciona

- Navegação entre 16 páginas; menu recolhível e layout para celular.
- Cadastro, edição e exclusão; busca, filtros, seleção de cidade, pedidos com conclusão e cálculo de materiais.
- Indicadores e gráficos calculados a partir dos pedidos. Receita usa pedidos concluídos; líquido é receita menos comissão, não confirmação de depósito bancário.
- Gráficos adicionais: receita por tipo de cliente, ranking de vendedores, top famílias e pedidos por status. Todos respeitam cidade e período. Vendedor é o autor do pedido; pedidos antigos sem tipo usam a parceria da família, ou CPF quando não há família. O campo Tipo de cliente permite selecionar CNPJ, Parceria ou CPF nos novos pedidos.
- Wiki com apenas Famílias e valores e Investigativa, cada uma reunindo categorias expansíveis em uma página. Docs e Divulgações foram removidas. Registros antigos dessas abas não são apagados do banco, mas não são expostos pela aplicação.
- Investigativa permite observações e até cinco anexos por categoria, com upload, download e remoção. PNG, JPG, WebP, PDF e TXT de até 2 MB por arquivo, com total de 6 MB por categoria. O backend persiste os arquivos no SQLite; na demonstração, o limite total de armazenamento depende do navegador. Arquivos são baixados sem execução inline. Notas e anexos não vão para o GitHub.
- Demonstração com dados fictícios, separada do ambiente autenticado, persistida em `localStorage` no navegador. Não use a demonstração para dados reais: ela é pública e não é um sistema compartilhado.
- Backend Node/SQLite com OAuth2 Discord, pré-cadastro por ID, usuários ativos, sessões de oito horas, logout, cargos e permissões de escrita verificadas no servidor.

## Estado da autenticação

O código do fluxo OAuth está implementado, mas **o Discord real só funciona depois de configurar e hospedar o backend**. Sem `apiBaseUrl`, o botão explica que a configuração está pendente; ele nunca simula login nem libera dados privados. A autorização é exibida pelo próprio Discord, solicitando apenas `identify` (nome e avatar); não há necessidade de solicitar e-mail.

O GitHub Pages hospeda somente a interface. Visitantes anônimos veem a tela de entrada e podem abrir a demonstração identificada como tal. O banco real fica no servidor; nenhum cadastro pessoal é incluído no build. O painel autenticado exige usuário ativo e pré-cadastrado. Membros ativos podem ler os registros operacionais e os cargos, mas a lista de usuários é exclusiva de administradores. Cargos controlam as alterações por módulo; cidades são filtros, não fronteiras de permissão.

## Executar e verificar

Requer Node 22.15 ou superior.

```sh
npm ci
npm test
npm run build
npm run dev
```

Abra `http://127.0.0.1:4173/`. Em outro terminal:

```sh
npx playwright install chromium
npm run test:browser
```

As capturas de desktop e celular ficam em `artifacts/`. Os testes do backend usam respostas simuladas do Discord: verificam state, vínculo da autorização ao navegador, bloqueio de reutilização de códigos, pré-cadastro, bloqueio de inativos, permissões, logout e validação de registros. Não substituem a autorização real com uma conta Discord.

## Ativar Discord e dados compartilhados

1. Hospede `server/index.js` em um serviço Node com HTTPS e disco persistente. Comando: `npm start`. Configure as variáveis de `.env.example` pelo painel do provedor (o servidor não lê `.env` automaticamente).
2. No [Discord Developer Portal](https://discord.com/developers/applications), crie ou selecione o aplicativo Blackhearts. Cadastre em OAuth2 a URL exata `https://SEU-BACKEND/auth/callback`.
3. No backend, configure `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `ADMIN_DISCORD_ID` (ID numérico do primeiro administrador), `FRONTEND_URL=https://iamsthe.github.io/Blackhearts/`, `API_URL` e `DATABASE_PATH` apontando para o disco persistente. Nunca publique o secret no repositório ou no JavaScript da página.
4. Em `config.js`, preencha apenas `apiBaseUrl` com a URL pública HTTPS do backend. Opcionalmente use `allowDemo: false` para ocultar a demonstração.
5. Entre com o Discord do administrador. Cadastre cidades e cargos, depois usuários com seus IDs numéricos. O primeiro visitante não vira administrador; somente o ID explicitamente configurado recebe esse acesso inicial.
6. Valide com uma conta autorizada e outra não cadastrada, e confira a tela anônima em uma janela anônima.

O banco começa vazio, com apenas o administrador inicial. Não há importação de nomes, e-mails ou contatos pessoais das imagens. Pedidos atualmente têm um produto e uma quantidade por registro; registre produtos distintos em pedidos separados. O painel sincroniza com o backend a cada 30 segundos. Mantenha uma única instância do backend (estados OAuth pendentes em memória) e faça backup do disco SQLite. Reiniciar o serviço pode exigir reiniciar um login pendente.

Referência oficial: [OAuth2 do Discord](https://docs.discord.com/developers/topics/oauth2).

## GitHub Pages existente

A publicação permanece em `https://iamsthe.github.io/Blackhearts/`. Ao mesclar o PR em `main`, `.github/workflows/pages.yml` executa testes, gera `dist/` e publica pelo GitHub Actions. Apenas arquivos públicos são enviados, sem backend, testes, banco ou variáveis de ambiente. O workflow de PR valida o frontend e gera capturas para revisão; contribuições de fork podem exigir que o mantenedor autorize a primeira execução do workflow.
