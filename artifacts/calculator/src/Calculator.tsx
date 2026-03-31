import { useState, useCallback, useEffect } from "react";

type BtnVariant = "digit" | "operator" | "function" | "equals" | "delete";

interface ButtonDef {
  label: string;
  value: string;
  variant: BtnVariant;
  wide?: boolean;
}

const BUTTONS: ButtonDef[][] = [
  [
    { label: "⌫", value: "backspace", variant: "delete" },
    { label: "AC", value: "clear", variant: "function" },
    { label: "%", value: "%", variant: "function" },
    { label: "÷", value: "/", variant: "operator" },
  ],
  [
    { label: "7", value: "7", variant: "digit" },
    { label: "8", value: "8", variant: "digit" },
    { label: "9", value: "9", variant: "digit" },
    { label: "×", value: "*", variant: "operator" },
  ],
  [
    { label: "4", value: "4", variant: "digit" },
    { label: "5", value: "5", variant: "digit" },
    { label: "6", value: "6", variant: "digit" },
    { label: "−", value: "-", variant: "operator" },
  ],
  [
    { label: "1", value: "1", variant: "digit" },
    { label: "2", value: "2", variant: "digit" },
    { label: "3", value: "3", variant: "digit" },
    { label: "+", value: "+", variant: "operator" },
  ],
  [
    { label: "+/−", value: "negate", variant: "function" },
    { label: "0", value: "0", variant: "digit" },
    { label: ".", value: ".", variant: "digit" },
    { label: "=", value: "=", variant: "equals" },
  ],
];

function formatNumber(num: number): string {
  if (!isFinite(num)) return "Error";
  const absNum = Math.abs(num);
  if (absNum === 0) return "0";

  if (absNum >= 1e15 || (absNum < 1e-6 && absNum > 0)) {
    return num.toExponential(6).replace(/\.?0+e/, "e");
  }

  let str = num.toPrecision(10);
  str = parseFloat(str).toString();

  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function formatExpression(expression: string): string {
  return expression
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/-/g, "−");
}

