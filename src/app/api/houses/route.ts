import { NextRequest, NextResponse } from "next/server";
import { getHouseById, getNextHouseId } from "@/data/housingData";

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const house = getHouseById(id);
  if (!house) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  const next = getNextHouseId(id);

  return NextResponse.json({ ...house, next });
}
