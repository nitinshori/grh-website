const {build,Packer,fs}=require('./gen.js');

// ── The eligibility rule, stated ONCE ─────────────────────────────────────
// v002 stated Arm 3's rule four different ways: the arm heading said
// penicillin allergy OR doxycycline unsuitable; the subtitle said doxycycline
// AND amoxicillin both unsuitable; the scope bullet and the inclusion criteria
// said doxycycline unsuitable AND penicillin allergy. Two OR-rules and two
// AND-rules, naming three different drug pairs.
const ARM_RULE=[
 {text:'ARM 1, DOXYCYCLINE: adults 18 and over. First line.',b:true},
 {text:'ARM 2, AMOXICILLIN: patients aged 12 to 17; pregnant patients of any age; AND adults 18 and over for whom doxycycline is unsuitable and who are NOT penicillin-allergic.',b:true},
 {text:'ARM 3, CLARITHROMYCIN: patients aged 12 and over who are PENICILLIN-ALLERGIC and for whom the first-line agent for their circumstances is unsuitable or unavailable. NOT in pregnancy or breastfeeding.',b:true},
 {text:'A PREGNANT OR BREASTFEEDING PATIENT WHO IS PENICILLIN-ALLERGIC HAS NO ARM UNDER THIS PGD. Refer the same day: the guidance names erythromycin for that patient, which this PGD does not authorise.',b:true},
 {text:'The first-line agent means doxycycline in adults, and amoxicillin at 12 to 17 and in pregnancy. A penicillin allergy makes amoxicillin unsuitable by itself, so a penicillin-allergic 12 to 17 year old who is not pregnant goes straight to Arm 3.',b:true},
];

const CRB_NOTE=[
 {text:'THE AGE POINT IS NOT APPLIED IN THIS SERVICE. The score used here is confusion, respiratory rate and blood pressure only.',b:true},
     {text:'Why: CRB-65 scores 1 point for being 65 or over. Age 65 and over also qualifies a patient for treatment under this service. A rule requiring a total score of 0 would therefore include every patient in that age group by one criterion and exclude them by the next, and would direct a same-day referral for what may be a well patient with a productive cough, on arithmetic alone.',b:true},
 {text:'Dropping the age point does not mean treating a 65 year old as a 30 year old. In any patient 65 or over, have a LOWER threshold for referral, take the whole picture into account rather than the numbers alone, and refer if anything about the presentation is not straightforward. Record that you considered it.',b:true},
];

const OBS=[
 ['Oxygen saturation',[
   {bullet:'Measure SpO2 on air, at rest, after 5 minutes, on a validated pulse oximeter with an adequate trace.'},
   {bullet:'REFER if SpO2 is below 94%.'},
   {bullet:'For a patient with known COPD, refer if SpO2 has fallen below their own documented baseline.'},
 ]],
 ['Respiratory rate',[{bullet:'Count for a full 60 seconds.'},{bullet:'REFER if 22 or above.'}]],
 ['Pulse',[{bullet:'REFER if above 110 at rest.'}]],
 ['Blood pressure',[{bullet:'REFER if systolic below 100.'}]],
 ['Temperature',[{bullet:'REFER if 38C or above.'}]],
 ['Level of consciousness',[{bullet:'REFER on any new confusion, disorientation or drowsiness.'}]],
 ['CRB score, WITHOUT the age point',[
   {text:'Score 1 point for each of the following.',b:true},
   {bullet:'Confusion: new disorientation in person, place or time.'},
   {bullet:'Respiratory rate 30 or more.'},
   {bullet:'Blood pressure: systolic below 90, or diastolic 60 or less.'},
   {text:'Score 0: may be treated under this PGD if all other criteria are met.',b:true},
   {text:'Score 1 or more: do not supply. Refer for same-day assessment.',b:true},
   ...CRB_NOTE,
 ]],
 ['Refer regardless of any score',[
   {bullet:'Focal chest signs suggesting pneumonia.'},
   {bullet:'Haemoptysis.'},
   {bullet:'Cyanosis.'},
   {bullet:'Stridor or absent breath sounds.'},
   {bullet:'Accessory muscle use.'},
   {bullet:'Peripheral oedema with weight gain.'},
   {bullet:'Persistent hoarseness, or a cough over 3 weeks in a smoker.'},
   {bullet:'The patient simply looks unwell to you.'},
 ]],
];

