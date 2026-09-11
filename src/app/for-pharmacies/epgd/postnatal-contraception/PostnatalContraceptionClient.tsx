"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  PostnatalContraceptionState,
  PostnatalContraceptionAction,
} from "./lib/postnatal-contraception-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialPostnatalContraceptionState } from "./lib/postnatal-contraception-types";
import { getAllAlerts, hasHardStops, getAdditionalVteRiskFactors, getDepoTimingError, isBreastfeeding, daysSinceDelivery, addDays, daysSinceLastInjection } from "./lib/postnatal-contraception-clinical-logic";
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
      // Days postpartum is derived from the delivery date, never typed.
      if (action.field === "deliveryDate") {
        const days = daysSinceDelivery(action.value as string);
        newState.assessment.daysPostpartum = days;
        newState.assessment.weeksPostpartum = days === null ? 0 : Math.floor(days / 7);
      }
      if (action.field === "unprotectedSexSinceDay21" && action.value !== true) {
        newState.assessment.negativeTest21DaysAfterLastUpsi = false;
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = { ...newState.medicineSupply, [action.field]: action.value };
      // Next Depo-Provera injection is due 12 weeks (84 days) after this one.
      if (action.field === "startDate" || action.field === "medicineChoice") {
        newState.medicineSupply.nextInjectionDue =
          newState.medicineSupply.medicineChoice === "depo-provera"
            ? addDays(newState.medicineSupply.startDate, 84)
            : "";
      }
      if (action.field === "injectionType" && action.value !== "repeat") {
        newState.medicineSupply.lastInjectionDate = "";
        newState.medicineSupply.lateRepeatPregnancyExcluded = false;
        newState.medicineSupply.lateRepeatBarrierAdvised = false;
      }
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

  // A stop anywhere disables Next on every step. The progress bar only moves
  // backwards, so the only route past a stop is "Save as not supplied".
  const canProceed = !validationError && !hasStops;

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
  // Returns a record on every step, with or without a medicine, so an
  // excluded patient can be saved as not supplied from the step the stop was
  // raised. Saves updatedState so the alerts are stored with the record.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const m = state.medicineSupply;
    const medicine = !hasStops && m.medicineChoice
      ? m.medicineChoice === "desogestrel"
        ? {
            name: "Desogestrel 75 microgram tablets",
            medicine: "desogestrel",
            dose: "75 micrograms once daily, continuously",
            duration: `${m.quantity} days`,
            quantity: `${m.quantity} tablets`,
          }
        : {
            name: "Medroxyprogesterone acetate 150 mg/mL injection (Depo-Provera)",
            medicine: "depo-provera",
            dose: `150 mg deep intramuscular injection (${m.injectionSite || "site not recorded"})`,
            duration: "Single injection; repeat every 12 weeks",
            quantity: "1 injection (1 mL)",
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
      clinicalData: updatedState as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
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
  }, [state, updatedState, hasStops, __pharmProfile]);

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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <TextInput
                label="Date of delivery"
                value={state.assessment.deliveryDate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "deliveryDate",
                    value: v,
                  })
                }
                type="date"
                required
              />
              {state.assessment.daysPostpartum !== null && (
                <p className="text-xs text-gray-600">
                  {state.assessment.daysPostpartum} days postpartum ({state.assessment.weeksPostpartum} weeks), derived from the delivery date. Desogestrel: any time postpartum (before day 21 no additional contraception needed). Depo-Provera: from 6 weeks if breastfeeding; from 21 days if not breastfeeding and no additional VTE risk factor; otherwise refer.
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
                  <SelectInput
                    label="Has there been unprotected intercourse since day 21?"
                    value={state.assessment.unprotectedSexSinceDay21 === null ? "" : state.assessment.unprotectedSexSinceDay21 ? "yes" : "no"}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "unprotectedSexSinceDay21", value: v === "" ? null : v === "yes" })}
                    options={[
                      { value: "no", label: "No: pregnancy reasonably excluded on history" },
                      { value: "yes", label: "Yes: a negative test 21 days after the last episode is needed" },
                    ]}
                    required
                  />
                  {state.assessment.unprotectedSexSinceDay21 === true && (
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
                description="Not listed in the PGD; caution only. Check the SmPC and BNF."
              />

              <Checkbox
                label="History of breast cancer treated within the last 5 years (not current)"
                checked={state.medicalHistory.breastCancerWithin5Years}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastCancerWithin5Years",
                    value: v,
                  })
                }
                description="UKMEC 3 for progestogen-only methods: the inclusion criterion (UKMEC 1 or 2) is not met. Refer."
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

              <div className="border-t pt-4">
                <Checkbox
                  label="I have asked the patient about every exclusion and caution listed above and recorded the answers"
                  checked={state.medicalHistory.exclusionsAsked}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "exclusionsAsked", value: v })}
                  required
                />
              </div>
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
                ? "Exclusion present: cannot proceed to medicine supply. Give the advice, refer as appropriate, and save as not supplied."
                : null
            }
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            getConsultationData={getConsultationData}
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
                  <SelectInput
                    label="Injection"
                    value={state.medicineSupply.injectionType}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "injectionType", value: v })}
                    options={[
                      { value: "first", label: "First Depo-Provera injection" },
                      { value: "repeat", label: "Repeat injection (every 12 weeks, plus or minus 5 days)" },
                    ]}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput
                      label="Date of injection"
                      value={state.medicineSupply.startDate}
                      onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "startDate", value: v })}
                      type="date"
                      required
                    />
                    {state.medicineSupply.injectionType === "repeat" && (
                      <TextInput
                        label="Date of last injection"
                        value={state.medicineSupply.lastInjectionDate}
                        onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "lastInjectionDate", value: v })}
                        type="date"
                        required
                      />
                    )}
                  </div>
                  {(() => {
                    const since = daysSinceLastInjection(state);
                    if (since === null) return null;
                    return since > 89 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2">
                        <p className="text-xs font-semibold text-amber-900">
                          {since} days since the last injection: beyond 12 weeks plus 5 days. The repeat can only be given if pregnancy is reasonably excluded; otherwise refer.
                        </p>
                        <Checkbox
                          label="Pregnancy reasonably excluded (no UPSI since day 21 after the last injection was due, or a negative test 21 days after the last episode)"
                          checked={state.medicineSupply.lateRepeatPregnancyExcluded}
                          onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "lateRepeatPregnancyExcluded", value: v })}
                          required
                        />
                        <Checkbox
                          label="Advised a barrier method for the next 7 days"
                          checked={state.medicineSupply.lateRepeatBarrierAdvised}
                          onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "lateRepeatBarrierAdvised", value: v })}
                          required
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">{since} days since the last injection: within the 12 week (plus or minus 5 days) window.</p>
                    );
                  })()}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-medium text-navy-900">Next injection due (derived: date of injection plus 12 weeks)</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {state.medicineSupply.nextInjectionDue
                        ? `${state.medicineSupply.nextInjectionDue} (window ${addDays(state.medicineSupply.startDate, 79)} to ${addDays(state.medicineSupply.startDate, 89)})`
                        : "Enter the date of injection"}
                    </p>
                  </div>
                </>
              )}

              {state.medicineSupply.medicineChoice && (
                <Checkbox
                  label="UKMEC 2025 category 1 or 2 for the chosen method confirmed"
                  checked={state.medicineSupply.ukmecConfirmed}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "ukmecConfirmed", value: v })}
                  description="Inclusion criterion in both arms of the PGD."
                  required
                />
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
          <StepWrapper
            title="Summary & Consultation Record"
            description="Confirm the practitioner details, review the record, then save and print."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
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
                label="Additional clinical notes"
                value={state.summary.clinicalNotes}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
                placeholder="Any additional information to record..."
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Review the summary below before saving and printing the consultation record.
              </p>
              <PostnatalContraceptionSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
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
  const stopped = state.alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && Boolean(state.medicineSupply.medicineChoice);
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
      <Row label="Address" value={state.patient.address || "Not recorded"} />
      <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
      <Row label="GP" value={[state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || "Not recorded"} />
      <Row label="Valid informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
      <Row label="Date and time of consultation" value={`${state.summary.consultationDate} ${state.summary.consultationTime}`.trim()} />

      <SectionHeader>Postnatal Assessment</SectionHeader>
      <Row label="Date of delivery" value={state.assessment.deliveryDate || "Not recorded"} />
      <Row
        label="Days postpartum"
        value={state.assessment.daysPostpartum !== null ? `${state.assessment.daysPostpartum} days (${state.assessment.weeksPostpartum} weeks), derived from the delivery date` : "Not recorded"}
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
            state.assessment.unprotectedSexSinceDay21 === null
              ? "Not answered"
              : state.assessment.unprotectedSexSinceDay21 === false
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
      <Row label="Breast cancer within the last 5 years" value={state.medicalHistory.breastCancerWithin5Years ? "Yes (UKMEC 3, referred)" : "No"} />
      <Row label="Exclusions and cautions asked" value={state.medicalHistory.exclusionsAsked ? "Yes, all asked and recorded" : "Not confirmed"} />
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
      {!supplied ? (
        <Row label="Outcome" value={stopped ? "NOT SUPPLIED: exclusion criteria met. Patient advised and referred as recorded." : "No medicine selected"} />
      ) : (
        <>
          <Row label="Medicine" value={state.medicineSupply.medicine || "None supplied"} />
          <Row label="UKMEC 1 or 2 confirmed" value={state.medicineSupply.ukmecConfirmed ? "Yes" : "No"} />
          {state.medicineSupply.medicineChoice === "desogestrel" && (
            <>
              <Row label="Dose, form and route" value="75 micrograms, one tablet orally daily at the same time each day, continuously" />
              <Row label="Quantity" value={`${state.medicineSupply.quantity} tablets (maximum 84)`} />
              <Row label="Start date" value={state.medicineSupply.startDate} />
            </>
          )}
          {state.medicineSupply.medicineChoice === "depo-provera" && (
            <>
              <Row label="Dose and route" value={`150 mg deep intramuscular injection, ${state.medicineSupply.injectionSite || "site not recorded"}`} />
              <Row label="Quantity" value="Single injection (1 mL)" />
              <Row label="Injection" value={state.medicineSupply.injectionType === "repeat" ? `Repeat (last injection ${state.medicineSupply.lastInjectionDate || "not recorded"}${daysSinceLastInjection(state) !== null ? `, ${daysSinceLastInjection(state)} days ago` : ""})` : "First injection"} />
              {daysSinceLastInjection(state) !== null && (daysSinceLastInjection(state) as number) > 89 && (
                <Row label="Late repeat" value={`Pregnancy reasonably excluded: ${state.medicineSupply.lateRepeatPregnancyExcluded ? "Yes" : "No"}; barrier method for 7 days advised: ${state.medicineSupply.lateRepeatBarrierAdvised ? "Yes" : "No"}`} />
              )}
              <Row label="Batch / expiry" value={`${state.medicineSupply.batchNumber || "not recorded"} / ${state.medicineSupply.expiryDate || "not recorded"}`} />
              <Row label="Date of injection" value={state.medicineSupply.startDate} />
              <Row label="Next injection due" value={state.medicineSupply.nextInjectionDue ? `${state.medicineSupply.nextInjectionDue} (window ${addDays(state.medicineSupply.startDate, 79)} to ${addDays(state.medicineSupply.startDate, 89)})` : "Not recorded"} />
            </>
          )}
          <Row label="Supplied by" value={state.medicineSupply.administeredBy || "Not recorded"} />
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

      {supplied ? (
        <PharmacistDeclaration
          pgdName="Postnatal Contraception"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      ) : (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">No medicine was supplied under this PGD. Advice given and the decision reached are recorded above.</p>
          <Row label="Name" value={state.summary.pharmacistName || "Not recorded"} />
          <Row label="GPhC number" value={state.summary.pharmacistGPhC || "Not recorded"} />
          <Row label="Pharmacy" value={state.summary.pharmacyName || "Not recorded"} />
        </>
      )}

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
