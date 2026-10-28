import type { MessageKey } from "@/lib/i18n";

// Configuração do site e mapa de imagens da home. Nome/marca: troque aqui (nada de nome
// próprio fixo em componentes).
export const SITE = {
  name: "Loja & Blog",
  // Redes sociais: sem URL o ícone aparece decorativo (sem link morto); com URL vira link em nova aba.
  social: {} as { instagram?: string; facebook?: string },
  // Currículo ("download CV" na página Sobre): sem URL o botão não aparece (sem link morto).
  cvUrl: undefined as string | undefined,
  // Itens da faixa legal do rodapé. Sem `href` = item não aparece (as páginas ainda não existem).
  footerLinks: [
    { labelKey: "footer.terms" },
    { labelKey: "footer.privacy" },
    { labelKey: "footer.cookies" },
    { labelKey: "footer.contact" },
    { labelKey: "footer.manageCookies" },
  ] as { labelKey: MessageKey; href?: string }[],
  // Crédito "Site por ..." (canto direito do rodapé). Sem valor = não aparece.
  credit: undefined as { name: string; href?: string } | undefined,
};
