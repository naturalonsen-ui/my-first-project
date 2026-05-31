const STORAGE_KEY = "householdBudgetRecords";

const fields = [
  { id: "rent", label: "家賃", hint: "毎月の家賃を入力" },
  { id: "rentSubsidy", label: "家賃補助", hint: "会社などからの補助額を入力" },
  { id: "actualRent", label: "実質家賃", hint: "家賃 − 家賃補助で自動計算", calculated: true },
  { id: "gas", label: "ガス", hint: "ガス料金を入力" },
  { id: "waterSupply", label: "上水道", hint: "上水道料金を入力" },
  { id: "sewerage", label: "下水道", hint: "下水道料金を入力" },
  { id: "electricity", label: "電気", hint: "電気料金を入力" },
  { id: "creditCard", label: "クレジットカード", hint: "カード利用額を入力" },
];

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const fieldGrid = document.querySelector("#fieldGrid");
const targetMonth = document.querySelector("#targetMonth");
const actualRentTotal = document.querySelector("#actualRentTotal");
const grandTotal = document.querySelector("#grandTotal");
const resetButton = document.querySelector("#resetButton");
const saveRecordButton = document.querySelector("#saveRecordButton");
const saveStatus = document.querySelector("#saveStatus");
const historyTableBody = document.querySelector("#historyTableBody");
const emptyHistory = document.querySelector("#emptyHistory");
const savedGrandTotal = document.querySelector("#savedGrandTotal");
const inputs = new Map();

const toNumber = (value) => {
  const normalizedValue = Number.parseInt(String(value).replace(/,/g, ""), 10);
  return Number.isNaN(normalizedValue) ? 0 : normalizedValue;
};

const formatCurrency = (value) => currencyFormatter.format(value);

const formatMonth = (monthValue) => {
  if (!monthValue) {
    return "未選択";
  }

  const [year, month] = monthValue.split("-");
  return `${year}年${Number(month)}月`;
};

const getCurrentMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

const createInputGroup = ({ id, label, hint, calculated = false }) => {
  const group = document.createElement("div");
  group.className = `input-group${calculated ? " calculated" : ""}`;

  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;
  labelElement.textContent = label;

  const wrapper = document.createElement("div");
  wrapper.className = "input-wrapper";

  const prefix = document.createElement("span");
  prefix.textContent = "¥";

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.placeholder = "0";
  input.inputMode = "numeric";
  input.readOnly = calculated;
  input.setAttribute("aria-label", `${label}の金額`);

  const hintElement = document.createElement("small");
  hintElement.className = "input-hint";
  hintElement.textContent = hint;

  wrapper.append(prefix, input);
  group.append(labelElement, wrapper, hintElement);
  inputs.set(id, input);

  return group;
};

const getEntryValues = () => {
  const rent = toNumber(inputs.get("rent").value);
  const rentSubsidy = toNumber(inputs.get("rentSubsidy").value);
  const actualRent = Math.max(rent - rentSubsidy, 0);
  const values = {
    rent,
    rentSubsidy,
    actualRent,
    gas: toNumber(inputs.get("gas").value),
    waterSupply: toNumber(inputs.get("waterSupply").value),
    sewerage: toNumber(inputs.get("sewerage").value),
    electricity: toNumber(inputs.get("electricity").value),
    creditCard: toNumber(inputs.get("creditCard").value),
  };

  return {
    ...values,
    total:
      values.actualRent +
      values.gas +
      values.waterSupply +
      values.sewerage +
      values.electricity +
      values.creditCard,
  };
};

const calculateTotals = () => {
  const values = getEntryValues();

  inputs.get("actualRent").value = values.actualRent || "";
  actualRentTotal.textContent = formatCurrency(values.actualRent);
  grandTotal.textContent = formatCurrency(values.total);

  return values;
};

const loadRecords = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const saveRecords = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const setStatus = (message) => {
  saveStatus.textContent = message;
};

const clearInputs = () => {
  inputs.forEach((input) => {
    input.value = "";
  });
  calculateTotals();
};

const resetForm = () => {
  clearInputs();
  targetMonth.value = getCurrentMonth();
  setStatus("入力欄をリセットしました。");
  inputs.get("rent").focus();
};

const buildRecord = () => ({
  month: targetMonth.value,
  ...calculateTotals(),
  savedAt: new Date().toISOString(),
});

const renderHistory = () => {
  const records = loadRecords().sort((current, next) => next.month.localeCompare(current.month));
  const accumulatedTotal = records.reduce((sum, record) => sum + record.total, 0);

  historyTableBody.replaceChildren();
  emptyHistory.hidden = records.length > 0;
  savedGrandTotal.textContent = formatCurrency(accumulatedTotal);

  records.forEach((record) => {
    const row = document.createElement("tr");

    const monthCell = document.createElement("td");
    monthCell.textContent = formatMonth(record.month);

    const amountCells = [
      "rent",
      "rentSubsidy",
      "actualRent",
      "gas",
      "waterSupply",
      "sewerage",
      "electricity",
      "creditCard",
      "total",
    ].map((key) => {
      const cell = document.createElement("td");
      cell.textContent = formatCurrency(record[key]);
      return cell;
    });

    const actionCell = document.createElement("td");
    const loadButton = document.createElement("button");
    loadButton.className = "table-button";
    loadButton.type = "button";
    loadButton.dataset.action = "load";
    loadButton.dataset.month = record.month;
    loadButton.textContent = "読込";

    const deleteButton = document.createElement("button");
    deleteButton.className = "table-button danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.month = record.month;
    deleteButton.textContent = "削除";

    actionCell.append(loadButton, deleteButton);
    row.append(monthCell, ...amountCells, actionCell);
    historyTableBody.append(row);
  });
};

const saveCurrentRecord = () => {
  if (!targetMonth.value) {
    setStatus("対象月を選択してください。");
    targetMonth.focus();
    return;
  }

  const record = buildRecord();
  const records = loadRecords().filter((savedRecord) => savedRecord.month !== record.month);

  records.push(record);
  saveRecords(records);
  renderHistory();
  setStatus(`${formatMonth(record.month)}の記録を保存しました。`);
};

const loadRecordToForm = (month) => {
  const record = loadRecords().find((savedRecord) => savedRecord.month === month);

  if (!record) {
    setStatus("指定した記録が見つかりませんでした。");
    return;
  }

  targetMonth.value = record.month;
  fields.forEach(({ id }) => {
    inputs.get(id).value = record[id] || "";
  });
  calculateTotals();
  setStatus(`${formatMonth(record.month)}の記録を読み込みました。`);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const deleteRecord = (month) => {
  const records = loadRecords().filter((record) => record.month !== month);

  saveRecords(records);
  renderHistory();
  setStatus(`${formatMonth(month)}の記録を削除しました。`);
};

fields.forEach((field) => {
  fieldGrid.append(createInputGroup(field));
});

targetMonth.value = getCurrentMonth();

inputs.forEach((input) => {
  if (!input.readOnly) {
    input.addEventListener("input", calculateTotals);
  }
});

resetButton.addEventListener("click", resetForm);
saveRecordButton.addEventListener("click", saveCurrentRecord);
historyTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  if (button.dataset.action === "load") {
    loadRecordToForm(button.dataset.month);
  }

  if (button.dataset.action === "delete") {
    deleteRecord(button.dataset.month);
  }
});

calculateTotals();
renderHistory();
