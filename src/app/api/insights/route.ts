import { NextResponse } from "next/server";
import OpenAI from "openai";

type Expense = {
  category: string;
  amount: number;
  date: string;
  note: string;
};

function buildFallbackInsight(expenses: Expense[]): string {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = expenses.reduce(
    (accumulator, expense) => {
      accumulator[expense.category] =
        (accumulator[expense.category] ?? 0) + expense.amount;
      return accumulator;
    },
    {} as Record<string, number>,
  );

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  );
  const topCategories = sortedCategories.slice(0, 2);
  const topLine =
    topCategories.length > 0
      ? topCategories
          .map(
            ([name, amount]) =>
              `${name} (${((amount / total) * 100).toFixed(1)}% of total)`,
          )
          .join(", ")
      : "No categories with spending yet";

  return `Estimated monthly spend is $${total.toFixed(
    2,
  )}. Your strongest spending drivers are ${topLine}. Consider setting a weekly cap for your top category and reducing it by 10% next month.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { expenses?: Expense[] };
    const expenses = body.expenses ?? [];

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one expense." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insight: buildFallbackInsight(expenses) });
    }

    const client = new OpenAI({ apiKey });

    const prompt = `You are a personal finance advisor. Review this expense list and provide:
1) 3 concise insights,
2) 2 practical cost-saving actions for next month,
3) 1 risk warning if spending concentration is high.

Expenses JSON:
${JSON.stringify(expenses)}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const insight = response.output_text?.trim();
    if (!insight) {
      return NextResponse.json({ insight: buildFallbackInsight(expenses) });
    }

    return NextResponse.json({ insight });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while creating insights.",
      },
      { status: 500 },
    );
  }
}
