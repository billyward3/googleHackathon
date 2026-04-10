import { NextRequest, NextResponse } from "next/server";
import { CSV_HOUSES, applyFilters, toApiShape, ListingFilters } from "./lib";

const CORS = { "Access-Control-Allow-Origin": "*" };

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}

export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  function intParam(key: string) {
    const v = p.get(key);
    if (v === null) return undefined;
    const n = parseInt(v, 10);
    return isNaN(n) ? undefined : n;
  }

  function boolParam(key: string) {
    const v = p.get(key);
    if (v === null) return undefined;
    return v === "true" || v === "1";
  }

  const filters: ListingFilters = {
    min_bedrooms: intParam("min_bedrooms"),
    max_bedrooms: intParam("max_bedrooms"),
    max_rent: intParam("max_rent"),
    wheelchair_access: boolParam("wheelchair_access"),
    elderly_friendly: boolParam("elderly_friendly"),
    pet_friendly: boolParam("pet_friendly"),
    min_safety: intParam("min_safety"),
    bus_access: p.get("bus_access") ?? undefined,
    unit_type: p.get("unit_type") ?? undefined,
    max_stairs: p.get("max_stairs") ?? undefined,
  };

  const results = applyFilters(CSV_HOUSES, filters);
  const listings = results.map(toApiShape);

  return NextResponse.json({ count: listings.length, listings }, { headers: CORS });
}
