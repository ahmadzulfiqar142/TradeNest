export type FilterPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "qtd"
  | "last_quarter"
  | "mid_year"
  | "this_year"
  | "last_year"
  | "custom";

export type DateRange = { from: string; to: string };

export const FILTER_LABELS: Record<FilterPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  qtd: "Quarter to Date",
  last_quarter: "Last Quarter",
  mid_year: "Mid Year",
  this_year: "This Year",
  last_year: "Last Year",
  custom: "Custom Range",
};

export const DEFAULT_PRESET: FilterPreset = "this_month";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getDateRange(preset: FilterPreset, custom?: DateRange): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDate();

  switch (preset) {
    case "today": {
      const t = ymd(now);
      return { from: t, to: t };
    }
    case "yesterday": {
      const yest = new Date(y, m, d - 1);
      const t = ymd(yest);
      return { from: t, to: t };
    }
    case "this_week": {
      const day = now.getDay(); // 0=Sun
      const mon = new Date(y, m, d - ((day + 6) % 7));
      return { from: ymd(mon), to: ymd(now) };
    }
    case "last_week": {
      const day = now.getDay();
      const thisMonday = new Date(y, m, d - ((day + 6) % 7));
      const lastMon = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 7);
      const lastSun = new Date(lastMon.getFullYear(), lastMon.getMonth(), lastMon.getDate() + 6);
      return { from: ymd(lastMon), to: ymd(lastSun) };
    }
    case "this_month":
      return { from: `${y}-${pad(m + 1)}-01`, to: ymd(now) };
    case "last_month": {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      const lastDay = new Date(ly, lm + 1, 0).getDate();
      return { from: `${ly}-${pad(lm + 1)}-01`, to: `${ly}-${pad(lm + 1)}-${pad(lastDay)}` };
    }
    case "qtd": {
      const qStart = Math.floor(m / 3) * 3;
      return { from: `${y}-${pad(qStart + 1)}-01`, to: ymd(now) };
    }
    case "last_quarter": {
      const curQ = Math.floor(m / 3);
      const lqStart = curQ === 0 ? 9 : (curQ - 1) * 3;
      const lqYear = curQ === 0 ? y - 1 : y;
      const lqEnd = lqStart + 2;
      const lastDay = new Date(lqYear, lqEnd + 1, 0).getDate();
      return {
        from: `${lqYear}-${pad(lqStart + 1)}-01`,
        to: `${lqYear}-${pad(lqEnd + 1)}-${pad(lastDay)}`,
      };
    }
    case "mid_year":
      return { from: `${y}-01-01`, to: `${y}-06-30` };
    case "this_year":
      return { from: `${y}-01-01`, to: ymd(now) };
    case "last_year":
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    case "custom":
      return custom ?? { from: `${y}-${pad(m + 1)}-01`, to: ymd(now) };
  }
}
