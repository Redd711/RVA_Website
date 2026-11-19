# DESIGN.md — Habing Lahi

**Stark Industries · BSCS-4B · RVA Digital Interface Design Project**
Theme: **Cultural Heritage Website**
Mark: `assets/logos/heritage-final.svg` (lockup) and `assets/logos/heritage-icon.svg` (icon). The
advocacy marks and `heritage-b` are not part of this system.

> We use technology to keep Filipino traditions alive and to carry them further than one town, one
> elder or one festival day can reach.

---

## 0. How to read this file

This is the single source of truth for the site. It is written for three readers:

1. **Whoever builds a page** — tokens, components, the voxel world, motion values, the page plans.
2. **Whoever writes the PDF** — section 2 maps every grading criterion to a place in the interface,
   and section 14 lists the screenshots to take, with draft captions.
3. **Whoever presents** — section 1 is the story in one minute.

The site lives in `site/` (serve the repo root and open `/site/index.html`). The teaser video lives
in `video/` (a HyperFrames project). If this file and the site disagree, this file wins and the site
gets fixed.

---

## 1. The idea: a loom you can walk into

*Habing lahi* means "the weave of a people". Our logo is a banig mat folded into an eight-ray sun:
red-clay rays for the land, gold rays for the harvest, an indigo ring that holds them together.

The website takes that literally, in two ways.

**The islands are built, not pictured.** The Overview opens on one still frame of a voxel
Philippines at golden hour: the Cordillera in the foreground, Vigan's red roofs by the coast, and in
the open sea beyond, the words *Pearl of the Orient Seas* standing in the water like a physical
object, the last line half submerged. Waves wash a waterline across the letters and light ripples
on the parts below. Above them, in plain type: *Scroll. Explore. Discover.* A voxel is the digital
cousin of a woven square, so the medium itself says *habi*.

**Scrolling is the journey.** Only the camera answers the scroll. As the visitor scrolls, the words
sink, the camera swings round to face south, and then it flies in one straight line down the whole
archipelago, from Vigan to the coast below Lake Sebu, looking ahead like a drone: over Luzon past
Banaue, Lucban and a smoking Mayon, across the Visayas by Kalibo and Cebu, and into Mindanao by Lake
Lanao and Davao. It never turns toward a place or stops for one; the places come to it. Everything
else lives on its own clock: people dance, farmers walk the terraces, a calesa rolls down Calle
Crisologo, smoke rises, vintas sail, birds and an eagle circle. Over every place you can open, a
voxel exclamation mark pops up when the camera comes near it.

**Then the land weaves.** At the end of the journey the camera rises to see the whole archipelago
while the land turns into cloth, one colour per island group, sweeping north to south like a weft.
That cloth is the map, and the exclamation marks are its buttons. Pick an island group and the
others fade to grey; pick a mark and the camera swooshes down to that town, where the cloth turns
back into land so you can see the people who keep the practice.

| Layer | In the logo | On screen |
|---|---|---|
| **Warp** — the vertical threads | The indigo ring | The indigo night sections and the grid that hold everything together |
| **Weft** — the threads that cross | Alternating clay and gold rays | The map's three cloths, the festival year, the story steps |
| **The sun at the centre** | The cream core | One focal object per screen: the island you fly over, the town you land in, the craft being built |
| **The sparkles** | The three four-point stars | The voxel exclamation marks: "there is something here" |

Every page is a part of the same cloth:

- **Overview** — fly over the islands, scroll to weave them into the map, then read the stories.
- **Traditions** — a living festival town: every tradition in its own corner, its name woven on a
  sign, its festival going, and people in each corner's dress walking the roads between them; pick one
  to fly in. Then the weft: the festivals laid out across the calendar year.
- **Arts** — three museums, Textile, Clay and Brass, round a stone ring and a pond, visitors walking
  in and out; then a dark hall where each piece lights up as you reach it; open one to turn it any way
  in voxels beside its photograph and its museum label.
- **Members** — *Kami* standing in the sea, the five of us waving on the shore; pick one of us to meet
  them. Then the five threads that made it.
- **Stories** (inside Traditions and Arts) — long reads that follow one craft through its whole life,
  with a voxel model that builds each stage as you scroll.

The interface narrates **community identity**: no region leads, Luzon, Visayas and Mindanao share
one map and one cloth, and the people who built the site appear as threads in the same weave.

---

## 2. Grading map — where each criterion lives

The rubric weights Design & Creativity, Narrative & Analysis, Photo Documentation and Presentation
equally. This section is the bridge between the interface and the write-up.

### 2.1 Elements of art

| Element | Where it is applied | Why |
|---|---|---|
| **Line** | The waterline the waves draw across the submerged words; gold surf lines that pulse out from every coast; the gold thread under the festival year; the story rail that fills as you read | Lines are threads. They lead the eye the way a weaver's thread leads a pattern. |
| **Colour** | Four brand colours from the icon, softened for screens, plus three cloth colours for the island groups (section 3). Golden-hour light in the hero, night indigo for the map | Clay is earth and people, gold is harvest and festival, indigo is night, sea and memory; the cloths make the three regions readable at a glance. |
| **Texture** | The map's land is drawn as plain-weave cloth: each square a thread passing over or under its neighbour. Voxels everywhere: the islands, the people, the stories' models. Real photographs of abaca, cotton, clay and brass | Texture tells you this is handmade culture, not stock graphics. |
| **Perspective** | A real 3D camera: the low first frame with a horizon and haze, the journey along the islands, the rise to a bird's-eye map, the swoosh down to a town. Words that stand in the sea, part above and part below the surface. Story models turn when dragged | Perspective turns the screen into a place you stand in, not a page you scroll past. |
| **Form / Shape** | Blocks (voxels, the weave's squares, the exclamation marks), circles (the logo ring, monograms), eight-pointed stars (the logo's rays) | Every shape comes from the logo or from weaving. Nothing is borrowed from a UI kit. |
| **Space** | One idea per screen; sections a full screen tall; the map leaves room for its dossier; depth (near islands, far islands in haze) adds a third axis | Space lets each tradition breathe and gives the eye somewhere to rest. |

