import { esc } from "../shell.ts";
import { APP_ORIGIN } from "../site.ts";

export function notFoundBody(): string {
  return `<div class="prose">
<h1>Not here</h1>
<p class="page-blurb">That page does not exist on this site.</p>

<p>
  If you were after the application itself — the control page, or a viewer link
  someone sent you — it now lives at its own address:
</p>

<p class="cta">
  <a class="btn primary" href="${
    esc(APP_ORIGIN)
  }/control">Open the control page</a>
  <a class="btn" href="/docs/">Read the docs</a>
</p>

<p>
  A viewer link that has stopped working will have the old host in it. The room
  id is the part after <code>?room=</code>; paste it onto the new address as
  <code>${esc(APP_ORIGIN)}/viewer?room=…</code> and it will connect — as long as
  somebody is still holding that room open.
</p>
</div>`;
}
