# Stark Industries — RVA Digital Interface Project

Final requirement for **RVA (Digital Interface Design)**. The site theme is still
undecided between **Cultural Heritage** and **Advocacy**, so this repo currently
holds the shared identity work: two complete logo directions, one per theme.

## Status

| Item | State |
|---|---|
| Theme | Undecided — Cultural Heritage vs. Advocacy |
| Logo | Two directions per theme, final pick pending |
| Site | Static HTML + CSS, not started |
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

No build step, no dependencies. Double-click `index.html`, or serve the folder:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>.

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

- Static HTML + CSS only. No framework, no build step, no npm dependency for the
  site itself.
- All color, type and spacing values live in `assets/css/tokens.css`. Do not
  hard-code hex values in page CSS.
- Every page must work at 375, 768, 1024 and 1440 px, with visible keyboard
  focus and `prefers-reduced-motion` respected.
- Use SVG icons, never emoji, for interface icons.
- Keep personal agent configuration out of this repo. Skills and MCP servers are
  installed globally on each member's machine.

## Checks

```powershell
# Design / accessibility scan (Impeccable, installed globally)
npx impeccable detect index.html

# Optional: scan the rendered page instead of source
npx impeccable detect http://localhost:8000
```

Open the page and check it by hand at the four widths above. There is no
automated test suite yet.

## Note on the group name

"Stark Industries" is a Marvel reference. It is fine for class, but rename
before publishing the site publicly or using it on a portfolio.
