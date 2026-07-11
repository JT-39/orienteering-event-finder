import { NextResponse } from "next/server";
import { looksLikePostcode, suggestPostcodes } from "@/lib/geocode/postcodesIo";
import { searchPlace } from "@/lib/geocode/nominatim";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = looksLikePostcode(q) ? await suggestPostcodes(q) : await searchPlace(q);
  return NextResponse.json({ results });
}