### 2.2 Principles of design

| Principle | Where it is applied |
|---|---|
| **Balance** | The hero balances a heavy title block on the left against the open sky and sea on the right. The map balances the archipelago on the left against the glass dossier on the right. Story pages: text on the left, the model on the right. |
| **Rhythm** | Clay and gold alternate in the logo's rays, the cloth's threads, the member threads. Sections alternate indigo and cream like a weave going over and under. Dancers move on a beat; surf rings pulse on the coast. |
| **Emphasis** | One focal point per screen: the words in the sea, the exclamation mark that just popped, the region left in colour while the others grey out, the stage being built. Clay is reserved for the one action on each screen. |
| **Harmony** | One palette, two typefaces, one voxel scale, one radius scale, one motion curve. The cloth colours are drawn from the same family as the brand colours. |
| **Proportion** | Type on a 1.25 ratio. Photos in 4:5, 3:2 and 1:1. In the world, mountains are raised about twenty times so the relief reads at this scale, and people and houses are drawn larger than life, like a hand-drawn tourist map. |

### 2.3 Narrative and symbolism (for the write-up)

- **The sun** recalls the sun on the Philippine flag but is made of woven rays: national identity
  made by many hands.
- **"Pearl of the Orient Seas"** is the country's old epithet. We set it as a pearl-white object half
  in the water: the name belongs to the sea that surrounds and joins the islands, and it sinks out of
  sight as you begin to explore what the name only summarises.
- **Exclamation marks** are the way games say "there is something here". Using them says that
  heritage is something to discover by moving through it, not a list to read.
- **Voxels are knots.** A woven mat is a grid of crossings; a voxel world is a grid of blocks. We chose
  the medium because it rhymes with the craft we document.
- **The weave sweeps the islands.** When the land turns to cloth, it weaves from Batanes down to
  Tawi-Tawi in one pass. The archipelago becomes one cloth in three colours: unity without sameness.
- **The cloth turns back into land when you land.** Up close, culture is people in a place, not a
  colour on a map. The map is the overview; the town is the truth.
- **Members as threads** — the brief asks for a tagline made of our names. On the Members page the
  five surnames become five threads that cross into one band.
- **Public narratives** — every pin is a real town and every story names its sources. Heritage is
  shown as something communities do in public: on streets, plazas, at kilns and looms.
- **"Where memory becomes action"** — the printed logo's line is the reason for the site: we do not
  just store information, we make it easy to find, so the practice keeps visitors and learners.

---

## 3. Colour

Every brand colour comes from `heritage-icon.svg`. The originals are strong print colours; on a
backlit screen they glare, so each one is **softened**: the cream is warmer and darker than paper
white, the indigo is lifted off near-black, clay loses saturation, gold is mellowed toward straw.
Large areas never use pure white or pure black.

### 3.1 Brand palette

| Token | Name | Hex | From the logo | Role |
|---|---|---|---|---|
| `--gabi` | Gabi (night) | `#1B2742` | Ring `#16233F`, lifted | Dark sections, the map's sea at night |
| `--gabi-2` | Gabi raised | `#26345A` | — | Panels on dark, story cards |
| `--tinta` | Tinta (ink) | `#22304F` | Wordmark indigo, softened | Body text and headings on cream |
| `--ambon` | Ambon (mist) | `#5A6784` | — | Secondary text on cream |
| `--banig` | Banig | `#F6EEDF` | Core `#F4E9D6`, warmed | Page field |
| `--abaka` | Abaka | `#EDE2CC` | — | Raised surface on cream, chips |
| `--luad` | Luad (clay) | `#A4492F` | Rays `#B24A2E`, softened | The one action per screen, links |
| `--luad-soft` | Luad on dark | `#E08E70` | — | Clay accents on indigo |
| `--palay` | Palay (gold) | `#D9AE5F` | Rays `#D8A13F`, mellowed | Lines, rays, focus ring on dark |
| `--palay-soft` | Palay light | `#EBD3A0` | — | Selected chips, links on dark |
| `--hamog` | Hamog (dew) | `#AEB6CB` | — | Secondary text on indigo |

### 3.2 The three cloths (the map)

Each island group is woven in its own colour, three shades per cloth in a twill so the threads read.

| Region | Token | Shades | Named after |
|---|---|---|---|
| Luzon | `--tela-luzon` | `#B4573B` `#C96C4D` `#DC8F6D` | Clay red, the inabel of the Ilocos |
| Visayas | `--tela-visayas` | `#D09C47` `#DFB35F` `#ECCA88` | Harvest gold, the piña of Aklan |
| Mindanao | `--tela-mindanao` | `#4A9183` `#62A698` `#86BFB1` | Lake teal, the waters of Lake Sebu and Lanao |

A region that is not selected fades to a cool grey (its own luminance times `#9AA3C2`) and sinks half
a block, so the selection stays legible for colour-blind visitors too: it is the only part that is
both coloured and raised.

### 3.3 The world's natural palette

