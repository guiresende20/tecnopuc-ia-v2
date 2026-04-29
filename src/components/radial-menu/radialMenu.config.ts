import type { HubId } from '@/types/app.types';

// Apenas a ordem fixa dos hubs no menu radial — labels e descrições vêm do
// dicionário i18n em runtime via useT().
export const RADIAL_ITEMS: { id: HubId }[] = [
  { id: 'hubs' },
  { id: 'estrutura' },
  { id: 'programas' },
  { id: 'sobre' },
];

// Ângulo inicial para o primeiro item (graus, sentido horário a partir do topo)
export const RADIAL_START_ANGLE = -90;
