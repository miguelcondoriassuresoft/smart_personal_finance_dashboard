"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  PlusCircle,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import styles from "./page.module.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
};

const STORAGE_KEY = "smart-finance-expenses";

const CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Other",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [insight, setInsight] = useState("");
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      const rawExpenses = localStorage.getItem(STORAGE_KEY);
      if (!rawExpenses) {
        return;
      }
      const parsedExpenses = JSON.parse(rawExpenses) as Expense[];
      setExpenses(parsedExpenses);
    } catch {
      setErrorMessage("Could not load saved expenses from browser storage.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const categoryTotals = useMemo(() => {
    return expenses.reduce(
      (accumulator, expense) => {
        accumulator[expense.category] =
          (accumulator[expense.category] ?? 0) + expense.amount;
        return accumulator;
      },
      {} as Record<string, number>,
    );
  }, [expenses]);

  const topCategory = useMemo(() => {
    const categories = Object.entries(categoryTotals);
    if (categories.length === 0) {
      return "No data yet";
    }
    const [name] = categories.toSorted((a, b) => b[1] - a[1])[0];
    return name;
  }, [categoryTotals]);

  const monthlySpend = useMemo(() => {
    const monthlyBuckets = expenses.reduce(
      (accumulator, expense) => {
        const month = expense.date.slice(0, 7);
        accumulator[month] = (accumulator[month] ?? 0) + expense.amount;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    return Object.entries(monthlyBuckets).sort(([monthA], [monthB]) =>
      monthA.localeCompare(monthB),
    );
  }, [expenses]);

  const pieData = useMemo(
    () => ({
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: "Spending by category",
          data: Object.values(categoryTotals),
          backgroundColor: [
            "#4f46e5",
            "#0ea5e9",
            "#f59e0b",
            "#ef4444",
            "#10b981",
            "#8b5cf6",
            "#64748b",
          ],
          borderWidth: 1,
        },
      ],
    }),
    [categoryTotals],
  );

  const lineData = useMemo(
    () => ({
      labels: monthlySpend.map(([month]) => month),
      datasets: [
        {
          label: "Monthly spending",
          data: monthlySpend.map(([, value]) => value),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [monthlySpend],
  );

  const averagePerMonth = useMemo(() => {
    if (monthlySpend.length === 0) {
      return 0;
    }
    const total = monthlySpend.reduce((sum, [, value]) => sum + value, 0);
    return total / monthlySpend.length;
  }, [monthlySpend]);

  const addExpense = () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }
    if (!date) {
      setErrorMessage("Please choose a valid expense date.");
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      category,
      amount: parsedAmount,
      date,
      note: note.trim(),
    };

    setExpenses((current) =>
      [...current, expense].sort((a, b) => b.date.localeCompare(a.date)),
    );
    setAmount("");
    setNote("");
    setErrorMessage("");
  };

  const deleteExpense = (id: string) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  };

  const requestInsights = async () => {
    if (expenses.length === 0) {
      setInsight("Add at least one expense to generate actionable AI insights.");
      return;
    }

    setIsLoadingInsight(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expenses }),
      });
      const data = (await response.json()) as { insight?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate insights.");
      }
      setInsight(data.insight ?? "No insights returned.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not generate insights.",
      );
    } finally {
      setIsLoadingInsight(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1>Smart Personal Finance Dashboard</h1>
          <p>
            Track daily expenses, visualize your spending trends, and ask AI for
            strategic budget guidance.
          </p>
        </header>

        <section className={styles.stats}>
          <article>
            <Wallet size={18} />
            <div>
              <span>Total Expenses</span>
              <strong>{formatCurrency(totalExpense)}</strong>
            </div>
          </article>
          <article>
            <PieChartIcon size={18} />
            <div>
              <span>Top Category</span>
              <strong>{topCategory}</strong>
            </div>
          </article>
          <article>
            <Calendar size={18} />
            <div>
              <span>Monthly Average</span>
              <strong>{formatCurrency(averagePerMonth)}</strong>
            </div>
          </article>
        </section>

        <section className={styles.layout}>
          <aside className={styles.formCard}>
            <h2>
              <PlusCircle size={18} />
              Add Expense
            </h2>
            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Amount (USD)</span>
              <div className={styles.inputWithIcon}>
                <DollarSign size={16} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label>
              <span>Note (optional)</span>
              <input
                type="text"
                placeholder="e.g., Groceries and household"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <button type="button" onClick={addExpense}>
              Add Expense
            </button>
            {errorMessage && (
              <p className={styles.error}>
                <AlertCircle size={16} />
                {errorMessage}
              </p>
            )}
          </aside>

          <section className={styles.chartCard}>
            <h2>Visual Insights</h2>
            <div className={styles.charts}>
              <div>
                <h3>Category Breakdown</h3>
                {Object.keys(categoryTotals).length > 0 ? (
                  <Pie data={pieData} />
                ) : (
                  <p className={styles.placeholder}>No data available yet.</p>
                )}
              </div>
              <div>
                <h3>Monthly Spending Trend</h3>
                {monthlySpend.length > 0 ? (
                  <Line data={lineData} />
                ) : (
                  <p className={styles.placeholder}>No data available yet.</p>
                )}
              </div>
            </div>
          </section>
        </section>

        <section className={styles.aiCard}>
          <h2>
            <Bot size={18} />
            AI Budget Insights
          </h2>
          <button type="button" onClick={requestInsights} disabled={isLoadingInsight}>
            {isLoadingInsight ? "Analyzing..." : "Generate AI Insights"}
          </button>
          {insight && <p>{insight}</p>}
        </section>

        <section className={styles.tableCard}>
          <h2>Recent Expenses</h2>
          {expenses.length === 0 ? (
            <p className={styles.placeholder}>Start by adding your first expense.</p>
          ) : (
            <ul>
              {expenses.map((expense) => (
                <li key={expense.id}>
                  <div>
                    <strong>{expense.category}</strong>
                    <span>{expense.note || "No note added"}</span>
                    <small>{expense.date}</small>
                  </div>
                  <div className={styles.rowActions}>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <button
                      type="button"
                      aria-label="Delete expense"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
