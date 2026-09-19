import { esc } from "../shell.ts";
import { DOCS, REPO } from "../site.ts";

export function docsIndexBody(): string {
  const cards = DOCS.map((d) =>
    `<li><a href="/docs/${d.slug}/">
  <h2>${esc(d.title)}</h2>
  <p>${esc(d.blurb)}</p>
</a></li>`
  ).join("\n");

  return `<div class="prose">
<h1>Documentation</h1>
<p class="page-blurb">
  How to run a service with this thing, how it works underneath, and how to
  host it yourself.
</p>

<p>
  New here? <a href="/docs/getting-started/">Getting started</a> walks through a
  first show end to end. If you are about to run something that matters,
  <a href="/docs/operating/">Operating</a> is the one to read.
</p>

<ul class="doc-cards">
${cards}
</ul>

<p style="margin-top:2rem">
  These pages are mirrored from the project's own documentation, which lives in
  <a href="${esc(REPO)}/tree/main/docs">the repository</a>. Spotted something
  wrong? <a href="${esc(REPO)}/issues">Open an issue</a>.
</p>
</div>`;
}
