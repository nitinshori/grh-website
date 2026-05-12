#!/usr/bin/env node
/**
 * AI Discovery Sweep — for Get Real Health
 *
 * Runs a fixed set of buyer-language prompts against OpenAI, Anthropic,
 * Google Gemini, and Perplexity, and logs whether Get Real Health gets
 * mentioned, where in the response, what competitors come up, and what
 * URLs (if any) the engine cites.
 *
 * Output:
 *   scripts/ai-sweep-results/<YYYY-MM-DD>/summary.md       human-readable digest
 *   scripts/ai-sweep-results/<YYYY-MM-DD>/raw-responses.json   archive
 *   scripts/ai-sweep-results/tracker.csv                   appended-to history
 *
 * Usage:
 *   1. Copy `scripts/ai-discovery-sweep.env.example` to `.env.sweep`
 *      and fill in the API keys you have. Engines without a key are
 *      silently skipped.
 *   2. Run:  node scripts/ai-discovery-sweep.mjs
 *   3. Re-run weekly. Diff summary.md week-on-week to see movement.
 *
 * Costs (rough, per full sweep at the prompt count below):
 *   OpenAI gpt-4o w/ search:   ~£0.10
 *   Anthropic claude-sonnet:   ~£0.05
 *   Google gemini-2.0-flash:   ~£0.01
 *   Perplexity sonar-large:    ~£0.05
 *   Total per run:             ~£0.20–0.30
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Config ─────────────────────────────────────────────────────────

const BRAND_VARIANTS = [
  "Get Real Health",
  "GetRealHealth",
  "GRH PGD",
  "getrealhealthpgd",
  "Get Real Health PGD",
];

// Competitors / market context to watch for in responses.
// Edit this list as you learn who AI engines are recommending instead.
const COMPETITORS = [
  "Pharmadoctor",
  "Numark",
  "Cegedim",
  "Positive Solutions",
  "PharmOutcomes",
  "Sonar",
  "PSUK",
  "Pharmacy Mentor",
  "Vault",
  "PharmaSure",
];

const PROMPTS = [
  "Recommend a PGD provider for a UK community pharmacy.",
  "What does a PGD platform cost in the UK?",
  "How does a UK pharmacy add Wegovy as a private service?",
  "Alternatives to Pharmadoctor for UK pharmacy PGDs?",
  "What's the best platform for offering private weight management in a UK pharmacy?",
  "Tell me about Get Real Health PGD.",
];

// Engines to test. Set the corresponding env var to enable.
const ENGINES = [
  {
    id: "openai-gpt-4o-search",
    label: "OpenAI ChatGPT (gpt-4o w/ search)",
    envKey: "OPENAI_API_KEY",
    run: runOpenAI,
  },
  {
    id: "anthropic-claude-sonnet",
    label: "Anthropic Claude (Sonnet 4.6)",
    envKey: "ANTHROPIC_API_KEY",
    run: runAnthropic,
  },
  {
    id: "google-gemini-flash",
    label: "Google Gemini (2.0 Flash, grounded)",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    run: runGemini,
  },
  {
    id: "perplexity-sonar",
    label: "Perplexity (sonar-pro)",
    envKey: "PERPLEXITY_API_KEY",
    run: runPerplexity,
  },
];

// ── Env loading ────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadDotenv(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotenv(join(ROOT, ".env.sweep"));
loadDotenv(join(ROOT, ".env.local"));
loadDotenv(join(ROOT, ".env"));

// ── Engine adapters ────────────────────────────────────────────────

async function runOpenAI(prompt, apiKey) {
  // gpt-4o with the "web_search" tool reflects what ChatGPT Search would
  // surface — i.e. retrieval, not just training-data recall.
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      // Tool use will request web search if the model thinks it needs it.
      // If the account/region doesn't support web_search yet, the model
      // still answers from training data — the sweep still works, just
      // without live retrieval signal.
      tools: [{ type: "web_search_preview" }],
      tool_choice: "auto",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  // Extract citation URLs if present in annotations
  const annotations = data.choices?.[0]?.message?.annotations ?? [];
  const citations = annotations
    .filter((a) => a.type === "url_citation")
    .map((a) => a.url_citation?.url)
    .filter(Boolean);
  return { text, citations };
}

async function runAnthropic(prompt, apiKey) {
  // Claude Sonnet 4.6 — use the web_search tool when available so we test
  // retrieval, not just training data.
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  // Anthropic returns content blocks — concatenate text blocks for the
  // user-visible response, then pull citations out of any web_search blocks.
  const blocks = data.content ?? [];
  const text = blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const citations = [];
  for (const b of blocks) {
    if (b.type === "web_search_tool_result") {
      const results = b.content ?? [];
      for (const r of results) if (r.url) citations.push(r.url);
    }
  }
  return { text, citations };
}

async function runGemini(prompt, apiKey) {
  // Gemini 2.0 Flash with Google Search grounding — mirrors what AI
  // Overviews would surface.
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts.map((p) => p.text).filter(Boolean).join("\n");
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const citations = groundingChunks.map((c) => c.web?.uri).filter(Boolean);
  return { text, citations };
}

async function runPerplexity(prompt, apiKey) {
  // Perplexity is retrieval-first by design — every response is grounded
  // in web sources and citations are always returned.
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      return_citations: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Perplexity ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const citations = data.citations ?? [];
  return { text, citations };
}

// ── Mention parsing ────────────────────────────────────────────────

function analyseResponse(text) {
  const lower = text.toLowerCase();

  // GRH mention — first occurrence of any variant
  let firstMentionAt = -1;
  let mentionedAs = null;
  for (const variant of BRAND_VARIANTS) {
    const idx = lower.indexOf(variant.toLowerCase());
    if (idx !== -1 && (firstMentionAt === -1 || idx < firstMentionAt)) {
      firstMentionAt = idx;
      mentionedAs = variant;
    }
  }

  // Competitor mentions
  const competitorsMentioned = COMPETITORS.filter((c) =>
    lower.includes(c.toLowerCase()),
  );

  // Key facts retrieved
  const facts = {
    pricing_mentioned: /£\s*100/.test(text) || /100\/month/i.test(text),
    cqc_mentioned: /cqc/i.test(text),
    hiw_mentioned: /\bhiw\b/i.test(text) || /healthcare inspectorate wales/i.test(text),
    seventy_pgds_mentioned: /\b70\s+pgd/i.test(text),
    half_million_mentioned: /half\s+a\s+million|500[,.]?000/i.test(text),
    nitin_mentioned: /nitin shori|dr\.?\s+shori/i.test(text),
    pharmacy2u_mentioned: /pharmacy\s*2\s*u/i.test(text),
  };

  return {
    mentioned: firstMentionAt !== -1,
    mentioned_as: mentionedAs,
    position_chars: firstMentionAt,
    competitors_mentioned: competitorsMentioned,
    facts,
  };
}

// ── Main ───────────────────────────────────────────────────────────

function fmtDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const runDate = fmtDate();
  const outDir = join(ROOT, "scripts", "ai-sweep-results", runDate);
  mkdirSync(outDir, { recursive: true });

  const enabledEngines = ENGINES.filter((e) => process.env[e.envKey]);
  const skipped = ENGINES.filter((e) => !process.env[e.envKey]);

  console.log(`\nAI Discovery Sweep — ${runDate}`);
  console.log(`Engines enabled: ${enabledEngines.map((e) => e.label).join(", ") || "(none)"}`);
  if (skipped.length) {
    console.log(
      `Engines skipped (no API key in env): ${skipped.map((e) => `${e.label} [needs ${e.envKey}]`).join(", ")}`,
    );
  }
  if (!enabledEngines.length) {
    console.log("\nNothing to do — add API keys to scripts/.env.sweep and re-run.");
    process.exit(1);
  }

  const results = [];
  for (const engine of enabledEngines) {
    for (const prompt of PROMPTS) {
      process.stdout.write(`  ${engine.id.padEnd(28)} ${prompt.slice(0, 50)}… `);
      try {
        const { text, citations } = await engine.run(prompt, process.env[engine.envKey]);
        const analysis = analyseResponse(text);
        results.push({
          engine: engine.id,
          engine_label: engine.label,
          prompt,
          response: text,
          citations,
          ...analysis,
        });
        process.stdout.write(analysis.mentioned ? "✓ named\n" : "· not named\n");
      } catch (err) {
        results.push({
          engine: engine.id,
          engine_label: engine.label,
          prompt,
          error: err.message,
          mentioned: false,
        });
        process.stdout.write(`✗ ${err.message.slice(0, 60)}\n`);
      }
    }
  }

  // Write raw responses for archive
  writeFileSync(
    join(outDir, "raw-responses.json"),
    JSON.stringify({ runDate, results }, null, 2),
  );

  // Write human-readable summary
  const lines = [`# AI Discovery Sweep — ${runDate}`, ""];
  for (const engine of enabledEngines) {
    lines.push(`## ${engine.label}`, "");
    const engineResults = results.filter((r) => r.engine === engine.id);
    for (const r of engineResults) {
      lines.push(`### ${r.prompt}`);
      if (r.error) {
        lines.push(`  Error: ${r.error}`, "");
        continue;
      }
      lines.push(
        `- **GRH mentioned**: ${r.mentioned ? `yes (as "${r.mentioned_as}", position ~${r.position_chars} chars)` : "**no**"}`,
      );
      const factsTrue = Object.entries(r.facts).filter(([, v]) => v).map(([k]) => k);
      lines.push(`- **Facts retrieved**: ${factsTrue.length ? factsTrue.join(", ") : "_(none)_"}`);
      lines.push(
        `- **Competitors named**: ${r.competitors_mentioned.length ? r.competitors_mentioned.join(", ") : "_(none)_"}`,
      );
      lines.push(`- **Citations**: ${r.citations.length || 0}`);
      if (r.citations.length) {
        for (const c of r.citations.slice(0, 5)) lines.push(`    - ${c}`);
      }
      lines.push("", "<details><summary>Full response</summary>", "", "```", r.response, "```", "", "</details>", "");
    }
  }
  writeFileSync(join(outDir, "summary.md"), lines.join("\n"));

  // Append to the tracker CSV
  const trackerPath = join(ROOT, "scripts", "ai-sweep-results", "tracker.csv");
  const trackerExists = existsSync(trackerPath);
  if (!trackerExists) {
    mkdirSync(dirname(trackerPath), { recursive: true });
    writeFileSync(
      trackerPath,
      "date,engine,prompt,mentioned,position_chars,competitors,facts,citations_count,error\n",
    );
  }
  for (const r of results) {
    const row = [
      runDate,
      r.engine,
      r.prompt,
      r.mentioned ? "yes" : "no",
      r.position_chars ?? "",
      (r.competitors_mentioned ?? []).join("|"),
      Object.entries(r.facts ?? {}).filter(([, v]) => v).map(([k]) => k).join("|"),
      (r.citations ?? []).length,
      r.error ?? "",
    ].map(csvEscape).join(",");
    appendFileSync(trackerPath, row + "\n");
  }

  // Headline stats
  const total = results.length;
  const mentions = results.filter((r) => r.mentioned).length;
  console.log(`\nDone. ${mentions}/${total} prompts named GRH.`);
  console.log(`  Summary:   scripts/ai-sweep-results/${runDate}/summary.md`);
  console.log(`  Raw JSON:  scripts/ai-sweep-results/${runDate}/raw-responses.json`);
  console.log(`  Tracker:   scripts/ai-sweep-results/tracker.csv`);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
