/*  ═══════════════════════════════════════════════════════════════
    DATA STORE — Shared between Public Portfolio & Admin Editor
    Uses localStorage with a publish/draft system.
    Auth powered by Supabase Auth (email/password).
    ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'portfolio_data';
const DRAFT_KEY = 'portfolio_draft';
const MESSAGES_KEY = 'portfolio_messages';
const AUTH_KEY = 'portfolio_auth';
const SETTINGS_KEY = 'portfolio_settings';

/* ── Default Portfolio Data ─────────────────────────────────── */
function getDefaultData() {
  return {
    profile: {
      name: 'MAGENDRAPRAKASH S',
      title: 'AI Founder & Builder',
      company: 'Zonerox.tech',
      companyRole: 'Founder',
      bio: 'Passionate AI Founder and Full Stack Developer with a vision to build intelligent systems that transform industries. With a strong foundation in Computer Science and a drive for innovation, I specialize in creating cutting-edge AI solutions and scalable web applications.',
      location: 'India',
      email: 'contact@zonerox.tech',
      phone: '+91-XXXXXXXXXX',
      education: 'B.E. Computer Science and Engineering',
      status: 'Available for Projects',
      statusActive: true,
      profileImage: '',
      resumeUrl: '',
      typingTexts: ['AI Builder', 'Full Stack Developer', 'Entrepreneur', 'Tech Innovator'],
      heroCards: ['AI Founder', 'Developer', 'Innovation', 'Projects']
    },
    about: {
      introduction: 'I am a dedicated Computer Science Engineering student with a passion for Artificial Intelligence and innovative technology solutions. As the founder of Zonerox.tech, I lead the development of AI-powered platforms that address real-world challenges.',
      experience: 'Founder & CEO at Zonerox.tech, building AI-driven technology solutions and leading a team of developers and designers.',
      interests: 'Artificial Intelligence, Machine Learning, Web Development, Startups, Open Source, Cloud Computing',
      careerGoals: 'To build AI products that impact millions of lives and establish Zonerox.tech as a leading AI technology company.',
      summary: 'A visionary AI entrepreneur combining technical expertise with business acumen to create innovative solutions.',
      stats: [
        { label: 'Projects Completed', value: 15, icon: 'folder' },
        { label: 'Technologies', value: 20, icon: 'code' },
        { label: 'Certifications', value: 8, icon: 'award' },
        { label: 'Years of Learning', value: 4, icon: 'clock' }
      ]
    },
    skills: [
      { id: 1, name: 'Python', category: 'Programming', percentage: 90, icon: '🐍', order: 1 },
      { id: 2, name: 'JavaScript / TypeScript', category: 'Programming', percentage: 88, icon: '⚡', order: 2 },
      { id: 3, name: 'React.js & Next.js', category: 'Web Development', percentage: 85, icon: '⚛️', order: 3 },
      { id: 4, name: 'Node.js & Express', category: 'Web Development', percentage: 82, icon: '🟢', order: 4 },
      { id: 5, name: 'FastAPI & REST APIs', category: 'Web Development', percentage: 80, icon: '🚀', order: 5 },
      { id: 6, name: 'PostgreSQL & Supabase', category: 'Database', percentage: 84, icon: '🐘', order: 6 },
      { id: 7, name: 'MongoDB', category: 'Database', percentage: 78, icon: '🍃', order: 7 },
      { id: 8, name: 'Machine Learning & AI', category: 'AI / Data', percentage: 86, icon: '🧠', order: 8 },
      { id: 9, name: 'TensorFlow & PyTorch', category: 'AI / Data', percentage: 80, icon: '🔥', order: 9 },
      { id: 10, name: 'Git & GitHub', category: 'Tools', percentage: 88, icon: '🐙', order: 10 },
      { id: 11, name: 'Docker & Cloud Deployment', category: 'Tools', percentage: 75, icon: '🐳', order: 11 },
      { id: 12, name: 'TailwindCSS & Glassmorphism UI', category: 'Web Development', percentage: 90, icon: '🎨', order: 12 }
    ],
    projects: [
      {
        id: 1,
        title: 'Zonerox.tech AI Platform',
        description: 'Next-generation AI platform and developer ecosystem delivering smart agent workflows, automation pipelines, and modern web integrations.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
        technologies: ['Next.js', 'Python', 'TensorFlow', 'Supabase', 'TailwindCSS'],
        githubUrl: 'https://github.com/magendraprakash1-afk',
        liveUrl: 'https://zonerox.tech',
        category: 'AI',
        status: 'Active',
        order: 1
      },
      {
        id: 2,
        title: 'Intelligent AI Agent System',
        description: 'Multi-agent orchestration architecture capable of autonomous reasoning, real-time code execution, and dynamic task planning.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        technologies: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'PostgreSQL'],
        githubUrl: 'https://github.com/magendraprakash1-afk',
        liveUrl: '#',
        category: 'AI',
        status: 'Completed',
        order: 2
      },
      {
        id: 3,
        title: 'Cloud-Powered SaaS Dashboard',
        description: 'Full-stack responsive analytics dashboard with real-time state management, secure OAuth/JWT authentication, and glassmorphic UI.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
        technologies: ['React', 'Node.js', 'Supabase', 'Chart.js', 'CSS Glass'],
        githubUrl: 'https://github.com/magendraprakash1-afk',
        liveUrl: '#',
        category: 'Web',
        status: 'Active',
        order: 3
      },
      {
        id: 4,
        title: 'Smart Mobile Task & AI Assistant',
        description: 'Cross-platform mobile application featuring smart NLP voice actions, real-time sync, and intelligent notifications.',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60',
        technologies: ['React Native', 'JavaScript', 'REST APIs', 'Firebase'],
        githubUrl: 'https://github.com/magendraprakash1-afk',
        liveUrl: '#',
        category: 'Mobile',
        status: 'In Progress',
        order: 4
      }
    ],
    experience: [
      {
        id: 1,
        organization: 'Zonerox.tech',
        position: 'Founder & Chief Executive Officer',
        startDate: '2024',
        endDate: 'Present',
        description: 'Leading vision, technical architecture, and product development of AI-driven technology solutions, scalable platforms, and intelligent developer tools.',
        technologies: ['AI / ML', 'Full Stack', 'Next.js', 'Python', 'Supabase', 'Cloud Architecture'],
        location: 'India',
        order: 1
      },
      {
        id: 2,
        organization: 'AI & Software Innovation Lab',
        position: 'Full Stack & AI Developer',
        startDate: '2023',
        endDate: '2024',
        description: 'Developed and deployed high-performance web applications, machine learning model APIs, and modern responsive user interfaces with interactive design.',
        technologies: ['React.js', 'FastAPI', 'Node.js', 'PostgreSQL', 'Docker'],
        location: 'India',
        order: 2
      }
    ],
    education: [
      {
        id: 1,
        institution: 'Anna University / Engineering College',
        degree: 'Bachelor of Engineering (B.E.)',
        department: 'Computer Science and Engineering',
        startYear: '2022',
        endYear: '2026',
        description: 'Core focus on Artificial Intelligence, Machine Learning algorithms, Data Structures & Algorithms, Object-Oriented Software Design, and Distributed Systems.',
        grade: 'First Class with Distinction (CGPA: 8.5+)',
        order: 1
      },
      {
        id: 2,
        institution: 'Higher Secondary School',
        degree: 'Higher Secondary Certificate (HSC)',
        department: 'Computer Science & Mathematics',
        startYear: '2020',
        endYear: '2022',
        description: 'Completed higher secondary education with major concentrations in Computer Science, Mathematics, Physics, and Chemistry.',
        grade: '90%+',
        order: 2
      }
    ],
    certificates: [
      {
        id: 1,
        name: 'AI & Deep Learning Specialization',
        organization: 'DeepLearning.AI & Coursera',
        date: '2024',
        credentialId: 'DL-AI-2024-001',
        credentialUrl: 'https://coursera.org',
        image: '',
        order: 1
      },
      {
        id: 2,
        name: 'Full-Stack Web Development Professional',
        organization: 'Meta / Coursera',
        date: '2023',
        credentialId: 'META-FS-84920',
        credentialUrl: 'https://coursera.org',
        image: '',
        order: 2
      },
      {
        id: 3,
        name: 'Google Cloud Computing & Architecture',
        organization: 'Google Cloud Platform',
        date: '2024',
        credentialId: 'GCP-CA-9921',
        credentialUrl: 'https://cloud.google.com',
        image: '',
        order: 3
      },
      {
        id: 4,
        name: 'Python & Machine Learning Masterclass',
        organization: 'Udemy / Stanford Online',
        date: '2023',
        credentialId: 'UC-ML-PY-771',
        credentialUrl: 'https://udemy.com',
        image: '',
        order: 4
      }
    ],
    achievements: [
      {
        id: 1,
        title: 'Founded & Scaled Zonerox.tech',
        description: 'Established Zonerox.tech to build accessible, cutting-edge AI software solutions, products, and developer toolsets.',
        category: 'Entrepreneurship',
        date: '2024',
        icon: '🚀',
        order: 1
      },
      {
        id: 2,
        title: '1st Place — AI Innovation Hackathon',
        description: 'Built a real-time AI multimodal assistant and intelligent analyzer in 24 hours, winning 1st place among 50+ competing teams.',
        category: 'Hackathon',
        date: '2024',
        icon: '🥇',
        order: 2
      },
      {
        id: 3,
        title: 'Smart India Hackathon Finalist',
        description: 'Selected as national-level finalist for innovating AI-driven automation solutions addressing real-world industry challenges.',
        category: 'National Competition',
        date: '2023',
        icon: '🏆',
        order: 3
      },
      {
        id: 4,
        title: 'Open Source AI Contributor',
        description: 'Active contributor to popular open-source repositories in AI tools, developer utilities, and modern web application frameworks.',
        category: 'Community',
        date: '2023 — 2024',
        icon: '🌟',
        order: 4
      }
    ],
    socialLinks: {
      github: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      twitter: '',
      facebook: '',
      website: '',
      custom: []
    },
    seo: {
      title: 'MAGENDRAPRAKASH S | AI Founder & Builder',
      description: 'Portfolio of MAGENDRAPRAKASH S - AI Founder, Full Stack Developer, and Founder of Zonerox.tech. Specializing in AI solutions, web development, and innovative technology.',
      keywords: 'AI Founder, Full Stack Developer, Zonerox.tech, Portfolio, Machine Learning, Web Developer',
      ogImage: '',
      twitterHandle: ''
    }
  };
}

