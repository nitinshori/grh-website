import { ImpetigoLesionAssessment, ImpetigoMedicalHistory, ImpetigoTreatmentSelection } from './impetigo-types';
import { ClinicalAlert, AlertSeverity } from '../shared/types';

/**
 * Clinical logic for the Impetigo ePGD, aligned to the Impetigo PGD v008
 * (11 September 2026). Appendix 1 of the document, "Which arm, in order":
 *   1. Systemically unwell, or cellulitis: refer. Stop.
 *   2. Localised non-bullous: hydrogen peroxide 1% as a P sale first; if
 *      unsuitable or ineffective, fusidic acid 2% cream three times a day
 *      for 5 days.
 *   3. Widespread, bullous, or topical treatment failed. Not penicillin
 *      allergic and aged 3 months to 17: flucloxacillin oral suspension four
 *      times a day for 5 days. Not allergic and an adult: REFER (this PGD
 *      has no adult oral flucloxacillin arm).
 *   4. Penicillin allergic: clarithromycin (adults and 12 to 17, 250mg twice
 *      a day; 1 month to 11 years by weight), or erythromycin in pregnancy.
 *   5. Never combine a topical and an oral antibiotic. One course per episode.
 */

export interface ReferralResult {
  shouldRefer: boolean;
  reason: string;
}

export interface TreatmentRecommendation {
  treatment: string;
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  quantityUnit?: string;
  rationale: string;
}

export type ImpetigoRoute = 'topical' | 'flucloxacillin' | 'macrolide' | 'incomplete';

export interface ClinicalAssessment {
  route: ImpetigoRoute;
  referrals: ReferralResult[];
  alerts: ClinicalAlert[];
  treatmentRecommendation: TreatmentRecommendation | null;
  cautions: string[];
}

/**
 * Calculate age from date of birth
 */
