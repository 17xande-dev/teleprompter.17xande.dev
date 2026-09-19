/**
 * Dev server: serves dist/, rebuilds when a source file changes, and tells
 * open pages to reload.
 *
 * It does not send the production CSP from static/_headers — Pages applies
 * that, this does not — so a policy problem will only show up on a real
 * deploy. The live-reload snippet the build injects under --live-reload is
 * itself inline, which that policy would refuse, so the two could not both be
 * true at once anyway.
 */
import { serveDir } from "@std/http/file-server";
import { dirname, fromFileUrl, join, resolve } from "@std/path";

const root = resolve(dirname(fromFileUrl(import.meta.url)), "..");
const dist = join(root, "dist");
const port = Number(Deno.env.get("PORT") ?? 4507);

const listeners = new Set<ReadableStreamDefaultController<Uint8Array>>();
let building = false;

async function rebuild() {
  if (building) return;
  building = true;
  try {
    const { success } = await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", join(root, "tools", "build.ts"), "--live-reload"],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!success) {
      console.error("build failed — leaving the last good dist/ in place");
      return;
    }
    const msg = new TextEncoder().encode("data: reload\n\n");
    for (const c of listeners) {
      try {
        c.enqueue(msg);
      } catch {
        listeners.delete(c);
      }
    }
  } finally {
    building = false;
  }
}

// One rebuild per burst: an editor writing a file produces several events, and
// a formatter on save produces several more.
(async () => {
  const watcher = Deno.watchFs([
    join(root, "src"),
    join(root, "content"),
    join(root, "static"),
  ]);
  // The DOM lib is in scope for src/scripts, so setTimeout's return type here
  // is Node's Timeout rather than Deno's number. Inferred, not annotated.
  let timer: ReturnType<typeof setTimeout> | undefined;
  for await (const _ of watcher) {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  }
})();

Deno.serve({ port }, (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/__reload") {
    return new Response(
      new ReadableStream({
        start: (c) => listeners.add(c),
        cancel: () => {},
      }),
      {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-store",
        },
      },
    );
  }

  return serveDir(req, {
    fsRoot: dist,
    quiet: true,
    showIndex: true,
  }).then(async (res) => {
    // Pages serves 404.html for anything unmatched; mirror that here so the
    // page can actually be looked at during development.
    if (res.status !== 404) return res;
    const body = await Deno.readTextFile(join(dist, "404.html")).catch(() =>
      null
    );
    if (body === null) return res;
    return new Response(body, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  });
});

console.log(`serving dist/ on http://localhost:${port}`);
