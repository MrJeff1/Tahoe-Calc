"use strict";

/* ── State ─────────────────────────────────────────── */

let display      = "0";   // what's shown in the big number
let expression   = "";    // top row expression string
let storedValue  = null;  // left-hand operand
let operator     = null;  // pending operator (+, -, *, /)
let waitingNext  = false; // true after pressing an operator
let justEvaled   = false; // true right after = was pressed

/* ── DOM refs ──────────────────────────────────────── */

const resultEl     = document.getElementById("result");
const expressionEl = document.getElementById("expression");

/* ── Helpers ───────────────────────────────────────── */

function formatNum(n) {
  if (!isFinite(n)) return "Error";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) {
    return n.toExponential(6).replace(/\.?0+e/, "e");
  }
  let s = parseFloat(n.toPrecision(10)).toString();
  const parts = s.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function fmtOp(op) {
  return { "/": "÷", "*": "×", "-": "−", "+": "+" }[op] ?? op;
}

function fmtExpr(s) {
  return s.replace(/\//g, "÷").replace(/\*/g, "×").replace(/-/g, "−");
}

function calc(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default:  return b;
  }
}

function setDisplay(val) {
  display = String(val);
  resultEl.textContent = display;

  // shrink font for long numbers
  const len = display.replace(/[^0-9]/g, "").length;
  resultEl.classList.remove("sm", "xs");
  if (len > 12) resultEl.classList.add("xs");
  else if (len > 9) resultEl.classList.add("sm");
}

function setExpression(val) {
  expression = val;
  expressionEl.textContent = val || "\u00A0";
}

/* ── Actions ───────────────────────────────────────── */

function doDigit(d) {
  if (justEvaled) {
    storedValue = null;
    operator    = null;
    setExpression("");
    justEvaled = false;
    waitingNext = false;
    setDisplay(d === "." ? "0." : d);
    return;
  }
  if (waitingNext) {
    setDisplay(d === "." ? "0." : d);
    waitingNext = false;
    return;
  }
  if (d === "." && display.includes(".")) return;
  const next = (display === "0" && d !== ".") ? d : display + d;
  if (next.replace(/[^0-9]/g, "").length > 15) return;
  setDisplay(next);
}

function doOperator(op) {
  const cur = parseFloat(display);
  let lhs = cur;

  if (storedValue !== null && operator && !waitingNext) {
    lhs = calc(storedValue, operator, cur);
    setDisplay(formatNum(lhs));
  }

  storedValue = lhs;
  operator    = op;
  waitingNext = true;
  justEvaled  = false;
  setExpression(formatNum(lhs) + " " + fmtOp(op));
}

function doEquals() {
  if (operator === null || storedValue === null) return;
  const cur  = parseFloat(display);
  const res  = calc(storedValue, operator, cur);
  setExpression(formatNum(storedValue) + " " + fmtOp(operator) + " " + formatNum(cur));
  setDisplay(formatNum(res));
  storedValue = null;
  operator    = null;
  waitingNext = false;
  justEvaled  = true;
}

function doClear() {
  setDisplay("0");
  setExpression("");
  storedValue = null;
  operator    = null;
  waitingNext = false;
  justEvaled  = false;
}

function doBackspace() {
  if (waitingNext || justEvaled) return;
  if (display.length === 1 || (display.length === 2 && display[0] === "-")) {
    setDisplay("0");
  } else {
    setDisplay(display.slice(0, -1));
  }
}

function doPercent() {
  const cur = parseFloat(display);
  if (storedValue !== null && operator) {
    setDisplay(formatNum((storedValue * cur) / 100));
  } else {
    setDisplay(formatNum(cur / 100));
  }
}

function doNegate() {
  setDisplay(formatNum(-parseFloat(display)));
}

/* ── Click handler ──────────────────────────────────── */

document.querySelector(".grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;

  const action = btn.dataset.action;
  switch (action) {
    case "digit":    doDigit(btn.dataset.val);   break;
    case "op":       doOperator(btn.dataset.op); break;
    case "equals":   doEquals();                 break;
    case "clear":    doClear();                  break;
    case "backspace":doBackspace();              break;
    case "percent":  doPercent();                break;
    case "negate":   doNegate();                 break;
  }
});

/* ── Keyboard handler ───────────────────────────────── */

const keyMap = {
  "0": () => doDigit("0"), "1": () => doDigit("1"), "2": () => doDigit("2"),
  "3": () => doDigit("3"), "4": () => doDigit("4"), "5": () => doDigit("5"),
  "6": () => doDigit("6"), "7": () => doDigit("7"), "8": () => doDigit("8"),
  "9": () => doDigit("9"), ".": () => doDigit("."),
  "+": () => doOperator("+"), "-": () => doOperator("-"),
  "*": () => doOperator("*"), "/": () => doOperator("/"),
  "Enter": doEquals, "=": doEquals,
  "Backspace": doBackspace,
  "Escape": doClear,
  "%": doPercent,
};

document.addEventListener("keydown", (e) => {
  const fn = keyMap[e.key];
  if (fn) { e.preventDefault(); fn(); }
});

/* ── Neutralino init ────────────────────────────────── */

if (typeof Neutralino !== "undefined") {
  Neutralino.init();
  Neutralino.events.on("windowClose", () => {
    Neutralino.app.exit();
  });
}
