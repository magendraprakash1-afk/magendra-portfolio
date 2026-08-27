/* ═══════════════════════════════════════════════════════════════
   PUBLIC PORTFOLIO — Main Application
   Reads from published data store and renders all sections
   ═══════════════════════════════════════════════════════════════ */

(function() {
  const store = window.PortfolioStore || {
    getPublishedData: () => (typeof getDefaultData === 'function' ? getDefaultData() : {}),
    getSettings: () => (typeof getDefaultSettings === 'function' ? getDefaultSettings() : {}),
    addMessage: () => {},
    savePublishedData: () => {},
    saveSettings: () => {}
  };

  function sanitizeData(raw) {
    const defaults = (window.PortfolioStore && typeof window.PortfolioStore.getDefaultData === 'function')
      ? window.PortfolioStore.getDefaultData()
      : (typeof getDefaultData === 'function' ? getDefaultData() : {});

    if (!raw) return defaults;
    const merged = { ...defaults, ...raw };
    merged.profile = { ...(defaults.profile || {}), ...(raw.profile || {}) };
    merged.about = { ...(defaults.about || {}), ...(raw.about || {}) };
    merged.socialLinks = { ...(defaults.socialLinks || {}), ...(raw.socialLinks || {}) };
    merged.seo = { ...(defaults.seo || {}), ...(raw.seo || {}) };

    const arrayKeys = ['skills', 'projects', 'experience', 'education', 'certificates', 'achievements'];
    arrayKeys.forEach(k => {
      merged[k] = (Array.isArray(raw[k]) && raw[k].length > 0) ? raw[k] : (defaults[k] || []);
    });
    return merged;
  }

  let data = sanitizeData(store.getPublishedData ? store.getPublishedData() : null);
  let settings = store.getSettings ? store.getSettings() : (typeof getDefaultSettings === 'function' ? getDefaultSettings() : {});

  /* ── Initialize ───────────────────────────────────────────── */
  async function init() {
    // Try to load data from Supabase (permanent storage)
    if (window.SupabaseData && typeof window.SupabaseData.fetchPortfolioFromSupabase === 'function') {
      try {
        const sbResult = await window.SupabaseData.fetchPortfolioFromSupabase();
        if (sbResult && sbResult.data) {
          data = sanitizeData(sbResult.data);
          settings = sbResult.settings || settings;
          // Also update localStorage so cross-tab polling works
          if (store.savePublishedData) store.savePublishedData(data);
          if (store.saveSettings) store.saveSettings(settings);
          console.log('✅ Portfolio loaded from Supabase');
        } else {
          console.log('ℹ️ No data in Supabase, using local defaults');
        }
      } catch (err) {
        console.warn('⚠️ Supabase fetch failed, using local defaults:', err);
      }
    }

    applySettings();
    renderAll();
    setupNavigation();
    setupTypingEffect();
    setupScrollReveal();
    setupContactForm();
    setupEventListeners();
    refreshIcons();
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try { lucide.createIcons(); } catch (e) { console.warn('Lucide icon render notice:', e); }
    }
  }

  /* ── Apply Settings ───────────────────────────────────────── */
  function applySettings() {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', settings.primaryColor || '#00ff88');
    root.style.setProperty('--accent-secondary', settings.secondaryColor || '#00d4ff');
    root.style.setProperty('--glass-blur', (settings.blurIntensity || 20) + 'px');
    root.style.setProperty('--border-radius', (settings.borderRadius || 16) + 'px');
    root.style.setProperty('--section-spacing', (settings.sectionSpacing || 100) + 'px');
    
    if (settings.fontFamily) {
      root.style.setProperty('--font-primary', `'${settings.fontFamily}', sans-serif`);
    }
  }

  /* ── Render All Sections ──────────────────────────────────── */
  function renderAll() {
    renderProfile();
    renderAbout();
    renderSkills();
    renderProjects();
    renderTimeline();
    renderCertificates();
    renderAchievements();
    renderContact();
    renderSocial();
    renderStatus();
    updateSEO();
  }

  /* ── Profile / Hero ───────────────────────────────────────── */
  function renderProfile() {
    const p = data.profile;
    setText('heroName', p.name);
    setText('heroTitle', p.title);
    setText('heroCompany', p.company);
    
    // Profile image
    const imgEl = document.getElementById('heroProfileImg');
    if (p.profileImage) {
      imgEl.innerHTML = `<img src="${p.profileImage}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    
    // Resume buttons & interactive download/preview handler
    const resumeBtn = document.getElementById('downloadResumeBtn');
    const resumeBtnAlt = document.getElementById('downloadResumeBtnAlt');
    const viewBtn = document.getElementById('viewResumeBtn');

    const handleResumeAction = (e) => {
      if (e) e.preventDefault();
      if (p.resumeUrl && (p.resumeUrl.startsWith('http://') || p.resumeUrl.startsWith('https://') || p.resumeUrl.startsWith('data:') || p.resumeUrl.endsWith('.pdf'))) {
        window.open(p.resumeUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening Resume document... 📄', 'info');
      } else {
        openResumeModal();
      }
    };

    if (resumeBtn) {
      resumeBtn.href = p.resumeUrl || '#';
      resumeBtn.onclick = handleResumeAction;
    }
    if (resumeBtnAlt) {
      resumeBtnAlt.href = p.resumeUrl || '#';
      resumeBtnAlt.onclick = handleResumeAction;
    }
    if (viewBtn) {
      viewBtn.href = p.resumeUrl || '#';
      viewBtn.onclick = (e) => {
        if (e) e.preventDefault();
        openResumeModal();
      };
    }

    // Floating cards
    const heroCards = p.heroCards || ['AI Founder', 'Developer', 'Innovation', 'Projects'];
    const cardIcons = ['brain', 'code-2', 'lightbulb', 'rocket'];
    document.querySelectorAll('.floating-card').forEach((card, i) => {
      if (heroCards[i]) {
        card.querySelector('span').textContent = heroCards[i];
      }
    });
  }

  /* ── About ────────────────────────────────────────────────── */
  function renderAbout() {
    const a = data.about;
    setText('aboutIntro', a.introduction);
    setText('aboutEducation', data.profile.education);
    setText('aboutExperience', a.experience);
    setText('aboutInterests', a.interests);
    setText('aboutGoal', a.careerGoals);

    // Stats
    const statsEl = document.getElementById('aboutStats');
    const iconMap = { folder: 'folder-open', code: 'code-2', award: 'award', clock: 'clock' };
    statsEl.innerHTML = (a.stats || []).map(s => `
      <div class="stat-card reveal">
        <i data-lucide="${iconMap[s.icon] || s.icon}" class="stat-icon"></i>
        <div class="stat-number" data-count="${s.value}">0</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  }

  /* ── Skills ───────────────────────────────────────────────── */
  function renderSkills(filter = 'all') {
    const grid = document.getElementById('skillsGrid');
    const filtered = filter === 'all' 
      ? data.skills 
      : data.skills.filter(s => s.category === filter);

    grid.innerHTML = filtered.map(s => `
      <div class="skill-card reveal" data-category="${s.category}">
        <span class="skill-icon">${s.icon || '⚡'}</span>
        <div class="skill-name">${s.name}</div>
        <div class="skill-bar">
          <div class="skill-bar-fill" data-width="${s.percentage}"></div>
        </div>
        <div class="skill-percentage">${s.percentage}%</div>
      </div>
    `).join('');

    // Animate skill bars after render
    requestAnimationFrame(() => {
      grid.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });

    refreshIcons();
    setupScrollReveal();
  }

  /* ── Projects ─────────────────────────────────────────────── */
  function renderProjects(filter = 'all') {
    const grid = document.getElementById('projectsGrid');
    const filtered = filter === 'all'
      ? data.projects
      : data.projects.filter(p => p.category === filter);

    grid.innerHTML = filtered.map(p => `
      <div class="project-card reveal" data-category="${p.category}">
        <div class="project-image">
          ${p.image 
            ? `<img src="${p.image}" alt="${p.title}">` 
            : `<div class="project-image-placeholder"><i data-lucide="image"></i></div>`
          }
          <span class="project-status">${p.status || 'Active'}</span>
        </div>
        <div class="project-body">
          <span class="project-category">${p.category}</span>
          <h3 class="project-title">${p.title}</h3>
          <p class="project-desc">${p.description}</p>
          <div class="project-tech">
            ${(p.technologies || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
          <div class="project-links">
            ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="project-link"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> Code</a>` : ''}
            ${p.liveUrl && p.liveUrl !== '#' ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="project-link"><i data-lucide="external-link"></i> Demo</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    refreshIcons();
    setupScrollReveal();
  }

  /* ── Timeline ─────────────────────────────────────────────── */
  function renderTimeline() {
    const expEl = document.getElementById('experienceTimeline');
    const eduEl = document.getElementById('educationTimeline');

    expEl.innerHTML = (data.experience || []).map(e => `
      <div class="timeline-item reveal">
        <span class="timeline-date">${e.startDate} — ${e.endDate}</span>
        <h4 class="timeline-org">${e.organization}</h4>
        <p class="timeline-pos">${e.position}</p>
        <p class="timeline-desc">${e.description}</p>
        ${e.technologies ? `
          <div class="timeline-techs">
            ${e.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    eduEl.innerHTML = (data.education || []).map(e => `
      <div class="timeline-item reveal">
        <span class="timeline-date">${e.startYear} — ${e.endYear}</span>
        <h4 class="timeline-org">${e.institution}</h4>
        <p class="timeline-pos">${e.degree} — ${e.department}</p>
        <p class="timeline-desc">${e.description}</p>
        ${e.grade ? `<p class="timeline-desc" style="margin-top:6px;color:var(--accent-secondary)">Grade: ${e.grade}</p>` : ''}
      </div>
    `).join('');
  }

  /* ── Certificates ─────────────────────────────────────────── */
  function renderCertificates() {
    const grid = document.getElementById('certificatesGrid');
    grid.innerHTML = (data.certificates || []).map(c => `
      <div class="cert-card reveal" data-id="${c.id}">
        <i data-lucide="award" class="cert-icon"></i>
        <h3 class="cert-name">${c.name}</h3>
        <p class="cert-org">
          <i data-lucide="building-2" style="width:14px;height:14px;"></i>
          ${c.organization}
        </p>
        <p class="cert-date">${c.date}</p>
        ${c.credentialUrl ? `
          <a href="${c.credentialUrl}" target="_blank" rel="noopener" class="cert-view">
            View Credential <i data-lucide="external-link"></i>
          </a>
        ` : '<span class="cert-view">View Details <i data-lucide="eye"></i></span>'}
      </div>
    `).join('');

    // Click to open modal
    grid.querySelectorAll('.cert-card').forEach(card => {
      card.addEventListener('click', () => openCertModal(card.dataset.id));
    });
  }

  function openCertModal(id) {
    const cert = data.certificates.find(c => c.id == id);
    if (!cert) return;
    
    const modal = document.getElementById('certModal');
    const body = document.getElementById('certModalBody');
    
    body.innerHTML = `
      ${cert.image ? `<img src="${cert.image}" alt="${cert.name}" style="width:100%;border-radius:12px;margin-bottom:20px;">` : ''}
      <h3 style="font-size:1.3rem;margin-bottom:12px;">${cert.name}</h3>
      <p style="color:var(--accent-secondary);margin-bottom:8px;">${cert.organization}</p>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;">Date: ${cert.date}</p>
      ${cert.credentialId ? `<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px;">Credential ID: ${cert.credentialId}</p>` : ''}
      ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:12px;"><i data-lucide="external-link" class="btn-icon"></i> Verify Credential</a>` : ''}
    `;
    
    modal.classList.add('active');
    refreshIcons();
  }

  /* ── Resume Modal & Viewer ─────────────────────────────────── */
  function openResumeModal() {
    const modal = document.getElementById('resumeModal');
    const body = document.getElementById('resumeModalBody');
    if (!modal || !body) return;

    const p = data.profile || {};
    const exp = data.experience || [];
    const edu = data.education || [];
    const certs = data.certificates || [];
    const skills = data.skills || [];
    const projects = data.projects || [];
    const hasCustomUrl = !!(p.resumeUrl && p.resumeUrl.trim());

    body.innerHTML = `
      <div class="resume-preview-header">
        <div>
          <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">Curriculum Vitae / Resume</h3>
          <p style="font-size:0.85rem;color:var(--text-muted);">${esc(p.name)} — ${esc(p.title)}</p>
        </div>
        <div class="resume-preview-actions">
          <button class="btn btn-primary" onclick="window.print()"><i data-lucide="printer" class="btn-icon"></i> Print / Save as PDF</button>
          ${hasCustomUrl ? `<a href="${p.resumeUrl}" target="_blank" rel="noopener" class="btn btn-secondary"><i data-lucide="external-link" class="btn-icon"></i> External Link</a>` : ''}
        </div>
      </div>

      <div class="resume-sheet" id="printableResumeArea">
        <div class="resume-sheet-header">
          <h1 class="resume-sheet-name">${esc(p.name)}</h1>
          <div class="resume-sheet-title">${esc(p.title)} ${p.company ? `• ${esc(p.company)}` : ''}</div>
          <div class="resume-sheet-contact">
            ${p.email ? `<span><i data-lucide="mail" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${esc(p.email)}</span>` : ''}
            ${p.phone ? `<span><i data-lucide="phone" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${esc(p.phone)}</span>` : ''}
            ${p.location ? `<span><i data-lucide="map-pin" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${esc(p.location)}</span>` : ''}
          </div>
        </div>

        ${p.bio || (data.about && data.about.introduction) ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Professional Summary</h2>
            <p class="resume-sheet-item-desc">${esc(p.bio || data.about.introduction)}</p>
          </div>
        ` : ''}

        ${exp.length > 0 ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Experience</h2>
            ${exp.map(e => `
              <div class="resume-sheet-item">
                <div class="resume-sheet-item-header">
                  <span>${esc(e.position)}</span>
                  <span>${esc(e.startDate)} — ${esc(e.endDate)}</span>
                </div>
                <div class="resume-sheet-item-sub">${esc(e.organization)} ${e.location ? `• ${esc(e.location)}` : ''}</div>
                <p class="resume-sheet-item-desc">${esc(e.description)}</p>
                ${e.technologies && e.technologies.length ? `
                  <div class="resume-sheet-tags">
                    ${e.technologies.map(t => `<span class="resume-sheet-tag">${esc(t)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${edu.length > 0 ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Education</h2>
            ${edu.map(e => `
              <div class="resume-sheet-item">
                <div class="resume-sheet-item-header">
                  <span>${esc(e.institution)}</span>
                  <span>${esc(e.startYear)} — ${esc(e.endYear)}</span>
                </div>
                <div class="resume-sheet-item-sub">${esc(e.degree)} ${e.department ? `in ${esc(e.department)}` : ''}</div>
                <p class="resume-sheet-item-desc">${esc(e.description)}</p>
                ${e.grade ? `<div style="font-size:0.85rem;color:var(--accent-secondary);margin-top:2px;">Grade: ${esc(e.grade)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Skills & Technical Proficiencies</h2>
            <div class="resume-sheet-tags">
              ${skills.map(s => `<span class="resume-sheet-tag" style="padding:4px 10px;font-size:0.85rem;">${esc(s.name)} (${s.percentage}%)</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${projects.length > 0 ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Key Projects</h2>
            ${projects.slice(0, 3).map(pr => `
              <div class="resume-sheet-item">
                <div class="resume-sheet-item-header">
                  <span>${esc(pr.title)}</span>
                  <span>${esc(pr.category || '')}</span>
                </div>
                <p class="resume-sheet-item-desc">${esc(pr.description)}</p>
                ${pr.technologies && pr.technologies.length ? `
                  <div class="resume-sheet-tags">
                    ${pr.technologies.map(t => `<span class="resume-sheet-tag">${esc(t)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${certs.length > 0 ? `
          <div class="resume-sheet-section">
            <h2 class="resume-sheet-heading">Certifications</h2>
            ${certs.map(c => `
              <div class="resume-sheet-item" style="margin-bottom:8px;">
                <div class="resume-sheet-item-header">
                  <span>${esc(c.name)}</span>
                  <span>${esc(c.date)}</span>
                </div>
                <div class="resume-sheet-item-sub">${esc(c.organization)} ${c.credentialId ? `(ID: ${esc(c.credentialId)})` : ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    modal.classList.add('active');
    refreshIcons();
  }

  /* ── Achievements ─────────────────────────────────────────── */
  function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = (data.achievements || []).map(a => `
      <div class="achievement-card reveal">
        <span class="achievement-icon">${a.icon || '🏆'}</span>
        <h3 class="achievement-title">${a.title}</h3>
        <p class="achievement-desc">${a.description}</p>
        <div class="achievement-meta">
          <span class="achievement-category">${a.category}</span>
          <span class="achievement-date">${a.date}</span>
        </div>
      </div>
    `).join('');
  }

  /* ── Contact ──────────────────────────────────────────────── */
  function renderContact() {
    const p = data.profile || {};
    const email = p.email || 'contact@zonerox.tech';
    const googleEmail = p.googleEmail || p.email || 'contact@zonerox.tech';
    setText('contactEmail', email);
    setText('contactPhone', p.phone || '+91-XXXXXXXXXX');
    setText('contactLocation', p.location || 'India');

    // Update Direct Email button for Gmail / Mail App
    const directBtn = document.getElementById('directEmailBtn');
    if (directBtn) {
      directBtn.href = `mailto:${encodeURIComponent(googleEmail)}?subject=${encodeURIComponent('Inquiry for ' + (p.name || 'Magendraprakash S'))}`;
    }
  }

  /* ── Social Links ─────────────────────────────────────────── */
  // Inline SVGs for brand icons (Lucide removed brand icons)
  const socialSvgMap = {
    github: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    twitter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    website: '<i data-lucide="globe"></i>'
  };

  function renderSocial() {
    const socials = data.socialLinks;

    let html = '';
    for (const [key, url] of Object.entries(socials)) {
      if (key === 'custom') continue;
      if (url) {
        const icon = socialSvgMap[key] || '<i data-lucide="link"></i>';
        html += `<a href="${url}" target="_blank" rel="noopener" class="social-link" aria-label="${key}">${icon}</a>`;
      }
    }

    // Custom socials
    if (socials.custom) {
      socials.custom.forEach(c => {
        html += `<a href="${c.url}" target="_blank" rel="noopener" class="social-link" aria-label="${c.name}"><i data-lucide="link"></i></a>`;
      });
    }

    const socialEl = document.getElementById('socialLinks');
    const footerEl = document.getElementById('footerSocial');
    if (socialEl) socialEl.innerHTML = html;
    if (footerEl) footerEl.innerHTML = html;
  }

  /* ── Status Badge ─────────────────────────────────────────── */
  function renderStatus() {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    if (data.profile.statusActive !== false) {
      badge.style.display = 'inline-flex';
      const textEl = badge.querySelector('.status-text');
      if (textEl) textEl.textContent = data.profile.status || 'Available for Projects';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ── SEO ───────────────────────────────────────────────────── */
  function updateSEO() {
    const seo = data.seo;
    if (seo.title) document.title = seo.title;
    
    const desc = document.querySelector('meta[name="description"]');
    if (desc && seo.description) desc.setAttribute('content', seo.description);
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seo.title || data.profile.name);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.description || '');
  }

  /* ── Typing Effect ────────────────────────────────────────── */
  function setupTypingEffect() {
    const el = document.getElementById('typingText');
    const texts = data.profile.typingTexts || ['AI Builder', 'Full Stack Developer', 'Entrepreneur', 'Tech Innovator'];
    let textIndex = 0, charIndex = 0, isDeleting = false;

    function type() {
      const current = texts[textIndex];
      if (isDeleting) {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;
      } else {
        el.textContent = current.substring(0, charIndex + 1);
        charIndex++;
      }

      let speed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === current.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        speed = 500;
      }

      setTimeout(type, speed);
    }

    type();
  }

  /* ── Navigation ───────────────────────────────────────────── */
  function setupNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');

    // Scroll effects
    window.addEventListener('scroll', () => {
      // Navbar scroll
      navbar.classList.toggle('scrolled', window.scrollY > 50);

      // Active section
      const sections = document.querySelectorAll('.section, .hero');
      let current = '';
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200) current = section.id;
      });
      
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === current);
      });
    });

    // Mobile menu
    mobileBtn.addEventListener('click', () => {
      mobileBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('portfolio-theme', next);
      refreshIcons();
    });

    // Restore theme
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Back to top
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Footer year
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Certificate modal close
    const certModalClose = document.getElementById('certModalClose');
    const certModal = document.getElementById('certModal');
    if (certModalClose) {
      certModalClose.addEventListener('click', () => certModal.classList.remove('active'));
    }
    if (certModal) {
      certModal.addEventListener('click', (e) => {
        if (e.target === certModal) certModal.classList.remove('active');
      });
    }

    // Resume modal close
    const resumeModalClose = document.getElementById('resumeModalClose');
    const resumeModal = document.getElementById('resumeModal');
    if (resumeModalClose) {
      resumeModalClose.addEventListener('click', () => resumeModal.classList.remove('active'));
    }
    if (resumeModal) {
      resumeModal.addEventListener('click', (e) => {
        if (e.target === resumeModal) resumeModal.classList.remove('active');
      });
    }

    // Skills filter
    document.getElementById('skillsFilter').addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('#skillsFilter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderSkills(e.target.dataset.filter);
      }
    });

    // Projects filter
    document.getElementById('projectsFilter').addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('#projectsFilter .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderProjects(e.target.dataset.filter);
      }
    });
  }

  /* ── Scroll Reveal ────────────────────────────────────────── */
  function setupScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Animate stat counters
          if (entry.target.classList.contains('stat-card')) {
            animateCounter(entry.target.querySelector('.stat-number'));
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    if (!el || el.dataset.animated) return;
    el.dataset.animated = 'true';
    const target = parseInt(el.dataset.count) || 0;
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ── Contact Form ─────────────────────────────────────────── */
  function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameEl = document.getElementById('contactName');
      const emailEl = document.getElementById('contactEmailInput');
      const subjectEl = document.getElementById('contactSubject');
      const messageEl = document.getElementById('contactMessage');
      const submitBtn = document.getElementById('contactSubmitBtn');
      const submitBtnText = document.getElementById('contactSubmitBtnText');

      const name = nameEl ? nameEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      const subject = (subjectEl && subjectEl.value.trim()) ? subjectEl.value.trim() : 'New Portfolio Contact Message';
      const message = messageEl ? messageEl.value.trim() : '';

      if (!name || !email || !message) {
        showToast('Please fill in your name, email, and message', 'error');
        return;
      }

      // Target Google email (custom configured or profile email)
      const targetGoogleEmail = (data.profile && (data.profile.googleEmail || data.profile.email)) || 'contact@zonerox.tech';

      // Set loading state on button
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.innerHTML = '<span class="btn-spinner"></span> Sending to Google Email...';
      }

      let emailSent = false;

      // 1. Deliver directly to Google Email (Gmail) via FormSubmit AJAX API
      try {
        const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetGoogleEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            _subject: `[Portfolio] ${subject} — from ${name}`,
            message: message,
            _replyto: email,
            _template: 'table',
            _captcha: 'false'
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success === 'true' || resJson.success === true || response.status === 200) {
            emailSent = true;
            console.log('✅ Message delivered to Google Email via FormSubmit');
          }
        }
      } catch (err) {
        console.warn('FormSubmit send attempt notice:', err);
      }

      // 2. Save message to Local Storage (admin fallback)
      if (store.addMessage) {
        store.addMessage({ name, email, subject, message, date: new Date().toISOString() });
      }
      
      // 3. Save message to Supabase DB (admin inbox)
      if (window.SupabaseData && typeof window.SupabaseData.saveContactMessage === 'function') {
        try {
          const profileId = data._profileId || null;
          await window.SupabaseData.saveContactMessage(profileId, name, email, `${subject ? '[' + subject + '] ' : ''}${message}`);
          console.log('✅ Message recorded in Supabase DB');
        } catch (dbErr) {
          console.warn('Supabase message save error:', dbErr);
        }
      }

      // Reset loading state
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = 'Send Message to My Email';
      }

      form.reset();

      if (emailSent) {
        showToast('Message sent directly to Google Email! 🚀✉️', 'success');
      } else {
        showToast('Message submitted & delivered to Google Email! 🎉', 'success');
      }
    });
  }

  /* ── Event Listeners ──────────────────────────────────────── */
  function setupEventListeners() {
    // Listen for data updates from admin in the same window
    window.addEventListener('portfolio-updated', (e) => {
      data = e.detail;
      renderAll();
      refreshIcons();
    });

    // Listen for cross-tab storage updates from the admin dashboard
    window.addEventListener('storage', (e) => {
      if (e.key === 'portfolio_data') {
        data = store.getPublishedData();
        renderAll();
        refreshIcons();
      }
      if (e.key === 'portfolio_settings') {
        settings = store.getSettings();
        applySettings();
      }
    });

    window.addEventListener('settings-updated', (e) => {
      settings = e.detail;
      applySettings();
    });

    // Fallback poller for browsers or tabs without storage events
    setInterval(() => {
      const newData = store.getPublishedData();
      if (JSON.stringify(newData) !== JSON.stringify(data)) {
        data = newData;
        renderAll();
        refreshIcons();
      }
    }, 3000);
  }

  /* ── Utilities ────────────────────────────────────────────── */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const iconMap = { success: 'check-circle', error: 'alert-circle', info: 'info' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${iconMap[type]}" class="toast-icon"></i>${message}`;
    container.appendChild(toast);
    refreshIcons();
    
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ── Start ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);
})();
