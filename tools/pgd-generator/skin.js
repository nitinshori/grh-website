const {build,Packer,fs}=require('./gen.js');

// "More extensive infection" triggered a dose increase in two arms of v002
// and was defined nowhere, in a PGD whose scope is mild to moderate disease.
// Two members of staff would dose the same patient differently. Defined once
// here and referenced from both arms.
const MORE_EXTENSIVE='MORE EXTENSIVE INFECTION means an area of erythema larger than about 10 cm across, OR involvement of more than one body region, OR cellulitis rather than a superficial infection such as impetigo or folliculitis. Anything beyond that is outside the mild to moderate scope of this PGD: refer.';

const NEC_FASC={bullet:'ANY feature suggesting necrotising fasciitis: pain out of proportion to appearance, rapidly advancing erythema, crepitus, skin necrosis, bullae, or dusky discolouration. Arrange EMERGENCY assessment, not a routine referral.',b:true};

const COMMON_EXCLUSIONS=[
 NEC_FASC,
 {bullet:'Any observation outside the thresholds for the patient AGE BAND in Appendix 1, or any sign of systemic illness or sepsis.',b:true},
 {bullet:'Abscess requiring drainage, or an infected wound needing surgical review.'},
 {bullet:'Facial or periorbital cellulitis, or cellulitis of the hand.'},
 {bullet:'Animal or human bite. Refer; these need co-amoxiclav, which is not covered here.'},
 {bullet:'Suspected osteomyelitis or septic arthritis, or infection over a joint or tendon.'},
 {bullet:'UNTREATED FUNGAL INFECTION, or a rash that may be tinea rather than bacterial infection. Tinea misdiagnosed as bacterial infection is a common error, and an antibiotic will not treat it.',b:true},
 {bullet:'Suspected viral infection, including eczema herpeticum: rapidly worsening, painful, punched-out or clustered vesicular lesions. Refer.',b:true},
 {bullet:'Immunosuppression of any kind. NOTE: immunosuppression is a QUALIFYING COMORBIDITY under the Acute Bacterial Bronchitis PGD and an ABSOLUTE EXCLUSION here. That difference is deliberate: a chest infection in an immunosuppressed patient is treated early, whereas a skin infection in the same patient can progress to necrotising infection and needs assessment rather than an antibiotic from a pharmacy. Staff move between these two services in a shift, so the difference is stated rather than left to be discovered.',b:true},
 {bullet:'Diabetic foot infection.'},
 {bullet:'An antibiotic already taken for this episode.'},
];

const OBS_ROW=['Observations before supply','Every observation must be measured and recorded before any supply, against the thresholds for the patient AGE BAND in Appendix 1. If any threshold is breached, refer. Version 002 applied a single set of ADULT thresholds to a service starting at age 2, so a well three-year-old breached three of them.'];

const CELLULITIS_ROW=['Cellulitis: marking, review and who does it',[
 {text:'CELLULITIS UNDER THIS PGD IS RESTRICTED TO PATIENTS AGED 12 AND OVER. Cellulitis in a younger child needs assessment, not a pharmacy supply. The other conditions in this PGD remain available from 2 years.',b:true},
 {text:'Where cellulitis is treated:'},
 {bullet:'Mark the edge of the erythema with a skin-safe pen before the patient leaves, and record that you did.'},
 {bullet:'THE REVIEW AT 48 HOURS IS PERFORMED BY A PHARMACIST AT THE SUPPLYING PHARMACY, IN PERSON. Book it as an appointment before the patient leaves. A phone call is not sufficient: the point is to see whether the erythema has passed the mark.',b:true},
 {bullet:'Record at the review: whether the erythema is inside or beyond the mark, the patient temperature, whether pain has improved, and the decision reached.',b:true},
 {bullet:'Spread beyond the mark means same-day referral, not a change of antibiotic.',b:true},
 {bullet:'If the patient does not attend the review, contact them the same day. If you cannot reach them, record the attempt and inform the GP.',b:true},
]];

const ANAPHYLAXIS_ROW=['Anaphylaxis and serious reactions',[
 {text:'This PGD supplies an oral medicine which the patient takes at home, so it does not carry the requirement for adrenaline to be immediately available that the vaccination PGDs in this estate carry.',b:true},
 {text:'It does require that staff supplying can recognise anaphylaxis and an evolving severe reaction, can call 999, and counsel the patient on what to do.',b:true},
 {text:'Tell every patient to stop the medicine and seek urgent help for rash, wheeze, or swelling of the lips or tongue, and to call 999 for any difficulty breathing.'},
]];

