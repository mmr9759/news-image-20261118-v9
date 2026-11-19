// news-image-20261118-v9: THE WORLD TODAY, Wednesday 18 November 2026.
// A one-page newspaper front page drawn programmatically with Node (stdlib
// only: hand-rolled PNG encoder + 5x7 bitmap font). No network, no assets,
// deterministic: two runs write byte-identical entry.png (1024x1024).
//
// Layout (v5's clean frame, with v8's clean single-column legend and big
// numbers strip, and the overlap bugs fixed): every headline lives in a
// fixed 2-line slot and every deck starts at a fixed y below it, so text
// can never overprint. 33 stories, all first reported 18 Nov 2026.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;
const BG: [number, number, number] = [246, 241, 227];
const PANEL: [number, number, number] = [253, 251, 243];
const INK: [number, number, number] = [20, 20, 20];
const RED: [number, number, number] = [179, 35, 27];
const GREY: [number, number, number] = [90, 86, 76];
const SEA: [number, number, number] = [207, 224, 232];
const LAND: [number, number, number] = [147, 160, 110];
const TAN: [number, number, number] = [226, 205, 160];
const GOLD: [number, number, number] = [212, 168, 44];
const BLUE: [number, number, number] = [46, 92, 150];

type RGB = [number, number, number];

// 5x7 bitmap font, one row per string, "1" = filled pixel.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
};

class Canvas {
  buf: Buffer;
  constructor() {
    this.buf = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = BG[0];
      this.buf[i * 3 + 1] = BG[1];
      this.buf[i * 3 + 2] = BG[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
    const o = (yi * W + xi) * 3;
    this.buf[o] = c[0];
    this.buf[o + 1] = c[1];
    this.buf[o + 2] = c[2];
  }
  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(W, Math.round(x + w));
    const y1 = Math.min(H, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const o = (yy * W + xx) * 3;
        this.buf[o] = c[0];
        this.buf[o + 1] = c[1];
        this.buf[o + 2] = c[2];
      }
    }
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, t = 2): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y, t, h, c);
    this.fillRect(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + (dx * i) / n;
      const y = y0 + (dy * i) / n;
      if (t <= 1) this.px(x, y, c);
      else this.fillRect(x - t / 2, y - t / 2, t, t, c);
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    const r0 = Math.ceil(r);
    for (let dy = -r0; dy <= r0; dy++) {
      for (let dx = -r0; dx <= r0; dx++) {
        if (dx * dx + dy * dy <= r * r) this.px(cx + dx, cy + dy, c);
      }
    }
  }
  ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    const r0 = Math.ceil(r);
    for (let dy = -r0; dy <= r0; dy++) {
      for (let dx = -r0; dx <= r0; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(d - r) <= t / 2) this.px(cx + dx, cy + dy, c);
      }
    }
  }
  poly(points: [number, number][], c: RGB): void {
    let minY = H;
    let maxY = 0;
    for (const [, y] of points) {
      minY = Math.min(minY, Math.floor(y));
      maxY = Math.max(maxY, Math.ceil(y));
    }
    for (let y = Math.max(0, minY); y <= Math.min(H - 1, maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        this.fillRect(xs[k], y, xs[k + 1] - xs[k], 1, c);
      }
    }
  }
}

