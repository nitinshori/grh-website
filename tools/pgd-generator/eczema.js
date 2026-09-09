const {build,Packer,fs}=require('./gen.js');

// ── The site rule, stated once ────────────────────────────────────────────
// v002 stated it in the scope page and again in Arm 2's actions-if-excluded,
// and both told staff to supply clobetasone under Arm 1 for moderate disease
// on an excluded site, while Arm 1's inclusion criteria required MILD
// disease. Moderate eczema on the face or flexures therefore had no supply
// route at all. Arm 1 now expressly covers it.
const SITE_RULE=[
 {text:'BETAMETHASONE VALERATE 0.1% (Arm 2) IS NOT AUTHORISED on the face, eyelids, flexures or genital skin. A potent steroid on thin skin causes atrophy quickly.',b:true},
 {text:'CLOBETASONE BUTYRATE 0.05% (Arm 1) MAY BE USED ON THOSE SITES, for MILD OR MODERATE disease, FOR UP TO 7 DAYS ONLY at those sites.',b:true},
 {text:'THE EYELIDS ARE EXCLUDED FROM BOTH ARMS. Refer.',b:true},
 {text:'So: moderate eczema on the face, flexures or genital skin is treated with clobetasone under Arm 1, capped at 7 days. Version 002 pointed staff to Arm 1 for exactly this patient while Arm 1 admitted only mild disease.',b:true},
];

const DURATION_ROW=['Maximum treatment period',[
 {text:'ON THE FACE, FLEXURES OR GENITAL SKIN: 7 DAYS MAXIMUM, whichever arm and whichever severity. Not 4 weeks. Version 002 stated this limit only inside an exclusion bullet, while the duration box for the same arm permitted four weeks of continuous daily treatment, so a member of staff reading the duration box for a facial supply got the wrong answer.',b:true},
 {text:'ON THE TRUNK AND LIMBS: up to 7 days initially, then review. Maximum 4 weeks of continuous daily treatment in total. Longer than that requires GP review.'},
 {text:'Maximum three courses in any 12 months before GP review.'},
 {text:'One supply per consultation. A second supply may be made after review, within the 4 week ceiling.'},
]];

const QUANTITY_ROW=['Quantity to be supplied',[
 {text:'Sized to the treated area for the initial 7 days, with margin. Version 002 offered a maximum of 30g against a maximum treatable area of 10% of body surface, which at twice-daily application lasts six days and covers less than a quarter of the four weeks the same document permitted.',b:true},
 {text:'Working, using the conversion in Appendix 1: one fingertip unit is about 0.5g and covers about two adult palms.'},
 {bullet:'UP TO 2 ADULT PALMS, about 2% of body surface. 1 fingertip unit, 0.5g per application, 1g a day. SUPPLY 15g.'},
 {bullet:'2 TO 5 ADULT PALMS. Up to 2.5 fingertip units, 1.25g per application, 2.5g a day. SUPPLY 30g.'},
 {bullet:'5 TO 10 ADULT PALMS, up to the 10% maximum. Up to 5 fingertip units, 2.5g per application, 5g a day, so 35g over 7 days. SUPPLY 60g.'},
 {text:'ABOVE 10% OF BODY SURFACE, about ten adult palms: refer rather than supply. That has not changed.',b:true},
]];

const BROKEN_SKIN=[
 {text:'ULCERATED SKIN AND OPEN WOUNDS ARE EXCLUDED. Refer.',b:true},
 {text:'EXCORIATION FROM SCRATCHING IS NOT AN EXCLUSION. It is expected in eczema, and version 002 both listed it as a marker of MODERATE disease qualifying a patient for Arm 2 and excluded "broken or ulcerated skin" three bullets below, so the same finding included and excluded the same patient.',b:true},
 {text:'WEEPING OR CRUSTED SKIN suggests secondary bacterial infection. Handle it under the concurrent supply route below, or refer. Version 001 excluded weeping skin outright; version 002 dropped the word without saying so.',b:true},
];

