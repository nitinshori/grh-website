'use client';

import React from 'react';
import type { ASConsultationState } from '../altitude-sickness-types';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';

interface AltitudeSicknessSummaryReportProps {
  state: ASConsultationState;
}

export const AltitudeSicknessSummaryReport: React.FC<
  AltitudeSicknessSummaryReportProps
> = ({ state }) => {
  const {
    patient,
    travelAssessment,
    medicineSelection,
    counselling,
    summary,
    alerts,
  } = state;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Altitude Sickness ePGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acute Mountain Sickness Prevention Consultation Record
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">{summary.consultationDate}</p>
          <p>{summary.consultationTime}</p>
        </div>
      </div>

      {/* Patient Information */}
      <SectionHeader>Patient Information</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Age" value={`${patient.age} years`} />
        <Row label="NHS Number" value={patient.nhsNumber || 'Not provided'} />
        <Row label="GP Practice" value={patient.gpPractice || 'Not provided'} />
      </div>

      {/* Travel & Altitude Details */}
      <SectionHeader>Travel & Altitude Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={travelAssessment.destinationCountry} />
        <Row label="Destination Altitude" value={`${travelAssessment.destinationAltitude}m`} />
        <Row label="Current Altitude" value={travelAssessment.currentAltitude ? `${travelAssessment.currentAltitude}m` : 'Not specified'} />
        <Row label="Departure" value={new Date(travelAssessment.departureDate).toLocaleDateString('en-GB')} />
        <Row label="Ascent Rate" value={travelAssessment.ascentRate} />
        <Row label="Acclimatisation Plan" value={travelAssessment.acclimatisationPlan ? `Yes (${travelAssessment.acclimatisationDays} days)` : 'No'} />
        <Row label="Previous High Altitude Experience" value={travelAssessment.previousAltitudeExperience ? 'Yes' : 'No'} />
        <Row label="Previous Altitude Sickness" value={travelAssessment.previousAltitudeSickness ? 'Yes' : 'No'} />
        {travelAssessment.previousAltitudeSickness && (
          <Row label="Previous Sickness Details" value={travelAssessment.previousSicknessDetails} />
        )}
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Medicine Selection */}
      <SectionHeader>Medicine Prescribed</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Medicine" value={medicineSelection.selectedMedicine || 'None'} />
        <Row label="Dose" value={medicineSelection.dose} />
        <Row label="Start Timing" value={medicineSelection.startTiming} />
        <Row label="Continue Until" value={medicineSelection.continuationTiming} />
        <Row label="Clinical Reason" value={medicineSelection.reason} />
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['Paraesthesia (tingling) is common and harmless', counselling.paraesthesiaExplained],
          ['Avoid alcohol at altitude', counselling.avoidAlcoholAdvice],
          ['Hydrate well (2.5–3L/day)', counselling.hydrateWellAdvice],
          ['Ascend gradually / allow acclimatisation', counselling.ascentAdvice],
          ['AMS symptoms and recognition', counselling.amsSymptomAdvice],
          ['HACE (cerebral edema) warning signs', counselling.haceSymptomAdvice],
          ['HAPE (pulmonary edema) warning signs', counselling.hapeSymptomAdvice],
          ['Descent immediately if severe symptoms', counselling.descentAdvice],
          ['Medicine card / information provided', counselling.medicineCardProvided],
        ]}
      />

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <div className="bg-gray-50 rounded p-4 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {summary.clinicalNotes}
            </p>
          </div>
        </>
      )}

      {/* Pharmacist Declaration */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <PharmacistDeclaration
          pgdName="Altitude Sickness ePGD"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Altitude Sickness ePGD" />
    </div>
  );
};
