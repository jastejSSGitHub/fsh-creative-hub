"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CreateCanvasDialog } from "@/components/project-files/create-canvas-dialog";
import { CreateReviewBoardDialog } from "@/components/project-files/create-review-board-dialog";
import { CreateTextDocumentDialog } from "@/components/project-files/create-text-document-dialog";
import { ProjectHome } from "@/components/project-files/project-home";
import { TemplateComingSoonDialog } from "@/components/project-files/template-coming-soon-dialog";
import {
  ProjectOnboarding,
  type ProjectShareOnboardingCard,
} from "@/components/project-files/project-onboarding";
import { ProjectOnboardingResumeToast } from "@/components/project-files/project-onboarding-resume-toast";
import { ProjectShareOnboardingCardOverlay } from "@/components/project-files/project-share-onboarding-card";
import { InviteMembersDialog } from "@/components/projects/invite-members-dialog";
import type { ProjectIntroStep } from "@/lib/project-files/onboarding-steps";
import {
  readProjectOnboardingPhase,
  skipProjectOnboarding,
  writeProjectOnboardingStep,
} from "@/lib/project-files/onboarding-storage";
import {
  FEATURE_ONBOARDING_DISMISSED_EVENT,
  shouldShowFeatureOnboarding,
} from "@/lib/onboarding/storage";
import { DEV_TOOLS_SIMULATE_CHANGED } from "@/lib/dev-tools/events";
import { dispatchProjectNavigationEnd } from "@/lib/projects/project-navigation-events";
import {
  getProjectTemplate,
  type PendingProjectTemplate,
  type ProjectTemplateId,
} from "@/lib/project-files/project-templates";
import type { ProjectFileWithMeta } from "@/lib/project-files/queries";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubProject, HubRole } from "@/types/database";

type ProjectHomeClientProps = {
  project: HubProject;
  role: HubRole;
  files: ProjectFileWithMeta[];
  projectCard: ProjectCardData;
  currentUserId: string;
};

