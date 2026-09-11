"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  SkinInfectionConsultationState,
  SkinInfectionAction,
  SkinInfectionVariant,
} from "./lib/skin-infection-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  PGD_VERSION_LABEL,
  createInitialConsultationState,
} from "./lib/skin-infection-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  getAgeBand,
  AGE_BAND_LABEL,
  isCellulitisPgd,
  isMoreExtensiveInfection,
  extensiveInfectionFindings,
  getFormulationOptions,
  derivedQuantity,
} from "./lib/skin-infection-logic";
import { validateStep } from "./lib/skin-infection-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SkinInfectionSummaryReport } from "./components/SkinInfectionSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(
  state: SkinInfectionConsultationState,
  action: SkinInfectionAction,
): SkinInfectionConsultationState {
  const newState = { ...state };
  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        newState.patient.age = calculateAge(action.value as string);
      }
      break;
    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;
    case "UPDATE_ASSESSMENT":
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
      break;
    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;
    case "UPDATE_ANTIBIOTIC_SELECTION":
      newState.antibioticSelection = {
        ...newState.antibioticSelection,
        [action.field]: action.value,
      };
      break;
    case "UPDATE_COUNSELLING":
      newState.counselling = { ...newState.counselling, [action.field]: action.value };
      break;
    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;
    case "SET_STEP":
      newState.currentStep = action.step;
      break;
    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      break;
    case "PREV_STEP":
      newState.currentStep = Math.max(newState.currentStep - 1, 0);
      break;
    case "RESET":
      return createInitialConsultationState(state.variant);
    default:
      break;
  }
  return newState;
}

