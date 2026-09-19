# Getting started

Your first show, end to end: from opening a page to words moving on a screen
somebody else is reading from.

This page is written for the site. Everything after it in the sidebar is the
project's own documentation, kept in the repo and mirrored here.

## What you need

A browser, and a second screen of some kind — another monitor, a tablet, a
phone, a laptop belonging to someone else. That is the whole list. There is
nothing to install for the people reading from a display; they open a link.

You do need a server running somewhere both machines can reach. Either use the
hosted one, or [run your own](deploying.md) — it is a single Go binary and a
`docker compose up` away.

## 1. Open the control page

Go to `/control`. It gives itself a **room** the moment it loads, and you will
see the id in the address bar as `?room=` followed by eight characters.

That room is the session. Everything else in this guide hangs off it.

## 2. Put a script in

Type, or paste. Pasting from Google Docs or Word brings a great deal of
invisible formatting with it, so there is a **tidy** broom that strips it back
to something a prompter can render, and a _brighten_ option for text that came
in dark-on-dark.

The editor is a real editor — you can colour lines with `Ctrl+Alt+Y`, `R`, `B`
and `N` to mark cues, warnings, or whoever is speaking.

If your script is a PDF, drop it on the page instead. It prompts straight from
the file.

## 3. Open a display

Two ways, and which you want depends on where the screen is:

- **Screen** opens a viewer window on a monitor attached to this machine. Good
  for the second display on your desk.
- **The viewer link** — shown on the control page, with a copy button and a QR
  code — is what you send to a device that is somewhere else. Open it on the
  tablet, or scan the code with the phone.

Either way, the control page's display counter moves. It reads like
`2 local · 1 remote`, so you always know how many screens are actually attached
rather than how many you think you opened.

## 4. Roll

`Space` starts and stops the scroll. `Ctrl+↓` and `Ctrl+↑` change speed while it
runs.

The thing to understand early is that **your own pane does not follow the
viewers**. That is deliberate. An operator needs to read ahead to see what is
coming, or drop back to check a line, without dragging the talent's screen
around with them. When you do want the two brought together, the **Sync**
buttons do it in either direction:

- _Go to viewers' position_ (`Ctrl+Alt+G`) moves you to where they are.
- _Send my position to viewers_ (`Ctrl+Alt+J`) moves them to where you are.

## 5. The rest, when you need it

Everything is on `Ctrl+K`. The command palette lists every command with its
shortcut, so the way to learn the keys is to keep using the palette until you
stop needing it. `Ctrl+/` shows the bound ones without leaving the page.

Worth knowing about before your first real service:

- **Live editing off.** By default your edits go out as you type. Turn it off
  and you can fix a line mid-service in private, then push the whole thing with
  _Send my script_.
- **A countdown.** By duration, or to a time of day. It survives a reload, which
  matters more than it sounds like it does.
- **Messages.** Put a line on the talent's screen without touching the script.
- **A game controller.** Triggers for speed, sticks to scroll, D-pad for text
  size. Cheap, silent, and far nicer than a keyboard in a dark room.

## Where to go next

- [Operating](operating.md) is the full manual, and the one to read before you
  run something that matters.
- [Keyboard and controller](shortcuts.md) is every command in one table.
- [Themes](themes.md) if you want the viewer to look like yours.
- [Architecture](architecture.md) if you want to know what is actually happening
  on the wire.
