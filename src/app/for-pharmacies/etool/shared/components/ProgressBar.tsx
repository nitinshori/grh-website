"use client";

interface ProgressBarProps {
  stepLabels: readonly string[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: Set<number>;
  hasErrors: boolean;
}

export function ProgressBar({
  stepLabels,
  currentStep,
  onStepClick,
  completedSteps,
  hasErrors,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Desktop progress bar */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => {
            const isActive = i === currentStep;
            const isCompleted = completedSteps.has(i);
            const isClickable = isCompleted || i <= currentStep;

            return (
              <div key={label} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick(i)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all w-full
                    ${
                      isActive
                        ? hasErrors
                          ? "bg-red-50 text-red-700 ring-2 ring-red-300"
                          : "bg-teal-50 text-teal-700 ring-2 ring-teal-300"
                        : isCompleted
                          ? "bg-teal-50 text-teal-600 hover:bg-teal-100 cursor-pointer"
                          : "bg-gray-50 text-gray-400"
                    }
                    ${isClickable && !isActive ? "cursor-pointer hover:bg-gray-100" : ""}
                    ${!isClickable ? "cursor-not-allowed" : ""}
                  `}
                >
                  <span
                    className={`
                      flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${
                        isActive
                          ? hasErrors
                            ? "bg-red-500 text-white"
                            : "bg-teal-500 text-white"
                          : isCompleted
                            ? "bg-teal-500 text-white"
                            : "bg-gray-300 text-white"
                      }
                    `}
                  >
                    {isCompleted && !isActive ? (
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-2 h-0.5 flex-shrink-0 ${
                      isCompleted ? "bg-teal-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-navy-900">
            Step {currentStep + 1} of {stepLabels.length}
          </span>
          <span className="text-sm text-gray-500">
            {stepLabels[currentStep]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              hasErrors ? "bg-red-500" : "bg-teal-500"
            }`}
            style={{
              width: `${((currentStep + 1) / stepLabels.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
