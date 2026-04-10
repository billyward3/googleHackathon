import {
  APIListing,
  ScoreBreakdown,
  ScoredListing,
  TenantProfile,
} from "./types";
import { BUS_ACCESS_RANK } from "./weights";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreSpace(profile: TenantProfile, listing: APIListing): number {
  const diff = Math.abs(listing.unit.bedrooms - profile.desiredBedrooms);
  const bedroomScore = diff === 0 ? 100 : Math.max(0, 100 - diff * 25);
  const sqftBonus = clamp((listing.unit.square_footage - 600) / 12, 0, 20);
  return clamp(bedroomScore + sqftBonus, 0, 100);
}

function scoreAccessibility(
  profile: TenantProfile,
  listing: APIListing,
): number {
  const prefs = profile.accessibility;
  const acc = listing.accessibility;

  if (!prefs.wheelchairAccess && !prefs.elderlyFriendly && !prefs.noStairs) {
    return 80;
  }

  let score = 80;
  let checks = 0;
  let passed = 0;

  if (prefs.wheelchairAccess) {
    checks++;
    if (acc.wheelchair_access) {
      passed++;
    } else {
      score -= 30;
    }
  }

  if (prefs.elderlyFriendly) {
    checks++;
    if (acc.elderly_friendly_layout) {
      passed++;
    } else {
      score -= 25;
    }
  }

  if (prefs.noStairs) {
    checks++;
    if (acc.stairs === "none") {
      passed++;
    } else {
      score -= 30;
    }
  }

  if (checks > 0 && passed === checks) {
    score = 100;
  }

  return clamp(score, 0, 100);
}

function scoreLocation(profile: TenantProfile, listing: APIListing): number {
  const loc = listing.location;
  const prefs = profile.location;
  let score = 60;

  if (prefs.transitImportance > 0) {
    const transitScore = Math.max(0, 30 - loc.distance_to_transit * 15);
    const busBonus = (BUS_ACCESS_RANK[loc.bus_access] ?? 0) * 8;
    score += (transitScore + busBonus) * (prefs.transitImportance / 3);
  }

  if (prefs.parkingNeeded) {
    score += loc.parking > 0 ? 20 : -15;
  }

  return clamp(score, 0, 100);
}

function scoreCost(listing: APIListing): number {
  const total = listing.cost.monthly_rent + listing.cost.utilities;
  if (total <= 800) return 100;
  if (total <= 1200) return 85;
  if (total <= 1600) return 65;
  if (total <= 2000) return 40;
  return 20;
}

function buildWarnings(profile: TenantProfile, listing: APIListing): string[] {
  const warnings: string[] = [];

  const bedroomDiff = profile.desiredBedrooms - listing.unit.bedrooms;
  if (bedroomDiff > 0) {
    warnings.push(
      `${bedroomDiff} fewer bedroom${bedroomDiff > 1 ? "s" : ""} than desired`,
    );
  }

  if (profile.accessibility.wheelchairAccess && !listing.accessibility.wheelchair_access) {
    warnings.push("No wheelchair access");
  }

  if (profile.accessibility.elderlyFriendly && !listing.accessibility.elderly_friendly_layout) {
    warnings.push("Not senior-friendly layout");
  }

  if (profile.accessibility.noStairs && listing.accessibility.stairs !== "none") {
    warnings.push(`Has stairs (${listing.accessibility.stairs})`);
  }

  if (profile.hasPets && !listing.amenities.pet_friendliness) {
    warnings.push("Not pet-friendly");
  }

  if (profile.location.parkingNeeded && listing.location.parking === 0) {
    warnings.push("No parking");
  }

  return warnings;
}

export function scoreListing(
  profile: TenantProfile,
  listing: APIListing,
): ScoredListing {
  const breakdown: ScoreBreakdown = {
    space: scoreSpace(profile, listing),
    accessibility: scoreAccessibility(profile, listing),
    location: scoreLocation(profile, listing),
    cost: scoreCost(listing),
  };

  const values = Object.values(breakdown);
  const totalScore = values.reduce((sum, v) => sum + v, 0) / values.length;
  const warnings = buildWarnings(profile, listing);

  return {
    listing,
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown,
    warnings,
  };
}

export function rankListings(
  profile: TenantProfile,
  listings: APIListing[],
): ScoredListing[] {
  return listings
    .map((listing) => scoreListing(profile, listing))
    .sort((a, b) => b.totalScore - a.totalScore);
}