// ---- text: scale may be fractional; glyph pixels land on whole pixels ----
function charW(scale: number): number {
  return 6 * scale;
}
function textW(s: string, scale: number): number {
  return s.length * charW(scale) - scale;
}
function drawChar(cv: Canvas, x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = FONT[ch] || FONT["?"];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "1") {
        const px0 = Math.round(x + col * scale);
        const px1 = Math.round(x + (col + 1) * scale);
        const py0 = Math.round(y + r * scale);
        const py1 = Math.round(y + (r + 1) * scale);
        cv.fillRect(px0, py0, Math.max(1, px1 - px0), Math.max(1, py1 - py0), c);
      }
    }
  }
}
function drawText(cv: Canvas, x: number, y: number, s: string, scale: number, c: RGB): void {
  for (let i = 0; i < s.length; i++) {
    drawChar(cv, x + i * charW(scale), y, s[i], scale, c);
  }
}
function drawTextC(cv: Canvas, cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cv, cx - textW(s, scale) / 2, y, s, scale, c);
}
function wrap(s: string, maxW: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textW(t, scale) <= maxW || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- PNG encoder (filter 0 rows, zlib level 9, deterministic) ----
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(cv: Canvas): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    cv.buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- content: 33 stories, all first reported Wednesday 18 November 2026 ----
// Lead + Ukraine + Diplomacy (3) + map legend (8) + grid (12) + In Brief (10).
const LEGEND: [string, string][] = [
  ["1", "GULF - US STRIKES QESHM"],
  ["2", "KERCH - BRIDGE HIT AGAIN"],
  ["3", "SHENZHEN - XI, PUTIN, TRUMP"],
  ["4", "ALASKA - PELTOLA WINS SENATE"],
  ["5", "INDIA - CYCLONE AKVAN"],
  ["6", "CONGO - EBOLA 11,000+"],
  ["7", "USA - MEASLES STATUS LOST"],
  ["8", "GAZA - CEASEFIRE STRAINED"],
];
const NUMBERS: [string, string][] = [
  ["11,000+", "EBOLA CASES IN CONGO"],
  ["56-44", "SENATE: DEMOCRATS WIN"],
  ["1 LIGHT-DAY", "VOYAGER 1 FROM EARTH"],
  ["18 PAGES", "COP31 DRAFT DEAL"],
];
type Tile = { icon: string; head: string; deck: string };
const TILES: Tile[] = [
  { icon: "ballot", head: "PELTOLA WINS ALASKA", deck: "FLIPS THE SEAT. DEMOCRATS WIN." },
  { icon: "coins", head: "EU PROPOSES EUR45BN LOAN", deck: "FOR UKRAINE. REPAID ONLY IF RUSSIA PAYS." },
  { icon: "cyclone", head: "CYCLONE AKVAN NEARS", deck: "NEARS ANDHRA-ODISHA COAST. LANDFALL DUE 20 NOV." },
  { icon: "chip", head: "NVIDIA REJECTS HUANG", deck: "BOARD SAYS NO COMEBACK. RECORD $115.8BN QUARTER." },
  { icon: "parliament", head: "KAHANA ELECTED SPEAKER", deck: "WINS 66-52. RIVALS TAKE THE CHAIR." },
  { icon: "cross", head: "US LOSES MEASLES-FREE STATUS", deck: "STATUS ENDS AFTER 26 YEARS." },
  { icon: "globe", head: "COP31 DRAFT SPLITS TALKS", deck: "MINISTERS TAKE OVER AS DRAFT DIVIDES." },
  { icon: "talks", head: "BERLIN TALKS SET FOR THURSDAY", deck: "KUSHNER, WITKOFF TO MEET ZELENSKYY." },
  { icon: "robot", head: "OPENAI LAUNCHES GPT-6.2", deck: "ASTRA AND SOL ARRIVE. PRICES FALL." },
  { icon: "satellite", head: "VOYAGER 1 ONE LIGHT-DAY OUT", deck: "16 BILLION MILES OUT. SIGNALS TAKE A DAY." },
  { icon: "virus", head: "EBOLA PASSES 11,000 IN CONGO", deck: "OUTBREAK SPREADS IN DR CONGO." },
  { icon: "scales", head: "BOARD OF PEACE FAULTS BOTH SIDES", deck: "GAZA TRUCE STRAINS." },
];
const BRIEF_A = [
  "UK INFLATION 3.6%",
  "TRUMP MEETS MARCOS IN MANILA",
  "INDIA DRAWS RECORD $10BN INFLOWS",
  "GOLD DIPS BELOW $3,800",
  "AFGHAN QUAKE: 600+ DEAD",
];
const BRIEF_B = [
  "DHONI RETIRES FROM IPL",
  "MEXICO CARTEL VIOLENCE",
  "NATO UNVEILS COMMS STRATEGY",
  "WEST BANK SANCTIONS",
  "US TECH OUTAGES SPREAD",
];

// ---- world map: coarse equirectangular continent polygons (lon, lat) ----
const CONTINENTS: [number, number][][] = [
  [[-168, 66], [-140, 70], [-125, 72], [-110, 73], [-95, 80], [-85, 70], [-75, 62], [-60, 55], [-55, 47], [-65, 44], [-75, 35], [-80, 26], [-90, 21], [-97, 16], [-105, 20], [-115, 28], [-125, 40], [-125, 49], [-140, 60], [-155, 58]],
  [[-55, 60], [-45, 60], [-40, 65], [-30, 68], [-20, 70], [-30, 76], [-55, 76], [-60, 70]],
  [[-80, 10], [-75, 5], [-60, 0], [-50, -5], [-35, -8], [-40, -20], [-50, -30], [-60, -38], [-70, -52], [-73, -40], [-80, -20], [-80, -5]],
  [[-17, 15], [-10, 30], [0, 35], [10, 37], [20, 32], [30, 31], [35, 28], [43, 12], [48, 10], [40, -5], [35, -20], [30, -30], [20, -35], [15, -27], [12, -18], [8, -2], [9, 4], [-8, 5]],
  [[-10, 36], [0, 44], [-5, 48], [5, 53], [10, 57], [18, 56], [21, 55], [28, 60], [30, 70], [40, 68], [55, 69], [70, 72], [90, 75], [110, 76], [130, 72], [150, 70], [170, 66], [178, 65], [162, 60], [158, 52], [142, 50], [140, 40], [130, 33], [122, 30], [115, 22], [108, 12], [105, 5], [100, 8], [95, 16], [90, 22], [85, 20], [80, 13], [75, 8], [72, 20], [66, 25], [60, 25], [57, 27], [52, 28], [48, 30], [44, 29], [40, 36], [36, 36], [30, 36], [26, 38], [22, 37], [18, 40], [12, 44], [8, 44], [3, 43], [-2, 37], [-9, 37]],
  [[113, -22], [114, -30], [115, -35], [125, -32], [132, -32], [137, -35], [142, -38], [147, -39], [150, -37], [153, -27], [150, -22], [146, -19], [142, -11], [136, -12], [132, -11], [126, -14], [122, -17], [118, -20]],
  [[-5, 50], [-3, 53], [-5, 56], [-2, 58], [0, 53], [1, 51]],
  [[130, 31], [132, 33], [135, 34], [138, 35], [140, 38], [141, 41], [143, 44], [141, 45], [139, 40], [137, 37], [133, 35]],
  [[95, 5], [98, 3], [100, 0], [103, -3], [106, -6], [110, -7], [114, -8], [118, -9], [122, -10], [120, -6], [112, -6], [104, -2], [98, 4]],
  [[131, -1], [136, -2], [141, -3], [146, -6], [150, -9], [147, -9], [142, -8], [138, -7], [134, -4]],
  [[44, -16], [47, -15], [50, -16], [49, -20], [47, -25], [44, -25], [43, -20]],
];
// [pin number, lon, lat] matching the legend order.
const PINS: [string, number, number][] = [
  ["1", 56, 27],
  ["2", 36.5, 45.3],
  ["3", 114, 22.5],
  ["4", -152, 64],
  ["5", 85.5, 19],
  ["6", 23, -1],
  ["7", -99, 39],
  ["8", 34.5, 31.5],
];

function star(cv: Canvas, cx: number, cy: number, r: number, c: RGB): void {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cv.line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, c, 2);
  }
  cv.disc(cx, cy, Math.max(2, r / 3), c);
}

