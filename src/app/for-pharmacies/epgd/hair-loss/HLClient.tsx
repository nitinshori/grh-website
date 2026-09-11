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
  NORWOOD_STAGES,
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
      if (action.field === "sexRecorded") {
        newState.patient.maleConfirmed = action.value === "male";
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

    case "RESET":
      // Fresh state objects, including a fresh date and time.
      return createInitialConsultationState();
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

  // A stop anywhere disables Next on every step, and the last step's
  // Save & Print applies the same rule (no "last step always true").
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && !hardStops && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      if (state.currentStep === 0) {
        // Contemporaneous record: stamp the date and time when the
        // consultation actually starts, not when the tab was opened.
        dispatch({ type: "UPDATE_SUMMARY", field: "consultationDate", value: new Date().toISOString().split("T")[0] });
        dispatch({
          type: "UPDATE_SUMMARY",
          field: "consultationTime",
          value: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        });
      }
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, hardStops, completedSteps]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Backwards only: going forward always means pressing Next, where the
  // gates are.
  const handleStepClick = useCallback((step: number) => {
    if (step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [state.currentStep]);

  // ─── Step content rendering ───


  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const ms = state.medicineSupply;
    const supplied = !hardStops && ms.finasteride1mgOd && !!ms.quantityMonths;
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
      clinicalData: { ...state, alerts } as unknown as Record<string, unknown>,
      outcome: hardStops ? "not_supplied" : "completed",
      medicine: supplied
        ? {
            name: `Finasteride 1 mg tablets${ms.brand ? ` (${ms.brand})` : ""}`,
            dose: "1 mg orally once daily",
            duration: `${ms.quantityMonths} months`,
            quantity: `${ms.tabletsSupplied ?? "?"} tablets (${ms.quantityMonths} months)`,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: [state.summary.clinicalNotes, hardStops && state.summary.exclusionAdvice ? `Advice given (excluded): ${state.summary.exclusionAdvice}` : ""]
          .filter(Boolean)
          .join("\n"),
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hardStops, alerts, __pharmProfile]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <div className="space-y-4">
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field: field as keyof HLPatientDetails, value })
              }
            />
            <SelectInput
              label="Patient sex"
              value={state.patient.sexRecorded}
              onChange={(v) => dispatch({ type: "UPDATE_PATIENT", field: "sexRecorded", value: v })}
              options={[
                { value: "male", label: "Male" },
                { value: "not-male", label: "Female or other (excluded under this PGD)" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">
              This PGD is for male patients aged 18 to 65 only: finasteride is teratogenic and is not indicated in women. Address and GP practice are required for the PGD record.
            </p>
          </div>
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
            <SelectInput
              label="Norwood-Hamilton Scale (stage of male-pattern hair loss, 1 to 7)"
              value={state.clinicalAssessment.norwoodHamiltonScale === null ? "" : String(state.clinicalAssessment.norwoodHamiltonScale)}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "norwoodHamiltonScale",
                  value: v === "" ? null : Number(v),
                })
              }
              options={NORWOOD_STAGES.map(([n, text]) => ({ value: String(n), label: `Stage ${n}: ${text}` }))}
              required
            />
            <p className="text-xs text-gray-500">
              The Norwood-Hamilton scale is the standard picture chart for male-pattern hair loss: 1 is no visible recession and 7 is hair only around the sides and back. Choose the stage that best matches the patient.
            </p>
            <Checkbox
              label="Androgenetic alopecia (male-pattern baldness) confirmed (required)"
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
              label="Family history of male-pattern baldness (optional)"
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
            <p className="text-xs text-gray-600">
              Ask the patient each question below. Tick the box if the answer is Yes; leave it unticked if the answer is No. Unticked boxes are recorded as No. Then tick the confirmation at the bottom.
            </p>
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
                label="Prostate cancer details"
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
                label="PSA details"
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
            <div className="pt-3 border-t border-gray-200">
              <Checkbox
                label="I have asked the patient every question above; ticked boxes are Yes and unticked boxes are No (required)"
                checked={state.medicalHistory.questionsAsked}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "questionsAsked", value: v })
                }
                required
              />
            </div>
          </div>
        );

      case 4: // Contraindications
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Ask the patient about mood, depression and suicidal thoughts. Tick a box if the answer is Yes; leave it unticked if the answer is No. Then tick the confirmation at the bottom.
            </p>
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
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
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
                  required
                />
                <Checkbox
                  label="Not supplying: referring the patient for medical review of their mood symptoms instead"
                  checked={state.contraindications.moodReferred}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "moodReferred", value: v })
                  }
                  description="Tick this to record a referral instead of a supply. The consultation can then be saved as not supplied."
                />
                {!state.contraindications.moodReferred && (
                <TextArea
                  label="Clinical reason for proceeding despite current depression or mood symptoms (required if supplying)"
                  value={state.contraindications.moodProceedReason}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CONTRAINDICATIONS",
                      field: "moodProceedReason",
                      value: v,
                    })
                  }
                  placeholder="e.g. Historical low mood, stable and treated; patient counselled to stop and seek advice if mood worsens"
                  rows={2}
                  required
                />
                )}
              </div>
            )}
            <Checkbox
              label="Patient reports current suicidal ideation"
              checked={state.contraindications.suicidalIdeation}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "suicidalIdeation",
                  value: v,
                })
              }
              description="Stop: do not start finasteride; refer for medical assessment today (emergency services if at immediate risk)."
            />
            <div className="pt-3 border-t border-gray-200">
              <Checkbox
                label="I have asked the patient about mood, depression and suicidal ideation; ticked boxes are Yes and unticked boxes are No (required)"
                checked={state.contraindications.questionsAsked}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "questionsAsked", value: v })
                }
                required
              />
            </div>
          </div>
        );

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply finasteride 1 mg tablets, 1 mg orally once daily, with or without food (required)"
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
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectInput
                label="Tablets supplied"
                value={state.medicineSupply.tabletsSupplied === null ? "" : String(state.medicineSupply.tabletsSupplied)}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "tabletsSupplied",
                    value: v === "" ? null : Number(v),
                  })
                }
                options={
                  state.medicineSupply.quantityMonths
                    ? [28, 30].map((perPack) => {
                        const n = perPack * Number(state.medicineSupply.quantityMonths);
                        return { value: String(n), label: `${n} tablets (${state.medicineSupply.quantityMonths} x ${perPack})` };
                      })
                    : []
                }
                required
                disabled={!state.medicineSupply.quantityMonths}
              />
              <TextInput
                label="Brand dispensed"
                value={state.medicineSupply.brand}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "brand", value: v })
                }
                placeholder="e.g. Propecia, or generic finasteride 1 mg (manufacturer)"
                required
              />
            </div>
            <Checkbox
              label="Advised: tablets must not be handled by women who are or may become pregnant (risk of fetal harm); partner informed if applicable (required)"
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
              label="Advised: condom recommended if a female partner is pregnant or likely to become pregnant (required)"
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
              label="Patient will monitor for sexual side effects (required)"
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
              label="Patient understands finasteride can affect PSA levels (required)"
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
            <p className="text-xs text-gray-600">Tick each counselling point once it has been covered with the patient. All are required.</p>
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
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Consultation date"
                type="date"
                value={state.summary.consultationDate}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "consultationDate", value: v })}
                required
              />
              <TextInput
                label="Consultation time"
                type="time"
                value={state.summary.consultationTime}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "consultationTime", value: v })}
              />
            </div>
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <div className="border border-gray-200 rounded-lg">
              <HLSummaryReport state={state} alerts={alerts} hasStops={hardStops} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="print:hidden space-y-6">
      <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {/* Every alert, not only stops: the mood, fetal-harm and PSA cautions
          were computed and never shown on screen. AlertBanner sorts by
          severity. */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {hardStops && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <TextArea
            label="Advice given to the excluded patient and referral made (recorded with the not-supplied record)"
            value={state.summary.exclusionAdvice}
            onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "exclusionAdvice", value: v })}
            placeholder="e.g. Advised that finasteride cannot be supplied under this PGD; referred to GP; written information given"
            rows={2}
          />
        </div>
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
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
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

      {/* Print view: the consultation record */}
      <div className="hidden print:block">
        <HLSummaryReport state={state} alerts={alerts} hasStops={hardStops} />
      </div>
    </div>
  );
}
