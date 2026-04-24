import type { RadialItem } from '@/types/app.types';

export const RADIAL_ITEMS: RadialItem[] = [
  {
    id: 'hubs',
    label: 'Negócios e Inovação',
    description: 'Empresas, startups e ecossistema de inovação',
  },
  {
    id: 'estrutura',
    label: 'P&D e Design',
    description: 'Pesquisa, desenvolvimento e design aplicado',
  },
  {
    id: 'programas',
    label: 'Talentos e Futuros',
    description: 'Formação, aceleração e desenvolvimento de pessoas',
  },
  {
    id: 'sobre',
    label: 'Conexões e\nExperiências',
    description: 'Parcerias, eventos e vivências no parque',
  },
];

// Ângulo inicial para o primeiro item (graus, sentido horário a partir do topo)
export const RADIAL_START_ANGLE = -90;
