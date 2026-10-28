import { defineConfig } from "astro/config";
import react from "@astrojs/react";
export default defineConfig({
  srcDir: "./apps/web/src",
  publicDir: "./apps/web/public",
  outDir: "./dist",
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: "static",
  trailingSlash: "never",
  markdown: { syntaxHighlight: false },
  integrations: [react()],
  security: {
    csp: {
      scriptDirective: {
        resources: [
          "'self'",
          { resource: "'none'", kind: "attribute" },
          ...(process.env.PUBLIC_CF_ANALYTICS_TOKEN
            ? ["https://static.cloudflareinsights.com"]
            : []),
        ],
      },
      styleDirective: {
        resources: [
          "'self'",
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
  vite: {
    server: {
      proxy: { "/api": { target: "http://127.0.0.1:8787", ws: true } },
    },
  },
});
