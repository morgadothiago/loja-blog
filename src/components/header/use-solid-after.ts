"use client";

import { useEffect, useState } from "react";

// true quando o elemento `targetId` já saiu de vista por trás do header (rolou além dele).
// IntersectionObserver (sem listener de scroll); `rootMargin` desconta a altura do header, então a troca
// acontece quando o fim do alvo passa por baixo dele. O primeiro callback do observer corrige o
// estado se a página já abriu rolada. Sem alvo no DOM, fica em false (estado do hero).
export function useSolidAfter(targetId: string | undefined, headerHeightPx: number) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { rootMargin: `-${headerHeightPx}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId, headerHeightPx]);

  return solid;
}
