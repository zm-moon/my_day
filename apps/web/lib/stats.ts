import type { DayLog } from "@prisma/client";
import { dateFromYmd, todayYmd, ymdFromDate } from "./date";

export type PublicDayLog = Omit<DayLog, "date"> & {
  date: string;
};

export type Stats = {
  totalDays: number;
  currentStreak: number;
  monthDays: number;
  yearDays: number;
};

// score 代表一天记录的“信息量”，用于控制热力图颜色深浅。
export function calculateScore(today: string, tomorrow: string, notes?: string | null, vibe?: string | null): number {
  const totalText = `${today ?? ""}${tomorrow ?? ""}${notes ?? ""}${vibe ?? ""}`.trim();
  const count = Array.from(totalText).length;

  if (count === 0) return 0;
  if (count <= 100) return 1;
  if (count <= 300) return 2;
  if (count <= 600) return 3;
  return 4;
}

export function toPublicDayLog(log: DayLog): PublicDayLog {
  return {
    ...log,
    date: ymdFromDate(log.date)
  };
}

export function calculateStats(logs: Array<Pick<PublicDayLog, "date">>): Stats {
  const dates = new Set(logs.map((log) => log.date));
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let currentStreak = 0;
  let cursor = dateFromYmd(todayYmd());

  while (dates.has(ymdFromDate(cursor))) {
    currentStreak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return {
    totalDays: dates.size,
    currentStreak,
    monthDays: logs.filter((log) => {
      const date = dateFromYmd(log.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }).length,
    yearDays: logs.filter((log) => dateFromYmd(log.date).getFullYear() === currentYear).length
  };
}

// 首页只展示最近一段时间内真实存在的记录，不为没有记录的日期生成空卡片。
export function recentLogs(logs: PublicDayLog[], days = 30): PublicDayLog[] {
  const today = dateFromYmd(todayYmd());
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1);

  return logs
    .filter((log) => dateFromYmd(log.date) >= start)
    .sort((a, b) => b.date.localeCompare(a.date));
}
