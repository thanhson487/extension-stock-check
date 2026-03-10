import { DROP_LEVELS } from "../config/dropLevels";
import { FUND_DROP_LEVELS } from "../config/fundDropLevels";
import { DROP_LEVELS_DONE as DEFAULT_DROP_DONE } from "../config/dropLevelsDone";
import { FUND_DROP_DONE as DEFAULT_FUND_DONE } from "../config/fundDropDone";

// Define interface for Stocks
// type StockMap = Record<string, number>;

const dropStockAll = document.getElementById("dropStockAll") as HTMLDivElement | null;
const dropStockSave = document.getElementById("dropStockSave") as HTMLButtonElement | null;
const dropStockExport = document.getElementById("dropStockExport") as HTMLButtonElement | null;
const dropStockImport = document.getElementById("dropStockImport") as HTMLInputElement | null;
const dropFundAll = document.getElementById("dropFundAll") as HTMLDivElement | null;
const dropFundSave = document.getElementById("dropFundSave") as HTMLButtonElement | null;
const dropFundExport = document.getElementById("dropFundExport") as HTMLButtonElement | null;
const dropFundImport = document.getElementById("dropFundImport") as HTMLInputElement | null;

let dropDone: Record<string, Record<string, boolean>> = {};
let fundDone: Record<string, Record<string, boolean>> = {};

chrome.storage.local.get(["dropLevelsDone", "fundDropDone"], (res) => {
  if (!res.dropLevelsDone) {
    dropDone = JSON.parse(JSON.stringify(DEFAULT_DROP_DONE));
    chrome.storage.local.set({ dropLevelsDone: dropDone });
  } else {
    dropDone = res.dropLevelsDone as Record<string, Record<string, boolean>>;
  }
  if (!res.fundDropDone) {
    fundDone = JSON.parse(JSON.stringify(DEFAULT_FUND_DONE));
    chrome.storage.local.set({ fundDropDone: fundDone });
  } else {
    fundDone = res.fundDropDone as Record<string, Record<string, boolean>>;
  }
  initDropUI();
});

function initDropUI() {
  renderDropStockAll();
  renderDropFundAll();
  if (dropStockSave) {
    dropStockSave.onclick = () => {
      const codes = Object.keys(DROP_LEVELS);
      codes.forEach(code => {
        const levels = DROP_LEVELS[code] || [];
        const map: Record<string, boolean> = {};
        levels.forEach(l => {
          const id = `stock-level-${code}-${l}`;
          const el = document.getElementById(id) as HTMLInputElement | null;
          map[String(l)] = !!el?.checked;
        });
        dropDone[code] = map;
      });
      chrome.storage.local.set({ dropLevelsDone: dropDone });
    };
  }
  if (dropFundSave) {
    dropFundSave.onclick = () => {
      const codes = Object.keys(FUND_DROP_LEVELS);
      codes.forEach(code => {
        const levels = FUND_DROP_LEVELS[code] || [];
        const map: Record<string, boolean> = {};
        levels.forEach(l => {
          const id = `fund-level-${code}-${l}`;
          const el = document.getElementById(id) as HTMLInputElement | null;
          map[String(l)] = !!el?.checked;
        });
        fundDone[code] = map;
      });
      chrome.storage.local.set({ fundDropDone: fundDone });
    };
  }
  if (dropStockExport) {
    dropStockExport.onclick = () => {
      const blob = new Blob([JSON.stringify(dropDone, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dropLevelsDone.json";
      a.click();
      URL.revokeObjectURL(url);
    };
  }
  if (dropFundExport) {
    dropFundExport.onclick = () => {
      const blob = new Blob([JSON.stringify(fundDone, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fundDropDone.json";
      a.click();
      URL.revokeObjectURL(url);
    };
  }
  if (dropStockImport) {
    dropStockImport.onchange = () => {
      const file = dropStockImport.files && dropStockImport.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (data && typeof data === "object") {
            dropDone = data;
            chrome.storage.local.set({ dropLevelsDone: dropDone }, () => {
              renderDropStockAll();
            });
          }
        } catch {}
      };
      reader.readAsText(file);
      dropStockImport.value = "";
    };
  }
  if (dropFundImport) {
    dropFundImport.onchange = () => {
      const file = dropFundImport.files && dropFundImport.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (data && typeof data === "object") {
            fundDone = data;
            chrome.storage.local.set({ fundDropDone: fundDone }, () => {
              renderDropFundAll();
            });
          }
        } catch {}
      };
      reader.readAsText(file);
      dropFundImport.value = "";
    };
  }
}

function renderDropStockAll() {
  if (!dropStockAll) return;
  dropStockAll.innerHTML = "";
  const codes = Object.keys(DROP_LEVELS).sort((a, b) => a.localeCompare(b));
  codes.forEach(code => {
    const box = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = code;
    title.style.fontWeight = "600";
    title.style.marginTop = "8px";
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = "8px";
    const levels = DROP_LEVELS[code] || [];
    const map = dropDone[code] || {};
    levels.forEach(l => {
      const id = `stock-level-${code}-${l}`;
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      cb.checked = !!map[String(l)];
      const span = document.createElement("span");
      span.textContent = ` ${l}%`;
      label.appendChild(cb);
      label.appendChild(span);
      row.appendChild(label);
    });
    box.appendChild(title);
    box.appendChild(row);
    dropStockAll.appendChild(box);
  });
}

function renderDropFundAll() {
  if (!dropFundAll) return;
  dropFundAll.innerHTML = "";
  const codes = Object.keys(FUND_DROP_LEVELS).sort((a, b) => a.localeCompare(b));
  codes.forEach(code => {
    const box = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = code;
    title.style.fontWeight = "600";
    title.style.marginTop = "8px";
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = "8px";
    const levels = FUND_DROP_LEVELS[code] || [];
    const map = fundDone[code] || {};
    levels.forEach(l => {
      const id = `fund-level-${code}-${l}`;
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      cb.checked = !!map[String(l)];
      const span = document.createElement("span");
      span.textContent = ` ${l}%`;
      label.appendChild(cb);
      label.appendChild(span);
      row.appendChild(label);
    });
    box.appendChild(title);
    box.appendChild(row);
    dropFundAll.appendChild(box);
  });
}