const FLAMMABILITY={text:'FIRE RISK FROM EMOLLIENTS. All emollients, including paraffin-free ones, soak into clothing, bedding and dressings and make them catch fire more easily and burn faster. Tell every patient not to smoke, use a naked flame, or go near anything burning, and to wash clothing and bedding often, knowing that washing may not remove the residue completely. Version 001 carried this warning and version 002 lost it.',b:true};

const TRAINING=[
 'Pharmacist registered and practising with the GPhC.',
 'Pharmacy technician registered and practising with the GPhC.',
 'Must have completed training relevant to this condition, documented and overseen by the Get Real Health team.',
 'Must be able to grade eczema severity as mild or moderate against the definitions in this document, since severity and site together decide which arm applies.',
 'Must be able to distinguish eczema and dermatitis from the conditions excluded below, in particular ROSACEA, PERIORAL DERMATITIS, ACNE, TINEA (fungal infection) and ECZEMA HERPETICUM. Tinea treated with a topical steroid becomes tinea incognito and worsens; version 002 omitted fungal infection from both the exclusions and this list.',
 'Must be able to apply the fingertip unit conversion in Appendix 1 to size a supply to the treated area.',
 'Must previously have used PGDs to supply medication.',
 'Must work in compliance with the SOPs of their own employer and practise only within the bounds of their own competence.',
];

const COMMON_EXCLUSIONS=[
 {bullet:'Under 12 years of age.'},
 {bullet:'Application to the EYELIDS. Refer.',b:true},
 {bullet:'UNTREATED FUNGAL INFECTION, or any rash that might be tinea. A topical steroid on tinea produces tinea incognito: the rash spreads, loses its edge and becomes much harder to diagnose. Version 001 excluded untreated fungal, bacterial and viral infection; version 002 kept only part of it.',b:true},
 {bullet:'SUSPECTED ECZEMA HERPETICUM: rapidly worsening, painful, punched-out or clustered vesicular lesions, or the patient is systemically unwell. This is an emergency, not a routine referral.',b:true},
 {bullet:'Signs of secondary bacterial infection, unless being treated concurrently under the Skin and Soft Tissue Infection PGD. See the note on concurrent supply.'},
 {bullet:'Ulcerated skin, or an open wound.'},
 {bullet:'Rosacea, perioral dermatitis or acne. A topical steroid makes all three worse.'},
 {bullet:'More than 10% of body surface affected, about ten adult palms. Refer.'},
 {bullet:'Three or more courses already supplied in the last 12 months without GP review.'},
 {bullet:'Known hypersensitivity to the product or any excipient.'},
 {bullet:'Pregnancy or breastfeeding, where treatment would be to the breast or nipple area. Otherwise short-term use of these potencies is acceptable; record the site.'},
];

function counselling(arm){return ['Counselling',[
 {bullet:'Apply the steroid FIRST, in a thin layer, to the affected skin only. WAIT AT LEAST 30 MINUTES, then apply your emollient. Do not put emollient straight over a freshly applied steroid: it dilutes it and spreads it onto skin that does not need it.',b:true},
 {bullet:'Use the fingertip unit measure we have shown you. One fingertip unit covers about two adult palms.'},
 {bullet:arm==='clobetasone'?'On the face, in skin folds or on genital skin, use this for no more than 7 days.':'Do NOT use this on the face, eyelids, skin folds or genital skin. If eczema appears there, come back and we will look at it.'},
 {bullet:'Keep using your emollient every day, including after the steroid course finishes. The emollient is the treatment that keeps eczema away; the steroid settles a flare.'},
 FLAMMABILITY,
 {bullet:'Come back or see your GP if it is no better after 7 days, if it spreads, or if it starts weeping, crusting or becoming painful.'},
 {bullet:'Seek urgent help if the rash becomes rapidly painful with clustered blisters or punched-out sores, or you feel unwell with it.',b:true},
]];}

