import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateFromYmd, isYmd } from "@/lib/date";
import { toPublicDayLog } from "@/lib/stats";

type Params = {
  params: Promise<{
    date: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { date } = await params;

  if (!isYmd(date)) {
    return NextResponse.json({ error: "date must use YYYY-MM-DD" }, { status: 400 });
  }

  const log = await prisma.dayLog.findUnique({
    where: {
      date: dateFromYmd(date)
    }
  });

  if (!log) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(toPublicDayLog(log));
}
