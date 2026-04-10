import { TenantProfile } from "./types";

const RANKINGS_KEY = "civic-housing-rankings";
const PROFILE_KEY = "civic-housing-profile";

export function saveRankings(siteIds: string[]): void {
  try {
    localStorage.setItem(RANKINGS_KEY, JSON.stringify(siteIds));
  } catch {
    console.warn("Failed to save rankings to localStorage");
  }
}

export function loadRankings(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RANKINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: TenantProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    console.warn("Failed to save profile to localStorage");
  }
}

export function loadProfile(): TenantProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenantProfile;
  } catch {
    return null;
  }
}

export function clearRankings(): void {
  try {
    localStorage.removeItem(RANKINGS_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}
