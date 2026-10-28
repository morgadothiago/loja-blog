// Placeholders originais e abstratos (sem ativos de terceiros). Só tokens de marca:
// trocar por <Image> quando houver arte final. Decorativos: aria-hidden.
type Variant = "hero" | "banner" | "banner-b" | "banner-c" | "card-a" | "card-b" | "card-c" | "feature" | "side" | "side-b";

const VIEWBOX: Record<Variant, string> = {
  hero: "0 30 400 220",
  banner: "0 0 600 200",
  "banner-b": "0 0 600 200",
  "banner-c": "0 0 600 200",
  "card-a": "0 0 300 300",
  "card-b": "0 0 300 300",
  "card-c": "0 0 300 300",
  feature: "0 0 200 240",
  side: "0 0 120 200",
  "side-b": "0 0 120 200",
};

function Shapes({ variant }: { variant: Variant }) {
  switch (variant) {
    case "hero":
      return (
        <>
          <ellipse cx="200" cy="190" rx="170" ry="42" className="fill-purple" />
          <path d="M60 170 Q200 40 340 165 Q200 130 60 170Z" className="fill-salmon" />
          <circle cx="205" cy="70" r="14" className="fill-coral" />
          <path d="M30 120 Q60 100 90 135" className="stroke-teal" fill="none" strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "banner":
      return (
        <>
          <rect width="600" height="200" className="fill-teal" />
          <path d="M0 140 Q150 60 300 120 T600 90 V200 H0Z" className="fill-salmon" />
          <circle cx="120" cy="60" r="26" className="fill-paper" />
          <circle cx="470" cy="70" r="18" className="fill-mustard" />
          <path d="M0 170 Q200 120 380 165 T600 150" className="stroke-paper" fill="none" strokeWidth="5" />
        </>
      );
    case "banner-b":
      return (
        <>
          <rect width="600" height="200" className="fill-coral" />
          <circle cx="300" cy="100" r="70" className="fill-mustard" />
          <path d="M0 150 Q150 90 300 140 T600 120 V200 H0Z" className="fill-navy" />
        </>
      );
    case "banner-c":
      return (
        <>
          <rect width="600" height="200" className="fill-navy" />
          <path d="M0 120 Q100 40 200 110 T400 90 T600 130" className="stroke-teal" fill="none" strokeWidth="10" strokeLinecap="round" />
          <circle cx="480" cy="55" r="24" className="fill-salmon" />
        </>
      );
    case "card-a":
      return (
        <>
          <rect width="300" height="300" className="fill-paper" />
          <path d="M150 300 V150 M150 190 L90 130 M150 170 L210 110" className="stroke-navy" fill="none" strokeWidth="6" strokeLinecap="round" />
          <circle cx="150" cy="110" r="36" className="fill-teal" />
        </>
      );
    case "card-b":
      return (
        <>
          <rect width="300" height="300" className="fill-coral" />
          <circle cx="150" cy="150" r="80" className="fill-navy" />
          <circle cx="150" cy="150" r="40" className="fill-mustard" />
        </>
      );
    case "card-c":
      return (
        <>
          <rect width="300" height="300" className="fill-navy" />
          <path d="M0 220 Q150 150 300 220 V300 H0Z" className="fill-coral" />
          <circle cx="220" cy="70" r="22" className="fill-mustard" />
        </>
      );
    case "feature":
      return (
        <>
          <circle cx="100" cy="70" r="46" className="fill-mustard" />
          <path d="M100 116 V190 M100 150 L60 120 M100 150 L140 120" className="stroke-ink" fill="none" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="100" cy="215" rx="70" ry="14" className="fill-salmon" />
        </>
      );
    case "side-b":
      return (
        <>
          <path d="M60 190 Q70 120 55 70" className="stroke-navy" fill="none" strokeWidth="5" strokeLinecap="round" />
          <circle cx="55" cy="55" r="26" className="fill-purple" />
          <circle cx="82" cy="85" r="16" className="fill-salmon" />
          <circle cx="36" cy="92" r="14" className="fill-coral" />
        </>
      );
    case "side":
      return (
        <>
          <rect x="20" y="20" width="80" height="140" className="fill-navy" />
          <circle cx="60" cy="90" r="24" className="fill-salmon" />
        </>
      );
  }
}

export function PlaceholderArt({ variant, className }: { variant: Variant; className?: string }) {
  return (
    <svg
      viewBox={VIEWBOX[variant]}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <Shapes variant={variant} />
    </svg>
  );
}
