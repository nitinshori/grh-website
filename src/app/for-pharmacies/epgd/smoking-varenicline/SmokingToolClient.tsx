"use client";

import React, { useState, useCallback } from "react";
import { SmokingToolFormData, STEP_LABELS, DEFAULT_FORM_DATA, ClinicalAlert } from "./lib/smoking-types";
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
import { TextInput, SelectInput, NumberInput, TextArea, Checkbox } from "../shared/components/FormInputs";

export const SmokingToolClient: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<SmokingToolFormData>(DEFAULT_FORM_DATA);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean | null): void => {
      setFormData((prev) => {
        const keys: string[] = field.split(".");
        const updatedData = { ...prev };
        let current: any = updatedData;

        for (let i: number = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;

        // Auto-calculate age when DOB changes
        if (field === "dateOfBirth" && typeof value === "string") {
          updatedData.age = calculateAge(value);
        }

        // Auto-calculate Fagerström score
        if (field.startsWith("assessment.")) {
          updatedData.assessment = {
            ...updatedData.assessment,
            [keys[1]]: value,
          };
          updatedData.assessment.fagerstromScore = calculateFagerstromScore(
            updatedData.assessment
          );
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
    if (validateAndProceed()) {
      if (currentStep < STEP_LABELS.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setValidationErrors([]);
      } else {
        setShowSummary(true);
      }
    }
  }, [currentStep, validateAndProceed]);

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

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowSummary(false)}
            className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Edit
          </button>
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
            Varenicline (Champix) PGD Consultation for UK Pharmacies
          </p>
        </div>

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
                This patient is NOT suitable for varenicline therapy. Please consider
                alternative approaches or refer to a smoking cessation specialist.
              </p>
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
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(v) => handleInputChange("lastName", v)}
                  placeholder="Smith"
                />
              </div>

              <TextInput
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(v) => handleInputChange("dateOfBirth", v)}
              />

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
                label="Contact Number"
                type="tel"
                value={formData.contactNumber}
                onChange={(v) => handleInputChange("contactNumber", v)}
                placeholder="01234 567890"
              />

              <TextInput
                label="Email Address"
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
            </div>
          )}

          {/* Step 2: Smoking Assessment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Smoking Assessment</h2>

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
                label="Target quit date"
                type="date"
                value={formData.assessment.quitDate}
                onChange={(v) => handleInputChange("assessment.quitDate", v)}
              />

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
                label="Ready to quit smoking"
                checked={formData.assessment.readyToQuit}
                onChange={(v) => handleInputChange("assessment.readyToQuit", v)}
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
                label="Seizure history"
                checked={formData.medicalHistory.seizureHistory}
                onChange={(v) => handleInputChange("medicalHistory.seizureHistory", v)}
              />

              <SelectInput
                label="Renal (kidney) function"
                value={formData.medicalHistory.renalImpairment}
                onChange={(v) => handleInputChange("medicalHistory.renalImpairment", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "none", label: "Normal" },
                  { value: "moderate", label: "Moderate impairment" },
                  { value: "severe", label: "Severe impairment" },
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
                label="Cardiovascular disease (heart disease, stroke, etc.)"
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
                label="Suicidal ideation or self-harm thoughts"
                checked={formData.medicalHistory.suicidalIdeation}
                onChange={(v) => handleInputChange("medicalHistory.suicidalIdeation", v)}
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
                <h3 className="font-semibold text-blue-900 mb-2">Standard Dosing:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>Days 1-3: 0.5mg once daily</li>
                  <li>Days 4-7: 0.5mg twice daily</li>
                  <li>Week 2-12: 1mg twice daily (maintenance)</li>
                </ul>
              </div>

              {formData.medicalHistory.renalImpairment === "moderate" && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <p className="text-amber-900 font-semibold">
                    Moderate renal impairment: Max dose 1mg once daily
                  </p>
                </div>
              )}

              {formData.medicalHistory.renalImpairment === "severe" && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-900 font-semibold">
                    Severe renal impairment: Max dose 0.5mg once daily. Refer for specialist supervision.
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
                label="Target quit date"
                type="date"
                value={formData.dosePlan.quitDate}
                onChange={(v) => handleInputChange("dosePlan.quitDate", v)}
              />

              <SelectInput
                label="Treatment duration"
                value={formData.dosePlan.treatmentDuration}
                onChange={(v) => handleInputChange("dosePlan.treatmentDuration", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "12-weeks", label: "12 weeks (standard)" },
                  {
                    value: "24-weeks-extended",
                    label: "24 weeks (extended support)",
                  },
                ]}
              />

              <NumberInput
                label="Number of tablets to dispense"
                value={formData.dosePlan.quantity}
                onChange={(v) => handleInputChange("dosePlan.quantity", v)}
                min={1}
              />

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">Notes:</p>
                <p className="text-sm text-gray-700 mt-2">
                  Varenicline is typically dispensed as:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Starter pack: 11 x 0.5mg + 14 x 1mg (covers days 1-14)</li>
                  <li>• Continuation pack: 56 x 1mg (covers 4 weeks)</li>
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
                label="Advised to complete full 12-week course (best chance of success)"
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
                label="Discussed quit date planning (set 1-2 weeks into treatment)"
                checked={formData.counselling.quitDatePlanning}
                onChange={(v) => handleInputChange("counselling.quitDatePlanning", v)}
                description={getFieldError("counselling.quitDatePlanning")}
              />

              <Checkbox
                label="Advised to return if worsening symptoms (especially mood changes)"
                checked={formData.counselling.returnIfWorsening}
                onChange={(v) => handleInputChange("counselling.returnIfWorsening", v)}
                description={getFieldError("counselling.returnIfWorsening")}
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
                />

                <TextInput
                  label="GMC registration number"
                  value={formData.pharmacistGMCNumber}
                  onChange={(v) => handleInputChange("pharmacistGMCNumber", v)}
                />
              </div>

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
                  disabled={validationErrors.length > 0}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  View Summary & Print
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={validationErrors.length > 0}
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
