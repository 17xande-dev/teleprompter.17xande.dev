import { assert, assertEquals } from "@std/assert";
import { dirname, fromFileUrl, join, resolve } from "@std/path";
import { DOCS, REPO_BLOB } from "../src/site.ts";
import { rewriteHref } from "./markdown.ts";

const root = resolve(dirname(fromFileUrl(import.meta.url)), "..");

Deno.test("every doc named in DOCS has a source file", async () => {
  for (const doc of DOCS) {
    const path = doc.file
      ? join(root, "content", "docs", doc.file)
      : join(root, "content", `${doc.slug}.md`);
    const stat = await Deno.stat(path).catch(() => null);
    assert(stat?.isFile, `missing source for /docs/${doc.slug}/: ${path}`);
  }
});

Deno.test("relative links resolve, not 404", () => {
  // A sibling .md that this site publishes becomes a site URL.
  assertEquals(rewriteHref("themes.md"), "/docs/themes/");
  assertEquals(rewriteHref("./operating.md"), "/docs/operating/");
  assertEquals(
    rewriteHref("architecture.md#rooms-links-and-control"),
    "/docs/architecture/#rooms-links-and-control",
  );
  // The app repo's docs index is this site's /docs/.
  assertEquals(rewriteHref("README.md"), "/docs/");

  // Anything the docs reference that this site does not publish goes to the
  // file on GitHub rather than to a dead link here.
  assertEquals(rewriteHref("../CLAUDE.md"), `${REPO_BLOB}CLAUDE.md`);
  assertEquals(rewriteHref("../LICENSE"), `${REPO_BLOB}LICENSE`);

  // Absolute and in-page targets are left exactly as written.
  for (
    const href of ["https://deno.com", "#unavailable", "/docs/", "mailto:a@b.c"]
  ) {
    assertEquals(rewriteHref(href), href);
  }
});

// The guard that actually catches a rename upstream: if a doc is renamed or
// dropped in the app repo, some other doc's link to it silently starts
// pointing at GitHub instead of at this site. This fails instead.
Deno.test("no synced doc links to a .md this site should be publishing", async () => {
  const publishing = new Set(
    DOCS.map((d) => d.file).filter((f): f is string => !!f),
  );

  for (const doc of DOCS) {
    const path = doc.file
      ? join(root, "content", "docs", doc.file)
      : join(root, "content", `${doc.slug}.md`);
    const md = await Deno.readTextFile(path);

    for (const m of md.matchAll(/\]\(([^)\s]+\.md)(#[^)\s]*)?\)/g)) {
      const target = m[1].replace(/^\.\//, "");
      if (target.startsWith("../")) continue; // deliberately off-site
      assert(
        publishing.has(target) || target === "README.md",
        `${doc.file ?? doc.slug}.md links to ${target}, which this site does ` +
          `not publish — add it to DOCS or the link will go to GitHub`,
      );
    }
  }
});
