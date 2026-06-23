import { FUND_DROP_LEVELS } from "../config/fundDropLevels";
import { FUND_STOCKS } from "../config/fundStocks";
import { FUND_DROP_DONE } from "../config/fundDropDone";

let weekFundCode: string | null = null;
const FUND_BASE_DATE = new Date(2026, 1, 6);
let FUND_DROP_DONE_OVERRIDES: Record<string, Record<string | number, boolean>> = {};

function getSortedFundCodes(): string[] {
  return Object.keys(FUND_STOCKS).sort((a, b) => a.localeCompare(b));
}

function ensureWeekFundPick() {
  const codes = getSortedFundCodes();
  if (codes.length === 0) {
    weekFundCode = null;
    return;
  }
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const baseMonday = new Date(FUND_BASE_DATE.getFullYear(), FUND_BASE_DATE.getMonth(), FUND_BASE_DATE.getDate());
  const baseDay = baseMonday.getDay();
  baseMonday.setDate(baseMonday.getDate() - baseDay + (baseDay === 0 ? -6 : 1));
  
  const currentMonday = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth(), todayMidnight.getDate());
  const currentDay = currentMonday.getDay();
  currentMonday.setDate(currentMonday.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  
  const diffTime = currentMonday.getTime() - baseMonday.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  const idx = Math.max(0, diffWeeks) % codes.length;
  weekFundCode = codes[idx] || null;
}

ensureWeekFundPick();

function getLowerLevel(percent: number, levels: number[]): number | null {
  const lower = levels.filter((l) => l <= percent);
  if (lower.length === 0) return null;
  return Math.max(...lower);
}

function getUpperLevel(percent: number, levels: number[]): number | null {
  const upper = levels.filter((l) => l > percent);
  if (upper.length === 0) return null;
  return Math.min(...upper);
}

function isNearDropLevel(percent: number, levels: number[], range = 1): boolean {
  return levels.some((level) => Math.abs(percent - level) <= range);
}

function injectFunds() {
  try {
    ensureWeekFundPick();
    const container = document.querySelector("#table-fund-category");
    const fundRows = container
      ? container.querySelectorAll("tbody tr")
      : document.querySelectorAll("tbody tr");
    fundRows.forEach((row) => {
      const codeEl = row.querySelector<HTMLAnchorElement>("a.font-bold.active-link");
      if (!codeEl) return;
      const tds = row.querySelectorAll<HTMLTableCellElement>("td");
      const latestText = tds[3]?.textContent || "";
      const latest = Number(latestText.replace(/,/g, "").trim());
      const code = codeEl.textContent?.trim() || "";
      const configuredBase = FUND_STOCKS[code];
      if (typeof configuredBase !== "number" || configuredBase <= 0 || isNaN(latest)) return;
      const percent = ((latest - configuredBase) / configuredBase) * 100;
      let pl = codeEl.querySelector(".pl-indicator") as HTMLSpanElement;
      if (!pl) {
        pl = document.createElement("span");
        pl.className = "pl-indicator";
        pl.style.marginLeft = "6px";
        pl.style.fontWeight = "600";
        codeEl.appendChild(pl);
      }
      let text = ` (${percent.toFixed(2)}%)`;
      if (weekFundCode && code === weekFundCode) {
        text += " tuần này";
      }
      pl.textContent = text;
      const baseLevels = FUND_DROP_LEVELS[code] || [-1, -2, -3, -4, -5];
      const doneMap = FUND_DROP_DONE_OVERRIDES[code] || FUND_DROP_DONE[code] || {};
      const dropLevels = baseLevels.filter(l => !doneMap[l]);
      const lowerLevel = getLowerLevel(percent, dropLevels);
      const upperLevel = getUpperLevel(percent, dropLevels);
      const lowerText = lowerLevel !== null ? `${lowerLevel}%` : "Không có";
      const upperText = upperLevel !== null ? `${upperLevel}%` : "Không có";
      pl.title = `Giá gốc: ${configuredBase}
Giá gần nhất: ${latest}
Thay đổi: ${percent.toFixed(2)}%
Mốc dưới gần: ${lowerText}
Mốc trên gần: ${upperText}`;
      const targetRow = row as HTMLElement;
      if (isNearDropLevel(percent, dropLevels)) {
        pl.style.color = "#ff00ddff";
        targetRow.style.borderLeft = "4px solid #ff00ddff";
        targetRow.style.backgroundColor = "rgba(255, 0, 221, 0.1)";
      } else {
        pl.style.color = percent < 0 ? "rgb(238,84,66)" : "rgb(0,170,0)";
        targetRow.style.borderLeft = "";
        targetRow.style.backgroundColor = "";
      }
    });
  } catch (e) {
    console.error("Fund Extension Error:", e);
  }
}

injectFunds();

const bootStart = Date.now();
const bootId = window.setInterval(() => {
  const tableReady =
    document.querySelector("#table-fund-category tbody tr") ||
    document.querySelector("tbody tr");
  injectFunds();
  if (tableReady || Date.now() - bootStart > 15000) {
    clearInterval(bootId);
  }
}, 500);

setInterval(() => {
  document.querySelectorAll(".pl-indicator").forEach(el => el.remove());
  injectFunds();
}, 600000);

if (chrome?.storage?.local) {
  chrome.storage.local.get(["fundDropDone"], (res) => {
    if (res.fundDropDone) {
      FUND_DROP_DONE_OVERRIDES = res.fundDropDone as Record<string, Record<string | number, boolean>>;
      injectFunds();
    } else {
      chrome.storage.local.set({ fundDropDone: FUND_DROP_DONE });
    }
  });
}

