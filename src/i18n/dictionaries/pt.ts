export interface HubContent {
  title: string;
  description: string;
  cta: string;
  items: { name: string; detail: string }[];
}

export interface Dictionary {
  header: {
    brandSub: string;
    clearConversation: string;
    enableVoice: string;
    muteVoice: string;
  };
  status: {
    idle: string;
    hover: string;
    listening: string;
    processing: string;
    responding: string;
    speaking: string;
    stable: string;
    uncertainty: string;
    error: string;
  };
  languageSwitcher: {
    label: string;
  };
  input: {
    placeholder: string;
    placeholderVoiceActive: string;
    fieldAriaLabel: string;
    sendAriaLabel: string;
    stopTitle: string;
    stopAriaLabel: string;
    micActivateTitle: string;
    micDeactivateTitle: string;
    micActivateAriaLabel: string;
    micDeactivateAriaLabel: string;
    voiceConnecting: string;
    voiceConnected: string;
    voiceListening: string;
    voiceSpeaking: string;
    voiceError: string;
    interrupt: string;
    interruptTitle: string;
    interruptAriaLabel: string;
  };
  suggestions: {
    items: string[];
  };
  response: {
    assistantBadge: string;
    copyAnswerTitle: string;
    copyConversationTitle: string;
    closeTitle: string;
    copy: string;
    copied: string;
    viaCommunity: string;
    userPrefix: string;
    assistantPrefix: string;
    genericError: string;
  };
  toasts: {
    voiceTurnError: string;
    voiceStartError: string;
    chatError: string;
  };
  contribuir: {
    buttonLabel: string;
    buttonAriaLabel: string;
    layerTitle: string;
    layerIntro: string;
    closeTitle: string;
    contentLabel: string;
    contentPlaceholder: string;
    minCharsWarning: (remaining: number, min: number) => string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHint: string;
    categoryLabel: string;
    categoryOptional: string;
    categoryPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    errorGeneric: string;
    errorConnection: string;
    requiredMark: string;
  };
  cookieBanner: {
    ariaLabel: string;
    title: string;
    body: string;
    accept: string;
    decline: string;
  };
  radial: {
    ariaLabel: string;
    hubs: { label: string; description: string };
    estrutura: { label: string; description: string };
    programas: { label: string; description: string };
    sobre: { label: string; description: string };
  };
  hub: {
    hubs: HubContent;
    estrutura: HubContent;
    programas: HubContent;
    sobre: HubContent;
  };
}

