"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { RosaceaConsultationState, RosaceaAction } from "./lib/rosacea-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialRosaceaState } from "./lib/rosacea-types";
import { getAllAlerts, hasHardStops, hasProductHardStops, PRODUCT_DETAILS, PGD_STRAPLINE } from "./lib/rosacea-clinical-logic";
import { validateStep } from "./lib/rosacea-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import { RosaceaSummaryReport } from "./components/RosaceaSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

function reducer(state: RosaceaConsultationState, action: RosaceaAction): RosaceaConsultationState {
  const newState = { ...state };
  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") newState.patient.age = calculateAge(action.value as string);
      break;
    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;
    case "UPDATE_ASSESSMENT":
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
      newState.contraindications = { ...newState.contraindications, contraindicated: hasHardStops(newState.contraindications, newState.assessment) };
      break;
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      if (action.field !== "contraindicated") {
        newState.contraindications.contraindicated = hasHardStops(newState.contraindications, newState.assessment);
      }
      break;
    case "UPDATE_TREATMENT":
      newState.treatment = { ...newState.treatment, [action.field]: action.value };
      if (action.field === "product") {
        const details = PRODUCT_DETAILS[String(action.value)];
        newState.treatment.strength = details?.strength ?? "";
        newState.treatment.frequency = details?.frequency ?? "";
        newState.treatment.duration = details?.duration ?? "";
        newState.treatment.quantity = details ? "One 30 g tube" : "";
        newState.treatment.supplyNumber = "";
        newState.treatment.brand = "";
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
    case "RESET":
      // Fresh state objects, including a fresh date and time.
      return createInitialRosaceaState();
  }
  return newState;
}

