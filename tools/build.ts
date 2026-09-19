/**
 * Builds the whole site into dist/.
 *
 * Deliberately not `deno bundle` over HTML entrypoints: the bundler writes an
 * HTML entry that has no <script type="module"> to dist/<basename>, so every
 * docs page without its own JS would land on dist/index.html and the last one
 * would win. It also does not process <link rel="stylesheet">. So the
 * TypeScript goes through the bundler and the pages are generated here.
 */
import { copy, ensureDir } from "@std/fs";
import { dirname, fromFileUrl, join, resolve } from "@std/path";
import { encodeHex } from "@std/encoding/hex";
import { renderPage } from "../src/shell.ts";
import { APP_ORIGIN, DOCS, SITE_ORIGIN } from "../src/site.ts";
import { homeBody } from "../src/pages/home.ts";
import { docsIndexBody } from "../src/pages/docsIndex.ts";
import { notFoundBody } from "../src/pages/notFound.ts";
import { renderMarkdown, stripLeadingH1 } from "./markdown.ts";
import { esc } from "../src/shell.ts";

const root = resolve(dirname(fromFileUrl(import.meta.url)), "..");
const dist = join(root, "dist");
const liveReload = Deno.args.includes("--live-reload");

/** Content hash, so /assets/* can be cached forever without a stale copy. */
async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return encodeHex(new Uint8Array(buf)).slice(0, 8);
}

async function write(path: string, text: string) {
  const full = join(dist, path);
  await ensureDir(dirname(full));
  await Deno.writeTextFile(full, text);
}

async function bundleScript(): Promise<string> {
  const out = join(dist, "assets");
  await ensureDir(out);

  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      "bundle",
      join(root, "src", "scripts", "site.ts"),
      "--platform",
      "browser",
      "--minify",
      "--outdir",
      out,
    ],
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success } = await cmd.output();
  if (!success) throw new Error("deno bundle failed");

  // The bundler names the output after the entry. Hashing it here rather than
  // asking for --code-splitting keeps one predictable file to find and one
  // name to put in the shell.
  const plain = join(out, "site.js");
  const js = await Deno.readTextFile(plain);
  const name = `site-${await hash(js)}.js`;
  await Deno.rename(plain, join(out, name));
  return `/assets/${name}`;
}

async function bundleStyles(): Promise<string> {
  const parts: string[] = [];
  for (const f of ["site.css", "docs.css", "prism.css"]) {
    parts.push(await Deno.readTextFile(join(root, "src", "styles", f)));
  }
  const css = parts.join("\n");
  const name = `site-${await hash(css)}.css`;
  await ensureDir(join(dist, "assets"));
  await Deno.writeTextFile(join(dist, "assets", name), css);
  return `/assets/${name}`;
}

const scriptUrl = await bundleScript();
const styleUrl = await bundleStyles();
const assets = { scriptUrl, styleUrl, liveReload };

// --- static passthrough -----------------------------------------------------

await copy(join(root, "static"), dist, { overwrite: true });

// --- marketing pages --------------------------------------------------------

await write(
  "index.html",
  renderPage({
    title: "Teleprompter",
    description:
      "An open source teleprompter that runs in your browser. A control page holds the script; any screen can be a display. Peer-to-peer, self-hostable, MIT.",
    path: "/",
    body: homeBody(),
    wide: true,
  }, assets),
);

await write(
  "404.html",
  renderPage({
    title: "Not found",
    description: "That page does not exist.",
    path: "/404.html",
    body: notFoundBody(),
  }, assets),
);

// --- docs -------------------------------------------------------------------

await write(
  "docs/index.html",
  renderPage({
    title: "Documentation",
    description:
      "How to run a service with the teleprompter: operating, shortcuts, themes, architecture and self-hosting.",
    path: "/docs/",
    body: docsIndexBody(),
    docs: { activeSlug: "index", toc: [] },
  }, assets),
);

for (const doc of DOCS) {
  // A page with a `file` is mirrored from the app repo (content/docs); one
  // without is written for this site (content/<slug>.md).
  const source = doc.file
    ? join(root, "content", "docs", doc.file)
    : join(root, "content", `${doc.slug}.md`);

  const md = await Deno.readTextFile(source);
  const { toc, html } = renderMarkdown(md);

  // The site renders its own H1 from DOCS, so the document's own would be a
  // duplicate — and the titles in the sidebar and the heading would be free
  // to drift apart.
  const body = `<h1>${esc(doc.title)}</h1>
<p class="page-blurb">${esc(doc.blurb)}</p>
${stripLeadingH1(html)}`;

  await write(
    `docs/${doc.slug}/index.html`,
    renderPage({
      title: doc.title,
      description: doc.blurb,
      path: `/docs/${doc.slug}/`,
      body,
      docs: { activeSlug: doc.slug, toc },
    }, assets),
  );
}

// --- sitemap ----------------------------------------------------------------

const urls = ["/", "/docs/", ...DOCS.map((d) => `/docs/${d.slug}/`)];
await write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_ORIGIN}${u}</loc></url>`).join("\n")}
</urlset>
`,
);

// Printed because it is baked into the page and invisible afterwards: a build
// made without TELEPROMPTER_APP_ORIGIN points the demo at production, and on a
// dev machine that looks exactly like "the connection is failing".
console.log(`built ${DOCS.length + 3} pages -> dist/`);
console.log(`demo frames ${APP_ORIGIN}`);
