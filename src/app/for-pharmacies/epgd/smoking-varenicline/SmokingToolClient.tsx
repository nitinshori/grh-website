"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { SmokingToolFormData, STEP_LABELS, createDefaultFormData, ClinicalAlert } from "./lib/smoking-types";
import { validateStep, ValidationError } from "./lib/smoking-validation";
import {
  getAllClinicalAlerts,
  calculateAge,
  calculateFagerstromScore,
} from "./lib/smoking-clinical-logic";
import { FagerstromScore } from "./components/FagerstromScore";
import { SmokingSummaryReport } from "./components/SmokingSummaryReport";
import { ProgressBar } from "../shared/components/ProgressBar";
import { AlertBanner } from "../shared/components/AlertBanner";
import Link from 'next/link';
import { TextInput, SelectInput, NumberInput, TextArea, Checkbox } from "../shared/components/FormInputs";
import { useConsultationTracking, type ConsultationRecordData } from "../shared/hooks/useConsultationTracking";

export const SmokingToolClient: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<SmokingToolFormData>(() => createDefaultFormData());
  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (formData.pharmacistName || formData.pharmacistGPhC) return;
    setFormData((prev) => ({
      ...prev,
      pharmacistName: __pharmProfile.name,
      pharmacistGPhC: __pharmProfile.gphcNumber,
      pharmacyName: __pharmProfile.pharmacyName,
    }));
  }, [__pharmProfile, formData.pharmacistName, formData.pharmacistGPhC]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean | null): void => {
      setFormData((prev) => {
        // Immutable update at every level. The previous version spread the
        // top level only and then wrote nested fields in place, so every
        // nested answer was written into the shared default object and
        // carried over to the next patient (adversarial review, 11 Sep 2026).
        const keys: string[] = field.split(".");
        const updatedData: SmokingToolFormData = { ...prev };
        if (keys.length === 1) {
          (updatedData as any)[keys[0]] = value;
        } else {
          const section = keys[0] as keyof SmokingToolFormData;
          const nested = { ...(prev[section] as unknown as Record<string, unknown>) };
          nested[keys[1]] = value;
          (updatedData as any)[section] = nested;
        }

        // Auto-calculate age when DOB changes
        if (field === "dateOfBirth" && typeof value === "string") {
          updatedData.age = calculateAge(value);
        }

        // Auto-calculate Fagerström score
        if (field.startsWith("assessment.")) {
          updatedData.assessment = {
            ...updatedData.assessment,
            fagerstromScore: calculateFagerstromScore(updatedData.assessment),
          };
        }

        // Keep the total tablet count and supply type in step with the
        // per-strength counts and the consultation type.
        if (field.startsWith("dosePlan.") || field === "assessment.consultationType") {
          const dp = { ...updatedData.dosePlan };
          if (updatedData.assessment.consultationType === "continuation") {
            dp.supplyType = "continuation";
          }
          if (dp.supplyType === "continuation") dp.quantityHalfMg = 0;
          dp.quantity = (dp.quantityHalfMg || 0) + (dp.quantityOneMg || 0);
          updatedData.dosePlan = dp;
        }

        return updatedData;
      });
    },
    []
  );

  const validateAndProceed = useCallback((): boolean => {
    const errors: ValidationError[] = validateStep(currentStep, formData);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      return true;
    }
    return false;
  }, [currentStep, formData]);

  const handleNext = useCallback((): void => {
    // A hard stop blocks Next on every step, not only inside the
    // Contraindications review (adversarial review, 11 Sep 2026).
    const { hardStops: stopsNow } = getAllClinicalAlerts(formData);
    if (stopsNow.length > 0) {
      setValidationErrors([
        ...validateStep(currentStep, formData),
        { field: "hardStops", message: "An exclusion criterion applies. Varenicline cannot be supplied under this PGD; save the record as not supplied" },
      ]);
      return;
    }
    if (validateAndProceed()) {
      if (currentStep < STEP_LABELS.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setValidationErrors([]);
      } else {
        setShowSummary(true);
      }
    }
  }, [currentStep, validateAndProceed, formData]);

  const handlePrevious = useCallback((): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setValidationErrors([]);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((step: number): void => {
    if (step < currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
      setValidationErrors([]);
    }
  }, [currentStep, completedSteps]);

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find((e) => e.field === fieldName)?.message;
  };

  const { hardStops, cautions, redFlags } = getAllClinicalAlerts(formData);

  // ─── Consultation tracking + record saving ───
  const { markComplete, saveRecord, reset: resetTracking } = useConsultationTracking('smoking-varenicline', currentStep);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const getConsultationData = useCallback((): ConsultationRecordData => {
    const supplied = hardStops.length === 0 && formData.dosePlan.quantity > 0;
    const supplyText = formData.dosePlan.supplyType === "starter"
      ? `Starter supply: ${formData.dosePlan.quantityHalfMg} x 0.5mg and ${formData.dosePlan.quantityOneMg} x 1mg tablets`
      : `Continuation supply: ${formData.dosePlan.quantityOneMg} x 1mg tablets`;
    return {
      patient: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.contactNumber,
        email: formData.email,
        address: formData.address,
        nhsNumber: formData.nhsNumber,
        gpName: formData.gpName,
        gpPractice: formData.gpPractice,
      },
      clinicalData: { ...formData, hardStops, cautions, redFlags } as unknown as Record<string, unknown>,
      outcome: hardStops.length > 0 ? 'not_supplied' : 'completed',
      ...(supplied
        ? {
            medicine: {
              name: `Varenicline 0.5mg and 1mg tablets (${formData.dosePlan.brand || "brand not recorded"})`,
              dose: `Days 1-3 0.5mg once daily; days 4-7 0.5mg twice daily; day 8 onwards 1mg twice daily, oral. ${supplyText}`,
              duration: formData.dosePlan.treatmentDuration === "24-weeks-extended" ? "24 weeks (extended)" : "12 weeks",
              quantity: formData.dosePlan.quantity,
            },
          }
        : {}),
      summary: {
        pharmacistName: formData.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: formData.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: formData.pharmacyName || __pharmProfile?.pharmacyName,
        consultationDate: formData.consultationDate || new Date().toISOString().split("T")[0],
      },
    };
  }, [formData, hardStops, cautions, redFlags, __pharmProfile]);

  const handleSaveAndPrint = useCallback(async (): Promise<void> => {
    // Same rules as Next: an exclusion, or a missing pharmacist name or
    // GPhC number, blocks the print (adversarial review, 11 Sep 2026).
    const errors = validateStep(8, formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowSummary(false);
      return;
    }
    markComplete();
    setSaveStatus('saving');
    const success = await saveRecord(getConsultationData());
    setSaveStatus(success ? 'saved' : 'error');
    window.print();
  }, [markComplete, saveRecord, getConsultationData, formData]);

  // Every PGD requires the advice given to an excluded patient to be
  // recorded. Saves the record with outcome not_supplied and no print.
  const handleSaveNotSupplied = useCallback(async (): Promise<void> => {
    setSaveStatus('saving');
    const data = getConsultationData();
    data.outcome = 'not_supplied';
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = currentStep;
    (data.clinicalData as Record<string, unknown>).stopReason = hardStops.map((a) => a.message).join("; ");
    const success = await saveRecord(data);
    setSaveStatus(success ? 'saved' : 'error');
  }, [getConsultationData, saveRecord, currentStep, hardStops]);

  const handleNewConsultation = useCallback((): void => {
    if (!window.confirm('Start a new consultation? The current consultation data will be cleared.')) return;
    setFormData(createDefaultFormData());
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setValidationErrors([]);
    setShowSummary(false);
    setSaveStatus('idle');
    resetTracking();
  }, [resetTracking]);

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-6 print:hidden">
            <button
              onClick={() => setShowSummary(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Edit
            </button>
            {hardStops.length > 0 ? (
              <button
                onClick={handleSaveNotSupplied}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved as not supplied' : 'Save as not supplied'}
              </button>
            ) : (
              <button
                onClick={handleSaveAndPrint}
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-lg ${
                  saveStatus === 'saving'
                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                    : 'bg-navy-900 hover:bg-navy-950 text-white'
                }`}
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Print Again' : 'Save & Print Record'}
              </button>
            )}
            {saveStatus === 'saved' && (
              <button
                onClick={handleNewConsultation}
                className="px-4 py-2 rounded-lg text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10"
              >
                New Consultation
              </button>
            )}
          </div>
          {saveStatus !== 'idle' && (
            <div className={`mb-4 px-4 py-3 rounded-lg print:hidden ${
              saveStatus === 'saving' ? 'bg-blue-50 border border-blue-200' :
              saveStatus === 'saved' ? 'bg-green-50 border border-green-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                saveStatus === 'saving' ? 'text-blue-700' :
                saveStatus === 'saved' ? 'text-green-700' :
                'text-red-700'
              }`}>
                {saveStatus === 'saving' && 'Saving consultation record...'}
                {saveStatus === 'saved' && 'Consultation record saved. You can access it from Patient Records on your dashboard.'}
                {saveStatus === 'error' && 'Could not save consultation record. Please print this page as a backup.'}
              </p>
            </div>
          )}
          <SmokingSummaryReport formData={formData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Smoking Cessation ePGD
          </h1>
          <p className="text-gray-600 mt-2">
            Varenicline 0.5mg and 1mg tablets PGD consultation for UK pharmacies (any UK-licensed generic; Champix is no longer marketed). PGD version 004, issued 11 September 2026.
          </p>
        </div>

        {currentStep === 0 && (
          <div className="mb-4 print:hidden">
            <Link
              href="/for-pharmacies/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar
          currentStep={currentStep}
          stepLabels={STEP_LABELS}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          hasErrors={validationErrors.length > 0}
        />

        {/* Clinical Alerts */}
        {hardStops.length > 0 && (
          <div className="mt-8">
            <AlertBanner alerts={hardStops} />
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-red-900 font-semibold">
                This patient is NOT suitable for varenicline therapy. Advise on alternative treatment options and how to access them, document the advice given and the decision reached, and inform or refer to the GP as appropriate.
              </p>
              <div className="mt-3 flex items-center gap-3 print:hidden">
                <button
                  onClick={handleSaveNotSupplied}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved as not supplied' : 'Save as not supplied'}
                </button>
                {saveStatus === 'saved' && (
                  <button
                    onClick={handleNewConsultation}
                    className="px-4 py-2 rounded-lg text-sm text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10"
                  >
                    New Consultation
                  </button>
                )}
                {saveStatus === 'error' && <span className="text-xs text-red-700">Could not save the record.</span>}
              </div>
            </div>
          </div>
        )}

        {redFlags.length > 0 && (
          <div className="mt-6">
            <AlertBanner alerts={redFlags} />
          </div>
        )}

        {cautions.length > 0 && (
          <div className="mt-6">
            <AlertBanner alerts={cautions} />
          </div>
        )}

        {/* Form Content */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          {/* Step 0: Patient Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(v) => handleInputChange("firstName", v)}
                  placeholder="John"
                  required
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(v) => handleInputChange("lastName", v)}
                  placeholder="Smith"
                  required
                />
              </div>

              <TextInput
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(v) => handleInputChange("dateOfBirth", v)}
                required
              />
              {getFieldError("dateOfBirth") && <p className="text-xs text-red-700">{getFieldError("dateOfBirth")}</p>}

              <TextArea
                label="Address"
                value={formData.address}
                onChange={(v) => handleInputChange("address", v)}
                placeholder="House number, street, town, postcode"
                rows={2}
                required
              />
              {getFieldError("address") && <p className="text-xs text-red-700">{getFieldError("address")}</p>}

              <div className="grid grid-cols-2 gap-6">
                <TextInput
                  label="NHS number (if known)"
                  value={formData.nhsNumber}
                  onChange={(v) => handleInputChange("nhsNumber", v)}
                  placeholder="000 000 0000"
                />
                <TextInput
                  label="GP name"
                  value={formData.gpName}
                  onChange={(v) => handleInputChange("gpName", v)}
                  placeholder="Dr A Patel"
                />
              </div>
              <TextInput
                label="GP practice"
                value={formData.gpPractice}
                onChange={(v) => handleInputChange("gpPractice", v)}
                placeholder="Practice name and town"
                required
              />
              {getFieldError("gpPractice") && <p className="text-xs text-red-700">{getFieldError("gpPractice")}</p>}

              {formData.age !== null && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-900 font-semibold">
                    Age: {formData.age} years
                  </p>
                </div>
              )}

              <SelectInput
                label="Gender"
                value={formData.gender}
                onChange={(v) => handleInputChange("gender", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer-not-to-say", label: "Prefer not to say" },
                ]}
              />

              <TextInput
                label="Contact Number (optional)"
                type="tel"
                value={formData.contactNumber}
                onChange={(v) => handleInputChange("contactNumber", v)}
                placeholder="01234 567890"
              />

              <TextInput
                label="Email Address (optional)"
                type="email"
                value={formData.email}
                onChange={(v) => handleInputChange("email", v)}
                placeholder="john@example.com"
              />
            </div>
          )}

          {/* Step 1: Consent & ID */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Consent & Verification</h2>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Patient Consultation Statement
                </h3>
                <p className="text-blue-800 text-sm">
                  This consultation will involve discussing your smoking history, medical
                  history, current medications, and any contraindications to varenicline
                  therapy. You will receive counselling on how to take varenicline, expected
                  side effects, and when to contact the pharmacy. This is part of the
                  Community Pharmacy Patient Group Direction (PGD) consultation process.
                </p>
              </div>

              <Checkbox
                label="I consent to varenicline consultation and treatment under the PGD"
                checked={formData.consentToTreatment}
                onChange={(v) => handleInputChange("consentToTreatment", v)}
                description={getFieldError("consentToTreatment")}
              />

              <Checkbox
                label="I consent to my consultation being recorded for quality assurance and training purposes"
                checked={formData.consentToRecord}
                onChange={(v) => handleInputChange("consentToRecord", v)}
              />

              <Checkbox
                label="I confirm that my identity has been verified with photographic ID"
                checked={formData.identityVerified}
                onChange={(v) => handleInputChange("identityVerified", v)}
                description={getFieldError("identityVerified")}
              />
              {formData.identityVerified && (
                <SelectInput
                  label="ID type"
                  value={formData.idType}
                  onChange={(v) => handleInputChange("idType", v)}
                  options={[
                    { value: "Driving licence", label: "Driving licence" },
                    { value: "Passport", label: "Passport" },
                    { value: "Known to pharmacist", label: "Known to pharmacist" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              )}
              <Checkbox
                label="Patient aware this is a private service"
                checked={formData.patientAwarePrivateService}
                onChange={(v) => handleInputChange("patientAwarePrivateService", v)}
                description={getFieldError("patientAwarePrivateService") || "The patient understands there is a consultation fee and the medicine is not supplied on NHS prescription through this service."}
              />
            </div>
          )}

          {/* Step 2: Smoking Assessment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Smoking Assessment</h2>

              <SelectInput
                label="This consultation"
                value={formData.assessment.consultationType}
                onChange={(v) => handleInputChange("assessment.consultationType", v)}
                options={[
                  { value: "new", label: "First supply: starting varenicline, quit date within the next 1 to 2 weeks" },
                  { value: "continuation", label: "Continuation supply: already on varenicline in this course (record the original quit date)" },
                ]}
                required
              />
              {getFieldError("assessment.consultationType") && <p className="text-xs text-red-700">{getFieldError("assessment.consultationType")}</p>}

              <div className="grid grid-cols-2 gap-6">
                <NumberInput
                  label="Cigarettes per day"
                  value={formData.assessment.cigarettesPerDay}
                  onChange={(v) => handleInputChange("assessment.cigarettesPerDay", v)}
                  min={0}
                />

                <NumberInput
                  label="Years smoking"
                  value={formData.assessment.yearsSmoked}
                  onChange={(v) => handleInputChange("assessment.yearsSmoked", v)}
                  min={0}
                />

                <NumberInput
                  label="Previous quit attempts"
                  value={formData.assessment.previousQuitAttempts}
                  onChange={(v) => handleInputChange("assessment.previousQuitAttempts", v)}
                  min={0}
                />

                <SelectInput
                  label="Motivation to quit"
                  value={formData.assessment.motivationLevel}
                  onChange={(v) => handleInputChange("assessment.motivationLevel", v)}
                  options={[
                    { value: "", label: "Select..." },
                    { value: "low", label: "Low" },
                    { value: "moderate", label: "Moderate" },
                    { value: "high", label: "High" },
                  ]}
                />
              </div>

              <TextInput
                label={formData.assessment.consultationType === "continuation" ? "Original quit date (this course)" : "Target quit date (within the next 1 to 2 weeks)"}
                type="date"
                value={formData.assessment.quitDate}
                onChange={(v) => handleInputChange("assessment.quitDate", v)}
                required
              />
              {getFieldError("assessment.quitDate") && <p className="text-xs text-red-700">{getFieldError("assessment.quitDate")}</p>}

              <TextArea
                label="Previous quit methods"
                value={formData.assessment.previousQuitMethods}
                onChange={(v) => handleInputChange("assessment.previousQuitMethods", v)}
                placeholder="e.g., NRT patches, cold turkey, acupuncture..."
                rows={3}
              />

              <Checkbox
                label="Currently using NRT (Nicotine Replacement Therapy)"
                checked={formData.assessment.nrtCurrentlyUsing}
                onChange={(v) => handleInputChange("assessment.nrtCurrentlyUsing", v)}
              />

              {formData.assessment.nrtCurrentlyUsing && (
                <TextArea
                  label="NRT details"
                  value={formData.assessment.nrtDetails}
                  onChange={(v) => handleInputChange("assessment.nrtDetails", v)}
                  placeholder="Type, dose, duration..."
                  rows={3}
                />
              )}

              <Checkbox
                label="Patient has previously tried varenicline"
                checked={formData.assessment.previousVarenicline}
                onChange={(v) => handleInputChange("assessment.previousVarenicline", v)}
              />

              {formData.assessment.previousVarenicline && (
                <TextArea
                  label="Previous varenicline outcome"
                  value={formData.assessment.previousVareniclineOutcome}
                  onChange={(v) =>
                    handleInputChange("assessment.previousVareniclineOutcome", v)
                  }
                  placeholder="Success/failure, reasons..."
                  rows={3}
                />
              )}

              <Checkbox
                label="Motivated and ready to quit smoking, with a quit date set within the next 1 to 2 weeks"
                checked={formData.assessment.readyToQuit}
                onChange={(v) => handleInputChange("assessment.readyToQuit", v)}
                description={getFieldError("assessment.readyToQuit") || getFieldError("assessment.quitDate")}
              />

              {/* Fagerström Test */}
              <div className="mt-8">
                <FagerstromScore
                  assessment={formData.assessment}
                  onChange={(updatedAssessment) => {
                    setFormData((prev) => ({
                      ...prev,
                      assessment: updatedAssessment,
                    }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Medical History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>

              <Checkbox
                label="Psychiatric history (bipolar, schizophrenia, depression, etc.)"
                checked={formData.medicalHistory.psychiatricHistory}
                onChange={(v) => handleInputChange("medicalHistory.psychiatricHistory", v)}
              />

              {formData.medicalHistory.psychiatricHistory && (
                <TextArea
                  label="Psychiatric history details"
                  value={formData.medicalHistory.psychiatricDetails}
                  onChange={(v) =>
                    handleInputChange("medicalHistory.psychiatricDetails", v)
                  }
                  placeholder="e.g., bipolar disorder diagnosed 2015..."
                  rows={3}
                />
              )}

              <Checkbox
                label="Seizure disorder or seizure history"
                checked={formData.medicalHistory.seizureHistory}
                onChange={(v) => handleInputChange("medicalHistory.seizureHistory", v)}
              />

              <Checkbox
                label="Known hypersensitivity to varenicline or excipients"
                checked={formData.medicalHistory.hypersensitivityVarenicline}
                onChange={(v) => handleInputChange("medicalHistory.hypersensitivityVarenicline", v)}
                description="Exclusion: do not supply."
              />

              <SelectInput
                label="Renal (kidney) function"
                value={formData.medicalHistory.renalImpairment}
                onChange={(v) => handleInputChange("medicalHistory.renalImpairment", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "none", label: "Normal (eGFR above 50 mL/min/1.73m2)" },
                  { value: "moderate", label: "eGFR 30 to 50 mL/min/1.73m2 (caution: no dose adjustment; reduce to 1mg once daily if not tolerated)" },
                  { value: "severe", label: "eGFR below 30 mL/min/1.73m2 or end-stage renal disease (exclusion: refer to GP)" },
                ]}
              />

              <SelectInput
                label="Hepatic (liver) function"
                value={formData.medicalHistory.hepaticImpairment}
                onChange={(v) => handleInputChange("medicalHistory.hepaticImpairment", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "none", label: "Normal" },
                  { value: "mild-moderate", label: "Mild to moderate impairment" },
                  { value: "severe", label: "Severe impairment" },
                ]}
              />

              <Checkbox
                label="Pregnant"
                checked={formData.medicalHistory.pregnant}
                onChange={(v) => handleInputChange("medicalHistory.pregnant", v)}
              />

              <Checkbox
                label="Breastfeeding"
                checked={formData.medicalHistory.breastfeeding}
                onChange={(v) => handleInputChange("medicalHistory.breastfeeding", v)}
              />

              <Checkbox
                label="Cardiovascular disease: recent MI (within 4 weeks), unstable angina, or severe cardiac arrhythmias (assess benefit vs risk)"
                checked={formData.medicalHistory.cardiovascularDisease}
                onChange={(v) =>
                  handleInputChange("medicalHistory.cardiovascularDisease", v)
                }
              />

              <Checkbox
                label="Eating disorder"
                checked={formData.medicalHistory.eatingDisorder}
                onChange={(v) => handleInputChange("medicalHistory.eatingDisorder", v)}
              />

              <Checkbox
                label="Current depression"
                checked={formData.medicalHistory.currentDepression}
                onChange={(v) => handleInputChange("medicalHistory.currentDepression", v)}
              />

              <Checkbox
                label="History of suicidal ideation or self-harm (past)"
                checked={formData.medicalHistory.suicidalIdeation}
                onChange={(v) => handleInputChange("medicalHistory.suicidalIdeation", v)}
                description="PGD caution: supply may proceed; monitor mental health throughout treatment."
              />

              <Checkbox
                label="Current suicidal ideation"
                checked={formData.medicalHistory.currentSuicidalIdeation}
                onChange={(v) => handleInputChange("medicalHistory.currentSuicidalIdeation", v)}
                description="Exclusion: do not supply. Refer urgently to mental health services."
              />
            </div>
          )}

          {/* Step 4: Medications */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Current Medications</h2>

              <TextArea
                label="List all current medications"
                value={formData.medications.currentMedications}
                onChange={(v) => handleInputChange("medications.currentMedications", v)}
                placeholder="e.g., Lisinopril 10mg daily, Metformin 500mg BD..."
                rows={4}
              />

              <TextArea
                label="Known allergies"
                value={formData.medications.allergies}
                onChange={(v) => handleInputChange("medications.allergies", v)}
                placeholder="e.g., Penicillin, latex..."
                rows={3}
              />

              <h3 className="text-lg font-semibold text-gray-900 mt-8">
                Specific medications to check
              </h3>

              <Checkbox
                label="Takes warfarin (anticoagulant)"
                checked={formData.medications.takesWarfarin}
                onChange={(v) => handleInputChange("medications.takesWarfarin", v)}
                description="Smoking cessation may increase warfarin effect"
              />

              <Checkbox
                label="Takes insulin (for diabetes)"
                checked={formData.medications.takesInsulin}
                onChange={(v) => handleInputChange("medications.takesInsulin", v)}
                description="Smoking cessation may affect insulin requirement"
              />

              <Checkbox
                label="Takes clopidogrel (Plavix)"
                checked={formData.medications.takesClopidogrel}
                onChange={(v) => handleInputChange("medications.takesClopidogrel", v)}
                description="Smoking may affect clopidogrel metabolism"
              />

              <Checkbox
                label="Takes theophylline (asthma/COPD)"
                checked={formData.medications.takesTheophylline}
                onChange={(v) => handleInputChange("medications.takesTheophylline", v)}
                description="Smoking cessation may affect theophylline levels"
              />

              <Checkbox
                label="Takes antipsychotics"
                checked={formData.medications.takesAntipsychotics}
                onChange={(v) => handleInputChange("medications.takesAntipsychotics", v)}
              />

              <Checkbox
                label="Takes antidepressants"
                checked={formData.medications.takesAntidepressants}
                onChange={(v) => handleInputChange("medications.takesAntidepressants", v)}
              />
            </div>
          )}

          {/* Step 5: Contraindications Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Contraindications Review</h2>

              {hardStops.length === 0 ? (
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-green-900 font-semibold">
                    No hard contraindications identified. Patient may be suitable for
                    varenicline therapy (subject to cautions below).
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-red-900 font-semibold">
                    Hard contraindications identified above. This patient is NOT suitable
                    for varenicline.
                  </p>
                </div>
              )}

              {cautions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-amber-900 mb-3">Cautions to monitor:</h3>
                  <ul className="space-y-2 text-amber-800 text-sm">
                    {cautions.map((alert: ClinicalAlert, index: number) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-bold">•</span>
                        <span>{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Checkbox
                label="I have reviewed all contraindications and cautions above"
                checked={formData.contradicationsReviewed}
                onChange={(v) => handleInputChange("contradicationsReviewed", v)}
              />

              <Checkbox
                label="I (the pharmacist) approve treatment with varenicline for this patient"
                checked={formData.pharmacistApproves}
                onChange={(v) => handleInputChange("pharmacistApproves", v)}
                description={getFieldError("hardStops")}
              />
            </div>
          )}

          {/* Step 6: Dose Titration Plan */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Varenicline Dose Titration Plan
              </h2>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Varenicline (as tartrate) 0.5mg and 1mg film-coated tablets (POM). Store below 30°C, protect from light, keep in original packaging. Oral, swallowed whole with water, with or without food.</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>Days 1-3: 0.5mg once daily</li>
                  <li>Days 4-7: 0.5mg twice daily (morning and evening)</li>
                  <li>Day 8 to end of treatment: 1mg twice daily (morning and evening)</li>
                  <li>Quit date on day 8 to 14 of treatment (when 1mg twice daily is established)</li>
                  <li>Standard course 12 weeks; consider an additional 12 weeks (24 weeks total) for sustained abstinence to reduce relapse risk</li>
                  <li>Review at 2 weeks, 4 weeks, then monthly</li>
                </ul>
              </div>

              {formData.medicalHistory.renalImpairment === "moderate" && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <p className="text-amber-900 font-semibold">
                    Renal impairment, eGFR 30 to 50: no dose adjustment; if adverse effects are not tolerated reduce to 1mg once daily.
                  </p>
                </div>
              )}

              {formData.medicalHistory.renalImpairment === "severe" && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-900 font-semibold">
                    Severe renal impairment (eGFR below 30) or end-stage renal disease is an exclusion. Do not supply; refer to GP.
                  </p>
                </div>
              )}

              <TextInput
                label="Varenicline start date"
                type="date"
                value={formData.dosePlan.startDate}
                onChange={(v) => handleInputChange("dosePlan.startDate", v)}
              />

              <TextInput
                label="Target quit date (day 8 to 14 of treatment)"
                type="date"
                value={formData.dosePlan.quitDate}
                onChange={(v) => handleInputChange("dosePlan.quitDate", v)}
              />
              {getFieldError("dosePlan.quitDate") && (
                <p className="text-xs text-red-700">{getFieldError("dosePlan.quitDate")}</p>
              )}

              <SelectInput
                label="Treatment duration"
                value={formData.dosePlan.treatmentDuration}
                onChange={(v) => handleInputChange("dosePlan.treatmentDuration", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "12-weeks", label: "12 weeks (standard)" },
                  {
                    value: "24-weeks-extended",
                    label: "24 weeks total (additional 12 weeks for sustained abstinence)",
                  },
                ]}
              />

              <SelectInput
                label="This supply"
                value={formData.dosePlan.supplyType}
                onChange={(v) => handleInputChange("dosePlan.supplyType", v)}
                disabled={formData.assessment.consultationType === "continuation"}
                options={[
                  { value: "starter", label: "Starter supply (first 4 weeks): 11 x 0.5mg then up to 42 x 1mg tablets" },
                  { value: "continuation", label: "Continuation supply: up to 56 x 1mg tablets (4 weeks at 1mg twice daily)" },
                ]}
                required
              />
              {getFieldError("dosePlan.supplyType") && (
                <p className="text-xs text-red-700">{getFieldError("dosePlan.supplyType")}</p>
              )}

              {(formData.assessment.consultationType === "continuation" || formData.dosePlan.supplyType === "continuation") && (
                <div>
                  <NumberInput
                    label="Weeks of treatment completed so far"
                    value={formData.dosePlan.weeksCompleted}
                    onChange={(v) => handleInputChange("dosePlan.weeksCompleted", v)}
                    min={0}
                    max={24}
                    unit="weeks"
                    required
                  />
                  {getFieldError("dosePlan.weeksCompleted") && (
                    <p className="text-xs text-red-700 mt-1">{getFieldError("dosePlan.weeksCompleted")}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {formData.dosePlan.supplyType === "starter" && (
                  <div>
                    <NumberInput
                      label="0.5mg tablets (days 1 to 7)"
                      value={formData.dosePlan.quantityHalfMg}
                      onChange={(v) => handleInputChange("dosePlan.quantityHalfMg", v ?? 0)}
                      min={1}
                      max={11}
                      unit="max 11"
                      required
                    />
                    {getFieldError("dosePlan.quantityHalfMg") && (
                      <p className="text-xs text-red-700 mt-1">{getFieldError("dosePlan.quantityHalfMg")}</p>
                    )}
                  </div>
                )}
                {formData.dosePlan.supplyType && (
                  <div>
                    <NumberInput
                      label={formData.dosePlan.supplyType === "starter" ? "1mg tablets (days 8 to 28)" : "1mg tablets"}
                      value={formData.dosePlan.quantityOneMg}
                      onChange={(v) => handleInputChange("dosePlan.quantityOneMg", v ?? 0)}
                      min={formData.dosePlan.supplyType === "starter" ? 0 : 1}
                      max={formData.dosePlan.supplyType === "starter" ? 42 : 56}
                      unit={formData.dosePlan.supplyType === "starter" ? "max 42" : "max 56"}
                      required
                    />
                    {getFieldError("dosePlan.quantityOneMg") && (
                      <p className="text-xs text-red-700 mt-1">{getFieldError("dosePlan.quantityOneMg")}</p>
                    )}
                  </div>
                )}
              </div>
              {formData.dosePlan.quantity > 0 && (
                <p className="text-sm text-gray-700">Total this supply: {formData.dosePlan.quantity} tablets.</p>
              )}

              <TextInput
                label="Product and brand supplied"
                value={formData.dosePlan.brand}
                onChange={(v) => handleInputChange("dosePlan.brand", v)}
                placeholder="e.g. Varenicline tablets (manufacturer name), or the branded product name"
                required
              />
              {getFieldError("dosePlan.brand") && (
                <p className="text-xs text-red-700">{getFieldError("dosePlan.brand")}</p>
              )}

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">Quantity under this PGD:</p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Starter pack (first 4 weeks), then up to 56 tablets (4-week supply at full dose of 1mg twice daily)</li>
                  <li>• Maximum treatment period 12 weeks; may extend to 24 weeks total. Review at 2 weeks, 4 weeks, then monthly.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 7: Counselling */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Counselling & Advice Checklist
              </h2>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Confirm that each of the following counselling points has been discussed
                  with the patient.
                </p>
              </div>

              <Checkbox
                label="Discussed neuropsychiatric warnings (mood changes, depression, suicidal thoughts, unusual behaviour)"
                checked={formData.counselling.neuropsychiatricWarning}
                onChange={(v) =>
                  handleInputChange("counselling.neuropsychiatricWarning", v)
                }
                description={getFieldError("counselling.neuropsychiatricWarning")}
              />

              <Checkbox
                label="Discussed driving warning (may cause dizziness or somnolence)"
                checked={formData.counselling.drivingWarning}
                onChange={(v) => handleInputChange("counselling.drivingWarning", v)}
                description={getFieldError("counselling.drivingWarning")}
              />

              <Checkbox
                label="Discussed alcohol interaction (may increase alcohol effects)"
                checked={formData.counselling.alcoholWarning}
                onChange={(v) => handleInputChange("counselling.alcoholWarning", v)}
                description={getFieldError("counselling.alcoholWarning")}
              />

              <Checkbox
                label="Discussed nausea management (take with food and water, usually self-limiting)"
                checked={formData.counselling.nauseaManagement}
                onChange={(v) => handleInputChange("counselling.nauseaManagement", v)}
                description={getFieldError("counselling.nauseaManagement")}
              />

              <Checkbox
                label="Discussed vivid dreams (common side effect, usually resolve after a few weeks)"
                checked={formData.counselling.vividDreams}
                onChange={(v) => handleInputChange("counselling.vividDreams", v)}
                description={getFieldError("counselling.vividDreams")}
              />

              <Checkbox
                label="Advised to complete the full 12-week course (best chance of success); an additional 12 weeks may be considered for sustained abstinence"
                checked={formData.counselling.completeCourseAdvice}
                onChange={(v) => handleInputChange("counselling.completeCourseAdvice", v)}
                description={getFieldError("counselling.completeCourseAdvice")}
              />

              <Checkbox
                label="Referred to local stop smoking service for behavioural support"
                checked={formData.counselling.behaviouralSupport}
                onChange={(v) => handleInputChange("counselling.behaviouralSupport", v)}
                description={getFieldError("counselling.behaviouralSupport")}
              />

              <Checkbox
                label="Discussed quit date planning (set on day 8 to 14 of treatment, when 1mg twice daily starts)"
                checked={formData.counselling.quitDatePlanning}
                onChange={(v) => handleInputChange("counselling.quitDatePlanning", v)}
                description={getFieldError("counselling.quitDatePlanning")}
              />

              <Checkbox
                label="Advised to report any mood changes, depression, anxiety or suicidal thoughts immediately to the pharmacy or GP"
                checked={formData.counselling.returnIfWorsening}
                onChange={(v) => handleInputChange("counselling.returnIfWorsening", v)}
                description={getFieldError("counselling.returnIfWorsening")}
              />

              <Checkbox
                label="Advised to contact the GP if chest pain, shortness of breath or severe headaches occur"
                checked={formData.counselling.physicalSymptomsWarning}
                onChange={(v) => handleInputChange("counselling.physicalSymptomsWarning", v)}
                description={getFieldError("counselling.physicalSymptomsWarning")}
              />

              <Checkbox
                label="Advised to continue varenicline after a slip-up (single cigarette) and discuss with the pharmacist or GP"
                checked={formData.counselling.slipUpAdvice}
                onChange={(v) => handleInputChange("counselling.slipUpAdvice", v)}
                description={getFieldError("counselling.slipUpAdvice")}
              />

              <Checkbox
                label="Follow-up appointments arranged at 2 weeks, 4 weeks, then monthly to monitor progress and side effects"
                checked={formData.counselling.followUpSchedule}
                onChange={(v) => handleInputChange("counselling.followUpSchedule", v)}
                description={getFieldError("counselling.followUpSchedule")}
              />

              <Checkbox
                label="Advised to inform the GP immediately if they become pregnant"
                checked={formData.counselling.pregnancyAdvice}
                onChange={(v) => handleInputChange("counselling.pregnancyAdvice", v)}
                description={getFieldError("counselling.pregnancyAdvice")}
              />

              <Checkbox
                label="Advised not to stop varenicline suddenly; discuss any changes with the GP. Patient information leaflet supplied and dosing schedule understood"
                checked={formData.counselling.doNotStopSuddenly}
                onChange={(v) => handleInputChange("counselling.doNotStopSuddenly", v)}
                description={getFieldError("counselling.doNotStopSuddenly")}
              />
            </div>
          )}

          {/* Step 8: Summary */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Summary & Print</h2>

              <div className="grid grid-cols-2 gap-6">
                <TextInput
                  label="Pharmacist name"
                  value={formData.pharmacistName}
                  onChange={(v) => handleInputChange("pharmacistName", v)}
                  required
                />

                <TextInput
                  label="GPhC registration number"
                  value={formData.pharmacistGPhC}
                  onChange={(v) => handleInputChange("pharmacistGPhC", v)}
                  required
                />
              </div>
              {(getFieldError("pharmacistName") || getFieldError("pharmacistGPhC")) && (
                <p className="text-xs text-red-700">{getFieldError("pharmacistName") || getFieldError("pharmacistGPhC")}</p>
              )}

              <TextInput
                label="Consultation date"
                type="date"
                value={formData.consultationDate}
                onChange={(v) => handleInputChange("consultationDate", v)}
              />

              <TextInput
                label="Pharmacy name"
                value={formData.pharmacyName}
                onChange={(v) => handleInputChange("pharmacyName", v)}
              />

              <TextInput
                label="Pharmacy address line 1"
                value={formData.pharmacyAddressLine1}
                onChange={(v) => handleInputChange("pharmacyAddressLine1", v)}
              />

              <TextInput
                label="Pharmacy address line 2 (optional)"
                value={formData.pharmacyAddressLine2}
                onChange={(v) => handleInputChange("pharmacyAddressLine2", v)}
              />

              <TextInput
                label="Pharmacy postcode"
                value={formData.pharmacyPostcode}
                onChange={(v) => handleInputChange("pharmacyPostcode", v)}
              />
            </div>
          )}

          {/* Errors from the last attempt to continue. The Next button is
              no longer disabled while errors exist: it used to lock until
              the pharmacist went back and forward again (adversarial
              review, 11 Sep 2026). */}
          {validationErrors.length > 0 && (
            <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-700 list-disc pl-5 space-y-0.5">
                {validationErrors.map((e) => (
                  <li key={e.field + e.message}>{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-4 mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <div className="flex gap-4">
              {currentStep === STEP_LABELS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={hardStops.length > 0}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  View Summary & Print
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={hardStops.length > 0}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