// ---- small 26x26 pictogram icons, drawn with rects and lines ----
function drawIcon(cv: Canvas, kind: string, x: number, y: number): void {
  const s = 26;
  if (kind === "ballot") {
    cv.rect(x + 3, y + 8, 20, 14, INK, 2);
    cv.line(x + 7, y + 15, x + 11, y + 19, RED, 2);
    cv.line(x + 11, y + 19, x + 19, y + 9, RED, 2);
  } else if (kind === "coins") {
    cv.disc(x + 10, y + 13, 8, GOLD);
    cv.ring(x + 10, y + 13, 8, INK, 1);
    cv.fillRect(x + 5, y + 11, 10, 2, INK);
    cv.fillRect(x + 5, y + 15, 10, 2, INK);
    cv.disc(x + 19, y + 18, 6, GOLD);
    cv.ring(x + 19, y + 18, 6, INK, 1);
  } else if (kind === "cyclone") {
    cv.ring(x + 13, y + 13, 9, BLUE, 2);
    cv.line(x + 13, y + 13, x + 20, y + 7, BLUE, 2);
    cv.line(x + 13, y + 13, x + 6, y + 19, BLUE, 2);
    cv.line(x + 13, y + 13, x + 19, y + 19, BLUE, 2);
    cv.disc(x + 13, y + 13, 3, RED);
  } else if (kind === "chip") {
    cv.rect(x + 6, y + 6, 14, 14, INK, 2);
    cv.rect(x + 10, y + 10, 6, 6, RED, 2);
    for (let i = 0; i < 3; i++) {
      cv.fillRect(x + 8 + i * 5, y + 2, 2, 4, INK);
      cv.fillRect(x + 8 + i * 5, y + 20, 2, 4, INK);
      cv.fillRect(x + 2, y + 8 + i * 5, 4, 2, INK);
      cv.fillRect(x + 20, y + 8 + i * 5, 4, 2, INK);
    }
  } else if (kind === "parliament") {
    cv.poly([[x + 3, y + 10], [x + 13, y + 3], [x + 23, y + 10]], INK);
    for (let i = 0; i < 3; i++) cv.fillRect(x + 5 + i * 7, y + 12, 3, 9, INK);
    cv.fillRect(x + 3, y + 21, 20, 2, INK);
  } else if (kind === "cross") {
    cv.fillRect(x + 10, y + 4, 6, 18, RED);
    cv.fillRect(x + 4, y + 10, 18, 6, RED);
  } else if (kind === "globe") {
    cv.ring(x + 13, y + 13, 10, BLUE, 2);
    cv.line(x + 3, y + 13, x + 23, y + 13, BLUE, 1);
    cv.line(x + 13, y + 3, x + 13, y + 23, BLUE, 1);
    cv.line(x + 5, y + 8, x + 21, y + 8, BLUE, 1);
    cv.line(x + 5, y + 18, x + 21, y + 18, BLUE, 1);
  } else if (kind === "talks") {
    cv.rect(x + 2, y + 4, 13, 9, INK, 2);
    cv.poly([[x + 5, y + 13], [x + 9, y + 13], [x + 5, y + 17]], INK);
    cv.rect(x + 11, y + 10, 13, 9, RED, 2);
    cv.poly([[x + 17, y + 19], [x + 21, y + 19], [x + 21, y + 23]], RED);
  } else if (kind === "robot") {
    cv.rect(x + 6, y + 7, 14, 13, INK, 2);
    cv.line(x + 13, y + 7, x + 13, y + 3, INK, 2);
    cv.disc(x + 13, y + 2, 2, RED);
    cv.fillRect(x + 9, y + 11, 3, 3, RED);
    cv.fillRect(x + 14, y + 11, 3, 3, RED);
    cv.fillRect(x + 9, y + 16, 8, 2, INK);
  } else if (kind === "satellite") {
    cv.poly([[x + 4, y + 6], [x + 16, y + 6], [x + 10, y + 16]], BLUE);
    cv.line(x + 10, y + 16, x + 18, y + 22, INK, 2);
    cv.disc(x + 20, y + 5, 2, RED);
    cv.disc(x + 23, y + 8, 2, RED);
  } else if (kind === "virus") {
    cv.disc(x + 13, y + 13, 7, RED);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      cv.line(
        x + 13 + Math.cos(a) * 7, y + 13 + Math.sin(a) * 7,
        x + 13 + Math.cos(a) * 11, y + 13 + Math.sin(a) * 11, INK, 2,
      );
    }
  } else if (kind === "scales") {
    cv.fillRect(x + 12, y + 3, 2, 18, INK);
    cv.fillRect(x + 4, y + 6, 18, 2, INK);
    cv.poly([[x + 2, y + 8], [x + 8, y + 8], [x + 5, y + 15]], INK);
    cv.poly([[x + 18, y + 8], [x + 24, y + 8], [x + 21, y + 15]], INK);
    cv.fillRect(x + 5, y + 21, 16, 2, INK);
  }
  void s;
}

