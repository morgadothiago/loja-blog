import Image from "next/image";
import facebook from "@/assets/generated/facebook.png";
import instagram from "@/assets/generated/instagram.png";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

// Ícones desenhados à mão (Iconesredes.png: Instagram e Facebook, pretos). Os dois recortes em
// src/assets/generated/ vêm do MESMO arquivo, sem reduzir resolução (mesmos pixels): era preciso separá-los para
// ter dois links. Sem URL em SITE.social os ícones ficam decorativos (sem tab stop e sem link morto); com URL
// viram links em nova aba com nome acessível. Imagens decorativas (alt=""): o nome é do link.
export function SocialLinks({
  labels,
  className,
  iconClassName = "h-5 w-auto",
}: {
  /** Nomes acessíveis dos links (já traduzidos pelo chamador). */
  labels: { instagram: string; facebook: string };
  className?: string;
  iconClassName?: string;
}) {
  const socials = [
    { key: "instagram", href: SITE.social.instagram, label: labels.instagram, img: instagram },
    { key: "facebook", href: SITE.social.facebook, label: labels.facebook, img: facebook },
  ];
  return (
    <ul className={cn("flex items-center", className)}>
      {socials.map(({ key, href, label, img }) => (
        <li key={key}>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-11 items-center justify-center">
              <Image src={img} alt="" className={iconClassName} />
            </a>
          ) : (
            <span aria-hidden="true" data-testid={`social-${key}-placeholder`} className="flex size-11 items-center justify-center">
              <Image src={img} alt="" className={iconClassName} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
