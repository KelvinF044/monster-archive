# Fase 2.5 — Comunidade

A Fase 2.5 foi homologada no Supabase `monster-archive-test` pelo Preview da
branch `feat/community` e publicada no site oficial com o Supabase `monster-archive-br`.

| Etapa | Escopo |
| --- | --- |
| 2.5.1 Contas | Botão Login no cabeçalho, formulário único, cadastro, confirmação e recuperação, Minha conta e acesso à gestão por papel |
| 2.5.2 Perfis | `@usuário`, bio, avatar, bias e Era opcionais, controles de exposição e visualização como visitante |
| 2.5.3 Favoritos | Salvar vídeos no Watch e consultar em Minha Biblioteca, privado por padrão |
| 2.5.4 Histórico | Histórico privado, pausa, remoção e limpeza, com Continuar assistindo após validar o progresso no player |
| 2.5.5 Listas | Listas privadas por padrão, compartilhamento explícito e acesso em Minha Biblioteca |
| 2.5.6 Moderação | Denúncias, fila e registro de ações com permissões próprias |
| 2.5.7–2.5.8 Validação e publicação | Homologação PT-BR e inglês, revisão do responsável, deploy oficial e atualização do Roadmap 3.0 |

## Contas na homologação

- `/login` é o formulário de todos. O link antigo `/admin/login` encaminha
  para o mesmo formulário, preservando o retorno ao painel.
- O membro entra em Minha conta. O botão Gerenciar aparece na conta de
  administradores e moderadores ativos. Para o moderador, `/admin` abre a
  fila de denúncias da Etapa 2.5.6.
- A condição de administrador continua sendo determinada em `admin_users`.
  A condição de moderador é determinada em `community_moderators`. A sessão
  comum pode consultar apenas a própria associação ativa e as APIs
  administrativas continuam exigindo um administrador ativo.
- Use a migração `20261127152853_community_moderators.sql` e o teste transacional
  `supabase/checks/phase_2_5_1_moderator_roles.sql` em homologação.

## Validação da Etapa 2.5.1 em 27/11/2026

- Kelvin validou o login em desktop e celular, a chegada em Minha conta e o
  redirecionamento para `/admin` pelo botão Gerenciar.
- Kelvin confirmou o recebimento dos e-mails de cadastro e recuperação no
  ambiente de homologação.
- Login, cadastro, solicitação de recuperação e redefinição de senha usam o
  mesmo fundo degradê. A personalização de Minha conta fica na Etapa 2.5.2.

## Validação do e-mail

No painel de Auth do Supabase de homologação, confirmar o SMTP e o envio para
um destinatário de teste autorizado. Configurar o endereço do Preview nas URLs
de redirecionamento permitidas para `/auth/callback`, incluindo o parâmetro
`sb_flow_id` que o Supabase acrescenta durante o fluxo PKCE. Os modelos de
confirmação e recuperação usam o link `ConfirmationURL` do Supabase.
Validar confirmação, reenvio, recuperação e link expirado em PT-BR e inglês
com o link aberto no mesmo navegador que fez a solicitação.


## Etapa 2.5.2 — Perfis e privacidade

- Em Minha conta o membro escolhe nome de exibição, @usuário, bio, avatar por
  iniciais ou retrato de integrante, tema, bias e Era favorita.
- O perfil nasce privado. O dono pode torná-lo público, ver como visitante e
  compartilhar o link `/u/<usuário>`. O e-mail fica na conta autenticada.
- Os controles de favoritos e histórico são independentes, vêm desativados
  e serão usados pelas próximas etapas. A publicação do perfil é uma
  condição adicional para exibir essas atividades.
- Em 27/11/2026 Kelvin aprovou o degradê dos formulários no Preview e
  autorizou avançar para perfis. A configuração de produção continua
  condicionada à aprovação da fase.
- Migração `20261127170112_community_profiles.sql` e verificação
  `phase_2_5_2_profiles.sql` no Supabase de homologação.

## Etapa 2.5.3 — Favoritos e Minha Biblioteca

- A prévia do perfil responde ao avatar, tema e outros dados editáveis antes do
  salvamento. A visibilidade e os links continuam baseados no perfil salvo.
  Minha conta e o perfil público usam um degradê roxo discreto.
