// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from "@tailwindcss/vite";

import markdoc from "@astrojs/markdoc";

// https://astro.build/config
export default defineConfig({
  site: "https://slmply.github.io/",

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [markdoc()]
});