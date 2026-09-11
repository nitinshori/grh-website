'use client';

import React from 'react';
import type { TDConsultationState } from '../travellers-diarrhoea-types';
import { TD_PGD_VERSION } from '../travellers-diarrhoea-clinical-logic';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';

interface TravellersDiarrhoeaSummaryReportProps {
  state: TDConsultationState;
}

export const TravellersDiarrhoeaSummaryReport: React.FC<
  TravellersDiarrhoeaSummaryReportProps
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
            Travellers' Diarrhoea ePGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Standby Treatment Supply Consultation Record
          </p>
          <p className="text-xs text-gray-500 mt-1">{TD_PGD_VERSION}</p>
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
        <Row label="Travel Type" value={travelAssessment.travelType} />
        <Row label="Departure" value={new Date(travelAssessment.departureDate).toLocaleDateString('en-GB')} />
        <Row label="Return" value={new Date(travelAssessment.returnDate).toLocaleDateString('en-GB')} />
        <Row label="Dietary Habits" value={travelAssessment.dietaryHabits || 'Not specified'} />
        <Row label="Previous Episodes" value={travelAssessment.previousDiarrhoeaEpisodes ? 'Yes' : 'No'} />
        {travelAssessment.previousDiarrhoeaEpisodes && (
          <Row label="Previous Episode Details" value={travelAssessment.previousEpisodeDetails} />
        )}
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Treatment Supplied */}
      <SectionHeader>Standby Treatment Supplied</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Approach" value={medicineSelection.selectedApproach === 'standby' ? 'Standby treatment supplied' : 'Not supplied'} />
        {medicineSelection.selectedApproach === 'standby' && (
          <>
            <Row label="Medicine" value="Azithromycin 500 mg tablets" />
            <Row label="Brand" value={medicineSelection.brand || 'Not recorded'} />
            <Row label="Azithromycin Dose" value={medicineSelection.azithromycinDose} />
            <Row label="Quantity supplied" value={medicineSelection.azithromycinQuantity !== null ? `${medicineSelection.azithromycinQuantity} x 500 mg tablets` : 'Not recorded'} />
            <Row label="Indication" value="Self-start for moderate to severe traveller's diarrhoea" />
            <Row label="Loperamide (OTC, not under PGD)" value={medicineSelection.loperamideDose || 'Not supplied'} />
          </>
        )}
        <Row label="Clinical Reason" value={medicineSelection.reason} />
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['Oral rehydration is the key priority; maintain hydration', counselling.orCrsAdvice],
          ['When and how to self-start azithromycin (moderate to severe symptoms, with food)', counselling.whenToStartTreatment],
          ['Loperamide (OTC): not with fever or blood in stool', counselling.loperamideAdvice],
          ['Azithromycin 500 mg once daily for 1 to 3 days; maximum 3 days', counselling.azithromycinAdvice],
          ['Pregnancy implications', counselling.pregnancyAdvice],
          ['Food/water hygiene measures', counselling.foodHygiene],
          ['Safe water and food sources', counselling.waterSafety],
          ['Seek local medical attention if symptoms worsen or persist (fever, blood, severe pain, vomiting, over 14 days, systemically unwell)', counselling.whenToSeekHelp],
          ['Stop treatment if hypersensitivity or serious side effects occur', counselling.childrenUnderWarning],
          ['Patient information leaflet supplied', counselling.medicineCardProvided],
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
          pgdName="Travellers' Diarrhoea ePGD"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Travellers' Diarrhoea ePGD" />
    </div>
  );
};