- O botão de coração aparece nos cards de coleções e nas páginas de vídeo
  para membros. Minha Biblioteca permite abrir e remover os vídeos favoritos.
- Favoritos são únicos por conta e vídeo. A biblioteca mostra só vídeos
  publicados que pertençam a uma coleção ativa.
- O perfil público exibe os 24 favoritos mais recentes apenas quando a
  visibilidade do perfil e a preferência de favoritos estiverem ativas.
- Migração `20261127173939_community_favorites.sql` e verificação
  `phase_2_5_3_favorites.sql` no Supabase de homologação.
- O MV oficial CLIK CLAK serve de amostra no catálogo do Preview.

## Etapa 2.5.4 — Histórico

- O bloco Status no arquivo é renderizado no Watch apenas para administradores
  ou moderadores ativos. Data e fonte continuam visíveis no catálogo.
- O player registra vídeos publicados após o evento de reprodução do YouTube.
  O progresso é atualizado a cada 15 segundos e ao pausar ou sair.
- A aba Histórico da Minha Biblioteca permite retomar um vídeo do ponto
  salvo, pausar/retomar o registro, remover um item e limpar o histórico.
  Alterações de registro e exclusões invalidam envios pendentes de abas antigas.
- O histórico é privado por padrão. Quando o usuário tem perfil público e
  ativa o compartilhamento, os 24 vídeos mais recentes aparecem no perfil,
  sem progresso, horário ou status de conclusão.
- Migração `20261127181117_community_watch_history.sql` e verificação
  `phase_2_5_4_watch_history.sql` no Supabase de homologação.

## Etapa 2.5.5 — Listas personalizadas

- Kelvin confirmou o registro real do histórico no Preview. O aviso e o atalho
  abaixo do player ficam reservados a administradores e moderadores ativos.
  Cada membro acessa seus registros e controles na Minha Biblioteca.
- A aba Listas permite criar listas privadas por padrão, editar nome e
  descrição, reorganizar e remover vídeos e excluir uma lista com confirmação.
- Adicionar à lista fica na página de um vídeo do Watch, para membros
  autenticados. Um vídeo aparece uma única vez em cada lista.
- Tornar a lista pública ativa um link compartilhável. Cada lista tem sua
  própria visibilidade, independente do perfil, e mostra a visitantes apenas
  os vídeos publicados em coleções ativas. Voltar para privada retira o acesso
  pelo link.
- Migração `20261127203430_community_lists.sql` e verificação
  `phase_2_5_5_lists.sql` no Supabase de homologação.
- CLIK CLAK e BILLIONAIRE estão publicados no catálogo de homologação
  como amostras para testar a ordenação.


## Etapa 2.5.6 — Moderação

- Kelvin validou as listas no Preview. O seletor Adicionar à lista fecha ao
  clicar fora, pressionar Esc ou sair da página do vídeo.
- O player envia o ponto mais recente ao pausar, sair ou ocultar a aba.
  A Minha Biblioteca atualiza a posição depois que o envio termina,
  inclusive em navegações pelo botão Voltar.
- Membros autenticados podem denunciar perfis e listas públicas de outras
  contas. Uma conta pode ter uma denúncia pendente por conteúdo, com limite
  de 12 denúncias por hora.
- Administradores e moderadores ativos acessam a fila em `/admin/moderation`.
  Eles podem resolver, descartar ou ocultar o conteúdo e registrar a decisão.
  As decisões registram data, papel da equipe e nota interna opcional.
- Ao retirar a restrição, o conteúdo volta a poder ser publicado pelo autor
  e permanece privado até que ele escolha publicá-lo.
- Migração `20261127210334_community_moderation.sql` e verificação
  `supabase/checks/phase_2_5_6_moderation.sql` em homologação.

## Etapa 2.5.7 — Validação integrada em homologação

- Kelvin aprovou a tela de Moderação no Preview e identificou que o conteúdo
  da fila permanecia no idioma anterior ao usar o seletor. O seletor agora
  atualiza também os componentes de servidor da rota ativa.
