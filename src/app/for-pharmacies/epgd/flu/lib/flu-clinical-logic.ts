import { ClinicalAlert } from '../../shared/types';
import {
  FluScreening,
  FluContraindications,
  FluConsultationState,
} from './flu-types';

export function evaluateFluContraindications(
  screening: FluScreening,
  patientAge: number
): { contraindications: FluContraindications; alerts: ClinicalAlert[] } {
  const alerts: ClinicalAlert[] = [];
  const contraindications: FluContraindications = {
    anaphylaxisToPreviousDose: false,
    severeEggAllergy: false,
    acuteFebrileIllness: false,
    ageAppropriate: patientAge >= 2,
  };

  // Hard stop: Anaphylaxis to previous dose
  if (screening.previousReaction && screening.previousFluVaccine) {
    contraindications.anaphylaxisToPreviousDose = true;
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS_PREVIOUS_DOSE',
      message: 'Anaphylaxis to previous flu vaccine dose',
      detail:
        'Patient has history of anaphylaxis to flu vaccine. Vaccination is contraindicated. Refer to immunologist if further vaccination needed.',
    });
  }

  // Hard stop: Severe egg allergy
  if (screening.eggAllergy && screening.eggAllergySeverity === 'severe') {
    contraindications.severeEggAllergy = true;
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_EGG_ALLERGY',
      message: 'Severe egg allergy',
      detail:
        'Patient has severe egg allergy. Egg-based vaccines are contraindicated. Consider egg-free vaccine (Flucelvax) if clinically appropriate, or refer to specialist centre.',
    });
  }

  // Hard stop: Acute febrile illness
  if (screening.temperature !== null && screening.temperature >= 38) {
    contraindications.acuteFebrileIllness = true;
    alerts.push({
      severity: 'stop',
      code: 'ACUTE_FEBRILE_ILLNESS',
      message: 'Acute febrile illness',
      detail: `Patient temperature is ${screening.temperature}°C. Vaccination should be deferred until patient has recovered from acute illness (at least 24 hours after fever resolves).`,
    });
  }

  // Caution: Mild egg allergy
  if (screening.eggAllergy && screening.eggAllergySeverity === 'mild') {
    alerts.push({
      severity: 'caution',
      code: 'MILD_EGG_ALLERGY',
      message: 'Mild egg allergy noted',
      detail:
        'Patient has mild egg allergy. Can proceed with egg-free vaccine (e.g., Flucelvax Quad, cell-based vaccine). Observe for 30 minutes post-vaccination.',
    });
  }

  // Caution: Previous mild reaction
  if (screening.previousReaction && screening.previousFluVaccine) {
    alerts.push({
      severity: 'caution',
      code: 'PREVIOUS_MILD_REACTION',
      message: 'Previous reaction to flu vaccine',
      detail: `Previous reaction: ${screening.reactionDetails}. Proceed with caution. Extend observation period to 30 minutes.`,
    });
  }

  // Caution: Previous GBS
  if (screening.previousGBS) {
    alerts.push({
      severity: 'caution',
      code: 'PREVIOUS_GBS',
      message: 'Previous Guillain-Barré syndrome',
      detail:
        'Patient has history of GBS. Influenza vaccination presents small risk of recurrence. Weigh risks vs. benefits. Consider referral to specialist or GP for shared decision-making.',
    });
  }

  // Red flag: Immunosuppressed
  if (screening.immunosuppressed) {
    alerts.push({
      severity: 'red-flag',
      code: 'IMMUNOSUPPRESSED',
      message: 'Patient is immunosuppressed',
      detail: `Reason: ${screening.immunosuppressedDetails}. Vaccine response may be reduced. Proceed with vaccination but counsel on potentially reduced efficacy. Monitor for adverse reactions.`,
    });
  }

  // Red flag: Pregnant
  if (screening.pregnant) {
    alerts.push({
      severity: 'red-flag',
      code: 'PREGNANT',
      message: 'Patient is pregnant',
      detail:
        'Inactivated flu vaccine is safe in pregnancy (all trimesters). Live attenuated vaccine is contraindicated. Confirm inactivated vaccine being used.',
    });
  }

  // Red flag: Bleeding disorder
  if (screening.bleedingDisorder) {
    alerts.push({
      severity: 'red-flag',
      code: 'BLEEDING_DISORDER',
      message: 'Patient has bleeding disorder',
      detail:
        'Apply firm pressure for 2-3 minutes post-injection. Consider subcutaneous route instead of intramuscular. Have haemostatic agents available.',
    });
  }

  // Caution: Currently unwell
  if (screening.currentIllness && !screening.currentIllness) {
    alerts.push({
      severity: 'caution',
      code: 'CURRENT_ILLNESS',
      message: 'Patient currently unwell',
      detail: `Illness: ${screening.illnessDetails}. Consider deferring if minor illness with fever. Can proceed with vaccination if non-febrile minor illness.`,
    });
  }

  return { contraindications, alerts };
}

export function hasHardStopContraindications(
  contraindications: FluContraindications
): boolean {
  return (
    contraindications.anaphylaxisToPreviousDose ||
    contraindications.severeEggAllergy ||
    contraindications.acuteFebrileIllness
  );
}

export function getAlertsByStep(
  state: FluConsultationState
): Map<number, ClinicalAlert[]> {
  const alertsByStep = new Map<number, ClinicalAlert[]>();

  state.alerts.forEach((alert: ClinicalAlert) => {
    let step: number | null = null;

    // Route alerts to appropriate steps based on code
    if (alert.code === 'ANAPHYLAXIS_PREVIOUS_DOSE') {
      step = 3; // Contraindications Review
    } else if (alert.code === 'SEVERE_EGG_ALLERGY') {
      step = 3;
    } else if (alert.code === 'ACUTE_FEBRILE_ILLNESS') {
      step = 2; // Pre-vaccination Screening
    } else if (alert.code === 'MILD_EGG_ALLERGY') {
      step = 3;
    } else if (alert.code === 'PREVIOUS_MILD_REACTION') {
      step = 3;
    } else if (alert.code === 'PREVIOUS_GBS') {
      step = 3;
    } else if (alert.code === 'IMMUNOSUPPRESSED') {
      step = 3;
    } else if (alert.code === 'PREGNANT') {
      step = 3;
    } else if (alert.code === 'BLEEDING_DISORDER') {
      step = 4; // Vaccine Administration
    } else if (alert.code === 'CURRENT_ILLNESS') {
      step = 2;
    }

    if (step !== null) {
      if (!alertsByStep.has(step)) {
        alertsByStep.set(step, []);
      }
      alertsByStep.get(step)!.push(alert);
    }
  });

  return alertsByStep;
}

export function getObservationPeriodRecommendation(
  screening: FluScreening
): '15-min' | '30-min' {
  // Extend observation if previous mild reaction or egg allergy
  if (
    (screening.previousReaction && screening.previousFluVaccine) ||
    (screening.eggAllergy && screening.eggAllergySeverity === 'mild')
  ) {
    return '30-min';
  }
  return '15-min';
}