function records(){return ['Records to be kept',[
 {bullet:'That valid informed consent was given. Where the patient is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis recorded.',b:true},
 {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
 {bullet:'The SEVERITY graded as mild or moderate, and the SITE treated. Together these decide the arm, the duration cap and the quantity.',b:true},
 {bullet:'The treated area in adult palms or fingertip units, and the quantity supplied against it.',b:true},
 {bullet:'Where a face, flexure or genital site was treated, that the 7 day cap was explained and recorded.',b:true},
 {bullet:'How many courses the patient has had in the last 12 months.'},
 {bullet:'Where a concurrent antibiotic was supplied for secondary infection, that both supplies are in one consultation record.'},
 {bullet:'That the fire risk from emollients was explained.',b:true},
 {bullet:'Name and registration number of the healthcare professional supplying.'},
 {bullet:'Name of the medicine, date of supply, dose, form, route and quantity supplied, with batch number and expiry date.'},
 {bullet:'Advice given, including advice given if excluded or declining treatment.'},
 {bullet:'Details of any adverse drug reactions and the actions taken.'},
 {bullet:'That the medicine was supplied under this PGD.'},
 {text:'Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th where the patient was 17 when treatment finished.'},
]];}

const d={
 banner:'ISSUED, VALID FROM 9 SEPTEMBER 2026',
 title:'Eczema and Dermatitis',
 strap:'Patient Group Direction, version 003, issued 9 September 2026. Clobetasone butyrate 0.05% and betamethasone valerate 0.1%, 12 years and over.',

 intro:[
  {h:'What version 002 got wrong'},
  {bullet:'MODERATE ECZEMA ON THE FACE OR FLEXURES HAD NO SUPPLY ROUTE. The scope page and Arm 2 both sent that patient to Arm 1 for clobetasone, and Arm 1 admitted only MILD disease. Arm 1 now covers mild disease anywhere and moderate disease on those sites, capped at 7 days.',b:true},
  {bullet:'THE FACIAL DURATION RULE CONTRADICTED ITSELF. The 7 day cap for clobetasone on the face, flexures and genital skin appeared only inside an exclusion bullet, while the duration box for the same arm permitted 4 weeks of continuous daily treatment. It is now in the duration box, the counselling and the records.',b:true},
  {bullet:'THE QUANTITY DID NOT COVER THE AREA. 30g was the largest supply against a maximum treatable area of 10% of body surface. At 2.5g per application twice daily that is six days, against a document that permitted four weeks. Quantities are now sized to the area, with the arithmetic shown.',b:true},
  {bullet:'EXCORIATION WAS BOTH AN INCLUSION AND AN EXCLUSION. Arm 2 listed excoriation as a marker of moderate disease qualifying a patient, and excluded "broken or ulcerated skin" three bullets below. Excoriation is broken skin.',b:true},
  {bullet:'FUNGAL INFECTION WAS NO LONGER EXCLUDED. Version 001 excluded untreated fungal, bacterial and viral infection; version 002 covered bacterial infection and eczema herpeticum only, and left tinea out of the differential a technician is trained on, while authorising them to supply a potent corticosteroid.',b:true},
  {bullet:'THE FIRE WARNING WAS LOST. Emollients soak into clothing and bedding and make them burn faster. Version 001 carried the warning; version 002 dropped it.',b:true},
  {bullet:'NO INTERVAL BETWEEN STEROID AND EMOLLIENT. Version 002 said only "wait for it to absorb". It is now at least 30 minutes.',b:true},

  {h:'Which arm, decided by severity AND site'},
  ...SITE_RULE,
  {text:'MILD means limited erythema and scaling, not markedly affecting sleep or daily activity. MODERATE means marked erythema or lichenification, or disease disturbing sleep or daily activity. Excoriation from scratching may be present in either and does not by itself make disease moderate.',b:true},

  {h:'Concurrent supply for infected eczema'},
  'Where eczema is complicated by MILD, LOCALISED secondary bacterial infection, a patient may receive a topical corticosteroid under this PGD and an oral antibiotic under the Skin and Soft Tissue Infection PGD at the same consultation, both recorded in one consultation record. Where the infection is not mild and localised, or any red flag from the infection PGD is present, refer and supply neither.',
 ],

 arms:[
  {
   title:'Arm 1. Clobetasone butyrate 0.05%, moderate potency',
   subtitle:'Patient Group Direction for the supply of clobetasone butyrate 0.05% cream or ointment for MILD eczema or dermatitis at any permitted site, and for MODERATE eczema or dermatitis on the face, flexures or genital skin, in patients aged 12 years and over.',
   training:TRAINING,
   pgd:[
    ['Indication','Short-term treatment of eczema or dermatitis where a topical corticosteroid is appropriate: mild disease at any permitted site, and moderate disease on the face, flexures or genital skin where betamethasone valerate 0.1% is not authorised. First-line potency under this PGD.'],
    ['Which arm applies',SITE_RULE],
    ['Inclusion criteria',[
      {bullet:'Aged 12 years and over.'},
      {bullet:'EITHER mild eczema or dermatitis at any permitted site: limited erythema and scaling, not markedly affecting sleep or daily activity.',b:true},
      {bullet:'OR moderate eczema or dermatitis ON THE FACE, FLEXURES OR GENITAL SKIN, where the potent arm is not authorised. Treatment at those sites is capped at 7 days.',b:true},
      {bullet:'A diagnosis of eczema or dermatitis that the patient or their carer recognises, or that is clear on examination.'},
      {bullet:'Affected area no more than 10% of body surface, about ten adult palms.'},
      {bullet:'Valid informed consent given. Where the patient is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent.',b:true},
      {bullet:'No exclusion criterion present.'},
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSIONS,
      {bullet:'MODERATE disease on the trunk or limbs. Use Arm 2.',b:true},
    ]],
    ['Broken, weeping and excoriated skin',BROKEN_SKIN],
    ['Cautions',[
      {text:'Prolonged use, particularly on the face, flexures and genital skin, causes skin thinning, striae and telangiectasia. That is why those sites are capped at 7 days.'},
      {text:'Do not use under occlusion unless specifically advised, and do not apply to skin under a nappy or a tight dressing.'},
      {text:'A flare that has not settled after 7 days needs review rather than a longer course.'},
      {text:'Where the patient is already using another topical corticosteroid, do not add a second. Refer.'},
    ]],
    ['Actions if excluded or declines',[
      {bullet:'Where the exclusion is eyelid involvement, or a rash that may be fungal, say plainly why a steroid is not the right treatment and arrange review.'},
      {bullet:'Where eczema herpeticum is suspected, arrange EMERGENCY assessment, not a routine referral.',b:true},
      {bullet:'Where the area is above 10% of body surface, or the patient has had three courses in 12 months, refer to the GP for review rather than supplying again.'},
      {bullet:'Document the reason for exclusion, the advice given and the decision reached.'},
    ]],
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP as appropriate.'],
    records(),
   ],
   med:[
    ['Name, form and strength','Clobetasone butyrate 0.05% cream or ointment. Ointment for dry, lichenified skin; cream for weeping or moist areas and for the face where an ointment is not tolerated.'],
    ['Legal category','POM.'],
    ['Route and method','Topical. Apply a THIN layer to affected skin only, once or twice daily. Measure the amount in fingertip units using Appendix 1.'],
    ['Dose and frequency','Apply a thin layer once or twice daily to affected skin only.'],
    QUANTITY_ROW,
    DURATION_ROW,
    ['Adverse effects','Common with prolonged use: skin thinning, striae, telangiectasia, local burning or itching on application. Uncommon: folliculitis, hypopigmentation, worsening of an unrecognised infection. Rare: systemic absorption with extensive or occluded use, contact dermatitis to an excipient.'],
    ['Storage','Store below 25C. Do not use after the expiry date. Discard the tube 3 months after opening.'],
   ],
   pat:[
    ['Written information','Supply the patient information leaflet, and show the patient how to measure a fingertip unit on their own finger.'],
    counselling('clobetasone'),
    ['Follow-up','Review if not improved after 7 days, or sooner if the rash spreads, weeps, crusts or becomes painful. Beyond 4 weeks of continuous treatment on the trunk or limbs, or 7 days on the face, flexures or genital skin, the patient needs GP review rather than a further supply here.'],
   ],
  },

  {
   title:'Arm 2. Betamethasone valerate 0.1%, potent',
   subtitle:'Patient Group Direction for the supply of betamethasone valerate 0.1% cream or ointment for MODERATE eczema or dermatitis on the TRUNK AND LIMBS ONLY, in patients aged 12 years and over.',
   note:'Not for the face, eyelids, flexures or genital skin. For moderate disease at those sites, use clobetasone under Arm 1, capped at 7 days.',
   training:TRAINING,
   pgd:[
    ['Indication','Short-term treatment of MODERATE eczema or dermatitis on the trunk and limbs, where a moderate-potency steroid is insufficient or the presentation is clearly moderate at first assessment.'],
    ['Which arm applies',SITE_RULE],
    ['Inclusion criteria',[
      {bullet:'Aged 12 years and over.'},
      {bullet:'MODERATE eczema or dermatitis: marked erythema or lichenification, or disease disturbing sleep or daily activity.',b:true},
      {bullet:'ON THE TRUNK OR LIMBS ONLY.',b:true},
      {bullet:'Affected area no more than 10% of body surface, about ten adult palms.'},
      {bullet:'Valid informed consent given, and where under 16, on the basis set out in Arm 1.'},
      {bullet:'No exclusion criterion present.'},
    ]],
    ['Exclusion criteria',[
      {text:'Refer, do not supply, where any of the following is present.',b:true},
      ...COMMON_EXCLUSIONS,
      {bullet:'ANY application to the face, eyelids, flexures or genital skin. Use Arm 1 for those sites.',b:true},
      {bullet:'Mild disease. Use Arm 1: do not start at a potent steroid where a moderate one is appropriate.',b:true},
    ]],
    ['Broken, weeping and excoriated skin',BROKEN_SKIN],
    ['Cautions',[
      {text:'Potent steroids cause atrophy faster than moderate ones. Keep the course as short as the flare requires and review at 7 days.'},
      {text:'Do not use under occlusion unless specifically advised.'},
      {text:'Where the patient is already using another topical corticosteroid, do not add a second. Refer.'},
      {text:'Step down to a moderate potency once the flare settles rather than stopping abruptly, and say so to the patient.'},
    ]],
    ['Actions if excluded or declines','As Arm 1. Where the exclusion is site, supply clobetasone under Arm 1 instead where that is appropriate, and record which arm was used and why.'],
    ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP as appropriate.'],
    records(),
   ],
   med:[
    ['Name, form and strength','Betamethasone valerate 0.1% cream or ointment. Ointment for dry, lichenified skin; cream for moist areas.'],
    ['Legal category','POM.'],
    ['Route and method','Topical. Apply a THIN layer to affected skin only, once or twice daily. Measure in fingertip units using Appendix 1.'],
    ['Dose and frequency','Apply a thin layer once or twice daily to affected skin only.'],
    QUANTITY_ROW,
    ['Maximum treatment period',[
      {text:'Up to 7 days initially, then review. Maximum 4 weeks of continuous daily treatment on the trunk and limbs. Longer requires GP review.'},
      {text:'This arm is not authorised on the face, flexures or genital skin at all, so the 7 day site cap does not arise here. If eczema appears at those sites, use Arm 1.',b:true},
      {text:'Maximum three courses in any 12 months before GP review.'},
    ]],
    ['Adverse effects','As Arm 1, with a higher risk of skin thinning, striae and telangiectasia because the potency is greater. Rare: systemic absorption with extensive or occluded use, and adrenal suppression with prolonged large-area use.'],
    ['Storage','Store below 25C. Do not use after the expiry date. Discard the tube 3 months after opening.'],
   ],
   pat:[
    ['Written information','Supply the patient information leaflet, and show the patient how to measure a fingertip unit.'],
    counselling('betamethasone'),
    ['Follow-up','As Arm 1.'],
   ],
  },
 ],

 appendix:[
  {h:'Appendix 1: Fingertip units, treated area and quantity'},
  {bullet:'ONE FINGERTIP UNIT is the amount squeezed from a standard nozzle onto the pad of an adult index finger, from the tip to the first crease. It is about 0.5g and covers about TWO ADULT PALMS.'},
  {bullet:'Two adult palms is roughly 2% of body surface.'},
  {bullet:'TEN ADULT PALMS is about 10% of body surface, which is the MAXIMUM area treatable under this PGD. Above that, refer.',b:true},
  {text:'Quantity, worked from those conversions at twice-daily application over 7 days:',b:true},
  {bullet:'Up to 2 palms: 1 fingertip unit, 0.5g per application, 1g a day, 7g a week. Supply 15g.'},
  {bullet:'2 to 5 palms: up to 2.5 fingertip units, 1.25g per application, 2.5g a day, 17.5g a week. Supply 30g.'},
  {bullet:'5 to 10 palms: up to 5 fingertip units, 2.5g per application, 5g a day, 35g a week. Supply 60g.'},
  {text:'Version 002 offered 15g and 30g only, against a treatable area of up to 10% of body surface, so the largest supply ran out in six days.',i:true,color:'595959'},

  {h:'Appendix 2: Steroid and emollient, order and interval'},
  {bullet:'Apply the STEROID FIRST, thinly, to affected skin only.'},
  {bullet:'WAIT AT LEAST 30 MINUTES.',b:true},
  {bullet:'Then apply the emollient, generously, to the whole area including unaffected skin.'},
  {bullet:'Applying emollient straight over a freshly applied steroid dilutes it and carries it onto skin that does not need it.'},
  {text:'A note on the order: version 001 said to apply the steroid AFTER emollients, leaving 20 to 30 minutes. Version 002 reversed the order to steroid first without recording that it had done so. Version 003 keeps steroid first, which avoids spreading steroid onto unaffected skin, and states the interval, which version 002 omitted. What matters most in practice is that the two are separated and that the patient does the same thing each time.',i:true,color:'595959'},

  {h:'Appendix 3: Fire risk from emollients'},
  {text:'This warning applies to every patient using an emollient, which is every patient under this PGD.',b:true},
  {bullet:'Emollients soak into clothing, bedding, dressings and upholstery.'},
  {bullet:'Fabric with dried-on emollient catches fire more easily and burns faster. This applies to paraffin-based AND paraffin-free products.'},
  {bullet:'Tell the patient not to smoke, use a naked flame, or go near anything burning.'},
  {bullet:'Wash clothing and bedding frequently, and understand that washing may not remove the residue completely.'},
  {bullet:'Record that this was explained.'},

  {h:'Appendix 4: Key references'},
  {bullet:'NICE Clinical Knowledge Summaries: Eczema atopic, current revision.'},
  {bullet:'NICE CG57 Atopic eczema in under 12s, for the fingertip unit and severity definitions.'},
  {bullet:'MHRA Drug Safety Update on the fire risk associated with emollients, including paraffin-free products.'},
  {bullet:'Summary of Product Characteristics for clobetasone butyrate 0.05% and betamethasone valerate 0.1%, current versions.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v003',
 supersedes:'Version 002, 7 September 2026',
 validFrom:'9 September 2026',
 expiry:'31 July 2027',
 sigDate:'9 September 2026',
 chDate:'9 September 2026',
 changes:[
  'MODERATE ECZEMA ON THE FACE, FLEXURES OR GENITAL SKIN NOW HAS A SUPPLY ROUTE. Version 002 told staff, on the scope page and again in Arm 2, to supply clobetasone under Arm 1 for that patient, while Arm 1 admitted only MILD disease. The patient therefore had no route. Arm 1 now covers mild disease at any permitted site and moderate disease at those sites, capped at 7 days. Raised by an adopting pharmacy.',
  'THE FACIAL DURATION CONTRADICTION IS RESOLVED. The 7 day cap for clobetasone on the face, flexures and genital skin appeared only inside an exclusion bullet, while the maximum treatment period box for the same arm permitted 4 weeks of continuous daily treatment. The cap is now in the duration box, the counselling and the records.',
  'QUANTITIES ARE SIZED TO THE TREATED AREA, with the arithmetic shown in Appendix 1. Version 002 offered 15g and 30g against a maximum treatable area of 10% of body surface; at 2.5g per application twice daily the 30g maximum lasts six days, against a document permitting four weeks. Supplies are now 15g, 30g and 60g by area.',
  'THE EXCORIATION CONTRADICTION IS RESOLVED. Arm 2 listed excoriation as a marker of moderate disease qualifying a patient, and excluded broken skin three bullets below. Excoriation is broken skin. Excoriation is now expressly not an exclusion, ulcerated skin and open wounds are, and weeping or crusted skin routes to the concurrent supply provision or to referral. Version 001 excluded weeping skin and version 002 dropped the word without recording it.',
  'FUNGAL AND VIRAL INFECTION ARE BACK IN THE EXCLUSIONS, and tinea is back in the differential that staff must be trained on. Version 001 excluded untreated fungal, bacterial and viral skin infection; version 002 covered bacterial infection and eczema herpeticum only. A topical steroid on tinea produces tinea incognito, and registered technicians are authorised to supply a potent corticosteroid under this PGD.',
  'THE FIRE RISK WARNING IS RESTORED, with its own appendix and a requirement to record that it was explained. Emollients, including paraffin-free ones, soak into fabric and make it burn faster. Version 001 carried the warning and version 002 lost it.',
  'AN INTERVAL BETWEEN STEROID AND EMOLLIENT IS STATED: at least 30 minutes. Version 002 said only "wait for it to absorb".',
  'The reversal of the application order is now recorded. Version 001 applied the steroid after emollients; version 002 reversed it to steroid first and said nothing about having done so. Version 003 keeps steroid first and explains why.',
  'Severity definitions are stated once at the front and referenced by both arms, and it is made explicit that excoriation does not by itself make disease moderate.',
  'Consent in children and young people added: parental responsibility, or Gillick competence with the basis recorded.',
  'The practitioner Agreement to practise page, the premises block and the practitioner signature table are restored, together with the standard governance requirements: SPC and BNF familiarity, MHRA safety alerts, CPD and appraisal, indemnity, and capacity and consent. All were in version 001 and all were lost in the version 002 rewrite.',
  'The Key references section is restored, lost in the version 002 rewrite.',
  'Records must now carry the severity, the site, the treated area in palms or fingertip units, the quantity against it, the 7 day cap where a face, flexure or genital site was treated, and that the fire risk was explained.',
  'Topical calcineurin inhibitors (tacrolimus, pimecrolimus) and the topical and oral antibiotic content in the version 001 summary pages are recorded here as deliberate removals. Calcineurin inhibitors require specialist initiation and are outside a PGD; antibiotic treatment of infected eczema is handled by the Skin and Soft Tissue Infection PGD through the concurrent supply route. Both were dropped in version 002 and neither appeared in any change log.',
  'This change history is itemised. Version 002 recorded only "Full clinical review and reissue", which is why an adopting pharmacy had to compare the two versions line by line to find the contradictions above.',
 ],
 prior:[
  ['002, 7 September 2026','Full clinical review and reissue. Restructured into a clobetasone arm and a betamethasone valerate 0.1% arm, concurrent supply for infected eczema introduced, pimecrolimus, hydrocortisone and fusidic acid removed. Introduced the contradictions corrected in 003.'],
  ['001, 1 November 2025','Development and issue of new PGD.'],
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('eczema-v003-SIGNED.docx',b);console.log('eczema v003 docx bytes',b.length);});
