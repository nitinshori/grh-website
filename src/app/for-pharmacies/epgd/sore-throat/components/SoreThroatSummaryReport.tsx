"use client";

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from "../../shared/types";
import { TextInput } from "../../shared/components/FormInputs";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";
import type {
  SoreThroatSymptoms,
  FeverPAINScore,
  SoreThroatExamination,
  SoreThroatHistory,
  SoreThroatMedicine,
  SoreThroatCounselling,
} from "../lib/sore-throat-types";

interface SoreThroatSummaryReportProps {
  patient: BasePatientDetails;
  consent: BaseConsent;
  symptoms: SoreThroatSymptoms;
  feverPainScore: FeverPAINScore;
  examination: SoreThroatExamination;
  history: SoreThroatHistory;
  medicine: SoreThroatMedicine;
  counselling: SoreThroatCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  onSummaryChange: (field: keyof BaseSummary, value: string) => void;
}

export function SoreThroatSummaryReport({
  patient,
  consent,
  symptoms,
  feverPainScore,
  examination,
  history,
  medicine,
  counselling,
  summary,
  alerts,
  onSummaryChange,
}: SoreThroatSummaryReportProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
      {/* Report Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-navy-900 to-navy-800 text-white print:bg-white print:text-navy-900">
        <h1 className="text-xl font-bold mb-1">Get Real Health</h1>
        <h2 className="text-sm font-semibold">
          Sore Throat Test & Treat Consultation Record
        </h2>
        <p className="text-xs mt-2 opacity-80 print:text-gray-600">
          Patient Group Direction: Sore Throat Test & Treat
        </p>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Clinical Alerts */}
        {alerts.length > 0 && (
          <>
            <SectionHeader>Clinical Alerts</SectionHeader>
            <AlertSummary alerts={alerts} />
          </>
        )}

        {/* Patient Information */}
        <div>
          <SectionHeader>Patient Information</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Full name"
              value={`${patient.firstName} ${patient.lastName}`}
            />
            <Row
              label="Date of birth"
              value={formatDate(patient.dateOfBirth)}
            />
            <Row label="Age" value={patient.age ? `${patient.age} years` : ""} />
            <Row label="GP" value={patient.gpName} />
            <Row label="GP practice" value={patient.gpPractice} />
            <Row label="NHS number" value={patient.nhsNumber} />
          </div>
        </div>

        {/* Consultation Details */}
        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Consultation date"
              value={formatDate(summary.consultationDate)}
            />
            <Row label="Consultation time" value={summary.consultationTime} />
            <Row
              label="ID type verified"
              value={consent.idType || "Not recorded"}
            />
          </div>
        </div>

        {/* Clinical Presentation */}
        <div>
          <SectionHeader>Clinical Presentation</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Duration of symptoms"
              value={symptoms.duration || "Not recorded"}
            />
            <Row
              label="Severity"
              value={symptoms.soreThroatSeverity || "Not recorded"}
            />
            <Row
              label="Temperature"
              value={
                examination.temperature
                  ? `${examination.temperature}°C`
                  : "Not recorded"
              }
            />
            <Row
              label="Tonsillar appearance"
              value={
                examination.tonsillarAppearance
                  ? examination.tonsillarAppearance.charAt(0).toUpperCase() +
                    examination.tonsillarAppearance.slice(1)
                  : "Not recorded"
              }
            />
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <SectionHeader>Associated Symptoms</SectionHeader>
          <CounsellingGrid
            items={[
              ["Difficulty swallowing", symptoms.dysphagia],
              ["Drooling", symptoms.drooling],
              ["Difficulty opening mouth", symptoms.trismus],
              ["Muffled voice", symptoms.muffledVoice],
              ["Unilateral swelling", symptoms.unilateralSwelling],
              ["Cervical lymphadenopathy", examination.cervicalLymphadenopathy],
            ]}
          />
        </div>

        {/* FeverPAIN Score */}
        <div>
          <SectionHeader>FeverPAIN Score</SectionHeader>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${
                  feverPainScore.fever
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {feverPainScore.fever && (
                  <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">Fever (&gt;38°C)</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${
                  feverPainScore.purulence
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {feverPainScore.purulence && (
                  <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">Purulence (exudate)</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${
                  feverPainScore.attendRapidly
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {feverPainScore.attendRapidly && (
                  <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">Attend rapidly (&lt;3 days)</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${
                  feverPainScore.inflamedTonsils
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {feverPainScore.inflamedTonsils && (
                  <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">Inflamed tonsils</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${
                  feverPainScore.noCoughCoryza
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {feverPainScore.noCoughCoryza && (
                  <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-gray-700">No cough/runny nose</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-navy-900">
              Total FeverPAIN Score: {feverPainScore.totalScore}/5
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div>
          <SectionHeader>Test Results</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Rapid Strep A"
              value={
                examination.rapidStrepAResult
                  ? examination.rapidStrepAResult.charAt(0).toUpperCase() +
                    examination.rapidStrepAResult.slice(1)
                  : "Not recorded"
              }
            />
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History & Contraindications</SectionHeader>
          <CounsellingGrid
            items={[
              ["Penicillin allergy", history.penicillinAllergy],
              ["Immunosuppressed", history.immunosuppressed],
              ["Recurrent tonsillitis", history.recurrentTonsillitis],
              ["Previous quinsy", history.previousQuinsy],
              ["Rheumatic fever history", history.rheumaticFeverHistory],
            ]}
          />
        </div>

        {/* Medicine Prescribed */}
        {medicine.medicine && medicine.medicine !== "none" && (
          <div>
            <SectionHeader>Medicine Supplied</SectionHeader>
            <div className="space-y-1.5">
              <Row
                label="Medicine"
                value={
                  medicine.medicine === "phenoxymethylpenicillin"
                    ? "Phenoxymethylpenicillin (Pen V)"
                    : "Clarithromycin"
                }
              />
              <Row label="Dose" value={medicine.dose} />
              <Row label="Frequency" value={medicine.frequency} />
              <Row label="Duration" value={medicine.duration} />
              <Row label="Quantity" value={medicine.quantity.toString()} />
              <Row
                label="Back-up prescription"
                value={medicine.backupPrescription ? "Yes" : "No"}
              />
            </div>
          </div>
        )}

        {/* Counselling Provided */}
        <div>
          <SectionHeader>Counselling Provided</SectionHeader>
          <CounsellingGrid
            items={[
              ["Complete course of antibiotics", counselling.completeCourse],
              ["Pain relief options", counselling.painRelief],
              ["Fluid intake importance", counselling.fluidIntake],
              ["Soft foods and nutrition", counselling.softFoods],
              [
                "Return if worsening/no improvement",
                counselling.returnIfWorsening,
              ],
              ["Red flag symptoms", counselling.redFlagSymptoms],
              ["Avoid antibiotic sharing", counselling.avoidAntibioticSharing],
              ["Return to school/work advice", counselling.schoolWorkAdvice],
            ]}
          />
        </div>

        {/* Clinical Notes */}
        <div className="print:hidden">
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Clinical Notes (optional)
          </label>
          <textarea
            value={summary.clinicalNotes}
            onChange={(e) => onSummaryChange("clinicalNotes", e.target.value)}
            placeholder="Any additional clinical notes..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
          />
        </div>

        {/* Pharmacist Details */}
        <PharmacistDeclaration
          pgdName="Sore Throat Test & Treat"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        {/* Editable Fields for Pharmacist (screen only) */}
        <div className="print:hidden space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wide">
            Pharmacist Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput
              label="Pharmacist name"
              value={summary.pharmacistName}
              onChange={(v) => onSummaryChange("pharmacistName", v)}
              required
              placeholder="Your name"
            />
            <TextInput
              label="GPhC registration number"
              value={summary.pharmacistGPhC}
              onChange={(v) => onSummaryChange("pharmacistGPhC", v)}
              required
              placeholder="e.g., 123456"
            />
          </div>
          <div>
            <TextInput
              label="Pharmacy name"
              value={summary.pharmacyName}
              onChange={(v) => onSummaryChange("pharmacyName", v)}
              placeholder="Your pharmacy name"
            />
          </div>
          <div>
            <TextInput
              label="Pharmacy address"
              value={summary.pharmacyAddress}
              onChange={(v) => onSummaryChange("pharmacyAddress", v)}
              placeholder="Full address"
            />
          </div>
        </div>

        <ReportFooter pgdName="Sore Throat Test & Treat" />
      </div>
    </div>
  );
}
