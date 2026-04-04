'use client';

import React from 'react';
import type { AMConsultationState } from '../anti-malarials-types';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';

interface AntiMalarialsSummaryReportProps {
  state: AMConsultationState;
}

export const AntiMalarialsSummaryReport: React.FC<
  AntiMalarialsSummaryReportProps
> = ({ state }) => {
  const {
    patient,
    travelAssessment,
    medicineSelection,
    counselling,
    summary,
    alerts,
  } = state;

  const tripDays =
    new Date(travelAssessment.returnDate).getTime() -
    new Date(travelAssessment.departureDate).getTime();
  const days = Math.ceil(tripDays / (1000 * 60 * 60 * 24));

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Anti-malarials ePGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Malaria Prophylaxis Consultation Record
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

      {/* Travel Details */}
      <SectionHeader>Travel Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={travelAssessment.destinationCountry} />
        <Row label="Duration" value={`${days} days`} />
        <Row label="Departure" value={new Date(travelAssessment.departureDate).toLocaleDateString('en-GB')} />
        <Row label="Return" value={new Date(travelAssessment.returnDate).toLocaleDateString('en-GB')} />
        <Row label="Previous Prophylaxis" value={travelAssessment.previousMalariaProphylaxis ? travelAssessment.previousProphylaxisType : 'No'} />
      </div>

      {/* Pregnancy & Breastfeeding Status */}
      <SectionHeader>Special Circumstances</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Currently Pregnant" value={travelAssessment.currentlyPregnant ? 'Yes' : 'No'} />
        <Row label="Planning Pregnancy" value={travelAssessment.planningPregnancy ? 'Yes' : 'No'} />
        <Row label="Breastfeeding" value={travelAssessment.breastfeeding ? 'Yes' : 'No'} />
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
        <Row label="Medicine" value={medicineSelection.selectedMedicine} />
        <Row label="Dose" value={medicineSelection.dose} />
        <Row label="Start Timing" value={medicineSelection.startTiming} />
        <Row label="Continue After Return" value={medicineSelection.continuationAfterReturn} />
        <Row label="Clinical Reason" value={medicineSelection.reason} />
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['Take with food', counselling.takeWithFood],
          ['Sun protection advice (especially for doxycycline)', counselling.sunProtectionAdvice],
          ['Bite prevention measures', counselling.bitePrevention],
          ['Pregnancy / breastfeeding implications', counselling.pregnancyAdvice],
          ['Management of diarrhoea', counselling.diarrhoeaManagement],
          ['Recognition of fever and when to seek help', counselling.feverManagement],
          ['Side effects explained', counselling.sideEffectsExplained],
          ['When to seek medical attention', counselling.whenToSeekHelp],
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
          pgdName="Anti-malarials ePGD"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Anti-malarials ePGD" />
    </div>
  );
};
