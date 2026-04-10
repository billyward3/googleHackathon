import { NextRequest, NextResponse } from "next/server";
import { CSV_HOUSES, toApiShape } from "../lib";

const CORS = { "Access-Control-Allow-Origin": "*" };

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}

export function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ site_id: string }> },
) {
  return params.then(({ site_id }) => {
    const house = CSV_HOUSES.find((h) => h.id === site_id);
    if (!house) {
      return NextResponse.json(
        { error: "Listing not found", site_id },
        { status: 404, headers: CORS },
      );
    }
    return NextResponse.json(toApiShape(house), { headers: CORS });
  });
}
