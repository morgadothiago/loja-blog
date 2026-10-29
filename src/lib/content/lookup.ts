import { CONTENT_SECTIONS, type ContentEntry } from "@/lib/content";
import { PRACTICE_SLUGS, type PracticeId, type ProjectDetail, type ResidencyDetail } from "@/lib/content/details";
import { PROJECT_DETAILS } from "@/lib/content/projects";
import { RESIDENCY_DETAILS } from "@/lib/content/residencies";

// Une a entrada da lista (título/meta em i18n) ao detalhe (texto longo em arquivo) pelo slug. Slug fora do
// conteúdo = undefined (a página chama notFound()).
const slugOf = (entry: ContentEntry) => entry.href?.split("/").pop();

function join<D extends { slug: string }>(entries: ContentEntry[], details: D[], slug: string) {
  const entry = entries.find((e) => slugOf(e) === slug);
  const detail = details.find((d) => d.slug === slug);
  return entry && detail ? { entry, detail } : undefined;
}

export const getProject = (slug: string) => join<ProjectDetail>(CONTENT_SECTIONS.projects, PROJECT_DETAILS, slug);
export const getResidency = (slug: string) => join<ResidencyDetail>(CONTENT_SECTIONS.festivals, RESIDENCY_DETAILS, slug);

export const projectSlugs = () => PROJECT_DETAILS.map((d) => d.slug);
export const residencySlugs = () => RESIDENCY_DETAILS.map((d) => d.slug);

export function getPractice(slug: string): PracticeId | undefined {
  return Object.hasOwn(PRACTICE_SLUGS, slug) ? PRACTICE_SLUGS[slug] : undefined;
}

export function projectsByPractice(practice: PracticeId) {
  return CONTENT_SECTIONS.projects.flatMap((entry) => {
    const slug = slugOf(entry);
    const detail = PROJECT_DETAILS.find((d) => d.slug === slug);
    return detail && detail.practice === practice ? [{ entry, detail }] : [];
  });
}

/** Outras residências (até 3), na ordem da lista. */
export function otherResidencies(slug: string) {
  return CONTENT_SECTIONS.festivals
    .filter((e) => slugOf(e) !== slug)
    .flatMap((entry) => {
      const detail = RESIDENCY_DETAILS.find((d) => d.slug === slugOf(entry));
      return detail ? [{ entry, detail }] : [];
    })
    .slice(0, 3);
}