export function calculateAgeFromDOB(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/** Whole months of age, for the 1-month and 3-month floors in the oral arms. */
export function calculateAgeMonths(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
  if (today.getDate() < dob.getDate()) months--;
  return months;
}

/** The document defines widespread as more than about 5 lesions or an area over about 5cm. */
export function needsOralRoute(lesionAssessment: ImpetigoLesionAssessment): boolean {
  return (
    lesionAssessment.lesionType === 'bullous' ||
    lesionAssessment.extent === 'widespread' ||
    lesionAssessment.topicalFailed ||
    lesionAssessment.brokenSkin
  );
}

/** Which arm the document sends this patient to, before exclusions. */
export function determineRoute(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory,
): ImpetigoRoute {
  if (!lesionAssessment.lesionType || !lesionAssessment.extent) return 'incomplete';
  if (!needsOralRoute(lesionAssessment)) return 'topical';
  if (medicalHistory.penicillinAllergy) return 'macrolide';
  if (age < 18 && medicalHistory.flucloxSuspensionRefused) return 'macrolide';
  return 'flucloxacillin';
}

export interface ClarithromycinBand {
  label: string;
  dose: string;
}

/** Clarithromycin paediatric weight bands, 1 month to 11 years, from the document. */
export function clarithromycinWeightBand(weightKg: number): ClarithromycinBand {
  if (weightKg < 8) return { label: 'under 8 kg', dose: `7.5 mg/kg twice a day (${(weightKg * 7.5).toFixed(1)} mg twice a day at ${weightKg} kg)` };
  if (weightKg <= 11) return { label: '8 to 11 kg', dose: '62.5 mg twice a day' };
  if (weightKg <= 19) return { label: '12 to 19 kg', dose: '125 mg twice a day' };
  if (weightKg <= 29) return { label: '20 to 29 kg', dose: '187.5 mg twice a day' };
  if (weightKg <= 40) return { label: '30 to 40 kg', dose: '250 mg twice a day' };
  return { label: 'over 40 kg', dose: '250 mg twice a day (adult dose)' };
}

function parseWeight(w: string): number | null {
  const n = parseFloat(w);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Determine if patient meets exclusion criteria
 */
export function evaluateReferralCriteria(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory,
  ageMonths: number | null = null,
): ReferralResult[] {
  const referrals: ReferralResult[] = [];
  const route = determineRoute(age, lesionAssessment, medicalHistory);
  const oral = route === 'flucloxacillin' || route === 'macrolide';
  const months = ageMonths ?? age * 12;

  // ── Shared exclusions, all arms ──────────────────────────────────
  if (lesionAssessment.systemicallyUnwell) {
    referrals.push({
      shouldRefer: true,
      reason: 'Systemically unwell (fever, malaise, lymphadenopathy, or appearing unwell). Refer the same day.',
    });
  }
  if (lesionAssessment.cellulitisSigns) {
    referrals.push({
      shouldRefer: true,
      reason: 'Signs of a more serious condition, in particular cellulitis: spreading redness, warmth, swelling or pain beyond the lesions. Refer to hospital.',
    });
  }
  if (medicalHistory.immunosuppressed) {
    referrals.push({
      shouldRefer: true,
      reason:
        lesionAssessment.extent === 'widespread'
          ? 'Immunocompromised with widespread impetigo. NICE advises hospital referral.'
          : 'Immunocompromised. The document refers where impetigo is widespread; this tool refers in all cases. Refer to the GP.',
    });
  }
  if (lesionAssessment.lesionType === 'bullous' && age <= 1) {
    referrals.push({
      shouldRefer: true,
      reason: 'Bullous impetigo in a baby. Refer or seek specialist advice.',
    });
  }
  if (medicalHistory.recurrentImpetigo) {
    referrals.push({
      shouldRefer: true,
      reason: 'Recurrent impetigo (frequent repeated episodes). Refer for swabbing and consideration of decolonisation, rather than treating again.',
    });
  }
  if (lesionAssessment.nearEyes) {
    referrals.push({
      shouldRefer: true,
      reason: 'Around the eye, or involving the eyelid margin. A topical product cannot be used safely and an ophthalmic opinion may be needed. Refer.',
    });
  }
  if (lesionAssessment.diagnosticUncertainty) {
    referrals.push({
      shouldRefer: true,
      reason: 'Diagnostic uncertainty, or a presentation that could be herpes simplex, eczema herpeticum or a fungal infection. Refer.',
    });
  }
  if (medicalHistory.antibioticAlreadyThisEpisode) {
    referrals.push({
      shouldRefer: true,
      reason: 'A course of antibiotic already supplied for this episode under this PGD. One course per episode; treatment failure needs reassessment and a swab, not a second guess.',
    });
  }
  if (medicalHistory.mrsaSuspected) {
    referrals.push({
      shouldRefer: true,
      reason: 'MRSA suspected or confirmed. Consult a local microbiologist (NICE NG153); not for supply under this PGD.',
    });
  }

  // ── Topical arm: fusidic acid 2% cream ───────────────────────────
  if (route === 'topical') {
    if (medicalHistory.fusidicAcidAllergy) {
      referrals.push({
        shouldRefer: true,
        reason: 'Known hypersensitivity to fusidic acid or an excipient. Mupirocin is not authorised by this PGD. Refer.',
      });
    }
  }

  // ── Oral arms ────────────────────────────────────────────────────
  if (route === 'flucloxacillin') {
    if (age >= 18) {
      referrals.push({
        shouldRefer: true,
        reason: 'Adult aged 18 or over needing an oral antibiotic and not penicillin-allergic. This PGD carries no adult oral flucloxacillin, and the absence of an arm is not "flucloxacillin unsuitable". Refer.',
      });
    }
    if (months < 3) {
      referrals.push({
        shouldRefer: true,
        reason: 'Under 3 months of age. The flucloxacillin arm starts at 3 months. Refer.',
      });
    }
    if (medicalHistory.cephalosporinAllergyHighRisk) {
      referrals.push({
        shouldRefer: true,
        reason: 'Cephalosporin allergy with a high risk of cross-reactivity to penicillins. Flucloxacillin excluded; consider the macrolide arm or refer.',
      });
    }
    if (medicalHistory.flucloxCholestasisHistory) {
      referrals.push({
        shouldRefer: true,
        reason: 'Previous cholestasis or jaundice associated with flucloxacillin. Flucloxacillin excluded.',
      });
    }
    if (medicalHistory.severeHepaticImpairment || medicalHistory.severeRenalImpairment) {
      referrals.push({
        shouldRefer: true,
        reason: 'Severe hepatic impairment, or severe renal impairment (eGFR below 30 mL/min/1.73m2). Flucloxacillin excluded. Refer.',
      });
    }
  }

  if (route === 'macrolide') {
    if (months < 1) {
      referrals.push({ shouldRefer: true, reason: 'Under 1 month of age. Refer.' });
    }
    if (medicalHistory.macrolideAllergy) {
      referrals.push({
        shouldRefer: true,
        reason: 'Known hypersensitivity to clarithromycin or to any macrolide. Refer.',
      });
    }
    if (age < 18 && medicalHistory.cannotBeWeighed) {
      referrals.push({
        shouldRefer: true,
        reason: 'A child who cannot be weighed today. Do not estimate from age. Refer.',
      });
    }
    if (medicalHistory.pregnant) {
      if (age < 8) {
        referrals.push({
          shouldRefer: true,
          reason: 'Pregnant and under 8 years: no erythromycin dose is authorised. Do not substitute clarithromycin. Refer.',
        });
      }
    } else {
      // Clarithromycin SPC contraindications, handled as exclusions.
      if (medicalHistory.takesSimvastatinOrLovastatin) {
        referrals.push({
          shouldRefer: true,
          reason: 'Taking simvastatin or lovastatin. Clarithromycin raises their levels and the combination causes myopathy and rhabdomyolysis. Do not supply, and do not advise the patient to stop their statin; that is a prescriber decision. Refer the same day so the impetigo is still treated.',
        });
      }
      if (medicalHistory.takesColchicine) {
        referrals.push({
          shouldRefer: true,
          reason: 'Taking colchicine. Deaths from colchicine toxicity have been reported with clarithromycin. Refer the same day.',
        });
      }
      if (medicalHistory.takesErgotAlkaloid) {
        referrals.push({
          shouldRefer: true,
          reason: 'Taking an ergot alkaloid (ergotamine or dihydroergotamine). Acute ergot toxicity with clarithromycin. Refer the same day.',
        });
      }
      if (medicalHistory.takesTicagrelor) {
        referrals.push({ shouldRefer: true, reason: 'Taking ticagrelor. Clarithromycin contraindicated. Refer the same day.' });
      }
      if (medicalHistory.takesClariSpcContraindicated) {
        referrals.push({
          shouldRefer: true,
          reason: 'Taking oral midazolam, lomitapide, ivabradine, ranolazine, domperidone or pimozide (clarithromycin SmPC contraindications). Refer the same day.',
        });
      }
      if (medicalHistory.qtProlongationHistory) {
        referrals.push({
          shouldRefer: true,
          reason: 'History of QT prolongation, congenital or acquired, or of ventricular arrhythmia including torsades de pointes. Clarithromycin contraindicated. Refer.',
        });
      }
      if (medicalHistory.qtMedicinesOrElectrolytes) {
        referrals.push({
          shouldRefer: true,
          reason: 'Taking another medicine known to prolong the QT interval, or hypokalaemia or hypomagnesaemia. Clarithromycin contraindicated. Refer.',
        });
      }
      if (medicalHistory.severeHepaticImpairment && medicalHistory.severeRenalImpairment) {
        referrals.push({
          shouldRefer: true,
          reason: 'Severe hepatic failure with renal impairment. Clarithromycin contraindicated. Refer.',
        });
      }
    }
    if (medicalHistory.breastfeeding && !medicalHistory.breastfeedingDiscussed) {
      referrals.push({
        shouldRefer: true,
        reason: 'Breastfeeding: a macrolide may be supplied only where the choice has been discussed and recorded. Record the discussion, or refer.',
      });
    }
  }

  return referrals;
}

/**
 * Determine treatment recommendations based on assessment
 */
export function determineTreatmentRecommendation(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory
): TreatmentRecommendation | null {
  const route = determineRoute(age, lesionAssessment, medicalHistory);

  if (route === 'topical') {
    if (lesionAssessment.hydrogenPeroxide === 'offered-p-sale') {
      return {
        treatment: 'Hydrogen peroxide 1% cream (P sale, NOT a supply under this PGD)',
        dose: 'Apply',
        frequency: 'Two or three times a day',
        duration: '5 days',
        quantity: 1,
        quantityUnit: 'tube, sold as a pharmacy medicine',
        rationale:
          'Localised non-bullous impetigo, not systemically unwell. Hydrogen peroxide 1% cream is the NICE initial option and a pharmacy medicine; record that it was offered. Fusidic acid 2% cream under this PGD is for where hydrogen peroxide is unsuitable or ineffective. Review if no improvement after 48 hours.',
      };
    }
    return {
      treatment: 'Fusidic acid 2% cream',
      dose: 'Apply a thin layer, covering the lesion and about 1cm of surrounding skin',
      frequency: 'Three times a day',
      duration: '5 days',
      quantity: 1,
      quantityUnit: '15g tube',
      rationale:
        'Localised non-bullous impetigo, intact or only minimally broken skin. Hydrogen peroxide 1% cream is the NICE initial option and a P sale: offer it first where appropriate and record that you did. Fusidic acid is for where hydrogen peroxide is unsuitable (for example around the eyes) or ineffective. Do not combine with an oral antibiotic. No repeat supply. Extended to 7 days only on clinical judgement where lesions are severe or numerous, with the reason recorded.',
    };
  }

  if (route === 'flucloxacillin') {
    if (age >= 18) return null;
    const dose =
      age < 2
        ? '62.5mg to 125mg (1.25 mL to 2.5 mL of 250mg/5ml)'
        : age <= 9
          ? '125mg to 250mg (2.5 mL to 5 mL of 250mg/5ml)'
          : '250mg to 500mg (5 mL to 10 mL of 250mg/5ml)';
    return {
      treatment: 'Flucloxacillin 250mg/5ml oral suspension',
      dose,
      frequency: 'Four times a day (four times a day means four times a day; a three-times-daily regimen underdoses the child)',
      duration: '5 days',
      quantity: 1,
      quantityUnit: 'bottle(s) sufficient for a 5 day course at the dose selected',
      rationale:
        'Widespread non-bullous impetigo, bullous impetigo, or failure of topical treatment, in a child aged 3 months to 17 years who is not penicillin-allergic. Oral, on an empty stomach, an hour before food or two hours after. The suspension is unpalatable: where the child will not take it, the macrolide arm is a reasonable alternative on grounds of unsuitability. Do not combine with a topical antibiotic. No repeat supply.',
    };
  }

  if (route === 'macrolide') {
    if (medicalHistory.pregnant) {
      if (age < 8) return null;
      return {
        treatment: 'Erythromycin 250mg tablets or oral suspension (pregnancy)',
        dose: '250mg to 500mg',
        frequency: 'Four times a day',
        duration: '5 days',
        quantity: 20,
        quantityUnit: 'to 40 x 250mg (sufficient for 5 days at the dose selected)',
        rationale:
          'Penicillin-allergic and pregnant. Erythromycin is the macrolide of choice in pregnancy because there is more documented experience of its use. Do not substitute clarithromycin. Record pregnancy status and how it was established.',
      };
    }
    const weight = parseWeight(medicalHistory.weightKg);
    if (age < 12) {
      const band = weight !== null ? clarithromycinWeightBand(weight) : null;
      return {
        treatment: 'Clarithromycin 125mg/5ml or 250mg/5ml oral suspension',
        dose: band
          ? `${band.dose} (weight ${weight} kg, band ${band.label})`
          : 'BY WEIGHT: weigh the child today. Under 8kg 7.5mg/kg; 8 to 11kg 62.5mg; 12 to 19kg 125mg; 20 to 29kg 187.5mg; 30 to 40kg 250mg, each twice a day',
        frequency: 'Twice a day',
        duration: '5 days',
        quantity: 1,
        quantityUnit: 'bottle(s) sufficient for a 5 day course at the dose selected',
        rationale:
          'Penicillin-allergic child aged 1 month to 11 years, or a child who will not take the flucloxacillin suspension. The dose is by weight, not by age: weigh the child today and record the weight and the band. Shake the suspension before use. Check the clarithromycin contraindications first: simvastatin, lovastatin, colchicine, ergot alkaloids, ticagrelor, QT prolongation.',
      };
    }
    return {
      treatment: 'Clarithromycin 250mg tablets',
      dose: '250mg (may be increased to 500mg twice a day for severe infection, with the reason recorded)',
      frequency: 'Twice a day',
      duration: '5 days',
      quantity: 10,
      quantityUnit: 'x 250mg tablets (20 if 500mg twice a day)',
      rationale:
        age < 18
          ? 'Penicillin-allergic, or will not take the flucloxacillin suspension, aged 12 to 17. May be taken with or without food. Check the clarithromycin contraindications first: simvastatin, lovastatin, colchicine, ergot alkaloids, ticagrelor, QT prolongation.'
          : 'Penicillin-allergic adult needing an oral antibiotic. A penicillin-tolerant adult is NOT eligible for this arm. May be taken with or without food. Check the clarithromycin contraindications first: simvastatin, lovastatin, colchicine, ergot alkaloids, ticagrelor, QT prolongation.',
    };
  }

  return null;
}

/**
 * Generate clinical alerts based on assessment
 */
export function generateClinicalAlerts(
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory,
  age: number
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const route = determineRoute(age, lesionAssessment, medicalHistory);

  if (lesionAssessment.systemicallyUnwell) {
    alerts.push({
      severity: 'stop',
      code: 'SYSTEMICALLY_UNWELL',
      message: 'Systemically unwell: refer the same day',
      detail: 'Fever, malaise, lymphadenopathy, or the patient appearing unwell. Not for supply under this PGD.',
    });
  }
  if (lesionAssessment.cellulitisSigns) {
    alerts.push({
      severity: 'stop',
      code: 'CELLULITIS',
      message: 'Signs of cellulitis: refer to hospital',
      detail: 'Spreading redness, warmth, swelling or pain beyond the lesions is a more serious condition than impetigo.',
    });
  }

  // Red flag: spreading lesions (not in itself an exclusion; it informs localised versus widespread)
  if (lesionAssessment.spreading) {
    alerts.push({
      severity: 'caution',
      code: 'RAPID_SPREAD',
      message: 'Lesions spreading or new lesions appearing',
      detail: 'Decide whether the impetigo is still localised (fewer than about 5 lesions, under about 5cm) or has become widespread, which needs the oral route. Spreading redness, warmth or pain beyond the lesions is cellulitis: refer.',
    });
  }

  if (lesionAssessment.nearEyes) {
    alerts.push({
      severity: 'stop',
      code: 'OCULAR_RISK',
      message: 'Around the eye or involving the eyelid margin',
      detail: 'A topical product cannot be used safely and an ophthalmic opinion may be needed. Refer.',
    });
  }

  if (lesionAssessment.diagnosticUncertainty) {
    alerts.push({
      severity: 'stop',
      code: 'DIAGNOSTIC_UNCERTAINTY',
      message: 'Diagnostic uncertainty: refer',
      detail: 'A presentation that could be herpes simplex, eczema herpeticum or a fungal infection is not for treatment under this PGD.',
    });
  }

  if (lesionAssessment.lesionType === 'bullous') {
    alerts.push({
      severity: age <= 1 ? 'stop' : 'caution',
      code: 'BULLOUS_IMPETIGO',
      message: age <= 1 ? 'Bullous impetigo in a baby: refer or seek specialist advice' : 'Bullous impetigo: oral route',
      detail:
        age <= 1
          ? 'NICE advises referral or specialist advice for bullous impetigo in babies.'
          : 'Bullous impetigo needs an oral antibiotic, not a topical: flucloxacillin suspension for a child aged 3 months to 17 who is not penicillin-allergic, otherwise the macrolide arm. A penicillin-tolerant adult is referred: this PGD has no adult flucloxacillin.',
    });
  }

  if (route === 'topical' && lesionAssessment.brokenSkin) {
    alerts.push({
      severity: 'caution',
      code: 'BROKEN_SKIN',
      message: 'Extensively broken, deeply eroded or ulcerated skin: not suitable for a topical',
      detail: 'Topical fusidic acid penetrates a superficial infection adequately; extensively broken skin needs either an oral arm or assessment.',
    });
  }

  if (route === 'flucloxacillin' && age >= 18) {
    alerts.push({
      severity: 'stop',
      code: 'NO_ADULT_FLUCLOXACILLIN',
      message: 'Adult needing an oral antibiotic, not penicillin-allergic: refer',
      detail: 'This PGD carries no adult oral flucloxacillin. The absence of an arm is not "flucloxacillin unsuitable", so the macrolide arm does not apply either. Refer.',
    });
  }

  if (route === 'macrolide' && medicalHistory.pregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY_ERYTHROMYCIN',
      message: 'Pregnant: erythromycin, not clarithromycin',
      detail: 'Erythromycin is the macrolide of choice in pregnancy. Do not substitute clarithromycin. Record pregnancy status and how it was established.',
    });
  }

  if (route === 'macrolide' && age < 18 && !medicalHistory.cannotBeWeighed && !parseWeight(medicalHistory.weightKg)) {
    alerts.push({
      severity: 'caution',
      code: 'WEIGH_THE_CHILD',
      message: 'Weigh the child today',
      detail: 'The paediatric macrolide dose is by weight and not by age. Record the weight in kilograms and the band it placed the child in.',
    });
  }

  if (route === 'macrolide' && medicalHistory.takesOtherStatinOrWarfarin) {
    alerts.push({
      severity: 'caution',
      code: 'CLARI_STATIN_WARFARIN',
      message: 'Statin (other than simvastatin or lovastatin) or warfarin: check the BNF',
      detail: 'Dose adjustment or monitoring may be needed and referral may be the safer course.',
    });
  }

  // Caution: Eczema
  if (medicalHistory.eczema) {
    alerts.push({
      severity: 'caution',
      code: 'ECZEMA_PRESENT',
      message: 'Patient has eczema',
      detail: 'Impetigo commonly complicates eczema. Consider whether the presentation could be eczema herpeticum, which is an exclusion.',
    });
  }

  if (medicalHistory.recurrentImpetigo) {
    alerts.push({
      severity: 'stop',
      code: 'RECURRENT_IMPETIGO',
      message: 'Recurrent impetigo: refer',
      detail: 'Frequent repeated episodes need swabbing and consideration of decolonisation, rather than treating again.',
    });
  }

  if (medicalHistory.antibioticAlreadyThisEpisode) {
    alerts.push({
      severity: 'stop',
      code: 'ONE_COURSE_PER_EPISODE',
      message: 'A course already supplied for this episode: refer',
      detail: 'One course per episode. Treatment failure needs reassessment and a swab, not a second guess.',
    });
  }

  if (medicalHistory.recentAntibioticUse && medicalHistory.recentAntibioticDetails) {
    alerts.push({
      severity: 'caution',
      code: 'RECENT_ANTIBIOTICS',
      message: `Recent antibiotic use (${medicalHistory.recentAntibioticDetails})`,
      detail: 'Previous antibiotic use may have led to resistant bacteria. If this was a course for the same episode, it is an exclusion.',
    });
  }

  if (medicalHistory.diabetes) {
    alerts.push({
      severity: 'caution',
      code: 'DIABETES_PRESENT',
      message: 'Patient has diabetes',
      detail: 'Healing may be slower. Monitor treatment response closely and consider earlier review.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'stop',
      code: 'IMMUNOSUPPRESSED',
      message: 'Immunocompromised: refer',
      detail: 'NICE advises hospital referral where impetigo is widespread in an immunocompromised patient. This tool refers in all cases.',
    });
  }

  if (medicalHistory.mrsaSuspected) {
    alerts.push({
      severity: 'stop',
      code: 'MRSA_SUSPECTED',
      message: 'MRSA suspected or confirmed',
      detail: 'Consult a local microbiologist. Not for supply under this PGD.',
    });
  }

  return alerts;
}

