import { NextResponse } from "next/server";
import { getEvents } from "@/lib/events/queries";
import { parseEventSearchParams } from "@/lib/events/filterParams";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const filters = parseEventSearchParams(params);

  const { events, total, page, pageSize } = await getEvents(filters);
  return NextResponse.json({ events, total, page, pageSize });
}