export default function RosaceaClient() {
  const [state, dispatch] = useReducer(reducer, createInitialRosaceaState());
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

  const [validationError, setValidationError] = useState<string | null>(null);
  const alerts = useMemo(() => getAllAlerts(state.assessment, state.contraindications, state.treatment), [state.assessment, state.contraindications, state.treatment]);
  // Any stop (arm-independent or for the chosen product, or an age below 18
  // from the date of birth) disables Next on every step, not just the step
  // it was raised on.
  const ageStop = state.patient.age !== null && state.patient.age < 18;
  const isBlocked = hasHardStops(state.contraindications, state.assessment) || ageStop;
  const isProductBlocked = hasProductHardStops(state.contraindications, state.treatment);
  const anyStop = isBlocked || isProductBlocked;

  const handleNext = useCallback(() => {
    if (anyStop) {
      setValidationError("Patient meets exclusion criteria");
      return;
    }
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
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
    dispatch({ type: "SET_STEP", step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) });
  }, [state, anyStop]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, [state.currentStep]);

  const handleNewConsultation = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "RESET" });
  }, []);

  const stepError = validateStep(state.currentStep, state);
  const canProceed = stepError === null && !anyStop;


  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const product = PRODUCT_DETAILS[state.treatment.product];
    const supplied = !anyStop && !!product;
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
      outcome: anyStop ? "not_supplied" : "completed",
      medicine: supplied
        ? {
            name: `${product.label}${state.treatment.brand ? ` (${state.treatment.brand})` : ""}`,
            dose: state.treatment.frequency,
            duration: state.treatment.duration,
            quantity: `Supply ${state.treatment.supplyNumber} of up to ${product.maxSupplies}: one 30 g tube`,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: [state.summary.clinicalNotes, anyStop && state.summary.exclusionAdvice ? `Advice given (excluded): ${state.summary.exclusionAdvice}` : ""]
          .filter(Boolean)
          .join("\n"),
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, anyStop, alerts, __pharmProfile]);

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="print:hidden space-y-6">
      <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
      <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {anyStop && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <TextArea
            label="Advice given to the excluded patient and referral made (recorded with the not-supplied record)"
            value={state.summary.exclusionAdvice}
            onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "exclusionAdvice", value: v })}
            placeholder="e.g. Advised that neither product can be supplied during pregnancy; referred to GP; written information given"
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
        validationError={validationError ?? stepError}
        isBlocked={anyStop}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {state.currentStep === 0 && (
          <div className="space-y-4">
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
            <p className="text-xs text-gray-500">Adults aged 18 years and over. Patient address and GP practice are required for the PGD record, as well as the fields marked *.</p>
          </div>
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <SelectInput
              label="Rosacea subtype"
              value={state.assessment.subtype}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "subtype", value: v })}
              required
              options={[
                { value: "erythematotelangiectatic", label: "Erythematotelangiectatic (flushing and redness)" },
                { value: "papulopustular", label: "Papulopustular (bumps and pustules)" },
                { value: "phymatous", label: "Phymatous (thickened skin): excluded, refer" },
              ]}
            />
            {state.assessment.subtype === "phymatous" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">Phymatous rosacea requires specialist assessment. Refer to GP/dermatology.</div>
            )}
            <SelectInput
              label="Severity"
              value={state.assessment.severity}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
              required
              options={[
                { value: "mild", label: "Mild" },
                { value: "moderate", label: "Moderate" },
                { value: "severe", label: "Severe, requiring systemic treatment (excluded, refer)" },
              ]}
            />
            <p className="text-xs text-gray-600">Tick each feature that is present on examination. Papules/pustules must be present for either product to be supplied.</p>
            <Checkbox
              label="Flushing present"
              checked={state.assessment.flushing}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "flushing", value: v })}
            />
            <Checkbox
              label="Erythema present"
              checked={state.assessment.erythema}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "erythema", value: v })}
            />
            <SelectInput
              label="Are papules or pustules (inflammatory lesions) present?"
              value={state.assessment.papulesPostules}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "papulesPostules", value: v })}
              options={[
                { value: "yes", label: "Yes, papules or pustules present" },
                { value: "no", label: "No (neither product is indicated: refer)" },
              ]}
              required
            />
            <p className="text-xs text-gray-600">Required for both arms: metronidazole gel is for rosacea with inflammatory lesions; azelaic acid gel is for papulopustular rosacea.</p>
            <Checkbox
              label="Ocular symptoms (dry, sore or gritty eyes, blepharitis)"
              checked={state.assessment.ocularSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "ocularSymptoms", value: v })}
              description="Neither arm treats ocular rosacea: advise artificial tears and refer to the GP (ophthalmology if severe or vision affected)."
            />
            <TextInput
              label="Known triggers (optional)"
              value={state.assessment.triggersIdentified}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "triggersIdentified", value: v })}
              placeholder="e.g., alcohol, spicy food, heat, stress"
            />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-sm text-amber-900 mb-1">Contraindications</h4>
            <p className="text-xs text-amber-900 mb-3">Ask the patient each question below. Tick the box if the answer is Yes; leave it unticked if the answer is No. Unticked boxes are recorded as No. Then tick the confirmation at the bottom.</p>
            <Checkbox
              label="Pregnancy"
              checked={state.contraindications.pregnancy}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancy", value: v })}
              description="Exclusion for both arms; refer to the GP"
            />
            <Checkbox
              label="Breastfeeding"
              checked={state.contraindications.breastfeeding}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })}
              description="Exclusion for both arms; refer to the GP"
            />
            <Checkbox
              label="Age under 18 years"
              checked={state.contraindications.underEighteen}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "underEighteen", value: v })}
              description="Both arms are for adults aged 18 years and over"
            />
            <Checkbox
              label="Broken, irritated or eczematous facial skin"
              checked={state.contraindications.brokenOrEczematousSkin}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "brokenOrEczematousSkin", value: v })}
              description="Exclusion for both arms"
            />
            <Checkbox
              label="Known hypersensitivity to metronidazole or other nitroimidazoles"
              checked={state.contraindications.hypersensitivityMetronidazole}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivityMetronidazole", value: v })}
              description="Exclusion for metronidazole gel"
            />
            <Checkbox
              label="Known hypersensitivity to azelaic acid or any of the excipients"
              checked={state.contraindications.hypersensitivityAzelaicAcid}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivityAzelaicAcid", value: v })}
              description="Exclusion for azelaic acid gel"
            />
            <Checkbox
              label="Asthma"
              checked={state.contraindications.asthma}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "asthma", value: v })}
              description="Caution: worsening of asthma has been reported with azelaic acid"
            />
            <div className="pt-2 border-t border-amber-200">
              <Checkbox
                label="I have asked the patient every question above; ticked boxes are Yes and unticked boxes are No (required)"
                checked={state.contraindications.questionsAsked}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "questionsAsked", value: v })}
                required
              />
            </div>
            {isBlocked && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-semibold">Exclusion criteria met. Advise on alternative treatment options; document the advice given and the decision reached; inform or refer to the GP as appropriate.</div>}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <SelectInput
              label="Treatment product"
              value={state.treatment.product}
              onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "product", value: v })}
              required
              options={[
                { value: "metronidazole", label: PRODUCT_DETAILS.metronidazole.label },
                { value: "azelaic-acid", label: PRODUCT_DETAILS["azelaic-acid"].label },
              ]}
            />
            {state.treatment.product && PRODUCT_DETAILS[state.treatment.product] && (
              <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-1">
                <p><span className="font-medium">Name, form and strength:</span> {state.treatment.strength}</p>
                <p><span className="font-medium">Dose and frequency:</span> {state.treatment.frequency}</p>
                <p><span className="font-medium">Quantity:</span> {PRODUCT_DETAILS[state.treatment.product].quantity}</p>
                <p><span className="font-medium">Treatment period:</span> {state.treatment.duration}</p>
                {PRODUCT_DETAILS[state.treatment.product].notes.map((n) => (
                  <p key={n} className="text-xs text-gray-600">{n}</p>
                ))}
              </div>
            )}
            {state.treatment.product && PRODUCT_DETAILS[state.treatment.product] && (
              <>
                <TextInput
                  label="Brand dispensed"
                  value={state.treatment.brand}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "brand", value: v })}
                  placeholder={PRODUCT_DETAILS[state.treatment.product].brandExamples}
                  required
                />
                <SelectInput
                  label="Supply number within this course (one 30 g tube per supply)"
                  value={state.treatment.supplyNumber}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "supplyNumber", value: v })}
                  required
                  options={Array.from({ length: PRODUCT_DETAILS[state.treatment.product].maxSupplies }, (_, i) => ({
                    value: String(i + 1),
                    label: `Supply ${i + 1} of up to ${PRODUCT_DETAILS[state.treatment.product].maxSupplies} (one 30 g tube)`,
                  }))}
                />
                {Number(state.treatment.supplyNumber) > 1 && (
                  <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <TextInput
                      label="Date this course started"
                      type="date"
                      value={state.treatment.courseStartDate}
                      onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "courseStartDate", value: v })}
                      required
                    />
                    <TextInput
                      label="Date of previous supply"
                      type="date"
                      value={state.treatment.previousSupplyDate}
                      onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "previousSupplyDate", value: v })}
                      required
                    />
                    <p className="text-xs text-gray-500 sm:col-span-2">
                      Cap: {PRODUCT_DETAILS[state.treatment.product].maxSupplies} x 30 g per {PRODUCT_DETAILS[state.treatment.product].courseWeeks}-week course. Use the returning-patient search on the first step to check earlier supplies.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-3">
            <Checkbox
              label="Application advice given"
              checked={state.counselling.applicationAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "applicationAdvised", value: v })}
              description={state.treatment.product === "azelaic-acid"
                ? "Thin layer twice daily (morning and evening); 2.5 cm is enough for the whole face; avoid eyes, mouth, mucous membranes and broken skin; wash hands after; no occlusive dressings; reduce amount or frequency if irritation, discontinue if severe or persistent."
                : "Thin layer to the affected areas of the face twice daily; avoid eyes, mucous membranes and broken skin; wash hands after application."}
            />
            <Checkbox
              label="Effective sun protection advised; avoid sunbeds"
              checked={state.counselling.sunProtectionAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunProtectionAdvised", value: v })}
              description="Use sunscreen and avoid excessive sunlight / UV exposure."
            />
            <Checkbox
              label="Importance of avoiding trigger factors wherever possible discussed"
              checked={state.counselling.triggerAvoidanceAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "triggerAvoidanceAdvised", value: v })}
              description="Alcohol, spicy food, hot drinks, heat, stress, etc."
            />
            <Checkbox
              label="Trigger diary suggested to identify stimuli that may exacerbate rosacea"
              checked={state.counselling.diaryAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "diaryAdvised", value: v })}
            />
            <Checkbox
              label="Regular non-oily emollients if the skin is dry; yellow- or green-tinted cosmetics may camouflage erythema"
              checked={state.counselling.skinCareAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "skinCareAdvised", value: v })}
            />
            <Checkbox
              label="Review interval and treatment period explained"
              checked={state.counselling.reviewAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reviewAdvised", value: v })}
              description={state.treatment.product === "azelaic-acid"
                ? "Initial course up to 12 weeks; improvement usually apparent after 4 weeks; if no improvement after 2 months or a new exacerbation, stop and seek other options; review at 8 to 12 weeks."
                : "Initial course up to 8 weeks; review at 8 to 12 weeks for effectiveness; continued use beyond 12 weeks needs reassessment."}
            />
            <Checkbox
              label="Follow-up advice given: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or the patient becomes systemically very unwell"
              checked={state.counselling.followUpAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpAdvised", value: v })}
            />
            <Checkbox
              label="Patient information leaflet (PIL) supplied with the medication"
              checked={state.counselling.pilSupplied}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })}
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Consultation date" type="date" value={state.summary.consultationDate} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "consultationDate", value: v })} required />
              <TextInput label="Consultation time" type="time" value={state.summary.consultationTime} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "consultationTime", value: v })} />
            </div>
            <TextArea label="Clinical notes (optional)" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} rows={3} />
            <p className="text-xs text-gray-500">Save &amp; Print Record saves the consultation and prints the record below.</p>
          </div>
        )}
      </StepWrapper>
      </div>

      {/* Print view: the consultation record */}
      <div className="hidden print:block">
        <RosaceaSummaryReport state={state} alerts={alerts} hasStops={anyStop} />
      </div>
    </div>
  );
}
