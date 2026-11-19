# sayildiz.github.io

Personal site for [sametyildiz.dev](https://sametyildiz.dev), published with GitHub Pages.

## What's here

- `index.html` + `styles.css` — homepage. The name and drifting glyph field are
  drawn on a `<canvas>`; the markup stays readable without JavaScript.
- `playground/` — a Three.js scene with rigged SpongeBob and Patrick models.
- `fonts/` — self-hosted JetBrains Mono (no external font requests).
- `404.html`, `favicon.svg`, `robots.txt`, `sitemap.xml` — site plumbing.
- `boxcut/` and `caffeine/` are **not** committed. The deploy workflow builds
  them from their own repositories (`sayildiz/boxcut`, `sayildiz/caffeine-tracker`)
  and copies them into the published site.

## Local preview

Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

`boxcut/` and `caffeine/` will 404 locally unless you build those repos into
those folders (both are gitignored). The playground loads Three.js from
`cdn.jsdelivr.net`, so it needs network access.

## Deploy

Push to `main`, or run the **Deploy site** workflow manually. The workflow:

1. checks out this repo plus the `boxcut` and `caffeine-tracker` repos,
2. builds both with Bun,
3. assembles `_site/` from this repo and the two builds,
4. publishes `_site/` to GitHub Pages.

## Contact and spam

Keep the address out of `<script>` blocks, including the JSON-LD. Cloudflare
Email Address Obfuscation rewrites emails in page text and `<a href>`, but not
inside `<script>` or `<noscript>`. The domain uses Cloudflare Email Routing, so
prefer a rotatable alias (for example `hello@`) over a primary inbox.

## Editing notes

- The canvas measures the real `<h1 id="name">`, so keep that element in the
  normal document flow — don't position it absolutely or hide it from layout.
- Type sizes are in `rem`, and the name is measured in JetBrains Mono. Keep the
  `@font-face` and the font preload in `index.html` in sync.
- New animation should honour `prefers-reduced-motion`, as the homepage and
  playground already do.
