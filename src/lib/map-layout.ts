export const MAP_WIDTH = 1640;
export const MAP_HEIGHT = 1080;

export const QUEUE_DOCK_POINT = { x: 126, y: 954 };
export const MOVE_OUT_POINT = { x: 1510, y: 116 };

export const DISTRICTS = [
  { id: "northwest", label: "Harbor", x: 80, y: 90, width: 420, height: 300, tone: "rgba(124, 200, 194, 0.13)" },
  { id: "north", label: "Market", x: 590, y: 84, width: 420, height: 310, tone: "rgba(244, 192, 106, 0.12)" },
  { id: "northeast", label: "Heights", x: 1090, y: 96, width: 420, height: 300, tone: "rgba(243, 185, 209, 0.12)" },
  { id: "southwest", label: "Cedar", x: 98, y: 546, width: 410, height: 310, tone: "rgba(142, 226, 159, 0.12)" },
  { id: "south", label: "River", x: 610, y: 540, width: 420, height: 320, tone: "rgba(125, 161, 242, 0.10)" },
  { id: "southeast", label: "Garden", x: 1084, y: 544, width: 430, height: 316, tone: "rgba(239, 125, 122, 0.08)" },
];

export const ROAD_SEGMENTS = [
  { id: "ring-top", x1: 80, y1: 450, x2: 1540, y2: 450, width: 30 },
  { id: "ring-bottom", x1: 86, y1: 910, x2: 1540, y2: 910, width: 30 },
  { id: "spine-left", x1: 536, y1: 60, x2: 536, y2: 1000, width: 28 },
  { id: "spine-right", x1: 1062, y1: 64, x2: 1062, y2: 1002, width: 28 },
  { id: "harbor-curve", x1: 110, y1: 230, x2: 532, y2: 240, width: 18 },
  { id: "market-curve", x1: 564, y1: 236, x2: 1058, y2: 256, width: 18 },
  { id: "heights-curve", x1: 1082, y1: 238, x2: 1528, y2: 218, width: 18 },
  { id: "cedar-curve", x1: 118, y1: 690, x2: 536, y2: 720, width: 18 },
  { id: "river-curve", x1: 564, y1: 698, x2: 1058, y2: 674, width: 18 },
  { id: "garden-curve", x1: 1084, y1: 698, x2: 1528, y2: 720, width: 18 },
];
