"use client";

import type { ClinicalAlert, AlertSeverity } from "../types";

interface AlertBannerProps {
  alerts: ClinicalAlert[];
}

const severityConfig: Record<
  AlertSeverity,
  { bg: string; border: string; text: string; icon: string; label: string }
> = {
  stop: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    icon: "\u26D4",
    label: "EXCLUSION \u2014 CANNOT SUPPLY",
  },
  caution: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
    icon: "\u26A0\uFE0F",
    label: "CAUTION",
  },
  "red-flag": {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-800",
    icon: "\uD83D\uDEA9",
    label: "RED FLAG \u2014 CONSIDER REFERRAL",
  },
};

function AlertCard({ alert }: { alert: ClinicalAlert }) {
  const config = severityConfig[alert.severity];

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-lg px-4 py-3`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-label={config.label}>
          {config.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${config.text}`}
            >
              {config.label}
            </span>
          </div>
          <p className={`text-sm font-semibold ${config.text}`}>
            {alert.message}
          </p>
          <p className={`text-xs mt-1 ${config.text} opacity-80`}>
            {alert.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort((a, b) => {
    const order: Record<AlertSeverity, number> = {
      stop: 0,
      caution: 1,
      "red-flag": 2,
    };
    return order[a.severity] - order[b.severity];
  });

  const hasStops = sorted.some((a) => a.severity === "stop");

  return (
    <div className="space-y-3 mb-6">
      {hasStops && (
        <div className="bg-red-600 text-white rounded-lg px-4 py-3 text-center">
          <p className="font-bold text-sm">
            CONSULTATION CANNOT PROCEED — EXCLUSION CRITERIA MET
          </p>
          <p className="text-xs mt-1 text-red-100">
            One or more absolute contraindications have been identified. The
            patient should be referred to their GP.
          </p>
        </div>
      )}
      {sorted.map((alert) => (
        <AlertCard key={alert.code} alert={alert} />
      ))}
    </div>
  );
}
