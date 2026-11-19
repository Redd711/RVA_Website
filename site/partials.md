# Shared markup

The pages repeat the same nav and footer by hand (no build step). When you change one, change all
seven: `index.html`, `traditions.html`, `arts.html`, `members.html` and the three `story-*.html`.
Story pages mark their parent in the nav (`story-pahiyas` under Traditions, the other two under
Arts).

The map's places, regions and flyover route live in `js/places.js`. Real coordinates go in as
lon/lat; `world.js` converts them (`x = (lon - 116.8) / 0.08`, `z = (21.2 - lat) / 0.08`).
