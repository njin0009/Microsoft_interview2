# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An interview portfolio for a Microsoft Solution Engineer interview ("Interview2 portfolio + Azure and Power BI", per README). There is no build system, package manager, linter, or test suite. The whole deliverable is one self-contained static page: `Nora Jin · Solution Engineer.html`.

To preview it, open the file in a browser (e.g. `start "" "Nora Jin · Solution Engineer.html"` from PowerShell). The filename contains spaces and a `·` (U+00B7), so always quote it.

## Structure of the HTML file

- **Exported artifact wrapper.** The file starts with a generated document skeleton (`<!doctype html>…<body>` with a base `<style>` and safe-area padding), and the `<title>`, `claude:viewport-fit-sides` meta and font links come *after* `<body>`. This is how it was exported. Keep the structure as is and don't "fix" it.
- **Styling** is one inline `<style>` block driven by CSS custom properties on `:root`. The layout is modelled on microsoft.com/windows: a white header with the four-square Microsoft logo, a "Microsoft" wordmark, a divider and "Nora Jin"; a centred hero over a dark-blue "screen" with the spinning bloom; alternating white and `--bg-2` grey bands of flat rounded `.tile` cards; a full-bleed dark `.banner` opening the PathwayIQ section; an AWS → Azure comparison grid; an FAQ accordion; a CTA band; and a multi-column link footer. Fonts are Segoe UI Variable / Cascadia Code, with Figtree / IBM Plex Mono fallbacks from Google Fonts. The hero screen and the banner use fixed dark colours on purpose, so they look the same in both themes. The footer says it's a personal portfolio and not an official Microsoft page; keep that line. Theming is defined three times and the three must stay in sync:
  1. light tokens on `:root`
  2. dark tokens under `@media (prefers-color-scheme: dark){:root:not([data-theme="light"])…}`
  3. the same dark tokens again under `:root[data-theme="dark"]`

  If you add or change a color, use a token and update all three blocks.
