"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  EczemaConsultationState,
  EczemaAction,
  EczemaPatientDetails,
  EczemaAssessment,
  EczemaMedicalHistory,
  EczemaContraindications,
  EczemaMedicineSelection,
  EczemaCounselling,
  EczemaConsultationSummary,
} from "./lib/eczema-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialConsultationState,
  ECZEMA_PGD_VERSION,
  TREATED_AREA_LABEL,
  QUANTITY_BY_AREA,
  SITE_OPTIONS,
  isThinSkinSite,
  isEyelidSite,
} from "./lib/eczema-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  requiredArm,
} from "./lib/eczema-clinical-logic";
import { validateStep } from "./lib/eczema-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { EczemaSummaryReport } from "./components/EczemaSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: EczemaConsultationState, action: EczemaAction): EczemaConsultationState {
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
      newState.assessment = {
        ...newState.assessment,
        [action.field]: action.value,
      };
      // The thin-skin gate and the eyelid exclusion are derived from the
      // structured site list, never from a separate tick that defaults to
      // false (adversarial review, 11 Sep 2026).
      if (action.field === "sites") {
        const sites = action.value as string[];
        newState.assessment.thinSkinSite = isThinSkinSite(sites);
        newState.assessment.eyelids = isEyelidSite(sites);
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = {
        ...newState.contraindications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
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
      return createInitialConsultationState();

    default:
      break;
  }

  return newState;
}

export default function EczemaClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
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

  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);
  // A stop anywhere disables Next on every step: the only way past a stop is
  // "Save as not supplied" on the step where it is shown.
  const canProceed = !validationError && !hasStops;

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  const handleNextStep = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrevStep = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleSetStep = (step: number) => {
    // Backwards only (the progress bar enforces this too). Every step after
    // the target is forgotten, so an edited answer has to pass Next again.
    if (step <= state.currentStep) {
      setCompletedSteps((prev) => new Set([...prev].filter((s) => s < step)));
      dispatch({ type: "SET_STEP", step });
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const ms = state.medicineSelection;
    const medicineName =
      ms.steroidChoice === "clobetasone"
        ? "Clobetasone butyrate 0.05%"
        : ms.steroidChoice === "betamethasone"
          ? "Betamethasone valerate 0.1%"
          : "";
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
      clinicalData: { ...state, alerts, pgdVersion: ECZEMA_PGD_VERSION } as unknown as Record<string, unknown>,
      outcome: hasStops ? "referred" : "completed",
      medicine:
        !hasStops && medicineName
          ? {
              name: `${medicineName} ${ms.formulation}`.trim(),
              dose: "Thin layer once or twice daily to affected skin only, in fingertip units",
              duration: state.assessment.thinSkinSite ? "7 days maximum (face, flexures or genital skin)" : "Up to 7 days then review; maximum 4 weeks continuous",
              quantity: ms.quantitySupplied || undefined,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const age = state.patient.age;
  const thinSkin = state.assessment.thinSkinSite;
  const arm = requiredArm(state);
  const areaQuantity =
    state.assessment.treatedArea && state.assessment.treatedArea !== "over-10-palms"
      ? QUANTITY_BY_AREA[state.assessment.treatedArea]
      : null;

  // Same rules on every step: a stop blocks Next everywhere and offers
  // "Save as not supplied" everywhere, and every step can save a record.
  const wrapperProps = {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNextStep,
    onPrev: handlePrevStep,
    canProceed,
    validationError,
    isBlocked: hasStops,
    getConsultationData,
    onNewConsultation: handleNewConsultation,
  };

  // Shown on every clinical step: the alerts, and where a stop exists, the
  // box for the advice given and the decision reached (document record item).
  const alertsAndExclusion = (
    <>
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {hasStops && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2 mb-4">
          <p className="text-sm font-medium text-navy-900">Excluded: record the reason, the advice given and the decision reached, then use Save as not supplied</p>
          <TextArea
            label="Advice given and decision reached"
            value={state.summary.exclusionAdvice}
            onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "exclusionAdvice", value: v })}
            rows={3}
            placeholder="e.g. explained why a steroid is not the right treatment; referred to GP for review; emollient advice given"
          />
        </div>
      )}
    </>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper
            title="Patient Details"
            {...wrapperProps}
          >
            <p className="text-xs text-gray-600 mb-3">{ECZEMA_PGD_VERSION}. Patients aged 12 years and over.</p>
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={false}
          />
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper
            title="Consent"
            {...wrapperProps}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
            {age !== null && age < 16 && (
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
            title="Eczema Assessment"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4">
              <SelectInput
                label="Eczema Severity"
                value={state.assessment.severity}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
                options={[
                  { value: "mild", label: "Mild: limited erythema and scaling, not markedly affecting sleep or daily activity" },
                  { value: "moderate", label: "Moderate: marked erythema or lichenification, or disease disturbing sleep or daily activity" },
                  { value: "severe", label: "Severe (extensive, cracked, oozing): refer, outside this PGD" },
                ]}
                required
              />
              <p className="text-xs text-gray-600">
                Severity AND site decide the arm. Excoriation from scratching may be present in either and does not by itself make disease moderate.
              </p>

              {state.assessment.severity && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-navy-900">Eczema Manifestations</p>
                  <Checkbox
                    label="Dry skin"
                    checked={state.assessment.isDry}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isDry", value: v })}
                  />
                  <Checkbox
                    label="Red/inflamed"
                    checked={state.assessment.isRed}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isRed", value: v })}
                  />
                  <Checkbox
                    label="Thickened skin"
                    checked={state.assessment.isThickened}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isThickened", value: v })}
                  />
                  <Checkbox
                    label="Cracked"
                    checked={state.assessment.isCracked}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isCracked", value: v })}
                  />
                  <Checkbox
                    label="Oozing/weeping"
                    checked={state.assessment.isOozing}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isOozing", value: v })}
                  />
                </div>
              )}

              <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-navy-900">Sites treated (severity and site together decide the arm) *</p>
                <p className="text-xs text-gray-600">Face, flexures and genital skin are thin skin: clobetasone only, 7 days maximum there. The eyelids are excluded from both arms.</p>
                <div className="grid sm:grid-cols-2 gap-x-4">
                  {SITE_OPTIONS.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={state.assessment.sites.includes(opt.value)}
                      onChange={(checked) => {
                        const next = checked
                          ? [...state.assessment.sites, opt.value]
                          : state.assessment.sites.filter((s) => s !== opt.value);
                        dispatch({ type: "UPDATE_ASSESSMENT", field: "sites", value: next });
                      }}
                    />
                  ))}
                </div>
                {thinSkin && (
                  <p className="text-xs text-amber-800 font-medium">Thin-skin site selected: Arm 1 (clobetasone) only, 7 days maximum at that site.</p>
                )}
                {state.assessment.eyelids && (
                  <p className="text-xs text-red-700 font-medium">Eyelids selected: excluded from both arms. Refer.</p>
                )}
              </div>
              <TextArea
                label="Site detail (optional; required where Other is selected)"
                value={state.assessment.affectedSite}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "affectedSite", value: v })}
                placeholder="e.g. flexures of both elbows; spares face and groin"
              />
              <SelectInput
                label="Treated area, in adult palms (one fingertip unit covers about two adult palms)"
                value={state.assessment.treatedArea}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "treatedArea", value: v })}
                options={[
                  { value: "up-to-2-palms", label: TREATED_AREA_LABEL["up-to-2-palms"] },
                  { value: "2-to-5-palms", label: TREATED_AREA_LABEL["2-to-5-palms"] },
                  { value: "5-to-10-palms", label: TREATED_AREA_LABEL["5-to-10-palms"] },
                  { value: "over-10-palms", label: TREATED_AREA_LABEL["over-10-palms"] },
                ]}
                required
              />
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4">
              <TextArea
                label="Previous eczema treatments"
                value={state.medicalHistory.previousTreatments}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "previousTreatments", value: v })}
                placeholder="e.g. clobetasone 0.05% last month, emollients"
              />

              <TextArea
                label="Allergies/Sensitivities"
                value={state.medicalHistory.allergies}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "allergies", value: v })}
                placeholder="e.g., NKDA, reaction to lanolin"
                required
              />
              <SelectInput
                label="Courses of topical corticosteroid supplied in the last 12 months"
                value={state.medicalHistory.coursesLast12Months}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "coursesLast12Months", value: v })}
                options={[
                  { value: "0", label: "None" },
                  { value: "1", label: "One" },
                  { value: "2", label: "Two" },
                  { value: "3-or-more", label: "Three or more" },
                ]}
                required
              />
              {state.medicalHistory.coursesLast12Months === "3-or-more" && (
                <Checkbox
                  label="The GP has reviewed the patient since the last course"
                  checked={state.medicalHistory.gpReviewSinceLastCourse}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "gpReviewSinceLastCourse", value: v })}
                  description="Exclusion: three or more courses in the last 12 months WITHOUT GP review. With a GP review since the last course, supply is permitted; record the review in the clinical notes."
                />
              )}
              {state.medicalHistory.coursesLast12Months && state.medicalHistory.coursesLast12Months !== "0" && (
                <TextInput
                  label="Date the last course ended (for the 4 week continuous ceiling)"
                  type="date"
                  value={state.medicalHistory.lastCourseEndDate}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "lastCourseEndDate", value: v })}
                />
              )}
              <Checkbox
                label="Already using another topical corticosteroid (do not add a second: refer)"
                checked={state.medicalHistory.currentlyUsingTopicalSteroid}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentlyUsingTopicalSteroid", value: v })}
              />
              <Checkbox
                label="Known hypersensitivity to clobetasone, betamethasone or any excipient"
                checked={state.medicalHistory.productHypersensitivity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "productHypersensitivity", value: v })}
              />
              <Checkbox
                label="Pregnant or breastfeeding"
                checked={state.medicalHistory.pregnantOrBreastfeeding}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnantOrBreastfeeding", value: v })}
                description="Short-term use of these potencies is acceptable away from the breast or nipple area; record the site."
              />
              {state.medicalHistory.pregnantOrBreastfeeding && (
                <Checkbox
                  label="Treatment would be to the breast or nipple area (excluded)"
                  checked={state.medicalHistory.treatmentToBreastArea}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "treatmentToBreastArea", value: v })}
                />
              )}
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Contraindications Check"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Signs of secondary bacterial infection (weeping, crusting, sudden worsening or fever)"
                checked={state.contraindications.bacterialInfection}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "bacterialInfection", value: v })}
                description="Excluded unless the infection is MILD and LOCALISED and is treated at this visit under the Skin and Soft Tissue Infection PGD. Otherwise refer and supply neither."
              />
              {(state.contraindications.bacterialInfection || state.assessment.isOozing) && (
                <div className="space-y-3 p-3 bg-white rounded-lg border border-gray-200">
                  <Checkbox
                    label="The infection is MILD and LOCALISED, with no red flag from the Skin and Soft Tissue Infection PGD (widespread or systemic infection: refer and supply neither)"
                    checked={state.contraindications.concurrentInfectionMildLocalised}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentInfectionMildLocalised", value: v })}
                  />
                  <Checkbox
                    label="Concurrent supply: an oral antibiotic is supplied at this consultation under the Skin and Soft Tissue Infection PGD, recorded below so that both supplies are in this one consultation record"
                    checked={state.contraindications.concurrentAntibioticSupplied}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticSupplied", value: v })}
                  />
                  {state.contraindications.concurrentAntibioticSupplied && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <TextInput label="Antibiotic supplied (name and strength)" value={state.contraindications.concurrentAntibioticName} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticName", value: v })} required placeholder="e.g. flucloxacillin 500mg capsules" />
                      <TextInput label="Dose and duration" value={state.contraindications.concurrentAntibioticDose} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticDose", value: v })} required placeholder="e.g. 500mg four times daily for 5 days" />
                      <TextInput label="Quantity" value={state.contraindications.concurrentAntibioticQuantity} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticQuantity", value: v })} required placeholder="e.g. 20 capsules" />
                      <TextInput label="Batch number" value={state.contraindications.concurrentAntibioticBatch} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticBatch", value: v })} required />
                      <TextInput label="Expiry date" type="date" value={state.contraindications.concurrentAntibioticExpiry} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentAntibioticExpiry", value: v })} required />
                      <TextInput label="Skin infection consultation reference (if saved separately)" value={state.contraindications.concurrentConsultationRef} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "concurrentConsultationRef", value: v })} />
                    </div>
                  )}
                </div>
              )}

              <Checkbox
                label="Suspected eczema herpeticum: rapidly worsening, painful, punched-out or clustered vesicular lesions, or systemically unwell (EMERGENCY)"
                checked={state.contraindications.viralInfection}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "viralInfection", value: v })}
              />

              <Checkbox
                label="Untreated fungal infection, or any rash that might be tinea"
                checked={state.contraindications.fungalInfection}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "fungalInfection", value: v })}
                description="A topical steroid on tinea produces tinea incognito. Refer."
              />

              <Checkbox
                label="Ulcerated skin, or an open wound (excoriation from scratching is NOT an exclusion)"
                checked={state.contraindications.ulceratedOrOpenWound}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "ulceratedOrOpenWound", value: v })}
              />

              <Checkbox
                label="Rosacea, perioral dermatitis or acne (a topical steroid makes all three worse)"
                checked={state.contraindications.rosaceaOrAcne}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "rosaceaOrAcne", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Medicine Selection"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4">
              <Checkbox
                label="Emollient confirmed as the base of treatment"
                checked={state.medicineSelection.emollientFirst}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "emollientFirst", value: v })}
                description="Emollients are first line for everyone, used liberally and frequently, and continued even when the skin is clear."
              />

              {doseRecommendation && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                  <p className="text-sm font-medium text-navy-900">{doseRecommendation.medicine}</p>
                  <p className="text-xs text-gray-800 mt-1">{doseRecommendation.dose}, {doseRecommendation.frequency}. {doseRecommendation.dosingRegimen}</p>
                  <p className="text-xs text-gray-800 mt-1">Duration: {doseRecommendation.duration}.</p>
                  <p className="text-xs text-gray-600 mt-1">{doseRecommendation.reason}</p>
                </div>
              )}

              <SelectInput
                label="Corticosteroid arm"
                value={state.medicineSelection.steroidChoice}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "steroidChoice", value: v })}
                options={[
                  { value: "clobetasone", label: "Arm 1: Clobetasone butyrate 0.05% (mild anywhere permitted; moderate on face, flexures or genital skin, 7 days maximum there)" },
                  { value: "betamethasone", label: "Arm 2: Betamethasone valerate 0.1% (moderate, trunk and limbs only)" },
                ]}
                required
              />
              {arm && (
                <p className="text-xs text-gray-600">Document route for this presentation: {arm === "clobetasone" ? "Arm 1, clobetasone butyrate 0.05%" : "Arm 2, betamethasone valerate 0.1%"}.</p>
              )}
              <SelectInput
                label="Formulation"
                value={state.medicineSelection.formulation}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "formulation", value: v })}
                options={[
                  { value: "ointment", label: "Ointment (dry, lichenified skin)" },
                  { value: "cream", label: "Cream (weeping or moist areas; the face where an ointment is not tolerated)" },
                ]}
                required
              />
              <SelectInput
                label="Quantity supplied (sized to the treated area for the initial 7 days)"
                value={state.medicineSelection.quantitySupplied}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "quantitySupplied", value: v })}
                options={[
                  { value: "15g", label: "15g (up to 2 adult palms)" },
                  { value: "30g", label: "30g (2 to 5 adult palms)" },
                  { value: "60g", label: "60g (5 to 10 adult palms)" },
                ]}
                required
              />
              {areaQuantity && (
                <p className="text-xs text-gray-600">Document quantity for the recorded treated area: {areaQuantity}. One supply per consultation.</p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput
                  label="Batch number"
                  value={state.medicineSelection.batchNumber}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "batchNumber", value: v })}
                  required
                />
                <TextInput
                  label="Expiry date"
                  type="month"
                  value={state.medicineSelection.expiryDate}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "expiryDate", value: v })}
                  required
                />
              </div>
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Counselling"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered (supply the patient information leaflet):</p>
              <Checkbox
                label="Apply the steroid FIRST, in a thin layer, to the affected skin only. WAIT AT LEAST 30 MINUTES, then apply the emollient. Do not put emollient straight over a freshly applied steroid"
                checked={state.counselling.applyThinly}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "applyThinly", value: v })}
              />
              <Checkbox
                label="Fingertip unit shown on the patient's own finger: one fingertip unit covers about two adult palms"
                checked={state.counselling.fingertipUnits}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "fingertipUnits", value: v })}
              />
              {thinSkin && (
                <Checkbox
                  label="On the face, in skin folds or on genital skin, use this for no more than 7 days (7 day cap explained and recorded)"
                  checked={state.counselling.sevenDayCapExplained}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sevenDayCapExplained", value: v })}
                />
              )}
              {state.medicineSelection.steroidChoice === "betamethasone" && (
                <>
                  <Checkbox
                    label="Do NOT use this on the face, eyelids, skin folds or genital skin. If eczema appears there, come back"
                    checked={state.counselling.notOnFaceAdvice}
                    onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notOnFaceAdvice", value: v })}
                  />
                  <Checkbox
                    label="Step down to a moderate potency once the flare settles rather than stopping abruptly"
                    checked={state.counselling.stepDownApproach}
                    onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "stepDownApproach", value: v })}
                  />
                </>
              )}
              <Checkbox
                label="Keep using the emollient every day, including after the steroid course finishes. The emollient keeps eczema away; the steroid settles a flare"
                checked={state.counselling.emollientFirst}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emollientFirst", value: v })}
              />
              <Checkbox
                label="FIRE RISK FROM EMOLLIENTS explained: all emollients, including paraffin-free ones, soak into clothing, bedding and dressings and make them catch fire more easily and burn faster. Do not smoke, use a naked flame, or go near anything burning; wash clothing and bedding often, knowing washing may not remove the residue completely"
                checked={state.counselling.fireRiskExplained}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "fireRiskExplained", value: v })}
                description="MHRA safety issue; must be counselled on every time and recorded."
              />
              <Checkbox
                label="Come back or see your GP if it is no better after 7 days, if it spreads, or if it starts weeping, crusting or becoming painful"
                checked={state.counselling.followUpAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpAdvice", value: v })}
              />
              <Checkbox
                label="Seek urgent help if the rash becomes rapidly painful with clustered blisters or punched-out sores, or you feel unwell with it"
                checked={state.counselling.urgentHelpAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "urgentHelpAdvice", value: v })}
              />
              <Checkbox
                label="Avoid known triggers (irritants, allergens); do not use under occlusion, a tight dressing or a nappy unless specifically advised"
                checked={state.counselling.avoidTriggers}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidTriggers", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Summary"
            {...wrapperProps}
          >
            {alertsAndExclusion}
            <div className="space-y-4">
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
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              />
              <TextArea
                label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP)"
                value={state.summary.adverseReactions}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "adverseReactions", value: v })}
                placeholder="None known at the time of supply"
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
          <EczemaSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}
