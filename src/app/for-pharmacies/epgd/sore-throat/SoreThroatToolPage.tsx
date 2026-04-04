"use client";

import { useState } from "react";
import { SoreThroatToolClient } from "./components/SoreThroatToolClient";

export function SoreThroatToolPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
            Sore Throat Test & Treat
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Patient Group Direction Consultation Tool for UK Community Pharmacies
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            This tool guides you through the consultation process for patients with sore throat,
            including symptom assessment, FeverPAIN scoring, rapid strep A testing, and antibiotic
            recommendations.
          </p>
        </div>

        {/* Main Tool */}
        <SoreThroatToolClient
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      </div>
    </div>
  );
}
