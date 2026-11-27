# Fase 2.5 — Comunidade

A Etapa 2.5.1 usa o Supabase de homologação (monster-archive-test) no Preview da
branch feat/community. A produção depende de aprovação do responsável pelo projeto.

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
  área de moderação. A fila de denúncias integra a Etapa 2.5.6.
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
