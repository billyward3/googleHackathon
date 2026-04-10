export interface PointOfInterest {
  name: string;
  lat: number;
  lng: number;
  type: "hospital" | "transit" | "school" | "government";
}

export const DETROIT_POIS: PointOfInterest[] = [
  // Hospitals
  { name: "Detroit Medical Center", lat: 42.3558, lng: -83.0567, type: "hospital" },
  { name: "Henry Ford Hospital", lat: 42.3647, lng: -83.0836, type: "hospital" },
  { name: "Beaumont Hospital", lat: 42.3911, lng: -83.1039, type: "hospital" },
  { name: "Sinai-Grace Hospital", lat: 42.3790, lng: -83.1558, type: "hospital" },
  { name: "St. John Hospital", lat: 42.4214, lng: -82.9371, type: "hospital" },

  // Transit hubs
  { name: "Rosa Parks Transit Center", lat: 42.3314, lng: -83.0496, type: "transit" },
  { name: "QLINE Woodward Station", lat: 42.3362, lng: -83.0545, type: "transit" },
  { name: "Michigan & Trumbull Station", lat: 42.3314, lng: -83.0679, type: "transit" },
  { name: "DDOT Terminal", lat: 42.3311, lng: -83.0539, type: "transit" },
  { name: "SMART Macomb Terminal", lat: 42.4677, lng: -82.9156, type: "transit" },

  // Schools
  { name: "Cass Technical High School", lat: 42.3468, lng: -83.0573, type: "school" },
  { name: "Renaissance High School", lat: 42.3879, lng: -83.1440, type: "school" },
  { name: "Martin Luther King Jr. High", lat: 42.3730, lng: -83.0994, type: "school" },
  { name: "Detroit Edison Public Academy", lat: 42.3723, lng: -83.0757, type: "school" },
  { name: "University Prep Academy", lat: 42.3583, lng: -83.1006, type: "school" },

  // Government / services
  { name: "Detroit Housing Commission", lat: 42.3363, lng: -83.0502, type: "government" },
  { name: "Wayne County Community College", lat: 42.3482, lng: -83.0645, type: "government" },
  { name: "Social Security Office", lat: 42.3291, lng: -83.0501, type: "government" },
];

export const POI_COLORS: Record<PointOfInterest["type"], string> = {
  hospital: "#d94545",
  transit: "#4580d9",
  school: "#d9a545",
  government: "#7b5ea7",
};

export const POI_LABELS: Record<PointOfInterest["type"], string> = {
  hospital: "Hospitals",
  transit: "Transit",
  school: "Schools",
  government: "Services",
};
