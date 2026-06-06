import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    backgroundColor: isActive ? '#4F46E5' : isCompleted ? '#10B981' : '#1B2240',
                    boxShadow: isActive ? '0 0 20px rgba(79, 70, 229, 0.4)' : 'none',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={isActive ? 'text-white' : 'text-[#64748B]'}>{stepNum}</span>
                  )}
                </motion.div>
                <span className={`text-[10px] mt-2 font-medium ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-16 h-px bg-white/10 mx-2 mb-5 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-y-0 left-0 bg-[#4F46E5]"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
