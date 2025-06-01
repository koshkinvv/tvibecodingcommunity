import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

export interface OnboardingStep {
  id: string;
  message: string;
  highlightElement?: string;
  position?: "bottom-right" | "bottom-left" | "center";
  page?: string;
  action?: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    message: "Добро пожаловать в Vibe Coding! Я ваш личный помощник и проведу экскурсию по платформе. Готовы начать?",
    position: "center"
  },
  {
    id: "dashboard",
    message: "Это главная страница, где вы видите статистику сообщества и активность участников. Здесь отображается общая информация о проектах.",
    highlightElement: "[data-onboarding='stats']",
    page: "/"
  },
  {
    id: "featured-members",
    message: "Здесь показаны активные участники сообщества. Вы можете посмотреть их профили и репозитории.",
    highlightElement: "[data-onboarding='featured-members']",
    page: "/"
  },
  {
    id: "navigation",
    message: "В верхней навигации вы найдете все основные разделы платформы. Давайте их изучим!",
    highlightElement: "[data-onboarding='navigation']",
    page: "/"
  },
  {
    id: "profile-menu",
    message: "Через это меню вы можете войти в систему, настроить профиль и управлять своими репозиториями.",
    highlightElement: "[data-onboarding='profile-menu']",
    page: "/"
  },
  {
    id: "add-repository",
    message: "После входа вы сможете добавить свои GitHub репозитории. Система автоматически создаст описание проекта с помощью AI!",
    highlightElement: "[data-onboarding='add-repository']",
    page: "/profile"
  },
  {
    id: "community",
    message: "Здесь вы найдете всех участников сообщества, их статус активности и можете изучить их проекты.",
    highlightElement: "[data-onboarding='community-content']",
    page: "/community"
  },
  {
    id: "activity-feed",
    message: "Лента активности показывает последние коммиты участников с AI-генерированными описаниями изменений.",
    highlightElement: "[data-onboarding='activity-content']",
    page: "/activity"
  },
  {
    id: "projects",
    message: "На странице проектов вы можете просматривать все публичные репозитории сообщества и оставлять комментарии.",
    highlightElement: "[data-onboarding='projects-content']",
    page: "/projects"
  },
  {
    id: "insights",
    message: "AI анализ даст персональные рекомендации по улучшению ваших проектов в разных категориях.",
    highlightElement: "[data-onboarding='insights-content']",
    page: "/insights"
  },
  {
    id: "complete",
    message: "Отлично! Теперь вы знаете основы платформы. Начните с добавления своего первого репозитория и присоединяйтесь к сообществу разработчиков!",
    position: "center"
  }
];

export const useOnboarding = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("onboarding-completed");
    if (completed) {
      setHasCompletedOnboarding(true);
    }
  }, []);

  useEffect(() => {
    // Check for pending onboarding step after navigation
    const nextStep = sessionStorage.getItem('onboarding-next-step');
    const onboardingInProgress = sessionStorage.getItem('onboarding-in-progress');
    
    if (nextStep && onboardingInProgress === 'true') {
      const stepIndex = parseInt(nextStep, 10);
      sessionStorage.removeItem('onboarding-next-step');
      setCurrentStep(stepIndex);
      setIsActive(true);
      return;
    }

    // Auto-start onboarding for new users only on home page
    if (user && !hasCompletedOnboarding && !isActive && window.location.pathname === '/') {
      const userOnboardingKey = `onboarding-completed-${user.id}`;
      const userCompleted = localStorage.getItem(userOnboardingKey);
      
      if (!userCompleted && !onboardingInProgress) {
        // Start onboarding for users who haven't completed it
        sessionStorage.setItem('onboarding-in-progress', 'true');
        setTimeout(() => {
          startOnboarding();
        }, 1000); // Small delay for page to load
      }
    }
  }, [user, hasCompletedOnboarding, isActive]);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStep = ONBOARDING_STEPS[nextStepIndex];
      
      // Navigate to required page if needed
      if (nextStep.page && window.location.pathname !== nextStep.page) {
        // Save the next step before navigation
        sessionStorage.setItem('onboarding-next-step', nextStepIndex.toString());
        window.location.href = nextStep.page;
      } else {
        setCurrentStep(nextStepIndex);
        // Execute action if defined
        if (nextStep.action) {
          nextStep.action();
        }
      }
    } else {
      // Last step reached, complete onboarding
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStep = ONBOARDING_STEPS[prevStepIndex];
      
      // Navigate to required page if needed
      if (prevStep.page && window.location.pathname !== prevStep.page) {
        window.location.href = prevStep.page;
        setTimeout(() => {
          setCurrentStep(prevStepIndex);
        }, 500);
      } else {
        setCurrentStep(prevStepIndex);
      }
    }
  };

  const skipOnboarding = () => {
    setIsActive(false);
    setHasCompletedOnboarding(true);
    sessionStorage.removeItem('onboarding-in-progress');
    if (user) {
      const userOnboardingKey = `onboarding-completed-${user.id}`;
      localStorage.setItem(userOnboardingKey, "true");
    }
    localStorage.setItem("onboarding-completed", "true");
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setHasCompletedOnboarding(true);
    sessionStorage.removeItem('onboarding-in-progress');
    if (user) {
      const userOnboardingKey = `onboarding-completed-${user.id}`;
      localStorage.setItem(userOnboardingKey, "true");
    }
    localStorage.setItem("onboarding-completed", "true");
  };

  const resetOnboarding = () => {
    if (user) {
      const userOnboardingKey = `onboarding-completed-${user.id}`;
      localStorage.removeItem(userOnboardingKey);
    }
    localStorage.removeItem("onboarding-completed");
    localStorage.removeItem("onboarding-auto-start");
    sessionStorage.removeItem('onboarding-in-progress');
    sessionStorage.removeItem('onboarding-next-step');
    setHasCompletedOnboarding(false);
    setIsActive(false);
    setCurrentStep(0);
  };

  const getCurrentStep = () => ONBOARDING_STEPS[currentStep];
  
  const isStepForCurrentPage = () => {
    const step = getCurrentStep();
    return !step.page || step.page === window.location.pathname;
  };

  return {
    isActive: isActive && isStepForCurrentPage(),
    currentStep: currentStep + 1,
    totalSteps: ONBOARDING_STEPS.length,
    step: getCurrentStep(),
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding
  };
};