const COMMON_INCLUSION=[
 {bullet:'PURULENT SPUTUM (yellow or green), AND EITHER a higher-risk comorbidity (chronic lung disease including COPD and asthma, heart failure, diabetes, chronic kidney or liver disease, immunosuppression, or age 65 and over) OR symptoms persisting beyond 14 days.',b:true},
 {bullet:'All observations within the thresholds in Appendix 1, and a CRB score of 0. The CRB score used in this service does NOT include the age point: see Appendix 1.',b:true},
 {bullet:'Valid informed consent given. Where the patient is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis recorded.',b:true},
 {bullet:'No exclusion criterion present.'},
];

const COMMON_EXCLUSION=[
 {bullet:'SUSPECTED PNEUMONIA: focal chest signs (dull percussion note, bronchial breathing, coarse crackles that do not clear with coughing) with any systemic feature.',b:true},
 {bullet:'Any observation outside the thresholds in Appendix 1, or a CRB score of 1 or more.'},
 {bullet:'SpO2 below 94% on air at rest.'},
 {bullet:'Severely systemically unwell, however the observations read. If the patient looks unwell to you, refer.',b:true},
 {bullet:'Haemoptysis, or a cough lasting more than 3 weeks in a current or former smoker.'},
 {bullet:'Suspected pulmonary embolism, heart failure or lung cancer.'},
 {bullet:'An antibiotic already taken for this episode. One course per episode.'},
];

const TRAINING=[
 'Pharmacist registered and practising with the GPhC.',
 'Pharmacy technician registered and practising with the GPhC. None of these medicines is a controlled drug, so registered pharmacy technicians may lawfully supply under this PGD (Human Medicines Regulations 2012 as amended, 26 June 2024).',
 'Must have completed training relevant to this condition, documented and overseen by the Get Real Health team.',
 'Must be competent in measuring and recording oxygen saturation on a validated pulse oximeter, respiratory rate, pulse, blood pressure and temperature, and in applying the thresholds in Appendix 1.',
 'Must be able to calculate and apply the CRB score used in this service, and must understand that the age point of CRB-65 is deliberately NOT applied here, and why.',
 'Must know which arm applies to which patient. The rule is stated once at the front of this document and repeated in each arm.',
 'Must previously have used PGDs to supply medication.',
 'Must work in compliance with the SOPs of their own employer and practise only within the bounds of their own competence.',
];