Muted, warm greens so the land sits with the brand colours: sand `#E6D4A6`, rice fields `#A3C06A`
and `#C9C06A`, lowland forest `#6E9A54`, Cordillera pine `#4F7A52`, rock `#8C8478`. The sea runs
from reef shallows `#8CCFC0` to deep water `#30588A`, and turns night indigo `#1C2945` on the map
so the cloths read. The sky is a golden-hour gradient from horizon `#E7C18F` to zenith `#1B2742`
(the brand's indigo), and distant islands fade into a warm haze.

### 3.4 Proportion (60 · 30 · 10)

- **60% Banig/Abaka** — reading surfaces.
- **30% Gabi** — the world section, story stages, the footer band.
- **10% Luad + Palay** — rays, pins, lines, one button per screen.

Gold is light, not text: it never carries body copy on cream (2:1). On indigo it may carry short
labels (7.2:1).

### 3.5 Verified contrast (WCAG 2.2)

| Text | Ground | Ratio | Use |
|---|---|---|---|
| Tinta `#22304F` | Banig `#F6EEDF` | 11.4 : 1 | Body (AAA) |
| Tinta | Abaka `#EDE2CC` | 10.2 : 1 | Card body (AAA) |
| Ambon `#5A6784` | Banig | 4.9 : 1 | Meta text (AA) |
| Luad `#A4492F` | Banig | 5.1 : 1 | Links, buttons (AA) |
| Banig | Luad | 5.1 : 1 | Button label (AA) |
| Banig | Gabi `#1B2742` | 12.3 : 1 | Text on dark (AAA) |
| Hamog `#AEB6CB` | Gabi | 7.3 : 1 | Secondary on dark (AAA) |
| Palay `#D9AE5F` | Gabi | 7.2 : 1 | Labels on dark (AAA) |
| Luad soft `#E08E70` | Gabi | 5.8 : 1 | Accent on dark (AA) |

Text over the 3D scene always sits on a glass panel or on the indigo shade behind the hero title.

### 3.6 Shadows are coloured, not grey

```css
--shadow-1: 0 1px 2px rgb(27 39 66 / .08), 0 2px 6px rgb(27 39 66 / .06);
--shadow-2: 0 6px 16px rgb(27 39 66 / .10), 0 2px 4px rgb(27 39 66 / .06);
--shadow-3: 0 24px 48px -12px rgb(27 39 66 / .28), 0 8px 16px rgb(27 39 66 / .10);
--shadow-dark: 0 30px 60px -20px rgb(8 12 24 / .6), 0 10px 20px rgb(8 12 24 / .25);
```

In 3D, shadows come from one low golden sun in the south-west, so every block casts a long shadow
toward the north-east, and the indigo sky fills the shade.

---

## 4. Typography

Two families, both already in the logo, with clearly different jobs.

| Role | Family | Weights | Why |
|---|---|---|---|
| **Display** | Cormorant Garamond | 500, 600, 600 italic | The wordmark's serif. High contrast, calligraphic — reads as archive, letterpress, memory. |
| **Text and UI** | Jost | 400, 500 | The tagline's geometric sans. Circles and straight lines, like the sun and the weave. |

### 4.1 Scale — major third (1.25), fluid

| Token | Size | Line height | Use |
|---|---|---|---|
| `--t-hero` | `clamp(3.25rem, 9vw, 8.5rem)` | 0.92 | The h1 of each page |
| `--t-1` | `clamp(2.4rem, 5vw, 4.2rem)` | 1.02 | Section headings |
| `--t-2` | `clamp(1.6rem, 2.6vw, 2.2rem)` | 1.12 | Panel, card and step titles |
| `--t-3` | `1.25rem` | 1.5 | Lead paragraphs (Jost 500) |
| `--t-body` | `1.0625rem` (17px); stories `1.125rem` | 1.65; stories 1.75 | Body |
| `--t-small` | `0.9375rem` | 1.5 | Meta, credits |
| `--t-label` | `0.8125rem` | 1.3 | Chips, pin labels (sentence case) |

### 4.2 Rules

- Measure: 60–72 characters for body, never wider than `68ch`. Stories run at 66ch.
- Headings are sentence case. No all-caps eyebrows. The only uppercase is inside the logo and the
  members' woven tagline.
- Each page's h1 is one Filipino word or a short line set huge in Cormorant: *Habing Lahi*,
  *Tradisyon*, *Sining*, *Kami*; story titles are short sentences.
- Filipino terms are set in Cormorant italic with `lang="fil"` the first time they appear.
- Stories open with a drop cap in clay; one pull quote per story, in Cormorant, with a gold rule.
- Meta lines are plain sentences ("Lake Sebu, a 9-minute read"), never dot-joined strings.

---

## 5. Space, grid and shape

- **Grid:** 12 columns, max content width `1240px`, gutter `clamp(16px, 2.4vw, 32px)`, side margin
  `clamp(16px, 5vw, 80px)`. Left and right content edges are always equal.
- **Spacing scale (4px base):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Section rhythm:** heroes are one screen. The world section is 3.3 screens because it holds four
  moments (the first frame, the journey, the weave, the map), and the Arts hall is five screens because
  it walks six pieces (one screen held, four fifths of a screen for each step). Every other inner-page
  section is as tall as what it holds, with generous padding, so no empty screen sits under its cards.
- **Radius:** `--r-s: 6px` chips · `--r-m: 14px` panels, photos, story stages · circles for the sun,
  monograms and pins.
- **Photo ratios:** 4:5, 3:2, 1:1 and 4:3. One ratio per row.

---

## 6. Depth — the spatial system

The site is built in **real 3D** where it matters and in **layered planes** everywhere else.

### 6.1 The voxel world (Overview)

```
 camera ── hero: 7 blocks above the ground, 15 behind the focus, looking ahead
        ── map:  high above, pitched 64° down, fitted to the archipelago
        ── town: 15 blocks away, 8 up, slowly drifting around the plaza

 clouds   y 21–27   drift west to east, fade when the map weaves
 birds    y 6–9     flocks circling the towns
 props    y ground  people, houses, boats, landmarks (0.12 world units per voxel)
 land     y 0–5.5   one column per 0.08° cell, 0.55 units per 255 m of real height
 sea      y 0.16    shader: reef shallows, surf rings, the sun's path on the water
```

- **Scale:** one map cell is 0.08° (about 9 km). Heights are exaggerated about twenty times.
  Props are drawn larger than life on purpose.
- **Light:** a golden directional sun from the south-west with soft shadows that follow the camera;
  an indigo-and-earth hemisphere fill; fog in the horizon colour.
- **Glass UI floats over the world** (Z3 in 6.2): pins, chips, dossier, back button.

### 6.2 Planes for the flat pages

```
 Z4  Sun / focal object    the hero title, the story stage
 Z3  Glass                 nav, map dossier, tag labels, dialogs
 Z2  Cloth                 cards, photo frames, member threads
 Z1  Weave                 section grounds with a 3% banig texture
 Z0  Night                 the world canvas, far photographs
```

Glass: `rgb(38 52 90 / .66)` on dark, `backdrop-filter: blur(18px) saturate(1.2)`, a 1px inner
border at 14% cream. Glass is used only over imagery or the world, never over plain text.

---

## 7. Motion

Motion explains where things come from and where they go. In the world, it is also life: people
dance, boats sail, smoke rises. Everything is driven from one clock, so the same scene can be
rendered to video frame by frame.

### 7.1 Tokens

```css
--ease-out:   cubic-bezier(.22, 1, .36, 1);   /* things arriving */
--ease-inout: cubic-bezier(.65, 0, .35, 1);   /* things moving between places */
--d-fast: 160ms;  --d-base: 320ms;  --d-slow: 720ms;  --d-weave: 1400ms;
```

World timings: the world glides after the scroll, so a notched mouse wheel still moves it smoothly,
and settles about half a second after the scroll stops (a jump of more than 15% at once, like "Skip
to the map", cuts instead); an exclamation mark pops in 0.55 s with a small overshoot; the swoosh is 1.6 s
(region) or 2.0 s (town); the cloth unweaves in about 1.2 s when you land and weaves again when you
leave; the region greying eases over 0.25 s.

Scroll budget of the world section (13 screens tall): 0–3% the first frame, 3–82% the journey,
82–93% the zoom out and the weave, 93–100% the map. "Skip to the map" jumps to 96.5%.

### 7.2 The moments

| Where | Moment | What happens | Triggered by |
|---|---|---|---|
| Overview | **The first frame** | A still camera over the Cordillera at golden hour; *Pearl of the Orient Seas* stands in the sea, the swell washing a foam line across it and caustic light rippling on the submerged half. People, smoke, boats and birds move on their own. | Page load |
| Overview | **The words sink** | As scrolling begins, the words slide under the surface and the clear water closes over them. | Scroll (0–5.5%) |
| Overview | **The journey** | The camera swings round to face south, then flies one straight line from Vigan to the coast below Lake Sebu, behind and above the ground it looks at, never turning. Only the camera answers the scroll. | Scroll (3–82%) |
| Overview | **The marks pop** | When the camera comes within 38 units of a place that is in view, its voxel exclamation mark pops up in the island group's colour, spinning and bobbing, with a glass tag naming the nearest one; it folds away once the camera is 44 units past. Tabon, far west of the line, pops in the zoom out. | Distance from the camera |
| Overview | **The weave** | The camera rises to see the whole archipelago while the land turns into three cloths, north to south; trees sink, clouds clear, any mark not yet found pops. | Scroll (82–93%) |
| Overview | **The swoosh** | Choosing a region or an exclamation mark flies the camera in an arc up and over, with a field-of-view dolly and wind lines at the edges; the other regions grey and sink. | Click, Enter |
| Overview | **Landing** | In a town the cloth turns back into land and every mark folds away, so nothing stands in front of the town. A drag (or the left and right arrow keys) turns the camera around the town on the same radius, always facing it; a flick keeps it turning for a moment; a drag up or down tilts the view between low and high. | Arriving at a mark |
| Story | **The build** | A pool of voxels flies into the shape of each stage: abaca plant, fibres, dye pot, loom, kiln, house. Bottom voxels move first; each arcs up on its way. | Scroll to the next step |
| Story | **The making** | On the key stage the craft grows with the reader's scroll: the t'nalak weaves row by row, the burnay rises on the wheel, kiping climbs the house. | Scroll within a step |
| Traditions | **The town's life** | Each corner keeps its festival going: the Sinulog ring turns round the Santo Niño two steps forward and one back, drums bounce, the carabao and the calesa pace their streets; people in each corner's dress walk the road to visit another corner and go home; birds circle, clouds drift. | Always, while on screen |
| Traditions | **Fly into a corner** | Picking a name in the festival town flies the camera to that corner in an arc (1.8 s); Back or Escape flies it out to the whole town. | Click, Enter |
| Traditions | **Thread the year** | A gold thread draws across the 12-month line; festival knots fill as it passes. | Scroll into view, once |
| Arts | **The visitors** | People walk in from the front, along the stone ring, up the steps and into a museum; others come out and leave; some stop to watch the pond; a family picnics on the lawn. | Always, while on screen |
| Arts | **The museums** | Picking a museum on the plaza walks the page down to its first piece in the hall. | Click, Enter |
| Arts | **The lamps** | The hall slides sideways as you scroll; the lamp over the piece you reach turns on, the one you leave goes dark; the hall's title and museum chips step aside once the walk begins. | Scroll, inside the hall only |
| Arts | **The piece** | Opening a piece shows it alone in voxels beside its label; drag it (or use the arrow keys) to turn it any way, the bottom included, or switch to the photograph. | Click, Enter |
| Members | **The shore's life** | The five of us bob and wave, the two at the ends jumping; *Kami* rocks in the swell; foam washes, vintas sail past, birds circle. | Always, while on screen |
| Members | **Meet one of us** | Picking a person flies the camera to them; they hop to say hello and their summary opens; Back or Escape returns to the shore. | Click, Enter |
| Members | **Weave the names** | Five threads drop into place; a weft carries the five surnames across them. | Scroll into view, once |

### 7.3 Micro-interactions

- Linked card: lifts 2px, photo scales 1.03 inside its frame, 160–500 ms.
- Button: one shade darker on hover, scale .98 on press. Link: clay underline draws from the left.
- Map mark: grows a third on hover or focus and its label slides up. Dossier rows nudge 2px right.
- Story stage: drag to turn the model; the view eases after the pointer, keeps turning for a moment
  after a flick, and otherwise turns slowly on its own.

### 7.4 Never

No scroll-jacking: the page always scrolls at the visitor's speed, the world only listens. The
camera never drifts on its own. No carousel that moves on its own. No fade-in-up on every section.

### 7.5 Reduced motion

Every visitor gets the same motion, whether or not their system asks for reduced motion
(`prefers-reduced-motion: reduce`): the world's life, the scroll glide, the swoosh, the story
stages' voxel flight and loops, the drag and the CSS reveals all play. The group chose this, since
the islands' life is the content and the visitor drives every camera move. No content waits on an
animation, and every step's text is readable without the 3D stage.

### 7.6 Sound

Sound is on by default, at the group's request, but browsers hold audio until the visitor's first
click, tap or key (scrolling does not count), and it starts then. The glass chip at the bottom left of
the world (above the tab bar on phones; beside the back button, over the bottom sheet, on a phone's map)
shows what really plays: *Turn on sound* while the browser holds it or the visitor turned it off, *Turn
off sound* once it plays. The chip fades out, and the header slides up, while the visitor scrolls down; both come back on scrolling
up. Sound fades out when the world leaves the screen or the tab is hidden.

- **The first frame is the water alone:** the sea, the swell lapping the words in the sea and a splash
  now and then. Birds and the places come in as the words sink, when the scroll begins.
- **The ambience follows the camera.** The sea and birds are two beds whose levels follow how much
  land is around what the camera looks at and how high it flies; the swell sinks with the words; on
  the journey a splash sounds along a coast below now and then. The water sits at 0.3 and the birds
  at 0.3 of their first mix, at the group's request.
- **Every place sounds where it stands.** Each source is a three.js `PositionalAudio` at its place
  and the listener rides the camera: full level within a few units, -6 dB per doubling of distance,
  gone before the next town. Sinulog (a Cebu street band), Pahiyas (a fiesta brass band),
  Ati-Atihan and Kadayawan (parade drums), a chant in Banaue, T'boli music at Lake Sebu, kulintang by
  Lake Lanao, the calesa in Vigan, the jeepney and its horn following the jeepney in Manila (heard only
  near Manila, so never in the first frame), and the
  eagle's cry now and then over Apo.
- **Landing on a place** keeps the ambience, a step quieter, and plays that place's sounds at full
  level wherever the camera hovers; every other place goes quiet.
- **The swoosh** gets a soft whoosh whose peak lands on the middle of the flight, under the beds. An
  exclamation mark rings a small bell when the pointer or the keyboard finds it, each mark its own
  note of one scale.
- **Levels,** measured with earshot on renders of the mix: the first frame about -29 LUFS, early in
  the journey about -27 LUFS, a festival you land on about -16 LUFS, the map about -34 LUFS; a soft
  limiter keeps peaks near -1.5 dBFS at the loudest.
- **Sources:** field recordings from Freesound (CC0 and CC BY, most of them made in the
  Philippines), trimmed into seamless loops and levelled, credited on `credits.html`. Where we found
  no openly licensed recording, a near one stands in and the credits say so: a fiesta parade in Baco
  for Pahiyas, parades in Calapan for Ati-Atihan and Kadayawan, a red-tailed hawk for the Philippine
  eagle. The whoosh is a code-made sound from the earshot sound bank (MIT). The kulintang is made in
  code as well, since we found no openly licensed recording: a row of eight bossed gongs in a
  pentatonic-like tuning, a hanging agung, the babendir keeping time and the dbakan, each struck as
  decaying partials and played in a looping rhythmic mode.

---

## 8. Components

### 8.1 Navigation — four items only

Left: the heritage icon on a cream chip plus "Habing Lahi". Right: **Overview, Traditions, Arts,
Members**. No search, no language switch, no account icon. Stories are reached from the pages they
belong to (Traditions, Arts) and from the Overview's stories section, not from a fifth nav item.
Under 768px the four links become a bottom tab bar with line icons.

### 8.2 The world section (Overview)

A sticky full-screen canvas inside a section 13 screens tall.

- **First frame:** the plain line *Scroll. Explore. Discover.* (Jost 500, tracked) sits just above
  the voxel words *Pearl of the Orient Seas.* in the sea; script keeps the line aligned to the words'
  top-left corner at any size. The h1 holds both, the second part visually hidden for screen
  readers. On wide screens the words set in two lines, on tall screens in three. A thin cue says
  "Scroll to explore the islands"; "Skip to the map" sits bottom right.
- **Journey layer:** a glass tag names the nearest popped exclamation mark on screen.
- **Map layer** (from 93% of the section): title and region chips with cloth swatches at the top;
  the voxel exclamation marks are the pins, with a clear button over each for clicks, keyboard focus
  and a hover label; a glass **dossier** on the right (bottom sheet on phones) that shows the
  overview, a region or a town (photo, text, link to the story or page); a back button.
- **Sound chip:** *Turn off sound* / *Turn on sound*, a glass chip at the bottom left through the
  hero, the journey and the map; it fades while scrolling down (7.6).
- **In a town:** a quiet *Drag to turn* line at the bottom (above the back button on phones); the
  canvas shows a grab cursor and turns around the town under a drag.
- **Fallback:** a poster frame rendered from the same world, and the map as a working list.

### 8.3 Story card

Photo 4:3, a plain meta line in gold, a Cormorant title, one sentence. Dark on the Overview, light at
the end of each story.

### 8.4 Story page

Dark header (meta, title, lead, photo) → long read on cream with a drop cap → **lifecycle section**
→ meaning, keepers today, how to visit → sources → more stories.

### 8.5 Lifecycle stage

Steps on the left, each about 70% of a screen; a sticky indigo stage on the right (full-width at
the top on phones) holding the voxel model on a banig mat, a progress rail of thread segments, the
current step's name and "3 of 6", and a "Drag to turn" hint. The current step is full opacity; the
others rest at 38%.

### 8.6 The inner pages: voxel heroes, the hall, the viewer

- **Voxel heroes (Traditions, Arts, Members).** One scene each in the Overview's light, drawn only
  when something changes; the camera moves only when the visitor picks something. The page's plain
  line sits top left on the indigo shade, or on the voxel word's corner as on the Overview; the h1
  carries the page's Filipino word too, visually hidden. Clear buttons, 44px at least, sit over the
  signs and the museums. The engine is `js/hero-stage.js`.
- **Festival town (Traditions).** Six corners, each behind a bamboo gateway whose sign weaves the name
  in cream on dark cloth, bordered in its island group's cloth colour: Pahiyas, Calle Crisologo and
  Banaue (Luzon, clay), Sinulog and Ati-Atihan (Visayas, gold), Kadayawan (Mindanao, teal). Every sign
  has a column of its own, so none hides another at any screen shape; Banaue stands apart on its hill
  at the back left, its sign hung higher. One road runs along the front, a lane each way, with a road
  back to each gate. A solid indigo panel bottom left follows the corner picked: place and month,
  name, one line, a link to its card, *Back to the town*. On a phone the signs become a row of chips.
- **Museum plaza (Arts).** Textile faces the camera; Clay and Brass stand left and right, turned
  toward it. Each name is set in the frieze in the wordmark's indigo, and each front shows its
  collection: t'nalak banners, burnay jars, a hanging agung. A lawn, a stone ring past the three
  steps, a path in from the front, and inside the ring a pond with a stone rim and lily pads; walkers
  keep to the ring and the path, never the water.
- **The hall (Arts).** A dark gallery on a sticky stage, closed at each end by a wall with a brass rail
  and a stone pilaster. In the open: the t'nalak (hung), the inabel (on a rail), the kulintang with
  its agung. On a pedestal: the burnay and the Manunggul jar. Under glass on a pedestal: the piña
  barong. A spot on the ceiling track over each piece; the beam shows faintly while the lamp is on.
  A placard bottom left (count, name, maker) and *Look closer*; the hall's title and the three museums
  as chips top right only at the start of the walk.
- **The viewer (Arts).** The piece alone in voxels, no mat under it, turned any way by drag or the
  arrow keys (the light rides with the camera, so the side you turn toward you is lit); a thumbnail
  that swaps in the real photograph; and a museum label: the museum, the name, the maker, the medium
  in italic, the date, then the curator's note. Only facts we can source: no measurements or
  catalogue numbers.
- **The five of us (Members).** Each figure is its own model (`MEMBERS` in `js/models.js`), a
  placeholder in that member's thread colour until it is rebuilt from the member's reference
  photograph. A clear button over each one; picked, a panel bottom left gives the role, the name and
  their thread, *Meet all five* and *Back to the shore*.
- **Unchanged:** the year line with its knots, and the five vertical threads with the woven surname
  band.

### 8.7 Buttons

| Kind | Look | Use |
|---|---|---|
| Primary | Luad fill (Palay on dark), 48px tall, `--r-s` | The one action per screen |
| Quiet | Clay text with a drawing underline | Secondary links |
| Chip | Abaka or Gabi-2, 44px tall; selected = Palay-soft; region chips carry a cloth swatch | Filters |

---

## 9. Page plans

### 9.1 Overview — `index.html`

```
┌──────────── world (13 screens, sticky canvas) ─────────────┐
│ 0–3%    first frame: Scroll. Explore. Discover. +           │
│         Pearl of the Orient Seas. standing in the sea       │
│ 3–82%   the flight from Vigan to Lake Sebu; marks pop       │
│ 82–93%  camera rises, land weaves into three cloths         │
│ 93–100% the woven map: chips · exclamation marks · dossier  │
└─────────────────────────────────────────────────────────────┘
┌──────────── statement (cream) ─────────────────────────────┐
│ big quote + purpose            │ 7,641 · 9 · 3 facts       │
└─────────────────────────────────────────────────────────────┘
┌──────────── stories (indigo) ───────────────────────────────┐
│ t'nalak card │ burnay card │ Pahiyas card                   │
└─────────────────────────────────────────────────────────────┘
┌──────────── the rest of the cloth (cream) ─────────────────┐
│ Traditions │ Arts │ Members                                 │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Traditions, Arts, Members

```
traditions.html   festival town (1 screen) · the festival year: line + four cards (cream)
                  · places that are the tradition (indigo)
arts.html         museum plaza (1 screen) · the hall (5 screens, dark, sticky stage)
                  · stories from the loom and the kiln (cream) · the viewer (dialog)
members.html      Kami in the sea (1 screen) · the five of us: threads (cream)
                  · why we built Habing Lahi (indigo)
```

Story links: Pahiyas and Calle Crisologo on Traditions link to their stories; the t'nalak and burnay
labels on Arts link to theirs. Links in: `traditions.html#<card>` from the Overview's map;
`arts.html#<piece>` opens the hall at that piece; `?t=<corner>` and `?piece=<id>` open a town corner
or the viewer directly, for screenshots.

### 9.3 Stories

| Page | Title | Lifecycle (stages) | Key "making" stage |
|---|---|---|---|
| `story-tnalak.html` | The cloth that comes in dreams | Abaca plant · stripping · tying the design · dyeing · backstrap loom · cowrie shell · the finished cloth (7) | The cloth weaves row by row |
| `story-burnay.html` | Clay, carabao and fire | Clay and sand · carabao mixing · the kick wheel · drying · the brick kiln · jars in use (6) | The jar rises on the wheel |
| `story-pahiyas.html` | A town dressed in its harvest | Harvest · rice paste · kabal leaves · drying · the house dressed · procession (6) | Kiping climbs the walls |

Each story cites its sources at the end and says where sources disagree.

---

## 10. Imagery and data

- **Real photographs** from Wikimedia Commons (CC BY, CC BY-SA, CC0), found with the taste-skill
  live search (`photos.mjs search`) and checked at full size. Dropped: frames with shop signs and
  booth numbers, crowds where the practice is lost, museum labels. Credits: one footer line and
  `site/credits.html`.
- **No captions under photographs.** The practice's name is the card title.
- **Voxel art is drawn, not traced:** every person, house, boat and animal is built in code from
  coloured blocks (`site/js/models.js`), dressed after the region's real costume colours.
- **Real geography:** coastlines from Natural Earth 1:50m (public domain); heights from Mapzen
  Terrain Tiles on AWS Open Data (SRTM, ETOPO1 and others), baked once into a 35 KB grid
  (`site/js/world-data.js`). Laguna de Bay, Taal and Lake Lanao are marked as lakes.
- Photographs are stand-ins for a class prototype. Replace them with our own or get permission
  before publishing beyond class, and keep the credits.

---

## 11. Voice and copy

- First person plural, short sentences, no exclamation marks.
- Name the town, the material, the month. Filipino first, English beside it.
- Buttons are a verb and an object: *Explore the map*, *Read the stories*, *Read the t'nalak story*.
- Banned: vibrant, rich tapestry, journey, unlock, discover the magic, timeless, hidden gem,
  immerse yourself, seamless. Copy is checked with taste-skill's `copy-lint` (0 FAIL, 0 WARN on all
  pages).

---

## 12. Accessibility

- Body 17px (18px in stories), labels 13px and up, contrast per 3.5.
- The canvas is decorative (`aria-hidden`); everything it shows is also in the DOM: the h1 reads
  "Scroll. Explore. Discover. Pearl of the Orient Seas.", each exclamation mark has a button named
  "Sinulog, Cebu City", the dossier lists every region and place, the story steps are plain text with
  the stage name announced (`aria-live`).
- Keyboard: Tab reaches the chips, the exclamation marks (arrow keys move between them), the
  dossier and the back button; Escape goes back. Choosing a mark moves focus to the back button (the
  mark folds away), and in a town the left and right arrow keys turn the view. Visible focus everywhere.
- The sound chip says what it will do and matches what really plays; nothing the page says depends
  on hearing it.
- Town and plaza: each sign or museum is a button with a name ("Sinulog, Cebu City", "Enter the Textile
  museum"); in a corner, focus moves to *Back to the town*, Escape flies back, and the panel is a live
  region. Hall: each piece is a button, so Tab walks the hall and scrolls to the piece; the placard is
  a live region. The viewer is a modal dialog that hands focus back to the piece that opened it; the
  arrow keys turn the piece. Members: each of us is a button named with name and role; picked, focus
  moves to *Back to the shore* and Escape returns.
- Without WebGL the poster and the list map remain; story pages fall back to text and photos; the
  town panel lists its corners as links, the hall becomes a list of pieces, and the viewer shows the
  photograph in place of the model.
- Reduced motion per 7.5. The page never takes over scrolling.
- Every page works at 375, 768, 1024 and 1440px.

---

## 13. Performance budget

- three.js r186 is vendored in `site/js/vendor/` (about 800 KB unzipped, loaded only on pages with a
  canvas) so the presentation works on weak Wi-Fi.
- The world is about 4,000 land columns and a few thousand props in roughly 60 instanced draw
  calls; story stages are one instanced mesh of up to about 2,000 blocks.
- Canvases render only while on screen and the tab is visible; pixel ratio is capped at 1.75 (1.5 on
  phones) and drops automatically if frames run long.
- The inner heroes draw continuously only while they are on screen and the tab is visible (their people
  move); each person is a moved mesh, never a rebuilt one. The hall draws only while its camera or a
  lamp is still easing. Arts holds three WebGL contexts at most (plaza, hall, viewer).
- Sound loads once the world is up: about 3 MB of MP3 loops and one-shots. Loops far from
  the camera stop, and the audio context sleeps when the world is off screen or the tab is hidden.

---

## 14. Photo documentation plan (for the PDF)

Take each at 1440×900 unless noted. Links with `?p=…&place=…` open a given moment directly.

| # | Screenshot | How to open it | Draft caption |
|---|---|---|---|
| 1 | First frame | `index.html` | *Pearl of the Orient Seas, in the sea.* The country's old name stands in the water, half submerged; waves draw its waterline and light ripples below. |
| 2 | The journey | `index.html?p=0.25` | Only the camera answers the scroll; Lucban's mark pops as the camera nears it, Mayon smokes ahead. Rhythm and emphasis along the way. |
| 2b | The weave | `index.html?p=0.88` | The camera rises and the land turns into cloth from north to south: texture as the page's transition. |
| 3 | The woven map | `index.html?p=0.965` | *Three cloths, one archipelago.* Colour codes the island groups; the dossier balances the map. |
| 4 | Region selected | `index.html?p=0.965&region=3` | Emphasis by contrast: Mindanao stays in colour and raised; the rest greys and sinks. |
| 5 | Landed in a town | `index.html?p=0.965&place=cebu` | The cloth becomes land again: Sinulog dancers around the Santo Niño, a church, the photo in the dossier. |
| 6 | Story lifecycle, weaving | `story-tnalak.html?step=5&f=0.6` | The t'nalak grows with the reader's scroll: line, rhythm and pattern. |
| 7 | Story lifecycle, the kiln | `story-burnay.html?step=5` | Fire and form: the dragon kiln stepping up its slope. |
| 8 | Story lifecycle, the dressed house | `story-pahiyas.html?step=5&f=0.8` | Kiping climbs the house: colour as offering. |
| 9 | Festival town | `traditions.html` | Every tradition in one town, each named on a sign woven in its island group's colour. |
| 9b | A corner of the town | `traditions.html?t=pahiyas` | Fly in: Lucban's street dressed in kiping, the town's line steps back for the corner's name. |
| 9c | Traditions year thread | `traditions.html#year` | The calendar as one thread; festivals are knots. |
| 10 | Members on the shore | `members.html` | *Kami* stands in the sea like the Overview's words; the five of us wave from the shore. |
| 10f | One of us | `members.html?m=dumalagan` | Pick a person: the camera comes to them and their summary opens. |
| 10b | Members threads | `members.html#threads` | Five members, five threads, one band: our tagline made visual. |
| 10c | Museum plaza | `arts.html` | Three museums, one plaza: Textile faces you, Clay and Brass turn toward you. |
| 10d | The hall | `arts.html#manunggul` | Emphasis by light: only the piece in front of you is lit. |
| 10e | The viewer | `arts.html?piece=tnalak` | The piece in voxels, its photograph and a museum label side by side. |
| 11 | Phone, map and story | 390px wide | Bottom tab bar, the map above a bottom sheet, the stage pinned on top. |
| 12 | Design process | side by side | The blog-style mockups (many headers) → four sections, a voxel world and stories. |

---

## 15. Anti-slop checklist

- [ ] Only four nav items. No search, language toggle, account icon, newsletter box.
- [ ] No all-caps eyebrows, no "A · B · C" meta strings, no arrows appended to button text.
- [ ] No single highlighted word in a headline.
- [ ] Numbers only where the content is a real sequence (the year, the story steps).
- [ ] No grey `rgba(0,0,0,.1)` shadows; indigo-tinted only. No decorative gradient washes.
- [ ] Every photograph is real, credited, and shows the practice it names; every fact in a story
      has a source.
- [ ] The world always shows life (people, boats, smoke), never an empty board.
- [ ] The no-WebGL view still shows all content.
- [ ] The logo is never stretched, recoloured, given effects, or placed on a busy photo.

---

## 16. Build notes

| File | What it is |
|---|---|
| `site/js/world.js` | The voxel world: terrain, sea, sky, props, camera rig, scroll and map modes |
| `site/js/models.js` | Every voxel model: people in regional dress, animals, houses, boats, landmarks |
| `site/js/voxel-kit.js` | Voxel grid, seeded random, and a mesher that keeps only visible faces |
| `site/js/world-data.js` | The baked grid (land, island group, lakes, height, sea depth) |
| `site/js/places.js` | The map's places, regions, landmarks, the first frame, the end of the flight and the scroll budget |
| `site/js/overview.js` | Scroll, pins, chips, dossier, the sound chip and fallbacks on the Overview |
| `site/js/sound.js` | The Overview's sound (7.6): beds, positional sources, the whoosh and the bell |
| `site/assets/sound/` | The recordings, cut into seamless loops and one-shots (credits in `credits.html`) |
| `site/js/lifecycle.js`, `stories.js`, `story.js` | The story stage engine, the 19 stages, and the page controller (the Arts viewer reuses the stage) |
| `site/js/hero-stage.js` | The inner pages' voxel hero stage: light, sky, words as voxels, woven signs, the fly-to camera |
| `site/js/traditions.js` | The festival town: its six corners, the signs, the fly-in and the panel |
| `site/js/arts.js` | The museum plaza, the hall with its lamps, and the piece viewer |
| `site/js/members.js` | *Kami* in the sea and the five of us on the shore |
| `video/` | HyperFrames project: a 14 s teaser (first frame → journey → weave → map → logo) rendered from the same world and the same scroll budget; also the source of the hero poster |

The hero poster `site/assets/world/hero-poster.jpg` is a HyperFrames snapshot of the teaser at
0.02 s: the first frame, with the words in the sea and no overlay. After changing the world, copy `site/js/{voxel-kit,models,world,world-data,places}.js` and
`site/js/vendor/` into `video/assets/js/` before rendering again.

---

## 17. Tokens (copy into CSS)

```css
:root {
  /* brand */
  --gabi: #1b2742;   --gabi-2: #26345a;
  --tinta: #22304f;  --ambon: #5a6784;  --hamog: #aeb6cb;
  --banig: #f6eedf;  --abaka: #ede2cc;
  --luad: #a4492f;   --luad-soft: #e08e70;
  --palay: #d9ae5f;  --palay-soft: #ebd3a0;

  /* the three cloths (middle shade; see 3.2 for all three) */
  --tela-luzon: #c4664a;  --tela-visayas: #ddb260;  --tela-mindanao: #5fa596;

  /* type */
  --f-display: "Cormorant Garamond", "Iowan Old Style", Georgia, serif;
  --f-text: "Jost", "Segoe UI", system-ui, sans-serif;

  /* space */
  --wrap: 1240px;
  --edge: clamp(16px, 5vw, 80px);
  --gut: clamp(16px, 2.4vw, 32px);

  /* shape */
  --r-s: 6px; --r-m: 14px;

  /* motion */
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-inout: cubic-bezier(.65, 0, .35, 1);
  --d-fast: 160ms; --d-base: 320ms; --d-slow: 720ms; --d-weave: 1400ms;
}
```

World constants live in `site/js/world.js`: `LH = 0.55` (units per level), `VS = 0.12` (units per
prop voxel), `TVS = 0.2` (units per letter voxel). The scroll budget (`SCROLL`), the first frame (`HERO`)
and the end of the flight (`PAN_END`) live in `site/js/places.js`.