function records(extra){return ['Records to be kept',[
 {bullet:'That valid informed consent was given. Where the patient is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis recorded.',b:true},
 {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
 {bullet:'The patient age band, and the full set of observations against the thresholds for that band.',b:true},
 {bullet:'The site and extent of the infection, and where a dose increase was used, the finding that met the definition of more extensive infection.',b:true},
 {bullet:'Which condition was treated, and for cellulitis, that the patient is 12 or over, that the margins were marked, and the date and time of the booked 48-hour review.',b:true},
 ...(extra||[]),
 {bullet:'Name and registration number of the healthcare professional supplying.'},
 {bullet:'Name of the medicine, date of supply, dose, form, route and quantity supplied, with batch number and expiry date.'},
 {bullet:'For the second and third line arms, the reason flucloxacillin was unsuitable.'},
 {bullet:'Advice given, including advice given if excluded or declining treatment.'},
 {bullet:'Details of any adverse drug reactions and the actions taken.'},
 {bullet:'That the medicine was supplied under this PGD.'},
 {text:'Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th where the patient was 17 when treatment finished.'},
]];}

const TRAINING=[
 'Pharmacist registered and practising with the GPhC.',
 'Pharmacy technician registered and practising with the GPhC. None of these medicines is a controlled drug, so registered pharmacy technicians may lawfully supply under this PGD (Human Medicines Regulations 2012 as amended, 26 June 2024).',
 'Must have completed training relevant to this condition, documented and overseen by the Get Real Health team.',
 'Must be competent in measuring and recording observations IN CHILDREN as well as adults, and in applying the AGE-BANDED thresholds in Appendix 1. Adult thresholds applied to a small child produce a referral for every well child.',
 'Must be able to recognise the necrotising fasciitis features in Appendix 1 and treat them as an emergency.',
 'Must be able to distinguish bacterial skin infection from tinea and from eczema herpeticum, both of which are excluded and neither of which responds to these antibiotics.',
 'Must be able to apply the definition of more extensive infection in Appendix 2 before increasing any dose.',
 'Must previously have used PGDs to supply medication.',
 'Must work in compliance with the SOPs of their own employer and practise only within the bounds of their own competence.',
];

const d={
 banner:'ISSUED, VALID FROM 9 SEPTEMBER 2026',
 title:'Skin and Soft Tissue Infection',
 strap:'Patient Group Direction, version 004, issued 9 September 2026. Three arms: flucloxacillin, clarithromycin, doxycycline.',
 cover:{action:'supply',drugs:'Flucloxacillin, Clarithromycin or Doxycycline',condition:'Skin and Soft Tissue Infection',age:'From age 2 years onwards; cellulitis from age 12 years onwards.'},
 purpose:{
   for:'The supply of an oral antibiotic for a bacterial skin or soft tissue infection, impetigo, folliculitis, infected eczema, an infected wound, or uncomplicated cellulitis, by a registered pharmacist or registered pharmacy technician in a community pharmacy, without a prescription.',
   authorises:[
    'Flucloxacillin, first line, from 2 years of age, and for cellulitis from 12 years of age.',
    'Clarithromycin, where flucloxacillin is unsuitable, including penicillin allergy, from 2 years of age.',
    'Doxycycline 100mg capsules, where flucloxacillin is unsuitable, in patients aged 12 years and over.',
   ],
   notFor:[
    'Any patient who is systemically unwell, or with rapidly spreading infection, or with signs of necrotising fasciitis. Refer as an emergency.',
    'Facial or periorbital cellulitis, or cellulitis in a child under 12. Refer.',
    'Fungal or viral skin infection. An antibiotic will not treat it.',
    'Children under 2.',
   ],
  },

 intro:[
  {h:'Age, and what this PGD now covers'},
  {bullet:'IMPETIGO, FOLLICULITIS, INFECTED ECZEMA and INFECTED WOUNDS: from 2 years of age.',b:true},
  {bullet:'CELLULITIS: 12 YEARS AND OVER ONLY. Cellulitis is the highest-acuity condition in this document and the one most likely to deteriorate. In a younger child it needs assessment rather than a pharmacy supply.',b:true},
  {bullet:'Observations are age-banded. Use the band for the patient in front of you, not the adult row.',b:true},
  {bullet:'Bite wounds are not covered. Use the Minor Wound Care PGD.'},

  {h:'Concurrent supply for infected eczema'},
  'Where eczema is complicated by MILD, LOCALISED secondary bacterial infection, a patient may receive an oral antibiotic under this PGD and a topical corticosteroid under the Eczema and Dermatitis PGD at the same consultation, both recorded in one consultation record. Where the infection is not mild and localised, or any exclusion here applies, refer and supply neither.',
 ],

 guidelines:{
  title:'Summary of NICE guidance for skin and soft tissue infection',
  source:'NICE NG141, Cellulitis and erysipelas: antimicrobial prescribing; NICE NG153, Impetigo: antimicrobial prescribing; NICE Clinical Knowledge Summaries, Cellulitis, Impetigo and Eczema (infected). Summarised 9 September 2026.',
  sections:[
   {h:'Overview',body:[
     'Skin and soft tissue infections in this PGD are impetigo, folliculitis, infected eczema, infected wounds and cellulitis.',
     'Most are caused by Staphylococcus aureus or Streptococcus pyogenes, which is why flucloxacillin is first line.',
     'Severity, site and the age of the patient decide whether a pharmacy supply is appropriate at all.',
   ]},
   {h:'Cellulitis',body:[
     {bullet:'NICE NG141: offer flucloxacillin first line. Clarithromycin, erythromycin in pregnancy, or doxycycline where penicillin is unsuitable.'},
     {bullet:'Mark the extent of the erythema and review, so that spread is recognised rather than guessed at.'},
     {bullet:'Refer for same-day assessment where the person is systemically unwell, where infection is near the eyes or nose, or where lymphangitis or sepsis is suspected.'},
     {bullet:'Facial, periorbital and hand cellulitis are outside this PGD entirely.'},
   ]},
   {h:'Impetigo',body:[
     {bullet:'NICE NG153: localised non-bullous impetigo is treated topically. Hydrogen peroxide 1% first line where it is not around the eyes; topical fusidic acid where hydrogen peroxide is unsuitable or ineffective.'},
     {bullet:'Widespread or bullous impetigo, or impetigo in someone systemically unwell or at high risk of complications, needs an oral antibiotic.'},
     {bullet:'Topical treatment requires intact or only minimally broken skin: extensively broken skin needs an oral agent.'},
   ]},
   {h:'Necrotising fasciitis: the thing not to miss',body:[
     'Pain out of proportion to the appearance of the skin, rapidly advancing erythema over hours rather than days, crepitus, skin necrosis, bullae or dusky discolouration.',
     'This is a surgical emergency. It needs emergency assessment now, not a routine referral and not an antibiotic from a pharmacy.',
   ]},
   {h:'Children',body:[
     'Observations in children must be read against paediatric ranges, not adult ones. Appendix 1 of this PGD is age banded for that reason, using NICE NG143 and APLS reference ranges.',
     'Cellulitis under this PGD is restricted to 12 years and over: it is the highest-acuity condition here and the one most likely to deteriorate.',
   ]},
  ]
 },

 arms:[
  {
   title:'Arm 1. Flucloxacillin, first line',
   subtitle:'Patient Group Direction for the supply of flucloxacillin for impetigo, folliculitis, infected eczema and infected wounds from 2 years of age, and for cellulitis from 12 years of age.',
   training:TRAINING,
   pgd:[
    ['Indication','Mild to moderate skin and soft tissue infection. Impetigo, folliculitis, infected eczema and infected wounds from 2 years of age; cellulitis from 12 years of age. First-line agent.'],
    ['Inclusion criteria',[
      {bullet:'Aged 2 years and over for impetigo, folliculitis, infected eczema or infected wounds.'},
      {bullet:'Aged 12 years and over where the condition being treated is CELLULITIS.',b:true},
      {bullet:'Localised skin or soft tissue infection with signs of bacterial infection: erythema, warmth, swelling, tenderness or purulent discharge. In infected eczema, weeping, crusting or worsening inflammation that has not responded to emollients and topical steroid.'},
      {bullet:'All observations within the thresholds for the patient AGE BAND in Appendix 1.',b:true},
      {bullet:'Where cellulitis is being treated, the affected area is limited, the margins have been marked, and the patient can attend the supplying pharmacy for review at 48 hours.'},
      {bullet:'Valid informed consent given. Where the patient is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent.',b:true},
      {bullet:'No exclusion criterion present.'},
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSIONS,
      {bullet:'Under 2 years of age.'},
      {bullet:'Under 12 years of age where the condition is cellulitis.',b:true},
      {bullet:'Known penicillin or beta-lactam allergy. Use Arm 2 or Arm 3.'},
      {bullet:'History of flucloxacillin-associated jaundice or hepatic dysfunction.'},
      {bullet:'Severe renal impairment, creatinine clearance below 10 mL/min.'},
    ]],
    OBS_ROW,
    CELLULITIS_ROW,
    ANAPHYLAXIS_ROW,
    ['Cautions',[
      {text:'Flucloxacillin may be supplied in pregnancy and breastfeeding where clinically indicated. This aligns with the Wound Care PGD.'},
      {text:'Hepatic reactions may occur up to two months after treatment. Advise the patient to report jaundice or dark urine even weeks after finishing.'},
      {text:'Any rash should stop the course and prompt review.'},
      {text:'Flucloxacillin is poorly tolerated on an empty stomach by some children. It must still be given an hour before food or two hours after, because food substantially reduces absorption. If a child cannot manage that, refer rather than compromise the dosing.',b:true},
    ]],
    ['Actions if excluded or declines','Explain why treatment cannot be supplied. Where any necrotising fasciitis feature is present, arrange EMERGENCY assessment. Where an observation threshold for the age band is breached, or an abscess needs drainage, arrange same-day assessment. Where the exclusion is cellulitis in a child under 12, say plainly that the child needs to be seen rather than treated here, and help arrange it. Document the advice and the decision, and inform the GP where the reason is a new clinical finding.'],
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records(),
   ],
   med:[
    ['Name, form and strength','Flucloxacillin 500mg capsules; flucloxacillin 250mg/5mL oral suspension for patients unable to swallow capsules.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Take on an empty stomach, one hour before or two hours after food, for optimal absorption.'],
    ['Dose and frequency',[
      {text:'Adults and children 10 years and over: 500mg four times daily, which is 10 mL four times daily if the suspension is used.',b:true},
      {text:'Children 2 to 9 years: 250mg four times daily, which is 5 mL of the 250mg/5mL suspension four times daily.',b:true},
      {text:'CHECK THE VOLUME AGAINST THE STRENGTH BEFORE SUPPLY. The 250mg/5mL suspension delivers 50mg per mL.',b:true},
      {text:'Duration 5 days for uncomplicated infection; 7 days for cellulitis.'},
    ]],
    ['Quantity to be supplied',[
      {text:'Capsules, 500mg four times daily: 20 capsules for 5 days, 28 capsules for 7 days.'},
      {text:'Suspension at 250mg four times daily, being 5 mL four times daily: 100 mL for 5 days, 140 mL for 7 days.'},
      {text:'Suspension at 500mg four times daily, being 10 mL four times daily: 200 mL for 5 days, 280 mL for 7 days. Version 002 provided suspension for anyone unable to swallow capsules but gave quantities only for the 250mg regimen, so a 10 to 17 year old, and any adult, had a form authorised and no quantity authorised.',b:true},
      {text:'Supply the whole course. Do not split.'},
    ]],
    ['Maximum treatment period','7 days. One course per episode. A second course is not authorised; refer.'],
    ['Adverse effects','Very common: nausea, diarrhoea. Common: rash, vomiting, abdominal discomfort. Rare but serious: anaphylaxis, cholestatic jaundice and hepatitis which may be delayed up to two months, Clostridioides difficile infection, acute generalised exanthematous pustulosis.'],
    ['Storage','Capsules below 25C. Reconstituted suspension: refrigerate and discard after 7 days.'],
   ],
   pat:[
    ['Written information','Supply the flucloxacillin patient information leaflet. Where a suspension is supplied to a child, write the volume per dose on the label in millilitres as well as the milligram dose, and show the parent the mark on the oral syringe.'],
    ['Counselling',[
      {bullet:'Take on an empty stomach, an hour before food or two hours after, and finish the course.'},
      {bullet:'For a child: the dose is 5 mL four times a day for ages 2 to 9. Use the syringe we have given you, not a kitchen spoon.',b:true},
      {bullet:'If you have cellulitis, we have marked the edge of the redness and booked you back in 48 hours. Come to that appointment. If the redness passes the mark before then, seek help the same day.',b:true},
      {bullet:'Seek help THE SAME DAY if the pain becomes severe or out of proportion to how it looks, if the area spreads quickly, if the skin darkens or blisters, or if you develop fever, shivering or feel generally unwell.',b:true},
      {bullet:'Stop and seek urgent help if you develop a rash, wheeze, or swelling of the lips or tongue. Call 999 for any difficulty breathing.',b:true},
      {bullet:'Report yellowing of the eyes or skin, or dark urine, even weeks after finishing.'},
      {bullet:'Come back if you are no better in 2 to 3 days.'},
    ]],
    ['Follow-up','Cellulitis: in-person review at this pharmacy at 48 hours, booked before the patient leaves. Otherwise seek advice if not improving within 2 to 3 days, or sooner if any warning sign develops.'],
   ],
  },

  {
   title:'Arm 2. Clarithromycin, penicillin allergy',
   subtitle:'Patient Group Direction for the supply of clarithromycin where flucloxacillin is unsuitable, from 2 years of age, and for cellulitis from 12 years of age.',
   note:'Second line. Use only where the patient has a penicillin allergy or flucloxacillin is otherwise unsuitable, and record the reason.',
   training:TRAINING,
   pgd:[
    ['Indication','Mild to moderate skin and soft tissue infection where flucloxacillin is unsuitable. From 2 years of age; cellulitis from 12 years of age.'],
    ['Inclusion criteria',[
      {bullet:'PENICILLIN ALLERGY, OR FLUCLOXACILLIN OTHERWISE UNSUITABLE, with the reason recorded.',b:true},
      {bullet:'Aged 2 years and over, and 12 years and over where the condition is cellulitis.',b:true},
      {bullet:'Weighing 12 kg or more.',b:true},
      {bullet:'Localised skin or soft tissue infection with signs of bacterial infection.'},
      {bullet:'All observations within the thresholds for the patient AGE BAND in Appendix 1.'},
      {bullet:'Where cellulitis is being treated, margins marked and the 48-hour review booked at this pharmacy.'},
      {bullet:'Valid informed consent given, and where under 16, on the basis set out in Arm 1.'},
      {bullet:'No exclusion criterion present.'},
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSIONS,
      {bullet:'UNDER 2 YEARS OF AGE, or weighing under 12 kg.',b:true},
      {bullet:'Under 12 years of age where the condition is cellulitis.',b:true},
      {bullet:'KNOWN RENAL IMPAIRMENT with a creatinine clearance below 30 mL/min, or renal impairment of unknown severity where there is reason to suspect it is significant. Refer. Version 001 halved the dose in this group; a bridging supply from a pharmacy is not the place to make a renal dose adjustment on an unverified estimate, so this PGD excludes and refers instead.',b:true},
      {bullet:'Hypersensitivity to macrolides.'},
      {bullet:'Known QT prolongation, or concurrent QT-prolonging medicines.'},
      {bullet:'Concurrent ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin or lovastatin.'},
      {bullet:'Taking warfarin or a DOAC. Refer.'},
      {bullet:'Severe hepatic impairment, or known electrolyte disturbance.'},
      {bullet:'Pregnancy or breastfeeding. Refer.'},
    ]],
    OBS_ROW,
    CELLULITIS_ROW,
    ANAPHYLAXIS_ROW,
    ['Cautions',[
      {text:'Colchicine: risk of toxicity. Refer rather than supply.'},
      {text:'Advise on dizziness and taste disturbance.'},
      {text:'Ask about renal function before supply. Where the patient does not know, and there is no reason to suspect impairment, supply and record that you asked.',b:true},
    ]],
    ['Actions if excluded or declines','As Arm 1.'],
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records([{bullet:'That renal function was asked about, and the answer given.',b:true}]),
   ],
   med:[
    ['Name, form and strength','Clarithromycin 250mg tablets; clarithromycin 125mg/5mL and 250mg/5mL oral suspension.'],
    ['Legal category','POM.'],
    ['Route and method','Oral, with or without food.'],
    ['Dose and frequency',[
      {text:'Adults and children 12 years and over: 250mg twice daily. 500mg twice daily for MORE EXTENSIVE INFECTION as defined in Appendix 2.',b:true},
      {text:'Children by weight, twice daily: 12 to 19 kg, 125mg. 20 to 29 kg, 187.5mg. 30 to 40 kg, 250mg.'},
      {text:'A child under 12 weighing more than 40 kg receives the adult dose of 250mg twice daily.'},
      {text:'A child weighing under 12 kg is outside this PGD; refer. The 8 to 11 kg band in version 002 was unreachable in a service starting at 2 years, since a two-year-old weighs 12 to 14 kg, and implied a scope this PGD does not have.',b:true},
      {text:'Duration 5 days; 7 days for cellulitis.'},
    ]],
    ['Quantity to be supplied',[
      {text:'Tablets, 250mg twice daily: 10 tablets for 5 days, 14 for 7 days.'},
      {text:'Tablets, 500mg twice daily: 20 tablets for 5 days, 28 for 7 days.'},
      {text:'Suspension, using 125mg/5mL for the smallest band and 250mg/5mL above:'},
      {text:'12 to 19 kg, 125mg twice daily, being 5 mL of 125mg/5mL: 50 mL for 5 days, 70 mL for 7 days.'},
      {text:'20 to 29 kg, 187.5mg twice daily, being 3.75 mL of 250mg/5mL: 37.5 mL for 5 days, 52.5 mL for 7 days.'},
      {text:'30 to 40 kg, 250mg twice daily, being 5 mL of 250mg/5mL: 50 mL for 5 days, 70 mL for 7 days.'},
      {text:'Adults, 250mg twice daily, being 5 mL of 250mg/5mL: 50 mL for 5 days, 70 mL for 7 days.'},
      {text:'Adults, 500mg twice daily, being 10 mL of 250mg/5mL: 100 mL for 5 days, 140 mL for 7 days.'},
    ]],
    ['Maximum treatment period','7 days. One course per episode; a second course is not authorised.'],
    ['Adverse effects','Common: abdominal pain, nausea, diarrhoea, taste disturbance, headache. Uncommon: QT prolongation, hepatic dysfunction. Rare: Clostridioides difficile infection, Stevens-Johnson syndrome.'],
    ['Storage','Tablets below 25C. Reconstituted suspension per the SPC; do not refrigerate.'],
   ],
   pat:[
    ['Written information','Supply the clarithromycin patient information leaflet. Where a suspension is supplied to a child, write the volume per dose in millilitres as well as the milligram dose.'],
    ['Counselling',[
      {bullet:'Take twice a day and finish the course.'},
      {bullet:'Tell us or your GP before starting any new medicine: this antibiotic interacts with a lot of them.'},
      {bullet:'If you have cellulitis, come to the 48-hour appointment we have booked. Seek help the same day if the redness passes the marked edge.',b:true},
      {bullet:'Seek help the same day if pain becomes severe or out of proportion, the skin darkens or blisters, or you develop fever or feel generally unwell.'},
      {bullet:'Stop and seek urgent help for rash, wheeze, or swelling of the lips or tongue.'},
      {bullet:'Come back if you are no better in 2 to 3 days.'},
    ]],
    ['Follow-up','As Arm 1.'],
   ],
  },

  {
   title:'Arm 3. Doxycycline, penicillin allergy, 12 years and over',
   subtitle:'Patient Group Direction for the supply of doxycycline 100mg capsules where flucloxacillin is unsuitable, in patients aged 12 years and over.',
   note:'Second line. Use only where the patient has a penicillin allergy or flucloxacillin is otherwise unsuitable, and record the reason.',
   training:TRAINING,
   pgd:[
    ['Indication','Mild to moderate skin and soft tissue infection, including cellulitis, where flucloxacillin is unsuitable, in patients aged 12 years and over.'],
    ['Inclusion criteria',[
      {bullet:'PENICILLIN ALLERGY, OR FLUCLOXACILLIN OTHERWISE UNSUITABLE, with the reason recorded.',b:true},
      {bullet:'Aged 12 years and over.'},
      {bullet:'Localised skin or soft tissue infection with signs of bacterial infection.'},
      {bullet:'All observations within the thresholds for the patient AGE BAND in Appendix 1.'},
      {bullet:'Where cellulitis is being treated, margins marked and the 48-hour review booked at this pharmacy.'},
      {bullet:'Valid informed consent given, and where under 16, on the basis set out in Arm 1.'},
      {bullet:'No exclusion criterion present.'},
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSIONS,
      {bullet:'Under 12 years of age. Doxycycline is not used in younger children.'},
      {bullet:'Pregnancy or breastfeeding. Doxycycline is contraindicated; refer.'},
      {bullet:'Hypersensitivity to doxycycline or other tetracyclines.'},
      {bullet:'Known severe hepatic impairment.'},
      {bullet:'Myasthenia gravis, systemic lupus erythematosus, or porphyria.'},
      {bullet:'Concurrent isotretinoin. Refer.'},
      {bullet:'Taking warfarin. Doxycycline potentiates it; refer. NOTE: warfarin is an EXCLUSION here and a CAUTION in the Acute Bacterial Bronchitis PGD, where the instruction is to refer rather than supply. The practical outcome is the same in both services: do not supply, refer.',b:true},
    ]],
    OBS_ROW,
    CELLULITIS_ROW,
    ANAPHYLAXIS_ROW,
    ['Cautions',[
      {text:'Photosensitivity: advise sun protection.'},
      {text:'Separate from antacids, iron and dairy by at least 2 hours.'},
      {text:'Oesophageal irritation: take sitting or standing with plenty of water and do not lie down for 30 minutes.'},
    ]],
    ['Actions if excluded or declines','As Arm 1.'],
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP.'],
    records(),
   ],
   med:[
    ['Name, form and strength','Doxycycline 100mg capsules.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Swallow whole with plenty of water, sitting or standing, and well before lying down.'],
    ['Dose and frequency',[
      {text:'200mg on day 1 as a single dose, then 100mg once daily.'},
      {text:'200mg daily throughout for MORE EXTENSIVE INFECTION as defined in Appendix 2.',b:true},
      {text:'Duration 5 days; 7 days for cellulitis.'},
    ]],
    ['Quantity to be supplied',[
      {text:'Standard regimen: 6 capsules for 5 days, 8 capsules for 7 days.'},
      {text:'200mg daily regimen: 10 capsules for 5 days, 14 capsules for 7 days.'},
    ]],
    ['Maximum treatment period','7 days. One course per episode; a second course is not authorised.'],
    ['Adverse effects','Common: nausea, diarrhoea, photosensitivity. Uncommon: oesophageal irritation or ulceration, rash. Rare: Clostridioides difficile infection, hepatotoxicity, benign intracranial hypertension.'],
    ['Storage','Store below 25C.'],
   ],
   pat:[
    ['Written information','Supply the doxycycline patient information leaflet.'],
    ['Counselling',[
      {bullet:'Take with plenty of water, sitting or standing up, and do not lie down for 30 minutes afterwards.'},
      {bullet:'Avoid antacids, indigestion remedies, iron tablets and milk within 2 hours of a dose.'},
      {bullet:'You may burn more easily in the sun. Use sun protection.'},
      {bullet:'If you have cellulitis, come to the 48-hour appointment we have booked.',b:true},
      {bullet:'Seek help the same day if pain becomes severe or out of proportion, the area spreads quickly, the skin darkens or blisters, or you feel generally unwell.'},
      {bullet:'Come back if you are no better in 2 to 3 days.'},
    ]],
    ['Follow-up','As Arm 1.'],
   ],
  },
 ],

 appendix:[
  {h:'Appendix 1: Observations, by age band'},
  {text:'Measure and record every observation before any supply. Use the row for the patient in front of you. If ANY threshold for that band is breached, do not supply: refer.',b:true},
  {tbl:[
   ['AGE 2 TO 4 YEARS',[
     {bullet:'Respiratory rate: REFER if 40 or above. (NICE NG143 defines tachypnoea over 12 months as more than 40.)'},
     {bullet:'Pulse: REFER if above 140. (APLS criteria used by NICE NG143 for 2 to 5 years.)'},
     {bullet:'Temperature: REFER if 38C or above.'},
     {bullet:'Oxygen saturation: REFER if below 94% on air at rest.'},
     {bullet:'Capillary refill: REFER if more than 2 seconds.'},
     {bullet:'Behaviour: REFER on any new drowsiness, floppiness, or a child who will not be roused or does not respond normally to social cues.'},
     {bullet:'DO NOT apply an adult blood pressure threshold in this band. A paediatric cuff and reference range are required to interpret it, and most pharmacies hold neither. Use appearance, capillary refill and the observations above.',b:true},
   ]],
   ['AGE 5 TO 11 YEARS',[
     {bullet:'Respiratory rate: REFER if 25 or above. (APLS reference range for this age is about 20 to 25.)'},
     {bullet:'Pulse: REFER if above 120. (APLS reference range for this age is about 80 to 120.)'},
     {bullet:'Temperature: REFER if 38C or above.'},
     {bullet:'Oxygen saturation: REFER if below 94% on air at rest.'},
     {bullet:'Capillary refill: REFER if more than 2 seconds.'},
     {bullet:'Behaviour: REFER on any new confusion or drowsiness.'},
     {bullet:'Blood pressure is not required in this band unless a paediatric cuff and reference range are available.'},
   ]],
   ['AGE 12 AND OVER',[
     {bullet:'Respiratory rate: REFER if 22 or above.'},
     {bullet:'Pulse: REFER if above 110 at rest.'},
     {bullet:'Temperature: REFER if 38C or above.'},
     {bullet:'Blood pressure: REFER if systolic below 100.'},
     {bullet:'Oxygen saturation: REFER if below 94% on air at rest.'},
     {bullet:'Level of consciousness: REFER on any new confusion or drowsiness.'},
     {bullet:'These match the Acute Bacterial Bronchitis PGD, which starts at 12, so the two documents agree for the ages they share.'},
   ]],
  ]},
  {h:'Necrotising fasciitis: emergency, not a referral'},
  {bullet:'Pain out of proportion to the appearance of the skin.'},
  {bullet:'Rapidly advancing erythema, over hours rather than days.'},
  {bullet:'Crepitus, skin necrosis, bullae, or dusky discolouration.'},
  {bullet:'Any of these means emergency assessment now. Do not supply, and do not arrange a routine referral.',b:true},

  {h:'Appendix 2: More extensive infection, defined'},
  {text:MORE_EXTENSIVE,b:true},
  'This definition applies to the clarithromycin 500mg twice daily dose and the doxycycline 200mg daily dose. Where it is not met, use the standard dose. Where the infection is beyond it, refer.',

  {h:'Appendix 3: Key references'},
  {bullet:'NICE Clinical Knowledge Summaries: Cellulitis and erysipelas, Impetigo, Eczema atopic infected, current revisions.'},
  {bullet:'NICE NG141 Cellulitis and erysipelas: antimicrobial prescribing, and NG153 Impetigo: antimicrobial prescribing.'},
  {bullet:'NICE NG143 Fever in under 5s, for the paediatric tachypnoea and tachycardia thresholds in Appendix 1.'},
  {bullet:'Advanced Paediatric Life Support reference ranges, for the 5 to 11 year band.'},
  {bullet:'Summary of Product Characteristics for flucloxacillin, clarithromycin and doxycycline, current versions.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v004',
 supersedes:'Version 003, 9 September 2026',
 validFrom:'9 September 2026',
 expiry:'31 July 2027',
 sigDate:'9 September 2026',
 chDate:'9 September 2026',
 changes:[
  'The summary of the governing guidance is restored as part 2 of the document, which is the house format for every Get Real Health PGD: what the PGD is for and which medicines it authorises, then a summary of the guidance that governs the condition, then the PGD itself. Twenty documents lost that section in the September 2026 rewrites, because the generator did not emit it and no check looked for it. It is the section that lets a pharmacist hold the PGD against the guidance it claims to follow, which is exactly how the inverted dental indication should have been caught. It is now a required field: the generator refuses to build a document without it.',
  'PAEDIATRIC FLUCLOXACILLIN VOLUME CORRECTED. Version 002 stated "Children 2 to 9 years: 250mg four times daily (10mL of the 250mg/5mL suspension)". 250mg of that suspension is 5 mL. A pharmacy following the bracket would have given a two-year-old 2 grams a day and run out of suspension halfway through. The quantity box was calculated correctly for 5 mL, which is how the error was found. Raised by an adopting pharmacy.',
  'OBSERVATIONS ARE NOW AGE-BANDED. Version 002 applied one set of adult thresholds, copied from the Acute Bacterial Bronchitis PGD so the two would agree, without noticing that that PGD starts at 12 and this one at 2. Pulse above 110 and respiratory rate 22 or above are normal for a well three-year-old, and systolic below 100 would refer almost every pre-schooler. Appendix 1 now has three bands, sourced to NICE NG143 and APLS reference ranges, and says plainly not to apply an adult blood pressure threshold to a small child.',
  'CELLULITIS IS RESTRICTED TO 12 YEARS AND OVER. It is the highest-acuity condition in this document and the one most likely to deteriorate; in a younger child it needs assessment rather than a pharmacy supply. Impetigo, folliculitis, infected eczema and infected wounds remain available from 2 years.',
  'CLARITHROMYCIN AND RENAL FUNCTION. Version 001 halved the dose below a creatinine clearance of 30 mL/min; version 002 said nothing about renal function in that arm, so a patient with significant impairment received twice the appropriate dose. Version 003 excludes and refers instead of adjusting: a pharmacy supply is not the place to make a renal dose adjustment on an unverified estimate. Renal function must now be asked about and the answer recorded.',
  '"MORE EXTENSIVE INFECTION" IS DEFINED. It triggered a dose increase in two arms and was defined nowhere, in a PGD whose scope is mild to moderate disease, so two members of staff would have dosed the same patient differently. Appendix 2 defines it as erythema larger than about 10 cm across, more than one body region involved, or cellulitis rather than a superficial infection.',
  'THE 48-HOUR CELLULITIS REVIEW NOW HAS AN OWNER. Version 002 required margins to be marked and a review at 48 hours but named nobody to do it, nowhere to do it and nothing to record. It is now an in-person review by a pharmacist at the supplying pharmacy, booked before the patient leaves, with what must be recorded set out, and a stated action if the patient does not attend.',
  'SUSPENSION QUANTITIES ADDED FOR THE 500mg REGIMEN. Version 002 authorised suspension for anyone unable to swallow capsules but gave quantities only for the 250mg paediatric regimen, so a 10 to 17 year old, and any adult, had a form authorised and no quantity authorised.',
  'THE CLARITHROMYCIN 8 TO 11 kg WEIGHT BAND IS REMOVED and a 12 kg floor stated. No child of 2 weighs 8 to 11 kg, so the band was unreachable and implied that under-twos were in scope. Arm 2 also had no age exclusion at all, so a pharmacist reading that arm alone found nothing barring an 18-month-old. It now carries one.',
  'FUNGAL AND VIRAL INFECTION RESTORED TO THE EXCLUSIONS. Version 001 excluded untreated fungal, bacterial and viral skin infection; version 002 kept only the bacterial part. Tinea misdiagnosed as bacterial infection is a common error and does not respond to any of these antibiotics. Distinguishing them is now a stated training requirement.',
  'AN ANAPHYLAXIS PROVISION IS RESTORED, in the form appropriate to an oral medicine taken at home: staff must be able to recognise anaphylaxis and call 999, and every patient must be counselled on rash, wheeze and lip or tongue swelling. Version 001 carried a provision and version 002 lost it.',
  'THE DIFFERENCE FROM THE BRONCHITIS PGD IS NOW STATED IN THE DOCUMENT. Immunosuppression is a qualifying comorbidity there and an absolute exclusion here, and the reason is given. Warfarin with doxycycline is an exclusion here and a caution there, with the same practical outcome. Staff move between these services within a shift and were left to discover the differences.',
  'Consent in children and young people added: parental responsibility, or Gillick competence with the basis recorded. This PGD starts at 2 years.',
  'The practitioner Agreement to practise page, the premises block and the practitioner signature table are restored, together with the standard governance training requirements: SPC and BNF familiarity, MHRA safety alerts, CPD and appraisal, indemnity, and capacity and consent. All were in version 001 and all were lost in the version 002 rewrite.',
  'Erythromycin is no longer offered. Version 001 gave "clarithromycin or erythromycin" for penicillin allergy; version 002 kept clarithromycin only, and no change log recorded the substitution. It is recorded here: clarithromycin is better tolerated and is the option in current NICE guidance for these infections. Found by comparing against the archived version 001, not by anyone noticing.',
  'Topical fusidic acid and hydrocortisone are no longer in this document. Version 001 carried topical options alongside the oral ones; version 002 made this an oral antibiotic PGD, with topical treatment handled by the Impetigo and Eczema PGDs. Deliberate, but unrecorded until now.',
  'Weeping, crusting and inflammation that has not responded to emollients and topical steroid are restored as the signs of infected eczema, from version 001.',
  'This change history is itemised. Version 002 recorded only "Full clinical review and reissue", which is why an adopting pharmacy had to compare the two versions line by line to find the errors above.',
 ],
 prior:[
  ['003, 9 September 2026','See the change history of that version. Superseded the same day by v004, which restores the guidance summary section.'],
  ['002, 7 September 2026','Full clinical review and reissue. Three arms restructured, observation thresholds and necrotising fasciitis features introduced, paediatric dosing moved to fixed doses and weight bands. Introduced the errors corrected in 003.'],
  ['001, 4 January 2026','Development and issue of new PGD.'],
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('skin-'+d.version+'-SIGNED.docx',b);console.log('skin '+d.version+' docx bytes',b.length);});
