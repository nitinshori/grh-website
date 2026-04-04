'use client';

import { ImpetigoData } from './impetigo-types';
import { BaseSummary, ClinicalAlert } from '../shared/types';
import { TextInput, TextArea, Checkbox } from '../shared/components/FormInputs';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../shared/components/SummaryReportShell';

interface SummaryStepProps {
  data: ImpetigoData;
  summary: BaseSummary;
  onSummaryChange: (summary: BaseSummary) => void;
  alerts: ClinicalAlert[];
}

export function SummaryStep({ data, summary, onSummaryChange, alerts }: SummaryStepProps) {
  const handleSummaryChange = (field: keyof BaseSummary, value: unknown) => {
    onSummaryChange({
      ...summary,
      [field]: value,
    });
  };

  const counsellingItems: [string, boolean][] = [
    ['Hygiene advice - do not share towels/flannels', data.counselling.hygieneAdvice],
    ['Hand washing with soap and water', data.counselling.handwashing],
    ['School/work exclusion until 48hrs post-treatment', data.counselling.schoolExclusion],
    ['Avoid touching/scratching lesions', data.counselling.avoidTouching],
    ['Complete full course of antibiotics', data.counselling.completeCourse],
    ['Application technique for topical treatment', data.counselling.applicationAdvice],
    ['Return if worsening or no improvement in 48hrs', data.counselling.returnIfWorsening],
    ['Contagion period and transmission risk', data.counselling.contagionPeriod],
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Impetigo Consultation Report</h2>
        <p className="text-sm text-blue-700">
          PGD Consultation - Summary and Print
        </p>
      </div>

      {/* Pharmacist Details */}
      <SectionHeader>Pharmacist Details</SectionHeader>
      <div className="space-y-4">
        <TextInput
          value={summary.pharmacistName}
          onChange={(value) => handleSummaryChange('pharmacistName', value)}
          placeholder="Enter your full name"
          label="Pharmacist Name *"
        />
        <TextInput
          value={summary.consultationDate}
          onChange={(value) => handleSummaryChange('consultationDate', value)}
          placeholder="DD/MM/YYYY"
          label="Consultation Date *"
          type="date"
        />
        <TextInput
          value={summary.consultationTime}
          onChange={(value) => handleSummaryChange('consultationTime', value)}
          placeholder="HH:MM"
          label="Consultation Time *"
          type="time"
        />
      </div>

      {/* Patient Details Summary */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-2">
        <Row label="Name" value={`${data.patientDetails.firstName} ${data.patientDetails.lastName}`} />
        <Row label="NHS Number" value={data.patientDetails.nhsNumber} />
        <Row label="Date of Birth" value={data.patientDetails.dateOfBirth} />
        <Row label="Contact Number" value={data.patientDetails.phone} />
      </div>

      {/* Clinical Assessment */}
      <SectionHeader>Clinical Assessment</SectionHeader>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Lesion Type
          </label>
          <p className="text-gray-700 capitalize">{data.lesionAssessment.lesionType || 'Not specified'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Extent
          </label>
          <p className="text-gray-700 capitalize">{data.lesionAssessment.extent || 'Not specified'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Affected Areas
          </label>
          <p className="text-gray-700">{data.lesionAssessment.affectedAreas.join(', ') || 'None specified'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Duration
          </label>
          <p className="text-gray-700">{data.lesionAssessment.duration || 'Not specified'}</p>
        </div>
        {data.lesionAssessment.additionalNotes && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Additional Notes
            </label>
            <p className="text-gray-700">{data.lesionAssessment.additionalNotes}</p>
          </div>
        )}
      </div>

      {/* Alerts Summary */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Treatment Plan */}
      <SectionHeader>Treatment Plan</SectionHeader>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Treatment *
          </label>
          <p className="text-gray-700 capitalize">{data.treatmentSelection.treatment.replace('-', ' ')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Dose
          </label>
          <p className="text-gray-700">{data.treatmentSelection.dose}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Frequency
          </label>
          <p className="text-gray-700">{data.treatmentSelection.frequency}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Duration
          </label>
          <p className="text-gray-700">{data.treatmentSelection.duration}</p>
        </div>
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid items={counsellingItems} />

      {/* Clinical Notes */}
      <SectionHeader>Clinical Notes</SectionHeader>
      <TextArea
        value={summary.clinicalNotes}
        onChange={(value) => handleSummaryChange('clinicalNotes', value)}
        placeholder="Enter any additional clinical notes, treatment plan details, or patient education provided..."
        label="Clinical Notes"
        rows={4}
      />

      {/* Pharmacist Declaration */}
      <SectionHeader>Pharmacist Declaration</SectionHeader>
      <PharmacistDeclaration
        pgdName="Impetigo PGD"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC || ''}
        pharmacyName={summary.pharmacyName || ''}
      />

      {/* Footer */}
      <ReportFooter pgdName="Impetigo PGD" />
    </div>
  );
}
