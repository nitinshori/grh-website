"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  HLConsultationState,
  HLAction,
  HLPatientDetails,
  HLClinicalAssessment,
  HLMedicalHistory,
  HLContraindications,
  HLMedicineSupply,
  HLCounselling,
} from "./lib/hair-loss-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hair-loss-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  PGD_STRAPLINE,
} from "./lib/hair-loss-clinical-logic";
import { validateStep } from "./lib/hair-loss-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HLSummaryReport } from "./components/HLSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: HLConsultationState, action: HLAction): HLConsultationState {
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

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
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
  }

  return newState;
}

// ─── Main Client Component ───

export default function HLClient() {
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

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    // Hard stops prevent progression
    if (state.currentStep <= 4 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  // ─── Step content rendering ───


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
      outcome: hardStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hardStops]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof HLPatientDetails, value })
            }
            genderOption={{
              label: "Confirm patient is male",
              description:
                "Finasteride is teratogenic and contraindicated in women. This PGD is for male patients only.",
              checked: state.patient.maleConfirmed,
              onToggle: (v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "maleConfirmed", value: v }),
            }}
          />
        );

      case 1: // Consent
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2: // Assessment
        return (
          <div className="space-y-4">
            <NumberInput
              label="Norwood-Hamilton Scale (1-7)"
              value={state.clinicalAssessment.norwoodHamiltonScale}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "norwoodHamiltonScale",
                  value: v,
                })
              }
              min={1}
              max={7}
              required
            />
            <Checkbox
              label="Androgenetic alopecia (male-pattern baldness) confirmed"
              checked={state.clinicalAssessment.hasAndrogeneticAlopecia}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "hasAndrogeneticAlopecia",
                  value: v,
                })
              }
              description="Hair loss pattern consistent with male-pattern baldness"
            />
            <TextInput
              label="Onset of alopecia (duration, pattern)"
              value={state.clinicalAssessment.alopeciaOnset}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "alopeciaOnset",
                  value: v,
                })
              }
              placeholder="e.g. Progressive over 5 years, temple and crown"
              required
            />
            <Checkbox
              label="Family history of male-pattern baldness"
              checked={state.clinicalAssessment.familyHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "familyHistory",
                  value: v,
                })
              }
              description="Father, brother, or grandfather affected"
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <Checkbox
              label="Liver disease"
              checked={state.medicalHistory.liverDisease}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "liverDisease",
                  value: v,
                })
              }
              description="History of liver disease is an exclusion"
            />
            <Checkbox
              label="Suspected or diagnosed prostate cancer"
              checked={state.medicalHistory.prostateCancer}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "prostateCancer",
                  value: v,
                })
              }
              description="Current or history of prostate cancer"
            />
            {state.medicalHistory.prostateCancer && (
              <TextInput
                label="Details"
                value={state.medicalHistory.prostateCancerDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "prostateCancerDetail",
                    value: v,
                  })
                }
                placeholder="Diagnosis date, treatment, current status"
              />
            )}
            <Checkbox
              label="Raised PSA under investigation"
              checked={state.medicalHistory.psaAbnormalities}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "psaAbnormalities",
                  value: v,
                })
              }
              description="Elevated or abnormal PSA result"
            />
            {state.medicalHistory.psaAbnormalities && (
              <TextInput
                label="Details"
                value={state.medicalHistory.psaAbnormaltiesDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "psaAbnormaltiesDetail",
                    value: v,
                  })
                }
                placeholder="PSA value, date, GP action"
              />
            )}
            <Checkbox
              label="Known hypersensitivity to finasteride or any component of the formulation"
              checked={state.medicalHistory.hypersensitivity}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "hypersensitivity",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Current use of a 5-alpha-reductase inhibitor for another condition"
              checked={state.medicalHistory.current5ARI}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "current5ARI",
                  value: v,
                })
              }
              description="For example finasteride 5 mg or dutasteride for benign prostatic hyperplasia. Exclusion."
            />
            <Checkbox
              label="Rare hereditary galactose intolerance, Lapp lactase deficiency or glucose-galactose malabsorption"
              checked={state.medicalHistory.galactoseIntolerance}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "galactoseIntolerance",
                  value: v,
                })
              }
              description="Should not take this medicine (contains lactose)."
            />
            <TextInput
              label="Other conditions (optional)"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherConditions",
                  value: v,
                })
              }
              placeholder="Diabetes, cardiovascular disease, etc."
            />
          </div>
        );

      case 4: // Contraindications
        return (
          <div className="space-y-4">
            <Checkbox
              label="Patient reports depression or mood changes"
              checked={state.contraindications.depressiveMood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "depressiveMood",
                  value: v,
                })
              }
              description="Mood alterations including depressed mood, depression and, less frequently, suicidal ideation have been reported. Monitor; discontinue and seek medical advice if psychiatric symptoms occur."
            />
            {state.contraindications.depressiveMood && (
              <TextInput
                label="Details of mood symptoms"
                value={state.contraindications.depressiveMoodDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CONTRAINDICATIONS",
                    field: "depressiveMoodDetail",
                    value: v,
                  })
                }
                placeholder="When, severity, current treatment"
              />
            )}
          </div>
        );

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply finasteride 1 mg tablets, 1 mg orally once daily, with or without food"
              checked={state.medicineSupply.finasteride1mgOd}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "finasteride1mgOd",
                  value: v,
                })
              }
              description="POM. Do not store above 25 C; store in the original package to protect from moisture and light."
            />
            <SelectInput
              label="Months of treatment supplied between reviews"
              value={state.medicineSupply.quantityMonths}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "quantityMonths",
                  value: v,
                })
              }
              options={[
                { value: "3", label: "3 months" },
                { value: "6", label: "6 months" },
                { value: "9", label: "9 months" },
                { value: "12", label: "12 months" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">3 to 12 months of treatment can be supplied between reviews. It is advisable to carry out the first review after 3 to 6 months. Minimum 3 to 6 months of continuous treatment to assess effectiveness; reassess if no improvement after 12 months.</p>
            <Checkbox
              label="Tablets must not be handled by women who are or may become pregnant (risk of fetal harm); partner informed if applicable"
              checked={state.medicineSupply.partnerNotified}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "partnerNotified",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Condom recommended if a female partner is pregnant or likely to become pregnant"
              checked={state.medicineSupply.condomAdvice}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "condomAdvice",
                  value: v,
                })
              }
              description="Finasteride is excreted in semen; it is not known whether a male fetus may be affected if its mother is exposed to the semen of a treated man."
            />
            <Checkbox
              label="Patient will monitor for sexual side effects"
              checked={state.medicineSupply.willMonitorSE}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "willMonitorSE",
                  value: v,
                })
              }
              description="Reduced libido, erectile dysfunction, ejaculation disorders; post-marketing reports of infertility and/or poor seminal quality, with normalisation reported after discontinuation."
            />
            <Checkbox
              label="Patient understands finasteride can affect PSA levels"
              checked={state.medicineSupply.understandsPSAEffect}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "understandsPSAEffect",
                  value: v,
                })
              }
              description="Patient to tell any clinician conducting PSA tests that they take finasteride."
            />
          </div>
        );

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Continuous use for 3 to 6 months before stabilisation of hair loss can be expected; peak hair growth after 2 years; treatment must continue to maintain results"
              checked={state.counselling.effectOnsetTime}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "effectOnsetTime",
                  value: v,
                })
              }
            />
            <Checkbox
              label="If treatment is stopped, the beneficial effects begin to reverse by 6 months and return to baseline by 9 to 12 months"
              checked={state.counselling.hairLossResumesStopped}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "hairLossResumesStopped",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Sexual side effects possible"
              checked={state.counselling.sexualSideEffects}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "sexualSideEffects",
                  value: v,
                })
              }
              description="Reduced libido, erectile dysfunction, ejaculation disorders, breast tenderness or enlargement; reports of infertility / poor seminal quality"
            />
            <Checkbox
              label="Psychological side effects: report any mood changes"
              checked={state.counselling.moodChanges}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "moodChanges",
                  value: v,
                })
              }
              description="Depressed mood, depression and, less frequently, suicidal ideation have been reported; if these occur, stop finasteride and seek medical advice"
            />
            <Checkbox
              label="Promptly report any changes in breast tissue: lumps, pain, gynaecomastia or nipple discharge"
              checked={state.counselling.breastChanges}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "breastChanges",
                  value: v,
                })
              }
              description="Breast cancer has been reported in men taking finasteride 1 mg during the post-marketing period"
            />
            <Checkbox
              label="Review: first review after 3 to 6 months; reassess if no improvement after 12 months"
              checked={state.counselling.annualReview}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "annualReview",
                  value: v,
                })
              }
              description="3 to 12 months of treatment may be supplied between reviews"
            />
            <Checkbox
              label="Realistic expectations and safe use explained"
              checked={state.counselling.expectations}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "expectations",
                  value: v,
                })
              }
              description="Treatment slows hair loss and, to a lesser extent, produces regrowth; complete reversal is never achieved. Benefit demonstrated in men aged 18 to 41 and may be less above these ages. Do not take more than the recommended dose. Loss of scalp hair reduces protection against ultraviolet light, cold and mechanical injury. Hair loss can cause adverse psychosocial effects."
            />
            <Checkbox
              label="Seek medical advice if adverse effects are experienced or the patient becomes systemically very unwell"
              checked={state.counselling.reportChanges}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "reportChanges",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient information leaflet and the patient card included in the pack supplied"
              checked={state.counselling.pilAndCardSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "pilAndCardSupplied",
                  value: v,
                })
              }
            />
          </div>
        );

      case 7: // Summary
        return (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
              }
              placeholder="John Smith"
              required
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
              }
              placeholder="e.g. 2123456"
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
              }
              placeholder="High Street Pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
              }
              placeholder="123 High Street, London"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <HLSummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts.filter((a) => a.severity === "stop")}
        />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
       getConsultationData={getConsultationData}>
        {renderStep()}
      </StepWrapper>

      {doseRecommendation && state.currentStep >= 5 && (
        <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg p-4">
          <h3 className="font-semibold text-[color:var(--tenant-primary)] mb-2">Medicine Recommendation</h3>
          <div className="space-y-1 text-sm text-[color:var(--tenant-primary)]">
            <p>
              <span className="font-medium">Medicine:</span> {doseRecommendation.medicine}
            </p>
            <p>
              <span className="font-medium">Dose:</span> {doseRecommendation.dose}
            </p>
            <p>
              <span className="font-medium">Frequency:</span> {doseRecommendation.frequency}
            </p>
            <p>
              <span className="font-medium">Reason:</span> {doseRecommendation.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
