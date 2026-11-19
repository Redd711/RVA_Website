// The recordings in assets/sound, shared by the Overview's sound (js/sound.js) and the walks on the
// Traditions and Arts heroes (js/walk-sound.js).
export const DIR = 'assets/sound/';
export const PAD = 0.1;   // each loop file carries this much of its loop on both sides (decoder offsets land inside it)
export const dB = (d) => 10 ** (d / 20);

// loop lengths (s) of the files in assets/sound, as cut
export const LOOPS = { sea: 24, birds: 24, swell: 16, jeepney: 16.01, sinulog: 24.021, pahiyas: 23.6263, ati: 19.7834,
  kadayawan: 20.1433, banaue: 24.3229, tboli: 24.172, calesa: 9.8801, kulintang: 21.8182 };