- **Content sections** (anchored by id): `#top` hero → `#path` (release/career layers) → `#habits` (six habits with proof) → `#story` (PathwayIQ case study) → `#stack` (AWS-built stack mapped to Azure services) → `#roadmap` ("What ships next") → `#questions` (interview brief as a `<details class="faq">` accordion) → `#contact` (CTA band) → footer.
- **JavaScript** is one small inline IIFE at the end of the file. It handles:
  - Cover (`#cover`, before the hero): a pinned intro, a vanilla port of a scroll-scrub video hero.
    - It deliberately does not lock the body or capture wheel/touch events. With `.cover-live`, the section is 240vh taller than the viewport, and `.c-pin` sticks under the nav (`--navh` on `<html>`).
    - Eased scroll progress (`ccur` → `--cp`) drives the bloom's rotation, and `--bs` drives its scale. The title blurs out over 0–14%. The six habits play over 20–86%, about 11% each, and `.c-final` comes in over 87–95%.
    - Each of the six petals is one habit. The `.h-lab` labels sit inside `.bloom-stage` at each petal's centre, set by `--x` / `--y` (cos and sin of 45° + 60°·k) × `--hr`. They counter-rotate (a reverse `spin` on `.h-spin` plus `+50deg × --cp`) and counter-scale (`1 / --bs`) so they stay upright and the same size on screen.
    - The active habit `k` gets `.on` on both its petal and its label, and `.c-bloom.focus` dims the other petals. The matching `.c-hab` shows the role and a one-line proof on the dark background, not over the bloom. `cLayout` adds `.c-side` on landscape screens (wider than 680px and width ≥ 1.15 × height). There the bloom slides right by `cshift` px (`--bxs`, eased in over the habits phase), and the text sits on the left with its max width in `--tw`. Portrait screens keep the bloom high and put the text below it. Petal order, label order and `.c-hab` order must match.
    - Each `.h-lab` is an `<a>` that links to its habit card (`#habit-communication` … `#habit-problem-solving`, the ids on the `.trait` articles). Clicking a petal shape clicks its label. The card flashes through `:target` (`habit-flash`). `scroll-padding-top` uses `--navh`, so the card lands below the sticky nav.
    - Ending, from 88%:
      - The bloom folds away (`--bo`).
      - The four `.c-sq` Microsoft squares spin out (`--s` per square), then `.c-word` slides out from behind them.
      - From 96.8%, the logo flies into the header logo (`cfly`, measured in `cLayout` against `.ms-logo svg`). The header logo plays `ms-arrive` when it lands.
      - Header brand: `[.ms-logo: squares + "Microsoft" + divider] [.ms-flower] Nora Jin`. Until the cover logo lands, the nav has `.pre`, which collapses `.ms-logo` to zero width so the flower sits far left. Landing removes `.pre`, and the expanding `.ms-logo` (a max-width transition) slides the flower right to its spot in front of the name. Scrolling back re-adds `.pre`. Without motion, `.pre` is never added. The flight is measured against `.ms-mark`, not the transformed svg.
      - Each `.c-hab` also has an `a.c-go` petal button linking to its habit card, the second way to jump. All six habits share one grid cell, so `cRender` enables `pointer-events` / `tabIndex` only on the visible one.
      - The flight follows a quadratic Bézier arc (`cArc`) that swings up and right before curving into the header. Its progress `f` uses `easeInOut`.
      - A blue star trail (`.c-trail`, 18 `.c-star`s, built in JS and fixed at z-index 29) places each star at an earlier point `f − (i+1)·0.026` on the arc. Stars shrink, fade toward the tail and jitter sideways, then dissolve on landing. Each star twinkles via CSS `twinkle`.
      - The pin's fade to reveal the hero starts only at `f = 0.6`, so the trail crosses the dark sky.
      - `.c-logo` is moved to `<body>` as a fixed layer at z-index 30, so the sticky nav doesn't cover it.
    - Hand-off: `.cover-live` has a negative bottom margin equal to the pin height, so the hero sits directly under the cover's last screen. `cpin.style.opacity` fades to 0 to reveal it. `.cover-live` has no background and no pointer events (only `.c-pin` has them), so the hero is visible and clickable.
    - If `media/cover.mp4` loads, `.has-video` swaps the bloom for the video, scrubbed via `currentTime` with a seek queue. There is no `media/` folder in the repo yet, so today the bloom fallback is what renders. If the video doesn't load, `onerror` removes the `<video>`.
    - The "Skip intro" button scrolls to `#top`. Without `.cover-live`, the cover is one static screen with the title and the final line.
  - Scroll reveal: when motion is allowed, the script adds `.motion` to `<html>` and `.rv` to blocks (the selector list is in the script). An IntersectionObserver adds `.in`, staggering blocks that enter together through `--d`. The hidden state is scoped under `.motion`, so without JS, or with reduced motion, everything shows. Adding `.in` to `.report` also starts the bar and stacked-bar grow animations.
  - Count-up on the `.big` numbers in the hero, KPIs and discovery stat. It parses prefix, number and suffix, then always restores the original text (with a timeout fallback). Keep those numbers in a `prefix + number + suffix` form.
  - Header: scroll progress through `--p` on `.nav::after`, a `.scrolled` shadow, and the active link set by an IntersectionObserver on the sections the nav links point to. The bloom moves slightly as you scroll, via `--py` and `--ps`.
  - Pointer spotlight on `.tile`: the script sets `--mx` and `--my`, read by `.tile::after`, on hover-capable devices only.
  - Journey (`#path`, `.journey`): a vanilla port of a GSAP ScrollTrigger timeline, with no libraries.
    - `jLayout` sets the section height to the viewport height plus the sideways travel distance (`jdist × 1.15`). `.j-pin` is sticky under the nav (`--navh`).
    - `jScrub` maps scroll progress to `translate3d` on `.j-track`. A front sweeps from 72% to 100% of the viewport width. The axis draws up to it (`--lw`), and each `.j-item` gets `--c` (connector), `--d` (dot) and `--t` / `--t2` (masked text rise) as the front passes. Items alternate `.top` and `.bot` and are positioned by `--i`, `--j0`, `--js` and `--jw`. These are smaller in the ≤680px media query.
    - Pinning only happens with `.j-live`, which is added when motion is allowed. Otherwise the band is a static sideways-scrolling strip. All the CSS variables default to 1, so everything shows.
    - Headless browsers stall `requestAnimationFrame`. To test the scrub there, fire a `resize` event after scrolling.
  - Hero crowd (`#crowd`, between the motto and the toolkit panel): a vanilla canvas port of the Skiper/codepen "crowd" (no GSAP).
    - Busts come from `images/crowd/open-peeps-sheet.png` (Open Peeps, CC0; 15×7 cells of 240×324). Cells 17, 72, 92 and 100 hold a knife and are skipped.
    - Eight `balloon-N.png` people walk a long loop among them. They were cut out of the user's illustration with a scratch script, which isn't in the repo. Each `ASKS[i]` holds the balloon colour, the person's question `q`, who they are (`who`), the project that answers it (`proj`, `how`), an optional `link` (`ext` URL, or `rel` = index of a journey release to open) and the balloon's position inside the sprite (`bx` / `by`).
    - Clicking a balloon person (rectangle hit test; `getImageData` would be blocked on file://) pauses it, jiggles it, bursts confetti and positions `#ask-card` beside the balloon. The card shows only the question.
    - The same click calls `showPersona(i)`. The toolkit panel (`.hero .screen`) switches to `.persona-on`: the kit and stats are hidden, and `#persona` shows the sprite large plus their question, who's asking and how I'd solve it. ‹ › browse the eight, and "Back to my toolkit" restores the panel.
    - The hidden `.ask-list` buttons (shown on focus) give keyboard and screen-reader access.
    - The animation only runs while the stage is on screen. With reduced motion it draws a static frame.
  - Company logos live in `images/logos/` (PNGs trimmed of whitespace, plus `volvo.svg` and `symphony3.svg`). The PNGs were converted white-to-alpha, so there are no tiles. They appear as `.j-logos` under each journey title and `.vp-logos` under each dialog title.
    - On the dark journey band they render as white silhouettes (`filter:brightness(0) invert(1)`). In the light dialog they keep their colours, and turn white again in dark mode.
    - `.lg.tall` gives stacked emblem-over-wordmark marks (Dongfeng, Geely) more height.
  - The journey band is a deep-blue gradient with a large turning `.j-bloom`: CSS spin plus `--jp` from scroll. Its light text tokens are scoped to `.j-pin`, not `.journey`, because the release `<dialog>` also lives in the section and must keep the normal surface tokens. Type is scaled site-wide with `html{font-size:106.25%}`. The mapping is v1 Dongfeng, v2 iSoftStone, v3 Volvo / Polestar / Geely, v4.1 Symphony3. v4 (Monash) and Next have none.
  - Release stories: clicking a `.j-item` (`data-i`) opens `<dialog id="ver-dialog">` on the matching `.ver-panel`. The ‹ › buttons and the arrow keys step through releases; Esc, a backdrop click or `#ver-close` closes it. Panel pictures load from `images/v1.jpg`, `v2`, `v3`, `v4`, `v4-1` and `next.jpg`, and the journey card from `images/journey.jpg`, all relative to the HTML file. If a file is missing, `onerror` removes the `<img>` and the `.vp-ph` blue placeholder shows.
  - FAQ: `#faq-open` and `#faq-close` open or close every `details.faq`. Open and close animate in browsers that support `interpolate-size` and `::details-content`.
  - copy-email button: `#copy-email` writes the address to the clipboard and reports in `#copy-out`. If the clipboard fails, it selects the text in `#email-text` instead. The address is hardcoded in the JS, so if it changes, update both the JS and the visible `#email-text`.

## Constraints

- Keep all markup, CSS and JS in the single HTML file. The only other files are images under `images/` (and the optional `media/cover.mp4`), loaded by relative path. Google Fonts is the only external resource it loads; outbound `<a href>` links to projects, GitHub and LinkedIn are fine.
- The layout must work at phone width with no horizontal scroll.