- A verificação em navegador alternou PT-BR e inglês nos dois sentidos sem
  recarga manual. Cobriu Moderação em desktop e celular, filtros e histórico
  de decisões, navegação de volta e preservação de uma nota em edição.
  Também cobriu login, cadastro, recuperação, conta, perfil público, Watch,
  favoritos, histórico e listas. A interface em navegador usou dados e
  papéis simulados em uma execução local do build.
- Build, lint e os 80 testes do repositório passaram. Os seis roteiros SQL
  da Fase 2.5 passaram no Supabase de homologação com transações revertidas.
- O responsável aprovou a publicação da etapa 2.5.8 após homologar as correções.

### Retorno da homologação

- Kelvin confirmou no Preview que a retomada acompanha a última posição
  assistida no player real do YouTube e que os links de confirmação de
  cadastro abrem corretamente. O fluxo de recuperação de senha também foi
  confirmado, com recebimento do e-mail em cerca de um minuto.
- Cadastro e recuperação abrem um formulário limpo ao voltar à tela. O
  teste em navegador com respostas simuladas verificou reenvio de
  confirmação, retorno pelo login, nova solicitação e retorno pelo
  histórico do navegador em português e inglês.
- Em testes com endereços reais, a confirmação de cadastro chegou à caixa
  de entrada do Gmail e à pasta de spam do Hotmail. O e-mail de recuperação
  chegou à caixa de entrada. A classificação no Hotmail continua pendente de
  análise dos cabeçalhos da mensagem.
- Os textos e as datas da fila de Moderação usam o contexto do seletor de
  idiomas. As consultas e a verificação de acesso continuam no servidor.

### Remetente dos e-mails de autenticação

- A configuração pertence a cada projeto Supabase. Para enviar como
  MONSTER ARCHIVE no projeto oficial, configurar SMTP próprio com um
  endereço do domínio verificado e personalizar os modelos de confirmação
  e recuperação no Supabase Auth. Preservar `{{ .ConfirmationURL }}` em
  ambos os modelos para manter o fluxo de autenticação já homologado.
- Validar o remetente, o texto e o destino dos links com um endereço de
  teste autorizado antes de abrir o cadastro ao público.