export const pt: Dictionary = {
  header: {
    brandSub: 'Parque Tecnológico · PUCRS',
    clearConversation: 'Limpar conversa',
    enableVoice: 'Ativar voz',
    muteVoice: 'Silenciar voz',
  },
  status: {
    idle:        'Assistente pronto',
    hover:       'Assistente pronto',
    listening:   'Ouvindo...',
    processing:  'Processando...',
    responding:  'Respondendo...',
    speaking:    'Falando...',
    stable:      'Assistente pronto',
    uncertainty: 'Aguardando...',
    error:       'Erro',
  },
  languageSwitcher: {
    label: 'Idioma',
  },
  input: {
    placeholder: 'Pergunte sobre o TecnoPUC...',
    placeholderVoiceActive: 'Modo voz ativo — fale ao microfone...',
    fieldAriaLabel: 'Campo de mensagem',
    sendAriaLabel: 'Enviar mensagem',
    stopTitle: 'Interromper',
    stopAriaLabel: 'Parar geração',
    micActivateTitle: 'Iniciar conversa por voz',
    micDeactivateTitle: 'Encerrar conversa por voz',
    micActivateAriaLabel: 'Ativar voz',
    micDeactivateAriaLabel: 'Encerrar voz',
    voiceConnecting: 'Conectando...',
    voiceConnected:  'Conectado',
    voiceListening:  'Ouvindo...',
    voiceSpeaking:   'Falando...',
    voiceError:      'Erro de voz',
    interrupt: 'Interromper',
    interruptTitle: 'Interromper fala',
    interruptAriaLabel: 'Interromper fala do assistente',
  },
  suggestions: {
    items: [
      'O que é o TecnoPUC?',
      'Quais são os hubs?',
      'Como participar?',
    ],
  },
  response: {
    assistantBadge: 'Assistente TecnoPUC',
    copyAnswerTitle: 'Copiar resposta',
    copyConversationTitle: 'Copiar conversa',
    closeTitle: 'Fechar',
    copy: 'Copiar',
    copied: 'Copiado',
    viaCommunity: 'via comunidade',
    userPrefix: 'Você',
    assistantPrefix: 'Assistente',
    genericError: 'Desculpe, ocorreu um erro. Tente novamente.',
  },
  toasts: {
    voiceTurnError: 'Erro na conversa por voz. Tente novamente.',
    voiceStartError: 'Não foi possível iniciar o modo voz. Verifique sua conexão.',
    chatError: 'Erro ao buscar resposta. Tente novamente.',
  },
  contribuir: {
    buttonLabel: 'Contribuir',
    buttonAriaLabel: 'Contribuir com a base',
    layerTitle: 'Contribuir com a base',
    layerIntro:
      'Compartilhe um conhecimento sobre o TecnoPUC. Toda contribuição passa por validação de e-mail e revisão de um administrador antes de entrar na base de conhecimento.',
    closeTitle: 'Fechar (Esc)',
    contentLabel: 'Sua contribuição',
    contentPlaceholder:
      'Compartilhe um conhecimento sobre o TecnoPUC — uma empresa, evento, programa, fato relevante...',
    minCharsWarning: (remaining, min) =>
      `Mínimo de ${min} caracteres (${remaining} restantes).`,
    emailLabel: 'E-mail',
    emailPlaceholder: 'voce@exemplo.com',
    emailHint: 'Usado apenas para confirmar a contribuição.',
    categoryLabel: 'Categoria',
    categoryOptional: '(opcional)',
    categoryPlaceholder: 'Empresa, evento, programa...',
    submit: 'Enviar contribuição',
    submitting: 'Enviando...',
    success:
      'Pronto! Verifique seu e-mail para confirmar a contribuição (link válido por 1h).',
    errorGeneric:
      'Não foi possível enviar agora. Tente novamente em instantes.',
    errorConnection: 'Erro de conexão. Tente novamente.',
    requiredMark: '*',
  },
  cookieBanner: {
    ariaLabel: 'Aviso de cookies',
    title: 'Cookies analíticos',
    body:
      'Usamos Google Analytics para entender como o assistente é utilizado e melhorar a experiência. Ao recusar, o assistente continua funcionando normalmente — apenas deixaremos de coletar dados anônimos de uso. Sua escolha fica salva neste navegador.',
    accept: 'Aceitar',
    decline: 'Recusar',
  },
  radial: {
    ariaLabel: 'Menu de navegação',
    hubs: {
      label: 'Negócios e Inovação',
      description: 'Empresas, startups e ecossistema de inovação',
    },
    estrutura: {
      label: 'P&D e Design',
      description: 'Pesquisa, desenvolvimento e design aplicado',
    },
    programas: {
      label: 'Talentos e Futuros',
      description: 'Formação, aceleração e desenvolvimento de pessoas',
    },
    sobre: {
      label: 'Conexões e\nExperiências',
      description: 'Parcerias, eventos e vivências no parque',
    },
  },
  hub: {
    hubs: {
      title: 'Negócios e Inovação',
      description:
        'Contribuímos para o desenvolvimento de startups a multinacionais, com atuação nos setores privado ou público.',
      cta: 'Conheça os hubs',
      items: [
        { name: 'Hub de Saúde', detail: 'Tecnologia aplicada à saúde, diagnóstico e bem-estar.' },
        { name: 'Hub de Energia', detail: 'Soluções sustentáveis, renováveis e eficiência energética.' },
        { name: 'Hub de Cidades', detail: 'Mobilidade, infraestrutura urbana e smart cities.' },
        { name: 'Hub de Agronegócio', detail: 'Agtech, biotecnologia agrícola e cadeia produtiva.' },
        { name: 'Hub de Indústria 4.0', detail: 'Automação, IoT, robótica e manufatura avançada.' },
        { name: 'Hub de TIC', detail: 'Software, inteligência artificial e transformação digital.' },
      ],
    },
    estrutura: {
      title: 'P&D e Design',
      description:
        'Desenvolvemos soluções para as demandas do mercado, com o suporte de estruturas e demais áreas de conhecimento e pesquisa da PUCRS.',
      cta: 'Ver infraestrutura',
      items: [
        { name: 'Techpark Building', detail: 'Torre de escritórios com salas e andares corporativos.' },
        { name: 'Laboratórios', detail: 'Espaços equipados para pesquisa aplicada e P&D.' },
        { name: 'Auditórios', detail: 'Capacidade para grandes eventos e conferências.' },
        { name: 'Espaços colaborativos', detail: 'Salas de reunião, coworking e áreas de descompressão.' },
        { name: 'Datacenter', detail: 'Infraestrutura de alta disponibilidade e segurança.' },
        { name: 'Área verde', detail: 'Jardins e espaços de convivência integrados ao campus.' },
      ],
    },
    programas: {
      title: 'Talentos e Futuros',
      description:
        'Pessoas são o centro da inovação. Por aqui, desenvolvemos talentos em empreendedorismo, inovação, tecnologia e criatividade.',
      cta: 'Ver programas',
      items: [
        { name: 'Residência', detail: 'Instalação permanente de empresas no parque.' },
        { name: 'Aceleração', detail: 'Mentorias, conexões e acesso a recursos para startups.' },
        { name: 'Soft Landing', detail: 'Entrada facilitada para empresas estrangeiras no Brasil.' },
        { name: 'Spin-off Acadêmico', detail: 'Suporte para transformar pesquisa universitária em negócio.' },
        { name: 'Programa Âncora', detail: 'Modelo para grandes empresas que atuam como âncoras de ecossistema.' },
      ],
    },
    sobre: {
      title: 'Conexões & Experiências',
      description:
        'Geramos conexões e experiências entre os membros e parceiros da nossa comunidade global, com foco na geração de negócios.',
      cta: 'Saiba mais',
      items: [
        { name: 'Missão', detail: 'Promover inovação, conhecimento e desenvolvimento sustentável.' },
        { name: 'Fundação', detail: 'Criado em 2003 como iniciativa da PUCRS em parceria com empresas e governo.' },
        { name: 'Comunidade', detail: 'Mais de 300 empresas e 10.000 pessoas no ecossistema.' },
        { name: 'Reconhecimento', detail: 'Certificado pela IASP (International Association of Science Parks).' },
        { name: 'Localização', detail: 'Campus da PUCRS, Porto Alegre — RS, Brasil.' },
      ],
    },
  },
};
