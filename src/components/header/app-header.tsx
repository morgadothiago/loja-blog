"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSolidAfter } from "@/components/header/use-solid-after";
import { ChevronDownIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu, UserPanel, type UserMenuData } from "@/components/user-menu";

// Altura do conteúdo do header (h-[3.625rem]) + 1px da borda.
const HEADER_HEIGHT_PX = 59;

// Import estático (src/assets): { src, width, height } reais do arquivo original.
export type HeaderImage = StaticImageData;

export type HeaderItem = {
  href: string;
  /** Texto do item. Com `image`, é o `alt` (o texto escrito no letreiro). */
  label: string;
  /** Elemento decorativo (aria-hidden) antes do texto. */
  icon?: React.ReactNode;
  /** Letreiro em imagem no lugar do texto no menu overlay. `lines` define a altura (1 ou 2 linhas). */
  image?: HeaderImage;
  lines?: 1 | 2;
};

export type AppHeaderProps = {
  /** Nome/logo exibido à esquerda; vira link para `brandHref`. */
  brand: React.ReactNode;
  brandHref?: string;
  /** Itens do menu: visíveis em linha no desktop e dentro do Sheet no mobile. */
  items: HeaderItem[];
  /** Ações sempre visíveis ao lado do menu (ex.: carrinho). */
  actions?: React.ReactNode;
  /** Botão de sessão (Entrar / Ir para o dashboard), decidido pelo chamador no servidor. */
  cta?: HeaderItem;
  /** Usuário logado: troca o botão de sessão por um dropdown (barra xl+) e por uma lista no rodapé do Sheet. */
  user?: UserMenuData;
  /** Ações só no desktop (ex.: idioma, login). */
  desktopActions?: React.ReactNode;
  /** Slot no topo do Sheet, entre o título e o botão fechar (ex.: seletor de idioma compacto). */
  menuHeaderActions?: React.ReactNode;
  /** Rodapé do Sheet (ex.: link do carrinho). */
  menuFooter?: React.ReactNode;
  /** Hambúrguer + overlay em todas as larguras (sem navegação em linha no desktop). */
  overlayOnly?: boolean;
  /** Imagem do botão que abre o menu (decorativa; o nome acessível é `labels.openMenu`). Sem ela, ícone de linhas. */
  menuImage?: HeaderImage;
  /** Texto visível do gatilho (ex.: "menu", manuscrito terracota, spec 0013). Vence `menuImage`. O nome acessível
   *  continua `labels.openMenu`, que deve conter este texto (WCAG 2.5.3, rótulo no nome). */
  menuLabel?: string;
  /** Grupos de links secundários (ex.: "Práticas"), com título, abaixo da lista principal do overlay. */
  groups?: { label: string; items: HeaderItem[]; /** Na barra (xl+), o grupo vira dropdown logo após o item com este href. */ afterHref?: string }[];
  /** Imagem do botão de fechar do overlay (o nome acessível continua em `labels.closeMenu`). */
  closeImage?: HeaderImage;
  /** Fixa o header no topo ao rolar (`sticky`: reserva o espaço, sem layout shift). */
  sticky?: boolean;
  /** id do elemento sentinela: enquanto ele aparece o header é transparente; depois, `bg-background` com borda. */
  solidAfterId?: string;
  /** Textos já traduzidos pelo chamador (o componente não conhece i18n). */
  labels: { openMenu: string; closeMenu: string; menuTitle: string; nav: string };
};

