import type { GonorrhoeaConsultationState } from "./gonorrhoea-types";
import type { ClinicalAlert } from "../../shared/types";

// Gonorrhoea Treatment PGD v004 (11 September 2026): ceftriaxone 1 g IM
// reconstituted with 3.5 mL lidocaine 1%. Adults 18 and over.
export function getAllAlerts(state: GonorrhoeaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;

  if (!a.neatPositive && !a.epidemiologicalLink) {
    alerts.push({
      severity: "stop",
      code: "GONNO_NO_DIAGNOSIS",
      message: "Diagnosis not established",
      detail: "Positive NAAT for N. gonorrhoeae, or strong clinical suspicion with a clear epidemiological link, is required before treatment.",
    });
  }

  if (a.pharyngealGonorrhoea || a.infectionSite === "pharyngeal") {
    // The PGD's indication and inclusion cover uncomplicated pharyngeal
    // infection: this is a caution, not a block.
    alerts.push({
      severity: "caution",
      code: "GONNO_PHARYNGEAL",
      message: "Pharyngeal gonorrhoea",
      detail: "Covered by this PGD (uncomplicated pharyngeal infection). Pharyngeal infection is harder to eradicate: the test of cure at 2 weeks is essential.",
    });
  }

  if (a.cephalosporinAllergy) {
    alerts.push({
      severity: "stop",
      code: "GONNO_ALLERGY",
      message: "Known anaphylaxis or severe hypersensitivity to cephalosporins",
      detail: "Cannot use ceftriaxone; refer to sexual health clinic for alternative",
    });
  }

  if (a.severePenicillinAllergy) {
    alerts.push({
      severity: "stop",
      code: "GONNO_PENICILLIN_ANAPHYLAXIS",
      message: "Severe penicillin allergy (anaphylaxis)",
      detail: "Excluded (cross-reactivity about 1 to 2 percent). Refer to sexual health clinic.",
    });
  } else if (a.mildPenicillinAllergy) {
    alerts.push({
      severity: "caution",
      code: "GONNO_PENICILLIN_MILD",
      message: "Mild or moderate penicillin allergy",
      detail: "Risk of cross-reactivity is low (about 1 to 2 percent); clinical assessment required.",
    });
  }

  if (a.lidocaineContraindication) {
    alerts.push({
      severity: "stop",
      code: "GONNO_LIDOCAINE",
      message: "Lidocaine hypersensitivity or SmPC contraindication",
      detail: "Known hypersensitivity to lidocaine or any other amide local anaesthetic, or any other contraindication to lidocaine in its SmPC (including severe heart block without a pacemaker, hypovolaemia and porphyria). Cannot give the lidocaine-reconstituted injection; refer.",
    });
  }

  if (a.complicatedInfection) {
    alerts.push({
      severity: "stop",
      code: "GONNO_COMPLICATED",
      message: "Complicated gonococcal infection",
      detail: "Disseminated infection (DGI), meningitis or endocarditis requires hospital treatment. Refer urgently.",
    });
  }

  if (a.renalImpairmentEgfrUnder30) {
    alerts.push({
      severity: "caution",
      code: "GONNO_RENAL",
      message: "Renal impairment with eGFR 30 or below",
      detail: "Standard dose suitable for eGFR over 30; no adjustment for mild to moderate impairment. Seek advice for severe impairment.",
    });
  }

  if (a.severeHepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "GONNO_HEPATIC",
      message: "Hepatic impairment",
      detail: "Standard dose acceptable; monitor in severe impairment.",
    });
  }

  if (a.anticoagulantTherapy) {
    alerts.push({
      severity: "caution",
      code: "GONNO_ANTICOAGULANT",
      message: "Anticoagulant therapy",
      detail: "Cephalosporins may potentiate warfarin effect; monitor INR.",
    });
  }

  if (a.probenecid) {
    alerts.push({
      severity: "caution",
      code: "GONNO_PROBENECID",
      message: "Probenecid",
      detail: "May increase ceftriaxone levels; avoid concurrent use.",
    });
  }

  if (a.pregnancyStatus === "pregnant") {
    alerts.push({
      severity: "caution",
      code: "GONNO_PREGNANCY",
      message: "Pregnancy",
      detail: "Ceftriaxone is safe in pregnancy; complicated cases should be referred to obstetrics.",
    });
  }

  if (!a.ableToAttendTestOfCure) {
    alerts.push({
      severity: "caution",
      code: "GONNO_TOC",
      message: "Test of cure attendance not confirmed",
      detail: "Inclusion criterion: able to attend test of cure appointment at 2 weeks.",
    });
  }

  if (!a.partnerNotificationPlanned) {
    alerts.push({
      severity: "caution",
      code: "GONNO_PARTNER",
      message: "Partner notification not planned",
      detail: "Essential to contact and treat sexual partner(s) within last 2 weeks",
    });
  }

  return alerts;
}

export function hasHardStops(state: GonorrhoeaConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// Safety block from the PGD cautions: adrenaline, protocol, 15 minute seated
// observation recorded, never intravenous.
export function validateAdministration(state: GonorrhoeaConsultationState): string | null {
  const ad = state.administration;
  if (!ad.adrenalineAvailable) return "Adrenaline 1 in 1,000 must be immediately available in the room, in date, with a telephone";
  if (!ad.anaphylaxisProtocolAvailable) return "A written anaphylaxis protocol must be available and the administrator trained in anaphylaxis and basic life support";
  const today = new Date().toISOString().split("T")[0];
  if (!ad.ceftriaxoneBatch.trim()) return "Ceftriaxone batch number is required";
  if (!ad.ceftriaxoneExpiry) return "Ceftriaxone expiry date is required";
  if (ad.ceftriaxoneExpiry < today) return "Ceftriaxone expiry date is in the past: do not use this vial";
  if (!ad.lidocaineBatch.trim()) return "Lidocaine 1% batch number is required";
  if (!ad.lidocaineExpiry) return "Lidocaine 1% expiry date is required";
  if (ad.lidocaineExpiry < today) return "Lidocaine 1% expiry date is in the past: do not use this ampoule";
  if (!ad.injectionSite) return "Injection site (gluteal muscle) is required";
  if (!ad.notGivenIntravenously) return "Confirm the lidocaine-reconstituted solution was given intramuscularly and not intravenously";
  if (!ad.observationCompleted) return "Record that the 15 minute seated observation period was completed";
  return null;
}
