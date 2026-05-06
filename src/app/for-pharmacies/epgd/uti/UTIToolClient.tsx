"use client";

import { useReducer, useState, useCallback, useMemo } from "react";
import { calculateAge, initialConsent, initialSummary } from "../shared/types";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import type { UTIConsultationState, UTIPatientDetails } from "./lib/uti-types";
import {
  initialUTIPatientDetails,
  initialUTISymptoms,
  initialUTIMedicalHistory,
  initialUTIObservations,
  initialUTIMedicineSelection,
  initialUTICounselling,
} from "./lib/uti-types";
import {
  getUTIClinicalAlerts,
  hasExclusionCriteria,
  getDoseRecommendation,
  getMedicineQuantity,
} from "./lib/uti-clinical-logic";
import {
  validateUTIStep,
  validateUTIPatientStep,
  validateUTISymptomStep,
  validateUTIMedicineSelectionStep,
  validateUTICounsellingStep,
  validateUTISummaryStep,
} from "./lib/uti-validation";
import { UTISummaryReport } from "./components/UTISummaryReport";

// ─── Step Titles ───

const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Symptom Assessment",
  "Medical History & Medications",
  "Observations",
  "Red Flags & Exclusions",
  "Medicine Selection",
  "Counselling",
  "Summary & Print",
] as const;

// ─── Action Types ───

type UTIAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "UPDATE_PATIENT"; payload: Partial<UTIPatientDetails> }
  | { type: "UPDATE_CONSENT"; payload: Partial<typeof initialConsent> }
  | { type: "UPDATE_SYMPTOMS"; payload: Partial<typeof initialUTISymptoms> }
  | { type: "UPDATE_MEDICAL_HISTORY"; payload: Partial<typeof initialUTIMedicalHistory> }
  | { type: "UPDATE_OBSERVATIONS"; payload: Partial<typeof initialUTIObservations> }
  | { type: "UPDATE_MEDICINE"; payload: Partial<typeof initialUTIMedicineSelection> }
  | { type: "UPDATE_COUNSELLING"; payload: Partial<typeof initialUTICounselling> }
  | { type: "UPDATE_SUMMARY"; payload: Partial<typeof initialSummary> }
  | { type: "RESET" };

// ─── Reducer ───

function utiReducer(state: UTIConsultationState, action: UTIAction): UTIConsultationState {
  switch (action.type) {
    case "SET_STEP":
      return state;
    case "UPDATE_PATIENT":
      return { ...state, patient: { ...state.patient, ...action.payload } };
    case "UPDATE_CONSENT":
      return { ...state, consent: { ...state.consent, ...action.payload } };
    case "UPDATE_SYMPTOMS":
      return { ...state, symptoms: { ...state.symptoms, ...action.payload } };
    case "UPDATE_MEDICAL_HISTORY":
      return { ...state, medicalHistory: { ...state.medicalHistory, ...action.payload } };
    case "UPDATE_OBSERVATIONS":
      return { ...state, observations: { ...state.observations, ...action.payload } };
    case "UPDATE_MEDICINE":
      return { ...state, medicineSelection: { ...state.medicineSelection, ...action.payload } };
    case "UPDATE_COUNSELLING":
      return { ...state, counselling: { ...state.counselling, ...action.payload } };
    case "UPDATE_SUMMARY":
      return { ...state, summary: { ...state.summary, ...action.payload } };
    case "RESET":
      return {
        patient: initialUTIPatientDetails(),
        consent: initialConsent,
        symptoms: initialUTISymptoms,
        medicalHistory: initialUTIMedicalHistory,
        observations: initialUTIObservations,
        medicineSelection: initialUTIMedicineSelection,
        counselling: initialUTICounselling,
        summary: initialSummary(),
      };
    default:
      return state;
  }
}

// ─── Main Component ───