// ---- layout: fixed slots, so a headline can never overprint its deck ----
function panel(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.fillRect(x, y, w, h, PANEL);
  cv.rect(x, y, w, h, INK, 2);
}
function kicker(cv: Canvas, x: number, y: number, s: string): void {
  drawText(cv, x, y, s, 2, RED);
}
function drawHormuz(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.fillRect(x, y, w, h, SEA);
  cv.fillRect(x, y, w, 14, TAN); // Iran
  cv.fillRect(x, y + h - 12, w, 12, TAN); // Arabian peninsula
  cv.fillRect(x + Math.round(w * 0.42), y + Math.round(h * 0.42), 52, 9, LAND); // Qeshm
  drawText(cv, x + 4, y + 2, "IRAN", 1, INK);
  drawText(cv, x + 4, y + h - 10, "STRAIT OF HORMUZ", 1, INK);
  drawTextC(cv, x + w / 2, y + Math.round(h * 0.42) - 11, "QESHM ISLAND", 1, INK);
  drawText(cv, x + w - 118, y + h - 10, "ARABIAN PENINSULA", 1, INK);
  star(cv, x + Math.round(w * 0.22), y + 24, 7, RED);
  star(cv, x + Math.round(w * 0.82), y + Math.round(h * 0.55), 7, RED);
  cv.line(x + Math.round(w * 0.22), y + 24, x + Math.round(w * 0.42), y + Math.round(h * 0.42) + 4, RED, 1);
  cv.line(x + Math.round(w * 0.82), y + Math.round(h * 0.55), x + Math.round(w * 0.6), y + h - 12, RED, 1);
}
function drawKerch(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.fillRect(x, y, w, h, SEA);
  drawText(cv, x + 4, y + 3, "CRIMEA", 1, INK);
  drawTextC(cv, x + w / 2, y + h - 11, "KERCH STRAIT", 1, INK);
  const mid = y + Math.round(h * 0.45);
  cv.fillRect(x + 6, mid - 3, Math.round(w * 0.38), 6, INK); // standing deck
  cv.fillRect(x + Math.round(w * 0.62), mid - 3, w - Math.round(w * 0.62) - 6, 6, INK);
  cv.line(x + Math.round(w * 0.42), mid - 2, x + Math.round(w * 0.55), mid + 16, INK, 3); // fallen span
  star(cv, x + Math.round(w * 0.5), mid - 8, 6, RED);
}
function drawFlags(cv: Canvas, x: number, y: number): void {
  // China
  cv.fillRect(x, y, 34, 22, RED);
  cv.disc(x + 8, y + 6, 2, GOLD);
  cv.disc(x + 14, y + 4, 1, GOLD);
  cv.disc(x + 16, y + 8, 1, GOLD);
  drawTextC(cv, x + 17, y + 25, "XI", 1, INK);
  // Russia
  cv.fillRect(x + 52, y, 34, 22, PANEL);
  cv.rect(x + 52, y, 34, 22, INK, 1);
  cv.fillRect(x + 52, y + 7, 34, 8, BLUE);
  cv.fillRect(x + 52, y + 15, 34, 7, RED);
  drawTextC(cv, x + 69, y + 25, "PUTIN", 1, INK);
  // USA
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) cv.fillRect(x + 104, y + i * 3, 34, 3, RED);
  }
  cv.fillRect(x + 104, y, 15, 12, BLUE);
  cv.disc(x + 108, y + 4, 1, PANEL);
  cv.disc(x + 114, y + 8, 1, PANEL);
  drawTextC(cv, x + 121, y + 25, "TRUMP", 1, INK);
}

