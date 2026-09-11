"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  PostnatalContraceptionState,
  PostnatalContraceptionAction,
} from "./lib/postnatal-contraception-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialPostnatalContraceptionState } from "./lib/postnatal-contraception-types";
import { getAllAlerts, hasHardStops, getAdditionalVteRiskFactors, getDepoTimingError, isBreastfeeding } from "./lib/postnatal-contraception-clinical-logic";
import { PGD_VERSION_LABEL } from "./lib/postnatal-contraception-types";
import { validateStep } from "./lib/postnatal-contraception-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../shared/components/SummaryReportShell";

// ─── Reducer ───

function reducer(
  state: PostnatalContraceptionState,
  action: PostnatalContraceptionAction
): PostnatalContraceptionState {
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
      if (action.field === "daysPostpartum") {
        const days = action.value as number | null;
        newState.assessment.weeksPostpartum = days === null ? 0 : Math.floor(days / 7);
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = { ...newState.medicineSupply, [action.field]: action.value };
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
      return createInitialPostnatalContraceptionState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function PostnatalContraceptionClient() {
  const [state, dispatch] = useReducer(reducer, createInitialPostnatalContraceptionState());
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

  // Compute alerts
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    return newState;
  }, [state, alerts]);

  // Validation
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // Can proceed?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(state.currentStep);
    setCompletedSteps(newCompleted);
  }, [completedSteps, state.currentStep]);

  const handleNext = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrev = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
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


  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm postnatal woman's identity and age."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
              requireAdult={false}
            />
            {state.patient.age !== null && state.patient.age < 16 && (
              <p className="mt-3 text-sm font-medium text-red-600">This PGD is for postnatal women aged 16 and over (Depo-Provera 18 and over).</p>
            )}
            {state.patient.age !== null && state.patient.age >= 16 && state.patient.age < 18 && (
              <p className="mt-3 text-sm font-medium text-amber-700">Aged 16 or 17: desogestrel arm only. Depo-Provera is for women aged 18 and over.</p>
            )}
          </StepWrapper>
        );

      case 1: // Consent
        return (
          <StepWrapper
            title="Consent &amp; ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 2: // Postnatal Assessment
        return (
          <StepWrapper
            title="Postnatal Assessment"
            description="Assess postnatal status, delivery method, and breastfeeding."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <NumberInput
                label="Days postpartum"
                value={state.assessment.daysPostpartum}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "daysPostpartum",
                    value: v,
                  })
                }
                min={0}
                unit="days"
                required
              />
              {state.assessment.daysPostpartum !== null && (
                <p className="text-xs text-gray-600">
                  {state.assessment.weeksPostpartum} weeks. Desogestrel: any time postpartum (before day 21 no additional contraception needed). Depo-Provera: from 6 weeks if breastfeeding; from 21 days if not breastfeeding and no additional VTE risk factor; otherwise refer.
                </p>
              )}

              <SelectInput
                label="Type of delivery"
                value={state.assessment.deliveryType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "deliveryType",
                    value: v,
                  })
                }
                options={[
                  { value: "vaginal", label: "Vaginal delivery" },
                  { value: "vaginal-instrumental", label: "Vaginal with instrumental assistance" },
                  { value: "caesarean", label: "Caesarean section" },
                ]}
                required
              />

              <SelectInput
                label="Breastfeeding status"
                value={state.assessment.breastfeedingStatus}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "breastfeedingStatus",
                    value: v,
                  })
                }
                options={[
                  { value: "exclusively-breastfeeding", label: "Exclusively breastfeeding" },
                  { value: "mixed-feeding", label: "Mixed feeding (breast and formula)" },
                  { value: "formula-feeding", label: "Formula feeding only" },
                ]}
                required
              />

              <p className="text-sm font-semibold text-navy-900 mt-2">Additional VTE risk factors (Depo-Provera before 6 weeks requires none)</p>
              <Checkbox label="Previous VTE" checked={state.assessment.previousVte} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousVte", value: v })} />
              <Checkbox label="Thrombophilia" checked={state.assessment.thrombophilia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "thrombophilia", value: v })} />
              <Checkbox label="Immobility" checked={state.assessment.immobility} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "immobility", value: v })} />
              <Checkbox label="BMI 30 or over" checked={state.assessment.bmi30OrOver} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bmi30OrOver", value: v })} />
              <Checkbox label="Postpartum haemorrhage" checked={state.assessment.postpartumHaemorrhage} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "postpartumHaemorrhage", value: v })} />
              <Checkbox label="Pre-eclampsia" checked={state.assessment.preEclampsia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "preEclampsia", value: v })} />
              <Checkbox label="Smoking" checked={state.assessment.smoking} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "smoking", value: v })} />
              <p className="text-xs text-gray-600">Caesarean delivery counts as an additional risk factor (taken from the delivery type above).</p>

              {state.assessment.daysPostpartum !== null && state.assessment.daysPostpartum > 21 && (
                <>
                  <p className="text-sm font-semibold text-navy-900 mt-2">From day 21 pregnancy must be reasonably excluded</p>
                  <Checkbox label="Unprotected intercourse since day 21" checked={state.assessment.unprotectedSexSinceDay21} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "unprotectedSexSinceDay21", value: v })} />
                  {state.assessment.unprotectedSexSinceDay21 && (
                    <Checkbox label="Negative pregnancy test 21 days after the last episode" checked={state.assessment.negativeTest21DaysAfterLastUpsi} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "negativeTest21DaysAfterLastUpsi", value: v })} description="Without this, pregnancy is not reasonably excluded and supply is refused." />
                  )}
                </>
              )}
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Known or suspected pregnancy"
                checked={state.medicalHistory.knownOrSuspectedPregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "knownOrSuspectedPregnancy",
                    value: v,
                  })
                }
                description="Exclusion for both arms."
              />

              <Checkbox
                label="Current or suspected breast cancer"
                checked={state.medicalHistory.currentBreastCancer}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "currentBreastCancer",
                    value: v,
                  })
                }
                description="Sex hormone-dependent malignancy: exclusion for both arms."
              />

              <Checkbox
                label="Severe hepatic impairment or severe liver disease"
                checked={state.medicalHistory.severeLiverDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeLiverDisease",
                    value: v,
                  })
                }
                description="Exclusion for both arms."
              />

              <Checkbox
                label="Undiagnosed vaginal bleeding"
                checked={state.medicalHistory.unexplainedVaginalBleeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "unexplainedVaginalBleeding",
                    value: v,
                  })
                }
                description="Exclusion for both arms."
              />

              <Checkbox
                label="Active thromboembolic disorder"
                checked={state.medicalHistory.activeThromboembolicDisorder}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeThromboembolicDisorder", value: v })
                }
                description="Desogestrel exclusion."
              />
              <Checkbox
                label="Hypersensitivity to desogestrel or any excipients"
                checked={state.medicalHistory.desogestrelHypersensitivity}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "desogestrelHypersensitivity", value: v })
                }
                description="Desogestrel exclusion."
              />
              <Checkbox
                label="Hypersensitivity to medroxyprogesterone acetate or any excipients"
                checked={state.medicalHistory.mpaHypersensitivity}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mpaHypersensitivity", value: v })
                }
                description="Depo-Provera exclusion."
              />
              <Checkbox
                label="Severe cardiovascular disease"
                checked={state.medicalHistory.severeCardiovascularDisease}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeCardiovascularDisease", value: v })
                }
                description="Depo-Provera exclusion."
              />
              <Checkbox
                label="Meningioma, current or previous"
                checked={state.medicalHistory.meningioma}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "meningioma", value: v })
                }
                description="Depo-Provera exclusion (SmPC)."
              />

              <Checkbox
                label="Porphyria"
                checked={state.medicalHistory.porphyria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "porphyria",
                    value: v,
                  })
                }
                description="Not listed in the PGD; this tool refers (stricter)."
              />

              <Checkbox
                label="History of breast cancer (more than 5 years ago)"
                checked={state.medicalHistory.pastBreastCancer}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pastBreastCancer",
                    value: v,
                  })
                }
                description="Caution in both arms; specialist advice recommended if less than 5 years clear."
              />

              <Checkbox
                label="Liver tumours"
                checked={state.medicalHistory.liverTumours}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "liverTumours",
                    value: v,
                  })
                }
                description="Desogestrel exclusion (severe hepatic impairment or liver tumours)."
              />

              <p className="text-sm font-semibold text-navy-900 mt-2">Cautions</p>
              <Checkbox label="Functional ovarian cysts" checked={state.medicalHistory.functionalOvarianCysts} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "functionalOvarianCysts", value: v })} description="Desogestrel caution." />
              <Checkbox label="Diabetes" checked={state.medicalHistory.diabetes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })} description="Caution, both arms." />
              <Checkbox label="Hypertension" checked={state.medicalHistory.hypertension} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypertension", value: v })} description="Desogestrel caution." />
              <Checkbox label="Migraine" checked={state.medicalHistory.migraine} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "migraine", value: v })} description="Caution, both arms." />
              <Checkbox label="Depression" checked={state.medicalHistory.depression} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "depression", value: v })} description="Caution, both arms." />

              <Checkbox
                label="SLE with antiphospholipid antibodies"
                checked={state.medicalHistory.sleWithAntiphospholipidAntibodies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "sleWithAntiphospholipidAntibodies",
                    value: v,
                  })
                }
                description="Caution due to thrombotic risk."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications &amp; Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed to medicine supply."
                : null
            }
            isBlocked={hasStops}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop — Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified exclusions, neither desogestrel nor Depo-Provera can be supplied under this PGD. Advise on alternative options and how to access them; document the advice and the decision; inform or refer to the GP as appropriate.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Medicine Supply
        return (
          <StepWrapper
            title="Medicine Supply"
            description="Desogestrel 75 microgram tablets or Depo-Provera 150 mg/mL injection."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <SelectInput
                label="Medicine"
                value={state.medicineSupply.medicineChoice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicineChoice", value: v });
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "medicine",
                    value: v === "desogestrel" ? "Desogestrel 75 micrograms tablets (Cerazette/Cerelle)" : v === "depo-provera" ? "Medroxyprogesterone acetate 150 mg/mL injection (Depo-Provera)" : "",
                  });
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseStrength", value: v === "desogestrel" ? "75 micrograms" : v === "depo-provera" ? "150 mg" : "" });
                }}
                options={[
                  { value: "desogestrel", label: "Desogestrel 75 micrograms tablets (Cerazette/Cerelle), women 16 and over" },
                  { value: "depo-provera", label: "Medroxyprogesterone acetate 150 mg/mL injection (Depo-Provera), women 18 and over" },
                ]}
                required
              />

              {state.medicineSupply.medicineChoice === "desogestrel" && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Desogestrel 75 micrograms tablets
                    </p>
                    <p className="text-sm text-blue-800">
                      One tablet daily at the same time each day, continuously (no pill-free break). 12-hour window for missed pills. Start any time postpartum. Started up to and including day 21: no additional contraception needed. Started after day 21: exclude pregnancy first and use a barrier method for 2 days (FSRH; the SmPC states 7 days). Up to 3 months' supply (3 x 28 = 84 tablets). Continuous until change of contraception or pregnancy.
                    </p>
                  </div>

                  <NumberInput
                    label="Number of tablets to supply (maximum 84)"
                    value={state.medicineSupply.quantity}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SUPPLY",
                        field: "quantity",
                        value: v,
                      })
                    }
                    min={1}
                    max={84}
                    required
                  />

                  <TextInput
                    label="Start date"
                    value={state.medicineSupply.startDate}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SUPPLY",
                        field: "startDate",
                        value: v,
                      })
                    }
                    type="date"
                    required
                  />
                </>
              )}

              {state.medicineSupply.medicineChoice === "depo-provera" && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Medroxyprogesterone acetate 150 milligrams per millilitre injection (Depo-Provera)
                    </p>
                    <p className="text-sm text-blue-800">
                      150 milligrams by deep intramuscular injection into the gluteal or deltoid muscle. Single injection per visit. Repeat every 12 weeks (plus or minus 5 days) until change of contraception or pregnancy. First injection from 6 weeks postpartum if breastfeeding; from 21 days if not breastfeeding and no additional VTE risk factor; otherwise refer.
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      {isBreastfeeding(state) ? "Breastfeeding: earliest start 42 days." : `Not breastfeeding: earliest start 21 days if no additional VTE risk factor (${getAdditionalVteRiskFactors(state).join(", ") || "none recorded"}), otherwise 42 days.`}
                    </p>
                    {getDepoTimingError(state) && (
                      <p className="text-xs font-semibold text-red-700 mt-1">{getDepoTimingError(state)}</p>
                    )}
                  </div>

                  <SelectInput
                    label="Injection site (deep intramuscular)"
                    value={state.medicineSupply.injectionSite}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "injectionSite", value: v })}
                    options={[
                      { value: "gluteal", label: "Gluteal muscle" },
                      { value: "deltoid", label: "Deltoid muscle" },
                    ]}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Batch number"
                      value={state.medicineSupply.batchNumber}
                      onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "batchNumber", value: v })}
                      required
                    />
                    <TextInput
                      label="Expiry date"
                      value={state.medicineSupply.expiryDate}
                      onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "expiryDate", value: v })}
                      type="date"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Date of injection"
                      value={state.medicineSupply.startDate}
                      onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "startDate", value: v })}
                      type="date"
                      required
                    />
                    <TextInput
                      label="Next injection due (12 weeks, plus or minus 5 days)"
                      value={state.medicineSupply.nextInjectionDue}
                      onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "nextInjectionDue", value: v })}
                      type="date"
                      required
                    />
                  </div>
                </>
              )}

              <TextInput
                label="Supplied by (name and credentials)"
                value={state.medicineSupply.administeredBy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "administeredBy",
                    value: v,
                  })
                }
                placeholder="e.g. Emma Brown, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Counselling
        return (
          <StepWrapper
            title="Counselling"
            description="Confirm the PGD follow-up advice given for the method supplied."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              {state.medicineSupply.medicineChoice === "desogestrel" && (
                <>
                  <Checkbox
                    label="Advised when to start (any time postpartum; before day 21 no additional contraception needed)"
                    checked={state.counselling.timingAdvice}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_COUNSELLING",
                        field: "timingAdvice",
                        value: v,
                      })
                    }
                  />
                  {state.assessment.daysPostpartum !== null && state.assessment.daysPostpartum > 21 && (
                    <Checkbox
                      label="Started after day 21: use a barrier method for 2 days (FSRH; the SmPC states 7 days)"
                      checked={state.counselling.extraPrecautionsAdvice}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "extraPrecautionsAdvice", value: v })}
                    />
                  )}
                  <Checkbox
                    label="Take the tablet at the same time each day to maintain effectiveness (12-hour window)"
                    checked={state.counselling.dailyTakingAdvice}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_COUNSELLING",
                        field: "dailyTakingAdvice",
                        value: v,
                      })
                    }
                  />
                </>
              )}

              {state.medicineSupply.medicineChoice === "depo-provera" && (
                <>
                  <Checkbox
                    label="Explained that fertility may take 5 to 6 months to return after the last injection"
                    checked={state.counselling.depoFertilityAdvice}
                    onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "depoFertilityAdvice", value: v })}
                  />
                  <Checkbox
                    label="Return for repeat injection every 12 weeks"
                    checked={state.counselling.depoRepeatAdvice}
                    onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "depoRepeatAdvice", value: v })}
                    description="Bone mineral density loss with prolonged use: review at 2 years."
                  />
                </>
              )}

              <Checkbox
                label="Explained that irregular bleeding is common, particularly in the first few months"
                checked={state.counselling.breakThroughBleedingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "breakThroughBleedingAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Confirmed the method is safe during breastfeeding"
                checked={state.counselling.breastfeedingCompatibilityAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "breastfeedingCompatibilityAdvice",
                    value: v,
                  })
                }
                description="Safe to use while breastfeeding."
              />

              <Checkbox
                label="Explained the method does not protect against STIs"
                checked={state.counselling.stiAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "stiAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Provided emergency contraception contact details"
                checked={state.counselling.emergencyContactAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "emergencyContactAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Seek immediate medical attention if symptoms of DVT/PE develop (calf pain, swelling, breathlessness)"
                checked={state.counselling.dvtPeAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "dvtPeAdvice", value: v })}
              />

              <Checkbox
                label="Report any unexpected vaginal bleeding"
                checked={state.counselling.unexpectedBleedingAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "unexpectedBleedingAdvice", value: v })}
              />

              <Checkbox
                label="Discussed contraceptive options if considering longer-term contraception"
                checked={state.counselling.longerTermOptionsAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "longerTermOptionsAdvice", value: v })}
              />

              <Checkbox
                label="Explained side effects; seek medical advice if symptoms worsen or any adverse effects occur"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "sideEffectsExplained",
                    value: v,
                  })
                }
                description={state.medicineSupply.medicineChoice === "depo-provera" ? "Menstrual irregularity, weight gain, headache, dizziness, mood changes, acne, abdominal discomfort, decreased libido; reduced bone mineral density long term." : "Irregular bleeding or spotting, headache, mood changes, breast tenderness, nausea, acne, decreased libido, weight gain."}
              />

              {state.medicineSupply.medicineChoice === "desogestrel" && (
                <Checkbox
                  label="Clarified there is no pill-free interval"
                  checked={state.counselling.pillfreeIntervalAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "pillfreeIntervalAdvice",
                      value: v,
                    })
                  }
                  description="Continuous daily dosing; do not skip days."
                />
              )}
            </div>
          </StepWrapper>
        );

      case 7: // Summary & Print
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-navy-900">
                Summary &amp; Consultation Record
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4 mb-6">
                <TextInput
                  label="Pharmacist name"
                  value={state.summary.pharmacistName}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacistName",
                      value: v,
                    })
                  }
                  required
                />
                <TextInput
                  label="GPhC registration number"
                  value={state.summary.pharmacistGPhC}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacistGPhC",
                      value: v,
                    })
                  }
                  required
                />
                <TextInput
                  label="Pharmacy name"
                  value={state.summary.pharmacyName}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacyName",
                      value: v,
                    })
                  }
                />
                <TextInput
                  label="Pharmacy address"
                  value={state.summary.pharmacyAddress}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacyAddress",
                      value: v,
                    })
                  }
                />
                <TextArea
                  label="Additional clinical notes"
                  value={state.summary.clinicalNotes}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "clinicalNotes",
                      value: v,
                    })
                  }
                  placeholder="Any additional information to record..."
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Review the summary below before printing the consultation record.
                </p>
                <PostnatalContraceptionSummaryReport state={updatedState} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: "PREV_STEP" })}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
              >
                &larr; Previous
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
              >
                Print Consultation Record
              </button>
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
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {alerts.length > 0 && state.currentStep < 5 && (
        <AlertBanner alerts={alerts} />
      )}

      {renderStep()}
    </div>
  );
}

