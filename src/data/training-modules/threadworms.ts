// Threadworms (Enterobius vermicularis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const threadwormsModule: TrainingModule = {
  slug: "threadworms",
  title: "Threadworms — PGD",
  description: "Supply of mebendazole for threadworm infection in family contacts under PGD.",
  pgdSlugs: ["threadworms"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Threadworms — Training", subtitle: "Mebendazole treatment of pinworm infection", estimatedMinutes: 8, objectives: [
      "Recognise threadworm infection and apply household treatment principles.",
      "Identify when not to use mebendazole under the PGD (pregnancy, under 2, lactation).",
      "Counsel on hygiene measures to prevent recurrence.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Threadworms (Enterobius vermicularis, pinworm) are small white worms ~5–10 mm long that live in the colon and lay eggs at night around the anus, causing intense itching. Eggs survive 2–3 weeks on surfaces; re-infection is common.",
      "Most common parasitic infection in UK children. Often asymptomatic in adults but they carry/spread.",
      "Treatment: mebendazole single dose, plus a second dose 2 weeks later, plus rigorous hygiene measures. ALL household members treated together regardless of symptoms.",
    ], highlights: ["Treat the whole household at the same time.", "Hygiene measures are as important as the drug.", "Repeat dose at 2 weeks to catch the next cycle."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 2+", detail: "Mebendazole not licensed under 2 years. Under 2 — refer GP." },
      { label: "Threadworm infection in self or household member", detail: "Eggs visible on tape test, worms seen at anus, or strong clinical suspicion." },
      { label: "Not pregnant or breastfeeding", detail: "Mebendazole avoided. GP can advise on hygiene-only or alternative." },
      { label: "Whole household available for treatment", detail: "Treating one person while household members remain infected leads to immediate re-infection." },
      { label: "No allergy to mebendazole", detail: "Refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Pregnancy or breastfeeding — refer to GP/midwife (hygiene measures only typically).",
      "Children under 2.",
      "Recurrent infection despite proper treatment + hygiene — refer GP.",
      "Diagnostic uncertainty (worms not seen, atypical presentation).",
      "Severe hepatic impairment.",
      "Concurrent metronidazole — interaction risk; defer or refer.",
      "Suspected complication (severe abdominal pain, persistent vomiting) — refer.",
    ]},
    { id: "treatment", type: "checklist", title: "Treatment", intro: "Mebendazole 100 mg single dose chewable tablet.", items: [
      { label: "Dose", detail: "100 mg single dose, repeated after 2 weeks if re-infection risk persists (usual practice). Chewable tablet for children ≥2 or swallow whole for older patients." },
      { label: "Whole household", detail: "All household members aged ≥2 treated together same day. Exclude pregnant/breastfeeding women per their PGD scope." },
      { label: "Second dose at 2 weeks", detail: "Recommended in many protocols — catches eggs that survived the first dose. Some local protocols use single dose only — follow local PGD wording." },
      { label: "Hygiene alongside", detail: "Mandatory. See counselling slide." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling — hygiene measures (as important as the drug)", items: [
      { label: "Hand hygiene", detail: "Wash hands frequently with soap, especially after using toilet, before meals, after waking. Cut and scrub fingernails — eggs lodge under nails." },
      { label: "Underwear and bedding", detail: "Wash all underwear, bed linen, towels at 60°C+ on day of treatment. Vacuum carpets and soft furnishings." },
      { label: "Bath in the morning", detail: "Eggs are laid overnight; morning bath/shower removes them before they spread." },
      { label: "Don't share towels", detail: "Individual towels for the duration." },
      { label: "Children's bedrooms", detail: "Damp-dust surfaces; vacuum thoroughly. Eggs survive on surfaces 2–3 weeks." },
      { label: "Itching at night", detail: "Crotamiton cream OTC if symptomatic." },
      { label: "Re-treatment if symptoms return", detail: "After 2 weeks if itching returns, may need second dose for the whole household." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "Atypical features.", detail: [
      "Severe abdominal pain, persistent vomiting.",
      "Visible worms in stool that aren't pinworm appearance (longer, segmented, in faeces — could be tapeworm or roundworm).",
      "Recurrent infection despite proper treatment and hygiene — investigate compliance, environment.",
      "Pregnancy.",
      "Immunocompromised.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Treat the whole household over 2, simultaneously.",
      "Mebendazole 100 mg single dose; repeat at 2 weeks.",
      "Hygiene measures mandatory — handwashing, hot wash linen, morning bath, nails short.",
      "Pregnant / breastfeeding / under 2 — refer.",
      "Recurrent infection — refer.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman in a household with threadworm outbreak. Action?", options: [
      { id: "a", label: "Supply mebendazole." }, { id: "b", label: "Refer to GP/midwife. Mebendazole is avoided in pregnancy. Hygiene measures alone or specialist-advised treatment." }, { id: "c", label: "Supply half dose." }, { id: "d", label: "Supply piperazine." }
    ], correctOptionIds: ["b"], explanation: "Mebendazole is avoided in pregnancy. GP/midwife can advise — usually hygiene measures alone in mild cases; treatment deferred to second/third trimester if necessary." },
    { id: "q-under-2", type: "single-choice", critical: true, question: "1-year-old child has threadworms. Action?", options: [
      { id: "a", label: "Supply mebendazole at low dose." }, { id: "b", label: "Refer to GP. Mebendazole not licensed under 2 — alternative or hygiene-only approach." }, { id: "c", label: "Supply piperazine." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Under 2 is outside the PGD. GP can advise on management." },
    { id: "q-whole-household", type: "single-choice", critical: true, question: "Mother brings in to be treated for threadworms. Says her two children also have them. Husband doesn't. What's the correct approach?", options: [
      { id: "a", label: "Treat the mother only." }, { id: "b", label: "Treat the whole household — mother, both children, AND husband — same day. Husband may be asymptomatic carrier; not treating him guarantees re-infection." }, { id: "c", label: "Treat mother and symptomatic children only." }, { id: "d", label: "Defer for 2 weeks." }
    ], correctOptionIds: ["b"], explanation: "Asymptomatic household members are common carriers. Treating only symptomatic members guarantees re-infection within weeks. Whole household, same day." },
    { id: "q-hygiene", type: "single-choice", critical: true, question: "Patient says she'll take the tablets but doesn't see the need for hygiene measures.", options: [
      { id: "a", label: "Accept her decision." }, { id: "b", label: "Counsel that hygiene measures are as important as the drug. Eggs survive 2–3 weeks on surfaces; without hygiene measures, re-infection is near-guaranteed. Hand hygiene, hot wash linen, morning bath, short nails." }, { id: "c", label: "Supply double dose to compensate." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Drug alone is insufficient. Eggs in the environment will re-infect within days. Counsel firmly on hygiene." },
    { id: "q-dose", type: "single-choice", question: "Standard mebendazole dose for an adult with threadworms?", options: [
      { id: "a", label: "100 mg twice daily for 7 days." }, { id: "b", label: "100 mg single dose, repeat at 2 weeks." }, { id: "c", label: "200 mg single dose." }, { id: "d", label: "50 mg daily for 14 days." }
    ], correctOptionIds: ["b"], explanation: "Single 100 mg dose, repeat at 2 weeks. Same dose for adults and children ≥2." },
    { id: "q-stool-worm", type: "single-choice", question: "Patient reports seeing a long segmented worm in stool, ~30 cm. Likely diagnosis?", options: [
      { id: "a", label: "Threadworm." }, { id: "b", label: "Not threadworm — too big and segmented. Likely tapeworm or roundworm. Refer to GP for proper identification and treatment." }, { id: "c", label: "Hookworm — supply mebendazole." }, { id: "d", label: "Reassure — normal finding." }
    ], correctOptionIds: ["b"], explanation: "Threadworms are tiny (5–10 mm) and seen at the anus, not in stool. Larger worms suggest different parasites needing different treatment." },
    { id: "q-recurrent", type: "single-choice", question: "Family has been treated twice in 3 months. Worms again. Action?", options: [
      { id: "a", label: "Treat again." }, { id: "b", label: "Refer to GP — recurrent infection despite treatment + hygiene needs investigation (compliance, contact tracing, environmental factors)." }, { id: "c", label: "Supply higher dose." }, { id: "d", label: "Supply for the school class." }
    ], correctOptionIds: ["b"], explanation: "Recurrent infection beyond properly treated cycles warrants GP review — sometimes a wider source (school, nursery) needs addressing." },
    { id: "q-allergy", type: "single-choice", question: "Patient says she had a rash with mebendazole previously. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer — possible hypersensitivity. GP can prescribe alternative or supervise with antihistamine cover." }, { id: "c", label: "Supply with antihistamine." }, { id: "d", label: "Supply half dose." }
    ], correctOptionIds: ["b"], explanation: "Prior hypersensitivity reaction requires GP review; alternative anthelmintics or hygiene-only options." },
    { id: "q-hygiene-key", type: "single-choice", question: "Which is the SINGLE most important hygiene measure?", options: [
      { id: "a", label: "Hot baths only." }, { id: "b", label: "Hand hygiene + short clean fingernails — eggs are spread by hand-to-mouth and lodge under nails." }, { id: "c", label: "Bleach the toilet." }, { id: "d", label: "Sleep in separate rooms." }
    ], correctOptionIds: ["b"], explanation: "Hand hygiene is the highest-leverage intervention. Eggs lodge under fingernails and are spread by hand-to-mouth, especially at night when children scratch and put fingers in their mouths." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Household members treated, ages, exclusions (pregnant/breastfeeding/under 2), hygiene counselling delivered, GP-informed if relevant — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the whole-household approach was applied and excluded household members were appropriately referred." },
  ],
};
