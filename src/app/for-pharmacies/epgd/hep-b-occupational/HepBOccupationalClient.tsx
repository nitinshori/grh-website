"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import { calculateAge } from "../shared/types";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  PGD_VERSION,
  VACCINE_LABEL,
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialHepBOccupationalState,
  type HepBState,
  type Vaccine,
  type Schedule,
  type DoseNumber,
  type PreviousVaccination,
  type ExclusionReferral,
} from "./lib/hep_b_occupational-types";
import {
  getAllAlerts,
  hasHardStops,
  getDoseRule,
  doseOptionsFor,
  computeNextDoseDate,
  parseLocalDate,
  todayLocal,
  daysBetween,
} from "./lib/hep_b_occupational-clinical-logic";
import { validateStep } from "./lib/hep_b_occupational-validation";
import { HepBOccupationalSummaryReport } from "./components/HepBOccupationalSummaryReport";

/**
 * Hepatitis B (Engerix B / HBvaxPRO) ePGD, aligned to the signed document
 * "Patient Group Direction for the administration of Engerix B for vaccination
 * against Hepatitis B" (two arms: Engerix B and HBvaxPRO), PGD version 005,
 * issued 11 September 2026. Individuals aged 16 years and over; under 16
 * refers. Standard (0, 1, 6 months) and accelerated (0, 1, 2, 12 months)
 * schedules only.
 *
 * Fix round, 11 September 2026 (adversarial review findings_2): the clinical
 * logic, types and validators now live in lib/ and are what the client runs;
 * the vaccine is chosen, not pre-selected; the previous dose date is captured
 * and the interval checked; the next dose date is computed; a stop on any
 * step offers "Save as not supplied" with the advice recorded; the final step
 * prints a real record; New Consultation resets everything.
 */
