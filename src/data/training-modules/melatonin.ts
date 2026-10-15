// Melatonin 5 mg for Adults: Insomnia and Jet Lag, PGD training
//
// Source: Get Real Health PGD "Insomnia and Jet Lag in Adults" (slug
// melatonin), version 001, valid from 15 October 2026. Content in this
// module is drawn from that document only. The Epworth Sleepiness Scale
// item wording is used under licence and is deliberately not reproduced.

import type { TrainingModule } from "./types";

export const melatoninModule = {
  slug: "melatonin",
  title: "Melatonin 5 mg for Adults: Insomnia and Jet Lag, PGD training",
  description:
    "Licensed Adaflex 3 mg and 5 mg melatonin for adults aged 18 and over: arm A insomnia (off-label, pharmacists only) with screening, a reviewed three-supply course and stop rules; arm B jet lag (licensed, pharmacists or technicians) with timing, dose and supply limits.",
  pgdSlugs: ["melatonin"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "Awaiting sign-off by Dr Nitin Shori, Medical Director, and Chris Pilkington, Head Pharmacist",
  alignedToPgd: { melatonin: "v001" },
  reviewStatus: "awaiting-sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-10-16",
  estimatedMinutes: 30,
  passMark: 0.8,

  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Melatonin for adults, PGD training",
      subtitle:
        "Adaflex 3 mg and 5 mg tablets (and, for jet lag only, Melatonin 3 mg film-coated tablets) for adults aged 18 and over: arm A insomnia (off-label) and arm B jet lag (licensed)",
      estimatedMinutes: 30,
      objectives: [
        "Choose the right arm, or the separate Circadin PGD for a patient aged 55 and over, and apply the ceiling: one dose a night, never more than 5 mg in 24 hours from all sources, 3 mg at most at 65 or over or with any oestrogen.",
        "Explain the arm A off-label supply in plain language, give the consent script and record the signed consent statement.",
        "Take the arm A secondary-cause history, score the PHQ-2, GAD-2, STOP-Bang and Epworth screens, and refer every red flag.",
        "Apply the exclusions, cautions and interactions common to both arms, including the falls definition and safety-critical work.",
        "Apply the arm A course: 30-tablet supplies, the review window, the sleep rating bands, the single dose increase and the stopping rules.",
        "Apply the arm B jet lag rules: 5 or more time zones, destination bedtime timing, the 5 mg criteria, 5 or 10 tablets per supply and four supplies in 12 months.",
        "Counsel on drowsiness, driving, food, alcohol and falls, and keep the records, GP notification and Yellow Card reporting the PGD requires.",
      ],
    },
    {
      id: "about-training",
      type: "callout",
      title: "About this training",
      tone: "info",
      message:
        "This training is optional and is not a condition of access to the PGD or the tool on this platform. The PGD says practitioners should complete the Get Real Health training, or equivalent training elsewhere, before first working under it, and must read the PGD in full.",
      detail: [
        "The date you completed training, and for equivalent training what it was, is recorded in the Get Real Health training record or your employer's own training record.",
        "Your employing organisation remains responsible for being satisfied that you are competent to work under this PGD.",
        "Before first working under it you must also have completed PGD training (for example the CPPE PGD e-learning and e-assessment or an equivalent) and been assessed as competent to work under a PGD.",
        "This module was written against PGD version 001 and is awaiting clinical sign-off.",
      ],
    },
    {
      id: "scope",
      type: "content",
      title: "What this PGD is for, and who may use it",
      body: [
        "This PGD authorises the supply of licensed immediate-release melatonin tablets, never more than 5 mg in 24 hours, to adults aged 18 and over, face to face on the premises, without a prescription, as a private service. Every product supplied is a UK-licensed medicine. Sleep hygiene advice is given to every insomnia patient, and jet lag advice to every traveller, whether or not anything is supplied.",
        "Arm A (insomnia, OFF-LABEL) is for registered pharmacists only, because it depends on a diagnostic sift for secondary causes of insomnia and on off-label consent. Arm B (jet lag, licensed) may be used by registered pharmacists or registered pharmacy technicians.",
        "It does not cover anyone under 18 (there is no children's arm and it does not continue melatonin started for a child or young person); unlicensed melatonin of any kind (imports, specials, food supplements); Circadin or any prolonged-release melatonin; a patient already prescribed melatonin; remote or telephone consultations; or a request made by a carer or relative on an adult's behalf.",
        "A patient in the middle of an arm A course is not supplied under arm B: they take no more than one dose of melatonin a night.",
      ],
      highlights: [
        "Adults aged 18 and over only, confirmed on the day of supply.",
        "Arm A: pharmacists only. Arm B: pharmacists or pharmacy technicians.",
        "Face to face on the premises. No remote consultations.",
        "Only licensed products. Never a supplement, special or import.",
      ],
    },
    {
      id: "products",
      type: "comparison",
      title: "The products, and what each is licensed for",
      intro:
        "Melatonin is a prescription-only medicine in the UK. Food supplements containing it are not lawful here. Only Adaflex 5 mg tablets are supplied at 5 mg.",
      columns: [
        {
          label: "Adaflex 3 mg and 5 mg tablets (AGB-Pharma AB)",
          rows: [
            { heading: "Licences", body: "Short-term treatment of jet lag in adults, and insomnia in children aged 6 to 17 with ADHD. NOT licensed for insomnia in adults." },
            { heading: "Used in", body: "Arm A (off-label) and arm B (licensed)." },
            { heading: "PL numbers", body: "PL 52497/0003 (3 mg) and PL 52497/0005 (5 mg)." },
            { heading: "Other points", body: "Immediate release, lactose free. May be crushed and mixed with water immediately before taking. Do not store above 25 C; keep in the original package to protect from light." },
          ],
        },
        {
          label: "Melatonin 3 mg film-coated tablets (Colonis Pharma)",
          rows: [
            { heading: "Licence", body: "Short-term treatment of jet lag in adults only." },
            { heading: "Used in", body: "Arm B only, at 3 mg only. The 6 mg dose its SmPC allows is above the ceiling of this PGD and is not used." },
            { heading: "PL number", body: "PL 41344/0053." },
            { heading: "Other points", body: "Contains lactose: for rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption, supply Adaflex 3 mg instead." },
          ],
        },
        {
          label: "Circadin 2 mg prolonged-release (not used here)",
          rows: [
            { heading: "Licence", body: "Primary insomnia in adults aged 55 and over." },
            { heading: "Under this PGD", body: "Never supplied. Get Real Health supplies it under its separate Circadin PGD." },
            { heading: "Patients 55 and over", body: "May be eligible under arm A or the Circadin PGD. Choose ONE route per course, record which and why, and do not switch within a course." },
            { heading: "Counting", body: "Circadin courses count towards this PGD's 6 month interval and two-course rule. A patient currently in a Circadin course is excluded." },
          ],
        },
      ],
    },
    {
      id: "off-label",
      type: "callout",
      title: "Arm A is an off-label supply",
      tone: "danger",
      message:
        "Adaflex is licensed for jet lag in adults and for insomnia in children aged 6 to 17 with ADHD, not for insomnia in adults. No UK guideline recommends immediate-release melatonin for adult insomnia. The patient must be told this, why it is offered, that the benefit is uncertain, and what the alternatives are, and must consent on that basis.",
      detail: [
        "The basis is recorded as the Medical Director's decision of 15 October 2026, accepted by the Head Pharmacist, under NICE MPG2 recommendation 1.1.7: clinical experience, a recognised hypnotic effect (SmPC 5.1), a dose within the licensed adult range of the same product, the SmPC statement of few and no serious adverse reactions up to three months, and the risks of the z-drug alternatives.",
        "The limits are part of that basis: pharmacists only, full history and screening, an in-person review before each further supply, a stop rule if there is no benefit, 90 nights at most, and a documented GP review before any third or later course.",
        "Give the consent script in substance. The patient signs the consent statement in Appendix 4, and the GP is informed within 7 days of supply 1 and at the end of the course.",
        "The record carries the words: off-label supply under Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm A.",
        "The patient information leaflet describes the licensed uses, not insomnia in adults. Tell the patient why.",
        "Because this is off-label use, report every suspected adverse reaction via Yellow Card.",
      ],
    },
    {
      id: "sleep-hygiene",
      type: "content",
      title: "Sleep hygiene and CBT-I come first",
      body: [
        "Give the sleep hygiene advice in Appendix 1 to every insomnia patient, in writing as well as in conversation, whether or not anything is supplied. It has the better long-term evidence.",
        "Cognitive behavioural therapy for insomnia (CBT-I) is the first-line treatment in NICE CKS and works better than any tablet over time. Tell the patient how to access it (NHS Talking Therapies self-referral, or a digital CBT-I programme recommended by NICE) and record that you did.",
        "For arm A supply 1, sleep hygiene must have been followed for at least 2 weeks without sufficient benefit, OR severe daytime impairment must be documented (what it is, for example unable to work or to care for dependants safely, and why waiting 2 weeks is not reasonable), in which case sleep hygiene starts today alongside the course.",
      ],
      highlights: [
        "Fixed wake time every day, including weekends.",
        "Bed only when sleepy; get up if awake more than about 20 minutes.",
        "No caffeine after midday; alcohol is not a sleep aid.",
        "Signpost CBT-I and record it.",
      ],
    },
    {
      id: "red-flags",
      type: "checklist",
      title: "Red flags: each one is a referral, not a supply, in both arms",
      intro:
        "In arm A the pharmacist asks about every one and completes the screens for every patient. In arm B the practitioner asks about them as symptoms; the scored screens are not required, and a traveller who describes any of these is referred. A pharmacy technician refers any red flag to the pharmacist.",
      items: [
        { label: "Possible sleep apnoea", detail: "STOP-Bang 5 or more, or witnessed pauses in breathing, choking or gasping in sleep at any score, or Epworth above 10. Refer to the GP." },
        { label: "Depression or anxiety", detail: "PHQ-2 of 3 or more, GAD-2 of 3 or more, or anxiety or low mood that the patient says drives the sleep problem. Refer to the GP. ANY thoughts of self-harm or suicide, whatever the scores: same-day referral (GP, NHS 111, or 999 if immediate risk), and do not leave a person at immediate risk alone." },
        { label: "Possible overactive thyroid", detail: "Palpitations, tremor, heat intolerance, sweating, or weight loss without trying." },
        { label: "Menopausal symptoms", detail: "Night sweats or hot flushes that wake the patient. Refer to consider treating the cause." },
        { label: "Restless legs, pain, nocturia, orthopnoea, neurology", detail: "An urge to move the legs at night relieved by movement; pain that prevents sleep; waking repeatedly to pass urine; breathlessness lying flat; a new neurological symptom." },
        { label: "Recreational drugs and alcohol", detail: "Current recreational drug use, withdrawal from cannabis, alcohol or another substance, alcohol used to get to sleep, or a harmful drinking pattern. Refer to the GP or a local drug and alcohol service." },
        { label: "Narcolepsy or parasomnia", detail: "Falling asleep suddenly in the day, collapse with emotion (cataplexy), acting out dreams, or sleepwalking with injury. Refer to the GP for a sleep service." },
        { label: "Cognition", detail: "New confusion or memory problems, or a diagnosis of dementia (NICE NG97: do not offer melatonin for insomnia in Alzheimer's disease)." },
        { label: "Already prescribed melatonin", detail: "By any prescriber, for any reason. Refer back to the prescriber." },
        { label: "Adult safeguarding", detail: "A relative or carer requesting for an adult who is not present or lacks capacity; a care home resident; any concern of abuse, neglect, coercion or exploitation, including someone asking for melatonin to sedate another adult. Follow the pharmacy's adult safeguarding procedure the same day." },
      ],
    },
    {
      id: "screens",
      type: "content",
      title: "The arm A screens: thresholds, not wording",
      body: [
        "Arm A requires four screens for every patient (Appendix 2). A positive screen is a referral, not a supply. Use the pharmacy's own copies of the questionnaires; the Epworth Sleepiness Scale is used under licence and its wording is not reproduced in the PGD or here.",
        "PHQ-2 (depression) and GAD-2 (anxiety): two questions each about the last 2 weeks, each scored 0 to 3, total 0 to 6. A total of 3 or more on either is positive. Whatever the PHQ-2 score, ask directly about thoughts of self-harm or suicide.",
        "STOP-Bang (sleep apnoea): one point each for loud snoring, daytime tiredness, observed pauses, choking or gasping, high blood pressure, BMI over 35, age over 50, neck over 40 cm, and male sex; total 0 to 8. A total of 5 or more, or ANY witnessed pauses, choking or gasping, is positive.",
        "Epworth Sleepiness Scale: completed by the patient on the pharmacy's licensed form, eight everyday situations each scored 0 to 3, total 0 to 24. A total above 10 is excessive daytime sleepiness: refer.",
      ],
      highlights: [
        "PHQ-2 below 3 and GAD-2 below 3 to supply.",
        "STOP-Bang below 5 with no witnessed pauses, choking or gasping.",
        "Epworth 10 or below.",
        "Self-harm thoughts: same-day referral at any score.",
      ],
    },
    {
      id: "arm-a-inclusion",
      type: "checklist",
      title: "Arm A inclusion: all must apply",
      items: [
        { label: "Aged 18 or over on the day of supply", detail: "Present in person, with capacity to consent." },
        { label: "Insomnia pattern", detail: "Difficulty getting to sleep, staying asleep, or waking early, on at least 3 nights a week for at least 4 weeks, affecting daytime functioning. Insomnia for less than 4 weeks: sleep hygiene only, do not medicate." },
        { label: "No secondary cause, no red flag, no fall", detail: "The full history has been taken and all four screens are below threshold." },
        { label: "Sleep hygiene first", detail: "Followed for at least 2 weeks before supply 1, or severe daytime impairment documented. CBT-I offered and signposted." },
        { label: "GP registered and notification agreed", detail: "The GP is informed within 7 days of supply 1 and at the end of the course. A patient who will not allow this is not supplied." },
        { label: "Woman of childbearing potential", detail: "Not pregnant, not breastfeeding, not planning a pregnancy, and using contraception." },
        { label: "Off-label consent", detail: "Explicit consent after the explanation, with the Appendix 4 statement signed by the patient." },
        { label: "Supply 1 of a course", detail: "No melatonin course for insomnia (under this PGD or the Circadin PGD) has ended in the last 6 months; after two or more such courses, a GP review since the most recent one is documented and does not advise against further melatonin." },
        { label: "Supply 2 or 3", detail: "In-person pharmacist review in the review window, the review rules permit a further supply, and the course will not exceed three supplies, 90 tablets or day 103 after supply 1." },
      ],
    },
    {
      id: "arm-a-secondary",
      type: "content",
      title: "Arm A: secondary insomnia and the other arm A exclusions",
      body: [
        "Where any of these is present the insomnia is likely to be secondary: refer to the GP, do not supply. Any red flag; SHIFT WORK of any pattern, or a delayed sleep pattern (falling asleep very late and sleeping late when free to); caffeine late in the day or in high total amounts, not yet addressed; or a medicine that could be causing the insomnia, for example a DECONGESTANT (pseudoephedrine, phenylephrine), a corticosteroid, a beta-agonist, an SSRI or SNRI started or changed before the insomnia began, a stimulant, levothyroxine recently started or increased, or a diuretic taken in the evening.",
        "PROFESSIONAL DRIVERS AND SAFETY-CRITICAL WORKERS are excluded from arm A: anyone who drives for a living (taxi, delivery, bus, lorry and emergency vehicle drivers), pilots and aircrew, train drivers, air traffic controllers, operators of dangerous machinery, anyone working at height, or any other role where next-day drowsiness is a safety risk. Refer to the GP.",
        "Also excluded in arm A: a patient currently in a course under the Circadin PGD; supply 1 within 6 months of the end of a previous course, or after two or more courses without a documented GP review; and at supply 2 or 3, a stopping rule applying, review rules that do not permit supply, a review that was not in person, or a review after day 37.",
      ],
    },
    {
      id: "exclusions-both",
      type: "checklist",
      title: "Exclusions in both arms: refer, do not supply",
      items: [
        { label: "Under 18", detail: "Refer a child or young person to their GP." },
        { label: "Hypersensitivity", detail: "To melatonin or any excipient of the product to be supplied." },
        { label: "Liver", detail: "Hepatic impairment of any degree, cirrhosis or chronic liver disease." },
        { label: "Severe renal impairment", detail: "Known eGFR below 30 ml/min/1.73m2, or dialysis. Lesser degrees are a caution (in arm B a technician refers these to a pharmacist)." },
        { label: "Autoimmune disease, active or quiescent", detail: "For example rheumatoid arthritis, SLE, MS, inflammatory bowel disease, psoriasis or psoriatic arthritis, type 1 diabetes, coeliac disease, autoimmune thyroid disease. The SmPCs: no data, occasional case reports of exacerbation, not recommended." },
        { label: "Epilepsy or any history of seizures", detail: "Melatonin has been reported to increase, decrease or not affect seizure frequency." },
        { label: "Pregnancy and breastfeeding", detail: "Pregnant, possibly pregnant, planning a pregnancy, breastfeeding, or a woman of childbearing potential not using contraception." },
        { label: "Excluded medicines", detail: "FLUVOXAMINE; any benzodiazepine, z-drug (zopiclone, zolpidem, zaleplon), daridorexant or other prescribed hypnotic; WARFARIN or another vitamin K antagonist; 5-methoxypsoralen or 8-methoxypsoralen." },
        { label: "Other melatonin", detail: "Already prescribed melatonin (refer to the prescriber), or melatonin from any other source the patient will not stop. If they agree to stop, record the product." },
        { label: "Falls", detail: "Any fall in the last 12 months, including any fall with injury." },
        { label: "Presence and capacity", detail: "Not present, lacks capacity, or declines. A relative or carer cannot request or consent for an adult." },
      ],
    },
    {
      id: "cautions",
      type: "comparison",
      title: "Cautions and interactions",
      intro: "None of these is an exclusion on its own unless stated. Record each one and the advice given.",
      columns: [
        {
          label: "Dose limits and referral triggers",
          rows: [
            { heading: "Oestrogens", body: "Combined hormonal contraception containing ethinylestradiol can raise melatonin levels 4 to 5 fold. As a precaution every medicine containing an oestrogen (pill, patch, ring, or HRT in any form) is treated the same: 3 mg MAXIMUM in both arms, never 5 mg." },
            { heading: "Aged 65 and over", body: "3 mg MAXIMUM, never 5 mg." },
            { heading: "Raisers plus a sedative", body: "Cimetidine, ciprofloxacin, norfloxacin or verapamil TOGETHER WITH another sedating medicine (opioid, gabapentinoid, sedating antihistamine, tricyclic, antipsychotic, or any other medicine that causes drowsiness): refer. One of the raisers alone: supply with counselling about increased drowsiness." },
            { heading: "Renal impairment short of severe", body: "Supply only where the pharmacist is satisfied it is mild and stable." },
          ],
        },
        {
          label: "Counsel and record",
          rows: [
            { heading: "Other sedating medicines", body: "Without one of the raisers: counsel about additive drowsiness." },
            { heading: "Lowering melatonin", body: "Carbamazepine, phenytoin, rifampicin, omeprazole and smoking (halves exposure). Tell the patient the effect may be less." },
            { heading: "Calcium channel blockers", body: "Melatonin may reduce the effect of nifedipine and possibly others. Keep planned blood pressure checks and tell the prescriber." },
            { heading: "Diabetes", body: "No food 2 hours either side of a dose applies to everyone; in diabetes ideally at least 3 hours after a meal, with more frequent glucose monitoring where the patient monitors." },
            { heading: "Alcohol", body: "Not taken with melatonin: it reduces the effect on sleep and adds to drowsiness." },
          ],
        },
      ],
    },
    {
      id: "arm-a-course",
      type: "content",
      title: "Arm A: dose, course and review window",
      body: [
        "SUPPLY 1: 30 tablets of Adaflex 3 mg, one tablet nightly 1 to 2 hours before bedtime, with no food for 2 hours before and 2 hours after. SUPPLY 2 AND SUPPLY 3: 30 tablets of Adaflex 3 mg or Adaflex 5 mg, one strength per supply, as the review rules allow. The dose is increased once at most, from 3 mg to 5 mg, never above 5 mg.",
        "The day of a supply is day 0, and the first dose is taken that night. THE REVIEW WINDOW is day 21 to day 30 after a supply, so a patient reviewed in the window is never without tablets. A review on day 31 to day 37 is still accepted: the nights without tablets (up to 7) are recorded and do not restart the course. After day 37 the course has ended, and any further supply is supply 1 of a new course.",
        "A course is up to three supplies: no more than 90 tablets and 90 nights of treatment, and no more than 104 calendar days from supply 1 (the last tablet is taken no later than day 103). The maximum total in a course is 390 mg (30 x 3 mg, then 60 x 5 mg).",
        "Between courses: at least 6 months from the end of one course to supply 1 of the next. After two courses in total (including courses under the Circadin PGD), a further course only after a documented GP review. Courses are counted from the pharmacy record and the patient's own account; no proof is required. A course counts once supply 1 has been made, however it ended.",
        "Missed dose: skip it; do not take it later in the night or double the next dose. Melatonin may be stopped at any time without tapering. Reviews are by a pharmacist, in person; a technician asked for a further arm A supply passes the patient to a pharmacist.",
      ],
      highlights: [
        "30 tablets per supply, three supplies at most.",
        "Review on day 21 to 30; accepted to day 37.",
        "90 nights, 104 calendar days, 390 mg at most per course.",
        "6 months between courses; GP review after two courses.",
      ],
    },
    {
      id: "arm-a-review",
      type: "comparison",
      title: "Arm A: the sleep rating bands and the review rules",
      intro:
        "At supply 1 and at each review, the patient rates their sleep quality 0 to 10. The band is the change from the supply 1 baseline. At every review also ask about nights affected, next-day drowsiness, falls, mood (repeat PHQ-2 and GAD-2), side effects, other melatonin, new medicines, and adherence to the timing and no-food rules.",
      columns: [
        {
          label: "The bands",
          rows: [
            { heading: "CLEARLY BETTER", body: "Improved by 3 or more points." },
            { heading: "A LITTLE BETTER", body: "Improved by 1 or 2 points." },
            { heading: "NO BETTER", body: "No change, or worse." },
            { heading: "Who can have 5 mg", body: "Tablets tolerated, under 65, no oestrogen, and no caution that makes a higher dose unsafe." },
          ],
        },
        {
          label: "Review 1 (before supply 2)",
          rows: [
            { heading: "CLEARLY BETTER", body: "Supply 2 at 3 mg." },
            { heading: "A LITTLE BETTER or NO BETTER, 5 mg allowed", body: "Supply 2 at 5 mg (the only increase in the course)." },
            { heading: "A LITTLE BETTER, 5 mg not allowed", body: "Supply 2 at 3 mg." },
            { heading: "NO BETTER, 5 mg not allowed", body: "STOP (stopping rule 1), refer to the GP." },
          ],
        },
        {
          label: "Review 2 (before supply 3)",
          rows: [
            { heading: "NO BETTER", body: "STOP (stopping rule 1), no supply 3, refer to the GP." },
            { heading: "CLEARLY or A LITTLE BETTER", body: "Supply 3 at the same dose." },
            { heading: "Still on 3 mg, A LITTLE BETTER, 5 mg allowed", body: "Supply 3 may be at 5 mg." },
            { heading: "End of course", body: "After supply 3, or at any stop, the GP is informed." },
          ],
        },
      ],
    },
    {
      id: "stopping-rules",
      type: "callout",
      title: "Stopping rules, one per problem, in both arms",
      tone: "warning",
      message:
        "None of the problems in rules 2 to 5 is managed by changing the dose. Each is a stop.",
      detail: [
        "(1) Arm A, NO BETTER at review 2, or at review 1 where 5 mg is not allowed: STOP, no further supply, refer to the GP.",
        "(2) Next-day drowsiness that affects daily activities, or any fall while taking melatonin: STOP, no further supply under this PGD, refer to the GP (the same day after a fall with injury).",
        "(3) New or worse low mood or anxiety: STOP and refer to the GP, the same day if there are thoughts of self-harm.",
        "(4) Rash, swelling of the face, lips or tongue, or difficulty breathing: STOP. Difficulty breathing or swelling of the lips or tongue is an emergency (999).",
        "(5) Any other side effect the patient finds unacceptable: STOP, and the course ends.",
      ],
    },
    {
      id: "arm-b",
      type: "content",
      title: "Arm B: jet lag (licensed)",
      body: [
        "For an adult aged 18 or over with a planned journey by air crossing 5 or more time zones, in either direction (benefit is greater eastward and with more time zones). Record the destination, dates and time difference. A return journey that also crosses 5 or more time zones may be covered by the same supply.",
        "DOSE: 3 mg (Adaflex 3 mg or Melatonin 3 mg film-coated tablets) once daily at the habitual bedtime at the destination, starting on the first night after arrival, for at most 5 consecutive nights per journey. Not before 20:00 or after 04:00 local time, and not on the aircraft. No food for 2 hours before and after; no alcohol. Missed dose: skip it; do not take it after 04:00 local time.",
        "5 mg (Adaflex 5 mg only) ONLY where the patient has taken melatonin 3 mg for jet lag before, tolerated it, and it did not adequately relieve symptoms; AND that 3 mg use is recorded (in this pharmacy's records or another supply record the pharmacist has seen) or was of a licensed product the patient can name, obtained on prescription or from a pharmacy. Supplement or unlicensed use does not count. The patient must be under 65 and take no oestrogen.",
        "QUANTITY: 5 tablets for one journey, or 10 tablets for two journeys (outward and return). At most 10 tablets per supply. These are part packs, labelled as a dispensed medicine with the source pack's details and a copy of the leaflet. No more than four supplies under arm B in any 12 months, which keeps the patient within the licensed maximum of 16 treatment cycles a year; a patient who needs more is referred to a prescriber.",
        "Arm B specific exclusions: pilots, aircrew, air traffic controllers, or anyone on safety-critical duty during the trip (refer to their aviation medical examiner or occupational health); insomnia at home rather than jet lag (refer to a pharmacist to consider arm A); being in the middle of an arm A or Circadin course; and four supplies already in the last 12 months.",
      ],
      highlights: [
        "5 or more time zones.",
        "Destination bedtime, 20:00 to 04:00 local, never on the plane.",
        "Up to 5 nights per journey, 10 tablets per supply.",
        "Four supplies in 12 months at most.",
        "Travellers check destination import rules before travel.",
      ],
    },
    {
      id: "counselling",
      type: "checklist",
      title: "Counselling, driving and falls",
      items: [
        { label: "Drowsiness and driving", detail: "Melatonin has a moderate influence on the ability to drive and use machines. Do not drive, cycle, operate machinery or work at height if drowsy; take particular care the morning after the first few doses. Counsel specifically a patient who must be alert at night (a carer, or a parent of an infant), and record it." },
        { label: "Jet lag: driving after arrival", detail: "Do not take a dose on a night after which the patient must drive or operate machinery before a full night's sleep." },
        { label: "Falls (every patient supplied)", detail: "Sit on the edge of the bed for a moment before standing, put a light on, and keep the way to the toilet clear." },
        { label: "Food and alcohol", detail: "No food for 2 hours before and 2 hours after a dose. No alcohol." },
        { label: "No other melatonin", detail: "Including supplements. Supplements are unregulated in the UK and the label dose may not be what is in the product." },
        { label: "Arm A return visit", detail: "Come back in person on day 21 to day 30 after this supply (today is day 0) if you want to continue. If your sleep has not improved, we will stop it and suggest you see your GP." },
        { label: "Arm B caffeine and travel", detail: "Limit caffeine, especially later in the day. Check the destination's import rules; carry it in the labelled container in hand luggage with the pharmacy's record of supply." },
        { label: "When to stop and seek help", detail: "Daytime drowsiness, a fall, feeling low or anxious; same day for thoughts of self-harm; 999 (or the local emergency number abroad) for swelling of the lips or tongue or difficulty breathing." },
        { label: "Labelling", detail: "Label as a dispensed medicine with the PGD wording and BNF cautionary label 2." },
      ],
    },
    {
      id: "records",
      type: "content",
      title: "Records, GP notification, referral and Yellow Card",
      body: [
        "Arm A records include: age confirmed as 18 or over, GP, occupation and that no occupational exclusion applies; the off-label explanation and signed consent; duration and pattern of the insomnia, daytime effect and baseline 0 to 10 rating; every element of the secondary-cause history with the PHQ-2, GAD-2, STOP-Bang and Epworth scores; sleep hygiene duration or the severe impairment documented, and CBT-I signposting; contraception where relevant; the supply number, date of supply 1, tablets and strength today and in the course so far, previous courses and when the last ended, any GP review before a third or later course, and the route chosen for a patient aged 55 or over; at supplies 2 and 3 the review date, day number, nights without tablets and the review decision; product, PL number, batch, expiry, dose, quantity and whether a part pack; and the off-label wording.",
        "Arm B records include: consent, age confirmed as 18 or over, occupation and GP; the journey (destination, dates, time zones and direction, which journeys the supply covers, and that import advice was given); the full medicine list including oestrogens; for 5 mg, the previous 3 mg use and its source; product, PL number, batch, expiry, tablets supplied, part pack, and supplies in the last 12 months including today.",
        "GP notification (arm A): within 7 days of supply 1 and at the end of the course (including a stop), with the product, strength, dose, quantity, off-label status, the screens and the reason; at the end, the outcome and why the course ended. Routine referral is in writing with consent. Same-day referral for thoughts of self-harm, a fall with injury, or an adult safeguarding concern. 999 for difficulty breathing or swelling of the lips, tongue or throat. Where unsure, seek advice from the GP or the Get Real Health clinical team before supplying.",
        "Yellow Card: report suspected adverse reactions via the MHRA Yellow Card scheme; in arm A, because it is off-label, report every suspected adverse reaction. Records are signed, dated, legible and contemporaneous, and kept for 8 years.",
      ],
    },
    {
      id: "case-arm-a-review",
      type: "case",
      title: "Case 1: arm A review 1, aged 67",
      scenario:
        "A 67-year-old woman had supply 1 (Adaflex 3 mg, 30 tablets) with a baseline sleep quality rating of 4. She returns on day 26. Her rating today is 5. She has had no falls, no daytime drowsiness and no side effects, her PHQ-2 and GAD-2 remain below 3, and she takes no oestrogen. She wants to continue.",
      question: "What does the PGD allow at this review?",
      answer:
        "Supply 2 at 3 mg. A 1-point improvement is A LITTLE BETTER. The increase to 5 mg is not available to her because she is 65 or over, and A LITTLE BETTER where 5 mg is not allowed means supply 2 at 3 mg.",
      rationale:
        "Day 26 is inside the review window (day 21 to day 30), so she has not been without tablets. Had her rating been unchanged or worse (NO BETTER), the rule for a patient who cannot have 5 mg is STOP and refer to the GP. Record the rating, the band, the day number and the decision, and book review 2 for day 21 to day 30 after this supply.",
    },
    {
      id: "case-arm-b-ocp",
      type: "case",
      title: "Case 2: jet lag, combined pill, asking for 5 mg",
      scenario:
        "A 29-year-old woman is flying from London to Tokyo and back. She says 3 mg melatonin bought from a pharmacy in the UK last year did not help much and asks for 5 mg. She takes a combined oral contraceptive. No red flags, no falls, no autoimmune disease and no excluded medicines.",
      question: "What can be supplied, and how much?",
      answer:
        "3 mg only, never 5 mg, because she takes a medicine containing an oestrogen (ethinylestradiol can raise melatonin levels 4 to 5 fold). Up to 10 tablets, covering 5 nights after the outward flight and 5 nights after the return, since both journeys cross 5 or more time zones.",
      rationale:
        "Her previous 3 mg use from a pharmacy might otherwise have met the 5 mg criterion, but the 5 mg arm also requires the patient to be under 65 and to take no oestrogen. Counsel on destination bedtime timing (not before 20:00 or after 04:00 local, never on the plane), the no-food and no-alcohol rules, caffeine, drowsiness and driving, and checking Japan's import rules before travel. A pharmacy technician could make this supply.",
    },
    {
      id: "case-arm-a-driver",
      type: "case",
      title: "Case 3: insomnia in a delivery driver",
      scenario:
        "A 41-year-old man has had trouble getting to sleep on most nights for 2 months and has followed sleep hygiene for 3 weeks. His PHQ-2, GAD-2, STOP-Bang and Epworth are all below threshold. He works as a delivery van driver.",
      question: "Can he be supplied under arm A?",
      answer:
        "No. Professional drivers and safety-critical workers are excluded from arm A. Refer him to the GP, give the sleep hygiene advice in writing and signpost CBT-I.",
      rationale:
        "Anyone who drives for a living (including taxi, delivery, bus, lorry and emergency vehicle drivers) is excluded because next-day drowsiness is a safety risk, and NICE CKS advises specialist advice for occupational at-risk groups. Explain the reason and document the reason, the advice and the referral.",
    },
    {
      id: "summary",
      type: "summary",
      title: "Key takeaways",
      keyPoints: [
        "Adults 18 and over only. Licensed Adaflex 3 mg and 5 mg (and Colonis 3 mg for jet lag only). Never unlicensed melatonin, never Circadin under this PGD.",
        "The ceiling: one dose a night, never more than 5 mg in 24 hours from all sources; 3 mg at most at 65 or over or with any oestrogen. Only Adaflex 5 mg is supplied at 5 mg.",
        "Arm A insomnia is off-label and pharmacists only: consent script, signed Appendix 4 statement, GP told within 7 days of supply 1 and at the end.",
        "Arm A needs 3 nights a week for 4 weeks, 2 weeks of sleep hygiene (or documented severe impairment), CBT-I signposted, no secondary cause, and all four screens below threshold.",
        "Every red flag is a referral; self-harm thoughts are a same-day referral at any score. Any fall in the last 12 months excludes.",
        "Arm A course: three 30-tablet supplies, review on day 21 to 30 (accepted to 37), one increase to 5 mg at most, 90 nights and 104 days at most, 6 months between courses, GP review after two courses.",
        "Stop for no benefit, next-day drowsiness or a fall, new low mood or anxiety, an allergic reaction, or any unacceptable side effect. Never manage a problem by changing the dose.",
        "Arm B jet lag: 5 or more time zones, destination bedtime 20:00 to 04:00, up to 5 nights per journey, 10 tablets per supply, four supplies in 12 months. Pharmacists or technicians.",
        "Records kept 8 years. In arm A, report every suspected adverse reaction via Yellow Card.",
      ],
    },
  ],

  quiz: [
    {
      id: "q1",
      type: "single-choice",
      critical: true,
      question: "Who may supply under arm A (adult insomnia, off-label)?",
      options: [
        { id: "a", label: "Registered pharmacists or registered pharmacy technicians." },
        { id: "b", label: "Registered pharmacists only." },
        { id: "c", label: "Any member of the pharmacy team after reading the PGD." },
        { id: "d", label: "Pharmacists, or technicians where the patient is aged 55 or over." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Arm A is for registered pharmacists only, because it depends on the diagnostic sift for secondary causes of insomnia and on off-label consent. Pharmacy technicians may supply under arm B (jet lag) only.",
    },
    {
      id: "q2",
      type: "single-choice",
      critical: true,
      question: "What is the maximum dose for a 70-year-old under either arm?",
      options: [
        { id: "a", label: "5 mg, as for any adult." },
        { id: "b", label: "6 mg, the maximum in the Colonis SmPC." },
        { id: "c", label: "3 mg." },
        { id: "d", label: "2 mg prolonged-release only." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "3 mg is the maximum for a patient aged 65 or over, and for anyone taking a medicine containing an oestrogen, in both arms. The 6 mg dose in the Colonis SmPC is never used under this PGD.",
    },
    {
      id: "q3",
      type: "single-choice",
      critical: true,
      question: "During an arm A consultation the PHQ-2 total is 1, but the patient says they have had thoughts of harming themselves. What do you do?",
      options: [
        { id: "a", label: "Supply, because the PHQ-2 is below 3." },
        { id: "b", label: "Supply at 3 mg and review in 21 days." },
        { id: "c", label: "Do not supply; make a same-day referral (GP, NHS 111, or 999 if there is immediate risk), and do not leave a person at immediate risk alone." },
        { id: "d", label: "Do not supply; write to the GP routinely." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Any thoughts of self-harm or suicide, whatever the scores, need a same-day referral. The PGD says to ask directly about these thoughts whatever the PHQ-2 score.",
    },
    {
      id: "q4",
      type: "single-choice",
      question: "An arm A patient had supply 1 on 1 March (day 0). When is the review window for supply 2?",
      options: [
        { id: "a", label: "Day 7 to day 14." },
        { id: "b", label: "Day 21 to day 30, accepted up to day 37." },
        { id: "c", label: "Day 28 to day 42." },
        { id: "d", label: "Any time before day 103." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The review window is day 21 to day 30 after a supply, so a patient reviewed on time is never without tablets. Day 31 to day 37 is still accepted, with the nights without tablets recorded. After day 37 the course has ended.",
    },
    {
      id: "q5",
      type: "single-choice",
      question: "At review 1 a 45-year-old man on 3 mg, taking no oestrogen and with no unsafe caution, rates his sleep 1 point better than baseline and tolerated the tablets. What is supply 2?",
      options: [
        { id: "a", label: "Supply 2 at 5 mg." },
        { id: "b", label: "Supply 2 at 3 mg; increases only happen at review 2." },
        { id: "c", label: "Stop and refer to the GP." },
        { id: "d", label: "Supply 2 at 6 mg." },
      ],
      correctOptionIds: ["a"],
      explanation:
        "A 1 or 2 point improvement is A LITTLE BETTER. At review 1, A LITTLE BETTER or NO BETTER with tablets tolerated, under 65, no oestrogen and no unsafe caution means supply 2 at 5 mg, the only dose increase in the course.",
    },
    {
      id: "q6",
      type: "single-choice",
      critical: true,
      question: "Which medicine EXCLUDES a patient from both arms?",
      options: [
        { id: "a", label: "Omeprazole." },
        { id: "b", label: "Fluvoxamine." },
        { id: "c", label: "Nifedipine." },
        { id: "d", label: "Ciprofloxacin taken without any other sedating medicine." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Fluvoxamine is an exclusion, as are any benzodiazepine, z-drug, daridorexant or other prescribed hypnotic, warfarin or another vitamin K antagonist, and 5- or 8-methoxypsoralen. Omeprazole lowers melatonin levels and nifedipine may be less effective (counsel). Ciprofloxacin alone raises melatonin levels: supply with counselling; with another sedating medicine, refer.",
    },
    {
      id: "q7",
      type: "true-false",
      question: "True or false: a patient who had a fall without injury 8 months ago can be supplied under arm B provided they are counselled about getting up at night.",
      options: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
      correctOptionIds: ["false"],
      explanation:
        "The PGD has one falls definition for both arms: any fall in the last 12 months, including any fall with injury, is a referral, not a supply. The getting-up counselling is for every patient who IS supplied.",
    },
    {
      id: "q8",
      type: "single-choice",
      question: "Which patient may be supplied 5 mg under arm B?",
      options: [
        { id: "a", label: "A 40-year-old who found a 3 mg melatonin supplement bought online ineffective on a previous trip." },
        { id: "b", label: "A 52-year-old man, no oestrogen, whose recorded pharmacy supply of 3 mg for a previous trip was tolerated but did not adequately relieve symptoms." },
        { id: "c", label: "A 68-year-old who has never taken melatonin." },
        { id: "d", label: "Any adult flying east across 8 time zones." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "5 mg (Adaflex 5 mg only) requires previous 3 mg use for jet lag that was tolerated but inadequate, recorded or of a named licensed product from a prescription or pharmacy, in a patient under 65 who takes no oestrogen. Supplement use does not count.",
    },
    {
      id: "q9",
      type: "single-choice",
      question: "What is the most that can be supplied under arm B?",
      options: [
        { id: "a", label: "5 tablets per supply and one supply a year." },
        { id: "b", label: "10 tablets per supply and no more than four supplies in any 12 months." },
        { id: "c", label: "30 tablets per supply and 16 supplies a year." },
        { id: "d", label: "As many tablets as the trip needs." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Up to 5 nights per journey and up to two journeys (outward and return) per supply, so no more than 10 tablets per supply, and no more than four supplies in any 12 months, which keeps the patient within the licensed maximum of 16 treatment cycles a year.",
    },
    {
      id: "q10",
      type: "single-choice",
      question: "When may a traveller take their arm B dose?",
      options: [
        { id: "a", label: "On the plane, at the destination's bedtime." },
        { id: "b", label: "At the habitual bedtime at the destination, starting on the first night after arrival, not before 20:00 or after 04:00 local time." },
        { id: "c", label: "At UK bedtime for the first 5 nights." },
        { id: "d", label: "Whenever they wake in the night." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The dose is taken at the habitual bedtime at the destination from the first night after arrival, for up to 5 nights, not before 20:00 or after 04:00 local time, and never on the aircraft, with no food for 2 hours either side.",
    },
    {
      id: "q11",
      type: "single-choice",
      question: "A patient finished an arm A course (supply 3) four months ago and asks to start again. What applies?",
      options: [
        { id: "a", label: "Start supply 1 of a new course today." },
        { id: "b", label: "Not yet: at least 6 months must pass from the end of one course to supply 1 of the next." },
        { id: "c", label: "Supply under arm B instead." },
        { id: "d", label: "Supply 4 of the same course." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "There must be at least 6 months between the end of one course and supply 1 of the next (Circadin PGD courses count). After two courses in total, a further course needs a documented GP review. Arm B is for jet lag only, and there is never a fourth supply in a course.",
    },
    {
      id: "q12",
      type: "true-false",
      question: "True or false: completing this Get Real Health training module is a condition of access to the melatonin PGD tool.",
      options: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
      correctOptionIds: ["false"],
      explanation:
        "Training is optional on the platform and is not a condition of access. The PGD says practitioners should complete this training or equivalent training before first working under it, with the date recorded, and the employing organisation remains responsible for being satisfied of each practitioner's competence.",
    },
  ],
} as TrainingModule;
