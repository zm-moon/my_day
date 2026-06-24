import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidApiToken, unauthorized } from "@/lib/auth";
import { calculateScore, toPublicDayLog } from "@/lib/stats";
import { dateFromYmd, isYmd } from "@/lib/date";

type LogRequestBody = {
  date?: unknown;
  today?: unknown;
  tomorrow?: unknown;
  vibe?: unknown;
  mood?: unknown;
  tags?: unknown;
};

export async function GET() {
  const logs = await prisma.dayLog.findMany({
    orderBy: {
      date: "asc"
    }
  });

  return NextResponse.json(logs.map(toPublicDayLog));
}

export async function POST(request: Request) {
  if (!hasValidApiToken(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as LogRequestBody;

  if (typeof body.date !== "string" || !isYmd(body.date)) {
    return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
  }

  if (typeof body.today !== "string" || typeof body.tomorrow !== "string") {
    return NextResponse.json({ error: "today and tomorrow are required strings" }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
    : [];
  const vibe = typeof body.vibe === "string" && body.vibe.trim() ? body.vibe.trim() : null;
  const mood = typeof body.mood === "string" && body.mood.trim() ? body.mood.trim() : null;
  const score = calculateScore(body.today, body.tomorrow, vibe);

  const log = await prisma.dayLog.upsert({
    where: {
      date: dateFromYmd(body.date)
    },
    create: {
      date: dateFromYmd(body.date),
      today: body.today.trim(),
      tomorrow: body.tomorrow.trim(),
      vibe,
      mood,
      tags,
      score
    },
    update: {
      today: body.today.trim(),
      tomorrow: body.tomorrow.trim(),
      vibe,
      mood,
      tags,
      score
    }
  });

  return NextResponse.json(toPublicDayLog(log));
}
