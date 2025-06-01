import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MascotProps {
  message: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onComplete?: () => void;
  position?: "bottom-right" | "bottom-left" | "center";
  highlightElement?: string;
}

const MascotAvatar = ({ isAnimating = false }: { isAnimating?: boolean }) => (
  <motion.div
    className="relative"
    animate={isAnimating ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
  >
    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-8 w-8 text-white" />
      </motion.div>
    </div>
    {/* Breathing animation */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.div>
);

export const OnboardingMascot = ({
  message,
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  position = "bottom-right",
  highlightElement
}: MascotProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation when message changes
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    // Highlight element if specified
    if (highlightElement) {
      const element = document.querySelector(highlightElement);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('onboarding-highlight');
        
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [highlightElement]);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "fixed bottom-6 left-6 z-50";
      case "center":
        return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50";
      default:
        return "fixed bottom-6 right-6 z-50";
    }
  };

  if (!isVisible) return null;

  const isLastStep = step === totalSteps;

  return (
    <>
      {/* Overlay for center position */}
      {position === "center" && (
        <div className="fixed inset-0 bg-black/50 z-40" />
      )}
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={getPositionClasses()}
        >
          <Card className="w-80 shadow-xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MascotAvatar isAnimating={isAnimating} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Виб-помощник</h3>
                    <p className="text-xs text-gray-500">
                      Шаг {step} из {totalSteps}
                    </p>
                  </div>
                </div>
                {onSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsVisible(false);
                      onSkip();
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Message */}
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-gray-700 mb-4 leading-relaxed"
              >
                {message}
              </motion.p>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {onPrev && step > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPrev}
                      className="text-xs"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Назад
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {onSkip && !isLastStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsVisible(false);
                        onSkip();
                      }}
                      className="text-xs text-gray-500"
                    >
                      Пропустить
                    </Button>
                  )}
                  
                  {isLastStep ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsVisible(false);
                        onComplete?.();
                      }}
                      className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Завершить
                      <Sparkles className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    onNext && (
                      <Button
                        size="sm"
                        onClick={onNext}
                        className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Далее
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};