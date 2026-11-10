# Brand guide — Stark Industries

Working identity for the RVA final requirement. Two themes, one geometry. The
site theme is undecided, so both systems are documented here.

## The idea

The sun is the constant. In **Habing Lahi** it sits inside a woven ring, calm and
open. In **Bantay Lahi** the same sun sits inside a shield, guarded. The group
can switch themes without losing recognition.

Both marks use the same eight-ray sun and the same five-surname tagline. Only
the container, the palette, and the type change.

## Logo files

| File | Use |
|---|---|
| `assets/logos/heritage-final.svg` | Primary Cultural Heritage lockup |
| `assets/logos/heritage-a.svg` | Direction A concept, same lockup with a route label |
| `assets/logos/heritage-b.svg` | Alternate badge, five-petal sampaguita |
| `assets/logos/heritage-icon.svg` | Square icon, favicon, avatar |
| `assets/logos/advocacy-final.svg` | Primary Advocacy lockup |
| `assets/logos/advocacy-a.svg` | Direction A concept, same lockup with a route label |
| `assets/logos/advocacy-b.svg` | Alternate megaphone lockup |
| `assets/logos/advocacy-icon.svg` | Square icon, favicon, avatar |
| `assets/logos/png/` | Raster exports at 2x for slides and the PDF |

All text in the SVGs is outlined. The source fonts are listed below; you do not
need them installed to open or print the logos.

### Clear space

Keep one sun-diameter of empty space around any lockup. In the horizontal
lockups the sun is about 14% of the total width, so at 1200 px wide the clear
space is roughly 168 px on every side.

### Minimum size

- Horizontal lockup: 240 px wide (72 mm in print).
- Square icon: 32 px.
- Badge: 240 px wide.

Below 600 px, the horizontal lockup's tagline becomes hard to read. Use the icon
in the site header and move the full lockup to the footer or the about page.

### Don't

- Don't stretch, rotate, or add shadows, glows, or gradients.
- Don't recolor the sun, the shield, or the tagline.
- Don't place a lockup on a busy photograph. Use a solid field or a scrim.
- Don't remove the tagline from the primary lockup.
- Don't re-typeset the tagline. It is part of the mark.

### Dark surfaces

The supplied lockups are built for light backgrounds. A reversed version is not
yet supplied. On dark surfaces, use the square icon, or commission a reversed
lockup before the site ships.

## Color

### Cultural Heritage — Habing Lahi

| Role | Hex | Use |
|---|---|---|
| Indigo | `#16233F` | Wordmark, body text, dark sections |
| Clay | `#B24A2E` | Accent text, links, small labels |
| Gold | `#D8A13F` | Rules, dividers, decorative marks |
| Cream | `#F4E9D6` | Page field, reversed text |

Clay on cream is about 4.5:1, so it passes for normal text but has little
headroom. Use indigo for long copy. Gold is decorative only; never use it for
body text.

### Advocacy — Bantay Lahi

| Role | Hex | Use |
|---|---|---|
| Ink | `#141414` | Wordmark, body text, dark sections |
| Signal red | `#D7261E` | Primary action, accent bar, links |
| Gold | `#F2B705` | Secondary accent, highlights |
| Cream | `#F2E8D5` | Page field, reversed text |

Red on cream passes for large text and UI labels. For body copy, use ink. Cream
on ink is the strongest pairing in the system.

## Typography

### Cultural Heritage

- **Display:** Cormorant Garamond 600. Headlines, pull quotes, the wordmark.
- **UI and labels:** Jost 500. Navigation, buttons, taglines, captions.
- **Body:** Work Sans 400, or Jost 400 if you want a more geometric page.

### Advocacy

- **Display:** Archivo Black 400. Headlines and the wordmark.
- **UI, body, captions:** Space Grotesk 500 and 400.

### Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Cormorant+Garamond:wght@600&family=Jost:wght@400;500&family=Space+Grotesk:wght@400;500&family=Work+Sans:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

Self-host the fonts before the final submission if the presentation venue has
weak Wi-Fi.

### Scale

| Token | Size | Use |
|---|---|---|
| Display | `clamp(2.5rem, 6vw, 5rem)` | Page title |
| H2 | `clamp(1.8rem, 3.5vw, 2.8rem)` | Section title |
| H3 | `1.25rem` | Card title |
| Body | `1rem` / `1.65` | Long copy |
| Small | `0.875rem` | Captions, metadata |
| Micro | `0.6875rem` | Labels, never below 11 px |

## Tagline

```
ANINGAT · BANTING · DUMALAGAN · LAUSA · MAGALLANES
```

The brief requires the members' names in the tagline. Surnames keep it to one
line on the horizontal lockups. On the badge it breaks into two lines:

```
ANINGAT · BANTING · DUMALAGAN
LAUSA · MAGALLANES
```

If the panel asks for first names, use two lines and keep the same tracking:

```
CHRISTAN · SOPHIA · CHRYZ
JOHNRED · DANCEL · AXEL
```

## Voice

**Heritage:** warm, specific, and grounded in a place or a practice. Name the
festival, the material, the town. Avoid "vibrant tapestry", "rich culture", and
other phrases that could describe any country.

**Advocacy:** direct and evidence-first. Every claim gets a source or a date.
End with an action the reader can take this week, not a slogan.

Both: first person plural ("we", "our community"), short sentences, no
exclamation marks.

## Motion and accessibility

- Respect `prefers-reduced-motion`. No parallax, autoplay, or scroll-jacking.
- Body text at least 16 px. Labels at least 11 px.
- Visible focus ring on every interactive element.
- Alt text on every image. The logo alt text should name the theme and the
  group, not repeat the tagline.
- Don't put essential text inside an image.

## Decision

Use **Habing Lahi** for the Cultural Heritage build. Use **Bantay Lahi** for the
Advocacy build. If the site mixes both, keep Habing Lahi as the master brand and
use Bantay Lahi as the campaign mark inside advocacy sections.

The pair shares the sun and the tagline, so the switch reads as a change of
tone, not a change of identity.
