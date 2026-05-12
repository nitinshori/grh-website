// Eczema (atopic) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const eczemaModule: TrainingModule = {
  slug: "eczema",
  title: "Atopic Eczema — PGD",
  description: "Severity-led supply of topical corticosteroids and emollients for atopic eczema under PGD.",
  pgdSlugs: ["eczema"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Eczema — Training", subtitle: "Atopic eczema in adults and older children", estimatedMinutes: 10, objectives: [
      "Grade eczema severity and select topical corticosteroid potency.",
      "Recognise eczema herpeticum and secondary infection as red flags.",
      "Counsel on emollient use, steroid technique, and the rebound trap.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Atopic eczema is a chronic relapsing inflammatory skin condition characterised by itchy, dry, erythematous skin with a tendency to lichenification. Often associated with asthma, allergic rhinitis, food allergy.",
      "Distribution: flexures (elbows, knees, neck) in older children/adults; face and extensors in infants. Diagnosis is clinical — itch is essential.",
      "Treatment pyramid: emollients always; topical corticosteroids for flares; tacrolimus / pimecrolimus for face-sensitive areas (specialist); systemic therapy (dupilumab, methotrexate) for severe (specialist).",
    ], highlights: ["Emollients are the base — used even when skin looks clear.", "Match steroid potency to body site and severity.", "Acute spreading vesicles in eczema = eczema herpeticum, emergency."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 12–65", detail: "Younger children refer — paediatric eczema specialist territory under PGD." },
      { label: "Diagnosed atopic eczema OR classic presentation", detail: "Flexural distribution, chronic itch, atopic history." },
      { label: "Mild to moderate severity", detail: "Severe widespread, infected, or eczema herpeticum — refer." },
      { label: "No infection signs", detail: "Yellow crusts, pus, fever, spreading vesicles — see red-flag slide." },
      { label: "Not currently on systemic immunosuppression for eczema", detail: "Refer to specialist." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer urgently", tone: "danger", message: "Refer for any of these.", detail: [
      "Eczema herpeticum — spreading vesicles, unwell, fever. DERMATOLOGY EMERGENCY.",
      "Bacterially infected eczema (golden crusts, pus, cellulitis) — may need oral antibiotics.",
      "Eczema on face requiring potent steroid — face PGD scope is mild only.",
      "Severe widespread eczema or erythroderma.",
      "First-presentation eczema in adult without obvious atopy — exclude other dermatoses.",
      "Eczema unresponsive to potent topical steroid + emollient regimen.",
      "Pregnancy — adjust potency choice; refer for severe.",
    ]},
    { id: "treatment", type: "comparison", title: "Steroid potency selection", intro: "Match potency to site and severity. Always with emollient.", columns: [
      { label: "Face / flexures / genitals — gentle skin", rows: [
        { heading: "Mild flare", body: "Hydrocortisone 1% (mild)." },
        { heading: "Moderate flare", body: "Clobetasone butyrate 0.05% (Eumovate, moderate)." },
        { heading: "Severe on face", body: "Refer — consider tacrolimus." },
        { heading: "Duration", body: "Apply once or twice daily for up to 7 days; longer = refer." },
      ]},
      { label: "Trunk / limbs", rows: [
        { heading: "Mild flare", body: "Hydrocortisone 1% or clobetasone 0.05%." },
        { heading: "Moderate", body: "Betamethasone valerate 0.025% (Betnovate-RD) or 0.1% (Betnovate)." },
        { heading: "Severe", body: "Mometasone furoate 0.1% OR betamethasone valerate 0.1%. Maximum 2 weeks, then step down." },
        { heading: "Duration", body: "Up to 2 weeks active flare, then weekend-only maintenance if needed." },
      ]},
      { label: "Emollient — always", rows: [
        { heading: "Choice", body: "Patient preference. Ointments more occlusive; creams less greasy. Avoid SLS-containing soaps and emollients." },
        { heading: "Amount", body: "Generous: 500g per week for an adult is reasonable for whole-body use." },
        { heading: "Frequency", body: "At least 2–3 times daily, even when skin is clear. Within 3 minutes of bathing." },
        { heading: "Combination with steroid", body: "Apply emollient ≥30 minutes before or after steroid (don't dilute the steroid)." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling — every patient", items: [
      { label: "Emollient is the base — daily, forever", detail: "Even when skin is clear. Most patients under-use emollient and over-use steroid." },
      { label: "Fingertip unit (FTU) for steroid dosing", detail: "1 FTU = amount squeezed from tip to first crease = covers 2 adult palms of skin. Counsel on amounts." },
      { label: "Apply steroid thinly to active areas", detail: "Not the whole body — only inflamed/itchy areas. Once or twice daily." },
      { label: "Duration limits", detail: "Mild steroid: up to 2 weeks. Moderate: up to 2 weeks then step down. Potent: max 2 weeks, then taper or refer." },
      { label: "Avoid triggers", detail: "Soap (use emollient as wash), wool against skin, overheating, heavily fragranced products. House dust mite measures if relevant." },
      { label: "Steroid phobia counselling", detail: "Many patients fear topical steroids. Explain the rebound risk of UNDER-treatment (chronic inflammation) is greater than the short-term skin-thinning risk of correct steroid use." },
      { label: "Recognise infection", detail: "Yellow crusts, pus, fever, spreading rapidly — return urgently." },
      { label: "Recognise eczema herpeticum", detail: "Sudden cluster of monomorphic vesicles, especially with feeling unwell — A&E or out-of-hours emergency." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — refer urgently", tone: "danger", message: "These can be sight- or life-threatening.", detail: [
      "Eczema herpeticum: monomorphic vesicles/pustules spreading on eczematous skin, fever, malaise. A&E.",
      "Bacterial superinfection: spreading erythema, fever, lymphangitis, golden crusts unresponsive to topical alone.",
      "Failure to respond to potent steroid + emollient.",
      "Severe widespread eczema, erythroderma (>90% body involvement).",
      "Eczema affecting ability to work, sleep, or function — refer for systemic therapy consideration.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Emollient = daily base. Steroid = flare control.",
      "Match potency to site: face mild, body moderate-potent.",
      "Fingertip unit (FTU) = covers 2 palm areas. Apply thinly to active areas only.",
      "Eczema herpeticum = emergency, A&E.",
      "Counsel against steroid phobia — under-treatment is the bigger risk.",
    ]},
  ],
  quiz: [
    { id: "q-herpeticum", type: "single-choice", critical: true, question: "Patient with eczema reports new cluster of small vesicles spreading rapidly, feels feverish. Action?", options: [
      { id: "a", label: "Apply more steroid." }, { id: "b", label: "Refer to A&E — eczema herpeticum is a dermatological emergency." }, { id: "c", label: "Supply topical aciclovir." }, { id: "d", label: "Increase emollient." }
    ], correctOptionIds: ["b"], explanation: "Eczema herpeticum can be life-threatening. Needs IV antivirals and urgent specialist care. Never apply more steroid to vesicles." },
    { id: "q-face-potent", type: "single-choice", critical: true, question: "Patient asks for betamethasone 0.1% (potent steroid) for eczema on her face. Action?", options: [
      { id: "a", label: "Supply as requested." }, { id: "b", label: "Don't supply potent steroid for face. Face = mild only (hydrocortisone 1%) or moderate (clobetasone) maximum. Skin atrophy and rosacea-like changes follow potent steroid on face." }, { id: "c", label: "Supply at half strength." }, { id: "d", label: "Supply for 1 week only." }
    ], correctOptionIds: ["b"], explanation: "Facial skin is thin; potent steroids cause atrophy, telangiectasia, and rosacea-like changes. Face = mild potency only under PGD." },
    { id: "q-infected", type: "single-choice", critical: true, question: "Eczema with weeping yellow crusts, swelling, mild fever. Action?", options: [
      { id: "a", label: "More steroid." }, { id: "b", label: "Refer for assessment — likely bacterial superinfection (often Staph aureus), may need oral antibiotic alongside topical management." }, { id: "c", label: "Stop emollient." }, { id: "d", label: "Apply moisturiser only." }
    ], correctOptionIds: ["b"], explanation: "Infected eczema needs antibiotics (oral flucloxacillin commonly). Doesn't fit the simple eczema PGD." },
    { id: "q-ftu", type: "single-choice", critical: true, question: "What does one fingertip unit (FTU) cover?", options: [
      { id: "a", label: "Whole body." }, { id: "b", label: "Approximately 2 adult palms of skin area." }, { id: "c", label: "The entire face." }, { id: "d", label: "One finger." }
    ], correctOptionIds: ["b"], explanation: "FTU = adult fingertip dose from tip to first crease, covers ~2 adult palm areas. Used to teach appropriate dosing." },
    { id: "q-emollient-frequency", type: "single-choice", question: "How often should an eczema patient apply emollient?", options: [
      { id: "a", label: "Only when itchy." }, { id: "b", label: "At least 2–3 times daily, even when skin is clear. Don't stop when skin looks good." }, { id: "c", label: "Once a week." }, { id: "d", label: "Only at night." }
    ], correctOptionIds: ["b"], explanation: "Emollient is daily maintenance, not just flare treatment. Continuous use reduces flares." },
    { id: "q-steroid-phobia", type: "single-choice", question: "Patient is afraid of using topical steroids because of internet warnings. What's the correct counselling?", options: [
      { id: "a", label: "Agree and recommend emollient only." }, { id: "b", label: "Discuss balance: short courses of appropriate-potency steroid for flares are safer than chronic unresolved inflammation. Reassure on safety of correct use. Skin atrophy is a risk of over-use, not standard use." }, { id: "c", label: "Switch to oral steroid." }, { id: "d", label: "Tell them to use double strength." }
    ], correctOptionIds: ["b"], explanation: "Steroid phobia is a major cause of under-treatment and chronic eczema. Counsel reassuringly on correct use." },
    { id: "q-duration", type: "single-choice", question: "Patient asks how long she can use moderate steroid on her arms.", options: [
      { id: "a", label: "Indefinitely." }, { id: "b", label: "Up to 2 weeks of active treatment for a flare, then step down or use weekend-only maintenance. If needed beyond 2 weeks, return for review." }, { id: "c", label: "Maximum 1 day." }, { id: "d", label: "3 months." }
    ], correctOptionIds: ["b"], explanation: "Topical steroid courses are time-limited. Beyond 2 weeks at moderate potency, review or step down to weekend-only maintenance." },
    { id: "q-soap", type: "single-choice", question: "Patient asks if she can use her usual scented body wash.", options: [
      { id: "a", label: "Yes." }, { id: "b", label: "Switch to using emollient as a soap substitute, or fragrance-free wash. Standard soaps and SLS-containing washes worsen eczema by stripping the skin barrier." }, { id: "c", label: "Use bar soap only." }, { id: "d", label: "Use stronger soap." }
    ], correctOptionIds: ["b"], explanation: "Soaps and detergents strip skin lipids and worsen eczema. Emollient-as-wash or fragrance-free wash is the standard advice." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient with eczema flare. Action?", options: [
      { id: "a", label: "Refuse all treatment." }, { id: "b", label: "Refer to GP/midwife. Mild topical steroids (hydrocortisone 1%) are generally considered safe in pregnancy but should be initiated by GP/midwife. Emollients freely available." }, { id: "c", label: "Supply oral steroid." }, { id: "d", label: "Supply potent topical steroid." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy outside PGD. Mild steroids generally safe in pregnancy but GP/midwife should initiate. Emollients OK." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Distribution, severity, exclusion of infection / herpeticum, agent and potency rationale, emollient prescribed, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Documenting that infection and herpeticum were considered and excluded is key." },
  ],
};
