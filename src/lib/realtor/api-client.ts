import { APIListing, APIListingsResponse } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_LISTINGS_API_URL ?? "";

const MOCK_LISTINGS: APIListing[] = [
  {
    site_id: "HRD10176",
    site_name: "Parkview Place",
    address: "1401 Chene St",
    coordinates: { x: -83.0272671986912, y: 42.3438277389423 },
    owner_developer_name: "MHT Housing",
    construction_type: "Occupied Rehabilitation",
    unit: { unit_type: "apartment", bedrooms: 4, bathrooms: 2, square_footage: 1430 },
    cost: { monthly_rent: 1830, utilities: 280 },
    accessibility: { stairs: "one flight", wheelchair_access: false, elderly_friendly_layout: false },
    location: {
      distance_to_transit: 0.8,
      distance_to_downtown: 1.3,
      bus_access: "strong",
      parking: 0,
      school_quality: 5,
      school_zone: "Zone B",
      nearby_park: true,
    },
    quality: {
      safety: 6,
      noise: 2,
      cleanliness: 5,
      vibe: 7,
      house_condition: 7,
      appliances: "standard",
      repairs_needed: "minor",
      maintenance_burden: "medium",
    },
    amenities: {
      laundry: "in-unit",
      ac: "central",
      yard: "none",
      backyard: "none",
      balcony: false,
      storage: "storage locker",
      internet_quality: "good",
      pet_friendliness: true,
      lease_security: "medium",
    },
  },
  {
    site_id: "HRD10244",
    site_name: "University Meadows",
    address: "4500 Trumbull St",
    coordinates: { x: -83.0762596819398, y: 42.3496139476564 },
    owner_developer_name: "Develop Detroit/ PVM",
    construction_type: "Occupied Rehabilitation",
    unit: { unit_type: "apartment", bedrooms: 2, bathrooms: 2, square_footage: 760 },
    cost: { monthly_rent: 1150, utilities: 160 },
    accessibility: { stairs: "none", wheelchair_access: false, elderly_friendly_layout: true },
    location: {
      distance_to_transit: 1.4,
      distance_to_downtown: 2.0,
      bus_access: "moderate",
      parking: 0,
      school_quality: 5,
      school_zone: "Zone D",
      nearby_park: false,
    },
    quality: {
      safety: 8,
      noise: 6,
      cleanliness: 10,
      vibe: 7,
      house_condition: 7,
      appliances: "modern",
      repairs_needed: "none",
      maintenance_burden: "medium",
    },
    amenities: {
      laundry: "in-unit",
      ac: "central",
      yard: "shared",
      backyard: "none",
      balcony: false,
      storage: "none",
      internet_quality: "good",
      pet_friendliness: true,
      lease_security: "low",
    },
  },
  {
    site_id: "HRD12056",
    site_name: "Ruth Ellis Clairmount (REC) Center",
    address: "61 Clairmount St",
    coordinates: { x: -83.0830462719496, y: 42.3821521377188 },
    owner_developer_name: "Full Circle Communities",
    construction_type: "New Construction",
    unit: { unit_type: "apartment", bedrooms: 4, bathrooms: 3, square_footage: 1410 },
    cost: { monthly_rent: 1570, utilities: 300 },
    accessibility: { stairs: "few", wheelchair_access: false, elderly_friendly_layout: false },
    location: {
      distance_to_transit: 1.6,
      distance_to_downtown: 4.0,
      bus_access: "limited",
      parking: 1,
      school_quality: 8,
      school_zone: "Zone C",
      nearby_park: false,
    },
    quality: {
      safety: 6,
      noise: 3,
      cleanliness: 8,
      vibe: 6,
      house_condition: 3,
      appliances: "mismatched",
      repairs_needed: "moderate",
      maintenance_burden: "high",
    },
    amenities: {
      laundry: "in-unit",
      ac: "central",
      yard: "none",
      backyard: "none",
      balcony: true,
      storage: "storage locker",
      internet_quality: "good",
      pet_friendliness: true,
      lease_security: "medium",
    },
  },
];

export async function fetchListings(): Promise<APIListing[]> {
  const qs = "";

  try {
    const response = await fetch(`${BASE_URL}/api/listings${qs}`);

    if (!response.ok) {
      console.warn(`API returned ${response.status}, falling back to mock data`);
      return MOCK_LISTINGS;
    }

    const data: APIListingsResponse = await response.json();
    return data.listings;
  } catch {
    console.warn("API unreachable, using mock data");
    return MOCK_LISTINGS;
  }
}

export async function fetchListing(
  siteId: string,
): Promise<APIListing | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${siteId}`);

    if (!response.ok) {
      return MOCK_LISTINGS.find((l) => l.site_id === siteId) ?? null;
    }

    return await response.json();
  } catch {
    return MOCK_LISTINGS.find((l) => l.site_id === siteId) ?? null;
  }
}
