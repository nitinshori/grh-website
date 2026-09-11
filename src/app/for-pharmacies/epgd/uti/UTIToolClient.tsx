"use client";

import { useReducer, useState, useCallback, useMemo, useEffect } from "react";
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
  isNitrofurantoinContraindicated,
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

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
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

  // A stop anywhere disables Next on every step, including the patient and
  // consent steps (an age or renal stop can be raised there). The progress
  // bar only moves backwards, so the only route past a stop is "Save as not
  // supplied", which records the exclusion and the advice given.
  const canProceed = validationError === null && !isBlocked;

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
    // Backwards only: going forward always means pressing Next.
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // ─── Consultation Record Data (for saving to database) ───

  // Returns a record on every step, with or without a medicine, so an
  // excluded patient can be saved as not supplied from the step the stop was
  // raised. The computed alerts and recommendation are stored with it.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const med = state.medicineSelection.medicine;
    const medicine = !isBlocked && med
      ? {
          name: med === 'nitrofurantoin'
            ? 'Nitrofurantoin 100mg modified release capsules'
            : 'Trimethoprim 200mg tablets',
          medicine: med,
          dose: `${state.medicineSelection.dose} twice daily`,
          duration: state.medicineSelection.duration,
          quantity: medicineQuantity.toString(),
        }
      : undefined;
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: { ...state, alerts, doseRecommendation } as unknown as Record<string, unknown>,
      outcome: isBlocked ? 'not_supplied' : 'completed',
      medicine,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, isBlocked, medicineQuantity, alerts, doseRecommendation, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const isTrimethoprim = state.medicineSelection.medicine === "trimethoprim";

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
                Select the symptoms the patient is experiencing. Two or more of dysuria, new nocturia, frequency or urgency must be present. Where only one is present, refer rather than supply.
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
                label="New nocturia (new need to pass urine at night)"
                checked={state.symptoms.nocturia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { nocturia: v },
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
            </div>
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-sm text-navy-900">Sexually transmitted infection as an alternative diagnosis</h4>
              <p className="text-xs text-gray-600">
                Where discharge is present, or the history raises the possibility, do not supply under this PGD. Refer for chlamydia, gonorrhoea and trichomonas testing.
              </p>
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
              <Checkbox
                label="Pelvic pain"
                checked={state.symptoms.pelvicPain}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { pelvicPain: v },
                  })
                }
              />
              <Checkbox
                label="Intermenstrual or post-coital bleeding"
                checked={state.symptoms.abnormalBleeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { abnormalBleeding: v },
                  })
                }
              />
              <Checkbox
                label="New or recent sexual partner, or other history suggesting a sexually transmitted infection"
                checked={state.symptoms.stiHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { stiHistory: v },
                  })
                }
              />
            </div>
            <div>
              <SelectInput
                label="Duration of symptoms"
                required
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
                  { value: "> 7 days", label: "More than 7 days (excluded, refer)" },
                  { value: "unknown", label: "Cannot be established (excluded, refer)" },
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
                label="Indwelling urinary catheter, or a catheter removed within the last 7 days"
                checked={state.medicalHistory.catheterised}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { catheterised: v },
                  })
                }
              />
              <Checkbox
                label="An antibiotic has already been taken for this same episode (supplied here, by a GP, or obtained elsewhere)"
                checked={state.medicalHistory.antibioticThisEpisode}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { antibioticThisEpisode: v },
                  })
                }
                description="One course per episode. Refer."
              />
              <Checkbox
                label="Previous UTI within the last 4 weeks (recorded; not an exclusion in itself)"
                checked={state.medicalHistory.previousUTIWithin4Weeks}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { previousUTIWithin4Weeks: v },
                  })
                }
              />
              <p className="text-xs text-gray-600">
                Recurrent UTI means 2 or more episodes in the last 6 months, or 3 or more in the last 12 months. Ask both questions and record both answers.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectInput
                  label="UTI episodes in the last 6 months (before this one)"
                  value={state.medicalHistory.utiEpisodesLast6Months}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICAL_HISTORY",
                      payload: { utiEpisodesLast6Months: v as "" | "0" | "1" | "2+" },
                    })
                  }
                  required
                  options={[
                    { value: "0", label: "None" },
                    { value: "1", label: "1" },
                    { value: "2+", label: "2 or more (recurrent, refer)" },
                  ]}
                />
                <SelectInput
                  label="UTI episodes in the last 12 months (before this one)"
                  value={state.medicalHistory.utiEpisodesLast12Months}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICAL_HISTORY",
                      payload: { utiEpisodesLast12Months: v as "" | "0" | "1" | "2" | "3+" },
                    })
                  }
                  required
                  options={[
                    { value: "0", label: "None" },
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3+", label: "3 or more (recurrent, refer)" },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Kidney & Renal Function</h4>
              <p className="text-xs text-gray-600">
                Ask the patient directly: &quot;Have you ever been told you have kidney disease, or that your kidneys do not work as well as they should?&quot;
              </p>
              <Checkbox
                label="Answer YES: known kidney disease, or under any renal follow-up"
                checked={state.medicalHistory.kidneyDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { kidneyDisease: v },
                  })
                }
              />
              <SelectInput
                label="Patient's answer to the kidney question (record the answer given)"
                value={state.medicalHistory.renalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { renalImpairment: v as "" | "none" | "moderate" | "severe" | "unknown" },
                  })
                }
                options={[
                  { value: "none", label: "Answer NO: no known kidney disease (aged 16 to 59: proceed; aged 60 to 64: exclude)" },
                  { value: "unknown", label: "Patient does not know (exclude; refer for a renal function check first)" },
                  { value: "moderate", label: "Answer YES: moderate impairment (eGFR 30 to 44) (exclude)" },
                  { value: "severe", label: "Answer YES: severe impairment (eGFR under 30) (exclude)" },
                ]}
                required
              />
              <p className="text-xs text-gray-600">
                PGD v005 renal row: YES or under renal follow-up, exclude. NO and aged 16 to 59, proceed. NO but aged 60 to 64, or does not know, exclude and refer for a renal function check first. The document gives no route back to supply on a seen result.
              </p>
              <Checkbox
                label="Known structural or functional abnormality of the urinary tract, or renal stones"
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
                label="Diabetes, or any condition causing peripheral neuropathy"
                checked={state.medicalHistory.diabetesUncontrolled}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { diabetesUncontrolled: v },
                  })
                }
                description="Caution: increases the risk of nitrofurantoin-associated neuropathy. Counsel on new numbness or tingling."
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
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Nitrofurantoin arm exclusions</h4>
              <p className="text-xs text-gray-600">
                Any of these excludes nitrofurantoin. Trimethoprim may then be supplied only if its own gate is satisfied.
              </p>
              <Checkbox
                label="Known hypersensitivity to nitrofurantoin or to any excipient in the product"
                checked={state.medicalHistory.nitrofurantoinHypersensitivity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { nitrofurantoinHypersensitivity: v },
                  })
                }
              />
              <Checkbox
                label="Glucose-6-phosphate dehydrogenase (G6PD) deficiency"
                checked={state.medicalHistory.g6pdDeficiency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { g6pdDeficiency: v },
                  })
                }
                description="Nitrofurantoin causes haemolysis. Ask where the patient or their family originates from an area where G6PD deficiency is common."
              />
              <Checkbox
                label="Previous pulmonary reaction, peripheral neuropathy or hepatic reaction attributed to nitrofurantoin"
                checked={state.medicalHistory.previousNitrofurantoinReaction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { previousNitrofurantoinReaction: v },
                  })
                }
              />
              <Checkbox
                label="Acute porphyria"
                checked={state.medicalHistory.acutePorphyria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { acutePorphyria: v },
                  })
                }
              />
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <h4 className="font-semibold text-sm text-navy-900">Trimethoprim arm exclusions</h4>
              <p className="text-xs text-gray-600">
                Any of these excludes trimethoprim. Interactions are handled as exclusions, not cautions.
              </p>
              <Checkbox
                label="Known hypersensitivity to trimethoprim or to any excipient in the product"
                checked={state.medicalHistory.trimethoprimHypersensitivity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { trimethoprimHypersensitivity: v },
                  })
                }
              />
              <Checkbox
                label="Trimethoprim used in the last 3 months for any indication"
                checked={state.medicalHistory.trimethoprimLast3Months}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { trimethoprimLast3Months: v },
                  })
                }
                description="Resistance is likely. Do not supply trimethoprim again."
              />
              <Checkbox
                label="Known folate deficiency, megaloblastic anaemia, or any blood dyscrasia"
                checked={state.medicalHistory.folateDeficiencyOrBloodDyscrasia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { folateDeficiencyOrBloodDyscrasia: v },
                  })
                }
              />
              <Checkbox
                label="Taking methotrexate"
                checked={state.medicalHistory.takingMethotrexate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { takingMethotrexate: v },
                  })
                }
                description="The combination causes profound marrow suppression and can be fatal. Absolute exclusion."
              />
              <Checkbox
                label="Taking an ACE inhibitor, an angiotensin receptor blocker, spironolactone, eplerenone, amiloride or any other potassium-sparing agent"
                checked={state.medicalHistory.takingPotassiumSparingAgent}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { takingPotassiumSparingAgent: v },
                  })
                }
                description="Trimethoprim causes hyperkalaemia; the combination has been associated with sudden death in older patients."
              />
              <Checkbox
                label="Taking phenytoin, azathioprine, ciclosporin, digoxin, repaglinide or dofetilide"
                checked={state.medicalHistory.takingInteractingMedicine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { takingInteractingMedicine: v },
                  })
                }
              />
              <Checkbox
                label="Taking warfarin or any other coumarin anticoagulant"
                checked={state.medicalHistory.takingWarfarin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { takingWarfarin: v, anticoagulationServiceConsulted: v ? state.medicalHistory.anticoagulationServiceConsulted : false },
                  })
                }
                description="Trimethoprim raises the INR. Excluded unless the anticoagulation service has been consulted."
              />
              {state.medicalHistory.takingWarfarin && (
                <Checkbox
                  label="Anticoagulation service consulted and supply agreed"
                  checked={state.medicalHistory.anticoagulationServiceConsulted}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICAL_HISTORY",
                      payload: { anticoagulationServiceConsulted: v },
                    })
                  }
                />
              )}
              <Checkbox
                label="Known hepatic impairment"
                checked={state.medicalHistory.hepaticImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    payload: { hepaticImpairment: v },
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
                Appendix 1 red flags. Ask every patient, before supplying anything. If ANY is present, do not supply. Refer the same day.
              </p>
            </div>
            <div className="space-y-3 border-b border-gray-200 pb-4">
              <Checkbox
                label="Fever, rigors, or shivering"
                checked={state.symptoms.feverRigors}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { feverRigors: v },
                  })
                }
                description="A lower UTI does not cause fever. Suggests the infection has reached the kidney or the bloodstream."
              />
              <Checkbox
                label="Loin or flank pain, or back pain below the ribs"
                checked={state.symptoms.loinFlankPain}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { loinFlankPain: v },
                  })
                }
                description="Suggests pyelonephritis. A 3 day course will not treat it."
              />
              <Checkbox
                label="Nausea or vomiting"
                checked={state.symptoms.nauseaVomiting}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { nauseaVomiting: v },
                  })
                }
                description="Suggests upper tract involvement, and an oral antibiotic may not be absorbed."
              />
              <Checkbox
                label="Visible blood in the urine"
                checked={state.symptoms.haematuria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { haematuria: v },
                  })
                }
                description="Dipstick-only (non-visible) haematuria in a symptomatic woman is not by itself a red flag."
              />
              <Checkbox
                label="Confusion, new drowsiness, or feeling very unwell"
                checked={state.symptoms.confusionDrowsiness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { confusionDrowsiness: v },
                  })
                }
                description="Possible sepsis. Refer urgently."
              />
              <Checkbox
                label="Patient appears systemically unwell"
                checked={state.symptoms.systemicallyUnwell}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    payload: { systemicallyUnwell: v },
                  })
                }
              />
              <p className="text-xs text-gray-600">
                Pregnancy, symptoms over 7 days, an antibiotic already taken for this episode, a catheter, and recurrent UTI are also Appendix 1 red flags and are captured on the earlier steps.
              </p>
            </div>
            <Checkbox
              label="All Appendix 1 red flags have been asked about with this patient"
              checked={state.symptoms.redFlagsAsked}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SYMPTOMS",
                  payload: { redFlagsAsked: v },
                })
              }
              required
              description="Recorded on the consultation record, with the answers given."
            />
            {alerts.length === 0 ? (
              <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg px-4 py-3">
                <p className="text-sm text-[color:var(--tenant-primary)] font-semibold">
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
                Based on the clinical assessment, a medicine has been recommended. Only the two regimens the PGD states can be supplied; there is no override.
              </p>
            </div>
            <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] mb-2">RECOMMENDED DOSING:</p>
              <p className="text-sm text-[color:var(--tenant-primary)]">{doseRecommendation.dosingRegimen}</p>
              <p className="text-xs text-[color:var(--tenant-primary)] mt-1">{doseRecommendation.reason}</p>
            </div>
            <SelectInput
              label="Medicine"
              value={state.medicineSelection.medicine}
              onChange={(v) => {
                const medicine = v as "nitrofurantoin" | "trimethoprim" | "";
                dispatch({
                  type: "UPDATE_MEDICINE",
                  payload: {
                    medicine,
                    dose: medicine === "nitrofurantoin" ? "100mg" : medicine === "trimethoprim" ? "200mg" : "",
                    duration: "3 days",
                    quantity: getMedicineQuantity(medicine, "3 days"),
                    trimethoprimReason:
                      medicine === "trimethoprim"
                        ? isNitrofurantoinContraindicated(state.medicalHistory)
                          ? "contraindicated"
                          : state.medicineSelection.trimethoprimReason
                        : "",
                  },
                });
              }}
              required
              options={[
                { value: "nitrofurantoin", label: "Nitrofurantoin 100mg modified release capsules (first line)" },
                { value: "trimethoprim", label: "Trimethoprim 200mg tablets (second line, only where nitrofurantoin is unsuitable)" },
              ]}
            />
            {state.medicineSelection.medicine === "trimethoprim" && (
              <SelectInput
                label="Reason nitrofurantoin is unsuitable (recorded)"
                value={state.medicineSelection.trimethoprimReason}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE",
                    payload: { trimethoprimReason: v as "" | "contraindicated" | "intolerance" | "unavailable" },
                  })
                }
                required
                options={[
                  { value: "contraindicated", label: "Nitrofurantoin is contraindicated for this patient (for example G6PD deficiency or a previous nitrofurantoin reaction)" },
                  { value: "intolerance", label: "Intolerable adverse effect on nitrofurantoin previously" },
                  { value: "unavailable", label: "Nitrofurantoin not available in the pharmacy and cannot be obtained the same day" },
                ]}
              />
            )}
            {state.medicineSelection.medicine === "trimethoprim" && (
              <p className="text-xs text-amber-800">
                Patient preference is NOT a reason to use this arm. Where trimethoprim was used in the last 3 months for any indication, do not supply it again.
              </p>
            )}
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
              options={
                state.medicineSelection.medicine === "trimethoprim"
                  ? [{ value: "200mg", label: "200mg twice daily, about 12 hours apart, with or without food" }]
                  : [{ value: "100mg", label: "100mg twice daily, with food or milk" }]
              }
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
                { value: "3 days", label: "3 days (one course per episode, no repeat supply)" },
              ]}
            />
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
              <p className="font-medium">
                Quantity: <span className="text-[color:var(--tenant-primary)]">{medicineQuantity} {state.medicineSelection.medicine === "trimethoprim" ? "tablets" : "capsules"}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {state.medicineSelection.medicine === "trimethoprim"
                  ? "Trimethoprim 200mg tablets. A 3 day course. No repeat supply under this PGD."
                  : "Nitrofurantoin 100mg modified release capsules. A 3 day course. No repeat supply under this PGD."}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Maximum treatment period 3 days. A patient still symptomatic at 48 hours is referred, not re-supplied.
              </p>
            </div>
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
                label={
                  isTrimethoprim
                    ? "Take one tablet twice a day for 3 days. Finish the course even if symptoms settle sooner"
                    : "Take one capsule twice a day for 3 days. Finish the course even if symptoms settle sooner"
                }
                checked={state.counselling.completeCourse}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { completeCourse: v },
                  })
                }
                required
              />
              <Checkbox
                label={
                  isTrimethoprim
                    ? "Take the doses at evenly spaced intervals, about 12 hours apart"
                    : "Take with food or milk, to reduce nausea and because absorption is better"
                }
                checked={state.counselling.howToTake}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { howToTake: v },
                  })
                }
                required
              />
              {!isTrimethoprim && (
                <Checkbox
                  label="Your urine may go dark yellow or brown. That is expected and harmless"
                  checked={state.counselling.darkUrine}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      payload: { darkUrine: v },
                    })
                  }
                  required
                />
              )}
              <Checkbox
                label="Drink plenty of fluids"
                checked={state.counselling.hydrationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { hydrationAdvice: v },
                  })
                }
                required
              />
              <Checkbox
                label={
                  isTrimethoprim
                    ? "Seek advice promptly if you get a sore throat, fever, mouth ulcers, unusual bruising or bleeding (possible blood disorder)"
                    : "Stop and seek advice if you develop new numbness, tingling or pins and needles, or if you become short of breath"
                }
                checked={state.counselling.stopAndSeekAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { stopAndSeekAdvice: v },
                  })
                }
                required
              />
              <Checkbox
                label='48 HOUR safety netting given in these terms: "If you are no better in 48 hours, or you get worse at any point, contact your GP or NHS 111 the same day. Do not wait."'
                checked={state.counselling.symptomsToReturn}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { symptomsToReturn: v },
                  })
                }
                required
                description="Recorded on the consultation record, with what the patient was told to do."
              />
              <Checkbox
                label="Seek help IMMEDIATELY, not in 48 hours, for: a temperature, shivering or shaking uncontrollably; pain in the back or side, below the ribs; feeling sick or being sick; blood in the urine that they can see; confusion, drowsiness, or feeling very unwell; any new pain or bleeding in pregnancy, if pregnancy is a possibility"
                checked={state.counselling.immediateActionAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { immediateActionAdvice: v },
                  })
                }
                required
              />
              <Checkbox
                label="Paracetamol or ibuprofen can be used for the pain if they suit you (separate pharmacy sale, subject to the usual checks)"
                checked={state.counselling.painRelief}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { painRelief: v },
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
                label="Avoid sexual activity until symptoms resolve"
                checked={state.counselling.sexualActivityAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { sexualActivityAdvice: v },
                  })
                }
              />
              <Checkbox
                label="Patient information leaflet supplied with the product"
                checked={state.counselling.pilSupplied}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { pilSupplied: v },
                  })
                }
                required
              />
              <Checkbox
                label="Return any unused medicine to a pharmacy; do not flush or put in household waste"
                checked={state.counselling.disposalAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    payload: { disposalAdvice: v },
                  })
                }
                required
              />
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
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={isBlocked}
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
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
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
