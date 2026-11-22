# Stark Industries — RVA Digital Interface Project

Final requirement for **RVA (Digital Interface Design)**. **Habing Lahi** is the
group's Cultural Heritage website, deployed at <https://habing-lahi.vercel.app/>.
The earlier heritage and advocacy identity concepts remain in the repo.

## Status

| Item | State |
|---|---|
| Theme | Cultural Heritage — Habing Lahi |
| Logo | Heritage sun lockup in use; alternate concepts retained |
| Site | Static HTML, CSS and native JavaScript modules with Three.js; deployed on Vercel |
| Presentation | 23 November 2026 |

## What is in here

```
index.html                 Logo review board (open this first)
assets/css/tokens.css      Shared color, type and spacing tokens
assets/css/review.css      Styles for the review board only
assets/logos/              SVG concepts, finals and square icons
assets/logos/png/          Raster exports for slides and the PDF
docs/brand.md              Palette, type, logo usage and rationale
RVA-SUMMATIVE-ASSESSMENT.md  Original brief (do not edit)
```

## View it

No build step, no dependencies. The repo holds two things, so serve the right folder:

```powershell
# The website (this is what Vercel deploys as https://habing-lahi.vercel.app/)
python -m http.server 8123 --directory site
# then open http://127.0.0.1:8123/index.html

# The logo review board
python -m http.server 8124
# then open http://127.0.0.1:8124/index.html
```

Opening the repo-root `index.html` shows the logo board, not the site. `site/` is the
web root.

## The two directions

**Cultural Heritage — Habing Lahi.** A banig weave folded into a sun. Indigo,
clay, gold and cream. Serif wordmark. Reads as craft, memory and community.

**Advocacy — Bantay Lahi.** The same sun-and-weave geometry hardened into a
shield, with a sun in the negative space. Ink, signal red, cream. Heavy
grotesque wordmark. Reads as vigilance and collective action.

The two share one geometry so the group can switch themes without losing
identity. Each has a horizontal lockup and a square icon.

### Tagline

The brief requires the group members' names in the tagline:

```
ANINGAT · BANTING · DUMALAGAN · LAUSA · MAGALLANES
```

## Team

| Member | Role (to assign) |
|---|---|
| Aningat, Christan Ray M. | |
| Banting, Sophia Lorraine G. | |
| Dumalagan, Chryz Johnred C. | |
| Lausa, Dancel D. | |
| Magallanes, Axel C. | |

## Project conventions

- Static HTML, CSS and native JavaScript modules. No framework, no build step,
  and no npm dependency for the site itself.
- All color, type and spacing values live in a `:root` block. Note there are two sets that
  share no names: `site/css/site.css` is what the website uses, and `assets/css/tokens.css`
  belongs to the logo review board. Do not hard-code hex values in page CSS.
- Every page must work at 375, 768, 1024 and 1440 px, with visible keyboard
  focus and `prefers-reduced-motion` respected.
- Use SVG icons, never emoji, for interface icons.
- Keep personal agent configuration out of this repo. Skills and MCP servers are
  installed globally on each member's machine.

## Checks

If Impeccable is installed and available on your `PATH`, run:

```powershell
# Static scan of the whole site (regex-only on .css and .js)
impeccable detect site/

# Rendered scan, which also runs the element rules static analysis skips
impeccable detect --viewport 1440x900 http://127.0.0.1:8123/index.html
impeccable detect --viewport 390x844  http://127.0.0.1:8123/index.html
```

Otherwise, use your local installation's launcher. Machine-specific launcher paths
belong in local configuration, not shared project instructions.

Exit codes: `0` clean, `1` a target could not be scanned, `2` findings.

Open the page and check it by hand at the four widths above. There is no
automated test suite yet.

## Note on the group name

"Stark Industries" is a Marvel reference. It is fine for class, but rename
before publishing the site publicly or using it on a portfolio.
