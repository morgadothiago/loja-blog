import { describe, expect, it } from "vitest";
import * as ProjectPage from "@/app/(home)/(sections)/projetos/[slug]/page";
import * as ResidencyPage from "@/app/(home)/(sections)/festivais-e-residencias/[slug]/page";
import * as PracticePage from "@/app/(home)/(sections)/praticas/[tipo]/page";
import { CONTENT_SECTIONS } from "@/lib/content";
import { PRACTICES, PRACTICE_SLUGS, type Localized } from "@/lib/content/details";
import { getPractice, getProject, getResidency, otherResidencies, projectSlugs, projectsByPractice, residencySlugs } from "@/lib/content/lookup";
import { PROJECT_DETAILS } from "@/lib/content/projects";
import { RESIDENCY_DETAILS } from "@/lib/content/residencies";
import { LOCALES } from "@/lib/i18n";

const filled = (l: Localized) => LOCALES.every((loc) => typeof l[loc] === "string" && l[loc].trim().length > 0);

describe("completude do conteúdo (spec 0012, 5.1-B)", () => {
  const all = [...PROJECT_DETAILS, ...RESIDENCY_DETAILS];

  it.each(all.map((d) => [d.slug, d] as const))("%s: summary, body, alt de capa e galeria nas 3 línguas", (_slug, d) => {
    expect(filled(d.summary)).toBe(true);
    expect(d.body.length).toBeGreaterThan(0);
    d.body.forEach((p) => expect(filled(p)).toBe(true));
    expect(filled(d.cover.alt)).toBe(true);
    d.gallery.forEach((g) => expect(filled(g.alt)).toBe(true));
  });

  it("créditos das residências nas 3 línguas", () => {
    for (const r of RESIDENCY_DETAILS) (r.credits ?? []).forEach((c) => expect(filled(c)).toBe(true));
  });

  it("slugs únicos e idênticos aos das entradas das listas (nenhum card aponta para 404)", () => {
    expect(new Set(all.map((d) => d.slug)).size).toBe(all.length);
    for (const [section, details] of [
      ["projects", PROJECT_DETAILS],
      ["festivals", RESIDENCY_DETAILS],
    ] as const) {
      const hrefs = CONTENT_SECTIONS[section].map((e) => e.href);
      expect(hrefs.every(Boolean)).toBe(true);
      expect(hrefs.map((h) => h!.split("/").pop()).sort()).toEqual(details.map((d) => d.slug).sort());
    }
    // exposições e livros: sem detalhe
    for (const section of ["exhibitions", "books"] as const) {
      expect(CONTENT_SECTIONS[section].every((e) => !e.href)).toBe(true);
    }
  });

  it("toda prática do conteúdo existe e as rotas em português cobrem as 3 práticas", () => {
    expect(PROJECT_DETAILS.every((p) => PRACTICES.includes(p.practice))).toBe(true);
    expect(Object.values(PRACTICE_SLUGS).sort()).toEqual([...PRACTICES].sort());
  });
});

describe("lookup", () => {
  it("slug válido devolve entrada + detalhe; inexistente, vazio e propriedade herdada: undefined", () => {
    expect(getProject("projeto-exemplo-1")?.entry.id).toBe("projects-1");
    expect(getResidency("residencia-exemplo-2")?.entry.id).toBe("festivals-2");
    for (const bad of ["", "nao-existe", "__proto__", "constructor", "projeto-exemplo-1/../x"]) {
      expect(getProject(bad)).toBeUndefined();
      expect(getResidency(bad)).toBeUndefined();
    }
    // slug de projeto não abre residência e vice-versa
    expect(getResidency("projeto-exemplo-1")).toBeUndefined();
  });

  it("getPractice: só as 3 rotas; chaves herdadas não passam", () => {
    expect(getPractice("desenho")).toBe("drawing");
    expect(getPractice("ceramica")).toBe("ceramic");
    expect(getPractice("colagem")).toBe("collage");
    for (const bad of ["drawing", "", "toString", "__proto__", "Desenho"]) expect(getPractice(bad)).toBeUndefined();
  });

  it("projectsByPractice filtra pelo tipo; otherResidencies exclui a atual e limita a 3", () => {
    for (const p of PRACTICES) {
      expect(projectsByPractice(p).every((w) => w.detail.practice === p)).toBe(true);
    }
    const others = otherResidencies("residencia-exemplo-1");
    expect(others.map((o) => o.detail.slug)).toEqual(["residencia-exemplo-2", "residencia-exemplo-3"]);
    expect(otherResidencies("nao-existe").length).toBeLessThanOrEqual(3);
  });
});

describe("generateStaticParams e dynamicParams (slug fora do conteúdo = 404)", () => {
  it("cobre exatamente os slugs do conteúdo", async () => {
    expect(ProjectPage.generateStaticParams()).toEqual(projectSlugs().map((slug) => ({ slug })));
    expect(ResidencyPage.generateStaticParams()).toEqual(residencySlugs().map((slug) => ({ slug })));
    expect(PracticePage.generateStaticParams()).toEqual([{ tipo: "desenho" }, { tipo: "ceramica" }, { tipo: "colagem" }]);
    expect(ProjectPage.dynamicParams).toBe(false);
    expect(ResidencyPage.dynamicParams).toBe(false);
    expect(PracticePage.dynamicParams).toBe(false);
  });
});
