"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  STIConsultationState,
  STIAction,
  STIPatientDetails,
  STIRiskAssessment,
  STIClinicalAssessment,
  STITestSelection,
  STICounselling,
} from "./lib/sti-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/sti-types";
import {
  getAllAlerts,
  getRecommendedTests,
  getTreatmentPlan,
} from "./lib/sti-clinical-logic";
import { validateStep } from "./lib/sti-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { PostcodeLookup } from "../shared/components/PostcodeLookup";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { STISummaryReport } from "./components/STISummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: STIConsultationState, action: STIAction): STIConsultationState {
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

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_TEST_SELECTION":
      newState.testSelection = {
        ...newState.testSelection,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_TREATMENT":
      newState.treatment = {
        ...newState.treatment,
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

export default function STIClient() {
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
  const recommendedTests = useMemo(() => getRecommendedTests(state), [state]);
  const treatmentPlan = useMemo(() => getTreatmentPlan(state), [state]);
  const hasStops = useMemo(() => alerts.some((a) => a.severity === "stop"), [alerts]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    return !validationError;
  }, [state, validationError]);

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
      outcome: hasStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
                      {state.patient.age < 13 && (
                        <span className="ml-2 text-red-500 text-xs font-medium">
                          Under 13: do not supply, refer the same day and make a safeguarding referral
                        </span>
                      )}
                      {state.patient.age >= 13 && state.patient.age <= 15 && (
                        <span className="ml-2 text-amber-600 text-xs font-medium">
                          13 to 15: Fraser competence and safeguarding assessment required
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Enter DOB above</span>
                  )}
                </div>
              </div>
            </div>
            {state.patient.age !== null && state.patient.age >= 13 && state.patient.age <= 15 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-amber-900">
                  Aged 13 to 15: supply only where Fraser competence is assessed and recorded and a
                  safeguarding assessment is completed with no concern
                </p>
                <Checkbox
                  label="Fraser competence assessed and recorded"
                  checked={state.patient.fraserCompetent}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "fraserCompetent", value: v })
                  }
                  description="The young person understands the advice, cannot be persuaded to involve a parent, and their best interests require supply."
                />
                <Checkbox
                  label="Safeguarding assessment completed (partner age, coercion, exploitation indicators)"
                  checked={state.patient.safeguardingAssessed}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "safeguardingAssessed", value: v })
                  }
                />
                <Checkbox
                  label="Safeguarding concern identified (partner 18 or over, coercion, exploitation, learning disability)"
                  checked={state.patient.safeguardingConcern}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "safeguardingConcern", value: v })
                  }
                  description="If ticked: do not supply. Refer and follow the local safeguarding pathway."
                />
                <TextArea
                  label="Safeguarding assessment record"
                  value={state.patient.safeguardingNotes}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "safeguardingNotes", value: v })
                  }
                  placeholder="Partner age, any coercion or exploitation indicators, outcome and any referral made"
                  rows={3}
                  required
                />
              </div>
            )}
            <SelectInput
              label="Gender identity"
              value={state.patient.genderIdentity}
              onChange={(v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "genderIdentity", value: v })
              }
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "trans-male", label: "Trans male" },
                { value: "trans-female", label: "Trans female" },
                { value: "non-binary", label: "Non-binary" },
              ]}
              required
            />
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
            <PostcodeLookup
              onResolved={({ town, postcode }) => {
                const locality = [town, postcode].filter(Boolean).join(", ");
                const current = state.patient.address?.trim();
                dispatch({
                  type: "UPDATE_PATIENT",
                  field: "address",
                  value: current ? `${current}, ${locality}` : locality,
                });
              }}
              onAddressSelected={({ address, postcode }) => {
                dispatch({
                  type: "UPDATE_PATIENT",
                  field: "address",
                  value: [address, postcode].filter(Boolean).join(", "),
                });
              }}
            />
            <TextInput
              label="Patient address"
              value={state.patient.address}
              onChange={(v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "address", value: v })
              }
              placeholder="123 High Street, Leeds"
            />
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
            <NumberInput
              label="Number of sexual partners (last 3 months)"
              value={state.riskAssessment.numberOfPartners}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "numberOfPartners",
                  value: v,
                })
              }
              min={0}
              required
            />
            <SelectInput
              label="Condom usage"
              value={state.riskAssessment.condomUsage}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "condomUsage",
                  value: v,
                })
              }
              options={[
                { value: "never", label: "Never" },
                { value: "sometimes", label: "Sometimes" },
                { value: "always", label: "Always" },
              ]}
              required
            />
            <Checkbox
              label="History of STI"
              checked={state.riskAssessment.previousSTIs}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "previousSTIs",
                  value: v,
                })
              }
            />
            {state.riskAssessment.previousSTIs && (
              <TextInput
                label="Details (which STI, when treated)"
                value={state.riskAssessment.previousStiDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "previousStiDetail",
                    value: v,
                  })
                }
              />
            )}
            <Checkbox
              label="Current symptoms"
              checked={state.riskAssessment.currentSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "currentSymptoms",
                  value: v,
                })
              }
            />
            {state.riskAssessment.currentSymptoms && (
              <TextInput
                label="Symptom details"
                value={state.riskAssessment.symptomDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "symptomDetail",
                    value: v,
                  })
                }
                placeholder="Discharge, pain, rash, etc."
              />
            )}
            <Checkbox
              label="MSM (men who have sex with men)"
              checked={state.riskAssessment.msmStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "msmStatus",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Sex worker or partner of sex worker"
              checked={state.riskAssessment.sexWorker}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "sexWorker",
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
              label="Recent travel to high-prevalence area"
              checked={state.riskAssessment.recentTravel}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "recentTravel",
                  value: v,
                })
              }
            />
            {state.riskAssessment.recentTravel && (
              <TextInput
                label="Travel details"
                value={state.riskAssessment.travelDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "travelDetail",
                    value: v,
                  })
                }
                placeholder="Country, dates, sexual activity"
              />
            )}
          </div>
        );

      case 3: // Clinical Assessment
        return (
          <div className="space-y-4">
            <Checkbox
              label="Urethral discharge"
              checked={state.clinicalAssessment.urethralDischarge}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "urethralDischarge",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Genital pain or dysuria"
              checked={state.clinicalAssessment.genitalPain}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "genitalPain",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Rectal symptoms (discharge, pain, bleeding)"
              checked={state.clinicalAssessment.rectalSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "rectalSymptoms",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Pharyngeal symptoms (sore throat)"
              checked={state.clinicalAssessment.pharyngealSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "pharyngealSymptoms",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Systemic symptoms (fever, rash, lymphadenopathy)"
              checked={state.clinicalAssessment.systemicSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "systemicSymptoms",
                  value: v,
                })
              }
            />
            {state.clinicalAssessment.systemicSymptoms && (
              <TextInput
                label="Details"
                value={state.clinicalAssessment.systemicDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "systemicDetail",
                    value: v,
                  })
                }
              />
            )}
          </div>
        );

      case 4: // Test Selection
        return (
          <div className="space-y-4">
            {recommendedTests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Recommended tests:</p>
                <ul className="text-xs text-blue-800 list-disc list-inside">
                  {recommendedTests.map((test) => (
                    <li key={test}>{test}</li>
                  ))}
                </ul>
              </div>
            )}
            <Checkbox
              label="Chlamydia/Gonorrhoea (CT/GC) NAAT"
              checked={state.testSelection.ctGc}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "ctGc",
                  value: v,
                })
              }
            />
            {state.testSelection.ctGc && (
              <SelectInput
                label="Sample type for CT/GC"
                value={state.testSelection.ctGcSampleType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_TEST_SELECTION",
                    field: "ctGcSampleType",
                    value: v,
                  })
                }
                options={[
                  { value: "urine", label: "Urine" },
                  { value: "urethral-swab", label: "Urethral swab" },
                  { value: "vaginal-swab", label: "Vaginal swab" },
                  { value: "rectal-swab", label: "Rectal swab" },
                  { value: "pharyngeal-swab", label: "Pharyngeal swab" },
                ]}
                required
              />
            )}
            <Checkbox
              label="HIV (4th gen Ag/Ab or rapid test)"
              checked={state.testSelection.hiv}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hiv",
                  value: v,
                })
              }
            />
            {state.testSelection.hiv && (
              <SelectInput
                label="HIV test type"
                value={state.testSelection.hivTestType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_TEST_SELECTION",
                    field: "hivTestType",
                    value: v,
                  })
                }
                options={[
                  { value: "rapid", label: "Rapid test (results <15 mins)" },
                  { value: "lab", label: "Lab 4th generation test" },
                ]}
                required
              />
            )}
            <Checkbox
              label="Syphilis serology (RPR/TPPA)"
              checked={state.testSelection.syphilis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "syphilis",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hepatitis B"
              checked={state.testSelection.hepatitisB}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hepatitisB",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hepatitis C"
              checked={state.testSelection.hepatitisC}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hepatitisC",
                  value: v,
                })
              }
            />
          </div>
        );

      case 5: // Treatment (chlamydia PGD v002: doxycycline first line, azithromycin where doxycycline unsuitable)
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply chlamydia treatment under this PGD"
              checked={state.treatment.treatUnderPgd}
              onChange={(v) =>
                dispatch({ type: "UPDATE_TREATMENT", field: "treatUnderPgd", value: v })
              }
              description="Uncomplicated genital Chlamydia trachomatis infection, confirmed or strongly suspected. Leave unticked for a testing-only consultation."
            />
            {state.treatment.treatUnderPgd && (
              <>
                <SelectInput
                  label="Diagnosis of genital chlamydia"
                  value={state.treatment.chlamydiaDiagnosis}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_TREATMENT",
                      field: "chlamydiaDiagnosis",
                      value: v as STIConsultationState["treatment"]["chlamydiaDiagnosis"],
                    })
                  }
                  options={[
                    { value: "confirmed", label: "Confirmed (positive NAAT)" },
                    { value: "strongly-suspected", label: "Strongly suspected (e.g. partner of a confirmed case)" },
                  ]}
                  required
                />

                <p className="text-sm font-semibold text-red-700">Exclusions (both arms): tick any that apply</p>
                <Checkbox
                  label="Pregnant"
                  checked={state.treatment.pregnant}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "pregnant", value: v })}
                  description="Excluded from doxycycline. Azithromycin arm: refer to the GP or sexual health service (test of cure and follow-up needed)."
                />
                <Checkbox
                  label="Breastfeeding"
                  checked={state.treatment.breastfeeding}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "breastfeeding", value: v })}
                  description="Excluded from both arms: refer to the GP or sexual health service."
                />
                <Checkbox
                  label="Severe hepatic insufficiency or impairment"
                  checked={state.treatment.severeHepaticImpairment}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "severeHepaticImpairment", value: v })
                  }
                />
                <Checkbox
                  label="Known or suspected complicated infection (e.g. PID, epididymo-orchitis)"
                  checked={state.treatment.complicatedInfection}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "complicatedInfection", value: v })
                  }
                />

                <p className="text-sm font-semibold text-navy-900 mt-2">Doxycycline arm (first line)</p>
                <Checkbox
                  label="Known hypersensitivity to tetracyclines"
                  checked={state.treatment.tetracyclineHypersensitivity}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "tetracyclineHypersensitivity", value: v })
                  }
                />
                <Checkbox
                  label="Unable to comply with the 7-day regimen or to swallow capsules"
                  checked={state.treatment.unableToComplyOrSwallow}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "unableToComplyOrSwallow", value: v })
                  }
                />
                <Checkbox
                  label="Doxycycline otherwise unsuitable or contraindicated"
                  checked={state.treatment.doxycyclineUnsuitable}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "doxycyclineUnsuitable", value: v })
                  }
                  description="Record the reason. Azithromycin is only indicated where doxycycline is unsuitable or contraindicated."
                />
                {state.treatment.doxycyclineUnsuitable && (
                  <TextInput
                    label="Reason doxycycline is unsuitable"
                    value={state.treatment.doxycyclineUnsuitableReason}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_TREATMENT", field: "doxycyclineUnsuitableReason", value: v })
                    }
                    required
                  />
                )}

                <p className="text-sm font-semibold text-navy-900 mt-2">Azithromycin arm (where doxycycline is unsuitable)</p>
                <Checkbox
                  label="Known hypersensitivity to macrolides"
                  checked={state.treatment.macrolideHypersensitivity}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_TREATMENT", field: "macrolideHypersensitivity", value: v })
                  }
                />
                <Checkbox
                  label="History of QT prolongation or taking interacting QT-prolonging drugs"
                  checked={state.treatment.qtProlongation}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "qtProlongation", value: v })}
                />
                <Checkbox
                  label="Concurrent use of ergot derivatives"
                  checked={state.treatment.ergotDerivatives}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "ergotDerivatives", value: v })}
                />

                <SelectInput
                  label="Medicine to supply"
                  value={state.treatment.medicine}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_TREATMENT",
                      field: "medicine",
                      value: v as STIConsultationState["treatment"]["medicine"],
                    })
                  }
                  options={[
                    { value: "doxycycline", label: "Doxycycline 100mg capsules, 100 mg twice daily for 7 days (14 capsules)" },
                    {
                      value: "azithromycin",
                      label: "Azithromycin 500mg tablets, 1 g on day 1 then 500 mg once daily on days 2 and 3 (4 tablets)",
                    },
                  ]}
                  required
                />

                {treatmentPlan && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-1">
                    <p className="font-semibold">{treatmentPlan.product}</p>
                    <p>Dose and frequency: {treatmentPlan.dose}</p>
                    <p>Quantity: {treatmentPlan.quantity}. Treatment period: {treatmentPlan.duration}.</p>
                    <p>Route: {treatmentPlan.route}</p>
                    <ul className="list-disc list-inside text-xs text-blue-800 mt-1">
                      {treatmentPlan.cautions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Window period information provided"
              checked={state.counselling.windowPeriods}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "windowPeriods",
                  value: v,
                })
              }
              description="Patient understands that recent infection may not be detected"
            />
            <Checkbox
              label="Partner notification discussed"
              checked={state.counselling.partnerNotification}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "partnerNotification",
                  value: v,
                })
              }
              description="Sexual partners should be informed and tested"
            />
            <Checkbox
              label="Safe sex practices advised"
              checked={state.counselling.safeSex}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "safeSex",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Results timeline explained"
              checked={state.counselling.resultsTimeline}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "resultsTimeline",
                  value: v,
                })
              }
              description="When patient will receive results and how"
            />
            <Checkbox
              label="Positive test meaning explained"
              checked={state.counselling.positiveTestMeaning}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "positiveTestMeaning",
                  value: v,
                })
              }
              description="Treatment pathways and GP referral"
            />
            <Checkbox
              label="Follow-up procedures explained"
              checked={state.counselling.followUp}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "followUp",
                  value: v,
                })
              }
              description="Test-of-cure, repeat testing, partner follow-up"
            />

            {state.treatment.treatUnderPgd && treatmentPlan && (
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-semibold text-navy-900">
                  Treatment counselling ({treatmentPlan.product})
                </p>
                <Checkbox
                  label={
                    treatmentPlan.medicine === "doxycycline"
                      ? "Take with water and remain upright for 30 minutes; avoid sun exposure during and after treatment"
                      : "Do not take antacids 2 hours before or after a dose; caution in mild to moderate liver or kidney impairment"
                  }
                  checked={state.counselling.medicineAdvice}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_COUNSELLING", field: "medicineAdvice", value: v })
                  }
                />
                <Checkbox
                  label={
                    treatmentPlan.medicine === "doxycycline"
                      ? "Abstain from sexual activity until treatment and partner treatment are completed"
                      : "Abstain from sexual activity for 7 days after treatment and until partners are treated"
                  }
                  checked={state.counselling.abstinenceAdvice}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_COUNSELLING", field: "abstinenceAdvice", value: v })
                  }
                />
                {treatmentPlan.medicine === "doxycycline" && (
                  <Checkbox
                    label="Use effective contraception during and for 7 days after completing the course"
                    checked={state.counselling.contraceptionAdvice}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_COUNSELLING", field: "contraceptionAdvice", value: v })
                    }
                  />
                )}
                {treatmentPlan.medicine === "azithromycin" && (
                  <Checkbox
                    label="Reinforced the need for a test of cure if symptoms persist or in pregnancy"
                    checked={state.counselling.testOfCureAdvice}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_COUNSELLING", field: "testOfCureAdvice", value: v })
                    }
                  />
                )}
                <Checkbox
                  label="Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell"
                  checked={state.counselling.worseningAdvice}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_COUNSELLING", field: "worseningAdvice", value: v })
                  }
                />
                <Checkbox
                  label="Patient information leaflet (PIL) supplied with the medication"
                  checked={state.counselling.pilSupplied}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })
                  }
                />
              </div>
            )}
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
            <STISummaryReport state={state} alerts={alerts} />
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
          alerts={alerts}
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
       getConsultationData={getConsultationData}>
        {renderStep()}
      </StepWrapper>
    </div>
  );
}
