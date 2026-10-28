import { NextResponse } from "next/server";

/**
 * The call-request form was retired: calls are booked on Google Calendar now
 * (the booking URL lives in D1 site_settings, call_booking_url). Stored request data is kept.
 */
const gone = () =>
  NextResponse.json({ ok: false, error: "gone" }, { status: 410, headers: { "Cache-Control": "no-store" } });

export const GET = gone;
export const POST = gone;
