"use client";

import React from "react";
import { SmokingToolFormData } from "../lib/smoking-types";
import { calculateFagerstromScore, interpretFagerstromScore, calculateDosePlan } from "../lib/smoking-clinical-logic";

interface SmokingSummaryReportProps {
  formData: SmokingToolFormData;
}

export const SmokingSummaryReport: React.FC<SmokingSummaryReportProps> = ({
  formData,
}) => {
  const fagerstromScore: number = calculateFagerstromScore(formData.assessment);
  const fagerstromInterpretation = interpretFagerstromScore(fagerstromScore);
  const dosePlan = calculateDosePlan(formData);

  const handlePrint = (): void => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Print Consultation
        </button>
      </div>

      {/* Main Report */}
      <div className="bg-white p-8 rounded-lg border border-gray-300">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Varenicline (Champix) PGD Consultation Record
          </h1>
          <p className="text-gray-600 mt-2">
            UK Pharmacy Smoking Cessation eTool
          </p>
        </div>

        {/* Patient Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Patient Details
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Full Name</p>
              <p className="text-lg text-gray-900">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Date of Birth
              </p>
              <p className="text-lg text-gray-900">{formData.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
              <p className="text-lg text-gray-900">{formData.contactNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
              <p className="text-lg text-gray-900">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Smoking Assessment Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Smoking Assessment
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Cigarettes per Day
              </p>
              <p className="text-lg text-gray-900">
                {formData.assessment.cigarettesPerDay} cigarettes
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Years Smoking
              </p>
              <p className="text-lg text-gray-900">
                {formData.assessment.yearsSmoked} years
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Previous Quit Attempts
              </p>
              <p className="text-lg text-gray-900">
                {formData.assessment.previousQuitAttempts} attempts
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Motivation Level
              </p>
              <p className="text-lg text-gray-900 capitalize">
                {formData.assessment.motivationLevel}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Target Quit Date
              </p>
              <p className="text-lg text-gray-900">{formData.assessment.quitDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Ready to Quit</p>
              <p className="text-lg text-gray-900">
                {formData.assessment.readyToQuit ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* Fagerström Score */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase">
                  Fagerström Test Score
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {fagerstromInterpretation.category}
                </p>
              </div>
              <div className="text-5xl font-bold text-blue-600">
                {fagerstromScore}/10
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Medical History
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-900">Psychiatric History:</span>
              <span className="font-semibold">
                {formData.medicalHistory.psychiatricHistory ? "Yes" : "No"}
              </span>
            </div>
            {formData.medicalHistory.psychiatricHistory && (
              <div className="ml-4 text-gray-700 text-sm">
                Details: {formData.medicalHistory.psychiatricDetails}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-900">Seizure History:</span>
              <span className="font-semibold">
                {formData.medicalHistory.seizureHistory ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Renal Impairment:</span>
              <span className="font-semibold capitalize">
                {formData.medicalHistory.renalImpairment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Hepatic Impairment:</span>
              <span className="font-semibold capitalize">
                {formData.medicalHistory.hepaticImpairment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Pregnant:</span>
              <span className="font-semibold">
                {formData.medicalHistory.pregnant ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Breastfeeding:</span>
              <span className="font-semibold">
                {formData.medicalHistory.breastfeeding ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Cardiovascular Disease:</span>
              <span className="font-semibold">
                {formData.medicalHistory.cardiovascularDisease ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900">Current Depression:</span>
              <span className="font-semibold">
                {formData.medicalHistory.currentDepression ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Medications Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Current Medications
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Current Medications
              </p>
              <p className="text-gray-900">{formData.medications.currentMedications}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Allergies</p>
              <p className="text-gray-900">{formData.medications.allergies}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-gray-900">Takes Warfarin:</span>
                <span className="ml-2 font-semibold">
                  {formData.medications.takesWarfarin ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-900">Takes Insulin:</span>
                <span className="ml-2 font-semibold">
                  {formData.medications.takesInsulin ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-900">Takes Theophylline:</span>
                <span className="ml-2 font-semibold">
                  {formData.medications.takesTheophylline ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-900">Takes Clopidogrel:</span>
                <span className="ml-2 font-semibold">
                  {formData.medications.takesClopidogrel ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dose Titration Plan Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Varenicline Dose Titration Plan
          </h2>
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-900 font-semibold mb-2">Dosing Schedule:</p>
            <p className="text-sm text-gray-700">{dosePlan.schedule}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
              <p className="text-lg text-gray-900">{formData.dosePlan.startDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Target Quit Date</p>
              <p className="text-lg text-gray-900">{formData.dosePlan.quitDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Treatment Duration
              </p>
              <p className="text-lg text-gray-900 capitalize">
                {formData.dosePlan.treatmentDuration === "12-weeks"
                  ? "12 weeks"
                  : "24 weeks (extended)"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Tablet Quantity
              </p>
              <p className="text-lg text-gray-900">{formData.dosePlan.quantity} tablets</p>
            </div>
          </div>
        </div>

        {/* Counselling & Advice Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Counselling & Advice Provided
          </h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.neuropsychiatricWarning ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Neuropsychiatric warning provided (mood changes, depression, suicidal thoughts)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.drivingWarning ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Driving warning provided (dizziness/somnolence risk)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.alcoholWarning ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Alcohol interaction warning provided
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.nauseaManagement ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Nausea management advice (take with food and water)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.vividDreams ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Vivid dreams explanation (usually resolve, common side effect)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.completeCourseAdvice ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Complete course advice (full 12-week course for best chance)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.behaviouralSupport ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Referral to local stop smoking service
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.quitDatePlanning ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Quit date planning (set 1-2 weeks into treatment)
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded border-2 border-gray-300 mr-3 flex items-center justify-center text-sm font-bold">
                {formData.counselling.returnIfWorsening ? "✓" : ""}
              </span>
              <span className="text-gray-900">
                Return if worsening (especially mood changes)
              </span>
            </div>
          </div>
        </div>

        {/* Pharmacist Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Pharmacist Details
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Pharmacist Name
              </p>
              <p className="text-lg text-gray-900">{formData.pharmacistName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">GMC Number</p>
              <p className="text-lg text-gray-900">{formData.pharmacistGMCNumber}</p>
            </div>
          </div>
        </div>

        {/* Pharmacy Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
            Pharmacy Details
          </h2>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Pharmacy Name</p>
            <p className="text-lg text-gray-900">{formData.pharmacyName}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
            <p className="text-gray-900">
              {formData.pharmacyAddressLine1}
              {formData.pharmacyAddressLine2 &&
                `, ${formData.pharmacyAddressLine2}`}
            </p>
            <p className="text-gray-900">{formData.pharmacyPostcode}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 text-center text-xs text-gray-600">
          <p>
            Consultation Date: {formData.consultationDate}
          </p>
          <p className="mt-2">
            This record has been generated using the UK Pharmacy PGD eTool for Varenicline
            (Champix) Smoking Cessation.
          </p>
        </div>
      </div>
    </div>
  );
};
