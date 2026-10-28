---
id: 0002
title: Fluxo de login/cadastro: auditoria, endurecimento e seeds de teste
status: implemented
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-27
approved_by: Thiago Morgado
approved_at: 2026-10-27
---

# 0002 — Fluxo de login/cadastro

## 1. Contexto e problema
Auditoria do fluxo atual de autenticação (Auth.js v5 beta, Credentials, JWT). Funciona no caminho feliz, mas há lacunas de segurança (enumeração de usuário por tempo/mensagem, sem rate limit, e-mail sem normalização, sessão que não revalida), de UX/a11y (formulários nativos sem `autocomplete`, erros sem `role=alert`, textos fixos em pt-BR) e de teste (seed único, sem cliente nem usuário de erro). Esta spec **documenta o fluxo**, **critica com evidência** e **propõe correções**. Nada foi alterado fora de `spec/`.

## 2. Objetivos e não-objetivos
**Objetivos**
- Documentar o fluxo atual com `arquivo:linha`.
- Corrigir os achados `alta`/`média` de segurança e UX do login/cadastro.
- Migrar os dois formulários para react-hook-form + yup + `ControlledInput` (padrão já adotado na newsletter), com Zod no servidor.
- Seeds determinísticos e idempotentes para testar login por papel e casos de erro, impossíveis de rodar em produção.
**Não-objetivos**
- Recuperação de senha, verificação de e-mail, login social, 2FA (listados como dívida/pergunta).
- Trocar Auth.js, estratégia de sessão (continua JWT) ou o hash (continua bcryptjs).
- Contrato único de erros (spec 0003; esta spec o consome quando existir).