- Referências: [SMTP personalizado](https://supabase.com/docs/guides/auth/auth-smtp)
  e [modelos de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates).

## Perfis da comunidade no painel

- O menu e o painel de administração levam a `/admin/profiles`. A área
  exige um administrador ativo na rota, nas consultas e nas edições.
- A lista inclui cadastros sem perfil, ordena pela data de cadastro e
  busca por nome ou @usuário. Exibe papel, visibilidade do perfil,
  confirmação de e-mail e a data de fim de uma suspensão existente.
- Administradores podem editar nome de exibição e bio. A operação verifica
  se esses campos mudaram desde que o formulário foi aberto e registra
  autor, conta afetada, data e campos alterados.
- A evolução proposta inclui suspensões reversíveis em horas ou dias
  com motivo e expiração, gestão de cargos com proteção do último
  administrador ativo e exclusão com confirmação explícita. Remover o
  perfil público e excluir a conta são operações distintas.
- Migração `20261127220825_admin_community_profiles.sql` e verificação
  `supabase/checks/phase_2_5_admin_community_profiles.sql` em homologação.

## Controle administrativo de contas

- A partir de Gerenciar conta, administradores ativos podem suspender uma
  conta por horas ou dias com um motivo. A suspensão usa o prazo do Supabase
  Auth e pode ser revogada. Sessões já abertas perdem acesso às ações privadas
  enquanto o prazo estiver ativo. O perfil e as listas publicados continuam
  sujeitos aos controles de visibilidade e moderação existentes.
- Mudanças entre Membro, Moderador e Administrador usam os papéis existentes.
  A conta precisa estar ativa e com e-mail confirmado para receber um cargo
  de equipe. As ações protegem a própria conta do administrador e o último
  administrador ativo. Para suspender ou excluir outro administrador,
  primeiro altere o cargo.
- Remover perfil apaga a página de perfil e suas preferências de
  compartilhamento. Excluir conta também remove o login e os dados associados,
  como listas, favoritos e histórico. As duas ações exigem digitar o @usuário
  atual ou, para excluir um cadastro sem perfil, o identificador da conta.
  O histórico administrativo e os registros de denúncias são preservados
  para acompanhamento.
- Histórico de ações exibe o administrador responsável, a conta afetada,
  o motivo, a hora, a mudança de cargo e o prazo quando houver.
- Após excluir uma conta, o painel volta à lista atualizada e confirma a
  exclusão. O histórico preserva o registro da ação. Um cadastro posterior
  com o mesmo e-mail recebe um novo ID.
- Migração `20261127224933_community_account_controls.sql` e verificação
  `supabase/checks/phase_2_5_community_account_controls.sql`.

## Configuração do e-mail oficial sem custo de envio inicial

1. No Resend, adicionar `themonsterarchive.com` ao plano Free. Na data da
   verificação, o plano anuncia até 100 e-mails por dia e 3.000 por mês.
   O envio padrão do Supabase é voltado a testes e limita os destinatários.
2. Publicar no Porkbun os registros de verificação e envio exibidos pelo
   Resend e aguardar a indicação de domínio verificado. O domínio do site
   usa DNS externo ao Vercel. Manter os registros atuais do site.
3. Criar no Resend uma chave de envio restrita ao domínio. No Supabase Auth
   do projeto oficial, ativar SMTP personalizado com host `smtp.resend.com`,
   porta `465`, usuário `resend`, nome `MONSTER ARCHIVE` e remetente
   `account@themonsterarchive.com`, configurado em homologação. Inserir a
   chave como senha diretamente no campo do Supabase.
4. Aplicar os modelos em `supabase/templates/confirmation.html` e
   `supabase/templates/recovery.html`. Assuntos sugeridos:
   **Confirme seu e-mail / Confirm your email · MONSTER ARCHIVE** e
   **Redefina sua senha / Reset your password · MONSTER ARCHIVE**.
   Novos cadastros guardam o idioma escolhido. Para contas anteriores sem
  essa preferência, o corpo inclui as duas versões. A confirmação usa
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}` e a
  recuperação mantém `{{ .ConfirmationURL }}`.
5. Conferir o remetente e testar abertura dos links de cadastro e
   recuperação usando uma conta de teste autorizada. Verificar os limites
   de envio no Supabase e no Resend. A ativação externa depende de acesso
   autenticado ao Resend, ao DNS do Porkbun e ao projeto oficial do Supabase.

[Plano Resend](https://resend.com/pricing) · [SMTP Resend no Supabase](https://resend.com/docs/send-with-supabase-smtp) · [Configuração Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

## Etapa 2.5.8 — Publicação oficial

- As oito migrações da Comunidade foram aplicadas em `monster-archive-br`.
  As verificações em produção confirmaram as proteções de acesso à lista de
  perfis e ao histórico de ações e a continuidade do administrador ativo.
- Kelvin confirmou a configuração do SMTP do Resend em produção. O PR #10
  foi integrado à `main` no commit `e0973d10fdeab043d600a67f4c47471842ae4ea3`.
- O deploy de produção da Vercel ficou pronto e o domínio oficial respondeu.
  A verificação incluiu login, cadastro, recuperação, troca de idioma em
  português e inglês, redirecionamento das áreas restritas sem sessão e
  tratamento de links de autenticação inválidos.
- A confirmação final dos e-mails e dos links reais de cadastro e
  recuperação no domínio oficial está pendente. A classificação no Hotmail
  fica em acompanhamento.

### Confirmação aberta em outro navegador

- O teste em produção confirmou o endereço, mas o link original foi
  reutilizado sem iniciar uma sessão para a conta. Os links originais
  continuam aceitos e a tela de login orienta a entrar quando a confirmação
  já tiver sido processada.
- O novo modelo leva o usuário a uma tela do site e confirma a inscrição
  após o clique no botão. O link pode ser aberto em outro navegador e a
  confirmação mantém a sessão que já estiver aberta.
- Após disponibilizar a rota de confirmação no ambiente correspondente,
  aplicar `supabase/templates/confirmation.html` em **Authentication →
  Emails → Templates → Confirm sign up**. Conferir se **Site URL** aponta
  para esse ambiente. A alteração do modelo usa a configuração de cada
  projeto Supabase.
