import type { Dictionary } from './pt';

export const es: Dictionary = {
  header: {
    brandSub: 'Parque Tecnológico · PUCRS',
    clearConversation: 'Borrar conversación',
    enableVoice: 'Activar voz',
    muteVoice: 'Silenciar voz',
  },
  status: {
    idle:        'Asistente listo',
    hover:       'Asistente listo',
    listening:   'Escuchando...',
    processing:  'Procesando...',
    responding:  'Respondiendo...',
    speaking:    'Hablando...',
    stable:      'Asistente listo',
    uncertainty: 'Esperando...',
    error:       'Error',
  },
  languageSwitcher: {
    label: 'Idioma',
  },
  input: {
    placeholder: 'Pregunta sobre TecnoPUC...',
    placeholderVoiceActive: 'Modo voz activo — habla al micrófono...',
    fieldAriaLabel: 'Campo de mensaje',
    sendAriaLabel: 'Enviar mensaje',
    stopTitle: 'Detener',
    stopAriaLabel: 'Detener generación',
    micActivateTitle: 'Iniciar conversación por voz',
    micDeactivateTitle: 'Finalizar conversación por voz',
    micActivateAriaLabel: 'Activar voz',
    micDeactivateAriaLabel: 'Finalizar voz',
    voiceConnecting: 'Conectando...',
    voiceConnected:  'Conectado',
    voiceListening:  'Escuchando...',
    voiceSpeaking:   'Hablando...',
    voiceError:      'Error de voz',
    interrupt: 'Interrumpir',
    interruptTitle: 'Interrumpir habla',
    interruptAriaLabel: 'Interrumpir habla del asistente',
  },
  suggestions: {
    items: [
      '¿Qué es TecnoPUC?',
      '¿Cuáles son los hubs?',
      '¿Cómo participar?',
    ],
  },
  response: {
    assistantBadge: 'Asistente TecnoPUC',
    copyAnswerTitle: 'Copiar respuesta',
    copyConversationTitle: 'Copiar conversación',
    closeTitle: 'Cerrar',
    copy: 'Copiar',
    copied: 'Copiado',
    viaCommunity: 'vía comunidad',
    userPrefix: 'Tú',
    assistantPrefix: 'Asistente',
    genericError: 'Lo sentimos, ocurrió un error. Inténtalo de nuevo.',
  },
  toasts: {
    voiceTurnError: 'Error en la conversación por voz. Inténtalo de nuevo.',
    voiceStartError: 'No se pudo iniciar el modo voz. Comprueba tu conexión.',
    chatError: 'Error al obtener la respuesta. Inténtalo de nuevo.',
  },
  contribuir: {
    buttonLabel: 'Contribuir',
    buttonAriaLabel: 'Contribuir a la base de conocimiento',
    layerTitle: 'Contribuir a la base',
    layerIntro:
      'Comparte conocimiento sobre TecnoPUC. Cada contribución pasa por validación de e-mail y revisión de un administrador antes de entrar en la base.',
    closeTitle: 'Cerrar (Esc)',
    contentLabel: 'Tu contribución',
    contentPlaceholder:
      'Comparte conocimiento sobre TecnoPUC — una empresa, evento, programa, hecho relevante...',
    minCharsWarning: (remaining, min) =>
      `Mínimo de ${min} caracteres (${remaining} restantes).`,
    emailLabel: 'E-mail',
    emailPlaceholder: 'tu@ejemplo.com',
    emailHint: 'Solo se usa para confirmar la contribución.',
    categoryLabel: 'Categoría',
    categoryOptional: '(opcional)',
    categoryPlaceholder: 'Empresa, evento, programa...',
    submit: 'Enviar contribución',
    submitting: 'Enviando...',
    success:
      '¡Listo! Revisa tu e-mail para confirmar la contribución (enlace válido por 1h).',
    errorGeneric:
      'No se pudo enviar ahora. Inténtalo de nuevo en un instante.',
    errorConnection: 'Error de conexión. Inténtalo de nuevo.',
    requiredMark: '*',
  },
  cookieBanner: {
    ariaLabel: 'Aviso de cookies',
    title: 'Cookies analíticas',
    body:
      'Usamos Google Analytics para entender cómo se utiliza el asistente y mejorar la experiencia. Si rechazas, el asistente sigue funcionando normalmente — solo dejaremos de recopilar datos anónimos de uso. Tu elección queda guardada en este navegador.',
    accept: 'Aceptar',
    decline: 'Rechazar',
  },
  radial: {
    ariaLabel: 'Menú de navegación',
    hubs: {
      label: 'Negocios e Innovación',
      description: 'Empresas, startups y ecosistema de innovación',
    },
    estrutura: {
      label: 'I+D y Diseño',
      description: 'Investigación, desarrollo y diseño aplicado',
    },
    programas: {
      label: 'Talentos y Futuros',
      description: 'Formación, aceleración y desarrollo de personas',
    },
    sobre: {
      label: 'Conexiones y\nExperiencias',
      description: 'Alianzas, eventos y vivencias en el parque',
    },
  },
  hub: {
    hubs: {
      title: 'Negocios e Innovación',
      description:
        'Contribuimos al desarrollo de startups a multinacionales, actuando en sectores privado o público.',
      cta: 'Conoce los hubs',
      items: [
        { name: 'Hub de Salud', detail: 'Tecnología aplicada a la salud, diagnóstico y bienestar.' },
        { name: 'Hub de Energía', detail: 'Soluciones sostenibles, renovables y eficiencia energética.' },
        { name: 'Hub de Ciudades', detail: 'Movilidad, infraestructura urbana y smart cities.' },
        { name: 'Hub de Agronegocio', detail: 'Agtech, biotecnología agrícola y cadena productiva.' },
        { name: 'Hub de Industria 4.0', detail: 'Automatización, IoT, robótica y manufactura avanzada.' },
        { name: 'Hub de TIC', detail: 'Software, inteligencia artificial y transformación digital.' },
      ],
    },
    estrutura: {
      title: 'I+D y Diseño',
      description:
        'Desarrollamos soluciones para las demandas del mercado, con el apoyo de las estructuras y áreas de conocimiento e investigación de PUCRS.',
      cta: 'Ver infraestructura',
      items: [
        { name: 'Techpark Building', detail: 'Torre de oficinas con salas y plantas corporativas.' },
        { name: 'Laboratorios', detail: 'Espacios equipados para investigación aplicada e I+D.' },
        { name: 'Auditorios', detail: 'Capacidad para grandes eventos y conferencias.' },
        { name: 'Espacios colaborativos', detail: 'Salas de reuniones, coworking y áreas de descompresión.' },
        { name: 'Datacenter', detail: 'Infraestructura de alta disponibilidad y seguridad.' },
        { name: 'Área verde', detail: 'Jardines y espacios de convivencia integrados al campus.' },
      ],
    },
    programas: {
      title: 'Talentos y Futuros',
      description:
        'Las personas son el centro de la innovación. Aquí desarrollamos talentos en emprendimiento, innovación, tecnología y creatividad.',
      cta: 'Ver programas',
      items: [
        { name: 'Residencia', detail: 'Instalación permanente de empresas en el parque.' },
        { name: 'Aceleración', detail: 'Mentorías, conexiones y acceso a recursos para startups.' },
        { name: 'Soft Landing', detail: 'Entrada facilitada para empresas extranjeras en Brasil.' },
        { name: 'Spin-off Académico', detail: 'Apoyo para transformar la investigación universitaria en negocio.' },
        { name: 'Programa Ancla', detail: 'Modelo para grandes empresas que actúan como anclas del ecosistema.' },
      ],
    },
    sobre: {
      title: 'Conexiones y Experiencias',
      description:
        'Generamos conexiones y experiencias entre los miembros y socios de nuestra comunidad global, con foco en la generación de negocios.',
      cta: 'Saber más',
      items: [
        { name: 'Misión', detail: 'Promover la innovación, el conocimiento y el desarrollo sostenible.' },
        { name: 'Fundación', detail: 'Creado en 2003 como iniciativa de PUCRS con empresas y gobierno.' },
        { name: 'Comunidad', detail: 'Más de 300 empresas y 10.000 personas en el ecosistema.' },
        { name: 'Reconocimiento', detail: 'Certificado por la IASP (International Association of Science Parks).' },
        { name: 'Ubicación', detail: 'Campus de PUCRS, Porto Alegre — RS, Brasil.' },
      ],
    },
  },
};
