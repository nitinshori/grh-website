// GRH chatbot knowledge base.
// Two-layer chatbot architecture (mirroring parkhouse.wales): local FAQ
// matching first, with an LLM fallback only for unmatched questions.
//
// To add or edit a topic: append an entry below. Each topic has:
//   - id:        unique identifier (string)
//   - keywords:  array of lowercase phrases that should trigger this topic
//   - answer:    HTML response shown to the user
//   - priority:  optional; higher wins ties; safety topics use ≥1000
//
// The matcher scores topics by counting keyword matches (longer phrases
// weighted higher) and picks the best match.

export interface Topic {
  id: string;
  keywords: string[];
  answer: string;
  priority?: number;
}

export const TOPICS: Topic[] = [
  // ── SAFETY-CRITICAL — always checked first ──────────────────
  {
    id: "medical-advice",
    priority: 1000,
    keywords: [
      "should i take", "is it safe to take", "is it ok to take",
      "what is wrong with me", "whats wrong", "what's wrong",
      "diagnose", "diagnosis", "symptom", "symptoms",
      "do i have", "is this serious", "should i be worried", "pain in my",
      "rash", "lump", "bleeding", "fever", "temperature", "cough", "headache",
      "how much paracetamol", "how much ibuprofen", "how many tablets",
      "maximum dose", "safe dose", "dose for", "dosage", "side effect",
      "side effects", "reaction to", "allergic reaction", "too much",
      "mix medications", "with my medication",
    ],
    answer:
      "<p>I'm the GRH assistant — I help pharmacy owners and pharmacists with questions about our private PGD platform. I can't give medical advice or recommend doses.</p>" +
      "<p>If you're a patient asking about a treatment, please speak to your pharmacist or GP. In an emergency call <a href=\"tel:999\">999</a>; for urgent advice call <a href=\"tel:111\">111</a>.</p>" +
      "<p>If you're a pharmacy professional asking about how a PGD works in our platform, ask your question that way and I'll do my best.</p>",
  },
  {
    id: "self-harm-suicide",
    priority: 1500,
    keywords: [
      "suicidal", "suicide", "want to die", "kill myself", "end my life",
      "don't want to be here", "dont want to be here", "end it all",
      "self harm", "self-harm", "selfharm", "hurt myself", "hurting myself",
      "cut myself", "no point living",
    ],
    answer:
      "<p><strong>If you're in immediate danger of harming yourself, please call <a href=\"tel:999\">999</a> now.</strong></p>" +
      "<p>You don't have to deal with this alone:</p>" +
      "<ul>" +
      "<li><strong>Samaritans</strong> (free, 24/7): <a href=\"tel:116123\">116 123</a></li>" +
      "<li><strong>NHS 111</strong> (mental health option): <a href=\"tel:111\">111</a></li>" +
      "</ul>",
  },

  // ── Prompt injection / off-topic guards ─────────────────────
  {
    id: "prompt-injection",
    priority: 800,
    keywords: [
      "ignore previous", "ignore your instructions", "ignore all previous",
      "forget your instructions", "pretend you", "act as", "roleplay",
      "jailbreak", "system prompt", "your prompt", "developer mode", "dan mode",
    ],
    answer:
      "<p>I'm the GRH assistant — I only help with questions about Get Real Health's PGD platform. What would you like to know about us?</p>",
  },
  {
    id: "off-topic",
    keywords: [
      "tell me a joke", "sing me", "a poem", "rap for me", "recipe",
      "weather", "football", "premier league", "stock price",
      "write code for me", "do my homework",
    ],
    answer:
      "<p>I'm a focused assistant for Get Real Health — I help with questions about our PGD platform, pricing, services, and how to onboard. If you have one of those, ask away.</p>",
  },

  // ── Company / who we are ────────────────────────────────────
  {
    id: "who-are-you",
    keywords: [
      "who are you", "what are you", "are you a person", "are you human",
      "are you a bot", "are you ai", "what is this", "what is grh",
      "what is get real health", "tell me about you",
    ],
    answer:
      "<p>I'm the Get Real Health assistant — a small program that answers questions about our private PGD platform for UK pharmacies, based on the information on this site.</p>" +
      "<p>For anything I can't answer, <a href=\"/book\">book a discovery call</a> or email <a href=\"mailto:info@getrealhealthpgd.co.uk\">info@getrealhealthpgd.co.uk</a>.</p>",
  },
  {
    id: "what-is-grh",
    keywords: [
      "what is grh", "what do you do", "what is get real health",
      "what does grh do", "tell me about grh", "what is your company",
      "what is the company", "about the company",
    ],
    answer:
      "<p><strong>Get Real Health (GRH)</strong> is a private PGD platform for UK community pharmacies. We give your pharmacy 60+ Patient Group Directions across weight management, travel, sexual health, hormones, dermatology, vaccines and more — under one flat monthly fee.</p>" +
      "<p>CQC + HIW registered. Built and clinically led by Dr Nitin Shori (NHS GP and former Medical Director of Pharmacy2U Online Doctor Service).</p>" +
      "<p>See the <a href=\"/for-pharmacies/pgd-catalogue\">full PGD catalogue</a> or <a href=\"/services/comparison\">how we compare with NHS Pharmacy First</a>.</p>",
  },
  {
    id: "founders",
    keywords: [
      "who founded", "who runs", "who built", "founder", "ceo",
      "nitin shori", "nitin", "dr shori", "medical director",
      "chris pilkington", "head pharmacist",
    ],
    answer:
      "<p><strong>Dr Nitin Shori</strong> founded GRH — NHS GP partner and previously Medical Director of Pharmacy2U Online Doctor Service for 10+ years. He is the named clinician on every PGD.</p>" +
      "<p><strong>Chris Pilkington</strong> is Head Pharmacist — 30+ years in community pharmacy and independent prescribing; oversees implementation, training, and clinical governance.</p>" +
      "<p><strong>Janey Tipping</strong> is Clinical Lead — sign-off on all clinical content.</p>",
  },

  // ── Pricing ─────────────────────────────────────────────────
  {
    id: "pricing",
    keywords: [
      "how much", "price", "pricing", "cost", "fee", "subscription",
      "per month", "monthly", "what do you charge", "how much do you charge",
      "is it free", "do you charge", "tier", "plan",
    ],
    answer:
      "<p><strong>£100/month flat</strong> per pharmacy. That's it.</p>" +
      "<ul>" +
      "<li>Covers your whole team — every pharmacist, technician, and locum on your premises</li>" +
      "<li>All 60+ PGDs included, no per-service add-ons</li>" +
      "<li>No per-consultation fees</li>" +
      "<li>No revenue-sharing</li>" +
      "<li>Direct Debit via GoCardless, monthly</li>" +
      "</ul>" +
      "<p>Full pricing details at <a href=\"/for-pharmacies/pricing\">getrealhealthpgd.co.uk/for-pharmacies/pricing</a>.</p>",
  },
  {
    id: "free-trial",
    keywords: ["free trial", "trial period", "try before", "try first", "demo account", "demo login", "preview"],
    answer:
      "<p>We don't run a free trial in the traditional sense, but you can:</p>" +
      "<ul>" +
      "<li><strong>Book a 30-minute discovery call</strong> — see the platform end-to-end with one of the team: <a href=\"/book\">getrealhealthpgd.co.uk/book</a></li>" +
      "<li><strong>Browse the PGD catalogue</strong> at <a href=\"/for-pharmacies/pgd-catalogue\">/for-pharmacies/pgd-catalogue</a></li>" +
      "<li><strong>See the comparison vs Pharmacy First</strong> at <a href=\"/services/comparison\">/services/comparison</a></li>" +
      "</ul>" +
      "<p>If you want a preview-only login to click around before committing, mention it on the discovery call.</p>",
  },

  // ── PGD catalogue / services ────────────────────────────────
  {
    id: "pgd-catalogue",
    keywords: [
      "what pgds", "what services", "what's included", "what is included",
      "which pgds", "list of pgds", "pgd list", "catalogue", "catalog",
      "what can i offer", "what services can i offer",
    ],
    answer:
      "<p>60+ PGDs across:</p>" +
      "<ul>" +
      "<li><strong>Weight management</strong> — Wegovy, Mounjaro, Saxenda, Mysimba, Orlistat, GLP-1 monitoring</li>" +
      "<li><strong>Travel</strong> — yellow fever, rabies, JE, MenACWY, dengue, anti-malarials, traveller's diarrhoea, altitude, typhoid</li>" +
      "<li><strong>Hormones</strong> — HRT, TRT, testosterone for women</li>" +
      "<li><strong>Sexual health</strong> — ED, PE, BPH, contraception, STI testing, PrEP, gonorrhoea, herpes, genital warts</li>" +
      "<li><strong>Vaccines</strong> — flu, COVID, shingles, pneumococcal, HPV, MMR, chickenpox, MenB, RSV, occupational hep B</li>" +
      "<li><strong>Skin</strong> — acne, rosacea, eczema, cold sores, impetigo, wound care, alopecia</li>" +
      "<li><strong>Respiratory / CVD / mental health / paediatric / dental</strong> — full list at <a href=\"/for-pharmacies/pgd-catalogue\">the catalogue</a></li>" +
      "</ul>",
  },
  {
    id: "wegovy-mounjaro",
    keywords: [
      "wegovy", "mounjaro", "tirzepatide", "semaglutide",
      "glp-1", "glp1", "glp 1", "weight loss injection",
    ],
    answer:
      "<p>Yes — Wegovy (semaglutide) and Mounjaro (tirzepatide) are both included under your £100/month, alongside Saxenda, Orlistat and Mysimba. Full off-label oral semaglutide pilot is restricted-access (not part of the standard catalogue).</p>" +
      "<p>The Wegovy PGD covers titration up to 7.2 mg. The Mounjaro PGD covers 2.5–15 mg weekly. Both have full training modules + audit trail in the platform.</p>",
  },
  {
    id: "hrt-trt",
    keywords: [
      "hrt", "menopause", "trt", "testosterone replacement", "testosterone",
      "testosterone for women", "androfeme",
    ],
    answer:
      "<p>HRT (oestradiol + combined HRT), TRT (testosterone undecanoate / gel), and testosterone for women are all included. Dr Nitin Shori is the named clinician on every PGD and previously ran large-scale online TRT prescribing at Pharmacy2U.</p>",
  },

  // ── How does it work / onboarding ───────────────────────────
  {
    id: "onboarding",
    keywords: [
      "how do i sign up", "how to sign up", "how do i get started", "how to start",
      "how do i onboard", "how to onboard", "how long to onboard",
      "how long does it take", "how quickly", "go live", "get going",
    ],
    answer:
      "<p>Two ways:</p>" +
      "<ol>" +
      "<li><strong>Self-serve</strong> — fill in the form at <a href=\"/onboard\">/onboard</a>, set up Direct Debit via GoCardless, and we'll approve your account within 1 business day. Total time: usually 48 hours from form-fill to first consultation.</li>" +
      "<li><strong>Book a discovery call</strong> — 30 minutes with the team to walk through the platform and answer questions: <a href=\"/book\">/book</a>. Then onboard at your own pace.</li>" +
      "</ol>",
  },
  {
    id: "compliance",
    keywords: [
      "cqc", "hiw", "regulated", "regulation", "regulatory", "regulator",
      "compliance", "audit", "gphc", "indemnity",
    ],
    answer:
      "<p>GRH is registered with the <strong>Care Quality Commission (CQC)</strong> in England and <strong>Healthcare Inspectorate Wales (HIW)</strong> in Wales. We are not currently regulated for Scotland or Northern Ireland.</p>" +
      "<p>Every consultation is recorded in the platform's audit log (timestamped, immutable). Every PGD is named-clinician signed (Dr Nitin Shori). Every pharmacist must complete the training module + quiz before delivering a PGD.</p>" +
      "<p>Pharmacists and pharmacies remain responsible for their own GPhC registration and indemnity insurance.</p>",
  },
  {
    id: "scotland-ni",
    keywords: [
      "scotland", "scottish", "northern ireland", "ni ", "republic of ireland",
      "ireland", "outside uk", "europe",
    ],
    answer:
      "<p>GRH is currently registered in <strong>England (CQC)</strong> and <strong>Wales (HIW)</strong> only. We don't yet cover Scotland or Northern Ireland — Scotland operates under different pharmacy regulation and we haven't completed that registration yet.</p>" +
      "<p>If you're in Scotland or NI and interested, drop us a note at <a href=\"mailto:info@getrealhealthpgd.co.uk\">info@getrealhealthpgd.co.uk</a> — we'd like to know about demand.</p>",
  },

  // ── Comparison / differentiation ────────────────────────────
  {
    id: "vs-pharmacy-first",
    keywords: [
      "pharmacy first", "nhs pharmacy first", "vs nhs", "nhs scheme",
      "common ailments", "welsh cas",
    ],
    answer:
      "<p>Pharmacy First (England) covers <strong>7 conditions</strong>: sore throat, otitis media, sinusitis, infected insect bites, impetigo, shingles, uncomplicated UTI in women. Scotland's is a bit broader. The Welsh Common Ailments Service covers ~26 conditions free-OTC.</p>" +
      "<p>GRH adds 60+ <strong>private</strong> PGDs on top — Wegovy, Mounjaro, HRT, TRT, ED, travel vaccines, STI testing, and many more. Patients pay for the consultation; you keep all the revenue (no per-consultation fee from us).</p>" +
      "<p>Side-by-side comparison at <a href=\"/services/comparison\">/services/comparison</a>.</p>",
  },
  {
    id: "vs-pharmadoctor",
    keywords: [
      "pharmadoctor", "pharma doctor", "competitor", "competitors", "compare with",
      "alternative", "alternatives",
    ],
    answer:
      "<p>The main UK private-PGD alternative is PharmaDoctor, who charge per-service and per-consultation. GRH is <strong>£100/month flat, all services included</strong>.</p>" +
      "<p>Practically: if you do more than a few consultations a month across a couple of services, GRH is materially cheaper. We also include training modules + audit trail in the platform rather than charging separately.</p>" +
      "<p>Built specifically for owner-led independent and small group pharmacies, not multiples.</p>",
  },

  // ── Operational ─────────────────────────────────────────────
  {
    id: "training",
    keywords: [
      "training", "cpd", "module", "modules", "quiz", "competency",
      "how do my pharmacists train", "how does training work",
    ],
    answer:
      "<p>67 training modules included, one per PGD. Each module covers the clinical background, eligibility, contraindications, dosing, counselling, plus a quiz with critical safety questions. 80% pass mark; unlimited attempts; the platform records who passed which module + version.</p>" +
      "<p>Pharmacists must pass the relevant module before delivering a consultation under that PGD.</p>",
  },
  {
    id: "locums",
    keywords: ["locum", "locums", "agency", "casual staff", "freelance pharmacist"],
    answer:
      "<p>Locums are covered for free. The £100/month flat fee is <strong>per pharmacy</strong>, not per pharmacist — so any registered pharmacist or technician working in your store can deliver consultations under your PGDs (after passing the relevant training modules).</p>",
  },
  {
    id: "tech-stack",
    keywords: [
      "how does the consultation work", "ipad", "tablet", "device",
      "do i need new hardware", "software", "integration", "patient medication record",
      "pmr",
    ],
    answer:
      "<p>The consultation runs in any web browser — laptop, iPad, or even a phone for follow-ups. No app to install, no hardware to buy.</p>" +
      "<p>We don't integrate with PMR systems today (Cegedim, Positive Solutions, etc.) — the consultation produces a printable PDF you can scan/file alongside the patient's NHS record.</p>",
  },
  {
    id: "phone-bookings",
    keywords: [
      "phone bookings", "phone booking", "book by phone", "telephone bookings",
      "patient booking", "online booking",
    ],
    answer:
      "<p>Yes. You can capture phone bookings directly from your dashboard — patient details + expected visit date — and the pharmacist resumes the consultation when the patient arrives. Drafts last 30 days.</p>",
  },

  // ── Contact / next steps ────────────────────────────────────
  {
    id: "contact",
    keywords: [
      "contact", "how to contact", "email", "phone", "phone number",
      "speak to someone", "get in touch", "discovery call",
      "demo", "book a demo",
    ],
    answer:
      "<p>Three ways:</p>" +
      "<ul>" +
      "<li><strong>Book a 30-min discovery call</strong>: <a href=\"/book\">getrealhealthpgd.co.uk/book</a></li>" +
      "<li><strong>Email</strong>: <a href=\"mailto:info@getrealhealthpgd.co.uk\">info@getrealhealthpgd.co.uk</a></li>" +
      "<li><strong>Talk to our AI receptionist Eva</strong>: <a href=\"tel:01135198330\">0113 519 8330</a> (24/7, books call-backs)</li>" +
      "</ul>",
  },
  {
    id: "location",
    keywords: ["where are you based", "office", "headquarters", "address", "location"],
    answer:
      "<p>GRH is a UK company. We operate as a remote-first platform serving pharmacies across England and Wales. For correspondence, use <a href=\"mailto:info@getrealhealthpgd.co.uk\">info@getrealhealthpgd.co.uk</a>.</p>",
  },
];

export const FALLBACK_HTML =
  "<p>Sorry — I don't have a direct answer for that. Here are some things I can help with:</p>" +
  "<div class=\"flex flex-wrap gap-2 mt-2\">" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How much does it cost?\">Pricing</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"What PGDs are included?\">PGD catalogue</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How do I get started?\">Onboarding</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How does GRH compare with Pharmacy First?\">vs Pharmacy First</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"Are you regulated?\">Compliance</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"Book a discovery call\">Talk to us</button>" +
  "</div>" +
  "<p class=\"mt-3\">Or <a href=\"/book\">book a discovery call</a> / email <a href=\"mailto:info@getrealhealthpgd.co.uk\">info@getrealhealthpgd.co.uk</a>.</p>";

// ── Matcher ──────────────────────────────────────────────────

function normalise(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 '"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findBestTopic(query: string): Topic | null {
  const q = normalise(query);
  if (!q) return null;

  let best: Topic | null = null;
  let bestScore = 0;

  for (const t of TOPICS) {
    let score = 0;
    for (const kw of t.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > 0 && t.priority) score += t.priority;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}