// ─── Summary Report Component ───

function PostnatalContraceptionSummaryReport({
  state,
}: {
  state: PostnatalContraceptionState;
}) {
  return (
    <div className="space-y-4 text-xs print:text-[10px]">
      <p className="text-[10px] text-gray-400">{PGD_VERSION_LABEL}</p>
      <SectionHeader>Patient Information</SectionHeader>
      <Row
        label="Name"
        value={`${state.patient.firstName} ${state.patient.lastName}`}
      />
      <Row label="Date of Birth" value={state.patient.dateOfBirth} />
      <Row label="Age" value={`${state.patient.age} years`} />
      <Row label="NHS Number" value={state.patient.nhsNumber} />
      <Row label="GP" value={state.patient.gpName} />

      <SectionHeader>Postnatal Assessment</SectionHeader>
      <Row
        label="Days postpartum"
        value={state.assessment.daysPostpartum !== null ? `${state.assessment.daysPostpartum} days (${state.assessment.weeksPostpartum} weeks)` : "Not recorded"}
      />
      <Row label="Delivery type" value={state.assessment.deliveryType} />
      <Row
        label="Breastfeeding"
        value={state.assessment.breastfeedingStatus}
      />
      <Row label="Additional VTE risk factors" value={getAdditionalVteRiskFactors(state).join(", ") || "None"} />
      {state.assessment.daysPostpartum !== null && state.assessment.daysPostpartum > 21 && (
        <Row
          label="Pregnancy reasonably excluded"
          value={
            !state.assessment.unprotectedSexSinceDay21
              ? "Yes: no unprotected intercourse since day 21"
              : state.assessment.negativeTest21DaysAfterLastUpsi
                ? "Yes: negative test 21 days after the last episode"
                : "No"
          }
        />
      )}

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Current breast cancer"
        value={state.medicalHistory.currentBreastCancer ? "Yes" : "No"}
      />
      <Row
        label="Severe hepatic disease"
        value={state.medicalHistory.severeLiverDisease ? "Yes" : "No"}
      />
      <Row
        label="Unexplained vaginal bleeding"
        value={state.medicalHistory.unexplainedVaginalBleeding ? "Yes" : "No"}
      />
      <Row
        label="Porphyria"
        value={state.medicalHistory.porphyria ? "Yes" : "No"}
      />
      <Row label="Known or suspected pregnancy" value={state.medicalHistory.knownOrSuspectedPregnancy ? "Yes" : "No"} />
      <Row label="Active thromboembolic disorder" value={state.medicalHistory.activeThromboembolicDisorder ? "Yes" : "No"} />
      <Row label="Liver tumours" value={state.medicalHistory.liverTumours ? "Yes" : "No"} />
      <Row label="Hypersensitivity (desogestrel / MPA)" value={`${state.medicalHistory.desogestrelHypersensitivity ? "Yes" : "No"} / ${state.medicalHistory.mpaHypersensitivity ? "Yes" : "No"}`} />
      <Row label="Severe cardiovascular disease" value={state.medicalHistory.severeCardiovascularDisease ? "Yes" : "No"} />
      <Row label="Meningioma (current or previous)" value={state.medicalHistory.meningioma ? "Yes" : "No"} />
      <Row
        label="Cautions"
        value={[
          state.medicalHistory.pastBreastCancer && "breast cancer history",
          state.medicalHistory.functionalOvarianCysts && "functional ovarian cysts",
          state.medicalHistory.diabetes && "diabetes",
          state.medicalHistory.hypertension && "hypertension",
          state.medicalHistory.migraine && "migraine",
          state.medicalHistory.depression && "depression",
        ]
          .filter(Boolean)
          .join(", ") || "None"}
      />

      <SectionHeader>Medicine Supply</SectionHeader>
      <Row label="Medicine" value={state.medicineSupply.medicine || "None supplied"} />
      {state.medicineSupply.medicineChoice === "desogestrel" && (
        <>
          <Row label="Dose" value="One tablet daily at the same time each day, continuously" />
          <Row label="Quantity" value={`${state.medicineSupply.quantity} tablets (maximum 84)`} />
          <Row label="Start date" value={state.medicineSupply.startDate} />
        </>
      )}
      {state.medicineSupply.medicineChoice === "depo-provera" && (
        <>
          <Row label="Dose and route" value={`150 mg deep intramuscular injection, ${state.medicineSupply.injectionSite || "site not recorded"}`} />
          <Row label="Batch / expiry" value={`${state.medicineSupply.batchNumber || "not recorded"} / ${state.medicineSupply.expiryDate || "not recorded"}`} />
          <Row label="Date of injection" value={state.medicineSupply.startDate} />
          <Row label="Next injection due" value={state.medicineSupply.nextInjectionDue || "Not recorded"} />
        </>
      )}

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Timing of start (any time postpartum)", state.counselling.timingAdvice],
          ["Started after day 21: barrier method for 2 days", state.counselling.extraPrecautionsAdvice],
          ["Daily taking (same time, 12-hour window)", state.counselling.dailyTakingAdvice],
          ["Irregular bleeding common in first months", state.counselling.breakThroughBleedingAdvice],
          ["Safe while breastfeeding", state.counselling.breastfeedingCompatibilityAdvice],
          ["No STI protection", state.counselling.stiAdvice],
          ["No pill-free interval", state.counselling.pillfreeIntervalAdvice],
          ["DVT/PE symptoms: immediate attention", state.counselling.dvtPeAdvice],
          ["Report unexpected vaginal bleeding", state.counselling.unexpectedBleedingAdvice],
          ["Longer-term contraception discussed", state.counselling.longerTermOptionsAdvice],
          ["Depo-Provera: fertility return 5 to 6 months", state.counselling.depoFertilityAdvice],
          ["Depo-Provera: repeat every 12 weeks", state.counselling.depoRepeatAdvice],
          ["Side effects explained", state.counselling.sideEffectsExplained],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Postnatal Contraception"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      <ReportFooter pgdName="Postnatal Contraception" />
    </div>
  );
}
