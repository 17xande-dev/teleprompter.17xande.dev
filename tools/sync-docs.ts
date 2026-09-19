/**
 * Copies the app repo's docs into content/docs, verbatim.
 *
 * The app repo is where these are authored and, for shortcuts.md, generated —
 * so this is a one-way mirror, never an edit. Copying byte for byte is what
 * makes `git diff` after a sync a readable record of what actually changed
 * upstream; every rewrite (the relative .md links, the dropped H1) happens at
 * render time instead. See tools/markdown.ts.
 *
 * Not part of `deno task build`: Cloudflare Pages builds from this checkout
 * alone and has no copy of the app repo to read. The synced files are
 * committed for the same reason.
 *
 *   deno task sync-docs
 *   TELEPROMPTER_REPO=../elsewhere deno task sync-docs
 */
import { dirname, fromFileUrl, join, resolve } from "@std/path";
import { DOCS } from "../src/site.ts";

const siteRoot = resolve(dirname(fromFileUrl(import.meta.url)), "..");
const appRepo = resolve(
  siteRoot,
  Deno.env.get("TELEPROMPTER_REPO") ?? "../teleprompter",
);
const src = join(appRepo, "docs");
const dest = join(siteRoot, "content", "docs");

const wanted = DOCS.map((d) => d.file).filter((f): f is string => !!f);

async function appRepoCommit(): Promise<string> {
  try {
    const out = await new Deno.Command("git", {
      args: ["-C", appRepo, "rev-parse", "HEAD"],
      stdout: "piped",
      stderr: "null",
    }).output();
    return out.success
      ? new TextDecoder().decode(out.stdout).trim()
      : "unknown";
  } catch {
    return "unknown";
  }
}

if (!(await Deno.stat(src).catch(() => null))?.isDirectory) {
  console.error(
    `No docs at ${src}.\nSet TELEPROMPTER_REPO to the teleprompter checkout.`,
  );
  Deno.exit(1);
}

await Deno.mkdir(dest, { recursive: true });

let changed = 0;
for (const file of wanted) {
  const from = join(src, file);
  const to = join(dest, file);
  const text = await Deno.readTextFile(from).catch(() => null);
  if (text === null) {
    console.error(`missing in app repo: docs/${file}`);
    Deno.exit(1);
  }
  const before = await Deno.readTextFile(to).catch(() => null);
  if (before === text) continue;
  await Deno.writeTextFile(to, text);
  console.log(`${before === null ? "added" : "updated"}  docs/${file}`);
  changed++;
}

const commit = await appRepoCommit();
await Deno.writeTextFile(
  join(dest, ".synced-from"),
  `${commit}\n`,
);

console.log(
  changed === 0
    ? `already up to date with ${commit.slice(0, 8)}`
    : `${changed} file(s) synced from ${commit.slice(0, 8)}`,
);