function build(): Canvas {
  const cv = new Canvas();
  cv.rect(4, 4, W - 8, H - 8, INK, 2);

  // Masthead
  drawTextC(cv, W / 2, 12, "THE WORLD TODAY", 6, INK);
  cv.fillRect(10, 60, W - 20, 2, RED);
  drawTextC(cv, W / 2, 66, "WEDNESDAY 18 NOVEMBER 2026", 2, RED);
  drawTextC(cv, W / 2, 86, "33 STORIES - 7 REGIONS - DATE-CHECKED - ONE FRONT PAGE", 1.5, INK);
  cv.fillRect(10, 102, W - 20, 2, INK);

  // Row 1: lead + Ukraine + diplomacy
  panel(cv, 10, 106, 496, 186);
  panel(cv, 514, 106, 242, 186);
  panel(cv, 764, 106, 250, 186);
  // Lead
  kicker(cv, 20, 112, "LEAD STORY");
  const leadHead = wrap("US STRIKES QESHM, IRAN HITS GULF BASES", 476, 3);
  if (leadHead.length > 2) throw new Error("lead headline too long");
  leadHead.forEach((ln, i) => drawText(cv, 20, 130 + i * 26, ln, 3, INK));
  const leadDeck = wrap("US JETS HIT A GUARD MISSILE SITE. IRAN ANSWERS WITH DRONES ON GULF BASES.", 476, 2);
  if (leadDeck.length > 2) throw new Error("lead deck too long");
  leadDeck.forEach((ln, i) => drawText(cv, 20, 186 + i * 19, ln, 2, INK));
  drawHormuz(cv, 20, 228, 476, 56);
  // Ukraine
  kicker(cv, 524, 112, "UKRAINE");
  const ukHead = wrap("KERCH BRIDGE HIT AGAIN", 222, 2);
  if (ukHead.length > 2) throw new Error("ukraine headline too long");
  ukHead.forEach((ln, i) => drawText(cv, 524, 130 + i * 19, ln, 2, INK));
  drawKerch(cv, 524, 174, 222, 58);
  const ukDeck = wrap("THIRD STRIKE IN A WEEK. RAIL HALTS.", 222, 1.5);
  if (ukDeck.length > 2) throw new Error("ukraine deck too long");
  ukDeck.forEach((ln, i) => drawText(cv, 524, 238 + i * 13, ln, 1.5, INK));
  // Diplomacy
  kicker(cv, 774, 112, "DIPLOMACY");
  const diHead = wrap("APEC OPENS IN SHENZHEN", 230, 2);
  if (diHead.length > 2) throw new Error("diplomacy headline too long");
  diHead.forEach((ln, i) => drawText(cv, 774, 130 + i * 19, ln, 2, INK));
  drawFlags(cv, 786, 176);
  const diDeck = wrap("XI KEYNOTES AS TRUMP, PUTIN ARRIVE.", 230, 1.5);
  if (diDeck.length > 2) throw new Error("diplomacy deck too long");
  diDeck.forEach((ln, i) => drawText(cv, 774, 240 + i * 13, ln, 1.5, INK));

  // Row 2: map + legend
  panel(cv, 10, 298, 496, 190);
  panel(cv, 514, 298, 500, 190);
  drawText(cv, 20, 304, "THE WORLD AT A GLANCE", 1.5, RED);
  const mx0 = 16;
  const my0 = 324;
  const mw = 484;
  const mh = 158;
  cv.fillRect(mx0, my0, mw, mh, SEA);
  const px = (lon: number): number => mx0 + ((lon + 180) / 360) * mw;
  const py = (lat: number): number => my0 + ((75 - lat) / 135) * mh;
  for (const cont of CONTINENTS) {
    cv.poly(cont.map(([lo, la]) => [px(lo), py(la)] as [number, number]), LAND);
  }
  drawText(cv, mx0 + 8, my0 + mh - 12, "PACIFIC", 1, BLUE);
  drawText(cv, mx0 + 190, my0 + 78, "ATLANTIC", 1, BLUE);
  drawText(cv, mx0 + 330, my0 + mh - 12, "INDIAN", 1, BLUE);
  drawTextC(cv, mx0 + mw / 2, my0 + 4, "ARCTIC OCEAN", 1, BLUE);
  for (const [n, lo, la] of PINS) {
    const cx = px(lo);
    const cy = py(la);
    cv.disc(cx, cy, 8, RED);
    cv.ring(cx, cy, 8, PANEL, 1);
    drawTextC(cv, cx, cy - 4, n, 1, PANEL);
  }
  // Legend: single column, one fixed 18px row per item, no collisions.
  drawText(cv, 524, 304, "WHERE IT HAPPENED", 1.5, RED);
  LEGEND.forEach(([n, s], i) => {
    drawText(cv, 524, 326 + i * 18, n + " " + s, 1.5, INK);
  });

  // Numbers strip (full width)
  panel(cv, 10, 494, 1004, 46);
  const colW = 1004 / 4;
  NUMBERS.forEach(([num, lab], i) => {
    const cx = 10 + colW * i + colW / 2;
    if (i > 0) cv.fillRect(10 + colW * i, 500, 1, 34, GREY);
    drawTextC(cv, cx, 500, num, 2, INK);
    drawTextC(cv, cx, 520, lab, 1, GREY);
  });

  // Grid: 12 tiles, 3 x 4. Headline slot is fixed (2 lines), deck starts at
  // a fixed y below it -- the v8 overprint cannot happen here.
  const gx0 = 10;
  const gy0 = 546;
  const tw = 329;
  const th = 86;
  const gap = 8;
  TILES.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = gx0 + col * (tw + gap);
    const y = gy0 + row * (th + gap);
    panel(cv, x, y, tw, th);
    drawIcon(cv, t.icon, x + 8, y + 8);
    const tx = x + 42;
    const twd = tw - 42 - 8;
    const head = wrap(t.head, twd, 2);
    if (head.length > 2) throw new Error("tile headline too long: " + t.head);
    head.forEach((ln, k) => drawText(cv, tx, y + 8 + k * 19, ln, 2, INK));
    const deck = wrap(t.deck, twd, 1.5);
    if (deck.length > 2) throw new Error("tile deck too long: " + t.deck);
    deck.forEach((ln, k) => drawText(cv, tx, y + 51 + k * 13, ln, 1.5, GREY));
  });

  // In Brief: 10 items, 2 columns, one fixed 13px row each.
  panel(cv, 10, 918, 1004, 86);
  drawText(cv, 20, 924, "IN BRIEF", 1.5, RED);
  BRIEF_A.forEach((s, i) => {
    if (textW("* " + s, 1.5) > 480) throw new Error("brief too long: " + s);
    drawText(cv, 20, 940 + i * 13, "* " + s, 1.5, INK);
  });
  BRIEF_B.forEach((s, i) => {
    if (textW("* " + s, 1.5) > 480) throw new Error("brief too long: " + s);
    drawText(cv, 520, 940 + i * 13, "* " + s, 1.5, INK);
  });
  drawTextC(cv, W / 2, 1007, "ALL STORIES FIRST REPORTED ON WEDNESDAY 18 NOVEMBER 2026 - THE WORLD TODAY", 1, GREY);
  return cv;
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const png = encodePNG(build());
writeFileSync(join(outDir, "entry.png"), png);
console.log(`wrote ${join(outDir, "entry.png")} (${png.length} bytes, 1024x1024)`);