// Cabeçalho reutilizável (~58px): marca à esquerda, menu à direita. Mobile: gatilho
// hambúrguer abre um Sheet de tela cheia (foco preso, Esc e aria-modal vêm do base-ui).
export function AppHeader({ brand, brandHref = "/", items, cta, user, actions, desktopActions, menuHeaderActions, menuFooter, sticky, solidAfterId, overlayOnly, menuImage, menuLabel, groups, closeImage, labels }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const solid = useSolidAfter(solidAfterId, HEADER_HEIGHT_PX);
  return (
    <header
      className={cn(
        // border-b sempre presente (transparente no hero): a altura não muda na troca. z-40 < Sheet (z-50).
        "border-b transition-colors duration-200 motion-reduce:transition-none",
        sticky && "sticky top-0 z-40",
        // Transparente sobre o papel no topo (referências da 0013); ao rolar, papel opaco + borda (nada passa por baixo).
        solid ? "bg-background text-foreground border-border shadow-sm" : "bg-transparent text-foreground border-transparent",
      )}
    >
      {/* 58px é a altura pedida para o header (arbitrário deliberado). */}
      <div className="page-width flex h-[3.625rem] items-center gap-2">
        <Link href={brandHref} className="font-heading text-2xl tracking-wide">
          {brand}
        </Link>

        {!overlayOnly && (
          <nav aria-label={labels.nav} className="ml-6 hidden items-center gap-4 whitespace-nowrap xl:flex">
            {items.map((i) => (
              <Fragment key={i.href}>
                <Link
                  href={i.href}
                  aria-current={pathname === i.href ? "page" : undefined}
                  className={cn(
                    "focus-visible:ring-ring flex min-h-11 items-center border-b-2 outline-none focus-visible:ring-2",
                    pathname === i.href ? "border-primary" : "border-transparent",
                    !i.image && "ink-link font-heading text-lg",
                  )}
                >
                  {i.image ? (
                    // Letreiro do cliente (alt = texto escrito nele). Altura 1,75rem (1 linha) / 2,75rem (2 linhas, sem aumentar a barra): cabe
                    // com os 8 itens em 1280; largura automática pela proporção do arquivo.
                    <Image src={i.image} alt={i.label} sizes="10rem" className={cn("w-auto", i.lines === 2 ? "h-11" : "h-7")} />
                  ) : (
                    i.label
                  )}
                </Link>
                {groups?.filter((g) => g.afterHref === i.href).map((g) => (
                  <GroupMenu key={g.label} group={g} pathname={pathname} />
                ))}
              </Fragment>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          {actions}
          {!overlayOnly && (desktopActions || cta || user) && (
            <div className="hidden items-center gap-2 xl:flex">
              {desktopActions}
              {user ? (
                // Logado: botão de usuário (ícone) com dropdown no lugar de "Entrar".
                <UserMenu {...user} />
              ) : cta && (
                // Ícone + texto, sem fundo nem borda (o texto visível é o nome acessível).
                <Link href={cta.href} className={buttonVariants({ variant: "ghost", className: "h-11 gap-2 rounded-full px-3 text-base" })}>
                  {cta.icon}
                  <span>{cta.label}</span>
                </Link>
              )}
            </div>
          )}
          {/* Controlado: itens são <Link> reais (SheetClose+Link viraria role=button) e fecham o menu ao navegar. */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                menuLabel ? (
                  // Palavra manuscrita no lugar do ícone; alvo >= 2,75rem (min-h/min-w) e foco visível do Button.
                  <Button
                    variant="ghost"
                    className={cn("font-hand text-primary wobble h-11 min-w-11 px-2 text-3xl hover:bg-transparent aria-expanded:bg-transparent md:text-4xl", !overlayOnly && "xl:hidden")}
                    aria-label={labels.openMenu}
                  />
                ) : (
                  <Button variant="ghost" size="icon" className={cn("size-11", !overlayOnly && "xl:hidden")} aria-label={labels.openMenu} />
                )
              }
            >
              {menuLabel ? (
                menuLabel
              ) : menuImage ? (
                // Ícone desenhado à mão (decorativo: o nome do botão é o aria-label). Dimensões intrínsecas do
                // arquivo original reservam o espaço; h-8 com largura automática mantém a proporção. O PNG é
                // BRANCO sobre transparente: `brightness-0` o deixa preto (contraste máximo sobre o bege e o
                // claro do header). Em header escuro, remover `brightness-0`.
                <Image src={menuImage} alt="" className="h-8 w-auto brightness-0" />
              ) : (
                <MenuIcon className="size-6" />
              )}
            </SheetTrigger>
            {/* Mobile: tela cheia. ≥640px: painel lateral (max-w-md) para não esticar demais. */}
            {/* Painel lateral (direita) em todas as larguras: tela cheia em <640px, 28rem (max-w-md) a partir de sm. */}
            <SheetContent
              side="right"
              showCloseButton={false}
              overlayClassName="bg-ink/40"
              className={cn(
                // Cores de marca fixas no painel com letreiros: os PNGs são pretos (precisam de fundo claro).
                items.some((i) => i.image) ? "bg-paper text-ink" : "bg-background",
                "w-full gap-0 overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-sm motion-reduce:transition-none motion-reduce:duration-0",
              )}
            >
              {/* Cabeçalho fixo do painel */}
              <div className="px-fluid flex h-[3.625rem] shrink-0 items-center gap-2">
                <SheetTitle className="text-2xl">{labels.menuTitle}</SheetTitle>
                <div className="ml-auto flex items-center gap-1">
                  {menuHeaderActions}
                  <SheetClose render={<Button variant="ghost" size="icon" className="size-11" aria-label={labels.closeMenu} />}>
                    {closeImage ? (
                      <Image src={closeImage} alt="" className="h-8 w-auto" />
                    ) : (
                      <XIcon className="size-6" />
                    )}
                  </SheetClose>
                </div>
              </div>
              {/* Só a lista rola (se a janela for baixa): cabeçalho e rodapé ficam fixos */}
              <nav aria-label={labels.nav} className="px-fluid min-h-0 flex-1 overflow-y-auto py-2">
                <ul>
                  {items.map((i) => {
                    const active = pathname === i.href;
                    return (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "focus-visible:ring-ring flex min-h-11 items-center outline-none focus-visible:ring-2",
                            i.image
                              ? "gap-3 py-2 lg:py-1.5"
                              : "font-heading border-border justify-between border-b text-3xl tracking-wide",
                            active && "text-purple",
                          )}
                        >
                          {i.image ? (
                            // alt = texto do letreiro; width/height intrínsecos reservam o espaço (sem layout shift)
                            // e a altura de exibição é controlada por CSS para manter o ritmo entre os itens.
                            <Image
                              src={i.image}
                              alt={i.label}
                              sizes="(min-width: 1024px) 240px, (min-width: 640px) 360px, 300px"
                              className={cn(
                                "w-auto max-w-full",
                                // lg+: letreiros menores (altura em svh com teto em rem, letra >= ~28px); o alvo de
                                // 44px vem do min-h-11 + padding do link, não do tamanho da imagem.
                                i.lines === 2 ? "h-24 md:h-28 lg:h-[8svh] lg:max-h-[5.5rem]" : "h-12 md:h-14 lg:h-[4svh] lg:max-h-11",
                              )}
                            />
                          ) : (
                            i.label
                          )}
                          {active && <span aria-hidden="true" className="bg-purple size-2 shrink-0 rounded-full" />}
                        </Link>
                      </li>
                    );
                  })}
                  {groups?.map((g) => (
                    <li key={g.label} className="py-3">
                      <p className="font-hand text-muted-foreground text-2xl">{g.label}</p>
                      <ul className="mt-1 pl-5">
                        {g.items.map((i) => {
                          const active = pathname === i.href;
                          return (
                            <li key={i.href}>
                              <Link
                                href={i.href}
                                onClick={() => setOpen(false)}
                                aria-current={active ? "page" : undefined}
                                className={cn("font-heading focus-visible:ring-ring flex min-h-11 items-center text-2xl outline-none focus-visible:ring-2", active && "text-purple")}
                              >
                                {i.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Rodapé fixo: botão de sessão + carrinho */}
              {(cta || user || menuFooter) && (
                <div className="px-fluid flex shrink-0 flex-col gap-3 border-t py-4">
                  {user ? (
                    <UserPanel {...user} onNavigate={() => setOpen(false)} />
                  ) : cta && (
                    <Link
                      href={cta.href}
                      onClick={() => setOpen(false)}
                      className={buttonVariants({ className: "h-12 w-full gap-2 rounded-full text-base" })}
                    >
                      {cta.icon}
                      {cta.label}
                    </Link>
                  )}
                  {menuFooter}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// Dropdown da barra (xl+): gatilho com alvo >= 2,75rem; itens são <Link> reais (teclado/Esc/foco vêm do base-ui).
function GroupMenu({ group, pathname }: { group: { label: string; items: HeaderItem[] }; pathname: string }) {
  const active = group.items.some((i) => pathname === i.href);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={cn("ink-link font-heading focus-visible:ring-ring flex min-h-11 items-center gap-1 text-lg outline-none focus-visible:ring-2", active && "text-primary")} />}
      >
        {group.label}
        <ChevronDownIcon aria-hidden="true" className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-44 p-1.5">
        {group.items.map((i) => (
          <DropdownMenuItem key={i.href} render={<Link href={i.href} aria-current={pathname === i.href ? "page" : undefined} />} className="font-heading min-h-11 text-lg">
            {i.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
