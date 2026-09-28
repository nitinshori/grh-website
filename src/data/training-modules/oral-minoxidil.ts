// Pattern Hair Loss (Low-Dose Oral Minoxidil), PGD training
//
// Source: Get Real Health PGD "Pattern Hair Loss (Low-Dose Oral Minoxidil)",
// version 001, valid from 28 September 2026. Content in this module is drawn
// from that document only.

import type { TrainingModule } from "./types";

export const oralMinoxidilModule: TrainingModule = {
  slug: "oral-minoxidil",
  title: "Pattern Hair Loss (Low-Dose Oral Minoxidil), PGD training",
  description:
    "Off-label supply of minoxidil 2.5 mg tablets at low dose for androgenetic alopecia in men and women aged 18 to 65: diagnosis, cardiovascular screening, blood pressure technique, dosing, supply cadence, stop rules and consent.",
  pgdSlugs: ["oral-minoxidil"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "Dr Nitin Shori, Medical Director, and Chris Pilkington, Head Pharmacist",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-09-28",
  estimatedMinutes: 25,
  passMark: 0.8,

  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Low-Dose Oral Minoxidil, PGD training",
      subtitle:
        "Off-label supply of minoxidil 2.5 mg tablets (Loniten) at 1.25 mg to 5 mg daily for androgenetic alopecia in adults aged 18 to 65",
      estimatedMinutes: 25,
      objectives: [
        "Explain to a patient, in plain language, that this supply is off-label, what the licence is for, and record their signed consent.",
        "Distinguish androgenetic alopecia from alopecia areata, telogen effluvium, frontal fibrosing and other scarring alopecia, tinea capitis, traction alopecia and hyperandrogenism, and refer every one of those.",
        "Apply the women's ferritin, thyroid and contraception rules before a first supply.",
        "Screen out every cardiovascular exclusion and every excluded medicine.",
        "Measure seated and standing blood pressure and pulse to the PGD method and apply the limits, the repeat reading and the single return visit.",
        "Apply the dose table, the one-step increase rules, the reduction rules and the 8-week supply count with prescriber review after six supplies.",
        "Apply the cardiovascular stop rule and the referral urgencies, counsel on hypertrichosis, and keep the record and GP notification the PGD requires.",
      ],
    },
    {
      id: "scope",
      type: "content",
      title: "What this PGD is for, and who may use it",
      body: [
        "This PGD authorises a registered pharmacist, face to face on the pharmacy premises, to supply minoxidil 2.5 mg tablets (Loniten) at low dose to an adult aged 18 to 65 with androgenetic alopecia (male or female pattern hair loss). It is a private service and it is OFF-LABEL: minoxidil tablets are licensed for severe hypertension only.",
        "Pharmacists only. This PGD is not used by pharmacy technicians. The diagnosis, the cardiovascular screen and the off-label consent are the pharmacist's. There is no remote or telephone consultation: the scalp is examined and the blood pressure measured on the premises by the pharmacist who supplies.",
        "Age is 18 to 65 inclusive at every supply. A patient who turns 66 during treatment finishes the supply in hand and is then referred to a prescriber. The patient must be registered with a GP and must agree to the GP being informed; a patient who will not allow the GP to be told is not supplied.",
        "Oral minoxidil may be used with topical minoxidil, or in men alongside finasteride under the Male Pattern Hair Loss PGD. Tell the patient the oral and topical products are the same drug and that stopping the topical product once the oral is established is reasonable.",
      ],
      highlights: [
        "Pharmacist only, face to face, on the premises.",
        "Ages 18 to 65 at every supply.",
        "Only the 2.5 mg tablet is used. The 5 mg and 10 mg tablets are not used under this PGD.",
        "GP registration and GP notification are conditions of supply.",
      ],
    },
    {
      id: "off-label",
      type: "callout",
      title: "This is an off-label supply",
      tone: "danger",
      message:
        "Minoxidil tablets are licensed for severe hypertension only, at 5 mg to 100 mg daily with a diuretic and a beta-blocker. Use for hair loss at 1.25 mg to 5 mg daily, taken alone, is off-label. No UK national guideline recommends it. The patient must be told this, why it is being used, and what the licence is for, and must consent on that basis.",
      detail: [
        "The basis for authorising it under this PGD is the practice of dermatologists set out in the 2024 international consensus statement, the published safety series of 1,404 patients and the 2024 randomised trial. NICE MPG2 permits off-label use under a PGD where it is justified by best clinical practice and the PGD says so.",
        "The consent script under Counselling is the minimum. The patient signs the consent statement on the consultation record, and the record says so.",
        "The record carries the words: off-label supply under Get Real Health PGD Pattern Hair Loss (Low-Dose Oral Minoxidil), version 001.",
        "The patient information leaflet describes the licensed use for blood pressure. Tell the patient that is why.",
        "A patient who does not accept off-label treatment after the explanation is not supplied. Offer the licensed alternatives: topical minoxidil 5%, and for men finasteride under the Male Pattern Hair Loss PGD.",
        "Because this is an off-label use, report every cardiovascular adverse event via Yellow Card, however minor.",
      ],
    },
    {
      id: "consent-script",
      type: "content",
      title: "The off-label consent script",
      body: [
        "The PGD sets out a script to be given in substance and recorded. In the words of the PGD: Minoxidil tablets are licensed in the UK to treat severe high blood pressure, at higher doses than this and alongside other heart medicines. Using a low dose on its own for hair loss is not covered by the licence and no UK guideline recommends it yet. Skin specialists use it this way; an international expert group published guidance on it in 2024, and a study of 1,400 patients found it generally well tolerated, with extra body hair the commonest side effect.",
        "The script continues: Because it lowers blood pressure, we check your blood pressure, pulse and weight at every visit, there are heart symptoms you must stop for, and after six supplies (about eleven months) a doctor must review you before we can continue. The licensed alternatives are minoxidil lotion or foam on the scalp and, for men, finasteride tablets. Are you happy to go ahead on that basis?",
        "The patient then signs the consent statement on the consultation record (Appendix 3). That statement confirms they were told the tablets are licensed for severe high blood pressure and not for hair loss, that the supply is off-label, why it is being used, the alternatives, that blood pressure, pulse and weight are checked at every supply, the symptoms to stop for, that extra body or facial hair is the commonest side effect, that a doctor must review them after six supplies, and (women) that they must not become pregnant while taking it, and that they consent to the GP being informed.",
      ],
      highlights: [
        "Licence: severe high blood pressure, higher doses, with other heart medicines.",
        "Basis: dermatologist practice, 2024 consensus, 1,400 patient study.",
        "Checks: BP, pulse and weight every visit; heart symptoms to stop for; doctor review after six supplies.",
        "Alternatives: topical minoxidil, and finasteride for men.",
        "Signed consent statement on the record.",
      ],
    },
    {
      id: "diagnosis",
      type: "content",
      title: "The diagnosis: androgenetic alopecia on examination today",
      body: [
        "The diagnosis is clinical and is made on examination of the scalp today, with the hair parted, on the premises. Androgenetic alopecia is gradual onset over months or years. In men: bitemporal recession and vertex thinning. In women: diffuse thinning over the crown with the frontal hairline preserved. The scalp is normal: no redness, scale, scarring, pustules, pain or itch; follicular openings are present; no patches of complete loss.",
        "At the first supply a gentle pull on a bundle of about 50 to 60 hairs must release fewer than 6 hairs. Six or more hairs, or heavy diffuse shedding, is an exclusion at the first supply. The expected shedding in the first 12 weeks of treatment is not an exclusion at review; heavy shedding persisting beyond 12 weeks of treatment is, and is referred for diagnosis.",
        "Baseline photographs are taken and stored in the record with the patient's consent: the crown from above and the frontal hairline from the front, hair parted in the midline, same room lighting. They are repeated in the same way at supply visits 4 and 6.",
        "Hair loss that began or worsened within 12 months of childbirth, a serious illness, major surgery, rapid weight loss or starting a medicine known to cause hair loss is an exclusion. Refer to the GP. Where the pattern is not androgenetic, refer for diagnosis rather than offering any treatment: scarring alopecia, alopecia areata and tinea capitis need a diagnosis first.",
      ],
      highlights: [
        "Gradual onset, typical pattern, normal scalp, follicular openings present.",
        "Pull test: fewer than 6 hairs from about 50 to 60 at the first supply.",
        "Baseline photographs, repeated at supply visits 4 and 6.",
        "Every mimic in Appendix 2 is a referral, not a supply.",
      ],
    },
    {
      id: "differential",
      type: "comparison",
      title: "Is it androgenetic alopecia? The Appendix 2 differential",
      intro:
        "Supply only where the picture is androgenetic and the rest of the PGD allows. Every other pattern below is a referral to the GP.",
      columns: [
        {
          label: "Androgenetic alopecia (supply where the PGD allows)",
          rows: [
            { heading: "Onset", body: "Gradual, over months or years." },
            { heading: "Men", body: "Recession at the temples and thinning at the crown (Hamilton-Norwood pattern)." },
            { heading: "Women", body: "Widening of the central parting and thinning over the crown with the frontal hairline kept (Ludwig pattern)." },
            { heading: "Scalp", body: "Looks normal with the hair parted; follicular openings present; no scale, redness, pustules, pain or itch." },
            { heading: "Pull test", body: "Releases no more than a few hairs (fewer than 6 from about 50 to 60 at the first supply)." },
          ],
        },
        {
          label: "The mimics (refer, do not supply)",
          rows: [
            { heading: "Alopecia areata", body: "One or more smooth round or oval patches of complete loss, sometimes with short exclamation mark hairs at the edge; may involve eyebrows, beard or nails. Onset over days to weeks." },
            { heading: "Telogen effluvium", body: "Diffuse shedding all over the scalp, handfuls of hair on washing or brushing, positive pull test, typically 2 to 4 months after childbirth, serious illness, an operation, rapid weight loss, iron deficiency, thyroid disease or a new medicine. Needs the cause found." },
            { heading: "Frontal fibrosing alopecia", body: "Most often women over 40. Band-like recession of the frontal and temporal hairline, pale smooth skin behind the new hairline with the follicular openings gone, loss of the eyebrows, sometimes redness or scale around remaining hairs. Easily mistaken for female pattern loss; the preserved frontal hairline of true female pattern loss is the difference." },
            { heading: "Other scarring alopecia", body: "Patches where the skin is smooth and shiny with no follicular openings, often with redness, scale, pustules, pain or itch." },
            { heading: "Tinea capitis", body: "Scaly patches with broken hairs, sometimes swollen boggy areas; mostly in children but seen in adults; may be contagious." },
            { heading: "Traction alopecia", body: "Thinning along the margins where hair is pulled by tight styles, braids or extensions." },
            { heading: "Hyperandrogenism in a woman", body: "Hair loss with hirsutism, new or worsening acne, irregular or absent periods, a deepening voice, or a diagnosis of polycystic ovary syndrome. Needs assessment, and the hypertrichosis of minoxidil is a particular problem for these women." },
          ],
        },
      ],
    },
    {
      id: "women",
      type: "checklist",
      title: "Women: ferritin, thyroid and contraception before a first supply",
      intro:
        "Iron deficiency and thyroid disease cause diffuse hair loss that looks like the female pattern and are treated differently, so a woman needs results before she is supplied. Minoxidil is not recommended in pregnancy (neonatal hypertrichosis has been reported) and is excreted in milk.",
      items: [
        { label: "Ferritin 30 micrograms/L or more", detail: "Tested within the last 12 months by the NHS or a private laboratory, seen by the pharmacist (NHS App, GP letter or laboratory report) and recorded with the value and date. A ferritin below 30 is referred to the GP for treatment first." },
        { label: "Thyroid stimulating hormone within the laboratory reference range", detail: "Same 12-month window, same evidence, recorded with the value and date. A TSH outside the range, or a thyroid or iron problem under investigation or not yet stable on treatment, is an exclusion." },
        { label: "No results: not supplied today", detail: "Advise her to ask her GP or to arrange a private test, and to return with the results." },
        { label: "Childbearing potential defined", detail: "Any woman who is not post-menopausal (12 months without periods after the age of 45 with no other cause) and not permanently sterilised. Absence of periods because of contraception, breastfeeding or recent childbirth does not remove childbearing potential." },
        { label: "Not pregnant, not breastfeeding, not planning a pregnancy", detail: "Not pregnant on her own account with the last menstrual period recorded; not breastfeeding; not planning a pregnancy during treatment. Any of these is an exclusion." },
        { label: "Using contraception she agrees to continue", detail: "Accepted: any hormonal method, an intrauterine device or system, sterilisation or a vasectomised partner, or consistent condom use where she declines another method. Fertility awareness or withdrawal alone are not accepted. Record the method. She agrees to tell the pharmacy if she stops." },
        { label: "Something obviously wrong with her method", detail: "For example combined hormonal contraception with migraine with aura: no first supply until her prescriber has reviewed the method and she attends with the outcome. At a continuation visit, supply may continue on the existing method provided she is seen about it within 4 weeks and the referral is recorded." },
        { label: "Method stopped or changed", detail: "She must tell the pharmacy and confirm the replacement method before she continues minoxidil. Without contraception she stops minoxidil." },
        { label: "No hyperandrogenism", detail: "Hirsutism, new acne, irregular periods, a deepening voice or a diagnosis of polycystic ovary syndrome: refer to the GP, do not supply." },
      ],
    },
    {
      id: "cv-exclusions",
      type: "callout",
      title: "Cardiovascular exclusions: refer, do not supply",
      tone: "warning",
      message:
        "The exclusions are cardiovascular by design. Minoxidil lowers blood pressure, and the SmPC warns of salt and water retention, tachycardia, pericarditis and pericardial effusion. Any of the following means no supply.",
      detail: [
        "ANY CARDIOVASCULAR DISEASE: ischaemic heart disease or angina, previous myocardial infarction, heart failure, any arrhythmia including atrial fibrillation, valvular heart disease, cardiomyopathy, congenital heart disease, previous stroke or transient ischaemic attack, peripheral arterial disease, pulmonary hypertension, postural tachycardia syndrome or other orthostatic intolerance, or a history of pericarditis, pericardial effusion or pleural effusion.",
        "HYPERTENSION, whether treated, untreated or managed by lifestyle; or a reading today of 140 mmHg systolic or more, or 90 mmHg diastolic or more, on the lower of two seated readings and again on repeat.",
        "HYPOTENSION: on repeat, systolic below 90 mmHg, or systolic 90 to 99 with dizziness or faintness; on the single standing reading, a fall of 20 mmHg or more in systolic or 10 mmHg or more in diastolic, or symptoms on standing.",
        "Unexplained syncope at any time, or any syncope in the last 12 months. Resting pulse below 50 or above 100 on repeat.",
        "Phaeochromocytoma. Renal impairment (known eGFR below 60, chronic kidney disease stage 3 or worse, or dialysis), or hepatic impairment.",
        "Known anaemia not yet treated, any thyroid disease that is not stable on treatment, an eating disorder, or a body mass index below 18.5.",
        "Hypersensitivity to minoxidil (oral or topical) or any excipient; rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption.",
        "Already taking oral minoxidil from another source, or a course under this PGD stopped for a cardiovascular stop without a prescriber review since that confirms in writing that treatment may restart.",
      ],
    },
    {
      id: "excluded-medicines",
      type: "checklist",
      title: "Excluded medicines: any of these, for any indication, means no supply",
      intro:
        "The effect on blood pressure or heart rate is additive and the SmPC warns of excessive hypotension. Check every current medicine against this list and record that none is taken.",
      items: [
        { label: "Any antihypertensive" },
        { label: "Any beta-blocker", detail: "Including propranolol for anxiety or migraine." },
        { label: "Any calcium channel blocker" },
        { label: "Any diuretic", detail: "Including spironolactone." },
        { label: "An alpha-blocker", detail: "Tamsulosin, doxazosin, alfuzosin, prazosin." },
        { label: "A nitrate" },
        { label: "Sacubitril/valsartan" },
        { label: "Clonidine, moxonidine or methyldopa" },
        { label: "Daily tadalafil or any other phosphodiesterase-5 inhibitor taken daily", detail: "On-demand PDE5 inhibitors are a caution, not an exclusion: the effects add together and minoxidil's effect lasts for days, so there is no safe interval. Tell the patient light-headedness is possible, to sit or lie down if it happens, and not to take a second PDE5 dose that day." },
        { label: "An SGLT2 inhibitor", detail: "Dapagliflozin, empagliflozin, canagliflozin, ertugliflozin." },
        { label: "A stimulant", detail: "Methylphenidate, lisdexamfetamine, dexamfetamine, modafinil." },
        { label: "Regular pseudoephedrine or phenylephrine, or non-prescribed stimulant drug use" },
        { label: "A systemic corticosteroid", detail: "Because of salt and water retention." },
        { label: "Not excluded but handled under Cautions", detail: "A daily NSAID, a tricyclic antidepressant, a phenothiazine, pregabalin or gabapentin: measure the blood pressure with that in mind, warn about dizziness and swelling, and refer where in doubt. Diabetes on metformin, sulfonylureas, DPP-4 inhibitors, GLP-1 agonists or insulin, migraine, asthma, well-controlled epilepsy, stable treated hypothyroidism and depression are not exclusions in themselves." },
      ],
    },
    {
      id: "bp-technique",
      type: "content",
      title: "Blood pressure, pulse, weight and BMI at every supply",
      body: [
        "Blood pressure and pulse are measured at every supply, seated and standing, with a validated automatic monitor. Seated: after 5 minutes rest, two readings 1 to 2 minutes apart, with the lower recorded. Limits: systolic 100 to 139 mmHg and diastolic below 90 mmHg. Systolic 90 to 99 is acceptable only where the patient has no dizziness or faintness.",
        "Standing: a single reading after 1 minute standing. There must be no fall of 20 mmHg or more in systolic or 10 mmHg or more in diastolic, and no symptoms on standing. Resting pulse must be 50 to 100.",
        "Where a reading is outside these limits, a third seated reading after a further 5 minutes decides. Throughout the PGD, on repeat means that third reading. A patient outside the limits on repeat may return once on another day. Outside the limits again, they are referred to the GP for blood pressure assessment and not supplied. A reading of 140/90 or above on repeat is an exclusion, and the patient is advised to have their blood pressure assessed by the GP whatever they decide about hair loss: routinely for 140/90 to 179/119, the same day for 180/120 or above.",
        "Weight is measured at every supply on the pharmacy scales, in light clothing. Height and body mass index are measured at the first supply; a BMI below 18.5 is an exclusion. A weight gain of 2 kg or more since the previous supply is a cardiovascular stop. Patients on weight loss treatment can have that trigger masked by ongoing weight loss, so ask specifically about ankle swelling, tight shoes or rings and breathlessness at every supply, and treat new swelling as a cardiovascular stop whatever the scales say.",
        "The baseline reading is the lower seated systolic recorded at the first supply, or at the most recent restart. It matters later for the dose increase decision.",
      ],
      highlights: [
        "Seated: 5 minutes rest, two readings 1 to 2 minutes apart, lower recorded.",
        "Systolic 100 to 139, diastolic below 90. Systolic 90 to 99 only if no dizziness or faintness.",
        "Standing after 1 minute: no fall of 20 systolic or 10 diastolic, no symptoms.",
        "Pulse 50 to 100.",
        "Outside limits: third seated reading after 5 more minutes decides. One return visit on another day.",
        "Weight every supply; height and BMI at the first supply.",
      ],
    },
    {
      id: "dosing",
      type: "comparison",
      title: "The dose table: men and women",
      intro:
        "Starting doses follow the 2024 consensus. Only the 2.5 mg tablet is used. Never more than the step-up dose, never twice daily. Every supply is 8 weeks (56 days).",
      columns: [
        {
          label: "Men",
          rows: [
            { heading: "Starting dose", body: "2.5 mg (one tablet) once daily, at the same time each day, with or without food. 56 tablets per 8-week supply." },
            { heading: "One step up", body: "To 5 mg (two tablets) once daily. 112 tablets per 8-week supply. Available once in the patient's whole course under this PGD." },
            { heading: "One step down", body: "From 5 mg back to 2.5 mg, at any review, for hypertrichosis, headache, insomnia, gastrointestinal upset or another side effect the patient finds unacceptable that is not a stop symptom." },
            { heading: "If the starting dose is not tolerated", body: "Stop. That is not a cardiovascular stop; the patient may try the starting dose once more at a later date, after which the PGD does not apply." },
            { heading: "Finasteride", body: "Concurrent finasteride, under the Male Pattern Hair Loss PGD or prescribed elsewhere, is permitted. Record it and its source." },
          ],
        },
        {
          label: "Women",
          rows: [
            { heading: "Starting dose", body: "1.25 mg (half a tablet) once daily. Show the patient how to halve the tablet along the score line; a tablet splitter may be supplied. The other half is kept in the original blister or container and taken within 24 hours. 28 tablets per 8-week supply." },
            { heading: "One step up", body: "To 2.5 mg (one tablet) once daily. 56 tablets per 8-week supply. Available once in the patient's whole course under this PGD." },
            { heading: "One step down", body: "From 2.5 mg back to 1.25 mg, for the same non-cardiovascular side effects. A woman on 1.25 mg cannot step down and stops instead." },
            { heading: "Hypertrichosis", body: "Matters more to women. A woman who would find facial hair unacceptable may reasonably decline. At review it is a reason to step down where she is above the starting dose, or to stop where she is on 1.25 mg; it is not a cardiovascular stop and she may restart later." },
            { heading: "Pregnancy", body: "She must not become pregnant while taking it, must keep using contraception, and must stop the tablets before trying for a baby." },
          ],
        },
      ],
    },
    {
      id: "dose-increase",
      type: "checklist",
      title: "The one dose increase: every condition must be met",
      intro:
        "The increase is available once only, at or after the fourth supply visit, and once in the patient's whole course under this PGD. No patient has two increases. After a restart at the starting dose, a patient who had already used it may resume the higher dose at or after the fourth supply visit following the restart if the same conditions are met.",
      items: [
        { label: "At or after supply visit 4", detail: "About week 24 when the patient attends on time. Never before." },
        { label: "Response inadequate against the baseline photographs", detail: "Repeat photographs are taken at supply visit 4 in the same way as the baseline." },
        { label: "Starting dose tolerated with no stop symptom", detail: "No chest pain, breathlessness, palpitations, fainting, swelling, dizziness, faintness or 2 kg weight gain at any point." },
        { label: "No hypertrichosis the patient minds" },
        { label: "Today's systolic is 100 mmHg or more", detail: "Systolic 90 to 99 is acceptable for continuing supply if asymptomatic, but it is not enough for an increase." },
        { label: "Today's systolic is not more than 10 mmHg below the baseline reading", detail: "The baseline is the lower seated systolic at the first supply, or at the most recent restart." },
        { label: "Pulse within the limits", detail: "50 to 100." },
        { label: "Record and notify", detail: "Record the previous dose, the review findings that justified the change, and that the patient was told. Inform the GP of the dose change within 7 days." },
      ],
    },
    {
      id: "supply-cadence",
      type: "content",
      title: "Supply cadence: 8-week supplies, numbered, six maximum",
      body: [
        "Every supply is 8 weeks (56 days) and is numbered, with a review at each. The first supply is reviewed at 8 weeks, before it runs out: blood pressure, pulse, weight, side effects and adherence. Response is not assessed at that review. Continuation supplies follow at weeks 8, 16, 24, 32 and 40, each with a review recording blood pressure (seated, standing and any repeat), pulse and weight.",
        "Supply visit 4 (about week 24 when the patient attends on time) is a full review with repeat photographs and a response assessment. At supply visit 6 the pharmacist repeats the photographs and the full review and sends that record for the prescriber review, which must be complete before a seventh supply. The review is sought at visit 6 so that it is complete before the tablets run out. Tell the patient to hold their last week of tablets until the review is confirmed.",
        "MAXIMUM SIX SUPPLIES under this PGD (48 weeks), counted by supply number from the first supply and not reset by any gap or restart. The calendar date does not matter; the count does. Before any seventh supply, a prescriber (the patient's GP, or where the GP declines, a Get Real Health prescriber by face to face or video consultation) reviews the blood pressure, pulse and weight record, the photographs and the side effects, and confirms in writing that treatment may continue. A further period of up to six supplies may then follow with the same pattern. Six supplies completed without a documented prescriber review since is an exclusion.",
        "A gap of more than 4 weeks without tablets is a restart at the starting dose: the scalp re-examined and the pull test repeated as at a first supply, the medicines and cardiovascular history re-taken, a new baseline blood pressure recorded, and the supply count continued from where it was. A gap caused only by waiting for the prescriber review after supply 6 is not a restart provided the patient has been off tablets for no more than 8 weeks.",
        "For a continuation supply the patient must have had fewer than six supplies since the first (or since the last prescriber review), no gap of more than 4 weeks (or, after supply 6, no more than 8 weeks awaiting the review), today's blood pressure, pulse and weight within the limits, and none of the stop symptoms since the last visit. Missed dose: take it when remembered the same day, do not double up. Stopping needs no taper; hair regained is lost over 3 to 6 months.",
      ],
      highlights: [
        "Every supply 8 weeks, numbered, review at each.",
        "Visit 4: full review with repeat photographs. Visit 6: repeat photographs and send for prescriber review.",
        "Six supplies maximum, then written prescriber review before a seventh. Count not reset by gap or restart.",
        "Gap over 4 weeks: restart at the starting dose with new baseline BP. Awaiting review after supply 6: up to 8 weeks is not a restart.",
      ],
    },
    {
      id: "cv-stop",
      type: "callout",
      title: "The cardiovascular stop rule: one rule, no dose reduction",
      tone: "danger",
      message:
        "A weight gain of 2 kg or more since the previous supply, new ankle or facial swelling, dizziness or faintness, palpitations, chest pain, breathlessness or fainting, or blood pressure or pulse outside the limits on repeat, means STOP and refer. Dose reduction is not an option for these symptoms. No further supply under this PGD until a prescriber has reviewed the patient and confirmed in writing that treatment may restart.",
      detail: [
        "SAME DAY referral: chest pain, breathlessness, palpitations, fainting or facial swelling, or a blood pressure of 180 systolic or 120 diastolic or above.",
        "WITHIN A WEEK (routine GP): ankle swelling, a weight gain of 2 kg or more, dizziness or faintness, or a reading of 140 systolic or 90 diastolic or above on repeat.",
        "Tell every patient, and write it on the label and the record they take away: stop the tablets and seek medical help the same day for chest pain, breathlessness, palpitations, fainting or swelling of the face; stop and contact the pharmacy or GP within a week for ankle swelling, dizziness or faintness, or a weight gain of 2 kg or more.",
        "Before any restart after a cardiovascular stop, the prescriber review must be face to face (the GP, or a Get Real Health prescriber in person) with examination for oedema and a repeat blood pressure, and the written confirmation must say the symptom has resolved off treatment. The restart is then at the starting dose whatever the dose before the stop. Tablets are not resumed in the meantime. The pharmacist holds the written confirmation in the record.",
        "At a restart, the weight and symptom comparison starts afresh from today's values.",
        "Hypertrichosis, headache, insomnia and gastrointestinal upset are not cardiovascular stops; they are managed by one step down to the starting dose, or by stopping where the patient is already on it.",
      ],
    },
    {
      id: "hypertrichosis",
      type: "content",
      title: "Hypertrichosis and the rest of the counselling",
      body: [
        "Growth of fine hair on the face, arms and body is the commonest side effect: about 15 per cent at low dose, most patients at antihypertensive doses. It is dose related and reverses within 1 to 6 months of stopping. Every patient must be warned before the first supply, in writing, and the record must say the warning was given. It matters more to women, and a woman who would find facial hair unacceptable may reasonably decline. Hair colour can also change. Stop and seek advice for a rash or blistering of the skin or mouth.",
        "Time course: increased shedding is common in the first 4 to 8 weeks as miniaturised hairs are replaced, settling by 12 weeks. It is expected, is not a reason to stop or to report, and is not an exclusion at review. Visible improvement takes 3 to 6 months. Treatment is long term and the gain is lost within months of stopping.",
        "Other counselling from the PGD: take one dose a day at the same time; women halve the tablet along the line and keep the other half for tomorrow. Stand up slowly, go easy on alcohol in the first few weeks (alcohol and hot environments add to vasodilation), and do not drive if dizzy. Men using on-demand sildenafil, tadalafil or similar may feel light-headed; sit or lie down until it passes and do not take a second dose that day; tell the pharmacy if they start buying it over the counter. Tell any doctor, dentist, pharmacist or anaesthetist that they take minoxidil, and stop and seek advice if a blood pressure or heart medicine is started.",
        "Written information: the manufacturer's patient information leaflet (explaining that it describes the licensed use for blood pressure) and a written record of the dose, the stop-and-seek-help advice, the hypertrichosis warning and the review date. Label as a dispensed medicine with the dose in plain words (ONE tablet once a day, TWO tablets once a day, or HALF a tablet once a day) plus the stop-and-seek-help wording.",
      ],
      highlights: [
        "Hypertrichosis about 15 per cent at low dose; dose related; reverses in 1 to 6 months.",
        "Warn every patient in writing before the first supply.",
        "Shedding in the first 4 to 8 weeks is expected, settling by 12 weeks; persisting beyond 12 weeks means stop and refer.",
        "Come back before the tablets run out; a gap of more than 4 weeks means restarting at the first dose.",
      ],
    },
    {
      id: "records",
      type: "checklist",
      title: "Records and GP notification",
      intro:
        "Records are signed, dated, legible and contemporaneous, and kept for 8 years. The GP is informed within 7 days of the first supply, of any dose change and of any stop for a side effect. The record must include:",
      items: [
        { label: "Valid informed consent", detail: "Specifically that the patient was told the supply is off-label, what the licence is for, why it is being used, and the alternatives offered, and signed the consent statement on the consultation record." },
        { label: "Patient details and GP", detail: "Name, address, date of birth, sex, the GP with whom they are registered, and that the GP was informed within 7 days." },
        { label: "The examination", detail: "Pattern and duration of hair loss, the features checked (scalp normal, no patches, no scarring, hairline, eyebrows, pull test), and that baseline photographs were taken and stored." },
        { label: "Cardiovascular history and current medicines", detail: "Including that no medicine in the exclusion list is taken." },
        { label: "Today's measurements", detail: "Seated blood pressure (both readings and any repeat), standing blood pressure, pulse and weight with the values; height and BMI at the first supply." },
        { label: "For a woman", detail: "The ferritin and thyroid results seen and their dates; pregnancy excluded and last menstrual period; breastfeeding excluded; and the contraceptive method." },
        { label: "The product", detail: "Product and PL number, the dose (1.25 mg, 2.5 mg or 5 mg daily), number of tablets, batch and expiry, whether first supply, continuation or restart, the date of the first supply and the number of supplies so far under this PGD (maximum six between prescriber reviews)." },
        { label: "Any dose change", detail: "The previous dose, the review findings that justified the change, and that the patient was told." },
        { label: "The off-label wording", detail: "The words: off-label supply under Get Real Health PGD Pattern Hair Loss (Low-Dose Oral Minoxidil), version 001." },
        { label: "Warnings given in writing", detail: "The hypertrichosis warning and the stop-and-seek-help advice." },
        { label: "Review dates and reviews held", detail: "The date the next review is due and that the patient was told; at supply visits 4 and 6, that repeat photographs were taken and the response recorded; and after six supplies, the prescriber review held." },
        { label: "Pharmacist, advice, adverse reactions", detail: "Name and registration number of the supplying pharmacist; advice given, including where the patient is excluded or declines; details of any adverse drug reactions and the actions taken. Report every cardiovascular adverse event via Yellow Card." },
      ],
    },
    {
      id: "case-tamsulosin",
      type: "case",
      title: "Case 1: a man on tamsulosin",
      scenario:
        "A 58-year-old man asks about oral minoxidil for thinning at the crown and temples that has developed over several years. His scalp is normal on examination and the pull test releases 2 hairs. His seated blood pressure is 128/82 and pulse 68. He mentions he takes tamsulosin for his prostate.",
      question: "Can he be supplied under this PGD?",
      answer:
        "No. Tamsulosin is an alpha-blocker, and an alpha-blocker (tamsulosin, doxazosin, alfuzosin, prazosin) is on the list of excluded medicines for any indication. His hair loss pattern and his blood pressure are fine, but the medicine alone excludes him.",
      rationale:
        "The PGD excludes every class of blood pressure lowering or heart rate raising medicine named, because the effect on blood pressure is additive and the SmPC warns of excessive hypotension. Explain the reason, offer the licensed alternatives (topical minoxidil 5%, and finasteride under the Male Pattern Hair Loss PGD where its criteria are met), record which was offered, and document the decision.",
    },
    {
      id: "case-pcos",
      type: "case",
      title: "Case 2: a woman with PCOS",
      scenario:
        "A 31-year-old woman has noticed her central parting widening over the past two years. Her frontal hairline is preserved and her scalp is normal. She brings a GP letter from four months ago showing ferritin 48 and a normal TSH. She uses a hormonal implant. On questioning she has irregular periods and was diagnosed with polycystic ovary syndrome last year.",
      question: "What is the right action?",
      answer:
        "Refer to the GP; do not supply. Hair loss in a woman with hirsutism, new acne, irregular periods, a deepening voice or a diagnosis of polycystic ovary syndrome is a named exclusion, whatever the pattern looks like and whatever her blood results show.",
      rationale:
        "Appendix 2 lists hyperandrogenism in a woman as a referral: it needs assessment, and the hypertrichosis of minoxidil is a particular problem for these women. Her ferritin of 30 or more, her in-range TSH and her accepted contraceptive method would otherwise have satisfied the women's criteria, but the PCOS diagnosis takes her outside the PGD. Record the reason, the advice given and the referral.",
    },
    {
      id: "case-visit4-increase",
      type: "case",
      title: "Case 3: visit 4, wanting an increase, systolic 96",
      scenario:
        "A 42-year-old man attends for supply visit 4 on 2.5 mg daily. Repeat photographs show little change against baseline and he asks to go up to 5 mg. He has had no stop symptoms and no hypertrichosis he minds. His baseline lower seated systolic at the first supply was 118. Today the lower of two seated readings is 96/70, he feels well with no dizziness or faintness, standing shows no fall, and pulse is 64.",
      question: "Can the dose be increased today? Can he be supplied at all?",
      answer:
        "No increase. He can be supplied at 2.5 mg. A systolic of 90 to 99 is acceptable for supply only because he has no dizziness or faintness, but the dose increase requires today's systolic to be 100 mmHg or more and not more than 10 mmHg below the baseline reading. At 96 he fails both conditions (below 100, and 22 below his baseline of 118).",
      rationale:
        "The dose increase is available once only, at or after the fourth supply visit, and only where the response is inadequate against the baseline photographs, the starting dose has been tolerated without any stop symptom or hypertrichosis the patient minds, today's systolic is 100 or more and not more than 10 mmHg below the baseline, and pulse is within limits. Continue at 2.5 mg, record the review findings and the repeat photographs, and explain why no increase was made. The increase remains available at a later visit if the conditions are then met.",
    },
    {
      id: "case-visit2-ankle",
      type: "case",
      title: "Case 4: visit 2 with ankle swelling",
      scenario:
        "A 36-year-old woman on 1.25 mg daily attends for supply visit 2. Her weight is 1.2 kg up on the previous supply, blood pressure and pulse are within limits, and she mentions her ankles have been puffy for the last fortnight and her shoes feel tight. She has no chest pain, breathlessness or palpitations and asks whether a lower dose would help.",
      question: "What does the PGD require?",
      answer:
        "This is a cardiovascular stop. New ankle swelling means stop and refer to the GP within a week. Dose reduction is not an option (and a woman on 1.25 mg could not step down anyway). No further supply under this PGD until a prescriber has reviewed her face to face, with examination for oedema and a repeat blood pressure, and confirmed in writing that the symptom has resolved off treatment. Any restart is then at the starting dose.",
      rationale:
        "The PGD has one rule for fluid and blood pressure symptoms: a weight gain of 2 kg or more, new ankle or facial swelling, dizziness or faintness, palpitations, chest pain or breathlessness means stop and refer. The 2 kg threshold is not the only trigger; new swelling is a stop whatever the scales say. Same-day referral is for chest pain, breathlessness, palpitations, fainting or facial swelling; ankle swelling is a routine GP referral within a week. Give the stop-and-seek-help advice in writing, inform the GP within 7 days, and report the event via Yellow Card because this is an off-label use.",
    },
    {
      id: "case-ffa",
      type: "case",
      title: "Case 5: a woman with a receding hairline",
      scenario:
        "A 52-year-old woman asks for oral minoxidil for thinning at the front of her scalp over about eighteen months. With the hair parted you see a band of recession along the frontal and temporal hairline, the skin behind it pale and smooth with no visible follicular openings, and her eyebrows are sparse. Her ferritin and TSH results are in range and she is post-menopausal.",
      question: "Is this female pattern hair loss?",
      answer:
        "No. This is the picture of frontal fibrosing alopecia: band-like recession of the frontal and temporal hairline, pale smooth skin behind the new hairline with follicular openings gone, and loss of the eyebrows. It is a scarring alopecia and a referral, not a supply.",
      rationale:
        "True female pattern hair loss keeps the frontal hairline; that preserved hairline is the difference. A receding frontal or temporal hairline in a woman, or loss of the eyebrows, is a named exclusion, and the PGD says scarring alopecia needs a diagnosis first. Refer to the GP for diagnosis rather than offering any treatment, and document the features seen.",
    },
    {
      id: "summary",
      type: "summary",
      title: "Key takeaways",
      keyPoints: [
        "Off-label: minoxidil tablets are licensed for severe hypertension only. Give the consent script, the patient signs the consent statement, and the record carries the off-label wording.",
        "Pharmacists only, face to face on the premises, ages 18 to 65 at every supply, GP registered and notified within 7 days.",
        "Diagnose androgenetic alopecia on examination today: gradual onset, typical pattern, normal scalp, pull test under 6 hairs, baseline photographs. Every Appendix 2 mimic (areata, telogen effluvium, FFA, scarring, tinea, traction, hyperandrogenism or PCOS) is a referral.",
        "Women: ferritin 30 or more and TSH in range from the last 12 months, seen and recorded; not pregnant, not breastfeeding, not planning; accepted contraception recorded.",
        "Exclude any cardiovascular disease, hypertension however managed, hypotension, syncope, phaeochromocytoma, renal or hepatic impairment, BMI below 18.5, and every medicine on the exclusion list.",
        "BP at every supply: seated after 5 minutes, two readings, lower recorded, systolic 100 to 139 and diastolic below 90 (90 to 99 only if asymptomatic); standing after 1 minute, no 20/10 fall; pulse 50 to 100; third reading on repeat decides; one return visit. Weight every supply; height and BMI at the first.",
        "Doses: men 2.5 mg, women 1.25 mg. One increase in the whole course, at or after visit 4, only with inadequate response, no stop symptoms, systolic 100 or more and within 10 of baseline, pulse in range. One step down for non-cardiovascular side effects; a woman on 1.25 mg stops instead.",
        "Every supply 8 weeks, numbered. Full review at visit 4; photographs and prescriber review sought at visit 6; six supplies maximum, not reset by gap or restart. Gap over 4 weeks is a restart at the starting dose.",
        "Cardiovascular stop: 2 kg gain, swelling, dizziness, faintness, palpitations, chest pain, breathlessness, fainting, or BP or pulse outside limits on repeat. Stop, no dose reduction, same day for cardiac symptoms or facial swelling, within a week otherwise, and no restart without a written face to face prescriber review.",
        "Warn every patient in writing about hypertrichosis and the stop-and-seek-help symptoms, and report every cardiovascular adverse event via Yellow Card.",
      ],
    },
  ],

  quiz: [
    {
      id: "q1",
      type: "single-choice",
      critical: true,
      question:
        "A patient understands the treatment but would rather not have the off-label explanation and does not want to sign anything. Which is correct?",
      options: [
        { id: "a", label: "Supply, since the pharmacist has judged the patient suitable and the explanation is optional." },
        { id: "b", label: "Supply, but note on the record that the patient declined the explanation." },
        { id: "c", label: "Do not supply. The patient must be told the supply is off-label, why, and what the licence is for, and must sign the consent statement on the record." },
        { id: "d", label: "Supply a single 4-week trial pack and take consent at the next visit." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "The PGD states the patient must be told it is off-label, why, and what the licence is for, and must consent on that basis; the consent script is the minimum and the patient signs the consent statement on the consultation record. A patient who does not accept off-label treatment after the explanation is an exclusion. There is no 4-week supply under this PGD; every supply is 8 weeks.",
    },
    {
      id: "q2",
      type: "single-choice",
      question: "Who may supply under this PGD?",
      options: [
        { id: "a", label: "A GPhC-registered pharmacist, face to face on the pharmacy premises." },
        { id: "b", label: "A pharmacy technician, once trained, under pharmacist supervision." },
        { id: "c", label: "A pharmacist by video consultation, provided the patient sends a photograph of the scalp." },
        { id: "d", label: "Any registered healthcare professional named under the PGD." },
      ],
      correctOptionIds: ["a"],
      explanation:
        "The PGD covers pharmacists registered and practising with the GPhC only. It is not used by pharmacy technicians: the diagnosis, the cardiovascular screen and the off-label consent are the pharmacist's. Remote or telephone consultation is not covered; the scalp is examined and the blood pressure measured on the premises by the pharmacist who supplies.",
    },
    {
      id: "q3",
      type: "multi-choice",
      question: "Which of the following findings in a woman mean refer, not supply? Select all that apply.",
      options: [
        { id: "a", label: "Band-like recession of the frontal hairline with loss of the eyebrows." },
        { id: "b", label: "Diffuse thinning over the crown with the frontal hairline preserved and a normal scalp." },
        { id: "c", label: "Hirsutism, irregular periods, or a diagnosis of polycystic ovary syndrome." },
        { id: "d", label: "Smooth round patches of complete loss with exclamation mark hairs at the edge." },
        { id: "e", label: "Handfuls of hair shedding three months after major surgery." },
      ],
      correctOptionIds: ["a", "c", "d", "e"],
      explanation:
        "Appendix 2 lists frontal fibrosing alopecia (band-like recession, eyebrow loss), hyperandrogenism or PCOS, alopecia areata (smooth patches, exclamation mark hairs) and telogen effluvium (diffuse shedding 2 to 4 months after surgery, illness, childbirth or a new medicine) as referrals. Option b is the female pattern of androgenetic alopecia, which the PGD covers where the rest of its criteria are met.",
    },
    {
      id: "q4",
      type: "single-choice",
      question: "A woman presents with typical female pattern loss. She has a ferritin of 24 micrograms/L from two months ago and a normal TSH. What does the PGD require?",
      options: [
        { id: "a", label: "Supply, since the TSH is normal and the pattern is typical." },
        { id: "b", label: "Supply at 1.25 mg and advise her to take an iron supplement." },
        { id: "c", label: "Refer to the GP; a ferritin below 30 micrograms/L is an exclusion and is treated first." },
        { id: "d", label: "Supply provided she agrees to repeat the ferritin within 12 months." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "A woman needs a ferritin of 30 micrograms/L or more and a TSH within the laboratory reference range, tested within the last 12 months and seen by the pharmacist, before a first supply. A ferritin below 30 is an exclusion and is referred to the GP for treatment first, because iron deficiency causes diffuse hair loss that looks like the female pattern and is treated differently.",
    },
    {
      id: "q5",
      type: "multi-choice",
      critical: true,
      question: "Which of these medicines exclude a patient from supply under this PGD, for any indication? Select all that apply.",
      options: [
        { id: "a", label: "Propranolol taken for migraine." },
        { id: "b", label: "Spironolactone." },
        { id: "c", label: "Metformin." },
        { id: "d", label: "Daily tadalafil." },
        { id: "e", label: "Dapagliflozin." },
        { id: "f", label: "Lisdexamfetamine." },
      ],
      correctOptionIds: ["a", "b", "d", "e", "f"],
      explanation:
        "The exclusion list names any beta-blocker including propranolol for anxiety or migraine, any diuretic including spironolactone, daily tadalafil or any other PDE5 inhibitor taken daily, any SGLT2 inhibitor (dapagliflozin, empagliflozin, canagliflozin, ertugliflozin) and stimulants (methylphenidate, lisdexamfetamine, dexamfetamine, modafinil). The effect on blood pressure or heart rate is additive. Diabetes on metformin is expressly not an exclusion in itself.",
    },
    {
      id: "q6",
      type: "single-choice",
      question: "Which describes the seated blood pressure method the PGD requires?",
      options: [
        { id: "a", label: "One reading after 2 minutes rest; if high, repeat immediately and record the average." },
        { id: "b", label: "After 5 minutes rest, two readings 1 to 2 minutes apart with the lower recorded; if outside limits, a third seated reading after a further 5 minutes decides." },
        { id: "c", label: "Three readings in a row with the highest recorded, for safety." },
        { id: "d", label: "Two readings on separate days, both within limits." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Seated blood pressure is taken after 5 minutes rest, two readings 1 to 2 minutes apart with the lower recorded. Where a reading is outside the limits, a third seated reading after a further 5 minutes (on repeat) decides, and a patient outside the limits on repeat may return once on another day. Standing blood pressure is a single reading after 1 minute.",
    },
    {
      id: "q7",
      type: "multi-choice",
      question: "A man is at supply visit 4 and asks for an increase to 5 mg. Which conditions must ALL be met for the increase? Select all that apply.",
      options: [
        { id: "a", label: "Response inadequate against the baseline photographs." },
        { id: "b", label: "No stop symptom and no hypertrichosis he minds on the starting dose." },
        { id: "c", label: "Today's systolic 100 mmHg or more and not more than 10 mmHg below the baseline reading." },
        { id: "d", label: "Pulse within 50 to 100." },
        { id: "e", label: "He has not already used his one increase in this course." },
        { id: "f", label: "He has used topical minoxidil for at least 6 months first." },
      ],
      correctOptionIds: ["a", "b", "c", "d", "e"],
      explanation:
        "The dose increase is once only, at or after the fourth supply visit, where the response is inadequate against the baseline photographs, the patient has tolerated the starting dose without any stop symptom or hypertrichosis they mind, today's systolic is 100 mmHg or more and not more than 10 mmHg below the baseline (the lower seated systolic at the first supply or most recent restart), with pulse within the limits. The increase is available once in the patient's whole course. Prior topical use is not a condition.",
    },
    {
      id: "q8",
      type: "single-choice",
      question: "A patient has had six 8-week supplies under this PGD. What must happen before a seventh?",
      options: [
        { id: "a", label: "Nothing; the pharmacist continues 8-week supplies while the patient remains within the limits." },
        { id: "b", label: "A documented prescriber review confirming in writing that treatment may continue, sought at supply visit 6 so it is complete before the tablets run out." },
        { id: "c", label: "A 4-week break from tablets, after which the count resets to zero." },
        { id: "d", label: "A repeat ferritin and TSH for men and women." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The maximum is six 8-week supplies under this PGD, counted by supply number and not reset by any gap or restart. Before any seventh supply a prescriber (the GP, or where the GP declines, a Get Real Health prescriber) reviews the blood pressure, pulse and weight record, the photographs and the side effects, and confirms in writing that treatment may continue. Six supplies completed without a documented prescriber review since is an exclusion. A gap of more than 4 weeks is a restart at the starting dose and does not reset the count.",
    },
    {
      id: "q9",
      type: "single-choice",
      critical: true,
      question: "At supply visit 3 a patient on 5 mg reports palpitations over the past week. Blood pressure and pulse today are within limits. What does the PGD require?",
      options: [
        { id: "a", label: "Reduce to 2.5 mg and review at the next supply." },
        { id: "b", label: "Supply as usual, since today's readings are within limits." },
        { id: "c", label: "Stop, refer the same day, and make no further supply until a face to face prescriber review confirms in writing that the symptom has resolved off treatment." },
        { id: "d", label: "Stop for one week, then resume at 5 mg if the palpitations have settled." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Palpitations since the last visit are a cardiovascular stop. The PGD has one rule for fluid and blood pressure symptoms: stop and refer, same day for chest pain, breathlessness, palpitations, fainting or facial swelling, and no dose reduction. No further supply until a prescriber has reviewed the patient face to face with examination for oedema and a repeat blood pressure and confirmed in writing that the symptom has resolved off treatment; any restart is then at the starting dose. Today's readings being within limits do not change this.",
    },
    {
      id: "q10",
      type: "true-false",
      question: "True or false: a woman on 1.25 mg who finds new facial hair unacceptable at review should have her dose reduced, and this counts as a cardiovascular stop.",
      options: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
      correctOptionIds: ["false"],
      explanation:
        "Both parts are wrong. A woman on 1.25 mg cannot step down and stops instead; only a patient above the starting dose can be reduced one step. Hypertrichosis is not a cardiovascular stop: it reverses within 1 to 6 months of stopping and the patient may restart later without a prescriber review. The GP is still informed within 7 days of any stop for a side effect.",
    },
  ],
};
