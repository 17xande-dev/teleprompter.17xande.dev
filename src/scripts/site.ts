// The site's only script. Four small jobs: the mobile nav, the live demo, the
// screenshot lightbox, and the docs sidebar's current-section highlight.

import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";
import "@awesome.me/webawesome/dist/components/copy-button/copy-button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";

navToggle();
liveDemo();
lightbox();
tocHighlight();

function navToggle() {
  const btn = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const nav = document.querySelector<HTMLElement>("#site-nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });
}

/**
 * A room id in the same shape the app mints for itself — the first eight hex
 * characters of a UUID. One per page load, so two visitors never end up
 * driving the same demo, and nothing here is ever persisted.
 */
function newRoom(): string {
  return crypto.randomUUID().slice(0, 8);
}

function liveDemo() {
  const stage = document.querySelector<HTMLElement>("[data-demo]");
  if (!stage) return;

  const origin = stage.dataset.appOrigin;
  if (!origin) return;

  const label = document.querySelector<HTMLElement>("[data-demo-room]");
  const reset = document.querySelector<HTMLButtonElement>("[data-demo-reset]");

  const mount = (room: string) => {
    if (label) label.textContent = room;
    const viewerURL = `${origin}/viewer?room=${room}`;

    // allow: the viewer asks for fullscreen on load and on double-click, the
    // control page reads a gamepad and writes the viewer link to the
    // clipboard. Each is refused silently without this, which looks like the
    // feature being broken rather than the frame withholding it.
    // Both panes get the same portrait box, so the two columns line up top and
    // bottom rather than one running past the other. Portrait is also the
    // honest shape for a viewer: the tablet on the floor and the phone across
    // the room are the displays people actually stand one up on.
    // The logical size is written inline rather than left to fitFrames,
    // because it has to be true on the iframe's *first* layout. Sized by CSS
    // to its column and corrected afterwards, the app inside sees a ~670px
    // viewport, decides it is on a phone, and keeps that layout — the resize
    // that follows does not talk it back out of it.
    const box = (p: { w: number; h: number }) =>
      `data-fit="${p.w}x${p.h}" style="width:${p.w}px;height:${p.h}px"`;

    stage.innerHTML = `
      <figure class="demo-pane">
        <figcaption>Control — this is you</figcaption>
        <div class="demo-frame">
          <iframe title="Teleprompter control page (live demo)"
                  src="${origin}/control?room=${room}"
                  allow="fullscreen; gamepad; clipboard-write"
                  ${box(PANES.control)}></iframe>
        </div>
      </figure>
      <figure class="demo-pane">
        <figcaption>Viewer — the screen they read from</figcaption>
        <div class="demo-frame">
          <iframe title="Teleprompter viewer display (live demo)"
                  src="${viewerURL}"
                  allow="fullscreen"
                  ${box(PANES.viewer)}></iframe>
        </div>
      </figure>`;
    fitFrames(stage);
    reset?.removeAttribute("hidden");
  };

  // Mounted on first intersection rather than on load: two full app instances
  // and a peer connection is a lot to ask of someone who came to read the
  // homepage, and a visit that never scrolls this far should cost the
  // signalling server nothing.
  //
  // Skipped altogether below DEMO_MIN, where the CSS has already replaced the
  // stage with a link out. Mounting anyway would open a room and pull two
  // copies of the app down a phone connection to show nobody.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      if (globalThis.innerWidth < DEMO_MIN) return;
      io.disconnect();
      mount(newRoom());
    }
  }, { rootMargin: "200px" });
  io.observe(stage);

  reset?.addEventListener("click", () => {
    // Replacing the iframes tears the old peer connection down with them, and
    // the old room disappears server-side once nobody is in it.
    stage.innerHTML = "";
    mount(newRoom());
  });
}

/**
 * The logical box each pane is laid out in before being scaled to its column.
 *
 * Both are 4:5, so the two columns come out the same height and line up. The
 * numbers differ because the panes want opposite things:
 *
 * - The control page has to clear the app's own 48rem breakpoint, or it gives
 *   the iframe its phone layout — one pane at a time, which is the opposite of
 *   what this demo exists to show. 1024 clears it with room to spare.
 * - The viewer has no breakpoint to satisfy and is meant to be *read*, so it
 *   gets a smaller box and is scaled up rather than down. At 640 the script
 *   lands about 1.6x larger than the control's scale would have made it, which
 *   is the difference between a thumbnail and something you can follow and
 *   scroll.
 */
const PANES = {
  control: { w: 1024, h: 1280 },
  viewer: { w: 640, h: 800 },
};

/**
 * Viewport width below which the demo is not shown at all. Two applications
 * side by side have nowhere to go on a phone, and shrinking them far enough to
 * fit produces something nobody can read or use.
 */
const DEMO_MIN = 1024;

/**
 * Lays each frame out at its logical size and scales the result to fit the
 * column it is in, so the app inside believes it has a desktop viewport while
 * the page spends only the space it can afford.
 */
function fitFrames(root: ParentNode) {
  const frames = [...root.querySelectorAll<HTMLElement>(".demo-frame")];
  if (frames.length === 0) return;

  const fit = (frame: HTMLElement) => {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;

    const available = frame.clientWidth;
    if (available === 0) return;

    const [w, h] = (iframe.dataset.fit ?? "").split("x").map(Number);
    if (!w || !h) return;

    // Only the transform and the box it collapses into. The iframe's own
    // width and height are set inline at construction and never change, which
    // is what keeps the app inside from ever seeing a phone-sized viewport.
    const scale = available / w;
    iframe.style.transform = `scale(${scale})`;
    frame.style.height = `${h * scale}px`;
  };

  // clientWidth is read inside the observer callback, so the first fit comes
  // from the same place every later one does rather than from a layout that
  // may not have happened yet.
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) fit(e.target as HTMLElement);
  });
  for (const f of frames) ro.observe(f);
}

function lightbox() {
  const dialog = document.querySelector<HTMLElement & { open: boolean }>(
    "[data-lightbox]",
  );
  const img = document.querySelector<HTMLImageElement>("[data-lightbox-img]");
  if (!dialog || !img) return;

  for (const btn of document.querySelectorAll<HTMLElement>("[data-shot]")) {
    btn.addEventListener("click", () => {
      const src = btn.dataset.shot;
      if (!src) return;
      img.src = src;
      img.alt = btn.querySelector("img")?.alt ?? "";
      dialog.open = true;
    });
  }
}

/** Marks the docs contents entry whose section is currently on screen. */
function tocHighlight() {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>(".toc a[href^='#']"),
  ];
  if (links.length === 0) return;

  const byId = new Map(
    links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]),
  );
  const headings = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of links) a.classList.remove("current");
      byId.get(e.target.id)?.classList.add("current");
    }
    // Only ever one highlight: the topmost heading that has crossed into the
    // band below the header. A rootMargin that leaves just that band is what
    // makes "which section am I in" a single answer rather than every heading
    // on screen claiming it.
  }, { rootMargin: "-80px 0px -75% 0px" });

  for (const h of headings) io.observe(h);
}
