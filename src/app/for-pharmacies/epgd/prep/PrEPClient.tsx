"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  PrEPConsultationState,
  PrEPAction,
  PrEPPatientDetails,
  PrEPRiskAssessment,
  PrEPBaselineTests,
  PrEPMedicalHistory,
  PrEPContraindications,
  PrEPMedicineSupply,
  PrEPCounselling,
} from "./lib/prep-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/prep-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  checkHivTestTiming,
} from "./lib/prep-clinical-logic";
import { validateStep } from "./lib/prep-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { PrEPSummaryReport } from "./components/PrEPSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: PrEPConsultationState, action: PrEPAction): PrEPConsultationState {
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

    case "UPDATE_RISK_ASSESSMENT":
      newState.riskAssessment = {
        ...newState.riskAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_BASELINE_TESTS":
      newState.baselineTests = {
        ...newState.baselineTests,
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

export default function PrEPClient() {
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
  const hivTestValid = useMemo(() => checkHivTestTiming(state.baselineTests.hivTestDate), [state.baselineTests.hivTestDate]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
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
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="First name"
                value={state.patient.firstName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "firstName", value: v })
                }
                required
                placeholder="John"
              />
              <TextInput
                label="Last name"
                value={state.patient.lastName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "lastName", value: v })
                }
                required
                placeholder="Smith"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Date of birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.patient.dateOfBirth}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "dateOfBirth", value: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Age (auto-calculated)
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
                  {state.patient.age !== null ? (
                    <>
                      {state.patient.age} years
                      {state.patient.age < 18 && (
                        <span className="ml-2 text-red-500 text-xs font-medium">
                          Minimum age 18
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Enter DOB above</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="GP name"
                value={state.patient.gpName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "gpName", value: v })
                }
                placeholder="Dr. Jane Doe"
              />
              <TextInput
                label="GP practice"
                value={state.patient.gpPractice}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "gpPractice", value: v })
                }
                placeholder="High Street Medical Centre"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="NHS number (optional)"
                value={state.patient.nhsNumber}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "nhsNumber", value: v })
                }
                placeholder="123 456 7890"
              />
              <TextInput
                label="Phone (optional)"
                value={state.patient.phone}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "phone", value: v })
                }
                type="tel"
                placeholder="07..."
              />
            </div>
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

      case 2: // Risk Assessment
        return (
          <div className="space-y-4">
            <Checkbox
              label="MSM (men who have sex with men)"
              checked={state.riskAssessment.msm}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "msm",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Trans person"
              checked={state.riskAssessment.transPerson}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "transPerson",
                  value: v,
                })
              }
            />
            {state.riskAssessment.transPerson && (
              <TextInput
                label="Details (trans male, trans female, other)"
                value={state.riskAssessment.transPersonDetails}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "transPersonDetails",
                    value: v,
                  })
                }
              />
            )}
            <Checkbox
              label="Heterosexual with HIV-positive partner"
              checked={state.riskAssessment.heterosexualWithHivPartner}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "heterosexualWithHivPartner",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Sex worker or partner of sex worker"
              checked={state.riskAssessment.sexWorkerOrPartner}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "sexWorkerOrPartner",
                  value: v,
                })
              }
            />
            <Checkbox
              label="PWID (people who inject drugs)"
              checked={state.riskAssessment.pwid}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "pwid",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Chemsex (recreational drug use with sexual activity)"
              checked={state.riskAssessment.chemsex}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "chemsex",
                  value: v,
                })
              }
            />
            <TextInput
              label="Other risk factors (optional)"
              value={state.riskAssessment.otherRiskFactors}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "otherRiskFactors",
                  value: v,
                })
              }
              placeholder="Any additional risk factors"
            />
          </div>
        );

      case 3: // Baseline Testing
        return (
          <div className="space-y-4">
            <Checkbox
              label="HIV negative test confirmed"
              checked={state.baselineTests.hivTestConfirmedNegative}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_BASELINE_TESTS",
                  field: "hivTestConfirmedNegative",
                  value: v,
                })
              }
              description="Baseline HIV negative result required before PrEP"
            />
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                HIV test date (must be within 4 weeks)
              </label>
              <input
                type="date"
                value={state.baselineTests.hivTestDate}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BASELINE_TESTS",
                    field: "hivTestDate",
                    value: e.target.value,
                  })
                }
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
              {state.baselineTests.hivTestDate && !hivTestValid && (
                <p className="text-xs text-red-600 mt-1">Test date is &gt;4 weeks old</p>
              )}
            </div>
            <Checkbox
              label="Hepatitis B antigen test completed"
              checked={state.baselineTests.hepatitisBAntigen}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_BASELINE_TESTS",
                  field: "hepatitisBAntigen",
                  value: v,
                })
              }
            />
            {state.baselineTests.hepatitisBAntigen && (
              <SelectInput
                label="Hepatitis B result"
                value={state.baselineTests.hepatitisBAntigenResult}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_BASELINE_TESTS",
                    field: "hepatitisBAntigenResult",
                    value: v,
                  })
                }
                options={[
                  { value: "negative", label: "Negative" },
                  { value: "positive", label: "Positive" },
                  { value: "unknown", label: "Unknown/Inconclusive" },
                ]}
                required
              />
            )}
            <NumberInput
              label="eGFR (mL/min/1.73m²) — must be ≥60"
              value={state.baselineTests.eGfr}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_BASELINE_TESTS",
                  field: "eGfr",
                  value: v,
                })
              }
              min={0}
              placeholder="eGFR value"
              required
            />
            {state.baselineTests.eGfr !== null && state.baselineTests.eGfr < 60 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-700">
                  eGFR below 60 is contraindicated for PrEP (nephrotoxicity risk).
                </p>
              </div>
            )}
            <Checkbox
              label="STI screening completed"
              checked={state.baselineTests.stiScreening}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_BASELINE_TESTS",
                  field: "stiScreening",
                  value: v,
                })
              }
              description="Chlamydia/Gonorrhoea, Syphilis, HIV, Hep B/C"
            />
          </div>
        );

      case 4: // Medical History
        return (
          <div className="space-y-4">
            <Checkbox
              label="Active Hepatitis B infection"
              checked={state.medicalHistory.activeHepatitisB}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "activeHepatitisB",
                  value: v,
                })
              }
              description="Risk of flare on stopping PrEP"
            />
            <Checkbox
              label="Severe kidney disease (eGFR <30)"
              checked={state.medicalHistory.severeKidneyDisease}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "severeKidneyDisease",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Bone density issues"
              checked={state.medicalHistory.boneDensityIssues}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "boneDensityIssues",
                  value: v,
                })
              }
              description="Tenofovir may affect bone density in prolonged use"
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
              placeholder="e.g. diabetes, hypertension"
            />
          </div>
        );

      case 5: // Contraindications
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Hard stops — do not supply PrEP
              </p>
            </div>
            <Checkbox
              label="HIV positive"
              checked={state.contraindications.hivPositive}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "hivPositive",
                  value: v,
                })
              }
              description="PrEP is for HIV-negative individuals only"
            />
            <Checkbox
              label="eGFR <60 mL/min/1.73m²"
              checked={state.contraindications.eGfrBelow60}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "eGfrBelow60",
                  value: v,
                })
              }
              description="Tenofovir nephrotoxicity risk"
            />
            <Checkbox
              label="Unknown HIV status"
              checked={state.contraindications.unknownHivStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "unknownHivStatus",
                  value: v,
                })
              }
              description="Baseline HIV negative must be confirmed"
            />
          </div>
        );

      case 6: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply Emtricitabine/Tenofovir disoproxil 200/245mg"
              checked={state.medicineSupply.emtricitabineTenofovir200245}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "emtricitabineTenofovir200245",
                  value: v,
                })
              }
            />
            <SelectInput
              label="PrEP dosing regimen"
              value={state.medicineSupply.dosingRegimen}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "dosingRegimen",
                  value: v,
                })
              }
              options={[
                {
                  value: "daily",
                  label: "Daily (1 tablet OD — 7 days receptive anal, 21 days vaginal protection)",
                },
                {
                  value: "event-based",
                  label: "Event-based/On-demand (2+1+1 regimen)",
                },
              ]}
              required
            />
            {state.medicineSupply.dosingRegimen === "daily" && (
              <Checkbox
                label="Patient understands daily dosing"
                checked={state.medicineSupply.understandsDailyDosing}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "understandsDailyDosing",
                    value: v,
                  })
                }
                description="1 tablet every day. Takes 7 days for receptive anal sex, 21 days for vaginal protection"
              />
            )}
            {state.medicineSupply.dosingRegimen === "event-based" && (
              <Checkbox
                label="Patient understands event-based dosing"
                checked={state.medicineSupply.understandsEventBased}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "understandsEventBased",
                    value: v,
                  })
                }
                description="2 tablets 2-24hrs before, 1 tablet 24hrs after, 1 tablet 48hrs after exposure"
              />
            )}
            <Checkbox
              label="Renal monitoring arranged (every 3-6 months)"
              checked={state.medicineSupply.renalMonitoring}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "renalMonitoring",
                  value: v,
                })
              }
              description="Tenofovir requires regular eGFR monitoring"
            />
          </div>
        );

      case 7: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="NOT a substitute for condoms and other prevention"
              checked={state.counselling.notSubstituteForCondoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "notSubstituteForCondoms",
                  value: v,
                })
              }
              description="Must be used alongside condoms and safe sex practices"
            />
            <Checkbox
              label="Regular HIV testing required (every 3 months)"
              checked={state.counselling.regularHivTesting}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "regularHivTesting",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Renal monitoring every 3-6 months"
              checked={state.counselling.renalMonitoring}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "renalMonitoring",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Take with food"
              checked={state.counselling.takeWithFood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "takeWithFood",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Adherence is critical for effectiveness"
              checked={state.counselling.adherenceCritical}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "adherenceCritical",
                  value: v,
                })
              }
              description="Missed doses reduce protection"
            />
            <Checkbox
              label="Management of missed doses"
              checked={state.counselling.missedDose}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "missedDose",
                  value: v,
                })
              }
              description="For daily: take as soon as remembered. For event-based: restart schedule"
            />
            <Checkbox
              label="PEP available if exposed while off PrEP"
              checked={state.counselling.pepAvailable}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "pepAvailable",
                  value: v,
                })
              }
              description="Post-exposure prophylaxis within 72 hours of exposure"
            />
          </div>
        );

      case 8: // Summary
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
            <PrEPSummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
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

      {doseRecommendation && state.currentStep >= 6 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-semibold text-teal-900 mb-2">Medicine Recommendation</h3>
          <div className="space-y-1 text-sm text-teal-800">
            <p>
              <span className="font-medium">Medicine:</span> {doseRecommendation.medicine}
            </p>
            <p>
              <span className="font-medium">Dose:</span> {doseRecommendation.dose}
            </p>
            <p>
              <span className="font-medium">Dosing:</span> {doseRecommendation.dosingRegimen}
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
