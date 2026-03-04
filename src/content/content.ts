import { DROP_LEVELS } from "../config/dropLevels";
import { STOCKS as DEFAULT_STOCKS } from "../config/stocks";

let currentStocks: Record<string, number> = { ...DEFAULT_STOCKS };
let todayCode: string | null = null;
const BASE_DATE = new Date(2026, 1, 6); // 2026-02-06 (tháng 0-based)

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function getSortedCodes(): string[] {
  return Object.keys(currentStocks).sort((a, b) => a.localeCompare(b));
}

function ensureTodayPick() {
  const codes = getSortedCodes();
  if (codes.length === 0) {
    todayCode = null;
    return;
  }
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!isWeekday(todayMidnight)) {
    todayCode = null;
    return;
  }
  let count = 0;
  const cur = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), BASE_DATE.getDate());
  while (cur < todayMidnight) {
    if (isWeekday(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  const idx = count % codes.length;
  todayCode = codes[idx] || null;
}

ensureTodayPick();



function parsePrice(text: string): number {
  return Number(text.replace(/,/g, "").trim());
}

function parseNumberFlexible(text: string): number {
  let s = (text || "").trim().replace(/\s/g, "").replace(/,/g, "");
  const dots = (s.match(/\./g) || []).length;
  if (dots > 1) {
    s = s.replace(/\./g, "");
  }
  s = s.replace(/%/g, "");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function getLowerLevel(percent: number, levels: number[]): number | null {
  const lower = levels.filter(l => l <= percent);
  if (lower.length === 0) return null;
  return Math.max(...lower);
}

function getUpperLevel(percent: number, levels: number[]): number | null {
  const upper = levels.filter(l => l > percent);
  if (upper.length === 0) return null;
  return Math.min(...upper);
}

function isNearDropLevel(
  percent: number,
  levels: number[],
  range = 2
): boolean {
  return levels.some(level => Math.abs(percent - level) <= range);
}

function injectPL() {
  try {
    ensureTodayPick();
    const vndTable = document.querySelector("table.portfolio-data") as HTMLTableElement | null;
    if (vndTable) {
      const headRow = vndTable.querySelector("thead tr");
      const ths = headRow ? Array.from(headRow.querySelectorAll("th")) : [];
      const headerTexts = ths.map(th => (th.textContent || "").trim());
      let codeIdx = headerTexts.findIndex(t => t.includes("Mã CK"));
      if (codeIdx < 0) codeIdx = headerTexts.findIndex(t => t.includes("Mã"));
      let priceIdx = headerTexts.findIndex(t => t.includes("Giá hiện tại"));
      if (priceIdx < 0) priceIdx = headerTexts.findIndex(t => t.includes("Giá TT"));
      if (codeIdx >= 0 && priceIdx >= 0) {
        const bodyRows = vndTable.querySelectorAll("tbody tr");
        bodyRows.forEach(row => {
          const cells = Array.from(row.querySelectorAll("td"));
          if (cells.length === 0) return;
          const codeCell = cells[codeIdx];
          const priceCell = cells[priceIdx];
          if (!codeCell || !priceCell) return;
          const code = (codeCell.textContent || "").trim();
          const currentPrice = parseNumberFlexible(priceCell.textContent || "");
          const basePrice = currentStocks[code];
          if (!basePrice || !currentPrice) return;
          let pl = row.querySelector(".pl-indicator") as HTMLSpanElement;
          if (!pl) {
            pl = document.createElement("span");
            pl.className = "pl-indicator";
            pl.style.marginLeft = "6px";
            pl.style.fontWeight = "600";
            const targetAnchor = codeCell.querySelector("span") || codeCell;
            targetAnchor.appendChild(pl);
          }
          const percent = ((currentPrice - basePrice) / basePrice) * 100;
          let text = ` (${percent.toFixed(2)}%)`;
          if (todayCode && code === todayCode) {
            text += " hôm nay";
          }
          pl.textContent = text;
          const dropLevels = DROP_LEVELS[code] || [-10, -15, -20, -25, -30, -35, -40, -45, -50];
          const diff = currentPrice - basePrice;
          const statusText = diff >= 0 ? "Lãi" : "Lỗ";
          const lowerLevel = getLowerLevel(percent, dropLevels);
          const upperLevel = getUpperLevel(percent, dropLevels);
          const lowerText = lowerLevel !== null ? `${lowerLevel}%` : "Không có";
          const upperText = upperLevel !== null ? `${upperLevel}%` : "Không có";
          pl.title = `Giá vốn: ${basePrice}
Giá hiện tại: ${currentPrice}
${statusText}: ${diff.toFixed(2)} (${percent.toFixed(2)}%)
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
        return;
      }
    }
    const pineTable = document.querySelector("table.table.table-bordered");
    if (pineTable) {
      const headRow = pineTable.querySelectorAll("thead tr")[0];
      const ths = headRow ? Array.from(headRow.querySelectorAll("th")) : [];
      const headerTexts = ths.map(th => (th.textContent || "").trim());
      let codeIdx = headerTexts.findIndex(t => t.includes("Mã CK"));
      if (codeIdx < 0) codeIdx = 0;
      let giaTTIdx = headerTexts.findIndex(t => t.includes("Giá TT"));
      if (giaTTIdx < 0) giaTTIdx = 10;
      const bodyRows = pineTable.querySelectorAll("tbody tr");
      bodyRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        if (cells.length === 0) return;
        const codeCell = cells[codeIdx];
        const priceCell = cells[giaTTIdx];
        if (!codeCell || !priceCell) return;
        const code = (codeCell.textContent || "").trim();
        const currentPrice = parseNumberFlexible(priceCell.textContent || "");
        const basePrice = currentStocks[code];
        if (!basePrice || !currentPrice) return;
        let pl = row.querySelector(".pl-indicator") as HTMLSpanElement;
        if (!pl) {
          pl = document.createElement("span");
          pl.className = "pl-indicator";
          pl.style.marginLeft = "6px";
          pl.style.fontWeight = "600";
          const targetAnchor = codeCell.querySelector("span") || codeCell;
          targetAnchor.appendChild(pl);
        }
        const percent = ((currentPrice - basePrice) / basePrice) * 100;
        let text = ` (${percent.toFixed(2)}%)`;
        if (todayCode && code === todayCode) {
          text += " hôm nay";
        }
        pl.textContent = text;
        const dropLevels = DROP_LEVELS[code] || [-10, -15, -20, -25, -30, -35, -40, -45, -50];
        const diff = currentPrice - basePrice;
        const statusText = diff >= 0 ? "Lãi" : "Lỗ";
        const lowerLevel = getLowerLevel(percent, dropLevels);
        const upperLevel = getUpperLevel(percent, dropLevels);
        const lowerText = lowerLevel !== null ? `${lowerLevel}%` : "Không có";
        const upperText = upperLevel !== null ? `${upperLevel}%` : "Không có";
        pl.title = `Giá vốn: ${basePrice}
Giá hiện tại: ${currentPrice}
${statusText}: ${diff.toFixed(2)} (${percent.toFixed(2)}%)
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
      return;
    }
    const rows = document.querySelectorAll("div.list-row");

    rows.forEach((row) => {
      const codeEl = row.querySelector<HTMLAnchorElement>(
        'a[href^="/charts/content/symbols/"]'
      );
      
      // Try multiple selectors for price to be more robust
      let priceEl = row.querySelector<HTMLSpanElement>(
        "div.sc-jnQalv span"
      );
      
      // Fallback: Structural selector (2nd column, 1st div, span)
      if (!priceEl) {
        if (row.children.length >= 2) {
          const priceContainer = row.children[1];
          if (priceContainer && priceContainer.children.length > 0) {
             const priceDiv = priceContainer.children[0];
             priceEl = priceDiv.querySelector('span');
          }
        }
      }

      // Fallback: Try to find price by looking for numeric content in cells
      if (!priceEl) {
         // This is a heuristic: look for a span that contains a number and is not the code itself
         const spans = row.querySelectorAll("span");
         for (let i = 0; i < spans.length; i++) {
            const text = spans[i].textContent?.trim();
            // Simple check: is it a valid number?
            if (text && !isNaN(Number(text.replace(/,/g, "")))) {
                // Skip if it's volume (usually integer and large) or percentage (has %)
                // But current price is just a number. 
                // Let's assume price is the first valid number found after code?
                // Or maybe specific position? usually price is early.
                // Let's rely on text content not being empty and being a valid float number
                // Also FireAnt price usually has 2 decimal places or 1, but sometimes 0 for integers.
                priceEl = spans[i];
                break; 
            }
         }
      }

      if (!codeEl || !priceEl) {
        // console.log("Missing code or price element", { codeEl, priceEl });
        return;
      }

      const code = codeEl.textContent?.trim() || "";
      const basePrice = currentStocks[code];
      
      // console.log("Checking stock:", code, "Base price:", basePrice);
      
      if (!basePrice) return;

      const currentPrice = parsePrice(priceEl.textContent || "");
      if (!currentPrice) return;

      // If indicator exists, update it instead of returning
      let pl = codeEl.querySelector(".pl-indicator") as HTMLSpanElement;
      
      if (!pl) {
        pl = document.createElement("span");
        pl.className = "pl-indicator";
        pl.style.marginLeft = "6px";
        pl.style.fontWeight = "600";
        codeEl.appendChild(pl);
      }

      const percent = ((currentPrice - basePrice) / basePrice) * 100;

      let text = ` (${percent.toFixed(2)}%)`;
      if (todayCode && code === todayCode) {
        text += " hôm nay";
      }
      pl.textContent = text;

      const dropLevels = DROP_LEVELS[code] || [-10, -15, -20, -25, -30, -35, -40, -45, -50];

      // === TOOLTIP ===
      const diff = currentPrice - basePrice;
      const statusText = diff >= 0 ? "Lãi" : "Lỗ";
      const lowerLevel = getLowerLevel(percent, dropLevels);
      const upperLevel = getUpperLevel(percent, dropLevels);
      const lowerText = lowerLevel !== null ? `${lowerLevel}%` : "Không có";
      const upperText = upperLevel !== null ? `${upperLevel}%` : "Không có";
      
      pl.title = `Giá vốn: ${basePrice}
Giá hiện tại: ${currentPrice}
${statusText}: ${diff.toFixed(2)} (${percent.toFixed(2)}%)
Mốc dưới gần: ${lowerText}
Mốc trên gần: ${upperText}`;

      // === LOGIC MÀU & HIGHLIGHT ===
      // Tìm container dòng (dòng ảo trong danh sách) để highlight đẹp hơn
      const virtualRow = row.closest('[class*="list-striped-row"]') as HTMLElement;
      const targetRow = virtualRow || (row as HTMLElement);
      
      if (isNearDropLevel(percent, dropLevels)) {
        pl.style.color = "#ff00ddff"; // MÀU TÍM
        
        // Highlight cả dòng
        targetRow.style.borderLeft = "4px solid #ff00ddff";
        targetRow.style.backgroundColor = "rgba(255, 0, 221, 0.1)"; // Tím nhạt
      } else {
        pl.style.color = percent < 0 ? "rgb(238,84,66)" : "rgb(0,170,0)";
        
        // Reset style
        targetRow.style.borderLeft = "";
        targetRow.style.backgroundColor = "";
      }
    });
  } catch (e) {
    console.error("Stock Extension Error:", e);
  }
}

function initStocksContent() {
  if (!chrome?.storage?.local) {
    injectPL();
    return;
  }
  chrome.storage.local.get(["extensionEnabled"], (res) => {
    const enabled = res.extensionEnabled !== false; // default: enabled
    if (enabled) {
      injectPL();
    }
  });
  if (chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes.extensionEnabled) return;
      const enabled = changes.extensionEnabled.newValue !== false;
      document.querySelectorAll(".pl-indicator").forEach((el) => el.remove());
      document.querySelectorAll("div.list-row").forEach((row) => {
        const rowEl = row as HTMLElement;
        rowEl.style.borderLeft = "";
        rowEl.style.backgroundColor = "";
      });
      if (enabled) {
        injectPL();
      }
    });
  }
}
initStocksContent();

const bootStart = Date.now();
const bootId = window.setInterval(() => {
  const hasRowsFireAnt = document.querySelector("div.list-row");
  const hasRowsPine = document.querySelector("table.table.table-bordered tbody tr");
  injectPL();
  if (hasRowsFireAnt || hasRowsPine || Date.now() - bootStart > 15000) {
    clearInterval(bootId);
  }
}, 500);

setInterval(() => {
  document.querySelectorAll(".pl-indicator").forEach(el => el.remove());
  injectPL();
}, 600000);

