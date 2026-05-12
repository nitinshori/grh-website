# AI Discovery Sweep

Weekly automated check of whether ChatGPT, Claude, Gemini, and Perplexity name **Get Real Health** when UK pharmacy buyers ask vendor-discovery questions.

## What it does

Sends a fixed set of buyer-language prompts to each AI engine, then for each (engine × prompt) records:
- Whether GRH was named, and where in the response (position in chars — earlier = stronger)
- Which competitors got named alongside
- Which facts about GRH the engine retrieved correctly (£100/month, 70 PGDs, CQC, etc.)
- What URLs the engine cited

Output goes to `scripts/ai-sweep-results/<YYYY-MM-DD>/`:
- `summary.md` — human-readable digest
- `raw-responses.json` — full responses archive
- `tracker.csv` (one level up) — appended history, one row per (date, engine, prompt). Open in Excel/Numbers for week-on-week trend.

## Setup (one-off, ~5 minutes)

1. Copy the env template:
   ```bash
   cp scripts/ai-discovery-sweep.env.example .env.sweep
   ```

2. Add API keys to `.env.sweep`. Keys you don't add are silently skipped — the script still runs with whatever you have.
   - **OpenAI** — https://platform.openai.com/api-keys (need credits on the account)
   - **Anthropic** — https://console.anthropic.com/settings/keys
   - **Google AI Studio** — https://aistudio.google.com/app/apikey (Gemini, free tier is plenty)
   - **Perplexity** — https://www.perplexity.ai/settings/api (paid; cheapest at ~$5/month)

3. Make sure `.env.sweep` is gitignored (it should be — the existing `.gitignore` covers `.env*`).

## Running

```bash
node scripts/ai-discovery-sweep.mjs
```

Takes ~30 seconds with all four engines enabled. Costs ~£0.20–0.30 per full sweep.

Suggested cadence: once a week, Monday morning. Diff this week's `summary.md` against last week's to see movement.

## Interpreting results

| Signal | What it means | What to do |
|---|---|---|
| **GRH named in 5/6 prompts in Perplexity, 0/6 in ChatGPT** | We're being retrieved by Brave/Perplexity index but not Bing/OpenAI | Push harder on Bing Webmaster Tools indexing, check for crawl errors |
| **Named, but with wrong facts (e.g. "60+ PGDs", "£2,500/year")** | Engine is retrieving stale or training-data answers | Add structured data + question-led copy that asserts the correct facts; wait 2 weeks for re-crawl |
| **Named in #5 ("recommend a PGD provider") but not in #1 (general)** | Specific-intent retrieval works, general doesn't | Need more general PGD-platform content + external citations |
| **Competitors named, GRH not** | Engines have built-up authority signals for them, none for us yet | Press coverage, Crunchbase, Wikipedia (eventually), reviews |
| **Same prompt → same answer across all engines** | Likely all reading the same training-data snapshot | Live retrieval not happening — check robots.txt, sitemap, indexing |

## Editing the prompt set

Open `scripts/ai-discovery-sweep.mjs` and edit `PROMPTS` (the array near the top). Keep the prompts **stable week-on-week** so the tracker is comparable — add new prompts rarely, and never remove ones until they've been tracked for a month.

Also editable at the top of the script:
- `BRAND_VARIANTS` — names to look for as "GRH was named"
- `COMPETITORS` — names to flag as alternatives

## Troubleshooting

- **`OpenAI 401`** — bad API key or no billing set up.
- **`Anthropic 404` on `web_search_20250305`** — the web search tool may not be on your tier yet. Remove the `tools` block in the `runAnthropic` function to test without retrieval.
- **`Gemini 429`** — free-tier rate limits. Wait a minute and re-run, or upgrade.
- **Perplexity error** — Perplexity API requires a paid plan with API access enabled; not just a regular subscription.

## Limits

This script tests **live retrieval** (with web search tools enabled) — that's what matters for short-term AI discovery. It does not test what the underlying model "knows" from training data alone. To test that, run the same script with the `tools` blocks removed in each adapter.

Also: results vary run-to-run for the same prompt. Don't read too much into a single sweep — week-on-week trends in `tracker.csv` are the signal.
