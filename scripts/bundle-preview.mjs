/**
 * Bundles `dist/` into one self-contained HTML fragment for a hosted preview
 * (Claude Artifacts, or any static host). CSS and JS are inlined, so the page
 * makes no requests beyond the webfont.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dist = "dist/assets";
const out = process.argv[2] ?? "preview/tonite.html";

const assets = readdirSync(dist);
const css = assets.filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(dist, f), "utf8"));
const js = assets.filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(dist, f), "utf8"));
const safe = (code) => code.replaceAll("</script", "<\\/script");

const html = `<title>TONITE</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap"
  rel="stylesheet"
/>
<style>
${css.join("\n")}
</style>
<div id="root"></div>
<script type="module">
${js.map(safe).join("\n")}
</script>
`;

mkdirSync(out.split("/").slice(0, -1).join("/") || ".", { recursive: true });
writeFileSync(out, html);
console.log(`${out} — ${(html.length / 1024).toFixed(0)} kB`);
