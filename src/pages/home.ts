import { esc, icons } from "../shell.ts";
import { APP_ORIGIN, REPO } from "../site.ts";

interface Shot {
  file: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

/**
 * The gallery. Captured from the real app running locally at a 1440x900
 * viewport and 2x DPR, then resized to 2048 wide. Dimensions are written down
 * so the page reserves the space before the image arrives.
 */
const SHOT_W = 2048;
const SHOT_H = 1280;

export const SHOTS: Shot[] = [
  {
    file: "control",
    alt:
      "The control page: a formatted script in the editor on the left with bold section headings and yellow italic stage directions, and a sidebar holding a live preview of the viewer, scroll speed and text size sliders, and a countdown clock.",
    caption: "The control page — script, transport, and a live preview.",
    width: SHOT_W,
    height: SHOT_H,
  },
  {
    file: "viewer",
    alt:
      "A viewer display: large white text on black, a yellow countdown top left and the time of day top right, with one stage direction picked out in yellow and an urgent notice in red.",
    caption: "A viewer display. Big text, clocks, nothing else.",
    width: SHOT_W,
    height: SHOT_H,
  },
  {
    file: "palette",
    alt:
      "The command palette open over the control page, listing scroll commands beside their keyboard shortcuts and, for two of them, the game controller button that fires them.",
    caption: "Ctrl+K reaches every command — keys and pad buttons alike.",
    width: SHOT_W,
    height: SHOT_H,
  },
  {
    file: "themes",
    alt:
      "The theme editor dialog showing a commented CSS stylesheet that documents the markup a viewer layout styles and the custom properties it can set.",
    caption: "Viewer layouts are CSS you can edit live.",
    width: SHOT_W,
    height: SHOT_H,
  },
];

function feature(title: string, body: string): string {
  return `<li class="feature"><h3>${title}</h3><p>${body}</p></li>`;
}

function gallery(): string {
  const figures = SHOTS.map((s) =>
    `<figure>
  <button class="shot" data-shot="/screenshots/${s.file}.webp" aria-label="Enlarge: ${
      esc(s.caption)
    }">
    <img src="/screenshots/${s.file}.webp" alt="${esc(s.alt)}"
         width="${s.width}" height="${s.height}" loading="lazy" decoding="async">
  </button>
  <figcaption>${s.caption}</figcaption>
</figure>`
  ).join("\n");

  return `<section id="screenshots" class="band">
  <div class="wrap">
    <h2>What it looks like</h2>
    <div class="gallery">${figures}</div>
  </div>
</section>`;
}

/**
 * The topology picture, inline so it inherits the page's colours and needs no
 * request. It is the one thing that makes "peer-to-peer" concrete: the server
 * is in the diagram, and the script does not pass through it.
 */
function diagram(): string {
  return `<svg class="topology" viewBox="0 0 640 300" role="img"
     aria-label="The control page connects to a signalling server to find viewers, then sends the script directly to each viewer over peer-to-peer data channels. The script never passes through the server.">
  <defs>
    <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
    </marker>
  </defs>
  <g class="node">
    <rect x="20" y="118" width="150" height="64" rx="10"/>
    <text x="95" y="145">Control</text>
    <text x="95" y="165" class="sub">your laptop</text>
  </g>
  <g class="node server">
    <rect x="245" y="16" width="150" height="60" rx="10"/>
    <text x="320" y="42">Go server</text>
    <text x="320" y="61" class="sub">signalling only</text>
  </g>
  <g class="node">
    <rect x="470" y="40" width="150" height="58" rx="10"/>
    <text x="545" y="65">Viewer</text>
    <text x="545" y="84" class="sub">second monitor</text>
  </g>
  <g class="node">
    <rect x="470" y="128" width="150" height="58" rx="10"/>
    <text x="545" y="153">Viewer</text>
    <text x="545" y="172" class="sub">tablet on the floor</text>
  </g>
  <g class="node">
    <rect x="470" y="216" width="150" height="58" rx="10"/>
    <text x="545" y="241">Viewer</text>
    <text x="545" y="260" class="sub">phone across the room</text>
  </g>
  <g class="edge signal">
    <path d="M120 118 C120 60 190 46 245 46" marker-end="url(#arw)"/>
    <path d="M395 46 C430 46 440 52 470 60" marker-end="url(#arw)"/>
  </g>
  <g class="edge data">
    <path d="M170 145 C300 145 340 74 470 69" marker-end="url(#arw)"/>
    <path d="M170 152 C300 152 340 157 470 157" marker-end="url(#arw)"/>
    <path d="M170 160 C300 160 340 240 470 245" marker-end="url(#arw)"/>
  </g>
  <g class="key">
    <text x="20" y="226"><tspan class="swatch-signal">──</tspan> introductions, once</text>
    <text x="20" y="250"><tspan class="swatch-data">──</tspan> the script, peer to peer</text>
    <text x="20" y="278" class="sub">the script never touches the server</text>
  </g>
</svg>`;
}

function demo(): string {
  // The iframes are not written here. They are injected by site.ts once the
  // section scrolls into view, against a room id minted in the browser — so
  // every visitor drives their own demo instead of everyone sharing one, and
  // a visit that never reaches this section never opens a room at all.
  return `<section id="demo" class="band demo">
  <div class="wrap wide">
    <h2>Try it, right here</h2>
    <p class="lede">
      Below is the real application, not a recording — a control page and a
      viewer, in their own private room, talking to each other peer to peer.
      Type in the script; it appears on the viewer. Press <kbd>Space</kbd> in
      the control pane to roll.
    </p>

    <div class="demo-stage" data-demo data-app-origin="${esc(APP_ORIGIN)}">
      <noscript><p class="notice">The live demo needs JavaScript. <a href="${
    esc(APP_ORIGIN)
  }/control">Open the app directly</a> instead.</p></noscript>
    </div>

    <p class="demo-narrow notice">
      Two full applications side by side need a screen wider than this one.
      <a href="${esc(APP_ORIGIN)}/control">Open the app in its own tab</a> —
      it is built for a phone too.
    </p>

    <div class="demo-meta">
      <p class="demo-room">Room <code data-demo-room>…</code> —
        yours alone, discarded when you leave.</p>
      <button class="btn ghost" data-demo-reset hidden>Start a fresh room</button>
    </div>
  </div>
</section>`;
}

export function homeBody(): string {
  return `<section class="hero">
  <div class="wrap">
    <p class="eyebrow">Open source · MIT · self-hostable</p>
    <h1>The script on your laptop.<br>On every screen in the room.</h1>
    <p class="lede">
      A <strong>control</strong> page holds the script and the controls. One or
      more <strong>viewer</strong> displays show it — a window on a second
      monitor, a tablet on the floor, a phone across the room. Scroll position,
      content, speed, text size, layout, messages and clocks stay in sync,
      peer&#8209;to&#8209;peer. Nothing to install.
    </p>
    <p class="cta">
      <a class="btn primary" href="#demo">Try the live demo ${icons.arrow}</a>
      <a class="btn" href="/docs/getting-started/">Get started</a>
      <a class="btn ghost" href="${esc(REPO)}">${icons.github} Source</a>
    </p>
    <p class="fineprint">
      The Go server only introduces the peers. Your script never passes
      through it.
    </p>
  </div>
</section>

${demo()}

<section class="band">
  <div class="wrap">
    <h2>What you get</h2>
    <ul class="features">
      ${
    feature(
      "Any screen is a display",
      `Open the viewer link on anything with a browser. Each display reports its
       own shape, so a phone in portrait and a monitor in landscape both show
       the right amount of script.`,
    )
  }
      ${
    feature(
      "Read ahead, on purpose",
      `The operator's own pane is deliberately not scroll-synced — you read
       ahead of, or behind, the talent. The <strong>Sync</strong> buttons close
       that gap in either direction when you want it closed.`,
    )
  }
      ${
    feature(
      "Edit without anyone seeing",
      `Hold your edits back while you fix a line mid-service, then push the
       whole thing with <em>Send my script</em>. Or leave live editing on and
       let every keystroke through.`,
    )
  }
      ${
    feature(
      "PDFs, not just prose",
      `Drop a PDF in and prompt straight from it. It travels on its own data
       channel, and each document remembers where you had got to.`,
    )
  }
      ${
    feature(
      "Clocks and cues",
      `A countdown by duration or to a time of day, surviving a reload, plus
       messages you can put on the talent's screen without touching the
       script.`,
    )
  }
      ${
    feature(
      "A game controller works",
      `Triggers for speed, sticks to scroll, D-pad for the viewers' text size.
       Cheap, silent, and it fits in a pocket.`,
    )
  }
      ${
    feature(
      "Layouts are just CSS",
      `Viewer themes are stylesheets, edited live in the app against nine
       documented custom properties. Ship your own look.`,
    )
  }
      ${
    feature(
      "Yours to run",
      `One Go binary with the frontend embedded, one dependency, a Dockerfile,
       and an MIT licence. Run it on a laptop on a LAN or on a box you own.`,
    )
  }
    </ul>
  </div>
</section>

${gallery()}

<section id="how" class="band">
  <div class="wrap narrow">
    <h2>How it works</h2>
    <p>
      The control page and the viewers connect to each other directly, over
      WebRTC data channels. The server's only job is introducing them — after
      that it is not in the path, and it never sees a word of your script.
    </p>
    ${diagram()}
    <p>
      That is also why it stays responsive on bad conference wifi: scroll
      position goes over an unreliable channel where a dropped sample is
      simply the next one arriving, while content and control travel reliably
      on their own.
    </p>
    <p><a class="more" href="/docs/architecture/">Read the architecture ${icons.arrow}</a></p>
  </div>
</section>

<section id="run" class="band">
  <div class="wrap narrow">
    <h2>Run your own</h2>
    <p>
      The frontend is TypeScript bundled by Deno; the Go server embeds it and
      serves it alongside the signalling endpoint. With Docker it is one
      command.
    </p>
    <wa-tab-group>
      <wa-tab slot="nav" panel="docker">Docker</wa-tab>
      <wa-tab slot="nav" panel="source">From source</wa-tab>
      <wa-tab-panel name="docker">
        <pre class="shell"><code>git clone ${esc(REPO)}.git
cd teleprompter
docker compose up --build</code></pre>
        <wa-copy-button value="git clone ${
    esc(REPO)
  }.git &amp;&amp; cd teleprompter &amp;&amp; docker compose up --build"></wa-copy-button>
      </wa-tab-panel>
      <wa-tab-panel name="source">
        <pre class="shell"><code>deno task build
cd src/backend &amp;&amp; go run .</code></pre>
        <wa-copy-button value="deno task build"></wa-copy-button>
      </wa-tab-panel>
    </wa-tab-group>
    <p>
      Then open <code>http://localhost:8080</code>. The control page gives
      itself a room and shows a viewer link — open that on any device on the
      network.
    </p>
    <p><a class="more" href="/docs/deploying/">Self-hosting guide ${icons.arrow}</a></p>
  </div>
</section>

<wa-dialog class="lightbox" data-lightbox label="Screenshot">
  <img alt="" data-lightbox-img>
</wa-dialog>
`;
}
