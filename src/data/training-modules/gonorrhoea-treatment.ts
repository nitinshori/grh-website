// Gonorrhoea treatment — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const gonorrhoeaTreatmentModule: TrainingModule = {
  slug: "gonorrhoea-treatment",
  title: "Gonorrhoea Treatment — PGD",
  description: "Supply of ceftriaxone IM for uncomplicated gonorrhoea in adults under PGD, with partner-notification considerations.",
  pgdSlugs: ["gonorrhoea-treatment"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Gonorrhoea — Training", subtitle: "Single-dose ceftriaxone IM treatment under PGD", estimatedMinutes: 12, objectives: [
      "Identify patients eligible for empirical gonorrhoea treatment under the PGD.",
      "Apply correct ceftriaxone IM dosing technique.",
      "Coordinate STI testing, partner notification, and test-of-cure per BASHH guidance.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Gonorrhoea (Neisseria gonorrhoeae) is a common STI with rising antimicrobial resistance. Symptoms: urethral discharge, dysuria (men); often asymptomatic in women (or vaginal discharge, intermenstrual bleeding, pelvic pain).",
      "Modern UK guidance (BASHH): ceftriaxone 1 g IM single dose for uncomplicated infection at any site. Always combined with confirmed test (NAAT) and culture for resistance monitoring.",
      "Partner notification, test-of-cure, and full STI screen are mandatory adjuncts.",
    ], highlights: ["Ceftriaxone 1 g IM single dose — current first-line.", "Test of cure mandatory due to resistance.", "Partner notification and full STI screen alongside."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16+", detail: "Under 16 — refer GUM clinic with safeguarding considerations." },
      { label: "Confirmed gonorrhoea (positive NAAT) OR contact of confirmed case", detail: "Empirical treatment for symptomatic patient is acceptable if NAAT in process. Self-diagnosed or unconfirmed — refer to GUM." },
      { label: "Uncomplicated infection", detail: "Urethral, cervical, rectal, pharyngeal sites. PID, epididymo-orchitis, disseminated gonococcal infection — refer." },
      { label: "Not pregnant", detail: "Refer to GUM / antenatal team for management." },
      { label: "No allergy to cephalosporins or severe penicillin allergy", detail: "Cross-reactivity risk. Refer to GUM for alternative regimen." },
      { label: "Able to attend follow-up", detail: "Test-of-cure 2 weeks after treatment is mandatory." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer to GUM", tone: "danger", message: "These need specialist input.", detail: [
      "Severe cephalosporin or penicillin allergy.",
      "Pregnancy or breastfeeding.",
      "Pelvic inflammatory disease (PID) — pelvic pain, fever, dyspareunia, abnormal bleeding.",
      "Epididymo-orchitis — testicular pain/swelling.",
      "Disseminated gonococcal infection — fever, skin lesions, joint involvement.",
      "Treatment failure (test-of-cure positive).",
      "Recurrent gonorrhoea (probable resistance / reinfection patterns).",
      "Suspected co-infection with other STIs requiring concurrent treatment beyond doxycycline for chlamydia.",
      "Sexual assault — needs SARC pathway.",
      "Under 16 — safeguarding.",
    ]},
    { id: "treatment", type: "checklist", title: "Treatment regimen", intro: "Per BASHH 2024+.", items: [
      { label: "Ceftriaxone 1 g IM single dose", detail: "Reconstitute with 3.5 mL of 1% lidocaine (reduces injection pain — important counselling). Inject deep IM into upper outer gluteal quadrant or thigh." },
      { label: "Chlamydia co-infection coverage", detail: "Many patients co-infected. Doxycycline 100 mg BD for 7 days alongside ceftriaxone (covers chlamydia + may also help non-gonococcal urethritis). Per BASHH, dual treatment generally given." },
      { label: "If pharynx involved", detail: "Same single-dose ceftriaxone — but test-of-cure 14 days after is mandatory because pharyngeal infections have lower cure rates." },
      { label: "Abstain from sex", detail: "For 7 days after treatment AND until partners treated." },
    ]},
    { id: "follow-up", type: "checklist", title: "Follow-up and adjuncts", intro: "All mandatory.", items: [
      { label: "Test of cure (TOC)", detail: "At 2 weeks after treatment. NAAT for asymptomatic; symptomatic = culture too if symptoms persist. Pharyngeal cases especially important — resistance / failure more common." },
      { label: "Full STI screen", detail: "HIV, syphilis, chlamydia, hepatitis B/C if not done. If not previously screened, refer to GUM." },
      { label: "Partner notification", detail: "All sexual contacts in past 60 days (or last partner if longer). GUM has formal contact-tracing pathways — refer for partner notification." },
      { label: "Repeat testing in 3 months", detail: "Re-infection rate is high (~20%). Encourage repeat STI screen at 3 months." },
      { label: "Counselling", detail: "Mode of transmission, safer-sex practices, condom use, vaccination (Hep B), HIV PrEP awareness if at risk." },
      { label: "Document GUM coordination", detail: "Inform local GUM clinic; many areas have direct referral pathways." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer urgently", tone: "danger", message: "These need urgent care.", detail: [
      "Disseminated gonococcal infection — fever, joint swelling, skin lesions — A&E.",
      "PID with severe pelvic pain, fever — urgent gynae review.",
      "Epididymo-orchitis with severe pain — exclude torsion, A&E.",
      "Suspected sexual assault — SARC pathway.",
      "Treatment failure (positive TOC) — GUM urgently.",
      "Severe injection-site reaction or anaphylaxis.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Ceftriaxone 1 g IM single dose, reconstituted with lidocaine.",
      "Dual with doxycycline 100 mg BD x 7 days for chlamydia cover.",
      "Test of cure at 2 weeks mandatory — resistance monitoring.",
      "Full STI screen, partner notification (60 days), abstain 7 days.",
      "Refer GUM: complications, pregnancy, severe allergy, failure, under 16.",
      "Document GUM coordination.",
    ]},
  ],
  quiz: [
    { id: "q-allergy", type: "single-choice", critical: true, question: "Patient with severe penicillin allergy (anaphylaxis). Wants gonorrhoea treatment. Action?", options: [
      { id: "a", label: "Supply ceftriaxone." }, { id: "b", label: "Refer to GUM. Severe penicillin allergy increases cephalosporin cross-reactivity risk; GUM uses alternative regimens (e.g. gentamicin + azithromycin in some scenarios)." }, { id: "c", label: "Half dose." }, { id: "d", label: "Oral cefixime." }
    ], correctOptionIds: ["b"], explanation: "Severe penicillin allergy = cross-reactivity risk with cephalosporins. GUM specialist guidance for alternative regimen." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient diagnosed with gonorrhoea. Action?", options: [
      { id: "a", label: "Supply ceftriaxone." }, { id: "b", label: "Refer to GUM / antenatal care. Pregnancy-specific monitoring and treatment pathway needed; also concern about neonatal ophthalmia at delivery." }, { id: "c", label: "Half dose." }, { id: "d", label: "Oral azithromycin." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy needs specialist input. Neonatal ophthalmia is a serious complication if untreated at delivery." },
    { id: "q-pid", type: "single-choice", critical: true, question: "Female patient with gonorrhoea NAAT positive, has pelvic pain, fever, abnormal bleeding. Action?", options: [
      { id: "a", label: "Ceftriaxone." }, { id: "b", label: "Refer urgently — clinical PID. Needs broader-spectrum antibiotics (e.g. ceftriaxone + doxycycline + metronidazole for 14 days), pelvic ultrasound, possible admission." }, { id: "c", label: "Single-dose ceftriaxone alone." }, { id: "d", label: "Oral antibiotic only." }
    ], correctOptionIds: ["b"], explanation: "PID needs longer broader-spectrum treatment; single-dose ceftriaxone alone is insufficient. Refer urgent gynae / GUM." },
    { id: "q-toc", type: "single-choice", critical: true, question: "When should test of cure be performed?", options: [
      { id: "a", label: "Never necessary." }, { id: "b", label: "Mandatory at 2 weeks after treatment. Especially important for pharyngeal infection. Resistance is rising; missed failure perpetuates transmission." }, { id: "c", label: "Only if symptoms persist." }, { id: "d", label: "At 6 months." }
    ], correctOptionIds: ["b"], explanation: "Test of cure at 2 weeks is mandatory under BASHH due to rising resistance. Important for pharyngeal site especially." },
    { id: "q-dual", type: "single-choice", question: "Why is doxycycline often co-prescribed with ceftriaxone for gonorrhoea?", options: [
      { id: "a", label: "Extends gonorrhoea coverage." }, { id: "b", label: "Covers concurrent chlamydia (high co-infection rate, ~30%) and non-gonococcal urethritis." }, { id: "c", label: "Reduces injection pain." }, { id: "d", label: "Prophylaxis for partners." }
    ], correctOptionIds: ["b"], explanation: "Co-infection with chlamydia is common. Doxycycline 100 mg BD x 7 days covers it efficiently. Per BASHH dual treatment is standard." },
    { id: "q-partner", type: "single-choice", question: "Patient treated for gonorrhoea — partner notification window?", options: [
      { id: "a", label: "Past 7 days." }, { id: "b", label: "Past 60 days (or last partner if longer ago). GUM has formal contact-tracing pathways." }, { id: "c", label: "Past year." }, { id: "d", label: "Current partner only." }
    ], correctOptionIds: ["b"], explanation: "BASHH guidance: 60-day window for partner notification (or last partner if longer). GUM handles structured contact tracing." },
    { id: "q-abstain", type: "single-choice", question: "How long should the patient abstain from sex after treatment?", options: [
      { id: "a", label: "Until pain settles." }, { id: "b", label: "At least 7 days after treatment AND until all partners have been treated." }, { id: "c", label: "Until test of cure negative." }, { id: "d", label: "1 month." }
    ], correctOptionIds: ["b"], explanation: "7 days post-treatment + until partners treated. Prevents re-infection and onward transmission." },
    { id: "q-failure", type: "single-choice", question: "Patient's test of cure is positive 2 weeks after ceftriaxone. Action?", options: [
      { id: "a", label: "Repeat ceftriaxone." }, { id: "b", label: "Refer to GUM urgently — possible treatment failure / resistance / re-infection. Needs culture, antimicrobial sensitivity testing, and individualised treatment." }, { id: "c", label: "Higher dose." }, { id: "d", label: "Oral azithromycin." }
    ], correctOptionIds: ["b"], explanation: "Positive TOC = failure or re-infection. Needs GUM assessment and culture-guided treatment." },
    { id: "q-injection-pain", type: "single-choice", question: "Why is ceftriaxone reconstituted with 1% lidocaine?", options: [
      { id: "a", label: "For better absorption." }, { id: "b", label: "Reduces injection pain — ceftriaxone IM is otherwise very painful. Counsel patient pre-emptively." }, { id: "c", label: "Improves potency." }, { id: "d", label: "Faster onset." }
    ], correctOptionIds: ["b"], explanation: "Ceftriaxone IM in water/saline is significantly painful. Lidocaine reconstitution is standard practice for tolerability." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Confirmed diagnosis (NAAT) or contact-of-case status, sites involved, dual antibiotic regimen, TOC plan, partner notification referred to GUM, abstinence advice, full STI screen status — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the full BASHH-aligned package was delivered, not just the antibiotic." },
  ],
};