function getDefaultSettings() {
  return {
    theme: 'dark',
    primaryColor: '#00ff88',
    secondaryColor: '#00d4ff',
    glassOpacity: 0.08,
    blurIntensity: 20,
    borderRadius: 16,
    shadowStrength: 0.3,
    backgroundStyle: 'particles',
    particleDensity: 80,
    animationSpeed: 1,
    fontFamily: 'Inter',
    sectionSpacing: 100,
    animationIntensity: 'normal'
  };
}

/* ── Data Access Functions ──────────────────────────────────── */

function mergeWithDefaults(target, source) {
  const output = Array.isArray(target) ? [...target] : { ...(target || {}) };

  if (!source || typeof source !== 'object') {
    return output;
  }

  Object.keys(source).forEach((key) => {
    const sourceVal = source[key];
    const targetVal = output[key];

    if (Array.isArray(sourceVal)) {
      output[key] = sourceVal.length > 0 ? sourceVal : (Array.isArray(targetVal) && targetVal.length > 0 ? targetVal : sourceVal);
      return;
    }

    if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
      if (!targetVal || typeof targetVal !== 'object' || Array.isArray(targetVal)) {
        output[key] = mergeWithDefaults({}, sourceVal);
      } else {
        output[key] = mergeWithDefaults(targetVal, sourceVal);
      }
      return;
    }

    output[key] = sourceVal;
  });

  return output;
}

function getPublishedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const fallback = getDefaultData();
    return raw ? mergeWithDefaults(fallback, JSON.parse(raw)) : fallback;
  } catch { return getDefaultData(); }
}

function getDraftData() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const fallback = getPublishedData();
    return raw ? mergeWithDefaults(fallback, JSON.parse(raw)) : fallback;
  } catch { return getPublishedData(); }
}

function savePublishedData(data) {
  const normalized = mergeWithDefaults(getDefaultData(), data || {});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('portfolio-updated', { detail: normalized }));
  }
}

function saveDraftData(data) {
  const normalized = mergeWithDefaults(getPublishedData(), data || {});
  localStorage.setItem(DRAFT_KEY, JSON.stringify(normalized));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('draft-updated', { detail: normalized }));
  }
}

function publishDraft() {
  const draft = getDraftData();
  savePublishedData(draft);
  return draft;
}

function discardDraft() {
  const published = getPublishedData();
  saveDraftData(published);
  return published;
}

function hasDraftChanges() {
  const pub = JSON.stringify(getPublishedData());
  const draft = JSON.stringify(getDraftData());
  return pub !== draft;
}

/* ── Settings ───────────────────────────────────────────────── */

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...getDefaultSettings(), ...JSON.parse(raw) } : getDefaultSettings();
  } catch { return getDefaultSettings(); }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
  }
}

