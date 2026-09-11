"use client";

import { useCallback, useMemo, useState } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  TextArea,
  Checkbox,
  SelectInput,
  NumberInput,
} from "../shared/components/FormInputs";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { calculateAge } from "../shared/types";
import {
  createInitialConsultationState,
  STEP_LABELS,
  PGD_VERSION_LINE,
  fixedQuantity,
  addDays,
  REVIEW_INTERVAL_DAYS,
  MAX_SUPPLIES,
  REVIEW_BEFORE_SUPPLY,
  type GenitalWartsConsultationState,
} from "./lib/genital-warts-types";
import {
  getAllAlerts,
  hasHardStops,
  suggestedAgent,
  doseSchedule,
} from "./lib/genital-warts-clinical-logic";
import { validateStep } from "./lib/genital-warts-validation";
import { GenitalWartsSummaryReport } from "./components/GenitalWartsSummaryReport";

export function GenitalWartsClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<GenitalWartsConsultationState>(
    createInitialConsultationState,
  );

  const pharmProfile = usePharmacistProfile();

  /**
   * The logged-in pharmacist's details fill the summary fields, but they are
   * derived at render rather than copied into state by an effect. Seeding
   * state from an effect is what the other tools do and it costs a cascading
   * render on every profile load; deriving it means the field shows the right
   * value immediately, the pharmacist can still type over it, and validation
   * sees the same value the pharmacist does.
   */
  const effectiveSummary = useMemo(
    () => ({
      ...state.summary,
      pharmacistName: state.summary.pharmacistName || pharmProfile?.name || "",
      pharmacistGPhC:
        state.summary.pharmacistGPhC || pharmProfile?.gphcNumber || "",
      pharmacyName:
        state.summary.pharmacyName || pharmProfile?.pharmacyName || "",
      pharmacyAddress:
        state.summary.pharmacyAddress || pharmProfile?.pharmacyAddress || "",
    }),
    [state.summary, pharmProfile],
  );

  const effectiveState: GenitalWartsConsultationState = useMemo(
    () => ({ ...state, summary: effectiveSummary }),
    [state, effectiveSummary],
  );

  function updateAssessment<
    K extends keyof GenitalWartsConsultationState["assessment"],
  >(field: K, value: GenitalWartsConsultationState["assessment"][K]) {
    setState((prev) => ({
      ...prev,
      assessment: { ...prev.assessment, [field]: value },
    }));
  }

  function updateTreatment<
    K extends keyof GenitalWartsConsultationState["treatment"],
  >(field: K, value: GenitalWartsConsultationState["treatment"][K]) {
    setState((prev) => ({
      ...prev,
      treatment: { ...prev.treatment, [field]: value },
    }));
  }

  function updateCounselling<
    K extends keyof GenitalWartsConsultationState["counselling"],
  >(field: K, value: GenitalWartsConsultationState["counselling"][K]) {
    setState((prev) => ({
      ...prev,
      counselling: { ...prev.counselling, [field]: value },
    }));
  }

  function updateSummary<
    K extends keyof GenitalWartsConsultationState["summary"],
  >(field: K, value: GenitalWartsConsultationState["summary"][K]) {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, [field]: value },
    }));
  }

  const alerts = getAllAlerts(state);
  const hasStops = hasHardStops(state);
  const suggestion = suggestedAgent(state);
  const schedule = doseSchedule(state.treatment.agent);
  const validationError = validateStep(currentStep, effectiveState);
  // A stop anywhere disables Next on every step; the progress bar only goes
  // backwards, so this is the only forward path.
  const canProceed = !validationError && !hasStops;

  const handleNext = () =>
    setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const getConsultationData = useCallback(
    (): ConsultationRecordData | null => ({
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
      clinicalData: { ...effectiveState, alerts } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && state.treatment.agent
          ? {
              name:
                state.treatment.agent === "imiquimod"
                  ? "Imiquimod 5% cream"
                  : state.treatment.podophyllotoxinForm === "cream"
                    ? "Podophyllotoxin 0.15% cream"
                    : "Podophyllotoxin 0.5% solution",
              dose: schedule?.regimen,
              duration: schedule?.course,
              quantity: state.treatment.quantitySupplied,
            }
          : undefined,
      summary: {
        pharmacistName: effectiveSummary.pharmacistName,
        pharmacistGPhC: effectiveSummary.pharmacistGPhC,
        pharmacyName: effectiveSummary.pharmacyName,
        pharmacyAddress: effectiveSummary.pharmacyAddress,
        consultationDate: effectiveSummary.consultationDate,
        consultationTime: effectiveSummary.consultationTime,
        clinicalNotes: [
          hasStops && state.summary.referralAdvice ? `Advice given on referral: ${state.summary.referralAdvice}` : "",
          state.summary.adverseDrugReactions ? `Adverse drug reactions: ${state.summary.adverseDrugReactions}` : "",
          state.summary.clinicalNotes,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      consent: { notifyGp: state.consent.notifyGp },
    }),
    [state, effectiveState, effectiveSummary, hasStops, alerts, schedule],
  );

  const handleNewConsultation = useCallback(() => {
    setState(createInitialConsultationState());
    setCurrentStep(0);
  }, []);

  const isPodo = state.treatment.agent === "podophyllotoxin";

  return (
    <>
    <div className="space-y-6 print:hidden">
      <ProgressBar current={currentStep + 1} total={STEP_LABELS.length} />

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {hasStops && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
          <p className="text-sm font-medium text-red-800">
            Not supplied under this PGD. Record the advice given and the referral made, then use "Save as not supplied".
          </p>
          <TextArea
            label="Advice given and decision reached (PGD records requirement)"
            value={state.summary.referralAdvice}
            onChange={(v) => updateSummary("referralAdvice", v)}
            placeholder="e.g. Referred to the sexual health clinic for assessment; advised on transmission and partner screening"
            rows={2}
            required
          />
        </div>
      )}

      <StepWrapper
        title={STEP_LABELS[currentStep]}
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={
          validationError
            ? validationError
            : hasStops
              ? "This patient is excluded under the PGD. Review the alerts above, advise on alternatives and refer as appropriate."
              : null
        }
        isBlocked={hasStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            requireAdult
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  [field]: value,
                  // Age gates both PGDs (18 and over); it must be derived here
                  // or the under-18 stop never fires.
                  ...(field === "dateOfBirth"
                    ? { age: calculateAge(typeof value === "string" ? value : "") }
                    : {}),
                },
              }))
            }
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                consent: { ...prev.consent, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold">
                Diagnosis is clinical: visual examination of visible warts on
                the external anogenital area.
              </p>
              <p className="mt-1">
                External genital and perianal warts are in scope. Urethral,
                vaginal, cervical and rectal warts are not.
              </p>
            </div>

            <Checkbox
              label="Visible external genital warts confirmed on examination"
              checked={state.assessment.externalWartsConfirmed}
              onChange={(v) => updateAssessment("externalWartsConfirmed", v)}
              description="PGD inclusion criterion: required before supply."
              required
            />
            <Checkbox
              label="External perianal warts present"
              checked={state.assessment.perianalExternalWarts}
              onChange={(v) => updateAssessment("perianalExternalWarts", v)}
              description="In scope under this PGD, unlike rectal warts."
            />
            <Checkbox
              label="Lesions are keratinised"
              checked={state.assessment.keratinised}
              onChange={(v) => updateAssessment("keratinised", v)}
              description="Points towards imiquimod rather than podophyllotoxin."
            />
            <Checkbox
              label="Patient is able to identify the warts and apply treatment to the warts only, not healthy skin"
              checked={state.assessment.ableToSelfApply}
              onChange={(v) => updateAssessment("ableToSelfApply", v)}
              description="Inclusion criterion for patient-applied treatment under both PGDs."
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput
                label="Number of warts"
                value={state.assessment.wartCount}
                onChange={(v) => updateAssessment("wartCount", v)}
                min={1}
                required
              />
              <NumberInput
                label="Total treatment area (podophyllotoxin: up to and including 4 cm2)"
                value={state.assessment.treatmentAreaCm2}
                onChange={(v) => updateAssessment("treatmentAreaCm2", v)}
                min={0.1}
                unit="cm2"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <Checkbox
                label="Sexual history taken (partners, barrier use, concurrent STIs)"
                checked={state.assessment.sexualHistoryTaken}
                onChange={(v) => updateAssessment("sexualHistoryTaken", v)}
                description="Required before supply."
                required
              />
              <Checkbox
                label="Full STI screening offered or signposted"
                checked={state.assessment.stiScreeningOffered}
                onChange={(v) => updateAssessment("stiScreeningOffered", v)}
                description="Required before supply."
                required
              />
              <Checkbox
                label="Cervical screening confirmed up to date (where applicable)"
                checked={state.assessment.cervicalScreeningUpToDate}
                onChange={(v) =>
                  updateAssessment("cervicalScreeningUpToDate", v)
                }
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">
                Hard exclusions. Any of these and the PGD cannot be used
                (the two hypersensitivity items exclude that agent only).
              </p>
            </div>

            <SelectInput
              label="Pregnancy status"
              value={state.assessment.pregnancyStatus}
              onChange={(v) => updateAssessment("pregnancyStatus", v)}
              options={[
                { value: "not-applicable", label: "Not applicable" },
                { value: "not-pregnant", label: "Not pregnant" },
                { value: "possible", label: "Pregnancy possible / not excluded" },
                { value: "confirmed", label: "Pregnant" },
              ]}
              required
            />

            <Checkbox
              label="Internal warts: urethral, vaginal, cervical or rectal"
              checked={state.assessment.internalWarts}
              onChange={(v) => updateAssessment("internalWarts", v)}
              description="Specialist assessment required. Not treatable under this PGD."
            />
            <Checkbox
              label="Breastfeeding"
              checked={state.assessment.breastfeeding}
              onChange={(v) => updateAssessment("breastfeeding", v)}
            />
            <Checkbox
              label="Open wounds or broken skin at the application site"
              checked={state.assessment.openWoundsPresent}
              onChange={(v) => updateAssessment("openWoundsPresent", v)}
            />
            <Checkbox
              label="Known hypersensitivity to podophyllotoxin or its excipients"
              checked={state.assessment.hypersensitivityPodophyllotoxin}
              onChange={(v) => updateAssessment("hypersensitivityPodophyllotoxin", v)}
              description="Excludes the podophyllotoxin arm only; imiquimod may still be used if otherwise suitable."
            />
            <Checkbox
              label="Known hypersensitivity to imiquimod or its excipients"
              checked={state.assessment.hypersensitivityImiquimod}
              onChange={(v) => updateAssessment("hypersensitivityImiquimod", v)}
              description="Excludes the imiquimod arm only; podophyllotoxin may still be used if otherwise suitable."
            />

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                Refer, do not treat
              </p>
              <Checkbox
                label="Atypical appearance, bleeding or ulceration"
                checked={state.assessment.suspiciousLesion}
                onChange={(v) => updateAssessment("suspiciousLesion", v)}
                description="Refer for biopsy to exclude squamous cell carcinoma."
              />
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">
                Cautions. Treatment may proceed with extra counselling.
              </p>
              <Checkbox
                label="Immunocompromised"
                checked={state.assessment.immunosuppressed}
                onChange={(v) => updateAssessment("immunosuppressed", v)}
              />
              <Checkbox
                label="Uncircumcised male"
                checked={state.assessment.uncircumcisedMale}
                onChange={(v) => updateAssessment("uncircumcisedMale", v)}
                description="Imiquimod carries a risk of phimosis."
              />
              <Checkbox
                label="Autoimmune condition"
                checked={state.assessment.autoimmuneCondition}
                onChange={(v) => updateAssessment("autoimmuneCondition", v)}
                description="Imiquimod may exacerbate autoimmune disease."
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            {suggestion && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                <p className="font-semibold">
                  The PGD points to{" "}
                  {suggestion.agent === "imiquimod"
                    ? "imiquimod 5% cream"
                    : "podophyllotoxin"}
                  .
                </p>
                <p className="mt-1">{suggestion.reason}</p>
              </div>
            )}

            <SelectInput
              label="Agent supplied"
              value={state.treatment.agent}
              onChange={(v) => {
                const agent = v as GenitalWartsConsultationState["treatment"]["agent"];
                setState((prev) => ({
                  ...prev,
                  treatment: {
                    ...prev.treatment,
                    agent,
                    podophyllotoxinForm: agent === "podophyllotoxin" ? prev.treatment.podophyllotoxinForm : "",
                    quantitySupplied: fixedQuantity(agent, agent === "podophyllotoxin" ? prev.treatment.podophyllotoxinForm : ""),
                    reviewDate: agent ? addDays(prev.summary.consultationDate, REVIEW_INTERVAL_DAYS[agent]) : "",
                  },
                }));
              }}
              options={[
                {
                  value: "podophyllotoxin",
                  label:
                    "Podophyllotoxin 0.5% solution / 0.15% cream (Warticon, Condyline)",
                },
                { value: "imiquimod", label: "Imiquimod 5% cream (Aldara)" },
              ]}
              required
            />

            {isPodo && (
              <SelectInput
                label="Podophyllotoxin form"
                value={state.treatment.podophyllotoxinForm}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: {
                      ...prev.treatment,
                      podophyllotoxinForm: v,
                      quantitySupplied: fixedQuantity("podophyllotoxin", v),
                    },
                  }))
                }
                options={[
                  { value: "solution", label: "0.5% solution, 3 mL bottle (Warticon) or 3.5 mL bottle (Condyline)" },
                  { value: "cream", label: "0.15% cream, 5 g tube (Warticon)" },
                ]}
                required
              />
            )}

            {schedule && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  Dosing under the PGD
                </p>
                <p className="text-sm text-gray-700">{schedule.regimen}</p>
                <p className="text-sm text-gray-700">{schedule.course}</p>
                <p className="text-sm text-gray-700">{schedule.review}</p>
                <p className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                  Quantity: {schedule.quantity}
                </p>
              </div>
            )}

            <TextInput
              label="Brand supplied"
              value={state.treatment.brand}
              onChange={(v) => updateTreatment("brand", v)}
              placeholder={isPodo ? "e.g. Warticon, Condyline" : "e.g. Aldara"}
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput
                label={isPodo ? "Pack number in this course (1 covers the course; 2 only at the review after 2 cycles)" : "Dispensing number in this course (1 to 4)"}
                value={state.treatment.supplyNumber}
                onChange={(v) => updateTreatment("supplyNumber", v)}
                min={1}
                max={isPodo ? MAX_SUPPLIES.podophyllotoxin : MAX_SUPPLIES.imiquimod}
                required
              />
              {state.treatment.agent && state.treatment.supplyNumber !== null && state.treatment.supplyNumber >= REVIEW_BEFORE_SUPPLY[state.treatment.agent] && (
                <SelectInput
                  label={isPodo ? "Outcome of the review after 2 cycles" : "Outcome of the 8-week review"}
                  value={state.treatment.priorReviewOutcome}
                  onChange={(v) =>
                    updateTreatment(
                      "priorReviewOutcome",
                      v as GenitalWartsConsultationState["treatment"]["priorReviewOutcome"],
                    )
                  }
                  options={[
                    { value: "persisting", label: isPodo ? "Warts persist: continue treatment (second pack supplied at this review)" : "Warts persist: continue treatment" },
                    { value: "cleared", label: "Complete clearance: stop treatment (no supply)" },
                  ]}
                  required
                />
              )}
            </div>

            <TextInput
              label="Quantity supplied (fixed by the PGD for this agent and form)"
              value={state.treatment.quantitySupplied}
              onChange={() => undefined}
              disabled
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.treatment.batchNumber}
                onChange={(v) => updateTreatment("batchNumber", v)}
                required
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={(v) => updateTreatment("expiryDate", v)}
                required
              />
            </div>

            <TextInput
              label={isPodo ? "Review date (PGD: after 2 cycles, within 14 days)" : "Review date (PGD: at 8 weeks, within 56 days)"}
              type="date"
              value={state.treatment.reviewDate}
              onChange={(v) => updateTreatment("reviewDate", v)}
              required
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <Checkbox
              label="Application technique explained: apply to the warts only, not surrounding healthy skin"
              checked={state.counselling.applicationTechniqueExplained}
              onChange={(v) =>
                updateCounselling("applicationTechniqueExplained", v)
              }
            />
            <Checkbox
              label="Petroleum jelly as a barrier on surrounding healthy skin explained"
              checked={state.counselling.barrierProtectionExplained}
              onChange={(v) =>
                updateCounselling("barrierProtectionExplained", v)
              }
            />
            <Checkbox
              label="Local reactions discussed: irritation, erythema, erosion, scabbing, pain and burning at the site"
              checked={state.counselling.localReactionsDiscussed}
              onChange={(v) => updateCounselling("localReactionsDiscussed", v)}
            />
            <Checkbox
              label="Avoid all sexual contact while the treatment is on the skin"
              checked={state.counselling.avoidSexualContactWhileApplied}
              onChange={(v) =>
                updateCounselling("avoidSexualContactWhileApplied", v)
              }
              description={
                isPodo
                  ? undefined
                  : "Imiquimod cream can transfer to a partner."
              }
            />
            <Checkbox
              label={
                isPodo
                  ? "Consistent condom use counselled at other times, even once the warts are treated, to reduce transmission"
                  : "Consistent condom use counselled at other times (when no cream is on the skin), even once the warts are treated"
              }
              checked={state.counselling.condomsCounselled}
              onChange={(v) => updateCounselling("condomsCounselled", v)}
            />
            {state.treatment.agent === "imiquimod" && (
              <Checkbox
                label="Imiquimod weakens condoms and diaphragms: they cannot be relied on while cream is on the skin. Wash the cream off before sexual activity"
                checked={state.counselling.condomWeakeningExplained}
                onChange={(v) => updateCounselling("condomWeakeningExplained", v)}
                required
              />
            )}
            <Checkbox
              label="Partner notification discussed: partners may need screening or treatment"
              checked={state.counselling.partnerNotificationDiscussed}
              onChange={(v) =>
                updateCounselling("partnerNotificationDiscussed", v)
              }
            />
            <Checkbox
              label="Advised to complete the full course even if the warts appear to clear"
              checked={state.counselling.completeCourseAdvised}
              onChange={(v) => updateCounselling("completeCourseAdvised", v)}
            />
            <Checkbox
              label="Hand washing after application emphasised"
              checked={state.counselling.handWashingAdvised}
              onChange={(v) => updateCounselling("handWashingAdvised", v)}
            />
            <Checkbox
              label="HPV vaccination discussed"
              checked={state.counselling.hpvVaccinationDiscussed}
              onChange={(v) => updateCounselling("hpvVaccinationDiscussed", v)}
              description="Can help prevent other HPV types and recurrence."
            />
            <Checkbox
              label="Yellow Card scheme explained for suspected adverse reactions"
              checked={state.counselling.yellowCardExplained}
              onChange={(v) => updateCounselling("yellowCardExplained", v)}
            />
            <Checkbox
              label="Patient information leaflet supplied"
              checked={state.counselling.pilSupplied}
              onChange={(v) => updateCounselling("pilSupplied", v)}
            />
            <Checkbox
              label="Safety netting: seek advice if warts worsen, spread significantly or do not improve after the treatment cycles; report severe local reaction, excessive pain, bleeding, signs of infection or systemic symptoms (fever, severe headache)"
              checked={state.counselling.safetyNettingGiven}
              onChange={(v) => updateCounselling("safetyNettingGiven", v)}
            />
            <Checkbox
              label="Attend the follow-up appointment to assess response; regular sexual health screening recommended; if pregnant, inform the healthcare provider (treatment deferred until after pregnancy)"
              checked={state.counselling.followUpAndScreeningAdvised}
              onChange={(v) => updateCounselling("followUpAndScreeningAdvised", v)}
            />

            {isPodo && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">
                  Podophyllotoxin specific
                </p>
                <Checkbox
                  label="Teratogenicity explained and effective contraception counselled"
                  checked={state.counselling.contraceptionCounselled}
                  onChange={(v) =>
                    updateCounselling("contraceptionCounselled", v)
                  }
                />
                {state.treatment.podophyllotoxinForm === "solution" && (
                  <Checkbox
                    label="Flammability warning given: keep away from heat and ignition sources"
                    checked={state.counselling.flammabilityWarningGiven}
                    onChange={(v) =>
                      updateCounselling("flammabilityWarningGiven", v)
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={effectiveSummary.pharmacistName}
              onChange={(v) => updateSummary("pharmacistName", v)}
              required
            />
            <TextInput
              label="GPhC registration"
              value={effectiveSummary.pharmacistGPhC}
              onChange={(v) => updateSummary("pharmacistGPhC", v)}
              required
            />
            <TextInput
              label="Pharmacy name"
              value={effectiveSummary.pharmacyName}
              onChange={(v) => updateSummary("pharmacyName", v)}
            />
            <TextInput
              label="Pharmacy address"
              value={effectiveSummary.pharmacyAddress}
              onChange={(v) => updateSummary("pharmacyAddress", v)}
            />
            <TextArea
              label="Adverse drug reactions reported and actions taken (leave blank if none)"
              value={effectiveSummary.adverseDrugReactions}
              onChange={(v) => updateSummary("adverseDrugReactions", v)}
              rows={2}
            />
            <TextArea
              label="Clinical notes"
              value={effectiveSummary.clinicalNotes}
              onChange={(v) => updateSummary("clinicalNotes", v)}
              rows={3}
            />
          </div>
        )}

        {currentStep === 7 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">
              Consultation record complete
            </p>
            <p className="text-sm text-green-800 mt-1">
              {state.treatment.agent === "imiquimod"
                ? "Imiquimod 5% cream supplied."
                : "Podophyllotoxin supplied."}{" "}
              {state.treatment.quantitySupplied}. Review booked for {state.treatment.reviewDate || "a date to be arranged"}.
            </p>
            <p className="text-xs text-green-800 mt-1">Supplied under the {PGD_VERSION_LINE}.</p>
            {schedule && (
              <p className="text-xs text-green-800 mt-2">{schedule.review}</p>
            )}
            <p className="text-xs text-green-800 mt-2">
              "Save & Print Record" saves the consultation and prints the full PGD consultation record (patient, consent, assessment, exclusions, medicine, counselling and practitioner declaration).
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
    <div className="hidden print:block">
      <GenitalWartsSummaryReport state={effectiveState} alerts={alerts} />
    </div>
    </>
  );
}