function records(extra){return ['Records to be kept',[
 {bullet:'That valid informed consent was given, and where the patient is under 16, from whom, or the basis of the Gillick assessment.',b:true},
 {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
 {bullet:'The full set of observations from Appendix 1, including SpO2, respiratory rate, pulse, blood pressure and temperature, and the CRB score.'},
 {bullet:'Which inclusion feature was met: purulent sputum plus comorbidity, or purulent sputum plus duration. Where the comorbidity was age 65 and over, that the lower referral threshold for that group was considered.',b:true},
 {bullet:'WHICH ARM was used and why, naming the reason the first-line agent was not used where a second-line arm was chosen.',b:true},
 ...(extra||[]),
 {bullet:'Name and registration number of the healthcare professional supplying.'},
 {bullet:'Name of the medicine, date of supply, dose, form, route and quantity supplied, with batch number and expiry date.'},
 {bullet:'Advice given, including advice given if excluded or declining treatment.'},
 {bullet:'Details of any adverse drug reactions and the actions taken.'},
 {bullet:'That the medicine was supplied under this PGD.'},
 {text:'Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday.'},
]];}

const ACTIONS=['Actions if excluded or declines','Explain why an antibiotic cannot be supplied, and say plainly that most acute coughs do not need one and settle on their own. Refer same-day where any Appendix 1 threshold is breached, the CRB score is 1 or more, or pneumonia is suspected. Give self-care and safety-netting advice, including that a cough alone may take three weeks to settle. Document the advice and the decision, and inform the GP where the reason for exclusion is a new clinical finding such as a low SpO2.'];

const d={
 banner:'ISSUED, VALID FROM 9 SEPTEMBER 2026',
 title:'Acute Bacterial Bronchitis (chest service)',
 strap:'Patient Group Direction, version 006, issued 10 September 2026. Three arms: doxycycline, amoxicillin, clarithromycin.',
 cover:{action:'supply',drugs:'Doxycycline, Amoxicillin or Clarithromycin',condition:'Acute Bacterial Bronchitis',age:'From age 12 years onwards.'},
 purpose:{
   for:'The supply of an oral antibiotic for acute bacterial bronchitis in a patient aged 12 years or over who has been assessed as needing one, by a registered pharmacist or registered pharmacy technician in a community pharmacy, without a prescription.',
   authorises:[
    'Doxycycline 100mg capsules, first line, in adults aged 18 years and over.',
    'Amoxicillin 500mg capsules, in patients aged 12 to 17, in pregnancy, and in adults where doxycycline is unsuitable.',
    'Clarithromycin 250mg or 500mg tablets, in patients aged 12 years and over who are penicillin-allergic and cannot take doxycycline, and who are not pregnant or breastfeeding.',
   ],
   notFor:[
    'Any patient who may have pneumonia, or who scores on the CRB-65 for confusion, respiratory rate or blood pressure. Refer the same day.',
    'Acute cough without signs of bacterial infection. Most acute cough is viral and needs no antibiotic.',
    'Children under 12.',
    'A pregnant or breastfeeding patient who is penicillin-allergic. No arm of this PGD covers her; refer the same day.',
   ],
  },

 intro:[
  {h:'Which arm applies'},
  ...ARM_RULE,

  {h:'Before anything else'},
  {bullet:'MOST PATIENTS PRESENTING WITH AN ACUTE COUGH DO NOT NEED AN ANTIBIOTIC. The inclusion criteria are deliberately narrow, and a cough alone may take three weeks to settle.',b:true},
  {bullet:'Every observation in Appendix 1 must be measured and recorded before any supply, and the CRB score calculated. If any threshold is breached, refer.'},
  {bullet:'One course per episode. A second course is not authorised under this PGD.'},
 ],

 guidelines:{
  title:'Summary of NICE guidance for acute cough and acute bronchitis',
  source:'NICE NG120, Cough (acute): antimicrobial prescribing; NICE Clinical Knowledge Summaries, Chest infections in adults. Summarised 9 September 2026.',
  sections:[
   {h:'Overview',body:[
     'Acute cough is usually caused by a viral upper respiratory tract infection or by acute bronchitis, and is usually SELF LIMITING.',
     'A cough from acute bronchitis commonly lasts around three weeks, and that duration alone is not a reason to treat.',
     'Purulent sputum on its own does not indicate a bacterial infection needing an antibiotic.',
   ]},
   {h:'What NICE advises',body:[
     {bullet:'DO NOT routinely offer an antibiotic for acute cough in an otherwise healthy adult. Give advice on the expected duration and on self care.'},
     {bullet:'CONSIDER an antibiotic where the person is systemically very unwell, or has symptoms and signs suggesting a serious illness or complication such as pneumonia.'},
     {bullet:'CONSIDER an antibiotic where the person is at higher risk of complications: significant comorbidity, immunosuppression, or being older and frail.'},
     {bullet:'DOXYCYCLINE is first choice in adults. Amoxicillin is a first-choice alternative. Clarithromycin or erythromycin are alternatives where the first choice is unsuitable, erythromycin being the option used in pregnancy.'},
   ]},
   {h:'Recognising pneumonia rather than bronchitis',body:[
     'Focal chest signs, such as a dull percussion note, bronchial breathing, or coarse crackles that do not clear on coughing, together with any systemic feature, suggest pneumonia.',
     'Pneumonia is not covered by this PGD and needs assessment the same day.',
     'CRB-65 is a severity score for community acquired pneumonia. This PGD uses it as a safety net, deliberately WITHOUT the age point, and Appendix 1 explains why.',
   ]},
   {h:'How this PGD applies that guidance',body:[
     'The inclusion criteria are deliberately narrow: purulent sputum PLUS either a higher-risk comorbidity or symptoms beyond 14 days.',
     'Most people presenting with an acute cough will not meet them, and that is the guidance working rather than the service failing.',
     'Every observation in Appendix 1 must be measured before any supply, and anything outside them refers.',
   ]},
  ]
 },

 arms:[
  {
   title:'Arm 1. Doxycycline, first line, adults',
   subtitle:'Patient Group Direction for the supply of doxycycline 100mg capsules for acute bacterial bronchitis in adults aged 18 years and over.',
   training:TRAINING,
   pgd:[
    ['Indication','Acute bacterial bronchitis in adults aged 18 and over meeting the inclusion criteria below. First-line agent for adults.'],
    ['Which arm applies',ARM_RULE],
    ['Inclusion criteria',[{bullet:'Aged 18 years and over.'},...COMMON_INCLUSION]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSION,
      {bullet:'Under 18 years of age. Use the amoxicillin arm.'},
      {bullet:'Pregnancy or breastfeeding. Doxycycline is contraindicated; use the amoxicillin arm.'},
      {bullet:'Hypersensitivity to doxycycline or other tetracyclines.'},
      {bullet:'Known severe hepatic impairment.'},
      {bullet:'CONCURRENT ISOTRETINOIN. Doxycycline with a retinoid risks benign intracranial hypertension. Refer.',b:true},
    ]],
    ['Cautions',[
      {text:'Photosensitivity: advise sun protection.'},
      {text:'Separate from antacids, iron and dairy by at least 2 hours.'},
      {text:'Potentiates warfarin; where the patient is anticoagulated, refer rather than supply. The same finding is an EXCLUSION in the Skin and Soft Tissue Infection PGD. The practical outcome is identical in both services: do not supply, refer. The difference in wording is noted here because staff move between the two within a shift.',b:true},
    ]],
    ACTIONS,
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records(),
   ],
   med:[
    ['Name, form and strength','Doxycycline 100mg capsules.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Swallow whole with plenty of water, sitting or standing, and well before lying down, to avoid oesophageal irritation.'],
    ['Dose and frequency','200mg on day 1 as a single dose, then 100mg once daily for a further 4 days. Total 5 days.'],
    ['Quantity to be supplied','6 capsules. Two on day 1, then one daily for 4 days.'],
    ['Maximum treatment period','5 days. One course per episode. A second course is not authorised under this PGD; refer.'],
    ['Adverse effects','Common: nausea, diarrhoea, photosensitivity. Uncommon: oesophageal irritation or ulceration, rash. Rare: Clostridioides difficile infection, hepatotoxicity, benign intracranial hypertension.'],
    ['Storage','Store below 25C.'],
   ],
   pat:[
    ['Written information','Supply the doxycycline patient information leaflet.'],
    ['Counselling',[
      {bullet:'Take with plenty of water, sitting or standing up, and do not lie down for 30 minutes afterwards.'},
      {bullet:'Avoid antacids, indigestion remedies, iron tablets and milk within 2 hours of a dose.'},
      {bullet:'You may burn more easily in the sun. Use sun protection.'},
      {bullet:'Seek help the same day if you become breathless, develop chest pain, cough blood, or feel much worse at any point. Do not wait to finish the course.',b:true},
      {bullet:'Come back if you are no better 5 to 7 days after finishing.'},
    ]],
    ['Follow-up','Seek advice if breathlessness, chest pain or fever develop, if symptoms worsen at any point, or if there is no improvement within 5 to 7 days of finishing the course. A cough alone may take three weeks to settle and is not by itself a reason to return.'],
   ],
  },

  {
   title:'Arm 2. Amoxicillin, 12 to 17 years, pregnancy, and adults where doxycycline is unsuitable',
   subtitle:'Patient Group Direction for the supply of amoxicillin 500mg capsules for acute bacterial bronchitis in patients aged 12 to 17 years, in pregnancy, and in adults aged 18 and over for whom doxycycline is unsuitable and who are not penicillin-allergic.',
   training:TRAINING,
   pgd:[
    ['Indication','Acute bacterial bronchitis in patients aged 12 to 17 years; in pregnancy; and in non-penicillin-allergic adults for whom doxycycline is unsuitable. Amoxicillin is a NICE first-choice alternative in acute bronchitis.'],
    ['Which arm applies',ARM_RULE],
    ['Inclusion criteria',[
      {bullet:'Aged 12 years and over.'},
      {bullet:'AND ONE OF: aged 12 to 17; OR pregnant; OR aged 18 and over with a recorded reason why doxycycline is unsuitable.',b:true},
      {bullet:'NOT penicillin-allergic. Where the patient is, use Arm 3.'},
      ...COMMON_INCLUSION,
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSION,
      {bullet:'Under 12 years of age.'},
      {bullet:'Known penicillin or beta-lactam allergy, or any history of cephalosporin allergy. Use Arm 3.'},
      {bullet:'Infectious mononucleosis or acute lymphoblastic leukaemia, because of the risk of a widespread rash.'},
      {bullet:'Known significant renal impairment. Refer.'},
    ]],
    ['Cautions',[
      {text:'Amoxicillin may be supplied in pregnancy and in breastfeeding. It is the usual choice in pregnancy where an antibiotic is indicated for this condition.',b:true},
      {text:'Diarrhoea is common. Advise the patient to seek advice for severe or bloody diarrhoea, which may indicate Clostridioides difficile infection.'},
      {text:'A non-allergic maculopapular rash is common with amoxicillin and is not the same as allergy, but any rash should be reviewed.'},
    ]],
    ACTIONS,
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records([{bullet:'Where the patient is an adult, the specific reason doxycycline was unsuitable.',b:true}]),
   ],
   med:[
    ['Name, form and strength','Amoxicillin 500mg capsules.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Swallow whole with water, with or without food.'],
    ['Dose and frequency','500mg three times daily for 5 days.'],
    ['Quantity to be supplied','15 capsules. Supply the whole course.'],
    ['Maximum treatment period','5 days. One course per episode; a second course is not authorised.'],
    ['Adverse effects','Common: diarrhoea, nausea, rash. Uncommon: vomiting, abdominal discomfort, oral candidiasis. Rare: allergic reactions. Very rare: anaphylaxis, Stevens-Johnson syndrome, hepatitis and cholestatic jaundice, Clostridioides difficile colitis.'],
    ['Storage','Store below 25C in the original container.'],
   ],
   pat:[
    ['Written information','Supply the amoxicillin patient information leaflet.'],
    ['Counselling',[
      {bullet:'One capsule three times a day, every 8 hours, and finish the course.'},
      {bullet:'Seek help the same day if you become breathless, develop chest pain, cough blood, or feel much worse. Do not wait to finish the course.',b:true},
      {bullet:'Some diarrhoea is common. Get advice if it is severe or bloody.'},
      {bullet:'A rash with this antibiotic is usually not an allergy, but get it checked, and seek urgent help for wheeze or swelling of the lips or tongue.'},
      {bullet:'Come back if you are no better 5 to 7 days after finishing.'},
    ]],
    ['Follow-up','As Arm 1.'],
   ],
  },

  {
   title:'Arm 3. Clarithromycin, penicillin allergy',
   subtitle:'Patient Group Direction for the supply of clarithromycin 250mg tablets for acute bacterial bronchitis in patients aged 12 years and over who are penicillin-allergic and for whom the first-line agent for their circumstances is unsuitable or unavailable.',
   note:'One rule, stated the same way in the heading, the indication and the inclusion criteria.',
   training:TRAINING,
   pgd:[
    ['Indication','Acute bacterial bronchitis in patients aged 12 years and over who are PENICILLIN-ALLERGIC and for whom the first-line agent for their circumstances is unsuitable or unavailable, and who are not pregnant or breastfeeding. The first-line agent means doxycycline in adults and amoxicillin at 12 to 17; a penicillin allergy makes amoxicillin unsuitable by itself.'],
    ['Which arm applies',ARM_RULE],
    ['Inclusion criteria',[
      {bullet:'Aged 12 years and over.'},
      {bullet:'PENICILLIN-ALLERGIC.',b:true},
      {bullet:'AND the first-line agent for this patient is unsuitable or unavailable, with the reason recorded. For a patient aged 12 to 17 the penicillin allergy alone satisfies this, because amoxicillin is their first-line agent.',b:true},
      {bullet:'NOT pregnant and NOT breastfeeding. A pregnant or breastfeeding penicillin-allergic patient is referred; see the exclusion criteria.',b:true},
      ...COMMON_INCLUSION,
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSION,
      {bullet:'Under 12 years of age.'},
      {bullet:'Pregnancy or breastfeeding. Refer the same day. Clarithromycin is not supplied in pregnancy under this PGD (SmPC: use only after weighing benefit against risk), and no other arm covers a penicillin-allergic pregnant patient.'},
      {bullet:'Hypersensitivity to macrolides.'},
      {bullet:'KNOWN RENAL IMPAIRMENT with a creatinine clearance below 30 mL/min, or renal impairment of unknown severity where there is reason to suspect it is significant. Refer.',b:true},
      {bullet:'Concurrent ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin or lovastatin.'},
      {bullet:'Known QT prolongation, or concurrent QT-prolonging medicines.'},
      {bullet:'Known electrolyte disturbance, or severe hepatic impairment.'},
      {bullet:'Taking warfarin or a DOAC. Refer.'},
    ]],
    ['Cautions',[
      {text:'Colchicine: risk of toxicity. Refer rather than supply.'},
      {text:'Advise on the potential for dizziness, vertigo and taste disturbance.'},
      {text:'Ask about renal function before supply and record the answer. Where the patient does not know and there is no reason to suspect impairment, supply and record that you asked.',b:true},
    ]],
    ACTIONS,
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records([
      {bullet:'The penicillin allergy history in the patient own terms.'},
      {bullet:'That renal function was asked about, and the answer given.',b:true},
    ]),
   ],
   med:[
    ['Name, form and strength','Clarithromycin 250mg tablets.'],
    ['Legal category','POM.'],
    ['Route and method','Oral, with or without food.'],
    ['Dose and frequency',[
      {text:'250mg twice daily for 5 days.'},
      {text:'500mg twice daily for 5 days where the infection is more severe: marked systemic upset in a patient who nonetheless has no CRB point and no feature of pneumonia. Those patients are referred, not treated at the higher dose.'},
      {text:'NICE NG120 gives clarithromycin 250mg to 500mg twice a day for 5 days. The product SPC gives 250mg twice daily, increased to 500mg twice daily in severe infection.'},
    ]],
    ['Quantity to be supplied','10 tablets at 250mg twice daily, or 20 tablets at 500mg twice daily. Record which.'],
    ['Maximum treatment period','5 days. One course per episode; a second course is not authorised.'],
    ['Adverse effects','Common: abdominal pain, nausea, diarrhoea, taste disturbance, headache. Uncommon: QT prolongation, hepatic dysfunction, dizziness, vertigo. Rare: Clostridioides difficile infection, Stevens-Johnson syndrome.'],
    ['Storage','Store below 25C.'],
   ],
   pat:[
    ['Written information','Supply the clarithromycin patient information leaflet.'],
    ['Counselling',[
      {bullet:'One tablet twice a day and finish the course.'},
      {bullet:'Tell us or your GP before starting any new medicine: this antibiotic interacts with a lot of them.'},
      {bullet:'It can cause a metallic or altered taste, which settles after the course.'},
      {bullet:'Seek help the same day if you become breathless, develop chest pain, cough blood, or feel much worse.',b:true},
      {bullet:'Come back if you are no better 5 to 7 days after finishing.'},
    ]],
    ['Follow-up','As Arm 1.'],
   ],
  },
 ],

 appendix:[
  {h:'Appendix 1: Observations, thresholds and the CRB score'},
  {text:'Every observation below must be measured and recorded before any supply. If ANY threshold is breached, or the CRB score is 1 or more, do not supply: refer.',b:true},
  {tbl:OBS},

  {h:'Appendix 2: Key references'},
  {bullet:'NICE NG120 Cough (acute): antimicrobial prescribing.'},
  {bullet:'NICE Clinical Knowledge Summaries: Chest infections adult, current revision.'},
  {bullet:'CRB-65 as described in the BTS community-acquired pneumonia guidance, noting that this PGD deliberately applies it without the age point and states why in Appendix 1.'},
  {bullet:'Summary of Product Characteristics for doxycycline, amoxicillin and clarithromycin, current versions.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v006',
 supersedes:'Version 005, 9 September 2026',
 validFrom:'10 September 2026',
 expiry:'31 July 2027',
 sigDate:'10 September 2026',
 chDate:'10 September 2026',
 changes:[
  'ARM 3 (CLARITHROMYCIN) NO LONGER ADMITS A PREGNANT PATIENT. Version 005 said in its inclusion criteria that for a pregnant penicillin-allergic patient the allergy alone qualified her for clarithromycin, while its exclusion criteria referred her. Read inclusion-first that supplied clarithromycin in pregnancy, which the SmPC says should only be done after weighing benefit against risk. The inclusion now requires not pregnant and not breastfeeding, the cover states that a pregnant penicillin-allergic patient has no arm under this PGD and is referred the same day, and the exclusion says why. Found by the clinical review of 10 September 2026.',
  'Cover: the clarithromycin line now states both strengths, 250mg and 500mg, matching the arm.',
 ],
 prior:[
  ['005, 9 September 2026','Clarithromycin 500mg twice daily restored alongside 250mg; document rebuilt in the house template with both signatures as images.'],
  ['004, 9 September 2026','Restored the guidance summary as part 2. Resolved the age 65 contradiction: the CRB-65 age point is not applied and an explicit lower referral threshold over 65 is stated instead. Arm 2 extended to adults for whom doxycycline is unsuitable. Isotretinoin interaction and renal referral restored to the doxycycline arm.'],
  ['003, 9 September 2026','See the change history of that version. Superseded the same day by v004, which restores the guidance summary section.'],
  ['002, 7 September 2026','Full clinical review and reissue. Restructured into three arms with observation thresholds and a CRB-65 gate. Introduced the contradictions corrected in 003.'],
  ['001, earlier 2026','Development and issue of new PGD.'],
 ],
};


Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('chest-'+d.version+'-SIGNED.docx',b);console.log('chest '+d.version+' docx bytes',b.length);});
