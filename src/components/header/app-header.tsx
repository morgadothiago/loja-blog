"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSolidAfter } from "@/components/header/use-solid-after";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Altura do conteúdo do header (h-[58px]) + 1px da borda.
const HEADER_HEIGHT_PX = 59;

export type HeaderImage = { src: string; width: number; height: number };

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
  /** Ações só no desktop (ex.: idioma, login). */
  desktopActions?: React.ReactNode;
  /** Slot no topo do Sheet, entre o título e o botão fechar (ex.: seletor de idioma compacto). */
  menuHeaderActions?: React.ReactNode;
  /** Rodapé do Sheet (ex.: link do carrinho). */
  menuFooter?: React.ReactNode;
  /** Hambúrguer + overlay em todas as larguras (sem navegação em linha no desktop). */
  overlayOnly?: boolean;
  /** Imagem do botão de fechar do overlay (o nome acessível continua em `labels.closeMenu`). */
  closeImage?: HeaderImage;
  /** Fixa o header no topo ao rolar (`sticky`: reserva o espaço, sem layout shift). */
  sticky?: boolean;
  /** id do elemento (ex.: o hero): enquanto ele aparece o header fica bege; depois, claro com sombra sutil. */
  solidAfterId?: string;
  /** Textos já traduzidos pelo chamador (o componente não conhece i18n). */
  labels: { openMenu: string; closeMenu: string; menuTitle: string; nav: string };
};

// Cabeçalho reutilizável (~58px): marca à esquerda, menu à direita. Mobile: gatilho
// hambúrguer abre um Sheet de tela cheia (foco preso, Esc e aria-modal vêm do base-ui).
export function AppHeader({ brand, brandHref = "/", items, cta, actions, desktopActions, menuHeaderActions, menuFooter, sticky, solidAfterId, overlayOnly, closeImage, labels }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const solid = useSolidAfter(solidAfterId, HEADER_HEIGHT_PX);
  return (
    <header
      className={cn(
        // border-b sempre presente (transparente no hero): a altura não muda na troca. z-40 < Sheet (z-50).
        "border-b transition-colors duration-200 motion-reduce:transition-none",
        sticky && "sticky top-0 z-40",
        // "Branco" = token mais claro do tema (card), não hex solto.
        solid ? "bg-card text-card-foreground border-border shadow-sm" : "bg-secondary text-secondary-foreground border-transparent",
      )}
    >
      {/* 58px é a altura pedida para o header (arbitrário deliberado). */}
      <div className="px-fluid flex h-[58px] w-full items-center gap-2">
        <Link href={brandHref} className="font-heading text-2xl tracking-wide">
          {brand}
        </Link>

        {!overlayOnly && (
          <nav aria-label={labels.nav} className="ml-8 hidden items-center gap-6 lg:flex">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="py-3 text-base hover:underline">
              {i.label}
            </Link>
          ))}
        </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          {actions}
          {!overlayOnly && (desktopActions || cta) && (
            <div className="hidden items-center gap-3 lg:flex">
              {desktopActions}
              {cta && (
                <Link href={cta.href} className={buttonVariants({ variant: "outline", className: "h-11 gap-2 px-4 text-base" })}>
                  {cta.icon}
                  {cta.label}
                </Link>
              )}
            </div>
          )}
          {/* Controlado: itens são <Link> reais (SheetClose+Link viraria role=button) e fecham o menu ao navegar. */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className={cn("size-11", !overlayOnly && "lg:hidden")} aria-label={labels.openMenu} />}
            >
              <MenuIcon className="size-6" />
            </SheetTrigger>
            {/* Mobile: tela cheia. ≥640px: painel lateral (max-w-md) para não esticar demais. */}
            {/* Painel lateral (direita) em todas as larguras: tela cheia em <640px, 28rem (max-w-md) a partir de sm. */}
            <SheetContent
              side="right"
              showCloseButton={false}
              overlayClassName="bg-ink/40"
              className={cn(
                // Cores de marca fixas no painel com letreiros: os PNGs são pretos (precisam de fundo claro).
                overlayOnly ? "bg-paper text-ink" : "bg-background",
                "w-full gap-0 overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-sm motion-reduce:transition-none motion-reduce:duration-0",
              )}
            >
              {/* Cabeçalho fixo do painel */}
              <div className="px-fluid flex h-[58px] shrink-0 items-center gap-2">
                <SheetTitle className="text-2xl">{labels.menuTitle}</SheetTitle>
                <div className="ml-auto flex items-center gap-1">
                  {menuHeaderActions}
                  <SheetClose render={<Button variant="ghost" size="icon" className="size-11" aria-label={labels.closeMenu} />}>
                    {closeImage ? (
                      <Image src={closeImage.src} alt="" width={closeImage.width} height={closeImage.height} className="h-8 w-auto" />
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
                              src={i.image.src}
                              alt={i.label}
                              width={i.image.width}
                              height={i.image.height}
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
                </ul>
              </nav>
              {/* Rodapé fixo: botão de sessão + carrinho */}
              {(cta || menuFooter) && (
                <div className="px-fluid flex shrink-0 flex-col gap-3 border-t py-4">
                  {cta && (
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
