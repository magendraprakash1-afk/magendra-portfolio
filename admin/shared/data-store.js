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
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certificates: [],
    achievements: [],
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
      output[key] = sourceVal;
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
  window.dispatchEvent(new CustomEvent('portfolio-updated', { detail: normalized }));
}

function saveDraftData(data) {
  const normalized = mergeWithDefaults(getPublishedData(), data || {});
  localStorage.setItem(DRAFT_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('draft-updated', { detail: normalized }));
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
  window.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
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
