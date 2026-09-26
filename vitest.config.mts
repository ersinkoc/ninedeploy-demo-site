import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Birim testleri saf modüllerin üstünde koşar (Node ortamı, JSOM gerekmez).
 * `@` takma adı tsconfig ile birebir aynı: ./src
 * Rezervasyon store'u gerçekten dosyaya yazar → testler .temp_files altına yazar
 * (gitignore'da zaten var), proje `.data/` dizinine dokunmaz.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      RESERVATIONS_DIR: ".temp_files/reservations-test",
      // Demo modu zorunlu kıl: testlerde gerçek Stripe çağrısı yapılmaz.
      STRIPE_SECRET_KEY: "",
    },
    pool: "forks",
  },
});
