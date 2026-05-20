'use client';

import { useAppStore } from '@/store/appStore';
import { TCore3D } from '@/components/t-core/TCore3D';
import { TRadialMenu } from '@/components/radial-menu/TRadialMenu';
import { ResponseLayer } from '@/components/responses/ResponseLayer';
import { StageFeedbackLayer } from '@/components/stage/StageFeedbackLayer';
import type { ResponseNode } from '@/types/app.types';

interface ExperienceStageProps {
  responses: ResponseNode[];
  userMessages: { id: string; content: string }[];
  isStreaming: boolean;
  streamingText: string;
  voiceStreamingText: string;
  onClose: () => void;
}

export function ExperienceStage({
  responses,
  userMessages,
  isStreaming,
  streamingText,
  voiceStreamingText,
  onClose,
}: ExperienceStageProps) {
  const setTState = useAppStore((s) => s.setTState);
  const setRadialOpen = useAppStore((s) => s.setRadialOpen);
  const tState = useAppStore((s) => s.tState);
  const hasContent = responses.length > 0 || isStreaming || voiceStreamingText.length > 0;

  const handleHoverStart = () => {
    if (tState === 'idle' || tState === 'stable') setTState('hover');
    setRadialOpen(true);
  };

  const handleHoverEnd = () => {
    if (tState === 'hover') setTState('idle');
  };

  const handleHoldStart = () => {
    setRadialOpen(true);
  };

  return (
    <div className="experience-stage">
      {/* Feedback layer: particles + pulse rings behind the T */}
      <StageFeedbackLayer />

      {/* T + radial anchored at center */}
      <div className="t-anchor">
        <TCore3D
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          onHoldStart={handleHoldStart}
        />
        <TRadialMenu />
      </div>

      {/* Chat panel overlaid when there is content */}
      {hasContent && (
        <div className="response-zone">
          <ResponseLayer
            responses={responses}
            userMessages={userMessages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            voiceStreamingText={voiceStreamingText}
            onClose={onClose}
          />
        </div>
      )}

      <style jsx>{`
        .experience-stage {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
          overflow: visible;
          z-index: 1;
        }
        .t-anchor {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .response-zone {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(680px, 90vw);
          z-index: 20;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
