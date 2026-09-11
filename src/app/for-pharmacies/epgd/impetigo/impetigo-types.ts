/**
 * Impetigo ePGD types, aligned to the Impetigo PGD version 008, issued
 * 11 September 2026. Three arms: fusidic acid 2% cream (localised
 * non-bullous), flucloxacillin 250mg/5ml oral suspension (children 3 months
 * to 17 years, not penicillin-allergic), and a macrolide (clarithromycin, or
 * erythromycin in pregnancy) where penicillin-allergic or the child will not
 * take the flucloxacillin suspension. Hydrogen peroxide 1% is a P sale, not
 * a PGD arm. Courses are 5 days, extended to 7 only with the reason recorded.
 */

export const IMPETIGO_PGD_VERSION = 'Impetigo PGD, version 008, issued 11 September 2026';

export interface ImpetigoLesionAssessment {
  lesionType: 'non-bullous' | 'bullous' | '';
  extent: 'localised' | 'widespread' | '';
  affectedAreas: string[];
  nearEyes: boolean;
  numberOfLesions: '1-2' | '3-5' | '>5' | '';
  lesionSizeCm: string; // size of the affected area, recorded with the number of lesions
  crusting: boolean;
  spreading: boolean;
  duration: '<48hrs' | '2-7 days' | '>7 days' | '';
  brokenSkin: boolean; // extensively broken, deeply eroded or ulcerated: not suitable for a topical
  topicalFailed: boolean; // failure of topical therapy after 48 hours: oral route
  systemicallyUnwell: boolean; // fever, malaise, lymphadenopathy, appearing unwell: refer same day
  cellulitisSigns: boolean; // spreading redness, warmth, swelling or pain beyond the lesions: refer to hospital
  diagnosticUncertainty: boolean; // could be herpes simplex, eczema herpeticum or fungal
  hydrogenPeroxide: '' | 'offered-p-sale' | 'unsuitable' | 'ineffective'; // topical arm: hydrogen peroxide 1% offered first as a P sale, and recorded
  additionalNotes: string;
}

export interface ImpetigoMedicalHistory {
  immunosuppressed: boolean;
  diabetes: boolean;
  eczema: boolean;
  recurrentImpetigo: boolean;
  mrsaSuspected: boolean;
  penicillinAllergy: boolean;
  penicillinAllergyHistory: string; // in the patient's own terms
  cephalosporinAllergyHighRisk: boolean; // cephalosporin allergy with high risk of cross-reactivity
  flucloxCholestasisHistory: boolean; // previous cholestasis or jaundice with flucloxacillin
  fusidicAcidAllergy: boolean;
  fusidicAcidResistanceSuspected: boolean; // topical arm exclusion: resistance suspected or confirmed (mupirocin not authorised)
  macrolideAllergy: boolean;
  severeHepaticImpairment: boolean;
  severeRenalImpairment: boolean; // eGFR below 30 mL/min/1.73m2
  antibioticAlreadyThisEpisode: boolean; // a course already supplied for this episode under this PGD
  flucloxSuspensionRefused: boolean; // child will not take the flucloxacillin suspension: macrolide arm on grounds of unsuitability
  pregnant: boolean;
  pregnancyEstablishedHow: string;
  breastfeeding: boolean;
  breastfeedingDiscussed: boolean; // macrolide in breastfeeding: choice discussed and recorded
  weightKg: string; // child: weighed today, in kilograms
  cannotBeWeighed: boolean;
  takesSimvastatinOrLovastatin: boolean;
  takesColchicine: boolean;
  takesErgotAlkaloid: boolean;
  takesTicagrelor: boolean;
  takesClariSpcContraindicated: boolean; // oral midazolam, lomitapide, ivabradine, ranolazine, domperidone, pimozide
  qtProlongationHistory: boolean; // congenital or acquired, or ventricular arrhythmia including torsades
  qtMedicinesOrElectrolytes: boolean; // other QT-prolonging medicine, hypokalaemia or hypomagnesaemia
  takesOtherStatinOrWarfarin: boolean; // caution: check the BNF
  recentAntibioticUse: boolean;
  recentAntibioticDetails: string;
  currentMedications: string;
  allergies: string;
}

export type ImpetigoTreatment = 'fusidic-acid' | 'hydrogen-peroxide' | 'flucloxacillin' | 'clarithromycin' | 'erythromycin' | '';
export type ImpetigoFormulation = '' | 'cream' | 'suspension' | 'tablets';

/**
 * Nothing here is typed by the pharmacist except the two reason boxes. The
 * dose is chosen from the document's regimens for the arm, age and weight
 * band; frequency and quantity are derived from that choice. A PGD
 * authorises no deviation, so the earlier "override" mechanism is gone.
 */
export interface ImpetigoTreatmentSelection {
  treatment: ImpetigoTreatment;
  formulation: ImpetigoFormulation;
  /** The selected dose option (see getDoseOptions); "" until chosen. */
  doseValue: string;
  /** Derived label of the selected dose, for the record. */
  dose: string;
  /** Derived: the document's fixed frequency for the arm. */
  frequency: string;
  duration: '5 days' | '7 days' | '';
  extensionReason: string; // required where the course is extended to 7 days
  severeDoseReason: string; // clarithromycin 500mg twice daily: reason required
  /** Derived from dose, formulation and duration. */
  quantity: number;
  quantityUnit: string;
}

export interface ImpetigoCounselling {
  hygieneAdvice: boolean;
  handwashing: boolean;
  schoolExclusion: boolean;
  avoidTouching: boolean;
  completeCourse: boolean;
  applicationAdvice: boolean;
  returnIfWorsening: boolean;
  contagionPeriod: boolean;
  noCombination: boolean; // told that topical and oral treatment are not combined
  drugSpecificAdvice: boolean; // arm-specific advice from the document's counselling row
}

export interface ImpetigoConsentDetails {
  basis: '' | 'patient' | 'parental-responsibility' | 'gillick-competent';
  personName: string; // person with parental responsibility
  relationship: string;
  gillickBasis: string; // basis of the Gillick assessment
}

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

export interface ImpetigoSummary extends BaseSummary {
  /** Records requirement: advice given if excluded or declining, and where the patient was referred. */
  referralAdvice: string;
  /** Records requirement: adverse drug reactions and actions taken. */
  adverseDrugReactions: string;
}

export interface ImpetigoData {
  patientDetails: BasePatientDetails;
  consent: BaseConsent;
  consentDetails: ImpetigoConsentDetails;
  lesionAssessment: ImpetigoLesionAssessment;
  medicalHistory: ImpetigoMedicalHistory;
  treatmentSelection: ImpetigoTreatmentSelection;
  counselling: ImpetigoCounselling;
  summary: ImpetigoSummary;
}