export default function SkinInfectionClient({ variant = "skin-infection" }: { variant?: SkinInfectionVariant }) {
  const [state, dispatch] = useReducer(
    reducer,
    variant,
    (v) => createInitialConsultationState(v),
  );
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: __pharmProfile.name } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: __pharmProfile.gphcNumber } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: __pharmProfile.pharmacyName } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: __pharmProfile.pharmacyAddress } as any);
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  const validationError = useMemo(
    () => validateStep(state.currentStep, state),
    [state.currentStep, state],
  );
  // A stop anywhere disables Next on every step; the progress bar only goes
  // backwards, so this is the only forward path. An excluded patient is
  // saved with "Save as not supplied" on the step the stop was raised.
  const canProceed = !validationError && !hasStops;

  // Quantity is the document's figure for the formulation and course length,
  // never typed. Keep the stored value in step with the derived one so the
  // saved record and the printed record carry it.
  const quantity = derivedQuantity(state);
  useEffect(() => {
    if (state.antibioticSelection.quantitySupplied !== quantity) {
      dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "quantitySupplied", value: quantity });
    }
  }, [quantity, state.antibioticSelection.quantitySupplied]);

  // Appendix 2: the extensive-infection flag is derived from the measured
  // findings, so the record holds what was seen rather than a tick.
  const extensive = isMoreExtensiveInfection(state.assessment);
  useEffect(() => {
    if (state.assessment.extensiveInfection !== extensive) {
      dispatch({ type: "UPDATE_ASSESSMENT", field: "extensiveInfection", value: extensive });
    }
  }, [extensive, state.assessment.extensiveInfection]);

  // Penicillin allergy recorded on the history step is the reason for the
  // second-line arms; fill it in rather than ask twice.
  useEffect(() => {
    if (
      state.medicalHistory.penicillinAllergy &&
      state.antibioticSelection.choice &&
      state.antibioticSelection.choice !== "flucloxacillin" &&
      !state.antibioticSelection.flucloxUnsuitableReason
    ) {
      dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "flucloxUnsuitableReason", value: "penicillin-allergy" });
    }
  }, [state.medicalHistory.penicillinAllergy, state.antibioticSelection.choice, state.antibioticSelection.flucloxUnsuitableReason]);

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  const handleNextStep = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };
  const handlePrevStep = () => dispatch({ type: "PREV_STEP" });
  const handleSetStep = (step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: {
        ...state,
        alerts,
        doseRecommendation,
        summary: {
          ...state.summary,
          antibioticSupplied: hasStops
            ? ""
            : [doseRecommendation?.medicine, state.antibioticSelection.brand ? `(${state.antibioticSelection.brand})` : ""]
                .filter(Boolean)
                .join(" "),
          courseLength: hasStops ? "" : state.antibioticSelection.courseDays ? `${state.antibioticSelection.courseDays} days` : "",
        },
      } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && doseRecommendation
          ? {
              name: doseRecommendation.medicine,
              dose: doseRecommendation.dose,
              duration: state.antibioticSelection.courseDays ? `${state.antibioticSelection.courseDays} days` : doseRecommendation.duration,
              quantity: state.antibioticSelection.quantitySupplied,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: [
          hasStops && state.summary.referralAdvice ? `Advice given on referral: ${state.summary.referralAdvice}` : "",
          state.summary.adverseDrugReactions ? `Adverse drug reactions: ${state.summary.adverseDrugReactions}` : "",
          state.summary.clinicalNotes,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, doseRecommendation, __pharmProfile]);

  // Shown at the top of every step: the alerts, and when a stop exists the
  // advice-given box both documents' records rows require for excluded patients.
  const stopPanel = (
    <>
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {hasStops && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
          <p className="text-sm font-medium text-red-800">
            Not supplied under this PGD. Record the advice given and the referral arranged (same-day or emergency as the alert directs), then use "Save as not supplied".
          </p>
          <TextArea
            label="Advice given and referral arranged (PGD records requirement)"
            value={state.summary.referralAdvice}
            onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "referralAdvice", value: v })}
            placeholder="e.g. Explained why no antibiotic could be supplied; same-day GP appointment arranged at 15:30; advised to attend A&E if pain worsens"
            required
          />
        </div>
      )}
    </>
  );

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const mh = state.medicalHistory;
  const a = state.assessment;
  const choice = state.antibioticSelection.choice;
  const cellulitisPgd = isCellulitisPgd(state);
  const age = state.patient.age;
  const band = getAgeBand(age);
  const isCellulitisCase = a.infectionType === "cellulitis" && (cellulitisPgd || (age !== null && age >= 12));

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper
            title="Patient Details"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <p className="text-xs text-gray-600 mb-3">{PGD_VERSION_LABEL[state.variant]}</p>
            {stopPanel}
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={cellulitisPgd}
            />
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper
            title="Consent"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {stopPanel}
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
            {!cellulitisPgd && age !== null && age < 16 && (
              <div className="mt-4 space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-navy-900">Patient under 16: basis of consent</p>
                <SelectInput
                  label="Consent given by"
                  value={state.consent.consentBasis}
                  onChange={(v) => dispatch({ type: "UPDATE_CONSENT", field: "consentBasis", value: v })}
                  options={[
                    { value: "parental-responsibility", label: "A person with parental responsibility" },
                    { value: "gillick-competent", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                <TextArea
                  label="Basis recorded (who consented; for Gillick competence, the assessment made)"
                  value={state.consent.consentBasisNotes}
                  onChange={(v) => dispatch({ type: "UPDATE_CONSENT", field: "consentBasisNotes", value: v })}
                  required
                />
              </div>
            )}
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Infection Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              {stopPanel}
              {cellulitisPgd ? (
                <p className="text-sm text-gray-700">
                  Cellulitis PGD: MILD cellulitis (Eron class I) of a limb or the trunk in adults aged 18 and over. Localised erythema, warmth, swelling and pain, with NO fever, NO tachycardia, NO hypotension, NO confusion and NO rapidly spreading margin. Moderate or severe cellulitis (Eron class II to IV) is not covered.
                </p>
              ) : (
                <SelectInput
                  label="Infection type"
                  value={a.infectionType}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "infectionType", value: v })}
                  options={[
                    { value: "impetigo", label: "Impetigo" },
                    { value: "folliculitis", label: "Folliculitis" },
                    { value: "infected-eczema", label: "Infected eczema (weeping, crusting or worsening inflammation not responding to emollients and topical steroid)" },
                    { value: "infected-wound", label: "Infected wound" },
                    { value: "cellulitis", label: "Cellulitis (12 years and over only)" },
                  ]}
                  required
                />
              )}
              <SelectInput
                label="Severity"
                value={a.severity}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
                options={
                  cellulitisPgd
                    ? [
                        { value: "mild", label: "Mild (Eron class I): localised, no systemic signs" },
                        { value: "severe", label: "Moderate or severe (Eron class II to IV): refer" },
                      ]
                    : [
                        { value: "mild", label: "Mild: localised, patient well" },
                        { value: "moderate", label: "Moderate: larger area or more than one body region (the Appendix 2 'more extensive' definition below), patient well" },
                        { value: "severe", label: "Severe: patient unwell, or beyond the Appendix 2 definition (refer)" },
                      ]
                }
                required
              />
              <TextInput
                label={cellulitisPgd ? "Affected site (limb or trunk) and extent" : "Affected site and extent"}
                value={a.affectedSite}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "affectedSite", value: v })}
                placeholder="e.g. left lower leg, 4 x 3 cm area"
                required
              />
              <TextInput
                label="Duration (days)"
                value={a.durationDays}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "durationDays", value: v })}
                placeholder="e.g. 3"
                required
              />
              {!cellulitisPgd && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-navy-900">Extent (Appendix 2): measure and record the findings</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <TextInput
                      label="Largest diameter of erythema (cm)"
                      value={a.erythemaDiameterCm}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "erythemaDiameterCm", value: v })}
                      type="number"
                      placeholder="e.g. 6"
                      required
                    />
                    <TextInput
                      label="Number of body regions involved (a region is one limb, the trunk, or the head and neck: 1 if the infection is in a single area)"
                      value={a.bodyRegionCount}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bodyRegionCount", value: v })}
                      type="number"
                      placeholder="e.g. 1"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {extensive
                      ? `MORE EXTENSIVE INFECTION (Appendix 2): ${extensiveInfectionFindings(a).join("; ")}. The higher clarithromycin (500 mg twice daily) or doxycycline (200 mg daily) dose applies.`
                      : "Not more extensive: erythema of about 10 cm or less in one body region. Standard doses apply."}
                  </p>
                  <Checkbox
                    label="The infection is beyond the Appendix 2 definition (outside the mild to moderate scope of this PGD): refer"
                    description="Appendix 2 covers erythema larger than about 10 cm, more than one body region, or cellulitis. Anything beyond that is not a pharmacy supply."
                    checked={a.beyondMildModerateScope}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "beyondMildModerateScope", value: v })}
                  />
                </div>
              )}
              {!cellulitisPgd && age !== null && age < 12 && (
                <TextInput
                  label="Current weight (kg)"
                  value={a.weightKg}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "weightKg", value: v })}
                  placeholder="e.g. 18"
                  type="number"
                  required
                />
              )}

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-navy-900">
                  Observations before supply
                  {!cellulitisPgd && band ? ` (age band ${AGE_BAND_LABEL[band]})` : ""}
                </p>
                <p className="text-xs text-gray-600">
                  {cellulitisPgd
                    ? "Refer (999 or A&E) if temperature 38C or above or below 36C, heart rate above 90, respiratory rate 20 or above, systolic below 100, new confusion, or rigors."
                    : band === "2-4"
                      ? "Refer if respiratory rate 40 or above, pulse above 140, temperature 38C or above, oxygen saturation below 94% on air at rest, capillary refill more than 2 seconds, or any new drowsiness, floppiness or not responding normally. DO NOT apply an adult blood pressure threshold in this band."
                      : band === "5-11"
                        ? "Refer if respiratory rate 25 or above, pulse above 120, temperature 38C or above, oxygen saturation below 94% on air at rest, capillary refill more than 2 seconds, or any new confusion or drowsiness. Blood pressure is not required unless a paediatric cuff and reference range are available."
                        : "Refer if respiratory rate 22 or above, pulse above 90 at rest, temperature 38C or above, systolic below 100, oxygen saturation below 94% on air at rest, or any new confusion or drowsiness."}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <TextInput
                    label="Temperature (C)"
                    value={a.temperature}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "temperature", value: v })}
                    type="number"
                    placeholder="e.g. 36.8"
                    required
                  />
                  <TextInput
                    label="Pulse (per minute)"
                    value={a.pulse}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "pulse", value: v })}
                    type="number"
                    placeholder="e.g. 80"
                    required
                  />
                  <TextInput
                    label="Respiratory rate (per minute)"
                    value={a.respiratoryRate}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "respiratoryRate", value: v })}
                    type="number"
                    placeholder="e.g. 16"
                    required
                  />
                  {(cellulitisPgd || band === "12+") && (
                    <TextInput
                      label="Systolic blood pressure (mmHg)"
                      value={a.systolicBP}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "systolicBP", value: v })}
                      type="number"
                      placeholder="e.g. 120"
                      required
                    />
                  )}
                  {!cellulitisPgd && (
                    <TextInput
                      label="Oxygen saturation on air at rest (%)"
                      value={a.oxygenSaturation}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "oxygenSaturation", value: v })}
                      type="number"
                      placeholder="e.g. 98"
                      required
                    />
                  )}
                </div>
                {!cellulitisPgd && (band === "2-4" || band === "5-11") && (
                  <Checkbox
                    label="Capillary refill more than 2 seconds"
                    checked={a.capillaryRefillOver2s}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "capillaryRefillOver2s", value: v })}
                  />
                )}
                <Checkbox
                  label={
                    band === "2-4" && !cellulitisPgd
                      ? "New drowsiness, floppiness, or a child who will not be roused or does not respond normally to social cues"
                      : "New confusion or drowsiness"
                  }
                  checked={a.alteredConsciousness}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "alteredConsciousness", value: v })}
                />
                {cellulitisPgd && (
                  <Checkbox
                    label="Rigors"
                    checked={a.rigors}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "rigors", value: v })}
                  />
                )}
              </div>

              <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-navy-900">Red flags and exclusions</p>
                <Checkbox
                  label="Any feature suggesting necrotising fasciitis: pain out of proportion to appearance, crepitus, skin necrosis, bullae, or dusky discolouration (EMERGENCY: 999)"
                  checked={a.necrotisingFeatures}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "necrotisingFeatures", value: v })}
                />
                <Checkbox
                  label="Rapidly advancing erythema, over hours rather than days (EMERGENCY: 999)"
                  checked={a.spreadingRapidly}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "spreadingRapidly", value: v })}
                />
                <Checkbox
                  label="Systemic symptoms (fever, rigors, malaise, feels unwell) or any sign of sepsis"
                  checked={a.systemicSymptoms}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "systemicSymptoms", value: v })}
                />
                <Checkbox
                  label="Abscess requiring drainage, or infected wound needing surgical review"
                  checked={a.abscessSuspected}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "abscessSuspected", value: v })}
                />
                <Checkbox
                  label={
                    cellulitisPgd
                      ? "Periorbital, orbital or facial cellulitis, or cellulitis that is not of a limb or the trunk"
                      : "Facial or periorbital cellulitis, or cellulitis of the hand"
                  }
                  checked={a.facialOrExcludedSite}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "facialOrExcludedSite", value: v })}
                />
                <Checkbox
                  label={
                    cellulitisPgd
                      ? "Following an animal or human bite, or with fresh water or sea water exposure"
                      : "Animal or human bite (needs co-amoxiclav; use the Minor Wound Care PGD route or refer)"
                  }
                  checked={a.biteOrWaterExposure}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "biteOrWaterExposure", value: v })}
                />
                {!cellulitisPgd && (
                  <>
                    <Checkbox
                      label="Suspected osteomyelitis or septic arthritis, or infection over a joint or tendon"
                      checked={a.jointOrBoneInvolvement}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "jointOrBoneInvolvement", value: v })}
                    />
                    <Checkbox
                      label="Untreated fungal infection, or a rash that may be tinea rather than bacterial infection"
                      checked={a.possibleTinea}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "possibleTinea", value: v })}
                    />
                    <Checkbox
                      label="Suspected viral infection, including eczema herpeticum (rapidly worsening, painful, punched-out or clustered vesicular lesions)"
                      checked={a.possibleViral}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "possibleViral", value: v })}
                    />
                  </>
                )}
                <Checkbox
                  label={
                    cellulitisPgd
                      ? "Cellulitis of a diabetic foot, or in a limb with lymphoedema or chronic venous ulceration"
                      : "Diabetic foot infection"
                  }
                  checked={a.diabeticFootOrLymphoedema}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "diabeticFootOrLymphoedema", value: v })}
                />
                {cellulitisPgd ? (
                  <>
                    <Checkbox
                      label="Suspected deep vein thrombosis, or redness of both legs"
                      checked={a.suspectedDvtOrBilateral}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "suspectedDvtOrBilateral", value: v })}
                    />
                    <Checkbox
                      label="Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months"
                      checked={a.antibioticFailureOrRecurrence}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "antibioticFailureOrRecurrence", value: v })}
                    />
                  </>
                ) : (
                  <Checkbox
                    label="An antibiotic has already been taken for this episode"
                    checked={a.antibioticAlreadyTaken}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "antibioticAlreadyTaken", value: v })}
                  />
                )}
              </div>

              {isCellulitisCase && (
                <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-navy-900">Cellulitis: marking and review</p>
                  <Checkbox
                    label={
                      cellulitisPgd
                        ? "The margin of the erythema has been marked, so that spread can be judged at review"
                        : "The edge of the erythema has been marked with a skin-safe pen before the patient leaves"
                    }
                    checked={a.marginsMarked}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "marginsMarked", value: v })}
                    required
                  />
                  {cellulitisPgd && (
                    <TextInput
                      label="Time the margin was marked"
                      value={a.marginMarkedTime}
                      onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "marginMarkedTime", value: v })}
                      type="time"
                      required
                    />
                  )}
                  <TextInput
                    label={
                      cellulitisPgd
                        ? "48-hour reassessment at this pharmacy, in person: booked date and time (between 36 and 60 hours from now)"
                        : "In-person 48-hour review at this pharmacy: booked date and time (between 36 and 60 hours from now)"
                    }
                    value={a.reviewDateTime}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "reviewDateTime", value: v })}
                    type="datetime-local"
                    required
                  />
                </div>
              )}
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              {stopPanel}
              <TextInput
                label="Allergies"
                value={mh.allergies}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "allergies", value: v })}
                placeholder="Record all drug allergies, or NKDA"
                required
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Checkbox
                  label="Penicillin / beta-lactam allergy"
                  checked={mh.penicillinAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "penicillinAllergy", value: v })}
                />
                <Checkbox
                  label="Macrolide allergy"
                  checked={mh.macrolideAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "macrolideAllergy", value: v })}
                />
                <Checkbox
                  label="Tetracycline allergy"
                  checked={mh.tetracyclineAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "tetracyclineAllergy", value: v })}
                />
                <Checkbox
                  label="Pregnant"
                  checked={mh.pregnant}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnant", value: v })}
                />
                <Checkbox
                  label="Breastfeeding"
                  checked={mh.breastfeeding}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })}
                />
                <Checkbox
                  label={
                    cellulitisPgd
                      ? "Immunosuppression, including chemotherapy, biologics, long-term oral steroids, or poorly controlled diabetes"
                      : "Immunosuppression of any kind"
                  }
                  checked={mh.immunosuppressed}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunosuppressed", value: v })}
                />
                <Checkbox
                  label={
                    cellulitisPgd
                      ? "Hepatic dysfunction, or history of flucloxacillin-associated jaundice"
                      : "History of flucloxacillin-associated jaundice or hepatic dysfunction"
                  }
                  checked={mh.flucloxHepaticHistory}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "flucloxHepaticHistory", value: v })}
                />
                <Checkbox
                  label="Severe hepatic impairment"
                  checked={mh.severeHepaticImpairment}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticImpairment", value: v })}
                />
                <Checkbox
                  label="Severe renal failure (creatinine clearance below 10 mL/min)"
                  checked={mh.severeRenalImpairment}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeRenalImpairment", value: v })}
                />
                <Checkbox
                  label="Known electrolyte disturbance (hypokalaemia or hypomagnesaemia)"
                  checked={mh.electrolyteDisturbance}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "electrolyteDisturbance", value: v })}
                />
                <Checkbox
                  label="Known QT prolongation, or taking QT-prolonging medicines"
                  checked={mh.qtProlongation}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "qtProlongation", value: v })}
                />
                <Checkbox
                  label="Myasthenia gravis, systemic lupus erythematosus, or porphyria"
                  description={cellulitisPgd ? "Doxycycline caution under the Cellulitis PGD" : "Doxycycline exclusion"}
                  checked={mh.myastheniaSleOrPorphyria}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "myastheniaSleOrPorphyria", value: v })}
                />
                <Checkbox
                  label="Recent antibiotics or hospitalisation"
                  checked={mh.recentAntibioticsOrHospital}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentAntibioticsOrHospital", value: v })}
                />
              </div>
              <SelectInput
                label="Renal function (ask before supply; required for the clarithromycin arm)"
                value={mh.renalFunction}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalFunction", value: v })}
                options={[
                  { value: "not-known-no-concern", label: "Not known, and no reason to suspect impairment" },
                  { value: "known-crcl-30-or-above", label: "Known impairment, creatinine clearance 30 mL/min or above" },
                  { value: "crcl-below-30-or-suspected", label: "Creatinine clearance below 30 mL/min, or unknown severity with reason to suspect it is significant" },
                  { value: "crcl-below-10", label: "Creatinine clearance below 10 mL/min" },
                ]}
              />
              <p className="text-sm font-medium text-navy-900">Medicines</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Checkbox
                  label="Takes warfarin"
                  checked={mh.takesWarfarin}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesWarfarin", value: v })}
                />
                <Checkbox
                  label="Takes a DOAC (apixaban, rivaroxaban, edoxaban, dabigatran)"
                  checked={mh.takesDoac}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesDoac", value: v })}
                />
                <Checkbox
                  label="Takes an ergot alkaloid, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin or lovastatin"
                  checked={mh.clariContraindicatedMedicines}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "clariContraindicatedMedicines", value: v })}
                />
                <Checkbox
                  label="Takes colchicine"
                  checked={mh.takesColchicine}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesColchicine", value: v })}
                />
                <Checkbox
                  label="Takes another statin (e.g. atorvastatin)"
                  checked={mh.takesStatin}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesStatin", value: v })}
                />
                <Checkbox
                  label="Takes isotretinoin"
                  checked={mh.takesIsotretinoin}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesIsotretinoin", value: v })}
                />
                <Checkbox
                  label="Regular paracetamol use"
                  checked={mh.regularParacetamol}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "regularParacetamol", value: v })}
                />
              </div>
              <TextArea
                label="Current medicines (check interactions before supply)"
                value={mh.currentMedicines}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentMedicines", value: v })}
                placeholder="List regular and recent medicines"
              />
              <Checkbox
                label="A clinically significant interaction has been identified (excludes supply)"
                checked={mh.interactingMedicines}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "interactingMedicines", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Antibiotic Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              {stopPanel}
              <SelectInput
                label="Antibiotic"
                value={choice}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "choice", value: v })}
                options={[
                  { value: "flucloxacillin", label: "Flucloxacillin (first line)" },
                  { value: "clarithromycin", label: "Clarithromycin (penicillin allergy or flucloxacillin unsuitable)" },
                  {
                    value: "doxycycline",
                    label: cellulitisPgd
                      ? "Doxycycline (penicillin allergy or flucloxacillin unsuitable)"
                      : "Doxycycline (penicillin allergy or flucloxacillin unsuitable; 12 years and over)",
                  },
                ]}
                required
              />
              {choice === "clarithromycin" && !mh.renalFunction && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <SelectInput
                    label="Renal function (ask before supply; required for the clarithromycin arm)"
                    value={mh.renalFunction}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalFunction", value: v })}
                    options={[
                      { value: "not-known-no-concern", label: "Not known, and no reason to suspect impairment" },
                      { value: "known-crcl-30-or-above", label: "Known impairment, creatinine clearance 30 mL/min or above" },
                      { value: "crcl-below-30-or-suspected", label: "Creatinine clearance below 30 mL/min, or unknown severity with reason to suspect it is significant" },
                      { value: "crcl-below-10", label: "Creatinine clearance below 10 mL/min" },
                    ]}
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">Not answered on the Medical History step. Answer it here; the same answer is recorded there.</p>
                </div>
              )}
              {doseRecommendation && (
                <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                  <p className="text-sm font-semibold text-navy-900">{doseRecommendation.medicine}</p>
                  <p className="text-sm text-gray-800">{doseRecommendation.dose}</p>
                  <p className="text-sm text-gray-800">Course: {doseRecommendation.duration}</p>
                  {doseRecommendation.reason && (
                    <p className="text-xs text-gray-600 mt-1">{doseRecommendation.reason}</p>
                  )}
                </div>
              )}
              <SelectInput
                label="Formulation supplied (from the PGD for this arm, age and weight)"
                value={state.antibioticSelection.formulation}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "formulation", value: v })}
                options={getFormulationOptions(state).map((o) => ({ value: o.value, label: o.label }))}
                required
              />
              <TextInput
                label="Brand supplied"
                value={state.antibioticSelection.brand}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "brand", value: v })}
                placeholder="Manufacturer or brand on the pack (PGD records requirement)"
                required
              />
              <SelectInput
                label="Course length"
                value={state.antibioticSelection.courseDays}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "courseDays", value: v })}
                options={
                  cellulitisPgd
                    ? [
                        { value: "5", label: "5 days" },
                        { value: "7", label: "7 days" },
                      ]
                    : [
                        { value: "5", label: "5 days (uncomplicated infection)" },
                        { value: "7", label: "7 days (cellulitis)" },
                      ]
                }
                required
              />
              <TextInput
                label="Quantity supplied (fixed by the PGD: supply the whole course, do not split)"
                value={quantity || "Select the formulation and course length"}
                onChange={() => undefined}
                disabled
                required
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput
                  label="Batch number"
                  value={state.antibioticSelection.batchNumber}
                  onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "batchNumber", value: v })}
                  required
                />
                <TextInput
                  label="Expiry date"
                  value={state.antibioticSelection.expiryDate}
                  onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "expiryDate", value: v })}
                  type="month"
                  required
                />
              </div>
              {choice && choice !== "flucloxacillin" && (
                <SelectInput
                  label="Reason flucloxacillin was unsuitable (inclusion for the second and third line arms)"
                  value={state.antibioticSelection.flucloxUnsuitableReason}
                  onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "flucloxUnsuitableReason", value: v })}
                  options={[
                    { value: "penicillin-allergy", label: "Penicillin or beta-lactam allergy" },
                    { value: "hepatic-history", label: "History of flucloxacillin-associated jaundice or hepatic dysfunction" },
                    { value: "cannot-manage-empty-stomach", label: "Cannot manage empty-stomach dosing (food substantially reduces absorption)" },
                    { value: "intolerance", label: "Documented intolerance of flucloxacillin" },
                  ]}
                  required
                />
              )}
              <TextArea
                label={
                  choice && choice !== "flucloxacillin"
                    ? "Detail of the reason (optional)"
                    : "Clinical rationale (optional)"
                }
                value={state.antibioticSelection.rationale}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "rationale", value: v })}
                placeholder="e.g. first-line choice; documented penicillin allergy (rash 2019)"
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Counselling"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {stopPanel}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered (every item shown is required before Next):</p>
              <Checkbox
                label="Finish the course, even if symptoms resolve earlier"
                checked={state.counselling.completeCourse}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourse", value: v })}
              />
              <Checkbox
                label={
                  choice === "flucloxacillin"
                    ? "Take on an empty stomach, an hour before food or two hours after, with a full glass of water"
                    : choice === "doxycycline"
                      ? "Take with plenty of water, sitting or standing up, and do not lie down for 30 minutes afterwards"
                      : choice === "clarithromycin"
                        ? "Take twice a day, with or without food"
                        : "Administration advice given for the selected antibiotic"
                }
                checked={state.counselling.administrationAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "administrationAdvice", value: v })}
              />
              {!cellulitisPgd && choice === "flucloxacillin" && age !== null && age <= 9 && (
                <Checkbox
                  label="For a child aged 2 to 9: the dose is 5 mL four times a day. Use the syringe we have given you, not a kitchen spoon (parent shown the mark on the oral syringe)"
                  checked={state.counselling.childSyringeAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "childSyringeAdvice", value: v })}
                />
              )}
              <Checkbox
                label="Common side effects discussed (nausea, diarrhoea, abdominal discomfort, rash) and when to stop and seek help"
                checked={state.counselling.sideEffects}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })}
              />
              <Checkbox
                label="Stop and seek urgent help if you develop a rash, wheeze, or swelling of the lips or tongue. Call 999 for any difficulty breathing"
                description={cellulitisPgd ? "Cellulitis PGD cautions: anaphylaxis with beta-lactams, acute generalised exanthematous pustulosis (AGEP) and other severe cutaneous reactions" : undefined}
                checked={state.counselling.seriousReactionAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seriousReactionAdvice", value: v })}
              />
              {choice === "flucloxacillin" && (
                <Checkbox
                  label="Report yellowing of the eyes or skin, or dark urine, even weeks after finishing"
                  description={cellulitisPgd ? "Cellulitis PGD caution: hepatitis and cholestatic jaundice may be delayed for up to two months after treatment" : undefined}
                  checked={state.counselling.hepaticAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hepaticAdvice", value: v })}
                />
              )}
              <Checkbox
                label={
                  cellulitisPgd
                    ? "Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 2 to 3 days, if pain is severe or out of proportion, if the redness and swelling continue to develop beyond the initial presentation, or if you become systemically very unwell"
                    : "Seek help THE SAME DAY if the pain becomes severe or out of proportion, if the area spreads quickly, if the skin darkens or blisters, or if you develop fever, shivering or feel generally unwell. Come back if you are no better in 2 to 3 days"
                }
                checked={state.counselling.worseningAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "worseningAdvice", value: v })}
              />
              {a.infectionType === "cellulitis" && (
                <Checkbox
                  label={
                    cellulitisPgd
                      ? `We have marked the edge of the redness and booked your 48-hour reassessment at this pharmacy${a.reviewDateTime ? ` for ${a.reviewDateTime.replace("T", " at ")}` : ""}. Come to that appointment. If the redness passes the mark before then, seek help the same day`
                      : "We have marked the edge of the redness and booked you back in 48 hours. Come to that appointment. If the redness passes the mark before then, seek help the same day"
                  }
                  checked={state.counselling.cellulitisReviewAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "cellulitisReviewAdvice", value: v })}
                />
              )}
              {!cellulitisPgd && choice === "clarithromycin" && (
                <Checkbox
                  label="Tell us or your GP before starting any new medicine: this antibiotic interacts with a lot of them. May cause dizziness and taste disturbance"
                  checked={state.counselling.interactionAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "interactionAdvice", value: v })}
                />
              )}
              {choice === "doxycycline" && (
                <>
                  {!cellulitisPgd && (
                    <Checkbox
                      label="Avoid antacids, indigestion remedies, iron tablets and milk within 2 hours of a dose"
                      checked={state.counselling.antacidAdvice}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "antacidAdvice", value: v })}
                    />
                  )}
                  <Checkbox
                    label="You may burn more easily in the sun. Use sun protection (photosensitivity with doxycycline)"
                    checked={state.counselling.sunProtection}
                    onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunProtection", value: v })}
                  />
                </>
              )}
              {cellulitisPgd && (
                <Checkbox
                  label="Self-care: paracetamol or ibuprofen for pain and fever if appropriate (avoid regular paracetamol with flucloxacillin where there is a risk of high anion gap metabolic acidosis, HAGMA: sepsis, renal impairment, malnutrition, older age); drink adequate fluids; elevate the leg; avoid compression garments during acute cellulitis; manage comorbidities such as diabetes; prevention advice (weight loss where applicable, emollients for dry or cracking skin)"
                  checked={state.counselling.selfCareAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "selfCareAdvice", value: v })}
                />
              )}
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Summary"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              {stopPanel}
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })}
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })}
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })}
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })}
              />
              <TextArea
                label="Adverse drug reactions reported and actions taken (leave blank if none)"
                value={state.summary.adverseDrugReactions}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "adverseDrugReactions", value: v })}
                placeholder="e.g. None reported. Any reaction: Yellow Card submitted, GP informed"
              />
              <TextArea
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 print:px-0 print:py-0">
        <div className="print:hidden space-y-6">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={state.currentStep}
            onStepClick={handleSetStep}
            completedSteps={completedSteps}
            hasErrors={!!validationError}
          />
          {renderCurrentStep()}
        </div>

        <div className="hidden print:block">
          <SkinInfectionSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}
