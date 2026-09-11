"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  ColdSoresConsultationState,
  ColdSoresAction,
  ColdSoresPatientDetails,
  ColdSoresSymptomAssessment,
  ColdSoresMedicalHistory,
  ColdSoresContraindications,
  ColdSoresMedicineSupply,
  ColdSoresCounselling,
  ColdSoresConsultationSummary,
} from "./lib/cold-sores-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/cold-sores-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/cold-sores-clinical-logic";
import { validateStep } from "./lib/cold-sores-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { ColdSoresSummaryReport } from "./components/ColdSoresSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: ColdSoresConsultationState, action: ColdSoresAction): ColdSoresConsultationState {
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

    case "UPDATE_SYMPTOM_ASSESSMENT":
      newState.symptomAssessment = {
        ...newState.symptomAssessment,
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

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = {
        ...newState.medicineSupply,
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

export default function ColdSoresClient() {
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
  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

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
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Symptom Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  label="Clinical diagnosis of recurrent herpes labialis (cold sores) of the lips or face"
                  checked={state.symptomAssessment.isRecurrent}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "isRecurrent", value: v })}
                  description="PGD inclusion criterion. Lesions on mucous membranes (eyes, inside the mouth, genitals) are excluded."
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Checkbox
                  label="This is the first suspected episode of herpes labialis"
                  checked={state.symptomAssessment.isFirstEpisode}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "isFirstEpisode", value: v })}
                  description="Not covered by this PGD (recurrent herpes labialis only). Refer to the GP for diagnosis."
                />
              </div>

              <TextArea
                label="Current Symptoms"
                value={state.symptomAssessment.currentSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "currentSymptoms", value: v })}
                placeholder="e.g., Tingling &amp; mild pain at lip border; no vesicles visible yet"
                required
              />

              <Checkbox
                label="Patient reports prodrome signs (tingling, burning)"
                checked={state.symptomAssessment.prodromeSigns}
                onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "prodromeSigns", value: v })}
              />

              {state.symptomAssessment.prodromeSigns && (
                <NumberInput
                  label="Hours since prodrome onset"
                  value={state.symptomAssessment.hoursFromProdrome}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "hoursFromProdrome", value: v })}
                  min={0}
                  max={240}
                  placeholder="e.g., 6"
                  unit="hours"
                />
              )}
              <p className="text-xs text-gray-600">
                Start treatment at the first sign of symptoms (tingling or itching). Seek advice if lesions last more than 10 days or spread.
              </p>
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
              <Checkbox
                label="Patient is currently immunocompromised"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunosuppressed", value: v })}
                description="On immunosuppressive therapy (biologics, corticosteroids, chemotherapy, etc.), HIV, transplant. Excluded from this PGD: refer."
              />

              <Checkbox
                label="Patient recently became immunosuppressed (within 2 weeks)"
                checked={state.medicalHistory.recentlyImmunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentlyImmunosuppressed", value: v })}
                description="Excluded from this PGD: refer."
              />

              <Checkbox
                label="Patient has impaired renal function"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })}
                description="Caution with oral aciclovir; maintain adequate hydration. Elderly patients are likely to have reduced renal function."
              />

              {state.medicalHistory.renalImpairment && (
                <TextArea
                  label="Renal Function Status (eGFR/creatinine)"
                  value={state.medicalHistory.renalFunction}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalFunction", value: v })}
                  placeholder="e.g., eGFR 35 mL/min (mild–moderate impairment); creatinine 1.5× baseline"
                  required
                />
              )}
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
              <p className="text-sm font-medium text-navy-900">PGD exclusion criteria: any ticked box means refer, do not supply.</p>
              <Checkbox
                label="Known hypersensitivity to aciclovir, valaciclovir or any excipient"
                checked={state.contraindications.hypersensitivity}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivity", value: v })}
              />

              <Checkbox
                label="Patient is immunocompromised"
                checked={state.contraindications.immunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "immunosuppressed", value: v })}
                description="Risk of severe or systemic HSV. Refer to GP or specialist."
              />

              <Checkbox
                label="Severe recurrent episodes"
                checked={state.contraindications.severeRecurrentEpisodes}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severeRecurrentEpisodes", value: v })}
                description="Frequent (6 or more a year), extensive, persistent or atypical episodes. Refer to GP; oral or suppressive therapy is a prescriber decision."
              />

              <Checkbox
                label="Lesions on mucous membranes (eyes, inside the mouth, genitals)"
                checked={state.contraindications.mucousMembraneLesions}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "mucousMembraneLesions", value: v })}
                description="Excluded. Any eye involvement: refer urgently to ophthalmology."
              />

              <Checkbox
                label="Patient is pregnant"
                checked={state.contraindications.pregnant}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnant", value: v })}
                description="Excluded unless assessed as appropriate by a prescriber: refer to the GP."
              />

              <Checkbox
                label="Patient is breastfeeding"
                checked={state.contraindications.breastfeeding}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })}
                description="Excluded unless assessed as appropriate by a prescriber: refer to the GP."
              />

              <Checkbox
                label="Patient is under 12 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />

              <Checkbox
                label="Patient has severe renal impairment (eGFR below 10 mL/min)"
                checked={state.contraindications.renalImpairmentSevere}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "renalImpairmentSevere", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Medicine Supply"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <SelectInput
                label="Product"
                value={state.medicineSupply.product}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "product", value: v });
                  if (v === "tablets") {
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseChoice", value: "200" });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "tubeSize", value: "" });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: 25 });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "frequency", value: "five times daily" });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "duration", value: "5 days" });
                  } else if (v === "cream") {
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseChoice", value: "" });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: 1 });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "frequency", value: "five times daily at approximately four-hour intervals" });
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "duration", value: "5 days (up to 10 days if not healed)" });
                  }
                }}
                options={[
                  { value: "cream", label: "Aciclovir 5% cream (P): apply five times daily for 5 days" },
                  { value: "tablets", label: "Aciclovir 200 mg tablets (POM): 200 mg five times daily for 5 days" },
                ]}
                required
              />

              {state.medicineSupply.product === "cream" && (
                <SelectInput
                  label="Tube size (one tube per episode)"
                  value={state.medicineSupply.tubeSize}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "tubeSize", value: v })}
                  options={[
                    { value: "2g", label: "2 g tube" },
                    { value: "5g", label: "5 g tube" },
                  ]}
                  required
                />
              )}

              <TextInput
                label="Brand supplied"
                value={state.medicineSupply.brand}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "brand", value: v })}
                placeholder={state.medicineSupply.product === "cream" ? "e.g. Zovirax, Boots aciclovir cream" : "e.g. manufacturer of aciclovir 200 mg tablets"}
                required
              />

              {doseRecommendation && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                  <p className="text-sm font-medium text-navy-900">{doseRecommendation.medicine}</p>
                  <p className="text-xs text-gray-600 mt-1">{doseRecommendation.dosingRegimen}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Quantity: {state.medicineSupply.product === "cream" ? "1 tube" : "25 tablets"} per episode. {doseRecommendation.reason}
                  </p>
                  {state.medicineSupply.product === "cream" && (
                    <p className="text-xs text-gray-600 mt-1">
                      Avoid contact with eyes or mucous membranes. Do not share tubes. Wash hands before and after applying; dab on rather than rub.
                    </p>
                  )}
                </div>
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
                label="Start treatment at the first sign of symptoms (tingling or itching)"
                checked={state.counselling.startASAP}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "startASAP", value: v })}
              />
              <Checkbox
                label="Complete the 5-day course"
                checked={state.counselling.completeCourse}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourse", value: v })}
                description={
                  state.medicineSupply.product === "cream"
                    ? "Cream: five times daily at approximately four-hour intervals for 5 days; if not healed, continue up to 10 days; consult a doctor if lesions are still present after 10 days."
                    : "Tablets: 200 mg five times daily for 5 days. Tablets may be dispersed in a minimum of 50 mL of water or swallowed whole with a little water."
                }
              />
              <Checkbox
                label="Herpes simplex is easily transmitted: avoid kissing and oral sex until all lesions have fully healed"
                checked={state.counselling.contagious}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "contagious", value: v })}
              />
              <Checkbox
                label="Do not share items that touch the lesions (makeup, lip balm, utensils, towels) or topical treatments"
                checked={state.counselling.avoidSharing}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidSharing", value: v })}
              />
              <Checkbox
                label="Hygiene: avoid touching lesions except to dab on treatment (not rub); wash hands with soap and water after touching; take care with contact lenses; defer elective dental treatment until healed"
                checked={state.counselling.hygieneMeasures}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hygieneMeasures", value: v })}
              />
              <Checkbox
                label="Symptom relief: paracetamol and/or ibuprofen if no contraindication; adequate fluids; usually self-limiting and heals without scarring"
                checked={state.counselling.symptomRelief}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "symptomRelief", value: v })}
              />
              <Checkbox
                label="Seek medical advice if symptoms worsen (lesion spreads, new lesions, persistent fever, difficulty taking fluids) or no significant improvement after 5 to 7 days"
                checked={state.counselling.safetyNetting}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "safetyNetting", value: v })}
              />
              <Checkbox
                label="Avoid triggers where possible; if sunlight is a trigger use sunscreen or sunblock lip balm (SPF 15 or greater)"
                checked={state.counselling.sunExposure}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunExposure", value: v })}
              />
              <Checkbox
                label="Patient information leaflet supplied with the medication"
                checked={state.counselling.providedPIL}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "providedPIL", value: v })}
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
          <ColdSoresSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}
