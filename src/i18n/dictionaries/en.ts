import type { Dictionary } from './pt';

export const en: Dictionary = {
  header: {
    brandSub: 'Technology Park · PUCRS',
    clearConversation: 'Clear conversation',
    enableVoice: 'Unmute voice',
    muteVoice: 'Mute voice',
  },
  status: {
    idle:        'Assistant ready',
    hover:       'Assistant ready',
    listening:   'Listening...',
    processing:  'Processing...',
    responding:  'Responding...',
    speaking:    'Speaking...',
    stable:      'Assistant ready',
    uncertainty: 'Waiting...',
    error:       'Error',
  },
  languageSwitcher: {
    label: 'Language',
  },
  input: {
    placeholder: 'Ask about TecnoPUC...',
    placeholderVoiceActive: 'Voice mode active — speak into the microphone...',
    fieldAriaLabel: 'Message field',
    sendAriaLabel: 'Send message',
    stopTitle: 'Stop',
    stopAriaLabel: 'Stop generation',
    micActivateTitle: 'Start voice conversation',
    micDeactivateTitle: 'End voice conversation',
    micActivateAriaLabel: 'Activate voice',
    micDeactivateAriaLabel: 'End voice',
    voiceConnecting: 'Connecting...',
    voiceConnected:  'Connected',
    voiceListening:  'Listening...',
    voiceSpeaking:   'Speaking...',
    voiceError:      'Voice error',
    interrupt: 'Interrupt',
    interruptTitle: 'Interrupt speech',
    interruptAriaLabel: 'Interrupt assistant speech',
  },
  suggestions: {
    items: [
      'What is TecnoPUC?',
      'What are the hubs?',
      'How can I take part?',
    ],
  },
  response: {
    assistantBadge: 'TecnoPUC Assistant',
    copyAnswerTitle: 'Copy answer',
    copyConversationTitle: 'Copy conversation',
    closeTitle: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    viaCommunity: 'via community',
    userPrefix: 'You',
    assistantPrefix: 'Assistant',
    genericError: 'Sorry, something went wrong. Please try again.',
  },
  toasts: {
    voiceTurnError: 'Voice conversation error. Please try again.',
    voiceStartError: 'Could not start voice mode. Check your connection.',
    chatError: 'Error fetching reply. Please try again.',
  },
  contribuir: {
    buttonLabel: 'Contribute',
    buttonAriaLabel: 'Contribute to the knowledge base',
    layerTitle: 'Contribute to the knowledge base',
    layerIntro:
      'Share knowledge about TecnoPUC. Every contribution goes through email validation and admin review before entering the knowledge base.',
    closeTitle: 'Close (Esc)',
    contentLabel: 'Your contribution',
    contentPlaceholder:
      'Share knowledge about TecnoPUC — a company, event, program, relevant fact...',
    minCharsWarning: (remaining, min) =>
      `Minimum of ${min} characters (${remaining} remaining).`,
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    emailHint: 'Used only to confirm the contribution.',
    categoryLabel: 'Category',
    categoryOptional: '(optional)',
    categoryPlaceholder: 'Company, event, program...',
    submit: 'Send contribution',
    submitting: 'Sending...',
    success:
      "Done! Check your email to confirm the contribution (link valid for 1h).",
    errorGeneric:
      'Could not send right now. Please try again shortly.',
    errorConnection: 'Connection error. Please try again.',
    requiredMark: '*',
  },
  cookieBanner: {
    ariaLabel: 'Cookie notice',
    title: 'Analytics cookies',
    body:
      'We use Google Analytics to understand how the assistant is used and improve the experience. If you decline, the assistant keeps working normally — we just stop collecting anonymous usage data. Your choice is saved in this browser.',
    accept: 'Accept',
    decline: 'Decline',
  },
  radial: {
    ariaLabel: 'Navigation menu',
    hubs: {
      label: 'Business & Innovation',
      description: 'Companies, startups and innovation ecosystem',
    },
    estrutura: {
      label: 'R&D & Design',
      description: 'Research, development and applied design',
    },
    programas: {
      label: 'Talents & Futures',
      description: 'Training, acceleration and people development',
    },
    sobre: {
      label: 'Connections &\nExperiences',
      description: 'Partnerships, events and experiences in the park',
    },
  },
  hub: {
    hubs: {
      title: 'Business & Innovation',
      description:
        'We support the development of startups to multinationals, working with private or public sectors.',
      cta: 'Explore the hubs',
      items: [
        { name: 'Health Hub', detail: 'Technology applied to health, diagnostics and well-being.' },
        { name: 'Energy Hub', detail: 'Sustainable, renewable solutions and energy efficiency.' },
        { name: 'Cities Hub', detail: 'Mobility, urban infrastructure and smart cities.' },
        { name: 'Agribusiness Hub', detail: 'Agtech, agricultural biotech and supply chain.' },
        { name: 'Industry 4.0 Hub', detail: 'Automation, IoT, robotics and advanced manufacturing.' },
        { name: 'ICT Hub', detail: 'Software, artificial intelligence and digital transformation.' },
      ],
    },
    estrutura: {
      title: 'R&D & Design',
      description:
        "We develop solutions for market demand, supported by PUCRS's structures and other areas of knowledge and research.",
      cta: 'See infrastructure',
      items: [
        { name: 'Techpark Building', detail: 'Office tower with corporate rooms and floors.' },
        { name: 'Labs', detail: 'Spaces equipped for applied research and R&D.' },
        { name: 'Auditoriums', detail: 'Capacity for large events and conferences.' },
        { name: 'Collaborative spaces', detail: 'Meeting rooms, coworking and breakout areas.' },
        { name: 'Datacenter', detail: 'High-availability and high-security infrastructure.' },
        { name: 'Green area', detail: 'Gardens and social spaces integrated with the campus.' },
      ],
    },
    programas: {
      title: 'Talents & Futures',
      description:
        'People are at the heart of innovation. Here we develop talent in entrepreneurship, innovation, technology and creativity.',
      cta: 'See programs',
      items: [
        { name: 'Residency', detail: 'Permanent installation of companies in the park.' },
        { name: 'Acceleration', detail: 'Mentoring, connections and access to resources for startups.' },
        { name: 'Soft Landing', detail: 'Easy entry for foreign companies into Brazil.' },
        { name: 'Academic Spin-off', detail: 'Support to turn university research into business.' },
        { name: 'Anchor Program', detail: 'Model for large companies acting as ecosystem anchors.' },
      ],
    },
    sobre: {
      title: 'Connections & Experiences',
      description:
        'We create connections and experiences among members and partners of our global community, focused on generating business.',
      cta: 'Learn more',
      items: [
        { name: 'Mission', detail: 'Promote innovation, knowledge and sustainable development.' },
        { name: 'Founded', detail: 'Created in 2003 as a PUCRS initiative with companies and government.' },
        { name: 'Community', detail: 'Over 300 companies and 10,000 people in the ecosystem.' },
        { name: 'Recognition', detail: 'Certified by IASP (International Association of Science Parks).' },
        { name: 'Location', detail: 'PUCRS Campus, Porto Alegre — RS, Brazil.' },
      ],
    },
  },
};
