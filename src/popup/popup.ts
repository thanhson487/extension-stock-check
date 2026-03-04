import { STOCKS as DEFAULT_STOCKS } from "../config/stocks";

// Define interface for Stocks
type StockMap = Record<string, number>;

const stockCodeInput = document.getElementById("stockCode") as HTMLInputElement;
const stockPriceInput = document.getElementById("stockPrice") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const stockListEl = document.getElementById("stockList") as HTMLUListElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;

let currentStocks: StockMap = {};

// Load stocks
chrome.storage.local.get(["stocks"], (result) => {
  if (result.stocks && Object.keys(result.stocks).length > 0) {
    currentStocks = result.stocks as StockMap;
  } else {
    currentStocks = { ...DEFAULT_STOCKS };
  }
  renderList();
});

function renderList() {
  stockListEl.innerHTML = "";
  // Sort by code for better visibility
  const sortedEntries = Object.entries(currentStocks).sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedEntries.forEach(([code, price]) => {
    const li = document.createElement("li");
    
    const codeSpan = document.createElement("span");
    codeSpan.className = "stock-code";
    codeSpan.textContent = code;
    codeSpan.style.cursor = "pointer";
    codeSpan.title = "Click để sửa";
    
    const priceSpan = document.createElement("span");
    priceSpan.className = "stock-price";
    priceSpan.textContent = price.toString();
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Xoá";
    deleteBtn.onclick = () => {
      delete currentStocks[code];
      renderList();
    };
    
    // Click code to edit
    codeSpan.onclick = () => {
      stockCodeInput.value = code;
      stockPriceInput.value = price.toString();
      stockCodeInput.focus();
    };
    
    li.appendChild(codeSpan);
    li.appendChild(priceSpan);
    li.appendChild(deleteBtn);
    stockListEl.appendChild(li);
  });
}

addBtn.addEventListener("click", () => {
  const code = stockCodeInput.value.trim().toUpperCase();
  const price = parseFloat(stockPriceInput.value);
  
  if (!code || isNaN(price)) {
    alert("Vui lòng nhập Mã và Giá hợp lệ!");
    return;
  }
  
  currentStocks[code] = price;
  renderList();
  
  // Clear inputs
  stockCodeInput.value = "";
  stockPriceInput.value = "";
});

saveBtn.addEventListener("click", () => {
  chrome.storage.local.set({ stocks: currentStocks }, () => {
    // Visual feedback
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Đã lưu!";
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 1000);
  });
});
