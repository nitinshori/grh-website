"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  MeningitiBConsultationState,
  MeningitiBAction,
} from "./lib/meningitis-b-types";
import { STEP_LABELS, TOTAL_STEPS, MENB_PGD_VERSION, createInitialMeningitiBState } from "./lib/meningitis-b-types";
import type { MeningitiBVaccineAdmin, MeningitiBMedicalHistory } from "./lib/meningitis-b-types";
import { getAllAlerts, hasHardStops, calculateAgeInMonths, getScheduleText } from "./lib/meningitis-b-clinical-logic";
import { validateStep } from "./lib/meningitis-b-validation";
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
  TextArea,
  SelectInput,
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
  state: MeningitiBConsultationState,
  action: MeningitiBAction
): MeningitiBConsultationState {
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
      newState.riskAssessment = { ...newState.riskAssessment, [action.field]: action.value };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_VACCINE_ADMIN":
      newState.vaccineAdmin = { ...newState.vaccineAdmin, [action.field]: action.value };
      break;

    case "UPDATE_POST_VACCINE":
      newState.postVaccine = { ...newState.postVaccine, [action.field]: action.value };
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
      return createInitialMeningitiBState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function MeningitiBClient() {
  const [state, dispatch] = useReducer(reducer, createInitialMeningitiBState());
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
  const ageMonths = calculateAgeInMonths(state.patient.dateOfBirth);
  const underSixteen = state.patient.age !== null && state.patient.age < 16;
  const infantUnderOne = ageMonths !== null && ageMonths < 12;

  // Can proceed? A stop anywhere disables Next on every step; the progress
  // bar only goes backwards, so there is no way round it.
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
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const a = state.vaccineAdmin;
    const productLabel = a.product === "bexsero" ? "Bexsero (4CMenB)" : a.product === "trumenba" ? "Trumenba (MenB-fHbp)" : "";
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
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && productLabel
          ? {
              name: productLabel,
              dose: `0.5 ml intramuscular, ${a.doseNumber === "booster-12-months" ? "booster at 12 months" : a.doseNumber === "booster-after-toddler-course" ? "booster 12 to 23 months after the primary course" : `${a.doseNumber} dose`}${a.product === "trumenba" ? `, ${a.trumenbaSchedule === "increased-risk" ? "3 dose" : "2 dose"} schedule` : ""}`,
              duration: "Single dose this attendance",
              quantity: 1,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, __pharmProfile]);

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
            description="Confirm patient identity and age."
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
            {underSixteen && (
              <div className="mt-6 space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
                <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD inclusion criterion)</p>
                <p className="text-xs text-amber-900">Valid informed consent from a person with parental responsibility where the individual is under 16 and not Gillick competent. No person with parental responsibility available to consent for a child under 16 who is not Gillick competent is an exclusion.</p>
                <SelectInput
                  label="Consent given by"
                  value={state.medicalHistory.consentBasis}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "consentBasis", value: v as MeningitiBMedicalHistory["consentBasis"] })
                  }
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                <TextInput
                  label={state.medicalHistory.consentBasis === "gillick" ? "Basis of the Gillick competence assessment" : "Name and relationship of the person with parental responsibility"}
                  value={state.medicalHistory.consentGiverDetails}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "consentGiverDetails", value: v })}
                  placeholder={state.medicalHistory.consentBasis === "gillick" ? "Why the young person was judged competent" : "A parent accompanying a child does not automatically hold parental responsibility. Ask."}
                  required
                />
                <Checkbox
                  label="A person with parental responsibility, or a suitable adult authorised by them, is present for the vaccination"
                  checked={state.medicalHistory.parentPresent}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "parentPresent", value: v })}
                  description="Inclusion criterion for a child under 16 years"
                  required
                />
              </div>
            )}
          </StepWrapper>
        );

      case 2: // Risk Assessment
        return (
          <StepWrapper
            title="Indication"
            description="Record why protection against meningococcal group B disease is required, and screen out requests this PGD does not cover."
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
              <p className="text-sm font-semibold text-navy-900">PGD indications (tick all that apply)</p>
              <Checkbox
                label="Routine doses missed, or presenting outside the NHS programme"
                checked={state.riskAssessment.missedRoutineDoses}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_RISK_ASSESSMENT", field: "missedRoutineDoses", value: v })
                }
                description="The routine infant doses at 8 weeks, 12 weeks and 12 months are given by the NHS programme. Families should be directed there rather than paying privately."
              />
              <Checkbox
                label="Adolescent or student seeking protection"
                checked={state.riskAssessment.universityFresher}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "universityFresher",
                    value: v,
                  })
                }
                description="Living in closed or semi-closed communities such as university halls raises the risk"
              />
              <Checkbox
                label="Asplenia or splenic dysfunction"
                checked={state.riskAssessment.asplenia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "asplenia",
                    value: v,
                  })
                }
                description="Adult at increased risk: vaccinate and involve the specialist team"
              />
              <Checkbox
                label="Complement disorder (inherited or acquired)"
                checked={state.riskAssessment.complementDeficiency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "complementDeficiency",
                    value: v,
                  })
                }
                description="Adult at increased risk: vaccinate and involve the specialist team"
              />
              <Checkbox
                label="Complement inhibitor therapy (such as eculizumab), or due to start one"
                checked={state.riskAssessment.complementInhibitor}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_RISK_ASSESSMENT", field: "complementInhibitor", value: v })
                }
                description="Vaccinate at least 2 weeks before treatment begins; where treatment starts less than 2 weeks after vaccination, prophylactic antibiotics are required until 2 weeks after the vaccine"
              />
              <Checkbox
                label="Laboratory staff handling Neisseria meningitidis"
                checked={state.riskAssessment.laboratoryStaff}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_RISK_ASSESSMENT", field: "laboratoryStaff", value: v })
                }
                description="4CMenB two doses, with boosters every 5 years (and MenACWY under the relevant PGD)"
              />
              <TextInput
                label="Other adult at increased risk (describe)"
                value={state.riskAssessment.otherIndication}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_RISK_ASSESSMENT", field: "otherIndication", value: v })
                }
                placeholder="Indication in accordance with Green Book chapter 22"
              />

              <p className="text-sm font-semibold text-red-800 pt-2">Requests this PGD does not cover (exclusions)</p>
              <Checkbox
                label="Request is for travel purposes"
                checked={state.riskAssessment.hyperendemicArea}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "hyperendemicArea",
                    value: v,
                  })
                }
                description="Exclusion: MenB is not recommended for travel. Assess for MenACWY under the relevant PGD instead, including for Hajj and Umrah."
              />
              <Checkbox
                label="Case, contact or outbreak of meningococcal disease"
                checked={state.riskAssessment.closeContactOfCase}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "closeContactOfCase",
                    value: v,
                  })
                }
                description="Exclusion: directed by the local Health Protection Team and outside this PGD. Refer."
              />
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
                label="Confirmed anaphylactic reaction to a previous dose of the same vaccine, to any component, or to any residue from the manufacturing process"
                checked={state.medicalHistory.anaphylaxisHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisHistory",
                    value: v,
                  })
                }
                description="Exclusion: do not vaccinate under this PGD."
              />

              <Checkbox
                label="Acute severe febrile illness"
                checked={state.medicalHistory.severeFebrilIllness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeFebrilIllness",
                    value: v,
                  })
                }
                description="Exclusion: postpone until recovered. A minor illness without fever or systemic upset is not a reason to postpone."
              />

              <Checkbox
                label="Previous systemic or local reaction to a meningococcal vaccine"
                checked={state.medicalHistory.previousReaction}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "previousReaction", value: v })
                }
                description="Fever of any severity, a hypotonic-hyporesponsive episode, persistent crying for more than 3 hours, a severe local reaction, or a convulsion within 3 days does not prevent further doses."
              />

              <Checkbox
                label="Other vaccine given today or recently"
                checked={state.medicalHistory.recentVaccination}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "recentVaccination",
                    value: v,
                  })
                }
                description="May be given at the same time as any other vaccine required, at a separate site, preferably a different limb, or at least 2.5 cm apart. Record the site of each."
              />

              <Checkbox
                label="Immunosuppression or HIV (regardless of CD4 count)"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunosuppressed", value: v })
                }
                description="Caution: vaccinate in accordance with the routine schedule; the individual may not make a full antibody response. Not a reason to withhold."
              />

              <Checkbox
                label="Pregnancy"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="Caution: meningococcal vaccines may be given when clinically indicated. No evidence of risk from inactivated vaccines."
              />

              <Checkbox
                label="Breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })
                }
                description="Caution: may be given when clinically indicated. No evidence of risk from inactivated vaccines."
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
                ? "Exclusion present: cannot proceed to vaccine administration."
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
                  Excluded: do not vaccinate under this PGD
                </p>
                <p className="text-sm text-red-600">
                  Advise on alternative options and how these can be accessed, including the NHS routine programme for infants, their GP practice, and the MenACWY PGD where the request is travel related. Explain the risks of meningococcal disease and the benefit of vaccination. Document any advice given and the decision reached. Inform or refer to the GP as appropriate. Where the individual is at increased risk through asplenia, a complement disorder or complement inhibitor therapy, make the referral clear and timely.
                </p>
                <div className="mt-3">
                  <TextArea
                    label="Advice given and decision reached (saved with the exclusion record)"
                    value={state.summary.clinicalNotes}
                    onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
                    placeholder="e.g., Travel request: directed to the MenACWY PGD; GP informed."
                  />
                  <p className="text-xs text-red-700 mt-1">Then use "Save as not supplied" below to record the consultation.</p>
                </div>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Vaccine Administration
        return (
          <StepWrapper
            title="Vaccine Administration"
            description="One 0.5 ml dose per administration. Choose the product first, then follow that product's schedule. Book the next dose in the course at the same appointment."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-6">
              <SelectInput
                label="Product"
                value={state.vaccineAdmin.product}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "product", value: v as MeningitiBVaccineAdmin["product"] })
                }
                options={[
                  { value: "bexsero", label: "Bexsero (4CMenB, GSK), licensed from 2 months" },
                  { value: "trumenba", label: "Trumenba (MenB-fHbp, Pfizer), licensed from 10 years" },
                ]}
                required
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Schedule for this product and age
                </p>
                <p className="text-sm text-blue-800">
                  {getScheduleText(state.vaccineAdmin.product, ageMonths)}
                </p>
                <p className="text-xs text-blue-800 mt-2">
                  Green Book schedule guidance supersedes the SPC. This PGD does not authorise off-label use: administer within the licensed age and dose for the product supplied. Inspect visually before administration. Store at +2 to +8 C; do not freeze.
                </p>
              </div>

              {state.vaccineAdmin.product === "trumenba" && (
                <SelectInput
                  label="Trumenba schedule"
                  value={state.vaccineAdmin.trumenbaSchedule}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "trumenbaSchedule", value: v as MeningitiBVaccineAdmin["trumenbaSchedule"] })
                  }
                  options={[
                    { value: "routine", label: "Routine use: 2 doses at 0 and 6 months" },
                    { value: "increased-risk", label: "Increased risk (asplenia, complement disorder, complement inhibitor, laboratory staff): 3 doses at 0, 1 to 2 months, and 6 months" },
                  ]}
                  required
                />
              )}

              {state.vaccineAdmin.product === "bexsero" && ageMonths !== null && ageMonths >= 12 && ageMonths < 24 && (
                <SelectInput
                  label="Doses of Bexsero given in the first year of life"
                  value={state.vaccineAdmin.dosesInFirstYear}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "dosesInFirstYear", value: v as MeningitiBVaccineAdmin["dosesInFirstYear"] })
                  }
                  options={[
                    { value: "0", label: "None: 2 doses at least 2 months apart, then a booster 12 to 23 months after the second dose" },
                    { value: "1", label: "One: one further dose at least 2 months after it, then a booster 12 to 23 months after that dose" },
                    { value: "2", label: "Two: a single booster, at least 2 months after the second primary dose and before the second birthday" },
                  ]}
                  required
                />
              )}

              <SelectInput
                label="Which dose in the course this represents"
                value={state.vaccineAdmin.doseNumber}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "doseNumber", value: v as MeningitiBVaccineAdmin["doseNumber"] })
                }
                options={[
                  { value: "1st", label: "1st dose" },
                  { value: "2nd", label: "2nd dose" },
                  { value: "3rd", label: "3rd dose (Trumenba increased-risk schedule only)" },
                  { value: "booster-12-months", label: "Booster at 12 months (Bexsero: two primary doses in the first year; given from 12 months, before the second birthday)" },
                  { value: "booster-after-toddler-course", label: "Booster 12 to 23 months after a Bexsero primary course whose second dose was given at 12 to 23 months (from 2 years of age)" },
                ]}
                required
              />

              {state.vaccineAdmin.doseNumber && state.vaccineAdmin.doseNumber !== "1st" && (
                <TextInput
                  label="Date of the previous dose in this course"
                  value={state.vaccineAdmin.previousDoseDate}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "previousDoseDate", value: v })
                  }
                  type="date"
                  required
                />
              )}

              <div className="border-t-2 border-gray-200 pt-4">
                <h4 className="font-semibold text-sm text-navy-900 mb-4">This dose: 0.5 ml intramuscular</h4>
                <div className="space-y-4">
                  <TextInput
                    label="Date of administration"
                    value={state.vaccineAdmin.vaccinationDate1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "vaccinationDate1",
                        value: v,
                      })
                    }
                    type="date"
                    required
                  />

                  <SelectInput
                    label="Anatomical site"
                    value={state.vaccineAdmin.injectionSite1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "injectionSite1",
                        value: v,
                      })
                    }
                    options={[
                      { value: "Left anterolateral thigh", label: "Left anterolateral thigh (infants 1 year and under)" },
                      { value: "Right anterolateral thigh", label: "Right anterolateral thigh (infants 1 year and under)" },
                      { value: "Left deltoid", label: "Left deltoid (older children and adults)" },
                      { value: "Right deltoid", label: "Right deltoid (older children and adults)" },
                    ]}
                    required
                  />

                  <TextInput
                    label="Batch number"
                    value={state.vaccineAdmin.lotNumber1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "lotNumber1",
                        value: v,
                      })
                    }
                    placeholder="Vaccine batch number"
                    required
                  />

                  <TextInput
                    label="Expiry date"
                    value={state.vaccineAdmin.expiryDate}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "expiryDate", value: v })
                    }
                    type="date"
                    required
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <h4 className="font-semibold text-sm text-navy-900 mb-4">Next dose in the course</h4>
                <div className="space-y-4">
                  <Checkbox
                    label="Course complete with this dose (no further dose due)"
                    checked={state.vaccineAdmin.courseComplete}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_VACCINE_ADMIN", field: "courseComplete", value: v })
                    }
                    description="The need for, and timing of, further booster doses in at-risk individuals has not been determined, other than 5 yearly boosters for laboratory staff."
                  />
                  {!state.vaccineAdmin.courseComplete && (
                    <TextInput
                      label="Date the next dose is due (book it at this appointment)"
                      value={state.vaccineAdmin.vaccinationDate2}
                      onChange={(v) =>
                        dispatch({
                          type: "UPDATE_VACCINE_ADMIN",
                          field: "vaccinationDate2",
                          value: v,
                        })
                      }
                      type="date"
                      required
                    />
                  )}
                </div>
              </div>

              <TextInput
                label="Name of immuniser (name and credentials)"
                value={state.vaccineAdmin.administeredBy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "administeredBy",
                    value: v,
                  })
                }
                placeholder="e.g. Sarah Jones, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Post-Vaccine Observations
        return (
          <StepWrapper
            title="Post-Vaccine Observations &amp; Counselling"
            description="Confirm post-vaccination observations and counselling provided."
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
                label="Observed for 15 minutes after vaccination, seated, and the observation period completed"
                checked={state.postVaccine.observationCompleted}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "observationCompleted", value: v })
                }
                description="Anxiety-related reactions including vasovagal syncope are commonest in adolescents and are a response to the needle. Have procedures in place to prevent injury from a faint."
                required
              />

              <p className="text-sm font-semibold text-navy-900 pt-2">Reactions observed during the observation period</p>

              <Checkbox
                label="Injection site reaction observed"
                checked={state.postVaccine.injectionSiteReaction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "injectionSiteReaction",
                    value: v,
                  })
                }
                description="Very common: redness, swelling, pain at injection site."
              />

              <Checkbox
                label="Fever observed"
                checked={state.postVaccine.feverObserved}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "feverObserved",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Headache reported"
                checked={state.postVaccine.headacheReported}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "headacheReported",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Myalgia (muscle pain) reported"
                checked={state.postVaccine.myyalgiaReported}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "myyalgiaReported",
                    value: v,
                  })
                }
              />

              <p className="text-sm font-semibold text-navy-900 pt-2">Counselling and written information (PGD)</p>

              <Checkbox
                label="Patient information leaflet offered and written record given (product, date, and when the next dose is due)"
                checked={state.postVaccine.writtenRecordGiven}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "writtenRecordGiven", value: v })
                }
                required
              />

              <Checkbox
                label="Course must be completed for full protection; next dose date confirmed"
                checked={state.counselling.doseScheduleAdvice}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_COUNSELLING", field: "doseScheduleAdvice", value: v })
                }
                description={getScheduleText(state.vaccineAdmin.product, ageMonths)}
                required
              />

              <Checkbox
                label="Expected side effects and their management explained"
                checked={state.counselling.commonReactionsAdvice}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_COUNSELLING", field: "commonReactionsAdvice", value: v })
                }
                description={
                  state.vaccineAdmin.product === "trumenba"
                    ? "Trumenba (10 years and over): headache, diarrhoea, nausea, muscle pain, joint pain, fatigue, chills, and injection site pain, swelling and redness."
                    : "Bexsero in adolescents and adults: injection site pain, malaise and headache most common. In infants and children up to 10 years: injection site reactions, fever of 38 C or above and irritability very common; diarrhoea, vomiting, feeding problems, sleepiness, unusual crying and rash common. Fever peaks at around 6 hours and has usually gone by 48 hours."
                }
                required
              />

              <Checkbox
                label="Injection site reactions explained"
                checked={state.counselling.injectionSiteAdvice}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_COUNSELLING", field: "injectionSiteAdvice", value: v })
                }
              />

              <Checkbox
                label="Side effects explained and Yellow Card reporting counselled"
                checked={state.counselling.sideEffectsExplained && state.postVaccine.yellowCardAdvice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffectsExplained", value: v });
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "yellowCardAdvice", value: v });
                }}
                description="All suspected reactions in children, and serious reactions in adults, should be reported via https://yellowcard.mhra.gov.uk. Document any adverse reaction and inform the GP."
                required
              />

              {infantUnderOne && state.vaccineAdmin.product === "bexsero" && (
                <Checkbox
                  label="Infant under one year: paracetamol schedule explained and written paracetamol advice given"
                  checked={state.postVaccine.paracetamolAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_POST_VACCINE",
                      field: "paracetamolAdvice",
                      value: v,
                    })
                  }
                  description="Give 2.5 ml of infant paracetamol 120mg/5ml as soon as possible after vaccination, a second dose after 4 to 6 hours and a third 4 to 6 hours after that. Ibuprofen is less effective and is not recommended. Seek medical advice if the child is noticeably unwell with a fever, or if fever occurs at other times."
                  required
                />
              )}
              {!(infantUnderOne && state.vaccineAdmin.product === "bexsero") && (
                <Checkbox
                  label="Paracetamol advice given (if needed)"
                  checked={state.postVaccine.paracetamolAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_POST_VACCINE",
                      field: "paracetamolAdvice",
                      value: v,
                    })
                  }
                  description="Prophylactic paracetamol is advised only where Bexsero is given to infants under one year."
                />
              )}

              <Checkbox
                label="Vaccine does not protect against all causes of meningitis and septicaemia; signs of meningococcal disease explained"
                checked={state.postVaccine.meningitisSignsAdvice && state.counselling.meningitisWarningSignsAdvice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_POST_VACCINE", field: "meningitisSignsAdvice", value: v });
                  dispatch({ type: "UPDATE_COUNSELLING", field: "meningitisWarningSignsAdvice", value: v });
                }}
                description="Seek urgent medical help for a fever with a rash that does not fade under pressure, severe headache, neck stiffness, dislike of bright light, drowsiness or confusion."
                required
              />

              <Checkbox
                label="Next dose in the course booked"
                checked={state.postVaccine.reviewScheduleAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "reviewScheduleAdvice",
                    value: v,
                  })
                }
                description="Book the next dose in the course at the same appointment"
              />
            </div>
          </StepWrapper>
        );

      case 7: // Summary & Print
        return (
          <StepWrapper
            title="Summary &amp; Consultation Record"
            description="Complete the pharmacist declaration, then Save & Print. The record is saved to Patient Records when printed."
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
            <div className="space-y-4 mb-6 print:hidden">
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
              <p className="text-sm text-gray-600 mb-4 print:hidden">
                Review the summary below before saving and printing the consultation record.
              </p>
              <MeningitiBSummaryReport state={updatedState} />
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

function MeningitiBSummaryReport({
  state,
}: {
  state: MeningitiBConsultationState;
}) {
  return (
    <div className="space-y-4 text-xs print:text-[10px]">
      <SectionHeader>Patient Information</SectionHeader>
      <Row
        label="Name"
        value={`${state.patient.firstName} ${state.patient.lastName}`}
      />
      <Row label="Date of Birth" value={state.patient.dateOfBirth} />
      <Row label="Age" value={`${state.patient.age} years`} />
      <Row label="NHS Number" value={state.patient.nhsNumber} />
      <Row label="Address" value={state.patient.address || "Not recorded"} />
      <Row label="GP" value={[state.patient.gpName, state.patient.gpPractice, state.patient.gpAddress].filter(Boolean).join(", ") || "Not recorded"} />

      {state.patient.age !== null && state.patient.age < 16 && (
        <>
          <Row
            label="Under 16 consent basis"
            value={
              state.medicalHistory.consentBasis === "gillick"
                ? `Gillick competent: ${state.medicalHistory.consentGiverDetails}`
                : `Parental responsibility: ${state.medicalHistory.consentGiverDetails}`
            }
          />
          <Row label="Parent or authorised adult present" value={state.medicalHistory.parentPresent ? "Yes" : "No"} />
        </>
      )}

      <SectionHeader>Indication</SectionHeader>
      <Row
        label="Routine doses missed or outside NHS programme"
        value={state.riskAssessment.missedRoutineDoses ? "Yes" : "No"}
      />
      <Row
        label="Adolescent or student seeking protection"
        value={state.riskAssessment.universityFresher ? "Yes" : "No"}
      />
      <Row
        label="Asplenia or splenic dysfunction"
        value={state.riskAssessment.asplenia ? "Yes" : "No"}
      />
      <Row
        label="Complement disorder"
        value={state.riskAssessment.complementDeficiency ? "Yes" : "No"}
      />
      <Row
        label="Complement inhibitor therapy"
        value={state.riskAssessment.complementInhibitor ? "Yes" : "No"}
      />
      <Row
        label="Laboratory staff"
        value={state.riskAssessment.laboratoryStaff ? "Yes" : "No"}
      />
      {state.riskAssessment.otherIndication && (
        <Row label="Other indication" value={state.riskAssessment.otherIndication} />
      )}
      <Row
        label="Travel request (exclusion)"
        value={state.riskAssessment.hyperendemicArea ? "Yes" : "No"}
      />
      <Row
        label="Case, contact or outbreak (exclusion)"
        value={state.riskAssessment.closeContactOfCase ? "Yes" : "No"}
      />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Anaphylaxis to previous dose, component or residue"
        value={state.medicalHistory.anaphylaxisHistory ? "Yes" : "No"}
      />
      <Row
        label="Acute severe febrile illness"
        value={state.medicalHistory.severeFebrilIllness ? "Yes" : "No"}
      />
      <Row label="Previous reaction to a meningococcal vaccine" value={state.medicalHistory.previousReaction ? "Yes" : "No"} />
      <Row label="Immunosuppression or HIV" value={state.medicalHistory.immunosuppressed ? "Yes" : "No"} />
      <Row label="Pregnancy" value={state.medicalHistory.pregnancy ? "Yes" : "No"} />
      <Row label="Breastfeeding" value={state.medicalHistory.breastfeeding ? "Yes" : "No"} />

      <SectionHeader>Vaccine Administration</SectionHeader>
      {hasHardStops(state.alerts) ? (
        <p className="text-xs font-semibold text-red-800">Outcome: NOT SUPPLIED. Exclusion criteria met; no vaccine administered.</p>
      ) : (
      <>
      <Row
        label="Product"
        value={
          state.vaccineAdmin.product === "bexsero"
            ? "Bexsero (4CMenB, GSK)"
            : state.vaccineAdmin.product === "trumenba"
            ? `Trumenba (MenB-fHbp, Pfizer), ${state.vaccineAdmin.trumenbaSchedule === "increased-risk" ? "3 dose schedule" : "2 dose schedule"}`
            : ""
        }
      />
      <Row label="Dose in course" value={state.vaccineAdmin.doseNumber === "booster-12-months" ? "Booster at 12 months" : state.vaccineAdmin.doseNumber === "booster-after-toddler-course" ? "Booster 12 to 23 months after the primary course (given at 12 to 23 months)" : state.vaccineAdmin.doseNumber} />
      {state.vaccineAdmin.doseNumber && state.vaccineAdmin.doseNumber !== "1st" && (
        <Row label="Previous dose in this course" value={state.vaccineAdmin.previousDoseDate || "Not recorded"} />
      )}
      {state.vaccineAdmin.dosesInFirstYear && (
        <Row label="Doses given in the first year" value={state.vaccineAdmin.dosesInFirstYear} />
      )}
      <Row label="Date of administration" value={state.vaccineAdmin.vaccinationDate1} />
      <Row label="Dose, form and route" value="0.5 ml suspension for injection, intramuscular; quantity administered one dose" />
      <Row label="Anatomical site" value={state.vaccineAdmin.injectionSite1} />
      <Row label="Batch number" value={state.vaccineAdmin.lotNumber1} />
      <Row label="Expiry date" value={state.vaccineAdmin.expiryDate} />
      <Row label="Next dose due" value={state.vaccineAdmin.courseComplete ? "Course complete" : state.vaccineAdmin.vaccinationDate2} />
      <Row label="Immuniser" value={state.vaccineAdmin.administeredBy} />
      <Row label="15 minute observation completed" value={state.postVaccine.observationCompleted ? "Yes" : "No"} />
      <Row label="Administered via PGD" value={`Yes, ${MENB_PGD_VERSION}`} />
      </>
      )}

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Course completion and next dose date explained", state.counselling.doseScheduleAdvice],
          ["Expected side effects and management explained", state.counselling.commonReactionsAdvice],
          ["Injection site reactions explained", state.counselling.injectionSiteAdvice],
          ["Signs of meningococcal disease explained", state.counselling.meningitisWarningSignsAdvice],
          ["Yellow Card reporting counselled", state.postVaccine.yellowCardAdvice],
          ["PIL and written record given", state.postVaccine.writtenRecordGiven],
          ["Infant paracetamol advice given", state.postVaccine.paracetamolAdvice],
          ["Next dose booked", state.postVaccine.reviewScheduleAdvice],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Meningitis B (Bexsero and Trumenba)"
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

      <p className="text-[10px] text-gray-500 text-center">{MENB_PGD_VERSION}</p>
      <ReportFooter pgdName="Meningitis B Vaccination" />
    </div>
  );
}
