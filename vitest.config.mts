import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";

// Imports estáticos de imagem (src/assets): no Next viram { src, width, height }; no Vitest (Vite) viriam só
// uma URL. Este plugin imita o formato do Next lendo as dimensões reais do arquivo (sharp já vem com o Next).
const staticImages: Plugin = {
  name: "static-image-imports",
  enforce: "pre",
  async load(id) {
    const file = id.split("?")[0];
    if (!/\.(png|jpe?g)$/i.test(file) || !file.includes("/src/assets/")) return null;
    const { default: sharp } = await import("sharp");
    const { width, height } = await sharp(file).metadata();
    return `export default ${JSON.stringify({ src: `/_next/static/media/${path.basename(file)}`, width, height })}`;
  },
};

export default defineConfig({
  plugins: [staticImages],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // JSX automático sem plugin React (o plugin exigia babel 8, conflitante).
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // Testes de integração compartilham 1 banco: sem paralelismo entre arquivos.
    fileParallelism: false,
    // next-auth importa "next/server" sem extensão (ESM puro do Node falha): deixa o Vite resolver.
    server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
  },
});
