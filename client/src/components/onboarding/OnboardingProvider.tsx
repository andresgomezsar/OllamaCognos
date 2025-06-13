import React, { createContext, useContext, useState, useEffect } from 'react';
import OllamaConfigModal from './OllamaConfigModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { settingsApi, statusApi } from '@/lib/api';

// Define the context type
interface OnboardingContextType {
  showOllamaModal: boolean;
  openOllamaModal: () => void;
  closeOllamaModal: () => void;
  isFirstTimeUser: boolean;
  hasCompletedOnboarding: boolean;
  markOnboardingComplete: () => void;
}

// Create the context with default values
const OnboardingContext = createContext<OnboardingContextType>({
  showOllamaModal: false,
  openOllamaModal: () => {},
  closeOllamaModal: () => {},
  isFirstTimeUser: true,
  hasCompletedOnboarding: false,
  markOnboardingComplete: () => {},
});

// Hook to use the onboarding context
export const useOnboarding = () => useContext(OnboardingContext);

// Provider component
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOllamaModal, setShowOllamaModal] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Fetch settings and status
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: settingsApi.getSettings,
  });

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    queryFn: statusApi.getStatus,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: "Settings updated",
        description: "Ollama configuration has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update Ollama settings",
        variant: "destructive",
      });
    },
  });

  // Determine if this is a first-time user and if onboarding is needed
  useEffect(() => {
    if (settings && status) {
      // Check if user has completed onboarding before
      const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
      setHasCompletedOnboarding(onboardingCompleted);
      
      // User is considered a first-time user if:
      // 1. They haven't completed onboarding AND
      // 2. Either Ollama URL isn't set or it's not connecting
      const needsOllamaSetup = (!settings.ollamaUrl || status?.ollama?.status !== 'connected');
      
      setIsFirstTimeUser(!onboardingCompleted && needsOllamaSetup);
      
      // Automatically show the Ollama modal for first-time users
      if (!onboardingCompleted && needsOllamaSetup) {
        setShowOllamaModal(true);
      }
    }
  }, [settings, status]);

  // Save Ollama URL
  const saveOllamaUrl = (url: string) => {
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        ollamaUrl: url,
      });
      markOnboardingComplete();
    }
  };

  // Mark onboarding as complete
  const markOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setHasCompletedOnboarding(true);
    setIsFirstTimeUser(false);
  };

  return (
    <OnboardingContext.Provider value={{
      showOllamaModal,
      openOllamaModal: () => setShowOllamaModal(true),
      closeOllamaModal: () => setShowOllamaModal(false),
      isFirstTimeUser,
      hasCompletedOnboarding,
      markOnboardingComplete,
    }}>
      {children}
      
      {/* Ollama Configuration Modal */}
      <OllamaConfigModal
        open={showOllamaModal}
        onClose={() => setShowOllamaModal(false)}
        onSave={saveOllamaUrl}
        defaultUrl={settings?.ollamaUrl || "http://localhost:11434"}
      />
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