function calculateResult(a: number, op: string, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

export default function Calculator() {
  const [displayValue, setDisplayValue] = useState("0");
  const [expression, setExpression] = useState("");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaled, setJustEvaled] = useState(false);

  const handleClear = useCallback(() => {
    setDisplayValue("0");
    setExpression("");
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaled(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (waitingForOperand || justEvaled) return;
    if (displayValue.length === 1 || (displayValue.length === 2 && displayValue[0] === "-")) {
      setDisplayValue("0");
    } else {
      setDisplayValue(displayValue.slice(0, -1));
    }
  }, [displayValue, waitingForOperand, justEvaled]);

  const handleDigit = useCallback((digit: string) => {
    if (justEvaled) {
      setDisplayValue(digit);
      setExpression("");
      setStoredValue(null);
      setOperator(null);
      setJustEvaled(false);
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplayValue(digit === "." ? "0." : digit);
      setWaitingForOperand(false);
      return;
    }

    if (digit === "." && displayValue.includes(".")) return;

    const newValue = displayValue === "0" && digit !== "."
      ? digit
      : displayValue + digit;

    if (newValue.replace(/[^0-9]/g, "").length > 15) return;
    setDisplayValue(newValue);
  }, [displayValue, waitingForOperand, justEvaled]);

  const handleOperator = useCallback((op: string) => {
    const current = parseFloat(displayValue);

    let newStoredValue = current;

    if (storedValue !== null && operator && !waitingForOperand) {
      const result = calculateResult(storedValue, operator, current);
      const formatted = formatNumber(result);
      setDisplayValue(formatted);
      newStoredValue = result;
    }

    setStoredValue(newStoredValue);
    setOperator(op);
    setWaitingForOperand(true);
    setJustEvaled(false);
    setExpression(`${formatNumber(newStoredValue)} ${formatExpression(op)}`);
  }, [displayValue, storedValue, operator, waitingForOperand]);

  const handleEquals = useCallback(() => {
    if (operator === null || storedValue === null) return;

    const current = parseFloat(displayValue);
    const result = calculateResult(storedValue, operator, current);
    const exprStr = `${formatNumber(storedValue)} ${formatExpression(operator)} ${formatNumber(current)}`;
    setExpression(exprStr);
    setDisplayValue(formatNumber(result));
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaled(true);
  }, [displayValue, storedValue, operator]);

  const handlePercent = useCallback(() => {
    const current = parseFloat(displayValue);
    if (storedValue !== null && operator) {
      const percentVal = (storedValue * current) / 100;
      setDisplayValue(formatNumber(percentVal));
    } else {
      setDisplayValue(formatNumber(current / 100));
    }
  }, [displayValue, storedValue, operator]);

  const handleNegate = useCallback(() => {
    const current = parseFloat(displayValue);
    setDisplayValue(formatNumber(-current));
  }, [displayValue]);

  const handleButton = useCallback((value: string) => {
    switch (value) {
      case "clear": handleClear(); break;
      case "backspace": handleBackspace(); break;
      case "negate": handleNegate(); break;
      case "%": handlePercent(); break;
      case "=": handleEquals(); break;
      case "+":
      case "-":
      case "*":
      case "/":
        handleOperator(value);
        break;
      default:
        handleDigit(value);
    }
  }, [handleClear, handleBackspace, handleNegate, handlePercent, handleEquals, handleOperator, handleDigit]);

  useEffect(() => {
    const keyMap: Record<string, string> = {
      "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
      "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
      ".": ".", "+": "+", "-": "-", "*": "*", "/": "/",
      "Enter": "=", "=": "=",
      "Backspace": "backspace",
      "Escape": "clear",
      "%": "%",
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mapped = keyMap[e.key];
      if (mapped) {
        e.preventDefault();
        handleButton(mapped);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleButton]);

  const displayLength = displayValue.replace(/[^0-9]/g, "").length;
  const fontSize = displayLength > 10 ? "2rem" : displayLength > 7 ? "2.8rem" : "3.5rem";

  return (
    <div
      style={{
        width: 320,
        background: "#1c1c1e",
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08) inset",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 18px 8px",
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
      </div>

      {/* Display area */}
      <div
        style={{
          padding: "4px 20px 16px",
          textAlign: "right",
          minHeight: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Expression line */}
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.95rem",
            fontWeight: 300,
            minHeight: "1.4em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
            marginBottom: 2,
          }}
        >
          {expression}
        </div>

        {/* Main number */}
        <div
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize,
            fontWeight: 300,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "font-size 150ms ease",
          }}
        >
          {displayValue}
        </div>
      </div>

      {/* Button grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          padding: "0 14px 16px",
        }}
      >
        {BUTTONS.flat().map((btn, i) => (
          <CalcButton key={i} btn={btn} onPress={handleButton} />
        ))}
      </div>
    </div>
  );
}

function CalcButton({ btn, onPress }: { btn: ButtonDef; onPress: (v: string) => void }) {
  const [pressed, setPressed] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontSize: btn.label === "⌫" ? "1.2rem" : "1.45rem",
    fontWeight: btn.variant === "operator" || btn.variant === "equals" ? 400 : 400,
    letterSpacing: "-0.01em",
    fontFamily: "inherit",
    outline: "none",
    transition: "background 60ms ease, transform 60ms ease",
    transform: pressed ? "scale(0.93)" : "scale(1)",
    WebkitFontSmoothing: "antialiased",
    userSelect: "none",
  };

  const variantStyles: Record<BtnVariant, React.CSSProperties> = {
    digit: {
      background: pressed ? "#5a5a5e" : "#3a3a3c",
      color: "#ffffff",
    },
    function: {
      background: pressed ? "#888" : "#636366",
      color: "#ffffff",
    },
    operator: {
      background: pressed ? "#e88c00" : "#ff9f0a",
      color: "#ffffff",
    },
    equals: {
      background: pressed ? "#e88c00" : "#ff9f0a",
      color: "#ffffff",
    },
    delete: {
      background: pressed ? "#888" : "#636366",
      color: "#ffffff",
      fontSize: "1.1rem",
    },
  };

  return (
    <button
      className="calc-btn"
      style={{ ...baseStyle, ...variantStyles[btn.variant] }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        onPress(btn.value);
      }}
      onPointerLeave={() => setPressed(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {btn.label}
    </button>
  );
}