/**
 * Comprehensive clinical assessment
 */
export function assessPatient(
  age: number,
  lesionAssessment: ImpetigoLesionAssessment,
  medicalHistory: ImpetigoMedicalHistory,
  ageMonths: number | null = null,
): ClinicalAssessment {
  const route = determineRoute(age, lesionAssessment, medicalHistory);
  const referrals = evaluateReferralCriteria(age, lesionAssessment, medicalHistory, ageMonths);
  const alerts = generateClinicalAlerts(lesionAssessment, medicalHistory, age);
  const treatmentRecommendation =
    referrals.length === 0 ? determineTreatmentRecommendation(age, lesionAssessment, medicalHistory) : null;

  const cautions: string[] = [];
  if (medicalHistory.eczema) {
    cautions.push('Eczema: impetigo commonly complicates it; exclude eczema herpeticum');
  }
  if (medicalHistory.recentAntibioticUse) {
    cautions.push('Recent antibiotic use: resistance consideration');
  }
  if (medicalHistory.diabetes) {
    cautions.push('Diabetes: slower healing may occur');
  }
  if (medicalHistory.takesOtherStatinOrWarfarin) {
    cautions.push('Other statin or warfarin: check the BNF before a macrolide');
  }

  return {
    route,
    referrals,
    alerts,
    treatmentRecommendation,
    cautions,
  };
}

/**
 * Validate that treatment matches clinical recommendations
 */
export function validateTreatmentSelection(
  treatment: ImpetigoTreatmentSelection,
  recommendation: TreatmentRecommendation | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!treatment.treatment) {
    errors.push('Treatment selection required');
  }

  if (!treatment.dose) {
    errors.push('Dose required');
  }

  if (!treatment.frequency) {
    errors.push('Frequency required');
  }

  if (!treatment.duration) {
    errors.push('Duration required');
  }

  if (treatment.duration === '7 days' && !treatment.extensionReason.trim()) {
    errors.push('A 7 day course needs the reason recorded');
  }

  if (treatment.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
