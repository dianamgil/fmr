// eslint.config.js
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default defineConfig([
  globalIgnores(["dist/", ".astro/"]),
  js.configs.recommended,      // reglas generales de JS
  tseslint.configs.recommended, // TypeScript en .ts y en el frontmatter
  astro.configs.recommended,   // reglas de Astro (va al final para que use su parser en .astro)
]);