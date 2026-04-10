export type ImportanceLevel = 0 | 1 | 2 | 3;

export interface TenantProfile {
  householdSize: number;
  desiredBedrooms: number;
  hasPets: boolean;
  accessibility: {
    wheelchairAccess: boolean;
    elderlyFriendly: boolean;
    noStairs: boolean;
    additionalNeeds: string;
  };
  location: {
    transitImportance: ImportanceLevel;
    parkingNeeded: boolean;
  };
}

export interface APIListingUnit {
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
}

export interface APIListingCost {
  monthly_rent: number;
  utilities: number;
}

export interface APIListingAccessibility {
  stairs: string;
  wheelchair_access: boolean;
  elderly_friendly_layout: boolean;
}

export interface APIListingLocation {
  distance_to_transit: number;
  distance_to_downtown: number;
  bus_access: string;
  parking: number;
  school_quality: number;
  school_zone: string;
  nearby_park: boolean;
}

export interface APIListingQuality {
  safety: number;
  noise: number;
  cleanliness: number;
  vibe: number;
  house_condition: number;
  appliances: string;
  repairs_needed: string;
  maintenance_burden: string;
}

export interface APIListingAmenities {
  laundry: string;
  ac: string;
  yard: string;
  backyard: string;
  balcony: boolean;
  storage: string;
  internet_quality: string;
  pet_friendliness: boolean;
  lease_security: string;
}

export interface APIListing {
  site_id: string;
  site_name: string;
  address: string;
  coordinates: { x: number; y: number };
  owner_developer_name: string;
  construction_type: string;
  unit: APIListingUnit;
  cost: APIListingCost;
  accessibility: APIListingAccessibility;
  location: APIListingLocation;
  quality: APIListingQuality;
  amenities: APIListingAmenities;
}

export interface ScoreBreakdown {
  space: number;
  accessibility: number;
  location: number;
  cost: number;
}

export interface ScoredListing {
  listing: APIListing;
  totalScore: number;
  breakdown: ScoreBreakdown;
  warnings: string[];
}

export interface APIListingsResponse {
  count: number;
  listings: APIListing[];
}