## 3. Estado atual (fluxo documentado)
1. **Proxy** `src/proxy.ts:4-6` roda `NextAuth(authConfig).auth` nas rotas `/dashboard`, `/conta`, `/carrinho`, `/login`, `/cadastro`.
2. **`authorized`** `src/auth.config.ts:7-30`: `/dashboard` exige ADMIN (cliente logado → `/conta`); `/conta` exige login; `/carrinho` exige login (redireciona com `callbackUrl=/carrinho`); logado em `/login`/`/cadastro` → home do papel (ignora `callbackUrl`).
3. **Login** `src/actions/auth.ts:15-31`: busca o papel por e-mail **antes** de autenticar (para o destino padrão), chama `signIn("credentials", { redirectTo: safeCallbackPath(callbackUrl) ?? fallback })`. Qualquer `AuthError` vira "Email ou senha inválidos."; o resto é relançado (é como o redirect funciona).
4. **`authorize`** `src/auth.ts:12-23`: Zod (`email`, `password.min(1)`), `findUnique`, `bcrypt.compare`. Retorna `null` se o usuário não existe **sem** comparar hash.
5. **Cadastro** `src/actions/auth.ts:34-60`: Zod (nome ≥2, e-mail, senha ≥6), checa e-mail existente, `bcrypt.hash(…, 10)`, cria `CUSTOMER`, faz `signIn` e redireciona.
6. **Sessão** `auth.config.ts:31-46`: JWT com `id` e `role` copiados no login; **nunca revalidados**.
7. **Guardas** `src/actions/guard.ts`, layouts `(private)/dashboard/layout.tsx:8-9`, `(private)/conta/layout.tsx:11`, `(public)/carrinho/layout.tsx`.
8. **UI** `(auth)/login/login-form.tsx`, `(auth)/cadastro/register-form.tsx`: `<form action>` + `useActionState`, `required`/`minLength` nativos, erro em `<p>` simples.
9. **Seed** `prisma/seed.ts`: só `admin@example.com` / `admin123` (impresso no console), sem guarda de ambiente.
10. Já corrigido nesta rodada (spec 0001): open redirect em `callbackUrl` (`/\evil.com`) via `src/lib/safe-path.ts`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/02-guides/authentication.md` (a reler na impl.) | 16.4.3 | Autenticação em camadas (proxy não basta; checar na origem dos dados). | Não |
| `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md` | 16.4.3 | Erros esperados = valores de retorno em Server Functions com `useActionState`; evitar try/catch para fluxo esperado. | Não |
| `node_modules/next-auth` (beta.32) tipos | 5.0.0-beta.32 | `AuthError.type` (`CredentialsSignin`, `CallbackRouteError`…). **Não li o código-fonte de `signIn` em detalhe**; confirmar `e.type` na impl. | A confirmar |
| `@hookform/resolvers` 6 / `yup` 1.7 / `react-hook-form` 7.91 | instaladas | Já usadas na newsletter. | Não |

## 5. Alternativas
### 5.1 Rate limiting de login/cadastro
| # | Opção | Prós | Contras | Risco |
|---|---|---|---|---|
| A | Nada (hoje) | 0 custo | Força bruta livre; bcrypt custa CPU (DoS) | Alto |
| B | Em memória por IP+e-mail | Simples | Não funciona com várias instâncias/serverless; reseta no deploy | Médio |
| C | **Tabela Postgres `AuthAttempt` (chave = e-mail normalizado e IP, janela de 15 min)** | Funciona em multi-instância, testável com o banco de teste já existente, sem dependência | Escrita por tentativa; IP vem de header (confiável só atrás de proxy conhecido) | Baixo/Médio |
| D | Redis/Upstash | Padrão para isso | Nova infra e dependência | Médio |
**Recomendação: C** (5 falhas/15 min por e-mail e 20/15 min por IP → bloqueio temporário com mensagem genérica). Rejeitadas: A, B (falsa segurança), D (infra fora do escopo; revisitar se escalar).

### 5.2 Usuário desativado
| # | Opção | Contras |
|---|---|---|
| A | Apagar o usuário | Perde pedidos (FK) |
| B | **`disabledAt DateTime?` em `User` (migration aditiva)** | Checar em `authorize` e na revalidação |
| C | Papel `DISABLED` em `role` | Mistura papel com estado |
**Recomendação: B.**

### 5.3 Revalidação da sessão JWT
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Nada (hoje): vale até expirar (padrão Auth.js: 30 dias) | Zero custo | Usuário desativado/rebaixado continua entrando |
| B | **`maxAge` menor (ex.: 7 dias) + revalidar `role`/`disabledAt` no callback `jwt` a cada N minutos** | Corta o problema sem trocar de estratégia | Uma query ocasional (o callback `jwt` não é edge-safe: fica em `auth.ts`, não em `auth.config.ts`) |
| C | Sessão em banco (adapter) | Revogação imediata | Muda estratégia; proxy edge não acessa banco |
**Recomendação: B.** Rejeitadas: A, C.

### 5.4 Enumeração no cadastro ("Este email já está cadastrado.")
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Manter | Melhor UX | Confirma que o e-mail existe |
| B | Mensagem genérica + e-mail de verificação | Padrão seguro | **Exige envio de e-mail (não existe provedor)** |
| C | **Manter a mensagem, mas com rate limit (5.1) e sem diferença de tempo** | Compromisso sem infra | Enumeração limitada, não eliminada |
**Recomendação: C agora; B quando houver e-mail transacional** (pergunta 3).

## 6. Design proposto
### 6.0 Referências e direção visual
Sem referência nova. Reutilizar o tema do projeto (tokens `bg-background`, `bg-secondary`, `text-purple`), a casca visual da home (`AppHeader` simplificado) e os componentes shadcn (`Card`, `Field`, `Button`, `Input`). Crítica de UI/UX:

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | **Enumeração por tempo**: usuário inexistente retorna sem `bcrypt.compare` (resposta ~ms) e existente leva ~60-100 ms. | `auth.ts:18-19` | alta | Comparar sempre contra um hash fixo "dummy" quando o usuário não existe. Teste mede que `compare` foi chamado nos dois ramos. |
| 2 | **Sem rate limit/lockout** em login e cadastro. | Nenhuma ocorrência de limite em `src` (grep) | alta | 5.1-C. |
| 3 | **E-mail sem normalização**: `Ana@x.com` e `ana@x.com` são contas distintas; login é sensível a caixa. | `actions/auth.ts:36` (`z.string().email()`), `auth.ts:15` | alta | `trim().toLowerCase()` no cadastro e no login; migration de dados: verificar duplicatas por `lower(email)` antes de tornar o índice único em minúsculas (pergunta 5). |
| 4 | **Todo erro vira "Email ou senha inválidos."**, inclusive banco fora do ar ou erro de configuração. Induz o usuário a trocar a senha sem motivo. | `actions/auth.ts:21-23` (`instanceof AuthError`) | média | Só `CredentialsSignin` vira credencial inválida; demais → "Não foi possível entrar agora" + log no servidor. |
| 5 | **Sessão não revalida**: usuário apagado, desativado ou rebaixado segue com JWT válido até expirar. | `auth.config.ts:31-46` | alta | 5.2 + 5.3. |
| 6 | **Senha**: mínimo 6, sem máximo (bcrypt trunca em 72 bytes; senha enorme = DoS de CPU). | `actions/auth.ts:31` | média | 8 a 72 bytes (`TextEncoder`), mesmas regras no yup e no Zod. |
| 7 | **a11y do form**: sem `autocomplete` (`email`, `current-password`, `new-password`, `name`), erro sem `role=alert` nem associação ao campo, validação nativa do navegador (mensagens fora do idioma do site), sem mostrar/ocultar senha. | `login-form.tsx:15-23`, `register-form.tsx` | alta | RHF + yup + `ControlledInput`, erro por campo com `aria-describedby`, erro geral `role=alert`, botão mostrar/ocultar (alvo 44px, `aria-pressed`). |
| 8 | **Alvos pequenos**: `Input` e `Button` h-8 (32px) nos formulários. | `ui/input.tsx`, `ui/button.tsx` | média | `h-11` nos forms de auth. |
| 9 | **i18n**: textos fixos em pt-BR (labels, erros, "Entrando..."), enquanto o site é pt/en/es. | `login-form.tsx`, `actions/auth.ts` | média | Chaves `auth.*` nas 3 línguas; actions devolvem **códigos** e a UI traduz (alinhado à spec 0003). |
| 10 | **Página sem navegação**: `min-h-screen` centralizada, sem link de volta para a home/loja. | `login/page.tsx` | baixa | Wordmark linkando `/` acima do card. |
| 11 | **Redirect por papel**: logado visitando `/login` vai à home do papel e descarta `callbackUrl`; admin que loga com `callbackUrl=/carrinho` vai ao carrinho (ok). | `auth.config.ts:25` | baixa | Respeitar `safeCallbackPath` nesse redirect. |
| 12 | **Sem "esqueci a senha"** nem verificação de e-mail. | Ausente | média | Fora de escopo; pergunta 3. |
| 13 | Hash bcrypt cost 10 (aceitável hoje; OWASP sugere ≥10 para bcrypt). | `actions/auth.ts:55` | baixa | Manter; extrair `hashPassword`/`verifyPassword` para `src/lib/password.ts` (cost em 1 lugar; seed usa o mesmo). |
| 14 | `AUTH_TRUST_HOST`/`AUTH_URL` em produção não verificados. | Não li `.env` (segredos); nenhuma menção no código | média | Checklist de deploy na seção 10 (verificar, não alterar). |

### 6.1 Frontend
- Rotas: `(auth)/login`, `(auth)/cadastro` (server `page.tsx` valida `callbackUrl` com `safeCallbackPath`, já feito) + formulários client.
- Árvore: `AuthShell` (S: wordmark + `Card`), `LoginForm` (C: `FormProvider` + `yupResolver(createLoginSchema(t))` + `ControlledInput` ×2 + `PasswordInput`), `RegisterForm` (C: idem + nome). `PasswordInput` = `ControlledInput` com botão mostrar/ocultar (variação por prop `reveal`, sem duplicar).
- Schemas: `src/lib/schemas/auth.ts` (yup, mensagens via `t`, padrão pt-BR) e `auth.server.ts` (Zod, fonte da verdade).
- Envio: `handleSubmit` chama a action com objeto; resposta tipada `{ ok:false, code }` mapeada para mensagem i18n (códigos: `INVALID_CREDENTIALS`, `RATE_LIMITED`, `EMAIL_TAKEN`, `VALIDATION`, `UNKNOWN`). Sucesso = redirect (a action relança o redirect do Auth.js; o cliente trata `NEXT_REDIRECT` como fluxo normal, não como erro).
- Estados: idle / submitting (botão "Entrando...", campos desabilitados) / erro de campo / erro geral `role=alert` / bloqueado por rate limit (mensagem com tempo aproximado, "tente em alguns minutos") / sucesso (redirect).
- Responsivo: coluna única `max-w-sm` em todos os breakpoints; em 360px o card ocupa a largura com margem 16px; sem rolagem horizontal; teclado virtual: `autocomplete`/`inputMode` corretos.
- a11y: labels visíveis, `aria-invalid`, `aria-describedby`, foco no primeiro campo inválido após submit (`shouldFocusError`), contraste do erro (`text-destructive` sobre papel, verificar ≥4,5:1 na impl.), `aria-live` no erro geral.
- i18n: 3 línguas; textos de en/es mais longos não quebram o botão (`whitespace-normal` e `min-h`).

### 6.2 Backend
- **Migration** (aditiva):
  ```prisma
  model User { …  disabledAt DateTime? }
  model AuthAttempt {
    id        String   @id @default(cuid())
    key       String           // "email:<normalizado>" | "ip:<ip>"
    createdAt DateTime @default(now())
    @@index([key, createdAt])
  }
  ```
  Limpeza de tentativas antigas na própria checagem (`deleteMany` das > 1 dia). Índice único em `lower(email)`: só após verificar duplicatas (pergunta 5), via SQL manual revisado.
- **Contratos**:
  - `loginAction(input: unknown) → { ok:false, code } | never(redirect)`. Fluxo: validar (Zod) → checar rate limit → `signIn`; falha de credencial registra `AuthAttempt`; sucesso limpa as do e-mail.
  - `registerAction(input) → { ok:false, code, fieldErrors? } | never(redirect)`.
  - `authorize`: normaliza e-mail; `disabledAt` ≠ null ⇒ `null` (mesma resposta que credencial inválida); compara sempre contra hash (dummy se não achou).
  - O destino padrão por papel deixa de ser calculado antes da autenticação: usar o papel do usuário autenticado (callback `redirect`/pós-`signIn`), eliminando a consulta pré-login.
- Transações: cadastro cria usuário com `create` e trata `P2002` (corrida de e-mail) → `EMAIL_TAKEN`.
- Cache/revalidação: nenhuma.
- Integrações: nenhuma.

### 6.3 Seeds de teste (dev/CI apenas)
`prisma/seed.ts` reescrito, **idempotente (`upsert`) e determinístico**, hash via `src/lib/password.ts` (mesmo bcrypt do app). **Não escrito ainda: depende da aprovação desta spec** (é código fora de `spec/`; o seed de dev entra no escopo aprovado se esta spec for aprovada).

| Usuário | Papel | Senha (**só dev**, documentada aqui) | Para testar |
|---|---|---|---|
| `admin@example.com` (já existe) | ADMIN | `Admin@12345` (hoje é `admin123`; muda por causa da regra de 8+ caracteres; confirmar, pergunta 6) | dashboard, `requireAdmin` |
| `cliente@example.com` | CUSTOMER | `Cliente@12345` | `/conta`, carrinho, checkout |
| `cliente2@example.com` | CUSTOMER | `Cliente2@12345` | IDOR: pedido de outro usuário |
| `desativado@example.com` | CUSTOMER, `disabledAt` = data fixa | `Desativado@12345` | login recusado com a mesma mensagem de credencial inválida |

"Usuário sem senha" não existe no schema (`password` é obrigatório); o caso de erro útil é o desativado. Opcional (pergunta 7): 3 posts, 3 produtos e 1 pedido do `cliente`.
**Proteção contra produção** (todas, nesta ordem; qualquer uma falha ⇒ aborta com código ≠ 0 e **sem tocar no banco**):
1. `NODE_ENV !== "production"`;
2. `ALLOW_DEV_SEED=1` explícito na linha de comando (`npm run db:seed` passa a definir a variável no script; em CI/produção ninguém define);
3. host do `DATABASE_URL` ∈ {`localhost`, `127.0.0.1`, `::1`, `db`}, ou banco terminado em `_test`/`_dev` (só o host/nome são lidos, nunca impressos com credenciais).
O seed **não imprime senhas**; elas ficam documentadas só nesta spec/README de dev.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| `/login`, `/cadastro` | ✔ | redireciona | redireciona | proxy (`authorized`) |
| `login`/`register` actions | ✔ (rate limit) | ✔ | ✔ | Zod + limite dentro da action |
| `/conta`, `/carrinho` | ✘→/login | ✔ | ✔ | proxy + layout |
| `/dashboard`, actions admin | ✘ | ✘→/conta | ✔ | proxy + layout + `requireAdmin()` |
- IDOR: sem alteração (pedidos já filtram por `userId`); seed `cliente2` serve para testar.
- Open redirect: `safeCallbackPath` em todo destino.
- Logs: nunca e-mail/senha; só código do erro e `digest`.
- CSRF: Server Actions validam origem (comportamento do Next; não alterar `allowedOrigins`).
- Timing: achado 1.

## 8. Plano de testes
Infra: a já aprovada na spec 0001 (vitest + Testing Library + banco `loja_blog_test`). Playwright continua **não aprovado**; e2e fica como pendência.
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `authorize`: credencial válida ADMIN/CUSTOMER | integração (banco real) | retorna id/role |
| 2 | Senha errada / e-mail inexistente | integração | `null` nos dois; `bcrypt.compare` chamado nos dois ramos (spy no módulo de senha) |
| 3 | Usuário desativado | integração | `null` |
| 4 | E-mail com caixa/espaço diferente | integração | autentica como o mesmo usuário |
| 5 | Rate limit: 5 falhas → 6ª bloqueada; sucesso zera; janela expira (relógio injetável) | integração | `RATE_LIMITED` |
| 6 | Cadastro feliz / senha curta / longa (>72 bytes) / e-mail duplicado / corrida de 5 cadastros iguais | integração | 1 usuário, códigos corretos |
| 7 | Hash do cadastro verificável por `verifyPassword`; senha nunca em log | integração | sim |
| 8 | `callbackUrl` hostil em login/cadastro | unit/integração | cai no destino padrão |
| 9 | Destino por papel (ADMIN→/dashboard, cliente→/conta, `callbackUrl` válido vence) | integração | ok |
| 10 | Callback `jwt` revalida role/`disabledAt` (relógio injetável) | integração | sessão invalidada |
| 11 | `LoginForm`/`RegisterForm`: labels, erro por campo, `aria-describedby`, `role=alert`, mostrar/ocultar senha, pending, 3 idiomas | componente | `getByRole`/`getByLabelText` |
| 12 | Redirect do Auth.js não aparece como erro no cliente | componente | sem mensagem de erro |
| 13 | Proxy: matriz anônimo/cliente/admin × rotas | unit (`authorized`) | tabela da seção 7 |
| 14 | Seed: roda 2× sem duplicar; recusa produção (`NODE_ENV`, sem `ALLOW_DEV_SEED`, host remoto) | integração | 4 usuários; abort sem tocar no banco |
| 15 | Responsivo/axe 360/768/1280 | e2e (Playwright) | **não coberto sem aprovação do Playwright; declarar como não verificado** |

## 9. Plano de implementação
1. `src/lib/password.ts` (`hashPassword`, `verifyPassword`, `DUMMY_HASH`) + testes.
2. Migration `disabledAt` + `AuthAttempt`; revisar SQL.
3. `src/lib/rate-limit.ts` (Postgres) + testes.
4. `authorize` endurecido (normalização, dummy, desativado) + testes.
5. Schemas yup/Zod de auth + chaves i18n.
6. Actions `login`/`register` com códigos e rate limit.
7. Callback `jwt` com revalidação + `maxAge`.
8. Formulários RHF (+ `PasswordInput`) e `AuthShell`.
9. Seed + guardas de produção + script `db:seed`.
10. Testes, `tsc`, `eslint`, `vitest`, `next build`; relatório.

## 10. Riscos, rollback e dívidas
- Riscos: rate limit por IP depende de `x-forwarded-for` (só confiável atrás de proxy conhecido) → começar só por e-mail+IP best-effort; bloqueio por e-mail permite negar login a terceiros (lockout DoS) → bloqueio **temporário** e curto; migração de e-mails duplicados por caixa; mudar senha do admin de dev (README).
- Checklist de deploy (verificar, não alterar): `AUTH_SECRET` forte, `AUTH_URL`/`AUTH_TRUST_HOST` conforme hospedagem, HTTPS (cookies `Secure`), `ALLOW_DEV_SEED` ausente.
- Rollback: migrations aditivas; reverter commits; seed antigo volta do git.
- Dívidas: recuperação de senha, verificação de e-mail, 2FA, logout global, auditoria de login.

## 11. Perguntas em aberto (com default recomendado)
- [ ] 1. Rate limit em Postgres (5.1-C)? **Default: sim.**
- [ ] 2. Desativação via `disabledAt` (5.2-B) e revalidação de sessão com `maxAge` 7 dias (5.3-B)? **Default: sim.**
- [ ] 3. Manter "e-mail já cadastrado" (5.4-C) até existir envio de e-mail? Há previsão de provedor de e-mail e de "esqueci a senha"? **Default: manter; recuperar senha em outra spec.**
- [ ] 4. Senha 8 a 72 bytes: ok? **Default: sim; usuários existentes com 6-7 caracteres continuam entrando (regra só no cadastro).**
- [ ] 5. Existem e-mails duplicados por caixa no banco real? **Default: normalizar na aplicação já; índice único em minúsculas só depois de checar.**
- [ ] 6. Trocar a senha do admin de dev (`admin123` → `Admin@12345`)? **Default: sim.**
- [ ] 7. O seed deve incluir posts/produtos/pedido de exemplo? **Default: não (só usuários).**
- [ ] 8. Playwright para e2e de login por papel e a11y: aprovar? **Default: não aprovado; testes de login rodam em vitest.**
- [ ] 9. O seed de dev pode ser tratado como parte desta spec aprovada (sem nova aprovação)? **Default: sim, desde que as 3 proteções da seção 6.3 estejam no código.**

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado
- [ ] Matriz de permissões revisada
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
Aprovada por Thiago Morgado em 2026-10-27, via mensagem direta no Claude Code ("aprovar as specs 0002 e 0003 com os defaults"): todas as perguntas em aberto seguem os defaults recomendados da spec. Ordem: 0003 primeiro, a 0002 consome o Result. Registro feito pelo coordenador a pedido expresso do humano. Playwright NÃO aprovado.

## 14. Relatório pós-implementação
Implementada em 2026-10-27 (spec aprovada pelo usuário; defaults da seção 11).

**O que foi feito**
- Migration aditiva `20261027..._auth_hardening` (aplicada no banco de dev): `User.disabledAt` e tabela `AuthAttempt` (índice `key, createdAt`).
- `src/lib/password.ts` (`hashPassword`/`verifyPassword`, custo 10, `DUMMY_HASH`, 8 a 72 bytes), `src/lib/rate-limit.ts` (Postgres, janela de 15 min: 5 falhas por e-mail e 20 por IP no login; 20/IP no cadastro; limpeza oportunista), `src/lib/auth-credentials.ts` (`authorizeCredentials`: normaliza e-mail, bloqueio antes de consultar, `bcrypt.compare` **sempre** (dummy quando o usuário não existe), desativado recusado com a mesma resposta, busca case-insensitive para contas antigas, zera tentativas no sucesso; `RateLimitedSignin` com `code = "rate_limited"`), `src/lib/session-refresh.ts` (revalida papel/`disabledAt` a cada 5 min; sessão encerra se apagado/desativado), `src/auth.ts` (`maxAge` 7 dias, callback `jwt` com revalidação; `authConfig` edge intacta).
- Actions `login`/`register`/`logout` sobre o contrato `Result` (spec 0003): `login` sem consulta prévia de papel (destino padrão `/destino` decide por papel depois); `register` com rate limit por IP, `EMAIL_TAKEN` (também na corrida, via P2002), hash pelo mesmo mecanismo; `callbackUrl` só via `safeCallbackPath`. `auth.config.ts`: logado em `/login`/`/cadastro` respeita `callbackUrl` seguro.
- Front: `LoginForm`/`RegisterForm` com react-hook-form + yup (`src/lib/schemas/auth.ts`, Zod no servidor em `auth.server.ts`) + `ControlledInput` (nova prop `reveal`: mostrar/ocultar senha, `aria-pressed`, alvo 44px), `AuthShell`, `autocomplete` correto, erro por campo e `role=alert`, mensagens `auth.*` em pt/en/es, campos `h-11`.
- Seed de dev (`prisma/seed.ts` + `prisma/seed-guard.ts`): admin, cliente, cliente2, desativado (`upsert`, idempotente, sem imprimir senhas). Guardas, nesta ordem e **antes de tocar no banco**: `NODE_ENV !== production`, `ALLOW_DEV_SEED=1`, host local (`localhost`/`127.0.0.1`/`::1`/`db`) ou banco `*_dev`/`*_test`. `npm run db:seed` define `ALLOW_DEV_SEED=1`. Senhas de dev (só dev): `admin@example.com` Admin@12345; `cliente@example.com` Cliente@12345; `cliente2@example.com` Cliente2@12345; `desativado@example.com` Desativado@12345 (desativado). A senha do admin de dev mudou de `admin123`.

**Verificação executada (reais)**
- Seed rodado no banco de dev: sem `ALLOW_DEV_SEED` recusou (exit 1); com `NODE_ENV=production` recusou; via `npm run db:seed` criou 4 usuários, 2ª execução idempotente.
- `authorizeCredentials` contra o banco de dev: admin e clientes entram com papel correto; desativado, senha errada e e-mail inexistente = `null`; após 5 falhas o login é bloqueado (`rate_limited`).
- **Ponta a ponta com o Auth.js** (servidor `next start` em outra porta, `curl` com CSRF): admin e cliente = 302 para `/destino` e sessão com `role` correto; desativado e senha errada = `/login?error=CredentialsSignin`, sem sessão; após 5 falhas = `/login?error=CredentialsSignin&code=rate_limited` (o `code` atravessa o Auth.js e é o que `mapError` lê). (Antes disso o servidor `next dev` já em execução devolvia `error=Configuration` porque mantinha o Prisma Client antigo: reiniciar o `next dev` após a migration.)
- Tabela de tentativas de teste limpa ao final.

**Testes**: `auth-credentials` (autorização, tempo igual, desativado, normalização, rate limit com relógio injetado, `refreshToken`), `auth-actions` (destino, `callbackUrl` hostil, INVALID_CREDENTIALS/RATE_LIMITED/INTERNAL, validação, cadastro feliz/curta/longa/duplicado com outra caixa/corrida de 5/rate limit), `seed` (guardas e idempotência).

**Desvios**: a consulta de papel pré-login foi substituída pela página `/destino` (achado 4/spec). Playwright não aprovado: formulários **não verificados visualmente**; e2e de UI não feito.

**Pendências**: reiniciar o `next dev`; recuperação de senha e verificação de e-mail (fora do escopo); índice único em `lower(email)` só após checar duplicatas no banco real; lembrar `AUTH_SECRET`/`AUTH_TRUST_HOST`/HTTPS em produção (checklist).
