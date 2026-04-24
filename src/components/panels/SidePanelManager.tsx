'use client';

import { useAppStore } from '@/store/appStore';
import { HubPanel } from './HubPanel';
import { AudioSettingsPanel } from './AudioSettingsPanel';

export function SidePanelManager() {
  const panels = useAppStore((s) => s.panels);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const closeAllPanels = useAppStore((s) => s.closeAllPanels);

  // Apenas um painel aberto por vez
  const closeHub = () => togglePanel('hub');
  const closeAudio = () => togglePanel('audioSettings');

  return (
    <>
      <HubPanel isOpen={panels.hub} onClose={closeHub} />
      <AudioSettingsPanel isOpen={panels.audioSettings} onClose={closeAudio} />
    </>
  );
}
