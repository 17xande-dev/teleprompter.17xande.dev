import { Marked, render, Renderer } from "@deno/gfm";
import GithubSlugger from "github-slugger";
import { DOC_TITLE_BY_FILE, DOC_URL_BY_FILE, REPO_BLOB } from "../src/site.ts";
import type { TocEntry } from "../src/shell.ts";

// Prism highlights nothing unless a grammar has registered itself, and
// @deno/gfm picks up whichever have. These five are every language that
// appears in a fence across the app repo's docs; adding a sixth is a line
// here, not a config change.
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-css.js";

/**
 * Rewrites the docs' relative links, which were written to be read on GitHub
 * and point at sibling `.md` files.
 *
 * Done on the token, not on the rendered HTML: the href is in hand before
 * sanitization, and a regex over the output would eventually find a `](` that
 * lives inside a code block. The synced markdown itself is never touched, so
 * `git diff` after a sync stays a clean record of what changed upstream.
 */
export class DocsRenderer extends Renderer {
  override link(token: { href: string; title?: string | null; text: string }) {
    const href = rewriteHref(token.href);
    const text = rewriteText(token.text);
    // `tokens` is what the renderer walks to build the label — the flat
    // `text` is not read at all — so a replacement label has to be handed
    // over as a token of its own rather than by setting `text`.
    const retitled = text === token.text ? token : {
      ...token,
      text,
      tokens: [{ type: "text", raw: text, text, escaped: false }],
    };
    return super.link({ ...retitled, href } as never);
  }
}

/**
 * These docs link to each other by filename — "see [themes.md](themes.md)" —
 * which reads correctly in a repo and badly on a website, where there is no
 * file called that and the page is titled something else.
 */
export function rewriteText(text: string): string {
  const title = DOC_TITLE_BY_FILE.get(text.trim());
  return title ?? text;
}

export function rewriteHref(href: string): string {
  if (/^([a-z]+:|\/\/|#|\/)/i.test(href)) return href;

  const hash = href.indexOf("#");
  const path = (hash === -1 ? href : href.slice(0, hash)).replace(/^\.\//, "");
  const anchor = hash === -1 ? "" : href.slice(hash);

  const local = DOC_URL_BY_FILE.get(path);
  if (local) return local + anchor;

  // Anything else the docs reference — ../CLAUDE.md, ../LICENSE, a source
  // file — exists in the repo but not on this site. Send it to GitHub rather
  // than leaving a link that 404s here.
  return REPO_BLOB + path.replace(/^(\.\.\/)+/, "") + anchor;
}

export interface RenderedDoc {
  /** The H1's text, if the document opened with one. */
  title?: string;
  /** H2s and H3s, with ids matching what the renderer emitted. */
  toc: TocEntry[];
  /** The body fragment — no <html>, no <head>. */
  html: string;
}

export function renderMarkdown(md: string): RenderedDoc {
  // The TOC comes from the token stream rather than from a scrape of the
  // rendered HTML, so the ids here are produced by the same slugger, in the
  // same order, that the renderer used — which is the only thing that
  // guarantees every anchor actually lands.
  const slugger = new GithubSlugger();
  const headings = Marked.lexer(md).filter((t) =>
    t.type === "heading"
  ) as Array<{ depth: number; text: string }>;

  let title: string | undefined;
  const toc: TocEntry[] = [];
  for (const h of headings) {
    const id = slugger.slug(h.text);
    if (h.depth === 1 && !title) title = h.text;
    if (h.depth === 2 || h.depth === 3) {
      toc.push({ depth: h.depth, text: h.text, id });
    }
  }

  return {
    title,
    toc,
    html: render(md, { renderer: new DocsRenderer() as never }),
  };
}

/**
 * The app repo's docs open with an H1 that repeats what the page heading
 * already says. The site renders its own, so drop the leading one.
 */
export function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");
}
