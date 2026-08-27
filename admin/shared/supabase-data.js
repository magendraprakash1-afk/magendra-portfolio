/*  ═══════════════════════════════════════════════════════════════
    SUPABASE DATA LAYER — Read/Write portfolio data to Supabase DB
    
    Admin (authenticated) → writes to Supabase
    Public site (anon)    → reads from Supabase
    ═══════════════════════════════════════════════════════════════ */

const SB_URL  = 'https://pmnqgrrevcmzqebowjtq.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbnFncnJldmNtenFlYm93anRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTg3MDUsImV4cCI6MjEwMjA3NDcwNX0.fngIxxH80ZgaE7mNluchHhMA_nZlnbfCTulcFL8o494';
const SB_REST = SB_URL + '/rest/v1/';

/* ── REST helpers (work without supabase-js, perfect for public site) ── */

async function sbGet(table, params = '') {
  const url = SB_REST + table + (params ? '?' + params : '');
  const res = await fetch(url, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
  if (!res.ok) {
    console.error(`Supabase GET ${table} failed:`, res.status, await res.text());
    return null;
  }
  return res.json();
}

async function sbPost(table, data, token) {
  const res = await fetch(SB_REST + table, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (token || SB_KEY),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    console.error(`Supabase POST ${table} failed:`, res.status, await res.text());
    return null;
  }
  return res.json();
}

async function sbPatch(table, params, data, token) {
  const res = await fetch(SB_REST + table + '?' + params, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (token || SB_KEY),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    console.error(`Supabase PATCH ${table} failed:`, res.status, await res.text());
    return null;
  }
  return res.json();
}

async function sbDelete(table, params, token) {
  const res = await fetch(SB_REST + table + '?' + params, {
    method: 'DELETE',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (token || SB_KEY),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
  if (!res.ok) {
    console.error(`Supabase DELETE ${table} failed:`, res.status, await res.text());
    return null;
  }
  return res.json();
}

async function sbUpsert(table, data, token) {
  const res = await fetch(SB_REST + table, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (token || SB_KEY),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    console.error(`Supabase UPSERT ${table} failed:`, res.status, await res.text());
    return null;
  }
  return res.json();
}


/* ══════════════════════════════════════════════════════════════
   PUBLIC READ — Fetch all portfolio data from Supabase (no auth)
   ══════════════════════════════════════════════════════════════ */

async function fetchPortfolioFromSupabase() {
  try {
    // Fetch all tables in parallel
    const [
      profiles,
      aboutRows,
      aboutStatsRows,
      skillsRows,
      projectsRows,
      experienceRows,
      educationRows,
      certificatesRows,
      achievementsRows,
      socialRows,
      settingsRows,
      seoRows,
      messagesRows
    ] = await Promise.all([
      sbGet('profiles', 'limit=1'),
      sbGet('about_detail', 'limit=1'),
      sbGet('about_stats', 'order=sort_order.asc'),
      sbGet('skills', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('projects', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('experience', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('education', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('certificates', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('achievements', 'is_published=eq.true&order=sort_order.asc'),
      sbGet('social_links', 'order=sort_order.asc'),
      sbGet('site_settings', 'limit=1'),
      sbGet('seo_settings', 'limit=1'),
      sbGet('contact_messages', 'order=created_at.desc')
    ]);

    // If no profile exists or response is invalid, return null (use defaults)
    if (!Array.isArray(profiles) || profiles.length === 0) {
      console.warn('No profile found in Supabase, using defaults');
      return null;
    }

    const p = profiles[0];
    const about = (Array.isArray(aboutRows) && aboutRows[0]) ? aboutRows[0] : {};
    const seo = (Array.isArray(seoRows) && seoRows[0]) ? seoRows[0] : {};
    const siteSettings = (Array.isArray(settingsRows) && settingsRows[0]) ? settingsRows[0] : {};

    // Build social links object
    const socialLinks = {
      github: '', linkedin: '', instagram: '', youtube: '',
      twitter: '', facebook: '', website: '', custom: []
    };
    if (Array.isArray(socialRows)) {
      socialRows.forEach(s => {
        if (s.is_custom) {
          socialLinks.custom.push({ name: s.platform, url: s.url });
        } else if (socialLinks.hasOwnProperty(s.platform)) {
          socialLinks[s.platform] = s.url || '';
        }
      });
    }

    // Map DB rows → app data shape
    const data = {
      _profileId: p.id,
      profile: {
        name: p.name || '',
        title: p.title || '',
        company: p.company || '',
        companyRole: p.company_role || '',
        bio: p.bio || '',
        location: p.location || '',
        email: p.email || '',
        phone: p.phone || '',
        education: p.education || '',
        status: p.status || 'Available for Projects',
        statusActive: p.status_active !== false,
        profileImage: p.profile_image || '',
        resumeUrl: p.resume_url || '',
        typingTexts: p.typing_texts || ['AI Builder', 'Full Stack Developer'],
        heroCards: p.hero_cards || ['AI Founder', 'Developer', 'Innovation', 'Projects']
      },
      about: {
        introduction: about.introduction || '',
        experience: about.experience || '',
        interests: about.interests || '',
        careerGoals: about.career_goals || '',
        summary: about.summary || '',
        stats: (Array.isArray(aboutStatsRows) ? aboutStatsRows : []).map(s => ({
          id: s.id,
          label: s.label,
          value: s.value,
          icon: s.icon
        }))
      },
      skills: (Array.isArray(skillsRows) && skillsRows.length > 0) ? skillsRows.map((s, i) => ({
        id: s.id,
        _dbId: s.id,
        name: s.name,
        category: s.category || 'Programming',
        percentage: s.percentage || 50,
        icon: s.icon || '⚡',
        order: s.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().skills : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().skills : [])),
      projects: (Array.isArray(projectsRows) && projectsRows.length > 0) ? projectsRows.map((p, i) => ({
        id: p.id,
        _dbId: p.id,
        title: p.title,
        description: p.description || '',
        image: p.image || '',
        technologies: p.technologies || [],
        githubUrl: p.github_url || '',
        liveUrl: p.live_url || '',
        category: p.category || 'Web',
        status: p.status || 'Active',
        order: p.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().projects : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().projects : [])),
      experience: (Array.isArray(experienceRows) && experienceRows.length > 0) ? experienceRows.map((e, i) => ({
        id: e.id,
        _dbId: e.id,
        organization: e.organization,
        position: e.position || '',
        startDate: e.start_date || '',
        endDate: e.end_date || 'Present',
        description: e.description || '',
        technologies: e.technologies || [],
        location: e.location || '',
        order: e.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().experience : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().experience : [])),
      education: (Array.isArray(educationRows) && educationRows.length > 0) ? educationRows.map((e, i) => ({
        id: e.id,
        _dbId: e.id,
        institution: e.institution,
        degree: e.degree || '',
        department: e.department || '',
        startYear: e.start_year || '',
        endYear: e.end_year || '',
        description: e.description || '',
        grade: e.grade || '',
        order: e.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().education : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().education : [])),
      certificates: (Array.isArray(certificatesRows) && certificatesRows.length > 0) ? certificatesRows.map((c, i) => ({
        id: c.id,
        _dbId: c.id,
        name: c.name,
        organization: c.organization || '',
        date: c.date || '',
        credentialId: c.credential_id || '',
        credentialUrl: c.credential_url || '',
        image: c.image || '',
        order: c.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().certificates : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().certificates : [])),
      achievements: (Array.isArray(achievementsRows) && achievementsRows.length > 0) ? achievementsRows.map((a, i) => ({
        id: a.id,
        _dbId: a.id,
        title: a.title,
        description: a.description || '',
        category: a.category || 'Recognition',
        date: a.date || '',
        icon: a.icon || '🏆',
        order: a.sort_order || i
      })) : (typeof getDefaultData === 'function' ? getDefaultData().achievements : (window.PortfolioStore ? window.PortfolioStore.getDefaultData().achievements : [])),
      socialLinks,
      seo: {
        title: seo.title || '',
        description: seo.description || '',
        keywords: seo.keywords || '',
        ogImage: seo.og_image || '',
        twitterHandle: seo.twitter_handle || ''
      }
    };

    // Build settings
    const settings = {
      theme: siteSettings.theme || 'dark',
      primaryColor: siteSettings.primary_color || '#00ff88',
      secondaryColor: siteSettings.secondary_color || '#00d4ff',
      glassOpacity: siteSettings.glass_opacity ?? 0.08,
      blurIntensity: siteSettings.blur_intensity ?? 20,
      borderRadius: siteSettings.border_radius ?? 16,
      shadowStrength: siteSettings.shadow_strength ?? 0.3,
      backgroundStyle: siteSettings.background_style || 'particles',
      particleDensity: siteSettings.particle_density ?? 80,
      animationSpeed: siteSettings.animation_speed ?? 1,
      fontFamily: siteSettings.font_family || 'Inter',
      sectionSpacing: siteSettings.section_spacing ?? 100,
      animationIntensity: 'normal'
    };

    const messages = (Array.isArray(messagesRows) ? messagesRows : []).map(m => ({
      id: m.id,
      _dbId: m.id,
      name: m.name,
      email: m.email,
      message: m.message,
      date: m.created_at,
      read: m.is_read || false
    }));

    return { data, settings, messages };
  } catch (err) {
    console.error('Failed to fetch portfolio from Supabase:', err);
    return null;
  }
}


/* ══════════════════════════════════════════════════════════════
   ADMIN WRITE — Publish all portfolio data to Supabase (auth required)
   ══════════════════════════════════════════════════════════════ */

async function getAuthToken() {
  if (window._supabaseClient) {
    const { data } = await window._supabaseClient.auth.getSession();
    return data?.session?.access_token || null;
  }
  return null;
}

/**
 * Publish full portfolio data to Supabase.
 * Creates profile if none exists, then upserts all related data.
 */
async function publishToSupabase(portfolioData, settingsData) {
  const token = await getAuthToken();
  if (!token) {
    console.error('Not authenticated — cannot publish to Supabase');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const d = portfolioData;
    const profileId = d._profileId || null;

    // ── 1. Upsert Profile ──
    const profilePayload = {
      name: d.profile.name,
      title: d.profile.title,
      company: d.profile.company,
      company_role: d.profile.companyRole,
      bio: d.profile.bio,
      location: d.profile.location,
      email: d.profile.email,
      phone: d.profile.phone,
      education: d.profile.education,
      status: d.profile.status,
      status_active: d.profile.statusActive,
      profile_image: d.profile.profileImage,
      resume_url: d.profile.resumeUrl,
      typing_texts: d.profile.typingTexts || [],
      hero_cards: d.profile.heroCards || [],
      updated_at: new Date().toISOString()
    };

    let profile;
    if (profileId) {
      profilePayload.id = profileId;
      const result = await sbUpsert('profiles', profilePayload, token);
      profile = result && result[0] ? result[0] : null;
    } else {
      const result = await sbPost('profiles', profilePayload, token);
      profile = result && result[0] ? result[0] : null;
    }

    if (!profile) {
      return { success: false, error: 'Failed to save profile' };
    }

    const pid = profile.id;

    // ── 2. Upsert About ──
    const existingAbout = await sbGet('about_detail', 'profile_id=eq.' + pid);
    const aboutPayload = {
      profile_id: pid,
      introduction: d.about.introduction || '',
      experience: d.about.experience || '',
      interests: d.about.interests || '',
      career_goals: d.about.careerGoals || '',
      summary: d.about.summary || '',
      updated_at: new Date().toISOString()
    };
    if (existingAbout && existingAbout.length > 0) {
      aboutPayload.id = existingAbout[0].id;
      await sbUpsert('about_detail', aboutPayload, token);
    } else {
      await sbPost('about_detail', aboutPayload, token);
    }

    // ── 3. Replace about_stats ──
    await sbDelete('about_stats', 'profile_id=eq.' + pid, token);
    if (d.about.stats && d.about.stats.length > 0) {
      const statsPayload = d.about.stats.map((s, i) => ({
        profile_id: pid,
        label: s.label,
        value: s.value || 0,
        icon: s.icon || 'star',
        sort_order: i
      }));
      await sbPost('about_stats', statsPayload, token);
    }

    // ── 4. Replace skills ──
    await sbDelete('skills', 'profile_id=eq.' + pid, token);
    if (d.skills && d.skills.length > 0) {
      const skillsPayload = d.skills.map((s, i) => ({
        profile_id: pid,
        name: s.name,
        category: s.category || 'Programming',
        percentage: s.percentage || 50,
        icon: s.icon || '⚡',
        sort_order: i,
        is_published: true
      }));
      await sbPost('skills', skillsPayload, token);
    }

    // ── 5. Replace projects ──
    await sbDelete('projects', 'profile_id=eq.' + pid, token);
    if (d.projects && d.projects.length > 0) {
      const projectsPayload = d.projects.map((p, i) => ({
        profile_id: pid,
        title: p.title,
        description: p.description || '',
        image: p.image || '',
        technologies: p.technologies || [],
        github_url: p.githubUrl || '',
        live_url: p.liveUrl || '',
        category: p.category || 'Web',
        status: p.status || 'Active',
        sort_order: i,
        is_published: true
      }));
      await sbPost('projects', projectsPayload, token);
    }

    // ── 6. Replace experience ──
    await sbDelete('experience', 'profile_id=eq.' + pid, token);
    if (d.experience && d.experience.length > 0) {
      const expPayload = d.experience.map((e, i) => ({
        profile_id: pid,
        organization: e.organization,
        position: e.position || '',
        start_date: e.startDate || '',
        end_date: e.endDate || 'Present',
        description: e.description || '',
        technologies: e.technologies || [],
        location: e.location || '',
        sort_order: i,
        is_published: true
      }));
      await sbPost('experience', expPayload, token);
    }

    // ── 7. Replace education ──
    await sbDelete('education', 'profile_id=eq.' + pid, token);
    if (d.education && d.education.length > 0) {
      const eduPayload = d.education.map((e, i) => ({
        profile_id: pid,
        institution: e.institution,
        degree: e.degree || '',
        department: e.department || '',
        start_year: e.startYear || '',
        end_year: e.endYear || '',
        description: e.description || '',
        grade: e.grade || '',
        sort_order: i,
        is_published: true
      }));
      await sbPost('education', eduPayload, token);
    }

    // ── 8. Replace certificates ──
    await sbDelete('certificates', 'profile_id=eq.' + pid, token);
    if (d.certificates && d.certificates.length > 0) {
      const certPayload = d.certificates.map((c, i) => ({
        profile_id: pid,
        name: c.name,
        organization: c.organization || '',
        date: c.date || '',
        credential_id: c.credentialId || '',
        credential_url: c.credentialUrl || '',
        image: c.image || '',
        sort_order: i,
        is_published: true
      }));
      await sbPost('certificates', certPayload, token);
    }

    // ── 9. Replace achievements ──
    await sbDelete('achievements', 'profile_id=eq.' + pid, token);
    if (d.achievements && d.achievements.length > 0) {
      const achPayload = d.achievements.map((a, i) => ({
        profile_id: pid,
        title: a.title,
        description: a.description || '',
        category: a.category || 'Recognition',
        date: a.date || '',
        icon: a.icon || '🏆',
        sort_order: i,
        is_published: true
      }));
      await sbPost('achievements', achPayload, token);
    }

    // ── 10. Replace social links ──
    await sbDelete('social_links', 'profile_id=eq.' + pid, token);
    const socialPayload = [];
    const sl = d.socialLinks || {};
    const platforms = ['github','linkedin','instagram','youtube','twitter','facebook','website'];
    platforms.forEach((plat, i) => {
      if (sl[plat]) {
        socialPayload.push({ profile_id: pid, platform: plat, url: sl[plat], is_custom: false, sort_order: i });
      }
    });
    if (sl.custom && sl.custom.length > 0) {
      sl.custom.forEach((c, i) => {
        socialPayload.push({ profile_id: pid, platform: c.name, url: c.url, is_custom: true, sort_order: platforms.length + i });
      });
    }
    if (socialPayload.length > 0) {
      await sbPost('social_links', socialPayload, token);
    }

    // ── 11. Upsert SEO settings ──
    const existingSeo = await sbGet('seo_settings', 'profile_id=eq.' + pid);
    const seoPayload = {
      profile_id: pid,
      title: d.seo.title || '',
      description: d.seo.description || '',
      keywords: d.seo.keywords || '',
      og_image: d.seo.ogImage || '',
      twitter_handle: d.seo.twitterHandle || '',
      updated_at: new Date().toISOString()
    };
    if (existingSeo && existingSeo.length > 0) {
      seoPayload.id = existingSeo[0].id;
      await sbUpsert('seo_settings', seoPayload, token);
    } else {
      await sbPost('seo_settings', seoPayload, token);
    }

    // ── 12. Upsert Site Settings ──
    if (settingsData) {
      const existingSettings = await sbGet('site_settings', 'profile_id=eq.' + pid);
      const settingsPayload = {
        profile_id: pid,
        primary_color: settingsData.primaryColor || '#00ff88',
        secondary_color: settingsData.secondaryColor || '#00d4ff',
        glass_opacity: settingsData.glassOpacity ?? 0.08,
        blur_intensity: settingsData.blurIntensity ?? 20,
        border_radius: settingsData.borderRadius ?? 16,
        shadow_strength: settingsData.shadowStrength ?? 0.3,
        background_style: settingsData.backgroundStyle || 'particles',
        particle_density: settingsData.particleDensity ?? 80,
        animation_speed: settingsData.animationSpeed ?? 1,
        font_family: settingsData.fontFamily || 'Inter',
        section_spacing: settingsData.sectionSpacing ?? 100,
        theme: settingsData.theme || 'dark',
        updated_at: new Date().toISOString()
      };
      if (existingSettings && existingSettings.length > 0) {
        settingsPayload.id = existingSettings[0].id;
        await sbUpsert('site_settings', settingsPayload, token);
      } else {
        await sbPost('site_settings', settingsPayload, token);
      }
    }

    return { success: true, profileId: pid };

  } catch (err) {
    console.error('Publish to Supabase failed:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}


/* ══════════════════════════════════════════════════════════════
   CONTACT MESSAGE — Save to Supabase (public, no auth)
   ══════════════════════════════════════════════════════════════ */

async function saveContactMessage(profileId, name, email, message) {
  try {
    let pid = profileId;
    if (!pid) {
      const profiles = await sbGet('profiles', 'limit=1');
      pid = Array.isArray(profiles) && profiles[0] ? profiles[0].id : null;
    }
    const payload = {
      name: name || '',
      email: email || '',
      message: message || ''
    };
    if (pid) payload.profile_id = pid;

    const result = await sbPost('contact_messages', payload);
    return result ? { success: true } : { success: false, error: 'Failed to save' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ── Admin: Mark message as read ── */
async function markMessageReadInDB(messageId) {
  try {
    const token = (await getAuthToken()) || SB_KEY;
    await sbPatch('contact_messages', 'id=eq.' + messageId, { is_read: true }, token);
  } catch (e) {
    console.warn('markMessageReadInDB notice:', e);
  }
}

/* ── Admin: Delete message ── */
async function deleteMessageFromDB(messageId) {
  try {
    const token = (await getAuthToken()) || SB_KEY;
    await sbDelete('contact_messages', 'id=eq.' + messageId, token);
  } catch (e) {
    console.warn('deleteMessageFromDB notice:', e);
  }
}

/* ── Admin: Get all messages ── */
async function fetchMessagesFromDB(profileId) {
  try {
    let pid = profileId;
    if (!pid) {
      const profiles = await sbGet('profiles', 'limit=1');
      pid = Array.isArray(profiles) && profiles[0] ? profiles[0].id : null;
    }
    
    const token = await getAuthToken();
    const queryParam = pid ? 'profile_id=eq.' + pid + '&order=created_at.desc' : 'order=created_at.desc';
    const url = SB_REST + 'contact_messages?' + queryParam;
    const res = await fetch(url, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + (token || SB_KEY),
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map(m => ({
      id: m.id,
      _dbId: m.id,
      name: m.name,
      email: m.email,
      message: m.message,
      date: m.created_at,
      read: m.is_read || false
    }));
  } catch (e) {
    console.warn('fetchMessagesFromDB notice:', e);
    return [];
  }
}

/* ══════════════════════════════════════════════════════════════
   Admin: Fetch ALL data (including unpublished) for editing
   ══════════════════════════════════════════════════════════════ */

async function fetchAllDataForAdmin() {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const headers = {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };

    const fetchTable = async (table, params = '') => {
      const url = SB_REST + table + (params ? '?' + params : '');
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      return res.json();
    };

    const [
      profiles, aboutRows, aboutStatsRows, skillsRows, projectsRows,
      experienceRows, educationRows, certificatesRows, achievementsRows,
      socialRows, settingsRows, seoRows
    ] = await Promise.all([
      fetchTable('profiles', 'limit=1'),
      fetchTable('about_detail', 'limit=1'),
      fetchTable('about_stats', 'order=sort_order.asc'),
      fetchTable('skills', 'order=sort_order.asc'),       // ALL skills, not just published
      fetchTable('projects', 'order=sort_order.asc'),
      fetchTable('experience', 'order=sort_order.asc'),
      fetchTable('education', 'order=sort_order.asc'),
      fetchTable('certificates', 'order=sort_order.asc'),
      fetchTable('achievements', 'order=sort_order.asc'),
      fetchTable('social_links', 'order=sort_order.asc'),
      fetchTable('site_settings', 'limit=1'),
      fetchTable('seo_settings', 'limit=1')
    ]);

    if (!profiles || profiles.length === 0) return null;

    // Use the same mapping as fetchPortfolioFromSupabase but with ALL rows
    const p = profiles[0];
    const about = aboutRows && aboutRows[0] ? aboutRows[0] : {};
    const seo = seoRows && seoRows[0] ? seoRows[0] : {};
    const siteSettings = settingsRows && settingsRows[0] ? settingsRows[0] : {};

    const socialLinks = {
      github: '', linkedin: '', instagram: '', youtube: '',
      twitter: '', facebook: '', website: '', custom: []
    };
    (socialRows || []).forEach(s => {
      if (s.is_custom) {
        socialLinks.custom.push({ name: s.platform, url: s.url });
      } else if (socialLinks.hasOwnProperty(s.platform)) {
        socialLinks[s.platform] = s.url || '';
      }
    });

    const data = {
      _profileId: p.id,
      profile: {
        name: p.name || '', title: p.title || '', company: p.company || '',
        companyRole: p.company_role || '', bio: p.bio || '',
        location: p.location || '', email: p.email || '', phone: p.phone || '',
        education: p.education || '', status: p.status || 'Available for Projects',
        statusActive: p.status_active !== false, profileImage: p.profile_image || '',
        resumeUrl: p.resume_url || '',
        typingTexts: p.typing_texts || ['AI Builder', 'Full Stack Developer'],
        heroCards: p.hero_cards || ['AI Founder', 'Developer', 'Innovation', 'Projects']
      },
      about: {
        introduction: about.introduction || '', experience: about.experience || '',
        interests: about.interests || '', careerGoals: about.career_goals || '',
        summary: about.summary || '',
        stats: (aboutStatsRows || []).map(s => ({ id: s.id, label: s.label, value: s.value, icon: s.icon }))
      },
      skills: (skillsRows || []).map((s, i) => ({
        id: s.id, _dbId: s.id, name: s.name, category: s.category || 'Programming',
        percentage: s.percentage || 50, icon: s.icon || '⚡', order: s.sort_order || i
      })),
      projects: (projectsRows || []).map((p, i) => ({
        id: p.id, _dbId: p.id, title: p.title, description: p.description || '',
        image: p.image || '', technologies: p.technologies || [],
        githubUrl: p.github_url || '', liveUrl: p.live_url || '',
        category: p.category || 'Web', status: p.status || 'Active', order: p.sort_order || i
      })),
      experience: (experienceRows || []).map((e, i) => ({
        id: e.id, _dbId: e.id, organization: e.organization, position: e.position || '',
        startDate: e.start_date || '', endDate: e.end_date || 'Present',
        description: e.description || '', technologies: e.technologies || [],
        location: e.location || '', order: e.sort_order || i
      })),
      education: (educationRows || []).map((e, i) => ({
        id: e.id, _dbId: e.id, institution: e.institution, degree: e.degree || '',
        department: e.department || '', startYear: e.start_year || '',
        endYear: e.end_year || '', description: e.description || '',
        grade: e.grade || '', order: e.sort_order || i
      })),
      certificates: (certificatesRows || []).map((c, i) => ({
        id: c.id, _dbId: c.id, name: c.name, organization: c.organization || '',
        date: c.date || '', credentialId: c.credential_id || '',
        credentialUrl: c.credential_url || '', image: c.image || '', order: c.sort_order || i
      })),
      achievements: (achievementsRows || []).map((a, i) => ({
        id: a.id, _dbId: a.id, title: a.title, description: a.description || '',
        category: a.category || 'Recognition', date: a.date || '',
        icon: a.icon || '🏆', order: a.sort_order || i
      })),
      socialLinks,
      seo: {
        title: seo.title || '', description: seo.description || '',
        keywords: seo.keywords || '', ogImage: seo.og_image || '',
        twitterHandle: seo.twitter_handle || ''
      }
    };

    const settings = {
      theme: siteSettings.theme || 'dark',
      primaryColor: siteSettings.primary_color || '#00ff88',
      secondaryColor: siteSettings.secondary_color || '#00d4ff',
      glassOpacity: siteSettings.glass_opacity ?? 0.08,
      blurIntensity: siteSettings.blur_intensity ?? 20,
      borderRadius: siteSettings.border_radius ?? 16,
      shadowStrength: siteSettings.shadow_strength ?? 0.3,
      backgroundStyle: siteSettings.background_style || 'particles',
      particleDensity: siteSettings.particle_density ?? 80,
      animationSpeed: siteSettings.animation_speed ?? 1,
      fontFamily: siteSettings.font_family || 'Inter',
      sectionSpacing: siteSettings.section_spacing ?? 100,
      animationIntensity: 'normal'
    };

    return { data, settings };
  } catch (err) {
    console.error('fetchAllDataForAdmin failed:', err);
    return null;
  }
}


/* ── Export ────────────────────────────────────────────────── */
window.SupabaseData = {
  fetchPortfolioFromSupabase,
  publishToSupabase,
  saveContactMessage,
  markMessageReadInDB,
  deleteMessageFromDB,
  fetchMessagesFromDB,
  fetchAllDataForAdmin,
  getAuthToken
};
