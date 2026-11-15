import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig(
  {
    ignores: ['node_modules/**', 'out/**', 'dist/**', '.astro/**'],
  },
  tseslint.configs.recommended,
  astro.configs.recommended,
);