export function UTIToolClient() {
  const initialState: UTIConsultationState = {
    patient: initialUTIPatientDetails(),
    consent: initialConsent,
    symptoms: initialUTISymptoms,
    medicalHistory: initialUTIMedicalHistory,
    observations: initialUTIObservations,
    medicineSelection: initialUTIMedicineSelection,
    counselling: initialUTICounselling,
    summary: initialSummary(),
  };

  const [state, dispatch] = useReducer(utiReducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Calculate age when DOB changes
  const handlePatientChange = useCallback(
    (field: keyof UTIPatientDetails, value: any) => {
      if (field === "dateOfBirth") {
        const age = calculateAge(value);
        dispatch({
          type: "UPDATE_PATIENT",
          payload: { [field]: value, age } as any,
        });
      } else {
        dispatch({
          type: "UPDATE_PATIENT",
          payload: { [field]: value } as any,
        });
      }
    },
    []
  );

  // Compute clinical alerts and recommendations
  const alerts = useMemo(
    () =>
      getUTIClinicalAlerts(
        state.patient,
        state.symptoms,
        state.medicalHistory,
        state.observations,
        state.medicineSelection
      ),
    [state.patient, state.symptoms, state.medicalHistory, state.observations, state.medicineSelection]
  );

  const isBlocked = useMemo(() => hasExclusionCriteria(alerts), [alerts]);

  const doseRecommendation = useMemo(
    () => getDoseRecommendation(state.medicalHistory, state.medicalHistory.allergies),
    [state.medicalHistory]
  );

  const medicineQuantity = useMemo(
    () => getMedicineQuantity(state.medicineSelection.medicine, state.medicineSelection.duration),
    [state.medicineSelection.medicine, state.medicineSelection.duration]
  );

  // Validation for current step
  const validationError = useMemo(() => {
    return validateUTIStep(currentStep, state);
  }, [currentStep, state]);

  // Clinical alerts should only block navigation from step 2 onwards (clinical steps).
  // Steps 0 (Patient Details) and 1 (Consent) should not be blocked by clinical logic
  // since the pharmacist hasn't entered clinical data yet.
  const isBlockedForStep = currentStep >= 2 && isBlocked;
  const canProceed = validationError === null && !isBlockedForStep;

  // Step navigation
  const handleNext = () => {
    if (canProceed && currentStep < STEP_LABELS.length - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.has(step) || step <= currentStep) {
      setCurrentStep(step);
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
      outcome: isBlocked ? 'not_supplied' : 'completed',
      medicine: {
        name: state.medicineSelection.medicine === 'nitrofurantoin'
          ? 'Nitrofurantoin 100mg MR'
          : 'Trimethoprim 200mg',
        dose: state.medicineSelection.dose,
        duration: state.medicineSelection.duration,
        quantity: medicineQuantity.toString(),
      },
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, isBlocked, medicineQuantity]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  // ─── RENDER STEP CONTENT ───

  const renderStepContent = () => {
    switch (currentStep) {
      // Step 0: Patient Details
      case 0:
        return (
          <div>
            <PatientDetailsStep
              patient={state.patient}
              onChange={handlePatientChange}
              genderOption={{
                label: "Patient is female",
                description: "This PGD is for female patients only. Male patients must be referred to GP.",
                checked: state.patient.femaleConfirmed,
                onToggle: (v: boolean) => handlePatientChange("femaleConfirmed", v),
              }}
            />
          </div>
        );

      // Step 1: Consent & ID
      case 1:
        return (
          <div>
            <ConsentStep
              consent={state.consent}
              onChange={(field: string, value: any) =>
                dispatch({ type: "UPDATE_CONSENT", payload: { [field]: value } })
              }
            />
          </div>
        );

      // Step 2: Symptom Assessment
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Select the symptoms the patient is experiencing. At least one main symptom (dysuria, frequency, or urgency) must be present.
              </p>
            </div>
            <div className="space-y-3">
              <Checkbox
                label="Dysuria (pain or burning on urination)"
                checked={state.symptoms.dysuria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { dysuria: v },
                  })
                }
              />
              <Checkbox
                label="Frequency (increased need to pass urine)"
                checked={state.symptoms.frequency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { frequency: v },
                  })
                }
              />
              <Checkbox
                label="Urgency (sudden, urgent need to pass urine)"
                checked={state.symptoms.urgency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { urgency: v },
                  })
                }
              />
              <Checkbox
                label="Suprapubic pain (pain above pubis)"
                checked={state.symptoms.suprapubicPain}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { suprapubicPain: v },
                  })
                }
              />
              <Checkbox
                label="Visible haematuria (blood in urine)"
                checked={state.symptoms.haematuria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { haematuria: v },
                  })
                }
              />
              <Checkbox
                label="Vaginal discharge"
                checked={state.symptoms.vaginalDischarge}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { vaginalDischarge: v },
                  })
                }
              />
            </div>
            <div>
              <SelectInput
                label="Duration of symptoms"
                value={state.symptoms.duration}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { duration: v },
                  })
                }
                options={[
                  { value: "< 3 days", label: "Less than 3 days" },
                  { value: "3-7 days", label: "3 to 7 days" },
                  { value: "> 7 days", label: "More than 7 days" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
            </div>
            <TextArea
              label="Additional notes"
              value={state.symptoms.additionalNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SYMPTOMS",
                  payload: { additionalNotes: v },
                })
              }
              placeholder="Any other relevant symptom details..."
              rows={3}
            />
          </div>
        );

      // Step 3: Medical History & Medications
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Review patient&apos;s medical history and current medications.
              </p>
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Pregnancy & Breastfeeding</h4>
              <Checkbox
                label="Currently pregnant"
                checked={state.medicalHistory.pregnant}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { pregnant: v },
                  })
                }
              />
              <Checkbox
                label="Pregnancy possible"
                checked={state.medicalHistory.pregnancyPossible}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { pregnancyPossible: v },
                  })
                }
              />
              <Checkbox
                label="Currently breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { breastfeeding: v },
                  })
                }
              />
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Catheterisation & UTI History</h4>
              <Checkbox
                label="Currently catheterised"
                checked={state.medicalHistory.catheterised}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { catheterised: v },
                  })
                }
              />
              <Checkbox
                label="Previous UTI within last 4 weeks"
                checked={state.medicalHistory.previousUTIWithin4Weeks}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { previousUTIWithin4Weeks: v },
                  })
                }
              />
              <Checkbox
                label="Recurrent UTI (3 or more within 12 months)"
                checked={state.medicalHistory.recurrentUTI}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { recurrentUTI: v },
                  })
                }
              />
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Kidney & Renal Function</h4>
              <Checkbox
                label="Known kidney disease"
                checked={state.medicalHistory.kidneyDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { kidneyDisease: v },
                  })
                }
              />
              <SelectInput
                label="Renal impairment level"
                value={state.medicalHistory.renalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { renalImpairment: v as any },
                  })
                }
                options={[
                  { value: "none", label: "None" },
                  { value: "moderate", label: "Moderate (eGFR 30-44)" },
                  { value: "severe", label: "Severe (eGFR <30)" },
                ]}
              />
              <Checkbox
                label="Known abnormal urinary tract anatomy"
                checked={state.medicalHistory.knownAbnormalUrinaryTract}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { knownAbnormalUrinaryTract: v },
                  })
                }
              />
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Other Conditions</h4>
              <Checkbox
                label="Uncontrolled diabetes"
                checked={state.medicalHistory.diabetesUncontrolled}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { diabetesUncontrolled: v },
                  })
                }
              />
              <Checkbox
                label="Immunosuppressed"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { immunosuppressed: v },
                  })
                }
              />
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-navy-900">Medications & Allergies</h4>
              <TextArea
                label="Current medications (list all)"
                value={state.medicalHistory.currentMedications}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { currentMedications: v },
                  })
                }
                placeholder="E.g. Lisinopril 10mg daily, Metformin 500mg BD..."
                rows={3}
              />
              <TextArea
                label="Known allergies (including antibiotics)"
                value={state.medicalHistory.allergies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { allergies: v },
                  })
                }
                placeholder="E.g. Penicillin, Nitrofurantoin, Sulphites..."
                rows={3}
              />
            </div>
          </div>
        );

      // Step 4: Observations
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Record vital observations if available. Temperature is particularly important to rule out pyelonephritis.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput
                label="Temperature"
                value={state.observations.temperature}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    payload: { temperature: v },
                  })
                }
                min={35}
                max={42}
                unit="°C"
                placeholder="e.g. 37.2"
              />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Systolic BP"
                  value={state.observations.systolicBP}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_OBSERVATIONS",
                      payload: { systolicBP: v },
                    })
                  }
                  min={60}
                  max={200}
                  unit="mmHg"
                  placeholder="e.g. 120"
                />
                <NumberInput
                  label="Diastolic BP"
                  value={state.observations.diastolicBP}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_OBSERVATIONS",
                      payload: { diastolicBP: v },
                    })
                  }
                  min={40}
                  max={120}
                  unit="mmHg"
                  placeholder="e.g. 80"
                />
              </div>
            </div>
          </div>
        );

      // Step 5: Red Flags & Exclusions
      case 5:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Review all identified clinical concerns. If any exclusion (red) criteria are present, this consultation cannot proceed and the patient must be referred to their GP.
              </p>
            </div>
            {alerts.length === 0 ? (
              <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                <p className="text-sm text-teal-800 font-semibold">
                  No exclusions or significant cautions identified. Safe to proceed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">{/* Alerts already shown in AlertBanner */}</div>
            )}
          </div>
        );

      // Step 6: Medicine Selection
      case 6:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Based on the clinical assessment, a medicine has been recommended. Confirm the selection or override if clinically appropriate.
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-teal-900 mb-2">RECOMMENDED DOSING:</p>
              <p className="text-sm text-teal-900">{doseRecommendation.dosingRegimen}</p>
              <p className="text-xs text-teal-800 mt-1">{doseRecommendation.reason}</p>
            </div>
            <SelectInput
              label="Medicine"
              value={state.medicineSelection.medicine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE",
                  payload: { medicine: v as any },
                })
              }
              required
              options={[
                { value: "nitrofurantoin", label: "Nitrofurantoin 100mg MR (first-line)" },
                { value: "trimethoprim", label: "Trimethoprim 200mg (if contraindication)" },
              ]}
            />
            <SelectInput
              label="Dose"
              value={state.medicineSelection.dose}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE",
                  payload: { dose: v },
                })
              }
              required
              options={[
                { value: "100mg/200mg", label: "100mg / 200mg per dose" },
              ]}
            />
            <SelectInput
              label="Duration"
              value={state.medicineSelection.duration}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE",
                  payload: {
                    duration: v,
                    quantity: getMedicineQuantity(state.medicineSelection.medicine, v),
                  },
                })
              }
              options={[
                { value: "3 days", label: "3 days (standard)" },
                { value: "7 days", label: "7 days" },
              ]}
            />
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
              <p className="font-medium">
                Quantity: <span className="text-teal-600">{medicineQuantity} doses</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {state.medicineSelection.medicine === "nitrofurantoin"
                  ? "Capsules (MR)"
                  : "Tablets"}
              </p>
            </div>
            <Checkbox
              label="Pharmacist override required"
              checked={state.medicineSelection.pharmacistOverride}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE",
                  payload: { pharmacistOverride: v },
                })
              }
              description="Check if deviating from standard recommendations for clinical reasons"
            />
            {state.medicineSelection.pharmacistOverride && (
              <TextArea
                label="Override reason"
                value={state.medicineSelection.overrideReason}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE",
                    payload: { overrideReason: v },
                  })
                }
                placeholder="Document clinical reasoning for override..."
                rows={3}
              />
            )}
          </div>
        );

      // Step 7: Counselling
      case 7:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Confirm counselling given on all topics before proceeding.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-navy-900">Counselling Points</h4>
              <Checkbox
                label="Complete the full course (all 6 doses over 3 days)"
                checked={state.counselling.completeCourse}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { completeCourse: v },
                  })
                }
              />
              <Checkbox
                label="Drink plenty of water and other fluids"
                checked={state.counselling.hydrationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { hydrationAdvice: v },
                  })
                }
              />
              <Checkbox
                label="Return to GP if symptoms not improving within 48 hours"
                checked={state.counselling.symptomsToReturn}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { symptomsToReturn: v },
                  })
                }
              />
              <Checkbox
                label="Cranberry products are not evidence-based for treatment"
                checked={state.counselling.avoidCranberry}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { avoidCranberry: v },
                  })
                }
              />
              <Checkbox
                label="Paracetamol can help with discomfort or pain"
                checked={state.counselling.painRelief}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { painRelief: v },
                  })
                }
              />
              <Checkbox
                label="Alkalinising agents may help ease symptoms"
                checked={state.counselling.alkalinisingAgents}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { alkalinisingAgents: v },
                  })
                }
              />
              <Checkbox
                label="Avoid sexual activity until symptoms resolve"
                checked={state.counselling.sexualActivityAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { sexualActivityAdvice: v },
                  })
                }
              />
              {state.medicalHistory.pregnancyPossible && (
                <Checkbox
                  label="Discussed contraception and confirmed not at risk of pregnancy"
                  checked={state.counselling.pregnancyPrecautions}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      payload: { pregnancyPrecautions: v },
                    })
                  }
                />
              )}
            </div>
          </div>
        );

      // Step 8: Summary & Print
      case 8:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-blue-800">
                Review the consultation record. Enter pharmacist details and then print for the patient&apos;s record.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    payload: { pharmacistName: v },
                  })
                }
                required
                placeholder="Your name"
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    payload: { pharmacistGPhC: v },
                  })
                }
                required
                placeholder="e.g. 123456"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    payload: { pharmacyName: v },
                  })
                }
                placeholder="Your pharmacy"
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    payload: { pharmacyAddress: v },
                  })
                }
                placeholder="Address"
              />
            </div>
            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  payload: { clinicalNotes: v },
                })
              }
              placeholder="Any additional clinical notes for the record..."
              rows={4}
            />
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6 print:hidden">
              <p className="text-sm font-semibold text-navy-900 mb-2">
                Summary Report Preview
              </p>
              <div className="border-t border-gray-300 pt-4">
                <UTISummaryReport state={state} alerts={alerts} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={validationError !== null || isBlocked}
      />

      {currentStep === 8 ? (
        <div className="print:hidden">
          <StepWrapper
            title={STEP_LABELS[currentStep]}
            description="Review and print the consultation record"
            currentStep={currentStep}
            totalSteps={STEP_LABELS.length}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={validationError === null}
            validationError={validationError}
            isBlocked={false}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            {renderStepContent()}
          </StepWrapper>
        </div>
      ) : (
        <StepWrapper
          title={STEP_LABELS[currentStep]}
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceed}
          validationError={validationError}
          isBlocked={isBlockedForStep}
        >
          {renderStepContent()}
        </StepWrapper>
      )}

      {/* Print-only version */}
      <div className="hidden print:block">
        <UTISummaryReport state={state} alerts={alerts} />
      </div>
    </div>
  );
}
