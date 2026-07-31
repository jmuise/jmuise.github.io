# Personal Homepage (Hugo)

This project is a Hugo-powered personal homepage with automated GitHub Pages deployment via GitHub Actions.

## 1) Configure site settings

Edit `hugo.yaml`:

- `baseURL`: set to `https://<your-username>.github.io/<repo-name>/`
- `title`: your name
- `params.description`: your short tagline

If the repository is named `<your-username>.github.io`, use:

- `baseURL: "https://<your-username>.github.io/"`

## 2) Customize homepage content

Edit:

- `layouts/index.html` for sections and text
- `static/css/site.css` for styles and the Zenburn color palette
- `static/fonts/FiraCode-Variable.woff2` — self-hosted Fira Code variable font
  (weights 400–700 in one file), SIL Open Font License. Sourced from Google
  Fonts; swap it for another `@font-face` in `site.css` if you want a
  different look.
- `data/resume_skills.yaml` — the resume's Skills section, one entry per
  tool/language with an optional link and an optional
  [Nerd Font](https://www.nerdfonts.com/) icon (a PUA codepoint, e.g. `U+E738`
  for Java, entered in the YAML as the literal character). No `url`/`icon`
  fields at all just renders as a plain tag — used
  for practices/concepts that don't have a vendor page or logo (e.g.
  "distributed systems"). An item can also set `tier: "more"` to keep a
  category's default view short — those items render inside a "Show N more"
  `<details>` toggle instead of the always-visible list, so a big skill dump
  doesn't drown out the handful that actually matter. Leave `tier` off for
  anything that should always be visible. To add a skill, add an entry here;
  the `{{< skill-groups >}}` shortcode in `content/resume.md` renders all of
  it (via the `layouts/partials/skill-item.html` partial). Look up new icons
  at [nerdfonts.com/cheat-sheet](https://www.nerdfonts.com/cheat-sheet), and
  regenerate `static/fonts/NerdFontsSymbols-Subset.woff2` (currently ~23KB,
  subset to only the glyphs actually referenced) with `fonttools`'
  `pyftsubset` if you add icons outside the current subset.

## 3) The PDF résumé

The "Résumé" page renders twice from the same `content/resume.md` and
`data/resume_skills.yaml`: once as the styled web page, and once through a
second Hugo [output format](https://gohugo.io/templates/output-formats/)
(`PRINT`, configured in `hugo.yaml`) that produces a plain, black-on-white,
single-column HTML document with no nav/icons/decorative chrome — see
`layouts/_default/single.print.html`. That plain document exists so the PDF
built from it survives ATS résumé parsers: no Nerd Font icon glyphs in the
text layer, no navigation text ahead of your name, contact info as plain
visible text, and the full (untiered) skills list as comma-separated text
rather than badges. CI (`.github/workflows/hugo.yml`) renders that page to
`public/resume.pdf` with headless Chromium
(`scripts/render-resume-pdf.mjs`, via [Puppeteer](https://pptr.dev/)) after
the Hugo build, so it ships as part of the same Pages deploy — no separate
hosting or repo needed.

To customize what's on the PDF:

- `params.fullName` in `hugo.yaml` — the properly capitalized name printed
  at the top (separate from `firstName`/`brand`, which stay lowercase-styled
  for the site itself).
- `params.contact.email` in `hugo.yaml` — shown as a `mailto:` link on the
  PDF only. Leave blank to omit it; it's deliberately not published anywhere
  else on the site (the contact page uses a form instead).
- `params.social.linkedin` / `params.social.github` — already used elsewhere
  on the site; reused here as plain text links.
- The screen/print split for shortcode-driven content (the skills list, and
  the sentence in `content/resume.md` that would otherwise tell the PDF to
  go download itself) is done with paired `.foo-screen` / `.foo-print` CSS
  classes — see `layouts/shortcodes/skill-groups.html` and
  `layouts/shortcodes/resume-pdf-note.html`. `static/css/site.css` hides the
  `-print` classes on the web page; `single.print.html`'s own inline
  stylesheet hides the `-screen` classes. Follow that pattern for any other
  content that should differ between the two.

`params.resumePdfUrl` (already set to `resume.pdf`) is what the web page
links to for the download; it doesn't need to change unless you rename the
output file.

To generate the PDF locally: `hugo` (builds `public/print/resume/index.html`
among the rest), then `npm ci` once, then
`node scripts/render-resume-pdf.mjs public/print/resume/index.html public/resume.pdf`.
Headless Chromium needs a handful of system shared libraries not installed
by default in a minimal container (`libnspr4`, `libnss3`, `libcairo2`,
`libasound2t64`, and similar) — install those via your OS package manager if
`puppeteer.launch()` fails with a "cannot open shared object file" error;
GitHub Actions' `ubuntu-latest` runners already have them.

## 4) Enable the contact form

GitHub Pages serves static files only, so there is no server to send mail from.
The contact page posts to [Formspree](https://formspree.io), which relays each
submission to your inbox.

1. Sign up at [formspree.io](https://formspree.io) and create a new form.
2. Copy the form ID — the part after `/f/` in the endpoint it gives you
   (`https://formspree.io/f/abcdwxyz` → `abcdwxyz`).
3. Put it in `hugo.yaml`:

   ```yaml
   params:
     contact:
       formspreeID: "abcdwxyz"
   ```

4. Confirm the verification email Formspree sends, then submit the live form
   once to check it arrives.

Until `formspreeID` is set, the contact page renders a short "not configured
yet" notice instead of the form. The form ID is not a secret — it is a public
endpoint, safe to commit.

Notes:

- Formspree's free tier allows roughly 50 submissions per month.
- The form works without JavaScript (a plain POST to Formspree's own thank-you
  page). With JavaScript it submits in place and shows an inline status message.
- A hidden `_gotcha` honeypot field is included; Formspree discards anything
  that fills it in.

## 5) Enable visitor analytics (optional)

Two independent, optional trackers, both configured under `params.analytics`
in `hugo.yaml`. Leave either blank to skip it — nothing renders until it's
configured.

**Page-view analytics — [GoatCounter](https://www.goatcounter.com)**

Free, cookieless, no consent banner required.

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and pick a site
   code (yours becomes `https://<code>.goatcounter.com`).
2. Put just the code in `hugo.yaml`:

   ```yaml
   params:
     analytics:
       goatcounterCode: "your-code"
   ```

3. View stats at `https://<code>.goatcounter.com`.

**Visiting-company identification — [Leadfeeder](https://www.leadfeeder.com)**

Flags which organization a visit came from when it's identifiable from a
corporate network (home/mobile/VPN traffic won't be identified — that's a
limit of the underlying IP-to-org data, not a bug). Free "Lite" plan covers
the last 100 identified companies/month with 7-day history — plenty for a
personal site.

1. Sign up for the free plan at [leadfeeder.com](https://www.leadfeeder.com)
   and add your site.
2. In the dashboard: gear icon → **Company** → **Website Tracker** →
   **Tracker Script**, then copy the whole script it gives you (it's
   generated per-account, not a fixed snippet).
3. Paste the entire thing into `hugo.yaml` as a block scalar:

   ```yaml
   params:
     analytics:
       leadfeederScript: |
         <script>...the script Leadfeeder gave you...</script>
   ```

4. Set up email alerts inside Leadfeeder's own dashboard, under notification
   settings — that part isn't controlled from this repo.

A privacy note: GoatCounter needs no disclosure since it doesn't process
personal data. Leadfeeder-style identification does derive information from
visitor IP addresses, so if you're aiming for strict GDPR compliance you may
want a short privacy note on the site; for a low-traffic personal portfolio
the practical risk is minimal, but it's your call to make.

## 6) Publish on GitHub Pages

1. Create a GitHub repo and push this project to the `main` branch.
2. In GitHub repo settings, open Pages.
3. Set Source to GitHub Actions.
4. Push to `main` again (or use Run workflow in Actions).
5. Your site will be deployed automatically.

## 7) Local preview (optional)

For day-to-day content editing, install Hugo and run:

```bash
hugo server -D
```

Open `http://localhost:1313`. This is a live-reloading dev server that
renders everything in memory — it never touches `public/` and never runs the
PDF-render script, so the "download the detailed PDF résumé" link will 404
here. That's expected, not a bug.

To preview the site as it will actually deploy — including a working PDF
link — build it for real and serve the static output instead:

```bash
npm ci    # once
npm run preview
```

This runs `hugo --gc` (with whatever `baseURL` is set in `hugo.yaml` — the
real production one), renders `public/resume.pdf` with Puppeteer, and serves
`public/` at `http://localhost:3000`. Because `baseURL` is the bare
`https://jmuise.github.io/` with no repo-name subpath, the site's internal
links are already root-relative (`/css/site.css`, not `/some-repo/css/...`),
so they resolve the same way locally as they will in production — no
baseURL override needed for local serving.

`npm run build` does the same build + PDF render without serving anything —
useful if you just want the files on disk (it's also what CI runs).

## Project structure

- `.github/workflows/hugo.yml`: build and deploy workflow (Hugo build, PDF
  render, Pages deploy)
- `hugo.yaml`: Hugo site config, nav menu, contact form ID, analytics config,
  the `PRINT` output format used for the PDF résumé
- `layouts/_default/baseof.html`: shared page shell (head, nav)
- `layouts/index.html`: homepage template
- `layouts/_default/single.html`: template for regular content pages
- `layouts/_default/single.print.html`: self-contained, ATS-plain template
  used only to generate the PDF résumé
- `layouts/shortcodes/contact-form.html`: the contact form markup and submit script
- `layouts/shortcodes/skill-groups.html`: renders the Skills section, in
  both its tiered/badged (screen) and flat/plain-text (print) forms
- `layouts/shortcodes/resume-pdf-note.html`: the screen/print variants of
  the sentence pointing at the PDF download
- `scripts/render-resume-pdf.mjs`: headless-Chromium script that renders the
  print output format to `public/resume.pdf`
- `static/css/site.css`: site styling
- `content/_index.md`: homepage content metadata
- `content/contact.md`: contact page copy, embeds the form shortcode
