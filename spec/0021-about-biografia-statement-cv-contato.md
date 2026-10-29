---
id: 0021
title: About — biografia, statement, CV (ver/baixar) e contato; textos editáveis e configurações do site
status: approved
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0021 — About

## 1. Contexto e problema
Briefing §07: página editorial com **Artist Biography**, **Artist Statement**, **CV** (visualizar ou baixar) e **Contact** (e-mail), com fotografias e a integração arte/desenho/pesquisa/design/colaborações; menciona um "MOCK UP — Sobre 1 y 2" que **não foi fornecido**. Hoje `src/components/sections/about-content.tsx` (spec 0010, referência 8) tem retrato com letreiro, faixa salmão com texto "artist" e "bio" (`ABOUT.artistKeys/bioKeys` em `src/lib/content/index.ts:53-66`, textos de exemplo em `i18n.ts`), colagens, galeria, link de CV só se `SITE.cvUrl` existir (`src/lib/site.ts:10`, hoje `undefined`), sem bloco de contato. Textos só editáveis por código.

## 2. Objetivos e não-objetivos
**Objetivos:** 4 blocos nomeados como no briefing nos 3 idiomas; CV por idioma (PDF) com link visível; contato com `mailto:`; textos e arquivos editáveis pela cliente no dashboard; `SiteSettings` (e-mail, redes, localização, nome do site) editável, alimentando o footer (0016) e About.
**Não-objetivos:** refazer o layout aprovado da 0010; gerar/hospedar o texto (vem da cliente); CV em HTML.

## 3. Estado atual do código
`about-content.tsx`, `src/app/(home)/(sections)/sobre/page.tsx`, `src/lib/content/index.ts` (`ABOUT`), `src/lib/site.ts`, `src/components/home/social-links.tsx`, `src/app/api/upload/route.ts` (aceita só imagens: `ALLOWED_IMAGE_TYPES`), `src/lib/azure-blob.ts`, `src/actions/contact.ts` + `/contato` (spec 0012). Imagens do cliente em `src/assets/About/*` (retrato `Foto_ppal.jpg`, colagens, cachalote, `DownloadCV.png` botão desenhado).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| Código atual (acima) | repo | Upload é só imagem e só ADMIN; footer lê `SITE` | Para PDF é preciso ampliar allowlist |
| `next/dist/docs/.../revalidateTag.md` | 16.4.3 | A ler no passo 0 (cache de `SiteSettings`) | — |
| Azure Blob (`@azure/storage-blob` em `node_modules`, `src/lib/azure-blob.ts`) | instalado | A ler: content-type/ `Content-Disposition` para PDF | A confirmar |
| Referências: `spec/references/igual-about.png`, `elena-proto-sobre-mobile.png`, ref 8 (specs 0010/0011) | — | Layout aprovado; **não reabri as imagens nesta passada** | Reler no passo 0 |

## 5. Alternativas
**5.1 Onde ficam textos e arquivos**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Seguir em `i18n.ts`/`SITE` (código) | Zero migração | Cliente não edita; descumpre "de forma simples" |
| B | **Tabela singleton `SiteSettings` (chave → `Json`) com `about.bio`, `about.statement` (Localized), `cv` por idioma (url), `contactEmail`, `instagram`, `facebook`, `location`, `siteName`; editor no dashboard "Sobre e site"** | Um lugar; alimenta footer e About; sem deploy | Footer passa a depender do banco (cache por tag) |
| C | Item `ContentItem` section `ABOUT` | Reuso do CRUD | Mistura dado singleton com coleção; categorias/ordem sem sentido |
**Recomendação: B**, com `SITE` mantido como **fallback** quando a chave estiver vazia (sem quebrar a 0016).

**5.2 CV**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | **1 PDF por idioma (3 uploads), botão mostra o do idioma atual; se faltar, cai para outro idioma disponível** | Respeita "3 idiomas" | 3 arquivos para manter |
| B | 1 PDF único | Simples | Idioma misto |
Recomendação: A, com fallback. Abrir em nova aba (visualizar) e rotular "Baixar CV (PDF)"; `download` não funciona cross-origin, então depende do viewer do navegador — registrado como limitação.

## 6. Design proposto
### 6.0 Referências e direção visual
Manter a página aprovada (0010): retrato com letreiro, faixa salmão, colagens, cachalote. **Acrescentar** (sem redesenhar): cabeçalhos de seção "Biografia artística / Declaração artística" (`h2`), bloco de contato e botão de CV como seções finais antes da newsletter. O mock-up "Sobre 1 y 2" é a referência desejada pela cliente: **pedir o arquivo** (Q); se divergir da 0010, abrir revisão.

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Botão de CV é imagem (`DownloadCV.png`): texto "download CV" fixo em inglês/PNG | `index.ts:62` | alta (a11y/i18n) | usar botão de texto traduzido (3 idiomas); manter o PNG só como ornamento `alt=""` se a cliente quiser |
| 2 | Texto de bio/statement é de exemplo | `i18n.ts` (`page.about.subtitle`: "Uma página para contar a história do projeto.") | alta | substituir pelos textos da cliente (Q); sem eles, não publicar |
| 3 | Contato sem e-mail visível na página | `about-content.tsx` | alta | bloco com `mailto:` em texto (≥2,75rem), não só ícone |
| 4 | Textos longos em 360: coluna de leitura ≤65ch, `text-base`+ | `about-content.tsx` | média | já em `max-w-[65ch]`; checar en/es |
| 5 | Letreiro branco sobre foto depende de degradê | `about-content.tsx` | baixa | manter; axe + inspeção visual |

