import { CsvHouse, CSV_HOUSES } from "@/data/housingData";

// ── Hierarchy definitions ────────────────────────────────────────────────────

const BUS_RANK: Record<string, number> = { limited: 1, moderate: 2, strong: 3 };
const STAIRS_RANK: Record<string, number> = { none: 0, "one flight": 1, few: 2, multiple: 3 };

// ── Shape mapping ─────────────────────────────────────────────────────────────

export function toApiShape(h: CsvHouse) {
  return {
    site_id: h.id,
    site_name: h.siteName,
    address: h.address,
    coordinates: { x: h.lon, y: h.lat },
    owner_developer_name: h.ownerDeveloper,
    construction_type: h.constructionType,

    unit: {
      unit_type: h.unitType,
      bedrooms: h.bedrooms,
      bathrooms: h.bathrooms,
      square_footage: h.squareFootage,
    },

    cost: {
      monthly_rent: h.monthlyRent,
      utilities: h.utilities,
    },

    accessibility: {
      stairs: h.stairs,
      wheelchair_access: h.wheelchairAccess,
      elderly_friendly_layout: h.elderlyFriendlyLayout,
    },

    location: {
      distance_to_transit: h.distanceToTransit,
      distance_to_downtown: h.distanceToDowntown,
      bus_access: h.busAccess,
      parking: h.parking,
      school_quality: h.schoolQuality,
      school_zone: h.schoolZone,
      nearby_park: h.nearbyPark,
    },

    quality: {
      safety: h.safety,
      noise: h.noise,
      cleanliness: h.cleanliness,
      vibe: h.vibe,
      house_condition: h.houseCondition,
      appliances: h.appliances,
      repairs_needed: h.repairsNeeded,
      maintenance_burden: h.maintenanceBurden,
    },

    amenities: {
      laundry: h.laundry,
      ac: h.ac,
      yard: h.yard,
      backyard: h.backyard,
      balcony: h.balcony,
      storage: h.storage,
      internet_quality: h.internetQuality,
      pet_friendliness: h.petFriendly,
      lease_security: h.leaseSecurity,
    },
  };
}

// ── Filter ────────────────────────────────────────────────────────────────────

export interface ListingFilters {
  min_bedrooms?: number;
  max_bedrooms?: number;
  max_rent?: number;
  wheelchair_access?: boolean;
  elderly_friendly?: boolean;
  pet_friendly?: boolean;
  min_safety?: number;
  bus_access?: string;
  unit_type?: string;
  max_stairs?: string;
}

export function applyFilters(houses: CsvHouse[], f: ListingFilters): CsvHouse[] {
  return houses.filter((h) => {
    if (f.min_bedrooms !== undefined && h.bedrooms < f.min_bedrooms) return false;
    if (f.max_bedrooms !== undefined && h.bedrooms > f.max_bedrooms) return false;
    if (f.max_rent !== undefined && h.monthlyRent > f.max_rent) return false;
    if (f.wheelchair_access === true && !h.wheelchairAccess) return false;
    if (f.elderly_friendly === true && !h.elderlyFriendlyLayout) return false;
    if (f.pet_friendly === true && !h.petFriendly) return false;
    if (f.min_safety !== undefined && h.safety < f.min_safety) return false;
    if (f.unit_type !== undefined && h.unitType !== f.unit_type) return false;

    // Bus access: filtering by X returns X and everything above it
    if (f.bus_access !== undefined) {
      const minRank = BUS_RANK[f.bus_access] ?? 0;
      const hRank = BUS_RANK[h.busAccess] ?? 0;
      if (hRank < minRank) return false;
    }

    // Stairs: filtering by X returns X and everything below it (less stairs)
    if (f.max_stairs !== undefined) {
      const maxRank = STAIRS_RANK[f.max_stairs] ?? 99;
      const hRank = STAIRS_RANK[h.stairs] ?? 99;
      if (hRank > maxRank) return false;
    }

    return true;
  });
}

export { CSV_HOUSES };
