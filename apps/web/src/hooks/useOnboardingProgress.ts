import { useState } from "react";
import { useLocalStorageState } from "./useLocalStorageState";

export type OnboardingProgress = {
  locationSelected: boolean;
  storeSelected: boolean;
  firstSearchSuccess: boolean;
  firstProductAdded: boolean;
};

const ONBOARDING_KEY = "onboarding_v1";

const defaultProgress: OnboardingProgress = {
  locationSelected: false,
  storeSelected: false,
  firstSearchSuccess: false,
  firstProductAdded: false,
};

const stepKeys: (keyof OnboardingProgress)[] = [
  "locationSelected",
  "storeSelected",
  "firstSearchSuccess",
  "firstProductAdded",
];

export function useOnboardingProgress() {
  const [progress, setProgress] = useLocalStorageState<OnboardingProgress>(
    ONBOARDING_KEY,
    defaultProgress
  );
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  const markStep = (step: keyof OnboardingProgress) => {
    setProgress((prev) => ({ ...prev, [step]: true }));
  };

  const isComplete = stepKeys.every((k) => progress[k]);
  const visible = !isComplete && !dismissedThisSession;

  return {
    progress,
    markStep,
    isComplete,
    visible,
    dismiss: () => setDismissedThisSession(true),
  };
}
