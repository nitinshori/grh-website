import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

/** A question put to the patient: '' until asked, then the answer. */
export type YesNoAnswer = '' | 'yes' | 'no';

export interface DengueScreening {
  destinationCountry: string;
  endemicArea: boolean; // PGD v006 inclusion: travel to or residence in a dengue-endemic area
  /** The answer as given (Yes / No / not yet answered). endemicArea is
   *  derived from it. A "No" is an inclusion criterion not met and stops. */
  endemicAreaAnswer: YesNoAnswer;
  departureDate: string;
  travelDuration: string;
  /** PGD v006 inclusion: willing to receive two doses, 3 months apart. */
  willingTwoDoses: boolean;
  /** The answer as given; willingTwoDoses is derived from it. */
  willingTwoDosesAnswer: YesNoAnswer;
  previousDengueInfection: boolean;
  dengueInfectionDetails: string;
  currentIllness: boolean; // PGD v006 exclusion: acute fever or significant intercurrent illness
  illnessDetails: string;
  immunosuppressed: boolean; // PGD v006 exclusion: any congenital or acquired immune deficiency
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  temperature: number | null;
  /** PGD v006 exclusion: known hypersensitivity to any component of the vaccine. */
  vaccineComponentAllergy: boolean;
  /** PGD v006 exclusion: another live vaccine planned within 4 weeks before or after Qdenga. */
  liveVaccineWithin4Weeks: boolean;
  /** PGD v006 exclusion: history of Guillain-Barre syndrome following prior dengue vaccination. */
  gbsAfterDengueVaccine: boolean;
  /** PGD v006 caution: anticoagulant therapy, assess bleeding risk. */
  anticoagulantTherapy: boolean;
}

export interface DengueContraindications {
  severeAllergy: boolean;
  immunosuppressed: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  acuteFebrileIllness: boolean;
  liveVaccineInterval: boolean;
  gbsHistory: boolean;
  ageAppropriate: boolean;
  /** An inclusion criterion answered No (not travelling to an endemic area, or not willing to have two doses). */
  inclusionNotMet: boolean;
}

export interface DengueVaccineAdministration {
  vaccineName: string;
  /** Adrenaline must be in place BEFORE the vaccine is given, so it is confirmed here, ahead of the administration fields. */
  adrenalineConfirmed: boolean;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  doseNumber: '1st' | '2nd' | '';
  /** Required for a 2nd dose: the schedule is 3 months after the first, and the tool checks the interval. */
  firstDoseDate: string;
  administeredBy: string;
  timeAdministered: string;
  nextDueDate: string;
}

export interface DenguePostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  /** PGD v006: record that the seated observation period was completed. */
  observationCompleted: boolean;
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
}

export interface DengueAdvice {
  twoDozeSchedule: boolean;
  commonReactions: boolean;
  seriousReactions: boolean;
  mosquitoPrevention: boolean;
  dengueSymptomsWarning: boolean;
  noOtherLiveVaccines: boolean;
  returnIfConcerned: boolean;
  /** PGD v006: avoid pregnancy for at least 4 weeks after each dose. */
  avoidPregnancy4Weeks: boolean;
  /** PGD v006: keep a record of vaccination dates and bring documentation when travelling. */
  keepVaccinationRecord: boolean;
}

/** Contraindications and alerts are derived live from the screening answers
 *  in the client (evaluateDengueContraindications), not stored, so a stop
 *  raised by going back and changing an answer is enforced immediately. */
export interface DengueConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  screening: DengueScreening;
  administration: DengueVaccineAdministration;
  postVaccineObs: DenguePostVaccineObs;
  advice: DengueAdvice;
  summary: BaseSummary;
  step: number;
}

export const initialDengueScreening = (): DengueScreening => ({
  destinationCountry: '',
  endemicArea: false,
  endemicAreaAnswer: '',
  departureDate: '',
  travelDuration: '',
  willingTwoDoses: false,
  willingTwoDosesAnswer: '',
  previousDengueInfection: false,
  dengueInfectionDetails: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  temperature: null,
  vaccineComponentAllergy: false,
  liveVaccineWithin4Weeks: false,
  gbsAfterDengueVaccine: false,
  anticoagulantTherapy: false,
});

export const initialDengueContraindications = (): DengueContraindications => ({
  severeAllergy: false,
  immunosuppressed: false,
  pregnancy: false,
  breastfeeding: false,
  acuteFebrileIllness: false,
  liveVaccineInterval: false,
  gbsHistory: false,
  ageAppropriate: false,
  inclusionNotMet: false,
});

export const initialDengueVaccineAdministration = (): DengueVaccineAdministration => ({
  vaccineName: 'Qdenga (TAK-003)',
  adrenalineConfirmed: false,
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  doseNumber: '',
  firstDoseDate: '',
  administeredBy: '',
  timeAdministered: '',
  nextDueDate: '',
});

export const initialDenguePostVaccineObs = (): DenguePostVaccineObs => ({
  observationPeriod: '',
  observationCompleted: false,
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
});

export const initialDengueAdvice = (): DengueAdvice => ({
  twoDozeSchedule: false,
  commonReactions: false,
  seriousReactions: false,
  mosquitoPrevention: false,
  dengueSymptomsWarning: false,
  noOtherLiveVaccines: false,
  returnIfConcerned: false,
  avoidPregnancy4Weeks: false,
  keepVaccinationRecord: false,
});
