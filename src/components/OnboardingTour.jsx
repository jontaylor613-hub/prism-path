/**
 * Onboarding Tour Component
 * Guided tour for new users with spotlight overlay
 */

import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, SkipForward } from 'lucide-react';
import { getTheme } from '../utils';

const TOUR_STORAGE_KEY = 'prismpath_hasSeenTour';

export default function OnboardingTour({ isDark = true, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const overlayRef = useRef(null);

  const steps = [
    {
      id: 'add-student',
      selector: '[data-tour="add-student"]',
      message: 'Start by adding your caseload.',
      title: 'Add Student',
      position: 'bottom'
    },
    {
      id: 'ai-tools',
      selector: '[data-tour="ai-tools"]',
      message: 'Use these tools to draft paperwork.',
      title: 'AI Tools',
      position: 'bottom'
    },
    {
      id: 'command-bar',
      selector: '[data-tour="command-bar"]',
      message: 'Press Cmd+K (or Ctrl+K) to do anything fast.',
      title: 'Command Bar',
      position: 'top'
    }
  ];

  // Check if user has seen tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    if (!hasSeenTour) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsVisible(true);
        goToStep(0);
      }, 500);
    }
  }, []);

  // Find and highlight target element
  const goToStep = (stepIndex) => {
    if (stepIndex >= steps.length) {
      completeTour();
      return;
    }

    const step = steps[stepIndex];
    const element = document.querySelector(step.selector);
    
    if (element) {
      setTargetElement(element);
      updateTargetPosition(element);
      setCurrentStep(stepIndex);
    } else {
      // Element not found, skip to next step
      console.warn(`Tour step target not found: ${step.selector}`);
      if (stepIndex < steps.length - 1) {
        setTimeout(() => goToStep(stepIndex + 1), 500);
      } else {
        completeTour();
      }
    }
  };

  // Update target position when element is found
  const updateTargetPosition = (element) => {
    const rect = element.getBoundingClientRect();
    setTargetPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    });
  };

  // Handle window resize
  useEffect(() => {
    if (!isVisible || !targetElement) return;

    const handleResize = () => {
      updateTargetPosition(targetElement);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isVisible, targetElement]);

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleNext = () => {
    goToStep(currentStep + 1);
  };

  const handleSkip = () => {
    completeTour();
  };

  if (!isVisible || !targetPosition) return null;

  const theme = getTheme(isDark);
  const currentStepData = steps[currentStep];
  const isBottom = currentStepData.position === 'bottom';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="black" />
            <rect
              x={targetPosition.left}
              y={targetPosition.top}
              width={targetPosition.width}
              height={targetPosition.height}
              fill="white"
              rx="8"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-mask)"
          className="pointer-events-auto"
        />
      </svg>

      {/* Tooltip */}
      <div
        className="absolute z-10 pointer-events-auto"
        style={{
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          top: isBottom
            ? `${targetPosition.top + targetPosition.height + 20}px`
            : `${targetPosition.top - 20}px`,
          transform: 'translateX(-50%) translateY(0)',
        }}
      >
        <div
          className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl shadow-2xl p-6 max-w-sm min-w-[300px] ${
            isBottom ? 'mb-4' : 'mb-0'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`text-lg font-bold ${theme.text} mb-1`}>
                {currentStepData.title}
              </h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {currentStepData.message}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className={`p-1 rounded-lg hover:bg-slate-500/10 ${theme.textMuted} hover:${theme.text} transition-colors`}
              aria-label="Skip tour"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-cyan-500 w-8'
                      : 'bg-slate-500/30 w-1.5'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className={`px-3 py-1.5 text-sm font-medium ${theme.textMuted} hover:${theme.text} transition-colors flex items-center gap-1`}
              >
                <SkipForward size={14} />
                Skip
              </button>
              <button
                onClick={handleNext}
                className={`px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all flex items-center gap-1`}
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight border around target */}
      <div
        className="absolute pointer-events-none z-[9998] border-2 border-cyan-500 rounded-lg shadow-lg shadow-cyan-500/50"
        style={{
          left: `${targetPosition.left - 4}px`,
          top: `${targetPosition.top - 4}px`,
          width: `${targetPosition.width + 8}px`,
          height: `${targetPosition.height + 8}px`,
        }}
      />
    </div>
  );
}


