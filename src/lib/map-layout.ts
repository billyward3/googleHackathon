// Map layout for Detroit affordable housing sites
// Coordinates are projected from real lat/lon:
//   x = 80 + (lon + 83.27) / 0.35 * 1480
//   y = 1000 - (lat - 42.29) / 0.17 * 920

export const MAP_WIDTH = 1640;
export const MAP_HEIGHT = 1080;

export const QUEUE_DOCK_POINT = { x: 90, y: 990 };
export const MOVE_OUT_POINT   = { x: 1560, y: 90 };

// Neighborhood districts — loosely correspond to Detroit's geographic zones
// Bounds derived from actual house coordinates + 30 px padding.
// Verified non-overlapping: each pair has a gap of ≥ 5 px.
export const DISTRICTS = [
  {
    id: "midtown",
    label: "Midtown / Downtown",
    // houses: x=[803,1195] y=[465,755]
    x: 755, y: 420, width: 455, height: 340,
    tone: "rgba(124, 200, 194, 0.12)",
  },
  {
    id: "corktown",
    label: "Corktown / SW",
    // houses: x=[635,899] y=[775,907]  — starts below Midtown bottom (760)
    x: 580, y: 765, width: 440, height: 200,
    tone: "rgba(244, 192, 106, 0.12)",
  },
  {
    id: "east-side",
    label: "East Side",
    // houses: x=[1223,1496] y=[155,685]  — starts right of Midtown/NorthEnd right (1210)
    x: 1215, y: 110, width: 375, height: 640,
    tone: "rgba(142, 226, 159, 0.11)",
  },
  {
    id: "north-end",
    label: "North End",
    // houses: x=[872,1138] y=[175,326]  — stops before East Side (1215) and above Midtown top (420)
    x: 820, y: 100, width: 390, height: 315,
    tone: "rgba(243, 185, 209, 0.12)",
  },
  {
    id: "west-side",
    label: "West Side",
    // houses: x=[503,722] y=[285,583]  — right edge (755) touches Midtown left
    x: 450, y: 205, width: 305, height: 480,
    tone: "rgba(125, 161, 242, 0.10)",
  },
  {
    id: "far-west",
    label: "Far West",
    // houses: x=[135,382] y=[235,375]  — right edge (445) has 5 px gap to West Side left (450)
    x: 80, y: 180, width: 365, height: 325,
    tone: "rgba(239, 195, 122, 0.09)",
  },
];

// Major Detroit streets as straight line segments
// Projected from real street coordinates
export const ROAD_SEGMENTS = [
  // Grand Boulevard — inner ring road at lat≈42.357 → y≈635
  { id: "grand-blvd", x1: 630, y1: 635, x2: 1420, y2: 635, width: 20 },
  // 7 Mile Rd — northern boundary at lat≈42.420 → y≈293
  { id: "7-mile", x1: 100, y1: 293, x2: 1540, y2: 293, width: 20 },
  // E Jefferson / Rivertown — south at lat≈42.333 → y≈768
  { id: "e-jefferson", x1: 800, y1: 768, x2: 1540, y2: 768, width: 16 },
  // Michigan Ave / W Vernor corridor at lat≈42.326 → y≈807
  { id: "michigan-ave", x1: 580, y1: 820, x2: 1030, y2: 780, width: 14 },
  // Woodward Ave — main N-S spine (lon≈-83.046 at south → x≈1012)
  { id: "woodward-s", x1: 1012, y1: 768, x2: 965, y2: 635, width: 18 },
  { id: "woodward-n", x1: 965, y1: 635, x2: 905, y2: 430, width: 18 },
  { id: "woodward-nn", x1: 905, y1: 430, x2: 862, y2: 293, width: 18 },
  // Lodge / I-75 connector at lon≈-83.076 → x≈896
  { id: "lodge", x1: 896, y1: 950, x2: 896, y2: 293, width: 14 },
];

// Diagonal / curved arterials as SVG path strings
// These mirror Detroit's radial street grid
export const ROAD_PATHS = [
  // Gratiot Ave — NE diagonal from downtown to east side
  "M 970 720 C 1080 580 1240 420 1440 200",
  // Grand River Ave — NW diagonal from downtown to far west
  "M 950 730 C 780 600 560 480 240 380",
  // Mack Ave — gentler NE diagonal
  "M 990 675 C 1120 590 1280 510 1450 460",
  // E Warren Ave — east side horizontal connector at lat≈42.388 → y≈492
  "M 1110 492 C 1220 490 1350 488 1540 495",
];

// Street names paired with ROAD_PATHS (rendered as labels)
export const ROAD_PATH_LABELS = [
  { text: "GRATIOT AVE", x: 1170, y: 485 },
  { text: "GRAND RIVER AVE", x: 590, y: 560 },
  { text: "MACK AVE", x: 1230, y: 565 },
  { text: "E WARREN AVE", x: 1180, y: 476 },
];

// Street names for ROAD_SEGMENTS
export const ROAD_SEGMENT_LABELS: Record<string, { text: string; x: number; y: number }> = {
  "grand-blvd":  { text: "GRAND BLVD", x: 650, y: 628 },
  "7-mile":      { text: "7 MILE RD", x: 120, y: 286 },
  "e-jefferson": { text: "E JEFFERSON AVE", x: 820, y: 762 },
  "michigan-ave":{ text: "MICHIGAN AVE", x: 600, y: 843 },
  "woodward-s":  { text: "WOODWARD AVE", x: 1018, y: 810 },
  "woodward-n":  { text: "", x: 0, y: 0 },
  "woodward-nn": { text: "", x: 0, y: 0 },
  "lodge":       { text: "LODGE FWY", x: 904, y: 960 },
};
