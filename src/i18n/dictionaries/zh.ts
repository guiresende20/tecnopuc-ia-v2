import type { Dictionary } from './pt';

export const zh: Dictionary = {
  header: {
    brandSub: '科技园 · PUCRS',
    clearConversation: '清除对话',
    enableVoice: '开启语音',
    muteVoice: '静音',
  },
  status: {
    idle:        '助手就绪',
    hover:       '助手就绪',
    listening:   '正在聆听...',
    processing:  '处理中...',
    responding:  '回复中...',
    speaking:    '正在说话...',
    stable:      '助手就绪',
    uncertainty: '等待中...',
    error:       '错误',
  },
  languageSwitcher: {
    label: '语言',
  },
  input: {
    placeholder: '咨询关于 TecnoPUC...',
    placeholderVoiceActive: '语音模式已开启 — 请对着麦克风讲话...',
    fieldAriaLabel: '消息输入框',
    sendAriaLabel: '发送消息',
    stopTitle: '停止',
    stopAriaLabel: '停止生成',
    micActivateTitle: '开始语音对话',
    micDeactivateTitle: '结束语音对话',
    micActivateAriaLabel: '开启语音',
    micDeactivateAriaLabel: '结束语音',
    voiceConnecting: '连接中...',
    voiceConnected:  '已连接',
    voiceListening:  '聆听中...',
    voiceSpeaking:   '说话中...',
    voiceError:      '语音错误',
    interrupt: '打断',
    interruptTitle: '打断说话',
    interruptAriaLabel: '打断助手说话',
  },
  suggestions: {
    items: [
      '什么是 TecnoPUC？',
      '有哪些枢纽？',
      '如何参与？',
    ],
  },
  response: {
    assistantBadge: 'TecnoPUC 助手',
    copyAnswerTitle: '复制回复',
    copyConversationTitle: '复制对话',
    closeTitle: '关闭',
    copy: '复制',
    copied: '已复制',
    viaCommunity: '来自社区',
    userPrefix: '你',
    assistantPrefix: '助手',
    genericError: '抱歉，发生错误。请再试一次。',
  },
  toasts: {
    voiceTurnError: '语音对话出错。请再试一次。',
    voiceStartError: '无法启动语音模式。请检查您的网络连接。',
    chatError: '获取回复失败。请再试一次。',
  },
  contribuir: {
    buttonLabel: '贡献',
    buttonAriaLabel: '贡献知识库内容',
    layerTitle: '贡献知识库',
    layerIntro:
      '分享您所了解的 TecnoPUC 信息。每次贡献都需要邮箱验证及管理员审核后才会被纳入知识库。',
    closeTitle: '关闭 (Esc)',
    contentLabel: '您的贡献',
    contentPlaceholder:
      '分享有关 TecnoPUC 的信息 — 一家公司、一项活动、项目或重要事实...',
    minCharsWarning: (remaining, min) =>
      `至少需要 ${min} 个字符（还差 ${remaining} 个）。`,
    emailLabel: '电子邮件',
    emailPlaceholder: 'you@example.com',
    emailHint: '仅用于确认贡献。',
    categoryLabel: '类别',
    categoryOptional: '（可选）',
    categoryPlaceholder: '公司、活动、项目...',
    submit: '提交贡献',
    submitting: '提交中...',
    success:
      '完成！请查收邮件以确认贡献（链接 1 小时内有效）。',
    errorGeneric:
      '现在无法发送。请稍后再试。',
    errorConnection: '连接错误。请再试一次。',
    requiredMark: '*',
  },
  cookieBanner: {
    ariaLabel: 'Cookie 通知',
    title: '分析 Cookie',
    body:
      '我们使用 Google Analytics 了解助手的使用情况以改进体验。若您拒绝，助手仍可正常使用，仅停止收集匿名使用数据。您的选择将保存在此浏览器中。',
    accept: '接受',
    decline: '拒绝',
  },
  radial: {
    ariaLabel: '导航菜单',
    hubs: {
      label: '商业与创新',
      description: '企业、初创公司及创新生态系统',
    },
    estrutura: {
      label: '研发与设计',
      description: '研究、开发及应用设计',
    },
    programas: {
      label: '人才与未来',
      description: '培训、加速与人才发展',
    },
    sobre: {
      label: '连接与\n体验',
      description: '合作、活动与园区体验',
    },
  },
  hub: {
    hubs: {
      title: '商业与创新',
      description:
        '我们助力从初创公司到跨国企业的发展，服务于私营和公共部门。',
      cta: '了解枢纽',
      items: [
        { name: '健康枢纽', detail: '应用于健康、诊断和福祉的技术。' },
        { name: '能源枢纽', detail: '可持续、可再生的解决方案与能源效率。' },
        { name: '城市枢纽', detail: '出行、城市基础设施与智慧城市。' },
        { name: '农业枢纽', detail: '农业科技、农业生物技术与产业链。' },
        { name: '工业 4.0 枢纽', detail: '自动化、物联网、机器人与先进制造。' },
        { name: '信息通信枢纽', detail: '软件、人工智能与数字化转型。' },
      ],
    },
    estrutura: {
      title: '研发与设计',
      description:
        '我们为市场需求开发解决方案，依托 PUCRS 的各类设施及其它知识与研究领域的支持。',
      cta: '查看基础设施',
      items: [
        { name: 'Techpark 大楼', detail: '设有办公室和企业楼层的写字楼。' },
        { name: '实验室', detail: '配备齐全的应用研究与研发空间。' },
        { name: '礼堂', detail: '可承办大型活动与会议。' },
        { name: '协作空间', detail: '会议室、共享办公及休憩区。' },
        { name: '数据中心', detail: '高可用、高安全的基础设施。' },
        { name: '绿地', detail: '与校园融为一体的花园和交流空间。' },
      ],
    },
    programas: {
      title: '人才与未来',
      description:
        '人是创新的核心。在这里，我们培养创业、创新、科技与创意人才。',
      cta: '查看项目',
      items: [
        { name: '入驻', detail: '企业在园区内的常驻安置。' },
        { name: '加速', detail: '为初创企业提供导师、人脉与资源。' },
        { name: 'Soft Landing', detail: '帮助外国企业便捷进入巴西。' },
        { name: '学术衍生企业', detail: '帮助大学研究成果转化为商业。' },
        { name: '锚定项目', detail: '面向作为生态锚点的大型企业的模式。' },
      ],
    },
    sobre: {
      title: '连接与体验',
      description:
        '我们在全球社区成员与合作伙伴之间创建连接与体验，专注于商机的产生。',
      cta: '了解更多',
      items: [
        { name: '使命', detail: '促进创新、知识与可持续发展。' },
        { name: '成立', detail: '2003 年由 PUCRS 联合企业与政府发起。' },
        { name: '社区', detail: '生态系统中超过 300 家企业、10,000 人。' },
        { name: '认可', detail: '获国际科技园协会（IASP）认证。' },
        { name: '位置', detail: 'PUCRS 校区，巴西南里奥格兰德州阿雷格里港。' },
      ],
    },
  },
};
