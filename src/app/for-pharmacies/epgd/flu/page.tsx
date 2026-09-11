import React from 'react';
import FluToolClient from './FluToolClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Flu Vaccination ePGD 2026/27 | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for seasonal influenza vaccination (IIVc, aIIV, IIVr, IIVe), 2026/27 season, version 004',
};

export default function FluToolPage(): React.ReactNode {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <FluToolClient />
    </main>
  );
}
