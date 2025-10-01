import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://sametyildiz.dev/',
	output: 'hybrid',
	integrations: [tailwind(), sitemap()],
});