/* ── Messages ───────────────────────────────────────────────── */

function getMessages() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addMessage(msg) {
  const messages = getMessages();
  messages.unshift({
    id: Date.now(),
    ...msg,
    date: new Date().toISOString(),
    read: false
  });
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return messages;
}

function markMessageRead(id) {
  const messages = getMessages();
  const m = messages.find(m => m.id === id);
  if (m) m.read = true;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return messages;
}

function deleteMessage(id) {
  let messages = getMessages();
  messages = messages.filter(m => m.id !== id);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return messages;
}

/* ── Auth — Supabase Auth ─────────────────────────────────── */

/**
 * Get the Supabase client instance.
 * Returns null if supabase-js is not loaded (e.g. on public site).
 */
function _getSupabase() {
  if (window._supabaseClient) return window._supabaseClient;
  if (window.supabase && window.supabase.createClient) {
    const SUPABASE_URL = 'https://pmnqgrrevcmzqebowjtq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbnFncnJldmNtenFlYm93anRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTg3MDUsImV4cCI6MjEwMjA3NDcwNX0.fngIxxH80ZgaE7mNluchHhMA_nZlnbfCTulcFL8o494';
    window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._supabaseClient;
  }
  return null;
}

/**
 * Sign in with email & password via Supabase Auth.
 * Returns { success, session?, error? }
 */
async function login(email, password) {
  const sb = _getSupabase();
  if (!sb) {
    return { success: false, error: 'Supabase client not available. Make sure supabase-js is loaded.' };
  }

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      session: {
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        userId: data.user.id,
        accessToken: data.session.access_token,
        loggedIn: true,
        timestamp: Date.now()
      }
    };
  } catch (err) {
    return { success: false, error: err.message || 'Login failed' };
  }
}

/**
 * Sign out via Supabase Auth.
 */
async function logout() {
  const sb = _getSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
}

/**
 * Get the current Supabase Auth session.
 * Returns the session object or null.
 */
async function getSession() {
  const sb = _getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated via Supabase Auth.
 * Returns true if a valid session exists.
 */
async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

/**
 * Get the current authenticated user.
 * Returns the user object or null.
 */
async function getUser() {
  const sb = _getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

/**
 * Update the admin's password (requires current session).
 */
async function updatePassword(newPassword) {
  const sb = _getSupabase();
  if (!sb) return { success: false, error: 'Supabase client not available' };

  try {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Password update failed' };
  }
}

/**
 * Update the admin's email (requires current session).
 */
async function updateEmail(newEmail) {
  const sb = _getSupabase();
  if (!sb) return { success: false, error: 'Supabase client not available' };

  try {
    const { error } = await sb.auth.updateUser({ email: newEmail });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Email update failed' };
  }
}

/**
 * Listen for auth state changes.
 * callback(event, session) — event is 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.
 */
function onAuthStateChange(callback) {
  const sb = _getSupabase();
  if (!sb) return { data: { subscription: { unsubscribe: () => { } } } };
  return sb.auth.onAuthStateChange(callback);
}

/* ── Initialize default data if first visit ─────────────────── */

function initializeData() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    savePublishedData(getDefaultData());
  }
  if (!localStorage.getItem(DRAFT_KEY)) {
    saveDraftData(getDefaultData());
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    saveSettings(getDefaultSettings());
  }
}

// Auto-initialize
initializeData();

/* ── Export ──────────────────────────────────────────────────── */
window.PortfolioStore = {
  getPublishedData,
  getDraftData,
  savePublishedData,
  saveDraftData,
  publishDraft,
  discardDraft,
  hasDraftChanges,
  getSettings,
  saveSettings,
  getMessages,
  addMessage,
  markMessageRead,
  deleteMessage,
  login,
  logout,
  getSession,
  isAuthenticated,
  getUser,
  updatePassword,
  updateEmail,
  onAuthStateChange,
  getDefaultData,
  getDefaultSettings,
  initializeData
};
