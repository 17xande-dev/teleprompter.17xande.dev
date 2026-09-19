# teleprompter.17xande.dev

The marketing and documentation site for
[teleprompter](https://github.com/17xande-dev/teleprompter) — an open source
teleprompter that runs in your browser.

Static output, no framework, no `node_modules`. TypeScript bundled by Deno, the
same toolchain the app itself uses, deployed to Cloudflare Pages.

## Run it

```sh
deno task dev          # build, serve dist/ on :4507, rebuild on change
```

The homepage embeds the **real app** in two iframes. Point them at a local
server rather than production:

```sh
# in the app repo — -dev is what lets localhost frame it
cd ../teleprompter && deno task dev

# here
TELEPROMPTER_APP_ORIGIN=http://localhost:8080 deno task dev
```

Without that variable the demo frames `https://app.teleprompter.17xande.dev`.

## Tasks

| Task                  | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `deno task dev`       | Build, serve, watch                                    |
| `deno task build`     | Clean build into `dist/`                               |
| `deno task sync-docs` | Re-copy the app repo's `docs/*.md` into `content/docs` |
| `deno task check`     | Type-check `src` and `tools`                           |
| `deno task test`      | The docs-link guards                                   |
| `deno task lint`      | Lint `src` and `tools`                                 |
| `deno task deploy`    | Publish `dist/` to Cloudflare Pages                    |

## How it fits together

`tools/build.ts` is the whole build. It bundles the one browser entry
(`src/scripts/site.ts`), copies `static/`, concatenates the stylesheets, and
generates every page through `src/shell.ts`. Assets are content-hashed so
`/assets/*` can be cached forever.

`deno bundle` is **not** given the HTML as entrypoints: an HTML entry with no
`<script type="module">` gets written to `dist/<basename>`, so every docs page
would land on `dist/index.html` and the last one would win.

### The docs are mirrored, not written here

`content/docs/*.md` is a byte-for-byte copy of the app repo's `docs/`, pulled in
by `deno task sync-docs` and committed — Cloudflare Pages builds from this
checkout alone and has no copy of the app repo to read. Keeping the copy
verbatim is what makes `git diff` after a sync a readable record of what
actually changed upstream.

Everything that has to differ on a website happens at render time in
`tools/markdown.ts`: relative `themes.md` links become `/docs/themes/`, links to
files this site does not publish go to GitHub, and a link whose _text_ is a bare
filename is relabelled with the page's title. **Edit the docs in the app repo**,
then sync.

`tools/sync-docs_test.ts` fails if a doc starts linking to a `.md` this site
does not publish, which is what a rename upstream looks like from here.

### The live demo

`src/scripts/site.ts` mints a room id in the browser — `crypto.randomUUID()`
sliced to eight characters, the same shape the app gives itself — so every
visitor drives their own demo and nobody shares one. The iframes are injected on
first intersection, so a visit that never scrolls that far never opens a room.

The control frame is laid out at 1280 CSS pixels and scaled down to fit its
column. Without that the app sees a narrow viewport and switches to its phone
layout, which is the opposite of what the demo is there to show. Below 640px
there is no width to scale into, so it is left alone — a phone should see the
phone layout.

Two things in the **app** repo make this possible, and breaking either one makes
the demo a pair of blank rectangles:

- `frame-ancestors` in `src/backend/main.go` names this site's origin.
- `src/frontend/scripts/viewer.ts` treats the presence of `?room=` — not the
  absence of framing — as "I am a real viewer".

A framing refusal is only ever reported in **this** page's console, never the
app's logs.

## Deploying

Cloudflare Pages, build command `deno task build`, output `dist`, with
`DENO_VERSION` set. `static/_headers` carries the CSP, which admits no
third-party origin at all — Web Awesome is bundled rather than pulled from a CDN
and the icons are inline SVG — except `frame-src` for the app being framed.

## Licence

[MIT](https://github.com/17xande-dev/teleprompter/blob/main/LICENSE), same as
the app.
