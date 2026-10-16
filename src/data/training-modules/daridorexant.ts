// Long-Term Insomnia (Daridorexant), PGD training
//
// Source: Get Real Health PGD "Long-Term Insomnia" (daridorexant, QUVIVIQ,
// slug daridorexant), version 001, valid from 15 October 2026. Content in
// this module is drawn from that document only. The Insomnia Severity Index
// and Epworth Sleepiness Scale item wording is used under licence and is
// deliberately not reproduced.

import type { TrainingModule } from "./types";

export const daridorexantModule = {
  slug: "daridorexant",
  title: "Long-Term Insomnia (Daridorexant), PGD training",
  description:
    "QUVIVIQ (daridorexant, black triangle) for adults aged 18 to 75 with long-term insomnia meeting NICE TA922: CBT-I first, structured screens, interactions, the driving plan, a three-supply initiation course with an effectiveness assessment, stop rules and prescriber handover. Pharmacists only.",
  pgdSlugs: ["daridorexant"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "Dr Nitin Shori (Medical Director) and Christopher Pilkington (Head Pharmacist), 16 October 2026",
  alignedToPgd: { daridorexant: "v001" },
  reviewStatus: "signed-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-10-16",
  estimatedMinutes: 35,
  passMark: 0.8,

  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Daridorexant for long-term insomnia, PGD training",
      subtitle:
        "QUVIVIQ 50 mg and 25 mg film-coated tablets (black triangle) for adults aged 18 to 75 at the first supply: an initiation course of up to three 30-tablet supplies, then a prescriber",
      estimatedMinutes: 35,
      objectives: [
        "Confirm long-term insomnia as NICE TA922 defines it, with an ISI of 15 or more and a 1 to 2 week sleep diary.",
        "Apply the CBT-I rule: tried and not worked, not available (judged by NHS access), or unsuitable, and deliver the brief CBT-I components where needed.",
        "Score and act on the ISI, PHQ-9, GAD-2 and GAD-7, Epworth and STOP-Bang screens, and refer every other sleep disorder and untreated cause.",
        "Check interactions (CYP3A4 inhibitors and inducers, narrow therapeutic index medicines, CNS depressants and sleep aids) and set the dose at 50 mg or 25 mg.",
        "Agree a workable driving plan before supply 1 and apply the 9-hour rule.",
        "Run supply visits 2 and 3 on time, apply the adequate response definition and the stop rules, and write the handover letter.",
        "Keep the records, GP notifications, Yellow Card reports and audit dataset the PGD requires.",
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
        "This PGD authorises a registered pharmacist, face to face on the pharmacy premises, without a prescription, as a private service, to supply daridorexant to an adult aged 18 to 75 at the first supply with long-term insomnia (symptoms on 3 or more nights a week for at least 3 months, with a considerable effect on daytime functioning) for whom CBT-I has been tried and has not worked, or is not available, or is unsuitable, as NICE TA922 recommends.",
        "It is an INITIATION COURSE ONLY: three numbered supplies of 30 tablets (90 tablets, about 13 weeks of nightly treatment), once per patient, counted from supply 1 and never reset by a gap, a stop or a change of pharmacy. There is no fourth supply under this PGD in any circumstance. Any continuation is for a prescriber, who may decide not to continue it.",
        "Pharmacists only. The insomnia assessment, the screening questionnaires, the interaction and Summary Care Record checks, the brief CBT-I advice and the effectiveness assessment are not delegated to pharmacy technicians. There are no remote or telephone consultations, and a patient not registered with a GP is not supplied.",
        "QUVIVIQ is a BLACK TRIANGLE medicine, subject to additional monitoring: report every suspected adverse reaction, however minor, via Yellow Card. It is a prescription-only medicine and is not a controlled drug in the UK.",
      ],
      highlights: [
        "Ages 18 to 75 at the first supply. A patient who turns 76 during the course may complete it.",
        "Pharmacists only, face to face.",
        "Three supplies of 30 tablets, once per patient, never reset.",
        "Black triangle: Yellow Card for every suspected reaction.",
      ],
    },
    {
      id: "medicine",
      type: "content",
      title: "The medicine and what to tell the patient",
      body: [
        "Daridorexant is a dual orexin receptor antagonist: it blocks orexin, a brain chemical that keeps you awake. It is not a benzodiazepine or a Z-drug. It is taken every night, within 30 minutes before going to bed, not as and when needed.",
        "QUVIVIQ 50 mg (light orange, PLGB 48711/0003) and 25 mg (light purple, PLGB 48711/0002) film-coated tablets. Record the marketing authorisation number printed on the pack supplied. No lactose. No special storage conditions.",
        "Set expectations honestly. In trials, at 3 months on 50 mg, patients fell asleep about 12 minutes sooner and spent about 18 minutes less time awake in the night than with a dummy tablet, measured in a sleep laboratory, with smaller differences in what patients themselves noticed. It works alongside, not instead of, good sleep habits and CBT-I.",
        "Contraindications (SmPC): hypersensitivity to daridorexant or an excipient; narcolepsy; and concomitant strong CYP3A4 inhibitors. It may be stopped at any time without tapering; no rebound insomnia was seen after 3 months of treatment in trials.",
      ],
    },
    {
      id: "inclusion",
      type: "checklist",
      title: "Inclusion at the first supply: all of these",
      items: [
        { label: "Age", detail: "18 to 75 inclusive." },
        { label: "Long-term insomnia", detail: "Difficulty getting to sleep, staying asleep or waking too early, or unrefreshing sleep, on 3 or more nights a week for at least 3 months, despite adequate opportunity and circumstances for sleep. Record the pattern, duration and usual bed and rising times." },
        { label: "Sleep diary", detail: "At least 7 and up to 14 consecutive nights before supply 1, consistent with the history. A patient without one is given a diary and supply 1 is booked for when it is complete." },
        { label: "Daytime impact and ISI", detail: "A considerable effect on daytime functioning in the patient's own words, AND an Insomnia Severity Index of 15 or more at supply 1, recorded as the baseline." },
        { label: "Sleep hygiene", detail: "Followed for at least the last 4 weeks without adequate improvement, and given again in writing." },
        { label: "CBT-I", detail: "Tried and not worked, not available, or unsuitable, recorded with the reason (next slide)." },
        { label: "Screens", detail: "STOP-Bang rules passed, Epworth 10 or below, PHQ-9 below 10 with question 9 'not at all', GAD-2 below 3 (or GAD-7 below 10)." },
        { label: "Driving plan agreed", detail: "Usual bedtime, earliest driving or alert activity each day and whether the patient drives for work recorded, and a workable plan agreed." },
        { label: "Medicines, allergies and Summary Care Record", detail: "Checked against Appendix 4 including over the counter, herbal and recreational products. The SCR is checked with consent; a patient who refuses consent to the check where a record exists is not supplied." },
        { label: "GP and expectations", detail: "Registered with a GP and agrees to the GP being informed. Understands the three-supply limit, that treatment stops if it has not helped enough at visit 3, that continuation is a prescriber's decision the GP may decline, and that a private prescriber is the alternative. Valid consent, understanding it is a private service and what it costs." },
      ],
    },
    {
      id: "cbti",
      type: "comparison",
      title: "CBT-I first: tried, not available, or unsuitable",
      intro:
        "NICE TA922 recommends daridorexant only where CBT-I has been tried and not worked, or is not available, or is unsuitable. Where it is NOT AVAILABLE or UNSUITABLE, the pharmacist delivers the brief CBT-I components at supply 1 (stimulus control, a sleep window plan, continuing the sleep diary) and reinforces them at visits 2 and 3. Formal sleep restriction therapy is not delivered under this PGD.",
      columns: [
        {
          label: "Tried and not worked",
          rows: [
            { heading: "Definition", body: "Completed, or engaged with for at least 4 weeks, a structured CBT-I programme (face to face, group, or digital such as Sleepio or SilverCloud Space for Sleep) within the last 2 years, without adequate improvement." },
            { heading: "Evidence", body: "The patient's account is sufficient. Record the programme, approximate dates and how far they got, and any written evidence they have." },
          ],
        },
        {
          label: "Not available",
          rows: [
            { heading: "Judged by NHS access", body: "Not by willingness to pay. Declining to pay does not affect eligibility, and neither does a decision to pay." },
            { heading: "Free NHS digital CBT-I counts as AVAILABLE", body: "Wherever it is offered to the patient: Sleepio for people living in Scotland, SilverCloud Space for Sleep for people aged 16 and over living in Wales, Sleepio in England where locally commissioned." },
            { heading: "Otherwise not available when", body: "No NHS CBT-I is offered where they live (record what was checked), or the only NHS option is face to face with a wait of more than 3 months and no NHS digital option is offered." },
          ],
        },
        {
          label: "Unsuitable",
          rows: [
            { heading: "Definition", body: "CBT-I cannot reasonably be delivered: a cognitive, sensory or language barrier with no adapted programme, no access to or ability to use digital where no face to face option exists, or a reason recorded by the GP or a sleep or mental health clinician." },
            { heading: "Not unsuitability", body: "A preference not to try CBT-I. That patient is signposted and not supplied, and invited back if it has not worked after at least 4 weeks of engagement." },
          ],
        },
      ],
    },
    {
      id: "screens",
      type: "content",
      title: "The screens: thresholds, not wording",
      body: [
        "The pharmacy uses its own licensed or permitted copies of each questionnaire and does not copy them from the PGD. The ISI and Epworth wording is used under licence and is not reproduced here.",
        "INSOMNIA SEVERITY INDEX: seven items about the last 2 weeks, each 0 to 4, total 0 to 28 (0 to 7 none, 8 to 14 subthreshold, 15 to 21 moderate, 22 to 28 severe). 15 or more at supply 1 to include. The patient completes it themselves. Repeated at visits 2 and 3.",
        "PHQ-9: total 0 to 27. Supply requires a total below 10 AND question 9 answered 'not at all', at every supply visit. GAD-2: 0 to 6; 3 or more is followed by the full GAD-7 (0 to 21), and a GAD-7 of 10 or more excludes. PHQ-9 and GAD-2 are repeated at every supply visit.",
        "EPWORTH: eight everyday situations, each 0 to 3, total 0 to 24. Above 10 suggests excessive daytime sleepiness, which is not typical of insomnia: exclude and refer.",
        "STOP-BANG, with height, weight and neck measured in the pharmacy (neck at the level of the Adam's apple). REFER if the score is 5 or more; OR 2 or more of the four STOP items (Snoring, Tired, Observed, Pressure) together with male sex, BMI over 35 or neck over 40 cm; OR a 'yes' to Observed at any score. STOP-Bang is not used for a patient with diagnosed OSA using CPAP most nights: confirm and record CPAP use under Cautions; a patient not using it most nights is excluded.",
      ],
      highlights: [
        "ISI 15 or more to start.",
        "PHQ-9 below 10, question 9 'not at all', every visit.",
        "GAD-2 below 3, or GAD-7 below 10.",
        "Epworth 10 or below.",
        "Three STOP-Bang referral rules.",
      ],
    },
    {
      id: "exclusions",
      type: "checklist",
      title: "Exclusions: refer, do not supply",
      items: [
        { label: "Age", detail: "Under 18, or 76 or over at the first supply." },
        { label: "Narcolepsy or excessive sleepiness", detail: "Narcolepsy (contraindicated), Epworth above 10, falling asleep unintentionally in the day, cataplexy, or recurrent sleep paralysis or hallucinations on falling asleep or waking before any treatment." },
        { label: "Possible or untreated sleep apnoea", detail: "Either STOP-Bang rule, witnessed apnoea, or diagnosed OSA not treated or CPAP not used most nights." },
        { label: "Another sleep disorder", detail: "Restless legs, a circadian rhythm disorder, night or rotating shift work that includes nights, or a history of sleepwalking, sleep-eating, sleep-driving or other complex sleep behaviour." },
        { label: "An untreated cause", detail: "Uncontrolled pain, breathlessness lying flat, uninvestigated nocturia, undiscussed menopausal symptoms, overactive thyroid symptoms, a medicine started or changed in the 3 months before the insomnia began, or caffeine after mid-afternoon or energy drinks not yet tried stopping." },
        { label: "Mental health", detail: "PHQ-9 10 or more, GAD-7 10 or more, any answer other than 'not at all' to PHQ-9 question 9, current suicidal or self-harm thoughts, self-harm or a suicide attempt in the last 2 years, bipolar disorder, psychosis, schizophrenia, an eating disorder, PTSD under active treatment or with nightmares, secondary care mental health team, or depression or anxiety treatment started or changed in the last 3 months." },
        { label: "Substances", detail: "Current or past misuse of or dependence on alcohol, prescribed medicines or recreational drugs; more than 14 units of alcohol a week; regular cannabis or cannabis-based products." },
        { label: "Liver and breathing", detail: "Any known chronic liver disease or hepatic impairment of any degree. Severe COPD (FEV1 below 40 per cent predicted where known, home oxygen, or a COPD admission in the last 12 months), chronic respiratory failure, obesity hypoventilation, or a neuromuscular condition affecting breathing." },
        { label: "Pregnancy and caring", detail: "Pregnancy, planning a pregnancy during the course, or breastfeeding. The sole night-time carer of an infant or a dependent adult." },
        { label: "Older adults", detail: "Aged 65 or over with a fall in the last 12 months, a walking aid, or getting up to the toilet 2 or more times on most nights; or dementia or any condition affecting memory." },
        { label: "Driving and safety-critical work", detail: "Cannot keep 9 hours between a dose and driving or alert work, cannot arrange 4 nights before no-driving days for the first 4 doses, a Group 2 licence holder who drives for work, or a safety-critical role (pilot, air traffic controller, train driver, on-call needing full alertness within 9 hours of bedtime)." },
        { label: "Previous or current use", detail: "Already taking daridorexant or another orexin receptor antagonist from any source, or a course under this PGD already started or completed at any pharmacy, whatever its outcome." },
      ],
    },
    {
      id: "interactions",
      type: "comparison",
      title: "Interactions (Appendix 4)",
      intro:
        "Daridorexant is about 89 per cent metabolised by CYP3A4. A prescribed medicine is never stopped to allow supply: refer. The dose of tablets already in the patient's possession is never changed (NICE MPG2 1.1.12).",
      columns: [
        {
          label: "Excluded",
          rows: [
            { heading: "Strong CYP3A4 inhibitors (contraindicated)", body: "Itraconazole, ketoconazole, posaconazole, voriconazole, clarithromycin, ritonavir, cobicistat, nirmatrelvir with ritonavir (Paxlovid), idelalisib." },
            { heading: "CYP3A4 inducers", body: "Carbamazepine, phenytoin, phenobarbital, primidone, rifampicin, rifabutin, efavirenz, etravirine, enzalutamide, apalutamide, mitotane, modafinil, bosentan, St John's wort." },
            { heading: "Narrow therapeutic index", body: "Tacrolimus, sirolimus, everolimus, ciclosporin, digoxin, dabigatran, colchicine taken regularly, simvastatin 80 mg." },
            { heading: "Regular CNS depressants", body: "Benzodiazepines, zopiclone, zolpidem, melatonin from any source, mirtazapine, trazodone, tricyclics at any dose, antipsychotics, gabapentin, pregabalin, opioids including codeine and tramadol, antiepileptics, sedating antihistamines most nights, baclofen, tizanidine, cannabis." },
          ],
        },
        {
          label: "Moderate CYP3A4 inhibitors",
          rows: [
            { heading: "Examples", body: "Diltiazem, verapamil, erythromycin, ciprofloxacin, fluconazole, isavuconazole, fluvoxamine, dronedarone, aprepitant, imatinib, crizotinib, letermovir." },
            { heading: "Taken regularly at supply 1", body: "Stable dose, expected to continue: 25 mg. This is the ONLY reason for 25 mg under this PGD." },
            { heading: "Started regularly during the course", body: "Stop daridorexant from the first dose of the inhibitor and return within 7 days (otherwise the course ends). The 50 mg tablets in hand are not taken and are returned for destruction. A further supply only at 25 mg, if every criterion is met." },
            { heading: "Short course (moderate or strong)", body: "Do not take daridorexant from the first dose until 7 days after the last dose, then resume. Record the withheld nights." },
          ],
        },
        {
          label: "Sleep aids and other points",
          rows: [
            { heading: "The single sleep aid rule", body: "Bought sedating antihistamines (diphenhydramine, promethazine), melatonin from any source and herbal sedatives such as valerian are stopped before the course. First dose at least 48 hours after the last dose of promethazine or another long-acting sedating antihistamine; for other sleep aids, at least the night before." },
            { heading: "Occasional sedating dose", body: "For example chlorphenamine for hay fever or a codeine painkiller: do not take daridorexant that night." },
            { heading: "No adjustment needed", body: "Hormonal contraceptives, warfarin, rosuvastatin, citalopram, acid-reducing medicines. Simvastatin up to 40 mg and atorvastatin: no change; report unexplained muscle pain." },
            { heading: "Alcohol and grapefruit", body: "No alcohol on the evening of a dose. No grapefruit or grapefruit juice in the evening." },
          ],
        },
      ],
    },
    {
      id: "driving",
      type: "callout",
      title: "The driving plan, agreed before supply 1",
      tone: "danger",
      message:
        "In a simulator study driving was impaired the morning after the first 50 mg dose, 9 hours after taking it, but not after 4 consecutive nights. No driving the morning after the first dose. The first 4 doses are taken only on nights before a day with no driving. After that, at least 9 hours between a dose and driving, cycling or operating machinery, and only when fully alert.",
      detail: [
        "Record the usual bedtime, the usual earliest time of driving or other activity needing full alertness on each day of the week, and whether the patient drives for work.",
        "Skip the dose on any night when 9 hours is not possible.",
        "Anyone who must drive or do safety-critical work in the morning and cannot keep 9 hours is not supplied.",
        "It is an offence to drive while unfit through drugs, including prescribed medicines.",
        "A patient who falls asleep unintentionally while driving, or who has a high Epworth score and drives, is advised not to drive until assessed and that DVLA rules may apply.",
      ],
    },
    {
      id: "course",
      type: "content",
      title: "The course: dose, timing and the three supply visits",
      body: [
        "DOSE: 50 mg (one tablet) once nightly, within 30 minutes before going to bed. 25 mg once nightly ONLY for a patient who regularly takes a moderate CYP3A4 inhibitor at a stable dose. Maximum one tablet in 24 hours. A dose forgotten at bedtime is not taken during the night. With or without food, but not soon after a large meal.",
        "TIMING: supply visits 2 and 3 are each 25 to 35 days after the previous supply and no more than 7 days after the patient's last tablet; the patient attends in the last few days before running out. More than 7 nights without tablets, other than nights withheld on this PGD's instruction, ends the course: refer to a prescriber. Recorded withheld nights extend the 35-day limit by the same number, provided visit 3 is still within 13 weeks of supply 1.",
        "SUPPLY VISIT 2 is an early safety review: stop symptoms, next-day effects and driving, PHQ-9 and GAD-2, nights taken out of the last 14, new medicines and the Summary Care Record rechecked, brief CBT-I reinforced, and the ISI recorded. EARLY STOP: if the ISI is unchanged or higher than baseline and the patient wishes to stop, no supply 2 and the GP is informed. Otherwise supply 2 is made when the criteria are met, including where the ISI is unchanged or worse but the patient wishes to continue and no stop rule applies.",
        "SUPPLY VISIT 3 is the NICE TA922 effectiveness assessment. First count the nights taken out of the last 14 on which a dose was due (withheld nights are not due, and the count goes back past them): at least 10 are needed to judge the response; with fewer, no supply 3, refer to the GP. ADEQUATE RESPONSE means ALL of: the ISI has fallen by 6 points or more from the supply 1 score; the current ISI is 14 or below; the patient reports better daytime functioning; and the patient wishes to continue. Then supply 3 (the last) and send the handover letter the same day. Otherwise STOP: the patient stops the next night, no tapering, re-engages with CBT-I, and the GP is informed.",
        "The response threshold is the Medical Director's decision, informed by SMC2611 (mean ISI fall at 3 months 7.2 points on 50 mg and 5.4 on placebo). It is not a responder definition published by NICE or SMC.",
      ],
      highlights: [
        "50 mg nightly; 25 mg only with a regular moderate CYP3A4 inhibitor.",
        "Visits 25 to 35 days apart, within 7 days of the last tablet.",
        "Visit 3: ISI down 6 or more AND 14 or below AND daytime better AND wishes to continue.",
        "At least 10 of the last 14 due nights taken to judge response.",
        "Three supplies, then a prescriber.",
      ],
    },
    {
      id: "stop-rules",
      type: "callout",
      title: "Stop rules, one per symptom, never managed by reducing the dose",
      tone: "warning",
      message:
        "After any stop rule: no further supply under this PGD, refer to the GP, and report on a Yellow Card.",
      detail: [
        "STOP AND SEEK HELP THE SAME DAY: thoughts of suicide or self-harm; a serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing); driving while not fully awake; or any other activity while not fully awake that caused an injury or could have done.",
        "STOP AND CONTACT THE PHARMACY OR GP WITHIN A WEEK: sleep paralysis; seeing or hearing things that are not there on falling asleep or waking; sudden weakness of the legs, face or neck brought on by laughter or strong emotion; sleepwalking or other activity while not fully awake that is not remembered where no one was hurt or put at risk; new or worsening low mood or anxiety; still feeling sleepy or slowed in the mornings after the first week; a fall; or a rash.",
        "Headache, nausea, dizziness, tiredness, nightmares or vivid dreams are not stop symptoms on their own.",
        "The patient may stop at any time for any reason, without tapering.",
        "A request for an early supply or a report of lost tablets is a reason to refer, not to supply (abuse potential at high doses).",
      ],
    },
    {
      id: "handover",
      type: "content",
      title: "Handover, GP notification, records and audit",
      body: [
        "HANDOVER LETTER at supply visit 3, to the GP or another prescriber the patient chooses, while the patient still has a month of tablets. It is information plus a request: baseline and current ISI, PHQ-9 and GAD scores, dose, supply dates, adherence, adverse effects, the CBT-I position, that NICE TA922 requires continued treatment to be reassessed at regular intervals, and a request to consider whether to continue. It states the decision is the prescriber's, and that if the GP does not continue the patient may see a private prescriber.",
        "The GP is informed within 7 days of supply 1, within 7 days of any stop for a side effect, and at visit 3 of the outcome of the effectiveness assessment (a handover letter or a stop notification).",
        "Records include the sleep history and diary summary; ISI, PHQ-9 with question 9, GAD-2 (and GAD-7), Epworth, STOP-Bang with the number of STOP items, measured height, weight, BMI and neck, and the witnessed apnoea answer; sleep hygiene and the CBT-I category with its evidence; medicines, the SCR check and any sleep aid stopped; the driving plan; product (QUVIVIQ, black triangle) with its authorisation number, dose, 30 tablets, batch, expiry and the SUPPLY NUMBER with the date of supply 1; the words: supply under Get Real Health PGD Long-Term Insomnia (Daridorexant), version 001; at visits 2 and 3, the last tablet date, nights taken and withheld; and the pharmacist's name and GPhC number. Records are kept for 8 years.",
        "Each adopting pharmacy keeps an anonymised audit dataset of every course (supplies, ISI at each visit and the change, PHQ-9 and GAD scores, stops by reason, referrals and whether the prescriber continued, and Yellow Card reports) and gives it to Get Real Health on request. The Medical Director reviews it before the review date.",
      ],
    },
    {
      id: "case-cbti",
      type: "case",
      title: "Case 1: 'I would rather not do CBT-I'",
      scenario:
        "A 48-year-old woman living in Scotland has had difficulty staying asleep on 5 nights a week for 8 months. Her ISI is 18 and her sleep diary fits. She has never tried CBT-I and says she would rather take a tablet. She has followed sleep hygiene advice for 6 weeks.",
      question: "Can she be supplied?",
      answer:
        "No. Free NHS digital CBT-I (Sleepio) is offered to anyone living in Scotland, so CBT-I is AVAILABLE, and a preference not to try it does not make it unsuitable. Signpost her to Sleepio, give sleep hygiene advice in writing, and invite her to return if it has not worked after at least 4 weeks of engagement.",
      rationale:
        "NICE TA922 recommends daridorexant only where CBT-I has been tried and not worked, is not available, or is unsuitable. Not available is judged by NHS access, not by willingness to pay, and free NHS digital CBT-I counts as available wherever it is offered to the patient.",
    },
    {
      id: "case-diltiazem",
      type: "case",
      title: "Case 2: diltiazem started mid-course",
      scenario:
        "A 62-year-old man had supply 1 of 50 mg 12 days ago. His cardiologist has just started him on regular diltiazem, which he will continue. He rings the pharmacy before taking his next daridorexant tablet.",
      question: "What should he do, and what can be supplied?",
      answer:
        "He stops daridorexant from the first dose of diltiazem and returns to the pharmacy within 7 days of stopping. The 50 mg tablets in hand are not taken and are returned for destruction. A further supply is made only at 25 mg and only if every visit 2 criterion is met; it counts as supply 2, and the 25-day minimum does not apply.",
      rationale:
        "Diltiazem is a moderate CYP3A4 inhibitor (it raised daridorexant exposure 2.4 times). The dose of tablets already in the patient's possession is never changed (MPG2 1.1.12). The nights stopped are recorded as withheld nights, not nights without tablets. If he does not return within 7 days, the course ends and he is referred to the GP.",
    },
    {
      id: "case-visit3",
      type: "case",
      title: "Case 3: the effectiveness assessment",
      scenario:
        "At supply visit 3 a 55-year-old man has taken tablets on 13 of the last 14 nights. His baseline ISI was 19 and today it is 15. He says he feels a bit better in the daytime and wants to continue. No stop symptoms, PHQ-9 is 4 with question 9 'not at all', GAD-2 is 1.",
      question: "Is supply 3 made?",
      answer:
        "No. His ISI has fallen by 4 points (not 6 or more) and the current ISI of 15 is above 14, so this is not an adequate response. Stop: he stops the next night without tapering, is advised to re-engage with CBT-I, and the GP is informed.",
      rationale:
        "An adequate response needs ALL four elements: a fall of 6 points or more, a current ISI of 14 or below, better daytime functioning, and the wish to continue. Adherence (at least 10 of the last 14 due nights) was enough to judge the response. Record the baseline and current ISI, the change, the decision and the date of the GP notification.",
    },
    {
      id: "summary",
      type: "summary",
      title: "Key takeaways",
      keyPoints: [
        "Pharmacists only, face to face, adults 18 to 75 at the first supply, GP registered and notified. QUVIVIQ is a black triangle medicine: Yellow Card for every suspected reaction.",
        "Long-term insomnia: 3 or more nights a week for at least 3 months, considerable daytime effect, ISI 15 or more, and a 7 to 14 night sleep diary.",
        "CBT-I first: tried and not worked, not available (NHS access; free NHS digital counts as available), or unsuitable (a preference is not unsuitability). Brief CBT-I components where not available or unsuitable.",
        "Screens: PHQ-9 below 10 with question 9 'not at all' and GAD-2 below 3 (or GAD-7 below 10) at every visit; Epworth 10 or below; three STOP-Bang referral rules.",
        "Excluded: strong CYP3A4 inhibitors, inducers, the narrow therapeutic index list, regular CNS depressants. 25 mg only with a regular moderate CYP3A4 inhibitor. Never change the dose of tablets in hand.",
        "Driving plan before supply 1: no driving the morning after the first dose, first 4 doses before no-driving days, then 9 hours and fully alert.",
        "Visits 25 to 35 days apart and within 7 days of the last tablet. Visit 2 is an early safety review; visit 3 needs an ISI fall of 6 or more, ISI 14 or below, better daytime functioning and the wish to continue.",
        "Two-tier stop rules, never a dose reduction. Three supplies once per patient, never reset, then a handover letter to a prescriber who may decline to continue.",
      ],
    },
  ],

  quiz: [
    {
      id: "q1",
      type: "single-choice",
      critical: true,
      question: "Which of these is the ONLY reason for supplying 25 mg under this PGD?",
      options: [
        { id: "a", label: "The patient is aged 65 to 75." },
        { id: "b", label: "Moderate hepatic impairment." },
        { id: "c", label: "The patient regularly takes a moderate CYP3A4 inhibitor at a stable dose and expects to continue it." },
        { id: "d", label: "The patient felt drowsy the morning after 50 mg." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "25 mg once nightly applies only where the patient regularly takes a moderate CYP3A4 inhibitor (for example diltiazem or verapamil). Any chronic liver disease or hepatic impairment is an exclusion. Morning sleepiness after the first week is a stop symptom, never managed by reducing the dose.",
    },
    {
      id: "q2",
      type: "single-choice",
      critical: true,
      question: "A patient takes clarithromycin regularly for a long-term condition. What applies?",
      options: [
        { id: "a", label: "Supply 25 mg." },
        { id: "b", label: "Supply 50 mg and advise no grapefruit." },
        { id: "c", label: "Exclude: clarithromycin is a strong CYP3A4 inhibitor and is contraindicated." },
        { id: "d", label: "Ask the patient to stop clarithromycin so that daridorexant can be supplied." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Strong CYP3A4 inhibitors such as clarithromycin, itraconazole and ritonavir are contraindicated. A prescribed medicine is never stopped to allow supply. A short course started during treatment is handled by withholding daridorexant until 7 days after the last dose.",
    },
    {
      id: "q3",
      type: "single-choice",
      critical: true,
      question: "At supply visit 2, the patient's PHQ-9 total is 6 but question 9 is answered 'several days'. What do you do?",
      options: [
        { id: "a", label: "Supply, because the total is below 10." },
        { id: "b", label: "Do not supply. Ask about plans and intent: immediate danger or a plan means 999 or accompanied attendance at A&E; otherwise same-day contact with the GP or NHS 111, and give the Samaritans number." },
        { id: "c", label: "Supply 25 mg instead." },
        { id: "d", label: "Do not supply and write to the GP routinely." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Any answer other than 'not at all' to PHQ-9 question 9 excludes at every visit and needs a same-day assessment of suicide or self-harm risk. Thoughts of suicide or self-harm are also a same-day stop rule.",
    },
    {
      id: "q4",
      type: "single-choice",
      question: "Which counts as CBT-I being NOT AVAILABLE?",
      options: [
        { id: "a", label: "The patient does not want to pay for a private programme." },
        { id: "b", label: "The patient lives in Wales and would prefer not to use SilverCloud." },
        { id: "c", label: "No NHS digital option is offered where the patient lives and the only NHS option is face to face with a wait of more than 3 months." },
        { id: "d", label: "The patient prefers tablets." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Not available is judged by NHS access, not by willingness to pay. Free NHS digital CBT-I (Sleepio in Scotland, SilverCloud Space for Sleep in Wales, Sleepio in England where commissioned) counts as available. A preference not to try CBT-I is not unsuitability.",
    },
    {
      id: "q5",
      type: "single-choice",
      question: "What is the minimum ISI score to include a patient at supply 1?",
      options: [
        { id: "a", label: "8" },
        { id: "b", label: "10" },
        { id: "c", label: "15" },
        { id: "d", label: "22" },
      ],
      correctOptionIds: ["c"],
      explanation:
        "An ISI of 15 or more at supply 1 is required, recorded as the baseline (the entry level used in the phase 3 trials).",
    },
    {
      id: "q6",
      type: "multi-choice",
      question: "At supply visit 3, which are ALL required for an adequate response? Select all that apply.",
      options: [
        { id: "a", label: "ISI fallen by 6 points or more from the supply 1 score." },
        { id: "b", label: "Current ISI of 14 or below." },
        { id: "c", label: "The patient reports better daytime functioning." },
        { id: "d", label: "The patient wishes to continue." },
        { id: "e", label: "The GP has agreed in advance to continue treatment." },
      ],
      correctOptionIds: ["a", "b", "c", "d"],
      explanation:
        "An adequate response is ALL of a fall of 6 or more, a current ISI of 14 or below, better daytime functioning, and the wish to continue. GP agreement is not required for supply 3; the handover letter asks the prescriber to consider continuing, and they may decline.",
    },
    {
      id: "q7",
      type: "single-choice",
      critical: true,
      question: "What is the driving advice for the first doses?",
      options: [
        { id: "a", label: "Drive normally if you feel fine." },
        { id: "b", label: "No driving the morning after the first dose; take the first 4 doses only on nights before a day with no driving; after that at least 9 hours between a dose and driving, and only when fully alert." },
        { id: "c", label: "Leave 4 hours between a dose and driving." },
        { id: "d", label: "Avoid driving for the whole course." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "In a simulator study driving was impaired 9 hours after the first 50 mg dose but not after 4 consecutive nights. The plan is agreed and recorded before supply 1, and the dose is skipped on any night when 9 hours is not possible.",
    },
    {
      id: "q8",
      type: "single-choice",
      question: "A patient had supply 1 and returns on day 40, having run out of tablets 10 days ago. What applies?",
      options: [
        { id: "a", label: "Supply 2 as normal." },
        { id: "b", label: "Restart at supply 1." },
        { id: "c", label: "The course has ended (more than 7 nights without tablets and outside the visit interval): refer to a prescriber." },
        { id: "d", label: "Supply 2 at 25 mg." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Supply visits are 25 to 35 days after the previous supply and no more than 7 days after the last tablet. More than 7 nights without tablets (other than recorded withheld nights) ends the course, and supplies are never reset, so there is no restart under this PGD.",
    },
    {
      id: "q9",
      type: "single-choice",
      question: "Two weeks into the course a patient reports one episode of being unable to move or speak for a while on waking. What does the PGD require?",
      options: [
        { id: "a", label: "Continue; it is a common side effect." },
        { id: "b", label: "Reduce to 25 mg." },
        { id: "c", label: "Stop, no further supply under this PGD, contact with the pharmacy or GP within a week, refer to the GP, and report on a Yellow Card." },
        { id: "d", label: "Call 999." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Sleep paralysis is a stop-within-a-week symptom. Stop rules are one per symptom and are never managed by reducing the dose. After any stop: no further supply, refer to the GP, Yellow Card.",
    },
    {
      id: "q10",
      type: "single-choice",
      question: "A patient takes promethazine most nights bought from a shop to help them sleep, and agrees to stop it. When may the first dose of daridorexant be taken?",
      options: [
        { id: "a", label: "The same night." },
        { id: "b", label: "At least 48 hours after the last dose of promethazine." },
        { id: "c", label: "After 4 weeks." },
        { id: "d", label: "Never: the patient is excluded." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Under the single sleep aid rule, a non-prescribed sleep aid the patient agrees to stop is stopped before the course; the first dose is at least 48 hours after the last dose of a long-acting sedating antihistamine such as promethazine, and at least the night before for other sleep aids.",
    },
    {
      id: "q11",
      type: "true-false",
      question: "True or false: a patient who completed a course under this PGD at another pharmacy last year can start a new course here.",
      options: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
      correctOptionIds: ["false"],
      explanation:
        "The three supplies are once per patient and never reset. A course already started or completed at any pharmacy, whatever its outcome, is an exclusion (by the patient's account and pharmacy records). Continuation is for a prescriber.",
    },
    {
      id: "q12",
      type: "true-false",
      question: "True or false: completing this Get Real Health training module is a condition of access to the daridorexant PGD tool.",
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