### 6.1 Frontend
- **Rota:** `/[lang]/about`. Server Components; sem Client novo. Blocos: `AboutHero` (existente) → `Biography` → `Statement` → faixas/colagens/galeria (existentes) → `CvLink` → `ContactBlock` → newsletter (existente).
- **Estados:** textos vazios → bloco oculto (sem placeholder em produção); CV ausente → botão oculto; e-mail ausente → bloco oculto e aviso no dashboard.
- **Responsivo:** 1 coluna em 360; texto + imagem lado a lado em ≥768 como hoje; contato em linha ≥768.
- **A11y:** ordem de leitura h1 → h2s; `mailto:` com texto do e-mail; botão CV `target="_blank"` + `rel` + nome "(abre em nova aba, PDF)"; contraste conferido.
- **i18n:** rótulos "Biografia artística / Artist biography / Biografía artística", "Declaração artística / Artist statement / Declaración artística", "Currículo / CV / Currículum", "Contato / Contact / Contacto" (do briefing).

### 6.2 Backend
```prisma
model SiteSetting { key String @id; value Json; updatedAt DateTime @updatedAt }
```
Chaves permitidas (allowlist em código, Zod por chave): `siteName`, `contactEmail`, `instagramUrl`, `facebookUrl`, `locationLabel` (Localized), `aboutBio`, `aboutStatement` (Localized, parágrafos), `cvUrl` (`{pt-BR?,en?,es?}`).
- **Actions:** `updateSiteSettings(key, value)` (`requireAdmin()`; Zod por chave; e-mail `z.email()`; redes só `https://` e host `instagram.com|facebook.com` com allowlist; CV só host Azure) → `revalidateTag("site-settings")`. Leitura: `getSiteSettings()` cacheada por tag.
- **Upload de PDF:** `folder=docs`, `application/pdf` ≤ limite (ex.: 10 MB, definir), verificação de **magic bytes** `%PDF-` no servidor (não confiar no `file.type`); mesmo guard ADMIN; ampliar a allowlist sem afrouxar a de imagens.
- **Seeds:** nada inventado; valores vazios até a cliente fornecer (Q7).

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ler About/settings públicos | sim | sim | sim | só chaves públicas via allowlist |
| Editar settings / subir CV | não | não | sim | `requireAdmin()` + rota upload ADMIN |
- E-mail público é intencional (briefing); risco de spam aceito. Renderização como texto (sem HTML). Links externos `noopener`. PDF servido do Blob (não executa); sem logar valores.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Zod por chave (e-mail, URLs, host de rede, CV) | unit | rejeita inválidos/`javascript:` |
| 2 | `updateSiteSettings` anônimo/CUSTOMER | integração | UNAUTHENTICATED/FORBIDDEN |
| 3 | Chave fora da allowlist | integração | VALIDATION |
| 4 | Upload PDF: tipo falso (`.exe` com type pdf), grande demais | integração | rejeita |
| 5 | About com/sem CV, com/sem e-mail | componente | blocos corretos |
| 6 | Fallback de idioma do CV | unit | ok |
| 7 | Footer reflete alteração (revalidação) | integração | novo e-mail aparece |
| 8 | 360/768/1280 + axe + teclado | e2e | zero serious/critical; sem rolagem horizontal |

## 9. Plano de implementação
0. Reler referências e docs (revalidate, azure). 1. Migration `SiteSetting`. 2. Zod + `getSiteSettings`. 3. Upload `docs` + magic bytes (testes). 4. Dashboard "Sobre e site". 5. About: blocos Biografia/Statement/CV/Contato. 6. Footer (0016) lê `SiteSettings` com fallback `SITE`. 7. e2e/capturas; verificação final.

## 10. Riscos, rollback e dívidas
- Footer dependente do banco: falha de DB não pode derrubar a página → fallback para `SITE` (teste).
- Rollback: remover leitura de `SiteSetting`; `SITE` volta a valer.
- vinext: nada Next-only novo.
- Dívida: versionamento de textos; editor rich text.

## 11. Perguntas em aberto
- [ ] Textos oficiais de Biografia e Statement nos 3 idiomas (e o mock-up "Sobre 1 y 2"): **default** só a estrutura; sem texto, os blocos ficam ocultos.
- [ ] CV: PDFs por idioma disponíveis? **default** sim, 3 uploads; fallback.
- [ ] E-mail de contato, Instagram e Facebook (reiterado da 0016): **default** vazios.
- [ ] Manter as colagens/cachalote/fotos atuais (aprovadas 0010) ou trocar? **default** manter.
- [ ] Limite do PDF: **default** 10 MB.

## 12. Checklist da review humana
- [ ] `SiteSettings` (5.1-B) aceito
- [ ] CV por idioma aceito
- [ ] Allowlist de upload de PDF revisada
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
