"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { PauseIcon, PlayIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type CarouselLabels = {
  region: string;
  prev: string;
  next: string;
  pause: string;
  play: string;
  /** Contém "{n}" */ goTo: string;
  /** Contém "{n}" e "{total}" */ slide: string;
};

const fill = (tpl: string, vars: Record<string, number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

// Bolinhas (alvo 44px; a marca visível é menor). Lê o slide atual do embla.
function Dots({ count, labels }: { count: number; labels: CarouselLabels }) {
  const { api } = useCarousel();
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update).on("reInit", update);
    return () => void api.off("select", update).off("reInit", update);
  }, [api]);

  return (
    <div className="flex items-center">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={fill(labels.goTo, { n: i + 1 })}
          aria-current={i === selected ? "true" : undefined}
          onClick={() => api?.scrollTo(i)}
          className="focus-visible:ring-ring flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2"
        >
          <span className={cn("size-2.5 rounded-full border border-current", i === selected && "bg-current")} />
        </button>
      ))}
    </div>
  );
}

// Carrossel com autoplay. Cada slide é um nó já renderizado (server) com a imagem;
// o overlay cinza e todo o comportamento ficam aqui. Controles ficam ABAIXO da imagem
// (não sobre ela): contraste e alvos de 44px sem depender do overlay.
export function HomeCarousel({
  slides,
  labels,
  delayMs = 5000,
  aspectClassName = "aspect-[3/1]",
  className,
}: {
  slides: React.ReactNode[];
  labels: CarouselLabels;
  delayMs?: number;
  /** Proporção fixa dos slides (evita layout shift). */
  aspectClassName?: string;
  className?: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  // Plugin criado uma vez; quem decide play/stop é o efeito abaixo (todas as condições juntas).
  const [autoplay] = useState(() =>
    Autoplay({ delay: delayMs, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: false, stopOnFocusIn: false }),
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Interagir (arrastar/tocar) pausa até a pessoa pedir "continuar" (WCAG 2.2.2).
  useEffect(() => {
    if (!api) return;
    const onPointerDown = () => setUserPaused(true);
    api.on("pointerDown", onPointerDown);
    return () => void api.off("pointerDown", onPointerDown);
  }, [api]);

  const playing = !userPaused && !reduced && !hovered && !focused;
  useEffect(() => {
    if (!api) return;
    if (playing) autoplay.play();
    else autoplay.stop();
  }, [api, playing, autoplay]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      plugins={[autoplay]}
      aria-label={labels.region}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <CarouselContent className="ml-0" aria-live={playing ? "off" : "polite"}>
        {slides.map((slide, i) => (
          <CarouselItem key={i} className="pl-0" aria-label={fill(labels.slide, { n: i + 1, total: slides.length })}>
            {/* aspect fixo: sem layout shift */}
            <div className={cn("relative w-full overflow-hidden", aspectClassName)}>
              {slide}
              {/* Overlay cinza (token ink, constante nos temas). Sem texto sobre ele. */}
              <div aria-hidden="true" data-testid="carousel-overlay" className="bg-ink/35 pointer-events-none absolute inset-0" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <CarouselPrevious label={labels.prev} variant="ghost" size="icon" className="relative inset-auto my-0 size-11 translate-x-0" onClick={() => setUserPaused(true)} />
          <Dots count={slides.length} labels={labels} />
          <CarouselNext label={labels.next} variant="ghost" size="icon" className="relative inset-auto my-0 size-11 translate-x-0" onClick={() => setUserPaused(true)} />
        </div>
        {/* Com movimento reduzido nada se move sozinho: o botão não é necessário. */}
        {!reduced && (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? labels.play : labels.pause}
            className="hover:bg-muted focus-visible:ring-ring flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2"
          >
            {userPaused ? <PlayIcon className="size-5" aria-hidden="true" /> : <PauseIcon className="size-5" aria-hidden="true" />}
          </button>
        )}
      </div>
    </Carousel>
  );
}
