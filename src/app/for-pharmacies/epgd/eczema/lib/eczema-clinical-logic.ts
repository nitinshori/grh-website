import type { EczemaConsultationState } from "./eczema-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: EczemaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.bacterialInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_BACTERIAL",
      message: "Bacterial infection present",
      detail: "Widespread infected eczema requires antibiotic therapy. Refer to GP for treatment.",
    });
  }

  if (state.contraindications.viralInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_VIRAL",
      message: "Viral infection present (suspected eczema herpeticum)",
      detail: "Refer to GP/urgent care. Antiviral therapy needed.",
    });
  }

  if (state.contraindications.faceOrGroin) {
    alerts.push({
      severity: "stop",
      code: "ECZ_SITE",
      message: "Potent steroid inappropriate for face/groin",
      detail: "Use only mild potency steroids (hydrocortisone 1%) on face/groin due to atrophy risk.",
    });
  }

  if (state.contraindications.childUnder1) {
    alerts.push({
      severity: "stop",
      code: "ECZ_AGE",
      message: "Child under 1 year — moderate+ steroids contraindicated",
      detail: "Only mild steroids (hydrocortisone 1%) safe in infants. Emollients are first-line.",
    });
  }

  // Red flags
  if (state.assessment.severity === "severe") {
    alerts.push({
      severity: "red-flag",
      code: "ECZ_SEVERE",
      message: "Severe eczema flare — consider urgent GP referral",
      detail: "Extensive, cracked, or oozing eczema requires specialist assessment and may need systemic treatment.",
    });
  }

  if (state.contraindications.rosaceaOrAcne) {
    alerts.push({
      severity: "caution",
      code: "ECZ_ROSACEA",
      message: "Rosacea or acne at treatment site",
      detail: "Topical steroids may worsen rosacea. Use with caution; consider alternative.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: EczemaConsultationState): DoseRecommendation | null {
  if (!state.assessment.severity) return null;

  let recommendation: DoseRecommendation | null = null;

  if (state.assessment.severity === "mild") {
    recommendation = {
      // PGD v002 Arm 1. Potency is matched to severity: clobetasone butyrate
      // 0.05% is the first-line potency for MILD disease, betamethasone
      // valerate 0.1% for moderate. This tool previously returned
      // hydrocortisone 1%, which appears nowhere in the document.
      medicine: "Clobetasone butyrate 0.05% cream or ointment (PGD Arm 1)",
      dose: "Apply thinly",
      frequency: "Once or twice daily",
      dosingRegimen: "Fingertip unit per hand-sized area. Apply thinly to affected skin. Use emollient as base first.",
      duration: "Up to 7 days initially, then review",
      reason:
        "Mild eczema. Clobetasone butyrate 0.05% is the first-line potency under this PGD. Maximum 4 weeks of continuous daily treatment, and no more than three courses in any 12 months before GP review.",
    };
  } else if (state.assessment.severity === "moderate") {
    recommendation = {
      // PGD v002 Arm 2 is betamethasone valerate 0.1%, the potent
      // preparation. The tool previously offered 0.025%, which is a different
      // (lower) strength and is not the one the document authorises.
      medicine: "Betamethasone valerate 0.1% cream or ointment (PGD Arm 2)",
      dose: "Apply thinly",
      frequency: "Once or twice daily",
      duration: "Up to 7 days initially, then review",
      dosingRegimen: "Fingertip unit per hand-sized area. Apply thinly. Use emollient as base.",
      reason:
        "Moderate eczema. NOT AUTHORISED on the face, eyelids, flexures or genital skin: use clobetasone on those sites, or refer. Maximum 4 weeks of continuous daily treatment, and no more than three courses in any 12 months before GP review.",
    };

    // Fusidic acid removed 8 Sep 2026. Two problems, either of which was
    // enough on its own:
    //
    // 1. Fusidic acid appears nowhere in the eczema PGD, so the tool was
    //    suggesting an antibacterial the document does not authorise.
    // 2. The condition gated it on hasFungalInfection while the text it added
    //    said "if secondary bacterial infection suspected". Fusidic acid does
    //    not treat fungal infection. The check and the advice were for
    //    different organisms.
    //
    // Infected eczema is now a referral, or a supply under the impetigo or
    // skin infection PGD if the presentation fits one of those.
    if (state.medicineSelection.hasFungalInfection) {
      recommendation.reason +=
        ". SUSPECTED SECONDARY INFECTION: this PGD authorises no antibacterial, so do not add fusidic acid. Where the infection is MILD AND LOCALISED, the patient may have the topical corticosteroid under this PGD AND an oral antibiotic under the Skin and Soft Tissue Infection PGD at the same consultation, both recorded in one consultation record. Where it is not mild and localised, or any red flag from the infection PGD is present, refer and supply neither.";
    }
  }

  return recommendation;
}
