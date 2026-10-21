import { ProjectItem } from '../types/experience';

export const CREATOR_PROFILE = {
  alias: 'LLEW',
  handle: 'LlewxamDev',
  fullName: 'Evandro Silva Amorim',
  role: 'Full-Stack Developer · Bot & Automation Engineer',
  education: 'Systems Analysis and Development (ADS) · Etec Zona Leste — Brazil',
  manifesto:
    'Full-Stack Developer focused on high-performance asynchronous architectures for Discord and WhatsApp bots, commercial workflow automation, real-time multiplayer RPG systems, and scalable web applications built with JavaScript/TypeScript, Python, and Rust.',
  coreStack: [
    {
      name: 'JavaScript / TypeScript',
      role: 'Primary language for bot engines, real-time event architectures, APIs, and interactive web applications.',
      pigment: '#ef0574',
    },
    {
      name: 'Python',
      role: 'Process automation, system integration scripts, data pipelines, and backend tooling.',
      pigment: '#1d889b',
    },
    {
      name: 'Node.js & Baileys',
      role: 'High-speed WhatsApp bot engineering via direct WebSocket connections (powering 1,400+ commands in Soul List).',
      pigment: '#bc2035',
    },
    {
      name: 'Discord.js & Bot Architecture',
      role: 'Automated sales ecosystems (LWX Lab) and full-scale MMORPG engines with guilds and boss raids (mmrpdis).',
      pigment: '#e168ab',
    },
    {
      name: 'React, Three.js & WebGL',
      role: 'Modern web applications, control dashboards, and high-performance interactive experiences.',
      pigment: '#2494a5',
    },
    {
      name: 'Rust & Systems Security',
      role: 'Static analysis engines, API defense, session security, and low-level benchmarks (AegisCore / AegisHub).',
      pigment: '#d57461',
    },
  ],
  services: [
    {
      id: 'custom-bots',
      title: 'Custom Discord & WhatsApp Bots',
      description:
        'End-to-end development of bespoke bots for commercial servers, communities, and businesses — from automated sales and ticket workflows to complete RPG engines and multi-category utility bots.',
      deliverables: [
        'Sales workflows, ticketing, quotes, and automated deliveries (like LWX Lab)',
        'RPG engines, economy systems, guilds, boss raids, and inventories (like mmrpdis)',
        'High-performance WhatsApp bots via Baileys with instant command execution (like Soul List)',
      ],
    },
    {
      id: 'automations',
      title: 'Workflow Automation & System Integrations',
      description:
        'Automation of operational tasks, database synchronization, webhooks, external APIs, and automated moderation powered by TypeScript and Python.',
      deliverables: [
        'Non-blocking asynchronous media and command queues',
        'Seamless bridges between Discord, WhatsApp, and web backends',
        'Resilient session management and automatic reconnection',
      ],
    },
    {
      id: 'bespoke-web',
      title: 'Full-Stack Web Development',
      description:
        'Development of custom websites, bot management dashboards, and full-stack web platforms engineered for speed, reliability, and security.',
      deliverables: [
        'React/TypeScript control panels integrated directly with your bots',
        'Secure APIs with session monitoring, auth, and risk scoring',
        'Bespoke, responsive, and high-performance web experiences',
      ],
    },
  ],
  links: {
    github: 'https://github.com/LlewxamDev',
    linkedin: 'https://www.linkedin.com/in/evandro-silva-amorimm',
    instagram: 'https://instagram.com/llewxam_editor',
    twitterX: 'https://x.com/maxvib3official',
    legacyPortfolio: 'https://llewxamdev.github.io/Portf-lio/',
  },
  openSourceHighlights: [
    {
      name: 'HackerPage (BreachRoom)',
      tech: 'Three.js / JavaScript',
      summary: 'Immersive 3D web experience exploring hacker history, cybersecurity incidents, and digital investigation.',
      url: 'https://github.com/LlewxamDev/HackerPage',
    },
    {
      name: 'AegisCore',
      tech: 'TypeScript & Rust',
      summary: 'Hybrid web-defense platform for studying authentication, session management, risk scoring, observability, and secure APIs.',
      url: 'https://github.com/LlewxamDev/AegisCore',
    },
    {
      name: 'Polybech',
      tech: 'Rust, C++, ASM, Python, TS',
      summary: 'Polyglot benchmark laboratory comparing algorithm performance across Rust, C++, Assembly, Java, Python, C#, and TypeScript.',
      url: 'https://github.com/LlewxamDev/Polybech',
    },
    {
      name: 'AegisHub',
      tech: 'Rust & React',
      summary: 'Security analyzer for GitHub repositories featuring a Rust scanning engine, CLI secret detection, risk scoring, and React dashboard.',
      url: 'https://github.com/LlewxamDev/AegisHub',
    },
  ],
};

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'lwx-lab',
    title: 'LWX Lab',
    subtitle: 'Official Bot for the LWX Design Sales Server (Discord)',
    platform: 'Discord',
    categoryBadge: 'DESIGN SALES AUTOMATION · WORKFLOW & TICKETS',
    description:
      'Official bot engineered for the LWX design sales server. Centralizes the entire commercial workflow on Discord: order creation and triage, client support tickets, portfolio and service showcases, designer queue management, and final asset delivery.',
    architectureNotes:
      'Built in JavaScript/TypeScript on top of Discord.js featuring modular command routing, interactive select menus, briefing modals, and real-time channel and role permission automation.',
    techStack: ['TypeScript', 'JavaScript', 'Node.js', 'Discord.js', 'Sales Automation'],
    videoUrl: '',
    posterUrl: '/assets/projects/lwx-lab-cover.png?v=2',
    isPlaceholderVideo: false,
    flipbookFps: 12,
    flipbookTotalFrames: 48,
    externalLinks: [
      {
        label: 'Invite LWX Lab Bot (Discord)',
        url: 'https://discord.com/oauth2/authorize?client_id=1493045988888285185',
      },
    ],
    compositionOffset: {
      rotateDeg: -1.2,
      marginTopPx: 0,
      inkAccentHex: '#ef0574',
      secondaryPigmentHex: '#1d889b',
    },
    stickers: [
      {
        id: 'lwx-sticker-1',
        label: 'LWX Order Management',
        caption: 'Automated ticket opening, client briefing collection, and order tracking inside the LWX server.',
        rotationDeg: -2.8,
        scale: 1,
        tapePosition: 'top-left',
        accentPigment: '#ef0574',
        previewType: 'discord-sales',
        highlights: ['Automated Order Triage', 'Design Service Catalogs', 'Client Role & Channel Automation'],
      },
      {
        id: 'lwx-sticker-2',
        label: 'Operations & Delivery Pipeline',
        caption: 'Production status tracking, sales logging, and streamlined final delivery for the LWX creative team.',
        rotationDeg: 2.2,
        scale: 0.97,
        tapePosition: 'corners',
        accentPigment: '#1d889b',
        previewType: 'architecture',
        highlights: ['Interactive Buttons & Modals', 'Order History & Audit Logs', 'Full Server Workflow Control'],
      },
    ],
    demoTerminalLines: [
      { command: '/lwx order create service:Brand_Identity', response: 'Order channel #lwx-409 opened · Client briefing logged for the design team.', accent: '#ef0574' },
      { command: '/lwx quote approve order:#409', response: 'Status updated to In Production · Assigned designer notified.', accent: '#2494a5' },
      { command: '/lwx delivery complete client:@client', response: 'Final files delivered · Client review logged & Verified Client role granted.', accent: '#ff9979' },
    ],
  },
  {
    id: 'mmrpdis',
    title: 'mmrpdis',
    subtitle: 'Full-Scale MMORPG Bot on Discord — Public Release Coming Soon',
    platform: 'Discord',
    categoryBadge: 'PUBLIC RELEASE COMING SOON · MMORPG ENGINE, GUILDS & BOSSES',
    description:
      'A complete MMORPG built natively inside Discord (Public Release Coming Soon!). Features a deep guild system, cooperative boss raids, weapon crafting and upgrades, inventory management, character classes, stat progression, and a persistent world economy.',
    architectureNotes:
      'Asynchronous RPG engine written in JavaScript/TypeScript handling turn-based combat math, loot rarity tables, concurrent multi-player boss raids, and persistent guild and player state. Currently in final polish for public release.',
    techStack: ['TypeScript', 'JavaScript', 'Node.js', 'Discord.js', 'MMORPG Engine', 'Coming Soon (Public)'],
    videoUrl: '',
    posterUrl: '/assets/projects/mmrpdis-cover.jpg',
    isPlaceholderVideo: false,
    flipbookFps: 14,
    flipbookTotalFrames: 56,
    externalLinks: [
      {
        label: 'Invite MMORPGDISC Bot (Discord — Coming Soon)',
        url: 'https://discord.com',
        unavailable: true,
      },
    ],
    compositionOffset: {
      rotateDeg: 1.1,
      marginTopPx: 24,
      inkAccentHex: '#bc2035',
      secondaryPigmentHex: '#2494a5',
    },
    stickers: [
      {
        id: 'mmrpdis-sticker-1',
        label: 'Boss Raids & Combat System',
        caption: 'Cooperative boss encounters with party mechanics, critical damage calculation, skills, and loot drops.',
        rotationDeg: 2.4,
        scale: 1.01,
        tapePosition: 'top-center',
        accentPigment: '#bc2035',
        previewType: 'mmorpg-battle',
        highlights: ['Multi-Phase Boss Raids', 'Weapon Rarity & Stat Scaling', 'Real-Time Turn Combat on Discord'],
      },
      {
        id: 'mmrpdis-sticker-2',
        label: 'Guilds, Forging & Inventory',
        caption: 'Guild management, shared treasury, weapon forging/upgrading, and character progression.',
        rotationDeg: -2.2,
        scale: 0.96,
        tapePosition: 'pin',
        accentPigment: '#e168ab',
        previewType: 'architecture',
        highlights: ['Complete Guild Architecture', 'Weapon Crafting & Upgrades', 'Persistent Economy & Inventory'],
      },
    ],
    demoTerminalLines: [
      { command: '/guild raid start boss:Abyssal_Warden', response: 'Guild party deployed · Boss HP: 145,000 / 145,000.', accent: '#bc2035' },
      { command: '/weapon equip item:Crimson_Blade +9', response: 'Weapon equipped · Physical ATK +380 · Crit Rate +42%.', accent: '#ef0574' },
      { command: '/combat skill cast:Execution_Slash', response: '18,420 damage dealt! Epic boss drop added to party inventory.', accent: '#ff9979' },
    ],
  },
  {
    id: 'soul-list',
    title: 'Soul List',
    subtitle: '1,400+ Command WhatsApp Bot Powered by Baileys',
    platform: 'WhatsApp',
    categoryBadge: '1,400+ COMMANDS · HIGH-PERFORMANCE BAILEYS ENGINE',
    description:
      'Massive WhatsApp bot featuring over 1,400 commands across multiple categories (group administration, automation, utilities, media processing, sticker generation, downloads, and entertainment). Built on top of Baileys to achieve maximum execution speed and stability on WhatsApp.',
    architectureNotes:
      'Direct WebSocket architecture using Baileys in Node.js/TypeScript, in-memory O(1) command indexing for instant dispatch across 1,400+ commands, low memory footprint, and fast native buffer media processing.',
    techStack: ['JavaScript', 'TypeScript', 'Node.js', 'Baileys', 'WebSockets', '1,400+ Commands'],
    videoUrl: '',
    posterUrl: '/assets/projects/soul-list-cover.jpg',
    isPlaceholderVideo: false,
    flipbookFps: 15,
    flipbookTotalFrames: 60,
    externalLinks: [
      {
        label: 'GitHub Repository (Soul-List)',
        url: 'https://github.com/LlewxamDev/Soul-List.git',
      },
    ],
    compositionOffset: {
      rotateDeg: -0.8,
      marginTopPx: 18,
      inkAccentHex: '#1d889b',
      secondaryPigmentHex: '#ef0574',
    },
    stickers: [
      {
        id: 'soul-sticker-1',
        label: '1,400+ Multi-Category Commands',
        caption: 'High-speed command router organized across administration, media tools, utilities, and group automation.',
        rotationDeg: -2.0,
        scale: 1,
        tapePosition: 'top-left',
        accentPigment: '#1d889b',
        previewType: 'whatsapp-baileys',
        highlights: ['1,400+ Active Indexed Commands', 'Advanced Group Moderation', 'Instant Media & Sticker Processing'],
      },
      {
        id: 'soul-sticker-2',
        label: 'Baileys WebSocket Performance',
        caption: 'Multi-Device WebSocket engine engineered for millisecond response times and high-concurrency groups.',
        rotationDeg: 2.9,
        scale: 0.98,
        tapePosition: 'corners',
        accentPigment: '#ef0574',
        previewType: 'architecture',
        highlights: ['Direct Baileys Socket Engine', 'O(1) Command Dispatch Map', 'Low CPU & RAM Overhead'],
      },
    ],
    demoTerminalLines: [
      { command: '!menu', response: 'Soul List Active · 1,420+ commands loaded across 18 categories (12ms).', accent: '#1d889b' },
      { command: '!group antilink enable', response: 'Group protection enabled · Automated link filtering active.', accent: '#2494a5' },
      { command: '!status performance', response: 'Baileys Multi-Device socket online · RAM: 64MB · Uptime: 99.9%.', accent: '#ef0574' },
    ],
  },
];
