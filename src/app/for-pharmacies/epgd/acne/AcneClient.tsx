"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  AcneConsultationState,
  AcneAction,
  AcnePatientDetails,
  AcneAssessment,
  AcneMedicalHistory,
  AcneContraindications,
  AcneMedicineSelection,
  AcneCounselling,
  AcneConsultationSummary,
} from "./lib/acne-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/acne-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  getMedicineOptions,
  MEDICINE_OPTIONS,
  PGD_STRAPLINE,
  isDuac,
  isEpiduo,
} from "./lib/acne-clinical-logic";
import { validateStep } from "./lib/acne-validation";
import { calculateAge } from "../shared/types";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AcneSummaryReport } from "./components/AcneSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: AcneConsultationState, action: AcneAction): AcneConsultationState {
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

// ─── Main Component ───

export default function AcneClient() {
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

  // Compute alerts and recommendations
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);
  const medicineOptions = useMemo(() => getMedicineOptions(state.assessment.severity), [state.assessment.severity]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  // Validation for current step
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // Can proceed to next step?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  // Step handlers
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
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
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
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine: {
        name: state.medicineSelection?.medicineChoice,
      },
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  // Handle patient field change
  const handlePatientChange = (field: keyof AcnePatientDetails, value: any) => {
    dispatch({ type: "UPDATE_PATIENT", field, value });
  };

  // Handle consent field change
  const handleConsentChange = (field: keyof (typeof state.consent), value: any) => {
    dispatch({ type: "UPDATE_CONSENT", field, value });
  };

  // Handle assessment field change
  const handleAssessmentChange = (field: keyof AcneAssessment, value: any) => {
    dispatch({ type: "UPDATE_ASSESSMENT", field, value });
  };

  // Handle medical history field change
  const handleMedicalHistoryChange = (field: keyof AcneMedicalHistory, value: any) => {
    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field, value });
  };

  // Handle contraindications field change
  const handleContraindicationsChange = (field: keyof AcneContraindications, value: any) => {
    dispatch({ type: "UPDATE_CONTRAINDICATIONS", field, value });
  };

  // Handle medicine selection field change
  const handleMedicineSelectionChange = (field: keyof AcneMedicineSelection, value: any) => {
    dispatch({ type: "UPDATE_MEDICINE_SELECTION", field, value });
  };

  // Handle counselling field change
  const handleCounsellingChange = (field: keyof AcneCounselling, value: any) => {
    dispatch({ type: "UPDATE_COUNSELLING", field, value });
  };

  // Handle summary field change
  const handleSummaryChange = (field: keyof AcneConsultationSummary, value: any) => {
    dispatch({ type: "UPDATE_SUMMARY", field, value });
  };

  // Render appropriate step
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
          >
            <PatientDetailsStep patient={state.patient} onChange={handlePatientChange} />
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
          >
            <div className="space-y-4">
              <ConsentStep consent={state.consent} onChange={handleConsentChange} />
              <Checkbox
                label="Patient is female (or able to become pregnant)"
                checked={state.consent.femaleConfirmed}
                onChange={(v) => handleConsentChange("femaleConfirmed", v)}
                description="Pregnancy and planning pregnancy are exclusions for adapalene / benzoyl peroxide; pregnancy and breastfeeding are referred to the GP under both arms."
              />
            </div>
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Acne Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              <SelectInput
                label="Acne Severity"
                value={state.assessment.severity}
                onChange={(v) => handleAssessmentChange("severity", v)}
                options={[
                  { value: "mild", label: "Mild (comedonal only)" },
                  { value: "moderate", label: "Moderate (inflammatory papules/pustules)" },
                  { value: "severe", label: "Severe, requiring systemic therapy (excluded, refer)" },
                ]}
                required
              />

              {state.assessment.severity && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-navy-900">Acne Manifestations</p>
                  <Checkbox
                    label="Comedones (blackheads/whiteheads)"
                    checked={state.assessment.comedones}
                    onChange={(v) => handleAssessmentChange("comedones", v)}
                  />
                  <Checkbox
                    label="Inflammatory papules"
                    checked={state.assessment.inflammatoryPapules}
                    onChange={(v) => handleAssessmentChange("inflammatoryPapules", v)}
                  />
                  <Checkbox
                    label="Pustules"
                    checked={state.assessment.pustules}
                    onChange={(v) => handleAssessmentChange("pustules", v)}
                  />
                  <Checkbox
                    label="Nodular/cystic lesions"
                    checked={state.assessment.nodalCystic}
                    onChange={(v) => handleAssessmentChange("nodalCystic", v)}
                  />
                </div>
              )}

              <TextArea
                label="Affected Area (location, extent)"
                value={state.assessment.affectedArea}
                onChange={(v) => handleAssessmentChange("affectedArea", v)}
                placeholder="e.g., Face, T-zone; mild distribution; approximately 30% face coverage"
                required
              />
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
          >
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              <TextArea
                label="Previous acne treatments"
                value={state.medicalHistory.previousTreatments}
                onChange={(v) => handleMedicalHistoryChange("previousTreatments", v)}
                placeholder="e.g., Topical benzoyl peroxide 2.5% (2021), no systemic treatments"
              />

              <TextArea
                label="Allergies/Sensitivities"
                value={state.medicalHistory.allergies}
                onChange={(v) => handleMedicalHistoryChange("allergies", v)}
                placeholder="e.g., NKDA, or penicillin allergy if considering antibiotics"
                required
              />

              <Checkbox
                label="Known sensitivity to retinoids"
                checked={state.medicalHistory.sensitiveToRetinoids}
                onChange={(v) => handleMedicalHistoryChange("sensitiveToRetinoids", v)}
                description="Extreme dryness, irritation, or rash with previous retinoid use"
              />
              <Checkbox
                label="History of antibiotic-associated colitis"
                checked={state.medicalHistory.antibioticAssociatedColitis}
                onChange={(v) => handleMedicalHistoryChange("antibioticAssociatedColitis", v)}
                description="Exclusion for benzoyl peroxide / clindamycin gel"
              />
              <Checkbox
                label="History of gastrointestinal disease"
                checked={state.medicalHistory.gastrointestinalDisease}
                onChange={(v) => handleMedicalHistoryChange("gastrointestinalDisease", v)}
                description="Caution with benzoyl peroxide / clindamycin gel"
              />
              <Checkbox
                label="Atopic patient"
                checked={state.medicalHistory.atopic}
                onChange={(v) => handleMedicalHistoryChange("atopic", v)}
                description="Caution with benzoyl peroxide / clindamycin gel"
              />
              <Checkbox
                label="Acne causing severe scarring, persistent pigmentary changes, or persistent psychological distress / mental health disorder"
                checked={state.medicalHistory.scarringOrDistress}
                onChange={(v) => handleMedicalHistoryChange("scarringOrDistress", v)}
                description="Consider referral to a dermatologist"
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Contraindications Check"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <AlertBanner alerts={alerts} />
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Patient is pregnant"
                checked={state.contraindications.pregnant}
                onChange={(v) => handleContraindicationsChange("pregnant", v)}
                description="Exclusion for adapalene / benzoyl peroxide. Benzoyl peroxide / clindamycin: safety in pregnancy not established, refer to the GP."
              />

              <Checkbox
                label="Patient is planning pregnancy"
                checked={state.contraindications.planningPregnancy}
                onChange={(v) => handleContraindicationsChange("planningPregnancy", v)}
                description="Exclusion for adapalene / benzoyl peroxide gel."
              />

              <Checkbox
                label="Patient is breastfeeding"
                checked={state.contraindications.breastfeeding}
                onChange={(v) => handleContraindicationsChange("breastfeeding", v)}
                description="Benzoyl peroxide / clindamycin: clindamycin is found in breast milk, refer to the GP. Adapalene / benzoyl peroxide: a risk to the suckling child cannot be excluded. Refer to the GP."
              />

              <Checkbox
                label="Patient under 12 years old"
                checked={state.contraindications.ageUnder12}
                onChange={(v) => handleContraindicationsChange("ageUnder12", v)}
                description="Both arms are for individuals aged 12 years and over."
              />

              <Checkbox
                label="Known hypersensitivity to benzoyl peroxide"
                checked={state.contraindications.hypersensitivityBenzoylPeroxide}
                onChange={(v) => handleContraindicationsChange("hypersensitivityBenzoylPeroxide", v)}
                description="Exclusion for both arms (both products contain benzoyl peroxide)."
              />

              <Checkbox
                label="Known hypersensitivity to clindamycin or lincomycin"
                checked={state.contraindications.hypersensitivityClindamycinLincomycin}
                onChange={(v) => handleContraindicationsChange("hypersensitivityClindamycinLincomycin", v)}
                description="Exclusion for benzoyl peroxide / clindamycin gel."
              />

              <Checkbox
                label="Known hypersensitivity to adapalene or any excipient"
                checked={state.contraindications.hypersensitivityAdapalene}
                onChange={(v) => handleContraindicationsChange("hypersensitivityAdapalene", v)}
                description="Exclusion for adapalene / benzoyl peroxide gel."
              />

              <Checkbox
                label="Broken skin at the application site"
                checked={state.contraindications.brokenSkinAtSite}
                onChange={(v) => handleContraindicationsChange("brokenSkinAtSite", v)}
                description="Exclusion for both arms."
              />

              <Checkbox
                label="Inflamed skin at the application site"
                checked={state.contraindications.inflamedSkinAtSite}
                onChange={(v) => handleContraindicationsChange("inflamedSkinAtSite", v)}
                description="Exclusion for benzoyl peroxide / clindamycin gel."
              />

              <Checkbox
                label="Eczema or sunburned skin at the application site"
                checked={state.contraindications.eczemaOrSunburnAtSite}
                onChange={(v) => handleContraindicationsChange("eczemaOrSunburnAtSite", v)}
                description="Exclusion for adapalene / benzoyl peroxide gel."
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Medicine Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              {medicineOptions.length === 0 ? (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-800">
                  No product can be supplied for severe acne under this PGD. Severe acne requiring systemic therapy is an exclusion for both arms; refer to the GP.
                </div>
              ) : (
                <>
                  <SelectInput
                    label="Medicine Choice"
                    value={state.medicineSelection.medicineChoice}
                    onChange={(v) => handleMedicineSelectionChange("medicineChoice", v)}
                    options={MEDICINE_OPTIONS.filter((o) => medicineOptions.includes(o.value))}
                    required
                  />
                  {state.medicineSelection.medicineChoice === "duac-5" && (
                    <SelectInput
                      label="Clinical reason for the 10 mg/g + 50 mg/g strength"
                      value={state.medicineSelection.strengthRationale}
                      onChange={(v) => handleMedicineSelectionChange("strengthRationale", v)}
                      options={[
                        { value: "lower-strength-less-effective", label: "The 10 mg/g + 30 mg/g strength has proven less effective" },
                        { value: "more-moderate", label: "More moderate presentation" },
                        { value: "tolerated-5pc-bpo", label: "Patient has previously tolerated 50 mg/g (5%) benzoyl peroxide" },
                      ]}
                      required
                    />
                  )}
                  {doseRecommendation && (
                    <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 space-y-1">
                      <p className="text-sm font-medium text-navy-900">{doseRecommendation.medicine}</p>
                      <p className="text-xs text-gray-600">{doseRecommendation.dose}</p>
                      <p className="text-xs text-gray-600">{doseRecommendation.duration}</p>
                      <p className="text-xs text-gray-600">{doseRecommendation.reason}</p>
                    </div>
                  )}
                  <Checkbox
                    label="Repeat course (patient has had a previous course of this treatment)"
                    checked={state.medicineSelection.repeatCourse}
                    onChange={(v) => handleMedicineSelectionChange("repeatCourse", v)}
                    description="Maximum of 12 weeks continuous use; review required for repeat courses."
                  />
                  {state.medicineSelection.repeatCourse && (
                    <Checkbox
                      label="Review completed before this repeat course"
                      checked={state.medicineSelection.repeatCourseReviewed}
                      onChange={(v) => handleMedicineSelectionChange("repeatCourseReviewed", v)}
                      required
                    />
                  )}
                </>
              )}
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Counselling"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling points covered:</p>
              <Checkbox
                label="Improvement is not expected before 6 to 8 weeks; treatments may irritate the skin, especially at the start"
                checked={state.counselling.improvementTimeline}
                onChange={(v) => handleCounsellingChange("improvementTimeline", v)}
              />
              <Checkbox
                label="Application: thin layer to the entire affected area once daily in the evening to clean, dry skin; wash hands after; avoid eyes, mouth, mucous membranes and broken skin (rinse well with water if contact)"
                checked={state.counselling.applicationAdvice}
                onChange={(v) => handleCounsellingChange("applicationAdvice", v)}
                description="Excessive application will not improve efficacy but may increase skin irritation."
              />
              <Checkbox
                label="Use sunscreen and limit sun exposure (increased sensitivity)"
                checked={state.counselling.photosensitivity}
                onChange={(v) => handleCounsellingChange("photosensitivity", v)}
              />
              <Checkbox
                label="Irritation: if excessive dryness or peeling occurs, reduce frequency or interrupt; discontinue if severe irritation or allergic reaction"
                checked={state.counselling.irritationAdvice}
                onChange={(v) => handleCounsellingChange("irritationAdvice", v)}
                description={isEpiduo(state.medicineSelection.medicineChoice) ? "To reduce irritation, may start with alternate-day or short-contact application (for example washing off after an hour)." : undefined}
              />
              <Checkbox
                label="Avoid over-cleaning; use a non-alkaline (pH neutral or slightly acidic) cleanser twice daily; acne is not caused by poor hygiene"
                checked={state.counselling.washingAdvice}
                onChange={(v) => handleCounsellingChange("washingAdvice", v)}
              />
              <Checkbox
                label="Avoid oil-based comedogenic skin care products, make-up and sunscreens; remove make-up at the end of the day"
                checked={state.counselling.productAdvice}
                onChange={(v) => handleCounsellingChange("productAdvice", v)}
              />
              <Checkbox
                label="Persistent picking or scratching of lesions can increase the risk of scarring"
                checked={state.counselling.scarringAdvice}
                onChange={(v) => handleCounsellingChange("scarringAdvice", v)}
              />
              <Checkbox
                label="Treatment period: maximum 12 weeks continuous use; review required before any repeat course"
                checked={state.counselling.courseCompletion}
                onChange={(v) => handleCounsellingChange("courseCompletion", v)}
              />
              <Checkbox
                label={isEpiduo(state.medicineSelection.medicineChoice)
                  ? "Follow-up: seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 4 to 8 weeks of regular use"
                  : "Follow-up: seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 8 to 12 weeks of regular use"}
                checked={state.counselling.followUpAdvice}
                onChange={(v) => handleCounsellingChange("followUpAdvice", v)}
              />
              {isDuac(state.medicineSelection.medicineChoice) && (
                <Checkbox
                  label="Storage: once dispensed store below 25 C and use within 2 months (refrigerated 2 to 8 C before dispensing)"
                  checked={state.counselling.storageAdvice}
                  onChange={(v) => handleCounsellingChange("storageAdvice", v)}
                />
              )}
              {isEpiduo(state.medicineSelection.medicineChoice) && (
                <Checkbox
                  label="Avoid contact with coloured material including hair and dyed fabrics (bleaching); cosmetics with irritant or drying effects may add to irritation; if product enters the eye, wash immediately with warm water"
                  checked={state.counselling.bleachingAdvice}
                  onChange={(v) => handleCounsellingChange("bleachingAdvice", v)}
                />
              )}
              <Checkbox
                label="Patient information leaflet (PIL) supplied with the medication"
                checked={state.counselling.pilSupplied}
                onChange={(v) => handleCounsellingChange("pilSupplied", v)}
              />
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Summary"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) => handleSummaryChange("pharmacistName", v)}
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => handleSummaryChange("pharmacistGPhC", v)}
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) => handleSummaryChange("pharmacyName", v)}
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => handleSummaryChange("pharmacyAddress", v)}
              />
              <TextArea
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => handleSummaryChange("clinicalNotes", v)}
                placeholder="Any additional clinical observations or follow-up recommendations"
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
        {/* Only show progress bar and steps if not printing */}
        <div className="print:hidden space-y-6">
          <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={state.currentStep}
            onStepClick={handleSetStep}
            completedSteps={completedSteps}
            hasErrors={!!validationError}
          />
          {renderCurrentStep()}
        </div>

        {/* Print view: summary report */}
        <div className="hidden print:block">
          <AcneSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}
