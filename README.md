# Smart Personal Finance Dashboard

A dynamic Next.js web app that tracks expenses, renders visual spending analytics with Chart.js, and generates AI budget insights.  
UI elements use Lucide icons and the app is ready to deploy to Vercel.

## Features

- Add and remove expenses by category, amount, date, and note
- Local persistence in browser storage
- Category breakdown (pie chart) and monthly trend (line chart)
- AI insights endpoint:
  - Uses OpenAI when `OPENAI_API_KEY` is configured
  - Falls back to rule-based insights when no key is present

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional AI Configuration

Create a `.env.local` file:

```bash
OPENAI_API_KEY=your_api_key_here
```

If this key is not set, the app still works and returns deterministic fallback insights.

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add `OPENAI_API_KEY` in Vercel Project Settings (optional for live AI).
4. Deploy.

## Tech Stack

- [Next.js](https://nextjs.org)
- [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- [OpenAI Node SDK](https://github.com/openai/openai-node)
