/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Main Application
   Auth powered by Supabase Auth (email/password)
   ═══════════════════════════════════════════════════════════════ */

(function() {
  const store = window.PortfolioStore;
  let draft, settings, currentPage = 'dashboard';

  /* ── Init ──────────────────────────────────────────────────── */
  async function init() {
    // Check for existing Supabase session
    const isAuthed = await store.isAuthenticated();
    
    // Hide loading screen
    document.getElementById('loadingScreen').style.display = 'none';
    
    if (isAuthed) {
      showDashboard();
    } else {
      showLogin();
    }
    
    setupAuth();
    setupSidebar();
    setupTopbar();
    lucide.createIcons();

    // Listen for auth state changes (token refresh, sign out from another tab, etc.)
    store.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        showLogin();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Session refreshed, stay logged in
      }
    });
  }

  /* ── Auth ──────────────────────────────────────────────────── */
  function setupAuth() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const submitBtn = document.getElementById('loginSubmitBtn');

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="auth-loading-spinner-inline"></span> Signing in...';
      errorEl.textContent = '';

      const result = await store.login(email, pass);
      
      if (result.success) {
        showDashboard();
        showToast('Welcome back! 🎉', 'success');
      } else {
        // Map common Supabase error messages to user-friendly text
        let errorMsg = result.error;
        if (errorMsg.includes('Invalid login credentials')) {
          errorMsg = 'Invalid email or password';
        } else if (errorMsg.includes('Email not confirmed')) {
          errorMsg = 'Please confirm your email address first';
        } else if (errorMsg.includes('Too many requests')) {
          errorMsg = 'Too many login attempts. Please wait a moment.';
        }
        errorEl.textContent = errorMsg;
      }

      // Reset button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="log-in" class="btn-icon"></i> Sign In';
      lucide.createIcons();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await store.logout();
      showLogin();
      showToast('Signed out successfully', 'info');
    });
  }

  function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'none';
    // Clear any previous error
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginPassword').value = '';
  }

  async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('loadingScreen').style.display = 'none';
    
    // Load data from Supabase (permanent storage) first
    if (window.SupabaseData) {
      try {
        const sbResult = await window.SupabaseData.fetchAllDataForAdmin();
        if (sbResult && sbResult.data) {
          draft = sbResult.data;
          settings = sbResult.settings || store.getSettings();
          // Sync to localStorage
          store.saveDraftData(draft);
          store.savePublishedData(draft);
          store.saveSettings(settings);
          console.log('✅ Admin: Loaded data from Supabase');
        } else {
          draft = store.getDraftData();
          settings = store.getSettings();
          console.log('ℹ️ No data in Supabase yet, using local defaults');
        }
      } catch (err) {
        console.warn('⚠️ Supabase load failed, using local data:', err);
        draft = store.getDraftData();
        settings = store.getSettings();
      }
    } else {
      draft = store.getDraftData();
      settings = store.getSettings();
    }
    
    navigateTo('dashboard');
    updateMsgCount();
  }

  /* ── Sidebar Navigation ────────────────────────────────────── */
  function setupSidebar() {
    document.getElementById('sidebarNav').addEventListener('click', e => {
      const link = e.target.closest('.sidebar-link');
      if (!link || link.classList.contains('logout-btn')) return;
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });

    const toggle = document.getElementById('sidebarToggle');
    toggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
    document.getElementById('sidebar').classList.remove('open');

    const titles = {
      dashboard: 'Dashboard', profile: 'Profile Editor', about: 'About Editor',
      skills: 'Skills Editor', projects: 'Projects Editor', experience: 'Experience Editor',
      education: 'Education Editor', certificates: 'Certificates Editor', achievements: 'Achievements Editor',
      resume: 'Resume Manager', social: 'Social Links', messages: 'Messages',
      seo: 'SEO Settings', design: 'Design Studio', settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    renderPage(page);
    lucide.createIcons();
  }

  /* ── Topbar ────────────────────────────────────────────────── */
  function setupTopbar() {
    document.getElementById('publishBtn').addEventListener('click', async () => {
      // Publish to localStorage first
      store.publishDraft();
      updateDraftIndicator();
      
      // Publish to Supabase (permanent database)
      if (window.SupabaseData) {
        showToast('Publishing to database...', 'info');
        const result = await window.SupabaseData.publishToSupabase(draft, settings);
        if (result.success) {
          // Store the profileId for future operations
          if (result.profileId && !draft._profileId) {
            draft._profileId = result.profileId;
            store.saveDraftData(draft);
            store.savePublishedData(draft);
          }
          showToast('Changes published permanently! 🚀', 'success');
        } else {
          showToast('Published locally. Database error: ' + (result.error || 'Unknown'), 'error');
        }
      } else {
        showToast('Changes published! 🚀', 'success');
      }
      
      refreshPreview();
    });

    document.getElementById('previewBtn').addEventListener('click', () => {
      const panel = document.getElementById('previewPanel');
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      refreshPreview();
    });

    document.getElementById('previewClose').addEventListener('click', () => {
      document.getElementById('previewPanel').style.display = 'none';
    });
  }

  function updateDraftIndicator() {
    document.getElementById('draftIndicator').style.display = store.hasDraftChanges() ? 'flex' : 'none';
  }

  function refreshPreview() {
    const frame = document.getElementById('previewFrame');
    if (frame) frame.contentWindow.location.reload();
  }

  function saveDraft() {
    store.saveDraftData(draft);
    updateDraftIndicator();
    showToast('Draft saved', 'info');
  }

  async function updateMsgCount() {
    let msgs = store.getMessages();
    // Try to get count from Supabase
    if (window.SupabaseData) {
      try {
        const sbMsgs = await window.SupabaseData.fetchMessagesFromDB(draft._profileId);
        if (sbMsgs && sbMsgs.length > 0) {
          msgs = sbMsgs;
        }
      } catch(e) { /* fall through to localStorage */ }
    }
    const unread = msgs.filter(m => !m.read).length;
    document.getElementById('msgCount').textContent = unread;
    document.getElementById('msgCount').style.display = unread > 0 ? 'inline' : 'none';
  }

  /* ── Page Router ───────────────────────────────────────────── */
  function renderPage(page) {
    const el = document.getElementById('pageContent');
    draft = store.getDraftData();
    const renderers = {
      dashboard: renderDashboard, profile: renderProfile, about: renderAbout,
      skills: renderSkills, projects: renderProjects, experience: renderExperience,
      education: renderEducation, certificates: renderCertificates, achievements: renderAchievements,
      resume: renderResume, social: renderSocial, messages: renderMessages,
      seo: renderSEO, design: renderDesign, settings: renderSettings
    };
    if (renderers[page]) renderers[page](el);
    lucide.createIcons();
  }

  /* ── Dashboard Page ────────────────────────────────────────── */
  function renderDashboard(el) {
    const msgs = store.getMessages();
    el.innerHTML = `
      <div class="dash-grid">
        <div class="dash-card" onclick="document.querySelector('[data-page=skills]').click()">
          <i data-lucide="code-2" class="dash-card-icon"></i>
          <div class="dash-card-number">${draft.skills.length}</div>
          <div class="dash-card-label">Skills</div>
        </div>
        <div class="dash-card" onclick="document.querySelector('[data-page=projects]').click()">
          <i data-lucide="folder-open" class="dash-card-icon"></i>
          <div class="dash-card-number">${draft.projects.length}</div>
          <div class="dash-card-label">Projects</div>
        </div>
        <div class="dash-card" onclick="document.querySelector('[data-page=certificates]').click()">
          <i data-lucide="award" class="dash-card-icon"></i>
          <div class="dash-card-number">${draft.certificates.length}</div>
          <div class="dash-card-label">Certificates</div>
        </div>
        <div class="dash-card" onclick="document.querySelector('[data-page=messages]').click()">
          <i data-lucide="inbox" class="dash-card-icon"></i>
          <div class="dash-card-number">${msgs.filter(m=>!m.read).length}</div>
          <div class="dash-card-label">Unread Messages</div>
        </div>
        <div class="dash-card" onclick="document.querySelector('[data-page=achievements]').click()">
          <i data-lucide="trophy" class="dash-card-icon"></i>
          <div class="dash-card-number">${draft.achievements.length}</div>
          <div class="dash-card-label">Achievements</div>
        </div>
        <div class="dash-card" onclick="document.querySelector('[data-page=experience]').click()">
          <i data-lucide="briefcase" class="dash-card-icon"></i>
          <div class="dash-card-number">${draft.experience.length}</div>
          <div class="dash-card-label">Experience</div>
        </div>
      </div>
      <div class="glass-card" style="margin-top:8px;">
        <h3 style="margin-bottom:12px;font-size:1rem;">Quick Actions</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-page=profile]').click()">
            <i data-lucide="user" class="btn-icon"></i> Edit Profile
          </button>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('[data-page=design]').click()">
            <i data-lucide="palette" class="btn-icon"></i> Design Studio
          </button>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('previewBtn').click()">
            <i data-lucide="eye" class="btn-icon"></i> Preview Site
          </button>
        </div>
      </div>`;
  }

  /* ── Profile Editor ────────────────────────────────────────── */
  function renderProfile(el) {
    const p = draft.profile;
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="user"></i> Profile Information</div>
        <div class="form-row"><div class="form-group"><label>Full Name</label><input id="pName" value="${esc(p.name)}"></div>
        <div class="form-group"><label>Job Title</label><input id="pTitle" value="${esc(p.title)}"></div></div>
        <div class="form-row"><div class="form-group"><label>Company</label><input id="pCompany" value="${esc(p.company)}"></div>
        <div class="form-group"><label>Company Role</label><input id="pRole" value="${esc(p.companyRole)}"></div></div>
        <div class="form-row"><div class="form-group"><label>Email</label><input id="pEmail" value="${esc(p.email)}"></div>
        <div class="form-group"><label>Phone</label><input id="pPhone" value="${esc(p.phone)}"></div></div>
        <div class="form-row"><div class="form-group"><label>Location</label><input id="pLocation" value="${esc(p.location)}"></div>
        <div class="form-group"><label>Education</label><input id="pEdu" value="${esc(p.education)}"></div></div>
        <div class="form-group"><label>Biography</label><textarea id="pBio" rows="4">${esc(p.bio)}</textarea></div>
        <div class="form-row"><div class="form-group"><label>Status Text</label><input id="pStatus" value="${esc(p.status)}"></div>
        <div class="form-group"><label>Status Active</label><select id="pStatusActive"><option value="true" ${p.statusActive?'selected':''}>Active</option><option value="false" ${!p.statusActive?'selected':''}>Hidden</option></select></div></div>
        <div class="form-group"><label>Profile Image URL</label><input id="pImage" value="${esc(p.profileImage)}" placeholder="https://..."></div>
        <div class="form-group"><label>Typing Texts (comma separated)</label><input id="pTyping" value="${esc((p.typingTexts||[]).join(', '))}"></div>
        <div class="form-group"><label>Hero Cards (comma separated)</label><input id="pCards" value="${esc((p.heroCards||[]).join(', '))}"></div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="window._discardDraft()">Discard</button>
          <button class="btn btn-primary" onclick="window._saveProfile()"><i data-lucide="save" class="btn-icon"></i> Save Draft</button>
        </div>
      </div>`;
    
    window._saveProfile = () => {
      draft.profile.name = v('pName'); draft.profile.title = v('pTitle');
      draft.profile.company = v('pCompany'); draft.profile.companyRole = v('pRole');
      draft.profile.email = v('pEmail'); draft.profile.phone = v('pPhone');
      draft.profile.location = v('pLocation'); draft.profile.education = v('pEdu');
      draft.profile.bio = v('pBio'); draft.profile.status = v('pStatus');
      draft.profile.statusActive = v('pStatusActive') === 'true';
      draft.profile.profileImage = v('pImage');
      draft.profile.typingTexts = v('pTyping').split(',').map(s=>s.trim()).filter(Boolean);
      draft.profile.heroCards = v('pCards').split(',').map(s=>s.trim()).filter(Boolean);
      saveDraft();
    };
  }

  /* ── About Editor ──────────────────────────────────────────── */
  function renderAbout(el) {
    const a = draft.about;
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="info"></i> About Section</div>
        <div class="form-group"><label>Introduction</label><textarea id="aIntro" rows="4">${esc(a.introduction)}</textarea></div>
        <div class="form-group"><label>Experience Summary</label><textarea id="aExp" rows="2">${esc(a.experience)}</textarea></div>
        <div class="form-group"><label>Interests</label><input id="aInt" value="${esc(a.interests)}"></div>
        <div class="form-group"><label>Career Goals</label><textarea id="aGoal" rows="2">${esc(a.careerGoals)}</textarea></div>
        <div class="form-group"><label>Professional Summary</label><input id="aSum" value="${esc(a.summary)}"></div>
      </div>
      <div class="glass-card editor-section" style="margin-top:20px;">
        <div class="editor-section-title"><i data-lucide="bar-chart-3"></i> Statistics</div>
        <div id="statsEditor">${(a.stats||[]).map((s,i)=>`
          <div class="item-row">
            <div class="item-info" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <input style="width:140px" value="${esc(s.label)}" class="stat-label-input" data-i="${i}" placeholder="Label">
              <input style="width:60px" type="number" value="${s.value}" class="stat-value-input" data-i="${i}" placeholder="Value">
              <input style="width:80px" value="${esc(s.icon)}" class="stat-icon-input" data-i="${i}" placeholder="Icon">
            </div>
            <button class="item-btn delete" onclick="window._delStat(${i})"><i data-lucide="trash-2"></i></button>
          </div>`).join('')}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:12px;" onclick="window._addStat()"><i data-lucide="plus" class="btn-icon"></i> Add Stat</button>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="window._discardDraft()">Discard</button>
          <button class="btn btn-primary" onclick="window._saveAbout()"><i data-lucide="save" class="btn-icon"></i> Save Draft</button>
        </div>
      </div>`;

    window._saveAbout = () => {
      draft.about.introduction = v('aIntro'); draft.about.experience = v('aExp');
      draft.about.interests = v('aInt'); draft.about.careerGoals = v('aGoal');
      draft.about.summary = v('aSum');
      draft.about.stats = [...document.querySelectorAll('.stat-label-input')].map((el,i) => ({
        label: el.value, value: parseInt(document.querySelectorAll('.stat-value-input')[i].value)||0,
        icon: document.querySelectorAll('.stat-icon-input')[i].value
      }));
      saveDraft();
    };
    window._addStat = () => { draft.about.stats.push({label:'New Stat',value:0,icon:'star'}); store.saveDraftData(draft); renderAbout(document.getElementById('pageContent')); lucide.createIcons(); };
    window._delStat = (i) => { draft.about.stats.splice(i,1); store.saveDraftData(draft); renderAbout(document.getElementById('pageContent')); lucide.createIcons(); };
  }

  /* ── Skills Editor ─────────────────────────────────────────── */
  function renderSkills(el) {
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="editor-section-title" style="margin:0;"><i data-lucide="code-2"></i> Skills</div>
          <button class="btn btn-primary btn-sm" onclick="window._addSkill()"><i data-lucide="plus" class="btn-icon"></i> Add Skill</button>
        </div>
        <div class="item-list" id="skillsList">
          ${draft.skills.map(s => `
            <div class="item-row">
              <span class="item-icon">${s.icon||'⚡'}</span>
              <div class="item-info">
                <div class="item-name">${esc(s.name)}</div>
                <div class="item-meta">${s.category} · ${s.percentage}%</div>
              </div>
              <div class="item-actions">
                <button class="item-btn" onclick="window._editSkill('${s.id}')"><i data-lucide="pencil"></i></button>
                <button class="item-btn delete" onclick="window._delSkill('${s.id}')"><i data-lucide="trash-2"></i></button>
              </div>
            </div>`).join('')}
          ${draft.skills.length===0?'<div class="empty-state"><i data-lucide="code-2" class="empty-state-icon"></i><p>No skills yet</p></div>':''}
        </div>
      </div>`;

    window._addSkill = () => openSkillModal();
    window._editSkill = (id) => openSkillModal(draft.skills.find(s=>String(s.id)===String(id)));
    window._delSkill = (id) => { draft.skills = draft.skills.filter(s=>String(s.id)!==String(id)); saveDraft(); renderSkills(el); lucide.createIcons(); };
  }

  function openSkillModal(skill) {
    const isEdit = !!skill;
    const s = skill || { id: Date.now(), name:'', category:'Programming', percentage:50, icon:'⚡' };
    showModal(`${isEdit?'Edit':'Add'} Skill`, `
      <div class="form-group"><label>Name</label><input id="skName" value="${esc(s.name)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Category</label>
          <select id="skCat"><option ${s.category==='Programming'?'selected':''}>Programming</option><option ${s.category==='Web Development'?'selected':''}>Web Development</option><option ${s.category==='Database'?'selected':''}>Database</option><option ${s.category==='AI / Data'?'selected':''}>AI / Data</option><option ${s.category==='Tools'?'selected':''}>Tools</option></select>
        </div>
        <div class="form-group"><label>Percentage</label><input type="number" id="skPct" value="${s.percentage}" min="0" max="100"></div>
      </div>
      <div class="form-group"><label>Icon (emoji)</label><input id="skIcon" value="${esc(s.icon)}"></div>
    `, () => {
      s.name = v('skName'); s.category = v('skCat'); s.percentage = parseInt(v('skPct'))||0; s.icon = v('skIcon');
      if (!isEdit) draft.skills.push(s); saveDraft(); renderSkills(document.getElementById('pageContent')); lucide.createIcons();
    });
  }

  /* ── Projects Editor ───────────────────────────────────────── */
  function renderProjects(el) {
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="editor-section-title" style="margin:0;"><i data-lucide="folder-open"></i> Projects</div>
          <button class="btn btn-primary btn-sm" onclick="window._addProject()"><i data-lucide="plus" class="btn-icon"></i> Add Project</button>
        </div>
        <div class="item-list">
          ${draft.projects.map(p => `
            <div class="item-row">
              <div class="item-info">
                <div class="item-name">${esc(p.title)}</div>
                <div class="item-meta">${p.category} · ${p.status} · ${(p.technologies||[]).join(', ')}</div>
              </div>
              <div class="item-actions">
                <button class="item-btn" onclick="window._editProject('${p.id}')"><i data-lucide="pencil"></i></button>
                <button class="item-btn delete" onclick="window._delProject('${p.id}')"><i data-lucide="trash-2"></i></button>
              </div>
            </div>`).join('')}
          ${draft.projects.length===0?'<div class="empty-state"><p>No projects yet</p></div>':''}
        </div>
      </div>`;

    window._addProject = () => openProjectModal();
    window._editProject = (id) => openProjectModal(draft.projects.find(p=>String(p.id)===String(id)));
    window._delProject = (id) => { draft.projects = draft.projects.filter(p=>String(p.id)!==String(id)); saveDraft(); renderProjects(el); lucide.createIcons(); };
  }

  function openProjectModal(proj) {
    const isEdit = !!proj;
    const p = proj || { id:Date.now(), title:'', description:'', image:'', technologies:[], githubUrl:'', liveUrl:'', category:'Web', status:'Active', order:draft.projects.length+1 };
    showModal(`${isEdit?'Edit':'Add'} Project`, `
      <div class="form-group"><label>Title</label><input id="prTitle" value="${esc(p.title)}"></div>
      <div class="form-group"><label>Description</label><textarea id="prDesc" rows="3">${esc(p.description)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Category</label><select id="prCat"><option ${p.category==='Web'?'selected':''}>Web</option><option ${p.category==='AI'?'selected':''}>AI</option><option ${p.category==='Mobile'?'selected':''}>Mobile</option><option ${p.category==='Software'?'selected':''}>Software</option></select></div>
        <div class="form-group"><label>Status</label><select id="prStatus"><option ${p.status==='Active'?'selected':''}>Active</option><option ${p.status==='Completed'?'selected':''}>Completed</option><option ${p.status==='In Progress'?'selected':''}>In Progress</option></select></div>
      </div>
      <div class="form-group"><label>Technologies (comma separated)</label><input id="prTech" value="${(p.technologies||[]).join(', ')}"></div>
      <div class="form-group"><label>GitHub URL</label><input id="prGH" value="${esc(p.githubUrl)}"></div>
      <div class="form-group"><label>Live Demo URL</label><input id="prLive" value="${esc(p.liveUrl)}"></div>
      <div class="form-group"><label>Image URL</label><input id="prImg" value="${esc(p.image)}"></div>
    `, () => {
      p.title=v('prTitle'); p.description=v('prDesc'); p.category=v('prCat'); p.status=v('prStatus');
      p.technologies=v('prTech').split(',').map(s=>s.trim()).filter(Boolean);
      p.githubUrl=v('prGH'); p.liveUrl=v('prLive'); p.image=v('prImg');
      if(!isEdit) draft.projects.push(p); saveDraft(); renderProjects(document.getElementById('pageContent')); lucide.createIcons();
    });
  }

  /* ── Experience Editor ─────────────────────────────────────── */
  function renderExperience(el) { renderListEditor(el, 'experience', 'Experience', 'briefcase', ['organization','position','startDate','endDate','description','location'], (e)=>`${e.position} at ${e.organization}`, (e)=>`${e.startDate} — ${e.endDate}`); }
  function renderEducation(el) { renderListEditor(el, 'education', 'Education', 'graduation-cap', ['institution','degree','department','startYear','endYear','description','grade'], (e)=>`${e.degree} — ${e.department}`, (e)=>`${e.institution} · ${e.startYear}-${e.endYear}`); }
  function renderCertificates(el) { renderListEditor(el, 'certificates', 'Certificates', 'award', ['name','organization','date','credentialId','credentialUrl','image'], (e)=>e.name, (e)=>`${e.organization} · ${e.date}`); }
  function renderAchievements(el) { renderListEditor(el, 'achievements', 'Achievements', 'trophy', ['title','description','category','date','icon'], (e)=>e.title, (e)=>`${e.category} · ${e.date}`); }

  function renderListEditor(el, key, label, icon, fields, nameGetter, metaGetter) {
    const items = draft[key] || [];
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="editor-section-title" style="margin:0;"><i data-lucide="${icon}"></i> ${label}</div>
          <button class="btn btn-primary btn-sm" onclick="window._addItem()"><i data-lucide="plus" class="btn-icon"></i> Add</button>
        </div>
        <div class="item-list">
          ${items.map(item => `<div class="item-row">
            ${item.icon?`<span class="item-icon">${item.icon}</span>`:''}
            <div class="item-info"><div class="item-name">${esc(nameGetter(item))}</div><div class="item-meta">${esc(metaGetter(item))}</div></div>
            <div class="item-actions">
              <button class="item-btn" onclick="window._editItem('${item.id}')"><i data-lucide="pencil"></i></button>
              <button class="item-btn delete" onclick="window._deleteItem('${item.id}')"><i data-lucide="trash-2"></i></button>
            </div>
          </div>`).join('')}
          ${items.length===0?`<div class="empty-state"><p>No ${label.toLowerCase()} yet</p></div>`:''}
        </div>
      </div>`;

    window._addItem = () => openGenericModal(key, fields, label);
    window._editItem = (id) => openGenericModal(key, fields, label, items.find(i=>String(i.id)===String(id)));
    window._deleteItem = (id) => { draft[key] = draft[key].filter(i=>String(i.id)!==String(id)); saveDraft(); renderPage(currentPage); lucide.createIcons(); };
  }

  function openGenericModal(key, fields, label, item) {
    const isEdit = !!item;
    const obj = item || { id: Date.now(), order: (draft[key]||[]).length+1 };
    fields.forEach(f => { if (obj[f] === undefined) obj[f] = ''; });

    const formHtml = fields.map(f => {
      const lbl = f.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
      const isTextarea = ['description','bio'].includes(f);
      return `<div class="form-group"><label>${lbl}</label>${isTextarea?`<textarea id="gen_${f}" rows="3">${esc(obj[f])}</textarea>`:`<input id="gen_${f}" value="${esc(obj[f]||'')}">`}</div>`;
    }).join('');

    showModal(`${isEdit?'Edit':'Add'} ${label.replace(/s$/,'')}`, formHtml, () => {
      fields.forEach(f => { obj[f] = v('gen_'+f); });
      if (!isEdit) { if (!draft[key]) draft[key]=[]; draft[key].push(obj); }
      saveDraft(); renderPage(currentPage); lucide.createIcons();
    });
  }

  /* ── Resume ────────────────────────────────────────────────── */
  function renderResume(el) {
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="file-text"></i> Resume Manager</div>
        <div class="form-group"><label>Resume URL / Link</label><input id="resumeUrl" value="${esc(draft.profile.resumeUrl||'')}" placeholder="https://drive.google.com/..."></div>
        <p style="font-size:0.8rem;color:var(--text-muted);margin:8px 0;">Upload your resume to Google Drive or Dropbox and paste the public link here.</p>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="draft.profile.resumeUrl=v('resumeUrl');saveDraft();"><i data-lucide="save" class="btn-icon"></i> Save</button>
        </div>
      </div>`;
  }

  /* ── Social Links ──────────────────────────────────────────── */
  function renderSocial(el) {
    const s = draft.socialLinks;
    const links = ['github','linkedin','instagram','youtube','twitter','facebook','website'];
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="share-2"></i> Social Links</div>
        ${links.map(l=>`<div class="form-group"><label>${l.charAt(0).toUpperCase()+l.slice(1)}</label><input id="social_${l}" value="${esc(s[l]||'')}"></div>`).join('')}
        <div class="form-actions">
          <button class="btn btn-primary" onclick="window._saveSocial()"><i data-lucide="save" class="btn-icon"></i> Save Draft</button>
        </div>
      </div>`;
    window._saveSocial = () => { links.forEach(l=>{draft.socialLinks[l]=v('social_'+l);}); saveDraft(); };
  }

  /* ── Messages ──────────────────────────────────────────────── */
  async function renderMessages(el) {
    // Load messages from Supabase first, fall back to localStorage
    let msgs = store.getMessages();
    if (window.SupabaseData) {
      try {
        const sbMsgs = await window.SupabaseData.fetchMessagesFromDB(draft._profileId);
        if (sbMsgs && sbMsgs.length > 0) {
          msgs = sbMsgs;
        }
      } catch(e) { /* fall through */ }
    }
    
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="inbox"></i> Messages (${msgs.length})</div>
        <div class="messages-list">
          ${msgs.map(m=>`
            <div class="message-row ${m.read?'':'unread'}" onclick="window._openMsg('${m.id}')">
              <div class="message-indicator"></div>
              <div class="message-body">
                <div class="message-name">${esc(m.name)}</div>
                <div class="message-email">${esc(m.email)}</div>
                <div class="message-preview">${esc(m.message)}</div>
              </div>
              <div class="message-meta">
                <div class="message-date">${new Date(m.date).toLocaleDateString()}</div>
                <button class="item-btn delete" style="margin-top:4px;" onclick="event.stopPropagation();window._delMsg('${m.id}')"><i data-lucide="trash-2"></i></button>
              </div>
            </div>`).join('')}
          ${msgs.length===0?'<div class="empty-state"><i data-lucide="inbox" class="empty-state-icon"></i><p>No messages yet</p></div>':''}
        </div>
      </div>`;

    // Store msgs reference for modal access
    window._currentMsgs = msgs;

    window._openMsg = async (id) => {
      store.markMessageRead(id); 
      if (window.SupabaseData) await window.SupabaseData.markMessageReadInDB(id);
      updateMsgCount();
      const m = window._currentMsgs.find(x => x.id == id);
      if(m) showModal('Message', `<p><strong>From:</strong> ${esc(m.name)} &lt;${esc(m.email)}&gt;</p><p style="color:var(--text-muted);font-size:0.8rem;">${new Date(m.date).toLocaleString()}</p><hr style="border-color:var(--glass-border);margin:12px 0;"><p style="white-space:pre-wrap;">${esc(m.message)}</p>`);
      renderMessages(el); lucide.createIcons();
    };
    window._delMsg = async (id) => { 
      store.deleteMessage(id); 
      if (window.SupabaseData) await window.SupabaseData.deleteMessageFromDB(id);
      updateMsgCount(); renderMessages(el); lucide.createIcons(); 
    };
  }

  /* ── SEO ────────────────────────────────────────────────────── */
  function renderSEO(el) {
    const s = draft.seo;
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="search"></i> SEO Settings</div>
        <div class="form-group"><label>Page Title</label><input id="seoTitle" value="${esc(s.title)}"></div>
        <div class="form-group"><label>Meta Description</label><textarea id="seoDesc" rows="3">${esc(s.description)}</textarea></div>
        <div class="form-group"><label>Keywords</label><input id="seoKeywords" value="${esc(s.keywords||'')}"></div>
        <div class="form-group"><label>OG Image URL</label><input id="seoOG" value="${esc(s.ogImage||'')}"></div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="window._saveSEO()"><i data-lucide="save" class="btn-icon"></i> Save Draft</button>
        </div>
      </div>`;
    window._saveSEO = () => { draft.seo.title=v('seoTitle'); draft.seo.description=v('seoDesc'); draft.seo.keywords=v('seoKeywords'); draft.seo.ogImage=v('seoOG'); saveDraft(); };
  }

  /* ── Design Studio ─────────────────────────────────────────── */
  function renderDesign(el) {
    const s = settings;
    el.innerHTML = `
      <div class="glass-card editor-section">
        <div class="editor-section-title"><i data-lucide="palette"></i> Design Studio</div>
        <div class="design-controls">
          <div class="design-control"><div class="design-label">Primary Color</div><input type="color" id="dPrimary" value="${s.primaryColor}"></div>
          <div class="design-control"><div class="design-label">Secondary Color</div><input type="color" id="dSecondary" value="${s.secondaryColor}"></div>
          <div class="design-control"><div class="design-label">Glass Opacity: <span class="range-value" id="dOpacityVal">${s.glassOpacity}</span></div><input type="range" id="dOpacity" min="0" max="0.3" step="0.01" value="${s.glassOpacity}"></div>
          <div class="design-control"><div class="design-label">Blur Intensity: <span class="range-value" id="dBlurVal">${s.blurIntensity}px</span></div><input type="range" id="dBlur" min="0" max="40" value="${s.blurIntensity}"></div>
          <div class="design-control"><div class="design-label">Border Radius: <span class="range-value" id="dRadiusVal">${s.borderRadius}px</span></div><input type="range" id="dRadius" min="0" max="32" value="${s.borderRadius}"></div>
          <div class="design-control"><div class="design-label">Particle Density: <span class="range-value" id="dParticleVal">${s.particleDensity}</span></div><input type="range" id="dParticle" min="10" max="200" value="${s.particleDensity}"></div>
          <div class="design-control"><div class="design-label">Animation Speed: <span class="range-value" id="dSpeedVal">${s.animationSpeed}x</span></div><input type="range" id="dSpeed" min="0.1" max="3" step="0.1" value="${s.animationSpeed}"></div>
          <div class="design-control"><div class="design-label">Section Spacing: <span class="range-value" id="dSpacingVal">${s.sectionSpacing}px</span></div><input type="range" id="dSpacing" min="40" max="160" value="${s.sectionSpacing}"></div>
        </div>
        <div class="form-actions" style="margin-top:24px;">
          <button class="btn btn-secondary" onclick="window._resetDesign()">Reset Defaults</button>
          <button class="btn btn-primary" onclick="window._saveDesign()"><i data-lucide="save" class="btn-icon"></i> Save Settings</button>
        </div>
      </div>`;

    // Live range updates
    ['dOpacity','dBlur','dRadius','dParticle','dSpeed','dSpacing'].forEach(id => {
      const input = document.getElementById(id);
      if(input) input.addEventListener('input', () => {
        const valEl = document.getElementById(id+'Val');
        if(valEl) valEl.textContent = input.value + (['dBlur','dRadius','dSpacing'].includes(id)?'px':id==='dSpeed'?'x':'');
      });
    });

    window._saveDesign = async () => {
      settings.primaryColor=v('dPrimary'); settings.secondaryColor=v('dSecondary');
      settings.glassOpacity=parseFloat(v('dOpacity')); settings.blurIntensity=parseInt(v('dBlur'));
      settings.borderRadius=parseInt(v('dRadius')); settings.particleDensity=parseInt(v('dParticle'));
      settings.animationSpeed=parseFloat(v('dSpeed')); settings.sectionSpacing=parseInt(v('dSpacing'));
      store.saveSettings(settings); showToast('Design saved locally. Click Publish to save permanently.','success');
    };
    window._resetDesign = () => { settings=store.getDefaultSettings(); store.saveSettings(settings); renderDesign(el); lucide.createIcons(); showToast('Reset to defaults','info'); };
  }

  /* ── Settings (with Auth Management) ────────────────────────── */
  function renderSettings(el) {
    // Get current user info asynchronously
    store.getUser().then(user => {
      const userEmail = user ? user.email : 'Unknown';
      const userName = user ? (user.user_metadata?.name || user.email) : 'Admin';

      el.innerHTML = `
        <div class="glass-card editor-section">
          <div class="editor-section-title"><i data-lucide="shield"></i> Authentication</div>
          <div class="auth-info-card">
            <div class="auth-info-row">
              <span class="auth-info-label"><i data-lucide="mail" style="width:16px;height:16px;vertical-align:-3px;"></i> Email</span>
              <span class="auth-info-value">${esc(userEmail)}</span>
            </div>
            <div class="auth-info-row">
              <span class="auth-info-label"><i data-lucide="user" style="width:16px;height:16px;vertical-align:-3px;"></i> Account</span>
              <span class="auth-info-value">${esc(userName)}</span>
            </div>
            <div class="auth-info-row">
              <span class="auth-info-label"><i data-lucide="shield-check" style="width:16px;height:16px;vertical-align:-3px;"></i> Provider</span>
              <span class="auth-info-value">Supabase Auth (Email/Password)</span>
            </div>
          </div>
        </div>

        <div class="glass-card editor-section" style="margin-top:20px;">
          <div class="editor-section-title"><i data-lucide="key"></i> Change Password</div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="newPassword" placeholder="Enter new password (min 6 characters)" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm new password" autocomplete="new-password">
          </div>
          <div class="settings-password-error" id="passwordError" style="color:#ff4444;font-size:0.85rem;margin-bottom:8px;"></div>
          <div class="form-actions">
            <button class="btn btn-primary" id="changePasswordBtn" onclick="window._changePassword()">
              <i data-lucide="key" class="btn-icon"></i> Update Password
            </button>
          </div>
        </div>

        <div class="glass-card editor-section" style="margin-top:20px;">
          <div class="editor-section-title"><i data-lucide="database"></i> Data Management</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window._exportData()"><i data-lucide="download" class="btn-icon"></i> Export Data</button>
            <button class="btn btn-danger btn-sm" onclick="window._resetData()"><i data-lucide="alert-triangle" class="btn-icon"></i> Reset All Data</button>
          </div>
        </div>`;

      lucide.createIcons();
    });

    window._changePassword = async () => {
      const newPw = v('newPassword');
      const confirmPw = v('confirmPassword');
      const errorEl = document.getElementById('passwordError');
      const btn = document.getElementById('changePasswordBtn');

      if (!newPw || newPw.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
      }
      if (newPw !== confirmPw) {
        errorEl.textContent = 'Passwords do not match';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="auth-loading-spinner-inline"></span> Updating...';
      errorEl.textContent = '';

      const result = await store.updatePassword(newPw);
      
      if (result.success) {
        showToast('Password updated successfully! 🔐', 'success');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        errorEl.textContent = result.error;
        showToast('Failed to update password', 'error');
      }

      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="key" class="btn-icon"></i> Update Password';
      lucide.createIcons();
    };

    window._exportData = () => {
      const blob = new Blob([JSON.stringify(draft,null,2)], {type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='portfolio-data.json'; a.click();
      showToast('Data exported','success');
    };
    window._resetData = () => { if(confirm('Reset ALL data to defaults? This cannot be undone.')) { const def=store.getDefaultData(); store.savePublishedData(def); store.saveDraftData(def); draft=def; showToast('Data reset','info'); renderPage('dashboard'); lucide.createIcons(); }};
  }

  /* ── Shared Modal ──────────────────────────────────────────── */
  function showModal(title, bodyHtml, onSave) {
    let overlay = document.getElementById('editorModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'editorModalOverlay';
      overlay.className = 'editor-modal-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="editor-modal">
        <button class="editor-modal-close" id="modalClose"><i data-lucide="x"></i></button>
        <div class="editor-modal-title">${title}</div>
        <div>${bodyHtml}</div>
        ${onSave ? '<div class="form-actions"><button class="btn btn-secondary" id="modalCancel">Cancel</button><button class="btn btn-primary" id="modalSave"><i data-lucide="save" class="btn-icon"></i> Save</button></div>' : ''}
      </div>`;
    overlay.classList.add('active');
    lucide.createIcons();

    const closeModal = () => overlay.classList.remove('active');
    overlay.querySelector('#modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
    if (onSave) {
      overlay.querySelector('#modalCancel').addEventListener('click', closeModal);
      overlay.querySelector('#modalSave').addEventListener('click', () => { onSave(); closeModal(); });
    }
  }

  window._discardDraft = () => { draft = store.discardDraft(); renderPage(currentPage); lucide.createIcons(); showToast('Changes discarded','info'); updateDraftIndicator(); };

  /* ── Utilities ─────────────────────────────────────────────── */
  function v(id) { const el=document.getElementById(id); return el ? el.value : ''; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showToast(msg, type='info') {
    const c=document.getElementById('toastContainer');
    const t=document.createElement('div');
    const icons={success:'check-circle',error:'alert-circle',info:'info'};
    t.className=`toast ${type}`;
    t.innerHTML=`<i data-lucide="${icons[type]}" class="toast-icon"></i>${msg}`;
    c.appendChild(t); lucide.createIcons();
    setTimeout(()=>{t.classList.add('removing');setTimeout(()=>t.remove(),300);},3000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
