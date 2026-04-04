export interface ImpetigoLesionAssessment {
  lesionType: 'non-bullous' | 'bullous' | '';
  extent: 'localised' | 'widespread' | '';
  affectedAreas: string[];
  nearEyes: boolean;
  numberOfLesions: '1-2' | '3-5' | '>5' | '';
  crusting: boolean;
  spreading: boolean;
  duration: '<48hrs' | '2-7 days' | '>7 days' | '';
  additionalNotes: string;
}

export interface ImpetigoMedicalHistory {
  immunosuppressed: boolean;
  diabetes: boolean;
  eczema: boolean;
  recurrentImpetigo: boolean;
  mrsaSuspected: boolean;
  penicillinAllergy: boolean;
  recentAntibioticUse: boolean;
  recentAntibioticDetails: string;
  currentMedications: string;
  allergies: string;
}

export interface ImpetigoTreatmentSelection {
  treatment: 'fusidic-acid' | 'hydrogen-peroxide' | 'flucloxacillin' | 'clarithromycin' | '';
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  pharmacistOverride: boolean;
  overrideReason: string;
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
}

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

export interface ImpetigoData {
  patientDetails: BasePatientDetails;
  consent: BaseConsent;
  lesionAssessment: ImpetigoLesionAssessment;
  medicalHistory: ImpetigoMedicalHistory;
  treatmentSelection: ImpetigoTreatmentSelection;
  counselling: ImpetigoCounselling;
  summary: BaseSummary;
}