export default function HepBOccupationalClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<HepBState>(createInitialHepBOccupationalState);

  const handleNewConsultation = useCallback(() => {
    setState(createInitialHepBOccupationalState());
    setCurrentStep(0);
  }, []);

  // Auto-fill pharmacist details from the logged-in user. Refires when the
  // fields are empty (after New Consultation), so subsequent patients fill too.
  const profile = usePharmacistProfile();
  useEffect(() => {
    if (!profile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, pharmacistName: profile.name, pharmacistGPhC: profile.gphcNumber, pharmacyName: profile.pharmacyName, pharmacyAddress: profile.pharmacyAddress },
    }));
  }, [profile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const isUnder16 = state.patient.age !== null && state.patient.age < 16;

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hasStopAlerts = hasHardStops(alerts);
  const stopReason = alerts.find((a) => a.severity === "stop");

  // Next dose date and course-complete flag are derived from the schedule and
  // dose number, never typed: the document requires "the date the next dose is
  // due" to be recorded, and a typed date is whatever was typed.
  const nextDoseDate = computeNextDoseDate(state.treatment.schedule, state.treatment.doseNumber);
  const doseRule = getDoseRule(state.treatment.schedule, state.treatment.doseNumber);
  const courseComplete = doseRule !== null && doseRule.nextMonths === null;

  const previousDoseRequired = doseRule !== null && doseRule.minDays !== null;
  const prevDate = parseLocalDate(state.treatment.previousDoseDate);
  const daysSincePrevious = prevDate ? daysBetween(prevDate, todayLocal()) : null;

  const validationError = hasStopAlerts && currentStep !== 2 && currentStep !== 3 && stopReason
    ? `Exclusion criteria met: ${stopReason.message}. Record the advice given and save as not supplied.`
    : validateStep(currentStep, state, alerts);
  // A stop anywhere disables Next on every step and Save & Print on the last.
  const canProceed = validationError === null && !hasStopAlerts;

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, [canProceed]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const setAssessment = <K extends keyof HepBState["assessment"]>(field: K, value: HepBState["assessment"][K]) =>
    setState((prev) => ({ ...prev, assessment: { ...prev.assessment, [field]: value } }));
  const setTreatment = <K extends keyof HepBState["treatment"]>(field: K, value: HepBState["treatment"][K]) =>
    setState((prev) => ({ ...prev, treatment: { ...prev.treatment, [field]: value } }));
  const setCounselling = <K extends keyof HepBState["counselling"]>(field: K, value: HepBState["counselling"][K]) =>
    setState((prev) => ({ ...prev, counselling: { ...prev.counselling, [field]: value } }));
  const setSummary = <K extends keyof HepBState["summary"]>(field: K, value: HepBState["summary"][K]) =>
    setState((prev) => ({ ...prev, summary: { ...prev.summary, [field]: value } }));

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const vaccine = state.treatment.vaccine;
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
      clinicalData: {
        ...state,
        counselling: { ...state.counselling, nextDoseDate, courseComplete },
        alerts,
        pgdVersion: PGD_VERSION,
        vaccineLabel: !hasStopAlerts && vaccine ? VACCINE_LABEL[vaccine] : "",
        dose: hasStopAlerts ? null : "1 mL",
        route: hasStopAlerts ? null : "Intramuscular",
        nextDoseDate,
        courseComplete,
        exclusion: hasStopAlerts
          ? { reasons: alerts.filter((a) => a.severity === "stop").map((a) => a.message), advice: state.assessment.exclusionAdvice, referral: state.assessment.exclusionReferral }
          : null,
        adverseReaction: state.treatment.adverseReaction ? state.treatment.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: hasStopAlerts
        ? (state.assessment.exclusionReferral && state.assessment.exclusionReferral !== "declined" ? "referred" : "not_supplied")
        : "completed",
      ...(hasStopAlerts || !vaccine
        ? {}
        : {
            medicine: {
              name: VACCINE_LABEL[vaccine],
              dose: `1 mL intramuscular, ${state.treatment.doseNumber || "dose"}${state.treatment.schedule ? `, ${state.treatment.schedule} schedule` : ""}`,
              duration: courseComplete ? "Course complete" : nextDoseDate ? `Next dose due ${nextDoseDate}` : "",
              quantity: 1,
            },
          }),
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.counselling.gpInformed === "informed" },
    };
  }, [state, alerts, hasStopAlerts, nextDoseDate, courseComplete]);

  // Shown wherever a stop is on screen. The document: "Document any advice
  // given and the decision reached. Inform or refer to the GP as appropriate."
  const exclusionOutcomeBlock = hasStopAlerts ? (
    <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 print:hidden">
      <p className="text-sm font-semibold text-red-800">Exclusion: record the advice given and the decision reached</p>
      <p className="text-xs text-red-800">No vaccine can be given under this PGD while an exclusion applies. Advise on alternative options and how to access them, then use &quot;Save as not supplied&quot; in the step footer.</p>
      <TextArea
        label="Advice given and decision reached"
        value={state.assessment.exclusionAdvice}
        onChange={(v) => setAssessment("exclusionAdvice", v)}
        rows={3}
        placeholder="e.g. Aged 15: not vaccinated under this PGD; referred to GP for the childhood or occupational programme"
        required
      />
      <SelectInput
        label="GP informed or referral"
        value={state.assessment.exclusionReferral}
        onChange={(v) => setAssessment("exclusionReferral", v as ExclusionReferral)}
        options={[
          { value: "gp", label: "Referred to GP" },
          { value: "occupational-health", label: "Referred to occupational health" },
          { value: "immunisation-service", label: "Referred to an immunisation service or specialist" },
          { value: "declined", label: "Patient declined referral; advice given" },
        ]}
        required
      />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={TOTAL_STEPS} />
      <StepWrapper
        title={STEP_LABELS[currentStep]}
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hasStopAlerts}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep !== 2 && currentStep !== 3 && currentStep !== 6 && hasStopAlerts && (
          <div className="space-y-4 mb-4">
            <AlertBanner alerts={alerts} />
            {exclusionOutcomeBlock}
          </div>
        )}

        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}) } }))}
            requireAdult={false}
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}
            {exclusionOutcomeBlock}

            <SelectInput
              label="Reason for Vaccination"
              value={state.assessment.reasonForVaccination}
              onChange={(v) => setAssessment("reasonForVaccination", v)}
              options={[
                { value: "healthcare-worker", label: "Healthcare Worker" },
                { value: "care-worker", label: "Care Worker" },
                { value: "first-responder", label: "First Responder" },
                { value: "laboratory-worker", label: "Laboratory Worker" },
                { value: "mortuary-embalming", label: "Mortuary/Embalming Worker" },
                { value: "sex-worker", label: "Sex Worker" },
                { value: "ivdu", label: "Intravenous Drug User" },
                { value: "household-contact", label: "Household Contact of HBV Carrier" },
                { value: "travel", label: "Travel to a high-prevalence country" },
                { value: "other-occupational", label: "Other Occupational Exposure" },
                { value: "other-lifestyle", label: "Other Lifestyle Risk" },
              ]}
              required
            />

            <Checkbox
              label="Eligible under national immunisation (Green Book chapter 18) or occupational health guidance (inclusion criterion)"
              checked={state.assessment.eligibleUnderGuidance}
              onChange={(v) => setAssessment("eligibleUnderGuidance", v)}
              required
            />

            <SelectInput
              label="Previous Hepatitis B Vaccination"
              value={state.assessment.previousVaccination}
              onChange={(v) => setAssessment("previousVaccination", v as PreviousVaccination)}
              options={[
                { value: "none", label: "None" },
                { value: "partial-course", label: "Partial Course (1-2 doses): resume, do not restart" },
                { value: "full-course", label: "Full Course (3 doses): booster only" },
              ]}
              required
            />

            {state.assessment.previousVaccination === "full-course" && (
              <>
                <Checkbox
                  label="Anti-HBs level checked"
                  checked={state.assessment.antiHBsLevelChecked}
                  onChange={(v) => setAssessment("antiHBsLevelChecked", v)}
                />
                {state.assessment.antiHBsLevelChecked && (
                  <SelectInput
                    label="Anti-HBs Level"
                    value={state.assessment.antiHBsLevel}
                    onChange={(v) => setAssessment("antiHBsLevel", v)}
                    options={[
                      { value: "above-10", label: ">10 IU/L (Good Immunity)" },
                      { value: "below-10", label: "<10 IU/L (Non-immune; repeat course may be indicated)" },
                    ]}
                  />
                )}
              </>
            )}

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-3">Contraindications</p>
              <div className="space-y-2">
                <Checkbox label="Known Hepatitis B Positive" checked={state.assessment.knownHBPositive} onChange={(v) => setAssessment("knownHBPositive", v)} />
                <Checkbox label="Known hypersensitivity to the active substance or any excipient (including yeast)" checked={state.assessment.allergyVaccineComponent} onChange={(v) => setAssessment("allergyVaccineComponent", v)} />
                <Checkbox label="Previous allergic reaction to any hepatitis B vaccine" checked={state.assessment.previousSevereReaction} onChange={(v) => setAssessment("previousSevereReaction", v)} />
                <Checkbox label="Acute severe febrile illness (postpone until recovered)" checked={state.assessment.currentAcuteIllness} onChange={(v) => setAssessment("currentAcuteIllness", v)} />
                {isUnder16 && (
                  <p className="text-xs text-red-800">Patient is under 16 (from date of birth): not vaccinated under this PGD, refer.</p>
                )}
              </div>
            </div>

            <Checkbox label="Known Hepatitis C Positive" checked={state.assessment.knownHCVPositive} onChange={(v) => setAssessment("knownHCVPositive", v)} />
            <Checkbox label="Known HIV Positive" checked={state.assessment.knownHIVPositive} onChange={(v) => setAssessment("knownHIVPositive", v)} />
            <Checkbox label="Immunosuppressed" checked={state.assessment.immunosuppressed} onChange={(v) => setAssessment("immunosuppressed", v)} />
            <Checkbox label="Pregnant (not a contraindication: safe in pregnancy and breastfeeding; may be given where indicated)" checked={state.assessment.pregnancy} onChange={(v) => setAssessment("pregnancy", v)} />
            <Checkbox label="Bleeding disorder or on anticoagulants (caution: fine needle, firm pressure 2 minutes)" checked={state.assessment.bleedingDisorderOrAnticoagulant} onChange={(v) => setAssessment("bleedingDisorderOrAnticoagulant", v)} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}
            {exclusionOutcomeBlock}

            <Checkbox
              label="Adrenaline (epinephrine) 1 in 1,000 injection immediately available in the room, in date, with a telephone and a written anaphylaxis protocol (Resuscitation Council UK)"
              checked={state.treatment.adrenalineAvailable}
              onChange={(v) => setTreatment("adrenalineAvailable", v)}
              required
            />

            <SelectInput
              label="Vaccine (brand given)"
              value={state.treatment.vaccine}
              onChange={(v) => setTreatment("vaccine", v as Vaccine)}
              options={[
                { value: "engerix-20", label: VACCINE_LABEL["engerix-20"] },
                { value: "hbvaxpro-10", label: VACCINE_LABEL["hbvaxpro-10"] },
              ]}
              required
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Vaccine Information</p>
              <p className="text-xs text-blue-800 mt-1">{state.treatment.vaccine ? `${VACCINE_LABEL[state.treatment.vaccine]}. ` : ""}Intramuscular injection, usually in the deltoid muscle. Standard schedule 0, 1 and 6 months; accelerated schedule 0, 1, 2 and 12 months. Pre-dialysis and dialysis patients (40 microgram presentation) are not covered by this PGD; refer.</p>
            </div>

            <SelectInput
              label="Vaccination Schedule"
              value={state.treatment.schedule}
              onChange={(v) => { setTreatment("schedule", v as Schedule); }}
              options={[
                { value: "standard", label: "Standard (0, 1, 6 months)" },
                { value: "accelerated", label: "Accelerated (0, 1, 2, 12 months)" },
              ]}
              required
            />

            <SelectInput
              label="Dose Number Being Given Today"
              value={state.treatment.doseNumber}
              onChange={(v) => setTreatment("doseNumber", v as DoseNumber)}
              options={doseOptionsFor(state.treatment.schedule)}
              required
            />
            {!state.treatment.schedule && <p className="text-xs text-gray-500 -mt-4">Select the schedule first.</p>}

            {previousDoseRequired && (
              <div>
                <TextInput
                  label="Date of the previous dose"
                  type="date"
                  value={state.treatment.previousDoseDate}
                  onChange={(v) => setTreatment("previousDoseDate", v)}
                  required
                />
                {doseRule && doseRule.minDays !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {daysSincePrevious !== null && daysSincePrevious >= 0
                      ? `${daysSincePrevious} days since the previous dose; schedule minimum ${doseRule.minDays} days.`
                      : `Schedule minimum ${doseRule.minDays} days since the previous dose.`}
                  </p>
                )}
              </div>
            )}

            <SelectInput
              label="Injection Site"
              value={state.treatment.injectionSite}
              onChange={(v) => setTreatment("injectionSite", v)}
              options={[
                { value: "left-deltoid", label: "Left Deltoid" },
                { value: "right-deltoid", label: "Right Deltoid" },
              ]}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Batch Number" value={state.treatment.batchNumber} onChange={(v) => setTreatment("batchNumber", v)} required />
              <TextInput label="Expiry Date" type="date" value={state.treatment.expiryDate} onChange={(v) => setTreatment("expiryDate", v)} required />
            </div>

            <Checkbox
              label="15-minute post-vaccination observation period completed"
              checked={state.treatment.observationPeriodCompleted}
              onChange={(v) => setTreatment("observationPeriodCompleted", v)}
              required
            />
            <Checkbox
              label="Adverse reaction observed during or after vaccination"
              checked={state.treatment.adverseReaction}
              onChange={(v) => { setTreatment("adverseReaction", v); if (!v) setTreatment("adverseReactionDetails", ""); }}
            />
            {state.treatment.adverseReaction && (
              <TextArea
                label="Adverse reaction and action taken (report via Yellow Card and inform the GP)"
                value={state.treatment.adverseReactionDetails}
                onChange={(v) => setTreatment("adverseReactionDetails", v)}
                rows={2}
                required
              />
            )}

            {doseRule && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold">{courseComplete ? "Course complete with this dose" : `Next dose due: ${nextDoseDate}`}</p>
                <p className="text-xs mt-1">{doseRule.nextLabel}. Computed from the schedule and dose number; give it to the patient in writing.</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-3">Common Side Effects</p>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Injection site soreness</li>
                <li>Mild fever</li>
                <li>Fatigue (24-48 hours)</li>
                <li>Advised to report any severe reaction (anaphylaxis signs)</li>
              </ul>
            </div>

            <Checkbox label="Counselling provided to patient (common side effects; complete the full vaccination schedule)" checked={state.counselling.counsellingProvided} onChange={(v) => setCounselling("counsellingProvided", v)} required />
            <Checkbox label="Patient information leaflet (PIL) supplied" checked={state.counselling.pilSupplied} onChange={(v) => setCounselling("pilSupplied", v)} required />
            <Checkbox
              label="Follow-up advice given: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell; report suspected adverse reactions via the Yellow Card scheme"
              checked={state.counselling.followUpAdviceGiven}
              onChange={(v) => setCounselling("followUpAdviceGiven", v)}
              required
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold">{courseComplete ? "Course complete with this dose (no further dose due)" : nextDoseDate ? `Next dose due: ${nextDoseDate}` : "Next dose date: select the schedule and dose number on the Treatment step"}</p>
              {doseRule && <p className="text-xs mt-1">{doseRule.nextLabel}.</p>}
            </div>

            <Checkbox
              label="Anti-HBs serology recommended 1 to 4 months after the final dose where high-risk (e.g. healthcare workers, immunocompromised); anti-HBs 10 mIU/mL or above is protective"
              checked={state.counselling.serologyRecommended}
              onChange={(v) => setCounselling("serologyRecommended", v)}
            />
            <Checkbox
              label="Post-exposure protocol explained (if occupational exposure before course complete)"
              checked={state.counselling.postExposureProtocolExplained}
              onChange={(v) => setCounselling("postExposureProtocolExplained", v)}
            />
            <SelectInput
              label="GP informed (the document: inform the GP as appropriate)"
              value={state.counselling.gpInformed}
              onChange={(v) => setCounselling("gpInformed", v as HepBState["counselling"]["gpInformed"])}
              options={[
                { value: "informed", label: "GP informed (with the patient's consent)" },
                { value: "declined", label: "Patient declined GP notification; recorded" },
              ]}
              required
            />

            <TextArea
              label="Counselling Notes"
              value={state.counselling.counsellingNotes}
              onChange={(v) => setCounselling("counsellingNotes", v)}
              rows={3}
              placeholder="Include protection minimum titre (10 mIU/ml) and any additional advice"
              required
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist Name" value={state.summary.pharmacistName} onChange={(v) => setSummary("pharmacistName", v)} required />
            <TextInput label="GPhC Registration" value={state.summary.pharmacistGPhC} onChange={(v) => setSummary("pharmacistGPhC", v)} required />
            <TextInput label="Pharmacy Name" value={state.summary.pharmacyName} onChange={(v) => setSummary("pharmacyName", v)} required />
            <TextInput label="Pharmacy Address" value={state.summary.pharmacyAddress} onChange={(v) => setSummary("pharmacyAddress", v)} />
            <TextArea label="Clinical Notes" value={state.summary.clinicalNotes} onChange={(v) => setSummary("clinicalNotes", v)} rows={3} />
            <p className="text-xs text-gray-500">Administered under {PGD_VERSION}.</p>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            {hasStopAlerts && <div className="print:hidden"><AlertBanner alerts={alerts} />{exclusionOutcomeBlock}</div>}
            <HepBOccupationalSummaryReport
              state={state}
              alerts={alerts}
              blocked={hasStopAlerts}
              nextDoseDate={nextDoseDate}
              courseComplete={courseComplete}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
