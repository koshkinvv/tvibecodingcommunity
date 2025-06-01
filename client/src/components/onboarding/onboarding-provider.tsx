import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingMascot } from "./mascot";

export const OnboardingProvider = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    step,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding();

  if (!isActive || !step) return null;

  return (
    <OnboardingMascot
      message={step.message}
      step={currentStep}
      totalSteps={totalSteps}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipOnboarding}
      onComplete={completeOnboarding}
      position={step.position}
      highlightElement={step.highlightElement}
    />
  );
};