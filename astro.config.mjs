// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon'; // integración de iconos (astro-icon)

// https://astro.build/config
export default defineConfig({
  
 integrations: [icon()], // registra astro-icon para poder usar <Icon name="..." />
 vite: {
    plugins: [tailwindcss()]
  }
});