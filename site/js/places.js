// The places on the map. lon/lat are real; view is the close-up camera after the swoosh
// (yaw in degrees, 0 = looking north from the south; dist and height in world units).
export const REGIONS = {
  1: { id: 'luzon', name: 'Luzon', cloth: '#c4664a', clothName: 'clay red, after the inabel of the Ilocos',
       blurb: 'The northern island group: Luzon, Mindoro, Palawan and the islands between. Rice terraces in the Cordillera, Spanish-era towns in the Ilocos, and harvest feasts in Quezon.' },
  2: { id: 'visayas', name: 'Visayas', cloth: '#ddb260', clothName: 'harvest gold, after the piña of Aklan',
       blurb: 'The central islands: Panay, Negros, Cebu, Bohol, Leyte and Samar. Home of the January festivals for the Santo Niño, and of the finest pineapple-fibre cloth.' },
  3: { id: 'mindanao', name: 'Mindanao', cloth: '#5fa596', clothName: 'lake teal, after the waters of Lake Sebu and Lanao',
       blurb: 'The southern island group: Mindanao, the Sulu archipelago and Basilan. Gong music by Lake Lanao, dream-woven abaca at Lake Sebu, and the harvest thanksgiving of Davao.' },
};

export const PLACES = [
  { id: 'vigan', region: 1, lon: 120.39, lat: 17.57, place: 'Vigan, Ilocos Sur', name: 'Calle Crisologo and the burnay jars',
    text: 'Stone-and-wood houses from the Spanish era line the street. A few blocks away, potters still shape burnay jars from local clay and fire them in a long brick kiln.',
    img: 'assets/img/photo-f8265183-960.webp', alt: 'Two-storey Spanish-era stone house with wooden window shutters on a cobbled street in Vigan',
    link: 'story-burnay.html', linkText: 'Read the burnay story', view: { yaw: 25, dist: 10, height: 6 } },
  { id: 'banaue', region: 1, lon: 121.06, lat: 16.92, place: 'Banaue, Ifugao', name: 'Rice terraces of the Cordillera',
    text: 'Ifugao families built these walls by hand and still farm them, sharing water from the forest above through channels each family helps to keep.',
    img: 'assets/img/photo-f78907051-960.webp', alt: 'Stone-walled rice terraces stepping down a forested mountain in Banaue',
    link: 'traditions.html#terraces', linkText: 'Read about the terraces', view: { yaw: -20, dist: 11, height: 7 } },
  { id: 'lucban', region: 1, lon: 121.55, lat: 14.11, place: 'Lucban, Quezon', name: 'Pahiyas',
    text: 'Every 15 May, houses are dressed in the harvest: rice, fruit and kiping, leaf-shaped rice wafers dyed bright, in thanks to San Isidro Labrador.',
    img: 'assets/img/photo-f150613367-960.webp', alt: 'House façade covered in bright leaf-shaped kiping decorations for Pahiyas in Lucban',
    link: 'story-pahiyas.html', linkText: 'Read the Pahiyas story', view: { yaw: 15, dist: 10, height: 5.5 } },
  { id: 'tabon', region: 1, lon: 117.98, lat: 9.27, place: 'Tabon Caves, Palawan', name: 'Manunggul jar',
    text: 'A burial jar nearly three thousand years old. On its lid two figures row a boat, carrying a soul to the afterlife.',
    img: 'assets/img/photo-f82346812-960.webp', alt: 'The Manunggul burial jar in a museum case, two small figures in a boat on its lid',
    link: 'arts.html#manunggul', linkText: 'See the jar', view: { yaw: 40, dist: 9, height: 5 } },
  { id: 'kalibo', region: 2, lon: 122.37, lat: 11.70, place: 'Kalibo, Aklan', name: 'Ati-Atihan',
    text: 'In January the town dances to drums for the Santo Niño, faces darkened with soot in honour of the Ati, the island’s first people.',
    img: 'assets/img/photo-f87187355-960.webp', alt: 'Ati-Atihan dancers in shell and feather headdresses, faces darkened with soot',
    link: 'traditions.html#ati-atihan', linkText: 'See Ati-Atihan', view: { yaw: -15, dist: 9, height: 5 } },
  { id: 'cebu', region: 2, lon: 123.89, lat: 10.31, place: 'Cebu City', name: 'Sinulog',
    text: 'The dance moves like a current: two steps forward, one back, to the drums, for the Santo Niño on the third Sunday of January.',
    img: 'assets/img/photo-f130057264-960.webp', alt: 'Sinulog dancers in blue and gold costumes raising their arms around a dancer holding a Santo Niño image',
    link: 'traditions.html#sinulog', linkText: 'See Sinulog', view: { yaw: 20, dist: 9, height: 5.5 } },
  { id: 'lanao', region: 3, lon: 124.33, lat: 7.98, place: 'Lake Lanao, Lanao del Sur', name: 'Kulintang and the torogan',
    text: 'A row of tuned brass gongs played with two soft beaters, beside the great house of the Maranao with its carved, upswept beams.',
    img: 'assets/img/photo-f185334698-960.webp', alt: 'A row of five bossed brass kulintang gongs on a painted wooden frame',
    link: 'arts.html#kulintang', linkText: 'Hear about kulintang', view: { yaw: -25, dist: 9, height: 5 } },
  { id: 'davao', region: 3, lon: 125.55, lat: 7.12, place: 'Davao City', name: 'Kadayawan',
    text: 'In August Davao gives thanks for the harvest. The street dances carry the dress and steps of the city’s eleven tribes.',
    img: 'assets/img/photo-f87436043-960.webp', alt: 'Young Kadayawan dancer in a beaded blue costume lifting a carved wooden prop, dancers in red behind him',
    link: 'traditions.html#kadayawan', linkText: 'See Kadayawan', view: { yaw: 30, dist: 10, height: 6 } },
  { id: 'lakesebu', region: 3, lon: 124.68, lat: 6.22, place: 'Lake Sebu, South Cotabato', name: 'T’nalak',
    text: 'T’boli women weave t’nalak from abaca. The patterns are said to come to the weaver in dreams, so no two cloths are alike.',
    img: 'assets/img/photo-f185527484-960.webp', alt: 'T’boli weaver at a backstrap loom, black and red t’nalak cloths hanging behind her',
    link: 'story-tnalak.html', linkText: 'Read the t’nalak story', view: { yaw: 10, dist: 9, height: 5 } },
];

// Landmarks without a pin: they give the flyover something to pass.
export const LANDMARKS = {
  mayon: { lon: 123.685, lat: 13.257 },
  apo: { lon: 125.27, lat: 6.99 },
  bohol: { lon: 124.17, lat: 9.83 },
  manila: { lon: 120.98, lat: 14.6 },
  donsol: { lon: 123.62, lat: 12.86 },
  zamboanga: { lon: 122.02, lat: 6.82 },
};

// How the Overview's scroll is spent (fractions of the world section):
// hero until journeyStart, the flight down the islands until journeyEnd,
// the zoom out to the woven map until mapAt, then the map holds. mapRest is where "Skip to the map" lands.
export const SCROLL = { journeyStart: 0.03, journeyEnd: 0.82, mapAt: 0.93, mapRest: 0.965 };

// The first frame looks past this ground point by Vigan (bearing: compass degrees of the view; y: its height in world units).
export const HERO = { lon: 120.5092, lat: 17.4034, y: 0.934, bearing: 282.96 };
// The journey flies in a straight line from HERO's ground point to here, just off Mindanao's south coast by Lake Sebu.
export const PAN_END = [124.5, 5.9];