export function ProjectHomeClient({
  project,
  role,
  files,
  projectCard,
  currentUserId,
}: ProjectHomeClientProps) {
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createCanvasOpen, setCreateCanvasOpen] = useState(false);
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] =
    useState<PendingProjectTemplate | null>(null);
  const [comingSoonTemplate, setComingSoonTemplate] =
    useState<PendingProjectTemplate | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [templatesForceVisible, setTemplatesForceVisible] = useState(false);
  const [favoriteForceVisible, setFavoriteForceVisible] = useState(false);
  const [shareOnboardingCard, setShareOnboardingCard] =
    useState<ProjectShareOnboardingCard | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [resumeToastOpen, setResumeToastOpen] = useState(false);
  const [activeOnboardingStep, setActiveOnboardingStep] =
    useState<ProjectIntroStep>("welcome");

  const createMenuRootRef = useRef<HTMLDivElement>(null);
  const templatesBannerRef = useRef<HTMLElement>(null);
  const favoriteButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const shareDialogRef = useRef<HTMLDialogElement>(null);

  const resetOnboardingUiState = useCallback(() => {
    setShareOpen(false);
    setCreateMenuOpen(false);
    setTemplatesForceVisible(false);
    setFavoriteForceVisible(false);
    setShareOnboardingCard(null);
  }, []);

  const maybeStartProjectOnboarding = useCallback(() => {
    if (readProjectOnboardingPhase(currentUserId, project.id) !== "intro") {
      return;
    }
    setShowOnboarding(true);
  }, [currentUserId, project.id]);

  const handleOnboardingStepChange = useCallback((step: ProjectIntroStep) => {
    setActiveOnboardingStep(step);
    setCreateMenuOpen(step === "create");
    setTemplatesForceVisible(step === "templates");
    setFavoriteForceVisible(step === "favorite");
    setShareOpen(step === "share");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    resetOnboardingUiState();
    setResumeToastOpen(false);
  }, [resetOnboardingUiState]);

  const handleOnboardingPause = useCallback(
    (step: ProjectIntroStep = activeOnboardingStep) => {
      writeProjectOnboardingStep(currentUserId, project.id, step);
      resetOnboardingUiState();
      setShowOnboarding(false);
      setResumeToastOpen(true);
    },
    [activeOnboardingStep, currentUserId, project.id, resetOnboardingUiState],
  );

  const handleResumeOnboarding = useCallback(() => {
    setResumeToastOpen(false);
    setShowOnboarding(true);
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    skipProjectOnboarding(currentUserId, project.id);
    resetOnboardingUiState();
    setShowOnboarding(false);
    setResumeToastOpen(false);
  }, [currentUserId, project.id, resetOnboardingUiState]);

  useEffect(() => {
    dispatchProjectNavigationEnd();
  }, []);

  useEffect(() => {
    function handleSimulateChanged(event: Event) {
      const simulate = (event as CustomEvent<{ simulate: boolean }>).detail.simulate;
      if (simulate) {
        resetOnboardingUiState();
        setResumeToastOpen(false);
        setShowOnboarding(true);
        return;
      }

      if (readProjectOnboardingPhase(currentUserId, project.id) !== "intro") {
        setShowOnboarding(false);
        resetOnboardingUiState();
        setResumeToastOpen(false);
      }
    }

    window.addEventListener(DEV_TOOLS_SIMULATE_CHANGED, handleSimulateChanged);
    return () => window.removeEventListener(DEV_TOOLS_SIMULATE_CHANGED, handleSimulateChanged);
  }, [currentUserId, project.id, resetOnboardingUiState]);

  useEffect(() => {
    if (readProjectOnboardingPhase(currentUserId, project.id) !== "intro") {
      return;
    }

    if (!shouldShowFeatureOnboarding(currentUserId)) {
      setShowOnboarding(true);
      return;
    }

    window.addEventListener(
      FEATURE_ONBOARDING_DISMISSED_EVENT,
      maybeStartProjectOnboarding,
    );

    return () => {
      window.removeEventListener(
        FEATURE_ONBOARDING_DISMISSED_EVENT,
        maybeStartProjectOnboarding,
      );
    };
  }, [currentUserId, maybeStartProjectOnboarding, project.id]);

  useEffect(() => {
    if (!showOnboarding) return;
    handleOnboardingStepChange("welcome");
  }, [handleOnboardingStepChange, showOnboarding]);

  function clearPendingTemplate() {
    setPendingTemplate(null);
  }

  function handleUseTemplate(templateId: ProjectTemplateId) {
    const template = getProjectTemplate(templateId);
    setPendingTemplate({ id: template.id, title: template.title });

    if (template.fileType === "canvas") {
      setCreateCanvasOpen(true);
      return;
    }

    setCreateBoardOpen(true);
  }

  function handleUnshippedTemplateCreated() {
    if (!pendingTemplate) return;
    setComingSoonTemplate(pendingTemplate);
    clearPendingTemplate();
  }

  return (
    <>
      <ProjectHome
        project={project}
        role={role}
        files={files}
        projectCard={projectCard}
        currentUserId={currentUserId}
        onCreateReviewBoard={() => {
          clearPendingTemplate();
          setCreateBoardOpen(true);
        }}
        onCreateCanvas={() => {
          clearPendingTemplate();
          setCreateCanvasOpen(true);
        }}
        onCreateTextDocument={() => {
          clearPendingTemplate();
          setCreateDocOpen(true);
        }}
        onUseTemplate={handleUseTemplate}
        onShare={() => setShareOpen(true)}
        createMenuOpen={createMenuOpen}
        onCreateMenuOpenChange={setCreateMenuOpen}
        createMenuRootRef={createMenuRootRef}
        createMenuLockOutsideClose={activeOnboardingStep === "create"}
        shareButtonRef={shareButtonRef}
        templatesBannerRef={templatesBannerRef}
        templatesForceVisible={templatesForceVisible}
        favoriteButtonRef={favoriteButtonRef}
        favoriteForceVisible={favoriteForceVisible}
      />
      <CreateReviewBoardDialog
        projectId={project.id}
        open={createBoardOpen}
        onClose={() => {
          setCreateBoardOpen(false);
          clearPendingTemplate();
        }}
        templateContext={pendingTemplate}
        onUnshippedTemplateCreated={handleUnshippedTemplateCreated}
      />
      <CreateCanvasDialog
        projectId={project.id}
        open={createCanvasOpen}
        onClose={() => {
          setCreateCanvasOpen(false);
          clearPendingTemplate();
        }}
        templateContext={pendingTemplate}
        onUnshippedTemplateCreated={handleUnshippedTemplateCreated}
      />
      <CreateTextDocumentDialog
        projectId={project.id}
        open={createDocOpen}
        onClose={() => setCreateDocOpen(false)}
      />
      <TemplateComingSoonDialog
        template={comingSoonTemplate}
        onClose={() => setComingSoonTemplate(null)}
      />
      <InviteMembersDialog
        project={shareOpen ? projectCard : null}
        currentUserId={currentUserId}
        onClose={() => setShareOpen(false)}
        panelRef={shareDialogRef}
        blockBackdropClose={shareOnboardingCard !== null}
        onShareOnboardingPause={() => handleOnboardingPause("share")}
      />
      <ProjectShareOnboardingCardOverlay
        card={shareOnboardingCard}
        dialogRef={shareDialogRef}
      />
      {showOnboarding && (
        <ProjectOnboarding
          userId={currentUserId}
          projectId={project.id}
          hasFiles={files.length > 0}
          targets={{
            createMenuRoot: createMenuRootRef,
            templatesBanner: templatesBannerRef,
            favoriteButton: favoriteButtonRef,
            shareButton: shareButtonRef,
          }}
          onStepChange={handleOnboardingStepChange}
          onShareStepCardChange={setShareOnboardingCard}
          onComplete={handleOnboardingComplete}
          onPause={handleOnboardingPause}
        />
      )}
      <ProjectOnboardingResumeToast
        open={resumeToastOpen}
        onResume={handleResumeOnboarding}
        onDismiss={handleDismissOnboarding}
      />
    </>
  );
}
