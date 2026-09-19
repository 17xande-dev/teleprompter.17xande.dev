/**
 * Everything about this site that more than one file needs to agree on.
 */

/**
 * Where the app is served from. The demo frames this origin, so it has to
 * match what the app's own `frame-ancestors` admits (see the app repo's
 * docs/deploying.md) — otherwise the iframes come up blank with the refusal
 * reported only in *this* page's console.
 *
 * Overridable at build time so `deno task dev` can point at a local server:
 *
 *   TELEPROMPTER_APP_ORIGIN=http://localhost:8080 deno task dev
 */
export const APP_ORIGIN = env("TELEPROMPTER_APP_ORIGIN") ??
  "https://app.teleprompter.17xande.dev";

/**
 * Reading an env var throws when the permission was not granted, and this
 * module is imported by every tool here — including the tests, which are run
 * without one. An override that is absent and an override that could not be
 * read mean the same thing to everything downstream: use the default.
 */
function env(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

export const SITE_ORIGIN = "https://teleprompter.17xande.dev";
export const REPO = "https://github.com/17xande-dev/teleprompter";
export const REPO_BLOB = `${REPO}/blob/main/`;

export const SITE_NAME = "Teleprompter";
export const TAGLINE = "An open source teleprompter that runs in your browser.";

/**
 * The docs, in reading order — which is also sidebar order.
 *
 * `file` is the name in content/docs (synced verbatim from the app repo);
 * `slug` is the URL segment. A page with no `file` is written here on the
 * site rather than lifted from the app repo.
 */
export interface DocPage {
  slug: string;
  title: string;
  blurb: string;
  file?: string;
}

export const DOCS: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    blurb: "Your first show, from opening the page to text moving on a screen.",
  },
  {
    slug: "operating",
    title: "Operating",
    blurb:
      "The manual: the script, scrolling, screens, clocks, messages, the controller.",
    file: "operating.md",
  },
  {
    slug: "shortcuts",
    title: "Keyboard & controller",
    blurb: "Every command, with its keys and its gamepad button.",
    file: "shortcuts.md",
  },
  {
    slug: "themes",
    title: "Themes",
    blurb: "Writing your own viewer layout in plain CSS.",
    file: "themes.md",
  },
  {
    slug: "architecture",
    title: "Architecture",
    blurb:
      "How the pieces fit: signalling, peer topology, what crosses the wire.",
    file: "architecture.md",
  },
  {
    slug: "deploying",
    title: "Self-hosting",
    blurb: "Docker, TLS, TURN, and why HTTPS is worth having.",
    file: "deploying.md",
  },
  {
    slug: "development",
    title: "Development",
    blurb: "The build, the gates, and how to check a change is real.",
    file: "development.md",
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    blurb: "Open decisions, what is wanted next, ideas.",
    file: "roadmap.md",
  },
];

/**
 * Markdown link targets that resolve to a page on this site. Anything else
 * relative is rewritten to the file on GitHub — see tools/markdown.ts.
 */
export const DOC_URL_BY_FILE = new Map<string, string>(
  DOCS.filter((d) => d.file).map((d) => [d.file!, `/docs/${d.slug}/`]),
);
// The app repo's docs/README.md is its own index; ours is /docs/.
DOC_URL_BY_FILE.set("README.md", "/docs/");

/**
 * The title to show when a doc links to another by bare filename, which is
 * how they cross-reference each other in the repo.
 */
export const DOC_TITLE_BY_FILE = new Map<string, string>(
  DOCS.filter((d) => d.file).map((d) => [d.file!, d.title]),
);
DOC_TITLE_BY_FILE.set("README.md", "the documentation index");
