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
import {
  createInitialConsultationState,
  STEP_LABELS,
  type GenitalWartsConsultationState,
} from "./lib/genital-warts-types";
import {
  getAllAlerts,
  suggestedAgent,
  doseSchedule,
} from "./lib/genital-warts-clinical-logic";
import { validateStep } from "./lib/genital-warts-validation";

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
  const suggestion = suggestedAgent(state);
  const schedule = doseSchedule(state.treatment.agent);
  const canProceed = validateStep(currentStep, effectiveState);

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
      clinicalData: effectiveState as unknown as Record<string, unknown>,
      outcome: "completed",
      summary: {
        pharmacistName: effectiveSummary.pharmacistName,
        pharmacistGPhC: effectiveSummary.pharmacistGPhC,
        consultationDate: effectiveSummary.consultationDate,
        consultationTime: effectiveSummary.consultationTime,
      },
    }),
    [state, effectiveState, effectiveSummary],
  );

  const isPodo = state.treatment.agent === "podophyllotoxin";

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={STEP_LABELS.length} />

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      <StepWrapper
        title={STEP_LABELS[currentStep]}
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={
          !canProceed
            ? alerts.some((a) => a.severity === "stop")
              ? "This patient is excluded under the PGD. Review the alerts above, advise on alternatives and refer as appropriate."
              : "Please complete all required fields"
            : null
        }
        getConsultationData={getConsultationData}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, [field]: value },
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

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput
                label="Number of warts"
                value={state.assessment.wartCount}
                onChange={(v) => updateAssessment("wartCount", v)}
                min={0}
                required
              />
              <NumberInput
                label="Total treatment area"
                value={state.assessment.treatmentAreaCm2}
                onChange={(v) => updateAssessment("treatmentAreaCm2", v)}
                min={0}
                unit="cm²"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <Checkbox
                label="Sexual history taken (partners, barrier use, concurrent STIs)"
                checked={state.assessment.sexualHistoryTaken}
                onChange={(v) => updateAssessment("sexualHistoryTaken", v)}
              />
              <Checkbox
                label="Full STI screening offered or signposted"
                checked={state.assessment.stiScreeningOffered}
                onChange={(v) => updateAssessment("stiScreeningOffered", v)}
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
                Hard exclusions. Any of these and the PGD cannot be used.
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
              label="Known hypersensitivity to the intended agent"
              checked={state.assessment.hypersensitivityToAgent}
              onChange={(v) => updateAssessment("hypersensitivityToAgent", v)}
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
              onChange={(v) =>
                updateTreatment(
                  "agent",
                  v as GenitalWartsConsultationState["treatment"]["agent"],
                )
              }
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
                onChange={(v) => updateTreatment("podophyllotoxinForm", v)}
                options={[
                  { value: "solution", label: "0.5% solution, 15 mL bottle" },
                  { value: "cream", label: "0.15% cream, 5 g tube" },
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
              label="Quantity supplied"
              value={state.treatment.quantitySupplied}
              onChange={(v) => updateTreatment("quantitySupplied", v)}
              placeholder={
                isPodo ? "e.g. 1 x 15 mL bottle" : "e.g. 12 sachets"
              }
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
              label="Review date"
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
              label="Consistent condom use counselled, even once the warts are treated"
              checked={state.counselling.condomsCounselled}
              onChange={(v) => updateCounselling("condomsCounselled", v)}
            />
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
              Review booked for {state.treatment.reviewDate || "a date to be arranged"}.
            </p>
            {schedule && (
              <p className="text-xs text-green-800 mt-2">{schedule.review}</p>
            )}
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
