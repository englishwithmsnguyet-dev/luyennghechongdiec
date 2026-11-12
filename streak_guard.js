/**
 * ============================================================================
 * STREAK GUARD & TEACHER UNLOCK ENGINE
 * Dự án: LUYỆN NGHE CHỐNG ĐIẾC
 * Kết nối Google Sheets (Apps Script Web App) để:
 * - Tự động khóa đăng nhập nếu học viên bỏ chuỗi (không vào nghe mỗi ngày)
 * - Cho phép học viên gửi yêu cầu xin cô Nguyệt mở khóa ngay trên màn hình khóa
 * - Cung cấp Bảng Quản lý Chuỗi & Mở khóa ngay trong giao diện Giáo viên (PTMN)
 * ============================================================================
 */
(function(root) {
  'use strict';

  const DEFAULT_STREAK_API_URL = 'https://script.google.com/macros/s/AKfycbxaceuculd0u8GXgITmQraUN8VguLha7-iF6PhGtQJwmP1rSO4pjfsAL_un_d7W3NoK/exec';
  const TEACHER_ADMIN_KEY = 'PTMN_VSTEP_2026';
  const COURSE_CLASS_PREFIX = 'CĐ - ';
  const LS_URL_OVERRIDE_KEY = 'vstep_cd_streak_api_url_override';
  const LS_STREAK_CACHE_PREFIX = 'vstep_cd_streak_cache_';
  const REQUIRED_AUDIO_SECONDS = 8; // Nghe tối thiểu 8 giây hoặc nộp bài để giữ chuỗi hôm nay

  function getApiUrl() {
    if (DEFAULT_STREAK_API_URL && DEFAULT_STREAK_API_URL.startsWith('https://')) {
      return DEFAULT_STREAK_API_URL.trim();
    }
    try {
      const override = localStorage.getItem(LS_URL_OVERRIDE_KEY) || '';
      if (override.startsWith('https://script.google.com/')) {
        return override.trim();
      }
    } catch (e) {}
    return '';
  }

  function formatCourseClass(rawClass) {
    const clean = String(rawClass || '').trim().toUpperCase().replace(/\s+/g, '');
    if (clean.startsWith('CĐ-') || clean.startsWith('CĐ -')) return clean;
    return COURSE_CLASS_PREFIX + clean;
  }

  function stripCoursePrefix(classCode) {
    return String(classCode || '').replace(/^CĐ\s*-\s*/i, '');
  }

  function isChongDiecRow(student) {
    return /^CĐ\s*-/i.test(String((student && student.classCode) || ''));
  }

  function getTodayVN() {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (e) {
      const vnDate = new Date(Date.now() + 7 * 3600 * 1000);
      return vnDate.toISOString().slice(0, 10);
    }
  }

  function slugifyName(str) {
    if (!str) return 'unknown';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'unknown';
  }

  function makeStudentKey(name, prefixedClassCode) {
    return slugifyName(name) + '|' + String(prefixedClassCode || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function notify(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
      return;
    }
    let toast = document.getElementById('streak-floating-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'streak-floating-toast';
      toast.className = 'streak-floating-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-bell" style="color:#10b981;"></i><span>${escapeHtml(msg)}</span>`;
    toast.classList.add('visible');
    if (window._cdStreakToastTimer) clearTimeout(window._cdStreakToastTimer);
    window._cdStreakToastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 4200);
  }

  async function callApi(params, timeoutMs = 11000) {
    const baseUrl = getApiUrl();
    if (!baseUrl) {
      return { ok: false, unconfigured: true };
    }

    const qs = new URLSearchParams();
    Object.keys(params || {}).forEach((k) => {
      if (typeof params[k] !== 'undefined' && params[k] !== null) {
        qs.append(k, String(params[k]));
      }
    });

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const resp = await fetch(`${baseUrl}?${qs.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      });
      if (timer) clearTimeout(timer);
      return await resp.json();
    } catch (err) {
      if (timer) clearTimeout(timer);
      console.warn('[StreakGuard CD] API error:', err);
      return { ok: false, networkError: true, error: err && err.message ? err.message : 'Network error' };
    }
  }

  const StreakGuard = {
    currentStudent: null,
    currentStreakCount: 0,
    todayDone: false,
    isTeacherMode: false,
    accumulatedAudioSec: 0,
    lastAudioTimeMap: new WeakMap(),
    activityMarkedToday: false,
    currentFilter: 'all',
    currentCourseScope: 'cd', // Mặc định chỉ xem lớp Chống Điếc
    currentSearch: '',
    cachedStudents: [],
    cachedConfig: {
      SystemEnabled: true,
      StreakMode: 'STRICT_DAILY',
      RequireActivity: 'ACTIVITY'
    },

    isConfigured() {
      return Boolean(getApiUrl());
    },

    init() {
      this.ensureDomElements();
      this.bindLoginInputReset();
      this.bindAudioTracking();
      this.bindAdminModalEvents();
    },

    ensureDomElements() {
      // 1. Khung thông báo khóa tài khoản bên trong Login Modal
      const loginForm = document.getElementById('loginForm');
      if (loginForm && !document.getElementById('streakLockBox')) {
        const lockBox = document.createElement('div');
        lockBox.id = 'streakLockBox';
        lockBox.className = 'streak-lock-box';
        lockBox.style.display = 'none';
        const loginBtn = document.getElementById('btnLogin');
        if (loginBtn && loginBtn.parentNode === loginForm) {
          loginForm.insertBefore(lockBox, loginBtn);
        } else {
          loginForm.appendChild(lockBox);
        }
      }

      // 2. Sidebar pill & Teacher manage button bên trong .sidebar-header
      const sidebarHeader = document.querySelector('.sidebar-header');
      if (sidebarHeader && !document.getElementById('streak-sidebar-pill')) {
        const pill = document.createElement('div');
        pill.id = 'streak-sidebar-pill';
        pill.className = 'streak-sidebar-pill';
        pill.style.display = 'none';
        sidebarHeader.appendChild(pill);
      }

      if (sidebarHeader && !document.getElementById('btn-teacher-streak-sidebar')) {
        const tBtn = document.createElement('button');
        tBtn.id = 'btn-teacher-streak-sidebar';
        tBtn.type = 'button';
        tBtn.className = 'btn-teacher-streak-sidebar';
        tBtn.style.display = 'none';
        tBtn.innerHTML = `<i class="fa-solid fa-shield-halved"></i><span>MỞ KHÓA CHUỖI</span><span class="teacher-lock-badge" id="teacher-lock-badge" style="display:none;">0</span>`;
        tBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openAdminModal();
        });
        sidebarHeader.appendChild(tBtn);
      }

      // 3. Header quick button cạnh badge ENGLISH WITH MISS NGUYET
      const appHeader = document.querySelector('.app-header');
      const dayBadge = document.getElementById('day-badge');
      if (appHeader && !document.getElementById('btn-teacher-streak-header')) {
        const hBtn = document.createElement('button');
        hBtn.id = 'btn-teacher-streak-header';
        hBtn.type = 'button';
        hBtn.className = 'btn-teacher-streak-header';
        hBtn.style.display = 'none';
        hBtn.innerHTML = `<i class="fa-solid fa-shield-halved"></i><span>QUẢN LÝ CHUỖI</span><span class="teacher-lock-badge" id="teacher-lock-badge-header" style="display:none;">0</span>`;
        hBtn.addEventListener('click', () => this.openAdminModal());
        if (dayBadge && dayBadge.parentNode === appHeader) {
          dayBadge.insertAdjacentElement('afterend', hBtn);
        } else {
          appHeader.insertBefore(hBtn, appHeader.firstChild);
        }
      }

      // 4. Teacher Admin Modal Overlay
      if (!document.getElementById('streak-admin-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'streak-admin-overlay';
        overlay.className = 'streak-admin-overlay';
        overlay.innerHTML = `
          <div class="streak-admin-card">
            <button type="button" class="streak-close-btn" id="btn-close-streak-admin" aria-label="Đóng">&times;</button>
            <div class="streak-admin-header">
              <div class="streak-admin-title">
                <div class="streak-admin-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <div>
                  <h3>QUẢN LÝ CHUỖI NGHE & MỞ KHÓA HỌC VIÊN</h3>
                  <p>Khóa tự động khi học viên bỏ chuỗi nghe hằng ngày trên Chuỗi Chống Điếc & mở khóa chỉ với 1 chạm.</p>
                </div>
              </div>
            </div>

            <div class="streak-admin-stats">
              <div class="streak-stat-box">
                <span class="streak-stat-val" id="sa-stat-total">0</span>
                <span class="streak-stat-lbl">Tổng học viên</span>
              </div>
              <div class="streak-stat-box">
                <span class="streak-stat-val" id="sa-stat-active" style="color:#10b981;">0</span>
                <span class="streak-stat-lbl">Đang mở / Học tốt</span>
              </div>
              <div class="streak-stat-box">
                <span class="streak-stat-val" id="sa-stat-locked" style="color:#ef4444;">0</span>
                <span class="streak-stat-lbl">Đang bị khóa</span>
              </div>
              <div class="streak-stat-box">
                <span class="streak-stat-val" id="sa-stat-req" style="color:#f59e0b;">0</span>
                <span class="streak-stat-lbl">Đang xin mở khóa</span>
              </div>
            </div>

            <div class="streak-config-bar">
              <div class="streak-config-group">
                <label style="font-size:0.78rem;font-weight:800;">
                  Khóa bỏ chuỗi:
                  <select id="sa-cfg-enabled" class="streak-select" style="margin-left:5px;">
                    <option value="true">🟢 Đang BẬT</option>
                    <option value="false">⏸️ Tạm TẮT</option>
                  </select>
                </label>
                <label style="font-size:0.78rem;font-weight:800;">
                  Cách giữ chuỗi:
                  <select id="sa-cfg-activity" class="streak-select" style="margin-left:5px;">
                    <option value="ACTIVITY">🎧 Phải nghe Audio / Làm bài</option>
                    <option value="LOGIN">🔑 Chỉ cần Đăng nhập</option>
                  </select>
                </label>
                <label style="font-size:0.78rem;font-weight:800;">
                  Chủ Nhật:
                  <select id="sa-cfg-sunday" class="streak-select" style="margin-left:5px;">
                    <option value="STRICT_DAILY">Nghe cả Chủ Nhật</option>
                    <option value="ALLOW_SUNDAY_OFF">Miễn Chủ Nhật</option>
                  </select>
                </label>
                <label style="font-size:0.78rem;font-weight:800;">
                  Danh sách:
                  <select id="sa-cfg-scope" class="streak-select" style="margin-left:5px;">
                    <option value="cd">🎧 Chỉ Chống Điếc</option>
                    <option value="all">📋 Cả 2 trang web</option>
                  </select>
                </label>
              </div>
              <button type="button" class="btn-s-action btn-s-unlock-keep" id="btn-sa-refresh">
                <i class="fa-solid fa-arrows-rotate"></i> Tải lại
              </button>
            </div>

            <div class="streak-toolbar">
              <div class="streak-filter-tabs">
                <button type="button" class="streak-filter-btn active" data-filter="all">Tất cả</button>
                <button type="button" class="streak-filter-btn" data-filter="locked">🔒 Bị khóa / Xin mở</button>
                <button type="button" class="streak-filter-btn" data-filter="active">🟢 Đang hoạt động</button>
              </div>
              <input type="text" id="sa-search-input" class="streak-search-input" placeholder="Tìm tên học viên hoặc lớp...">
            </div>

            <div class="streak-student-list" id="sa-student-list">
              <div style="text-align:center;padding:28px;color:#94a3b8;font-weight:700;">
                Nhấn "Tải lại" để xem dữ liệu học viên...
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
    },

    bindLoginInputReset() {
      const nameInput = document.getElementById('studentName');
      const classInput = document.getElementById('studentClass');
      const hideLock = () => {
        const box = document.getElementById('streakLockBox');
        if (box) box.style.display = 'none';
      };
      if (nameInput) nameInput.addEventListener('input', hideLock);
      if (classInput) classInput.addEventListener('input', hideLock);
    },

    bindAdminModalEvents() {
      const overlay = document.getElementById('streak-admin-overlay');
      const closeBtn = document.getElementById('btn-close-streak-admin');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (overlay) overlay.classList.remove('open');
        });
      }
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.classList.remove('open');
        });
      }

      const refreshBtn = document.getElementById('btn-sa-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.fetchAndRenderAdminList());
      }

      const scopeEl = document.getElementById('sa-cfg-scope');
      if (scopeEl) {
        scopeEl.addEventListener('change', () => {
          this.currentCourseScope = scopeEl.value || 'cd';
          this.renderAdminList();
        });
      }

      const onConfigChange = async () => {
        const enabledEl = document.getElementById('sa-cfg-enabled');
        const activityEl = document.getElementById('sa-cfg-activity');
        const sundayEl = document.getElementById('sa-cfg-sunday');
        const res = await callApi({
          action: 'setConfig',
          adminKey: TEACHER_ADMIN_KEY,
          systemEnabled: enabledEl ? enabledEl.value : 'true',
          requireActivity: activityEl ? activityEl.value : 'ACTIVITY',
          streakMode: sundayEl ? sundayEl.value : 'STRICT_DAILY'
        });
        if (res && res.ok) {
          this.cachedConfig = res.config || this.cachedConfig;
          notify('⚙️ Đã cập nhật quy tắc chuỗi trên Google Sheet!');
          this.fetchAndRenderAdminList();
        }
      };

      ['sa-cfg-enabled', 'sa-cfg-activity', 'sa-cfg-sunday'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', onConfigChange);
      });

      document.querySelectorAll('.streak-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.streak-filter-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.filter || 'all';
          this.renderAdminList();
        });
      });

      const searchInp = document.getElementById('sa-search-input');
      if (searchInp) {
        searchInp.addEventListener('input', () => {
          this.currentSearch = searchInp.value.trim().toLowerCase();
          this.renderAdminList();
        });
      }
    },

    async checkStudentLogin(name, rawClassCode) {
      this.isTeacherMode = false;
      const prefixedClass = formatCourseClass(rawClassCode);
      this.currentStudent = {
        name,
        rawClassCode,
        prefixedClass,
        key: makeStudentKey(name, prefixedClass)
      };
      this.toggleTeacherUI(false);

      if (!this.isConfigured()) {
        return { allowed: true, unconfigured: true };
      }

      const res = await callApi({
        action: 'checkLogin',
        name: name,
        classCode: prefixedClass
      });

      const cacheKey = LS_STREAK_CACHE_PREFIX + this.currentStudent.key;

      if (res && res.ok) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            date: getTodayVN(),
            locked: Boolean(res.locked),
            streakCount: res.streakCount || 0,
            todayDone: Boolean(res.todayDone),
            lockReason: res.lockReason || '',
            lastActiveDate: res.lastActiveDate || ''
          }));
        } catch (e) {}

        if (res.locked) {
          this.renderLockedLoginBox(name, rawClassCode, prefixedClass, res);
          return { allowed: false, locked: true, data: res };
        }

        this.currentStreakCount = Number(res.streakCount || 1);
        this.todayDone = Boolean(res.todayDone);
        this.activityMarkedToday = this.todayDone;
        this.accumulatedAudioSec = 0;
        this.cachedConfig = res.config || this.cachedConfig;
        this.hideLockedLoginBox();
        this.renderSidebarStreakPill();
        return { allowed: true, data: res };
      }

      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.locked) {
            this.renderLockedLoginBox(name, rawClassCode, prefixedClass, cached);
            return { allowed: false, locked: true, offlineCached: true };
          }
        }
      } catch (e) {}

      return { allowed: true, networkFallback: true };
    },

    onTeacherLoggedIn() {
      this.isTeacherMode = true;
      this.currentStudent = null;
      this.hideLockedLoginBox();
      this.toggleTeacherUI(true);
      this.refreshTeacherPendingCount();
    },

    toggleTeacherUI(isTeacher) {
      const sBtn = document.getElementById('btn-teacher-streak-sidebar');
      const hBtn = document.getElementById('btn-teacher-streak-header');
      const pill = document.getElementById('streak-sidebar-pill');

      if (sBtn) sBtn.style.display = isTeacher ? 'flex' : 'none';
      if (hBtn) hBtn.style.display = isTeacher ? 'inline-flex' : 'none';
      if (pill) pill.style.display = isTeacher ? 'none' : (this.isConfigured() ? 'flex' : 'none');
    },

    async refreshTeacherPendingCount() {
      if (!this.isTeacherMode || !this.isConfigured()) return;
      const res = await callApi({
        action: 'listStudents',
        adminKey: TEACHER_ADMIN_KEY
      });
      if (res && res.ok && Array.isArray(res.students)) {
        this.cachedStudents = res.students;
        this.cachedConfig = res.config || this.cachedConfig;
        const cdStudents = res.students.filter(isChongDiecRow);
        const lockedCount = cdStudents.filter(
          (s) => s.status === 'LOCKED' || s.willBeLockedOnNextLogin
        ).length;
        this.updateTeacherBadges(lockedCount);
      }
    },

    updateTeacherBadges(count) {
      ['teacher-lock-badge', 'teacher-lock-badge-header'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (count > 0) {
          el.textContent = String(count);
          el.style.display = 'inline-block';
        } else {
          el.style.display = 'none';
        }
      });
    },

    hideLockedLoginBox() {
      const box = document.getElementById('streakLockBox');
      if (box) box.style.display = 'none';
    },

    renderLockedLoginBox(name, rawClassCode, prefixedClass, data) {
      const box = document.getElementById('streakLockBox');
      if (!box) return;

      const loginErr = document.getElementById('loginError');
      if (loginErr) loginErr.style.display = 'none';

      const lastDate = data.lastActiveDate || 'Chưa có';
      const oldStreak = data.streakCount || 0;
      const reason = data.lockReason || 'Bạn đã bỏ lỡ chuỗi luyện nghe hằng ngày.';
      const alreadyRequested = Boolean(data.unlockRequested);

      box.innerHTML = `
        <div class="streak-lock-header">
          <div class="streak-lock-icon"><i class="fa-solid fa-lock"></i></div>
          <div>
            <div class="streak-lock-title">TÀI KHOẢN TẠM KHÓA DO BỎ CHUỖI</div>
            <div style="font-size:0.75rem;color:#991b1b;font-weight:700;">Liên hệ Miss Nguyệt để được mở khóa lại</div>
          </div>
        </div>
        <div class="streak-lock-desc">
          ${escapeHtml(reason)}
        </div>
        <div class="streak-lock-meta">
          <span class="streak-lock-chip"><i class="fa-solid fa-user"></i> ${escapeHtml(name)} (${escapeHtml(rawClassCode)})</span>
          <span class="streak-lock-chip"><i class="fa-solid fa-fire"></i> Chuỗi cũ: ${oldStreak} ngày</span>
          <span class="streak-lock-chip"><i class="fa-regular fa-calendar-xmark"></i> Nghe gần nhất: ${escapeHtml(lastDate)}</span>
        </div>
        ${alreadyRequested
          ? `<div class="streak-request-sent-badge">
               <i class="fa-solid fa-circle-check"></i>
               <span>Đã gửi yêu cầu mở khóa tới Miss Nguyệt! Hãy báo cô kiểm tra mục "Quản lý Chuỗi" rồi nhấn Kiểm tra lại bên dưới.</span>
             </div>`
          : `<input type="text" id="streak-unlock-note" class="streak-unlock-note-input" maxlength="200" placeholder="Nhập lý do gửi cô Nguyệt (VD: Hôm qua em bận thi / bị ốm...)">`
        }
        <div class="streak-lock-actions" style="margin-top:8px;">
          ${!alreadyRequested ? `
            <button type="button" class="btn-streak-request" id="btn-streak-request-unlock">
              <i class="fa-solid fa-paper-plane"></i> GỬI YÊU CẦU CÔ NGUYỆT MỞ KHÓA
            </button>
          ` : ''}
          <button type="button" class="btn-streak-recheck" id="btn-streak-recheck-login">
            <i class="fa-solid fa-arrows-rotate"></i> KIỂM TRA LẠI (SAU KHI CÔ ĐÃ MỞ)
          </button>
        </div>
      `;

      box.style.display = 'block';

      const reqBtn = document.getElementById('btn-streak-request-unlock');
      if (reqBtn) {
        reqBtn.addEventListener('click', async () => {
          const noteInput = document.getElementById('streak-unlock-note');
          const note = noteInput ? noteInput.value.trim() : '';
          reqBtn.disabled = true;
          reqBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG GỬI YÊU CẦU...';
          const r = await callApi({
            action: 'requestUnlock',
            name: name,
            classCode: prefixedClass,
            note: note
          });
          if (r && r.ok) {
            this.renderLockedLoginBox(name, rawClassCode, prefixedClass, Object.assign({}, data, { unlockRequested: true }));
          } else {
            reqBtn.disabled = false;
            reqBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> THỬ GỬI LẠI YÊU CẦU';
            alert('Không gửi được yêu cầu lúc này. Vui lòng kiểm tra kết nối mạng!');
          }
        });
      }

      const recheckBtn = document.getElementById('btn-streak-recheck-login');
      if (recheckBtn) {
        recheckBtn.addEventListener('click', () => {
          const btnLogin = document.getElementById('btnLogin');
          if (btnLogin) btnLogin.click();
        });
      }
    },

    renderSidebarStreakPill() {
      const pill = document.getElementById('streak-sidebar-pill');
      if (!pill || this.isTeacherMode || !this.isConfigured()) return;

      pill.style.display = 'flex';
      if (this.todayDone) {
        pill.classList.add('done');
        pill.innerHTML = `<span>🔥 Chuỗi: <b>${this.currentStreakCount}</b> ngày</span><span>✅ Đã nghe hôm nay</span>`;
        pill.title = 'Tuyệt vời! Hôm nay bạn đã hoàn thành giữ chuỗi luyện nghe.';
      } else {
        pill.classList.remove('done');
        pill.innerHTML = `<span>🔥 Chuỗi: <b>${this.currentStreakCount}</b> ngày</span><span>⏳ Chờ nghe hôm nay</span>`;
        pill.title = 'Hãy nghe Audio tối thiểu 8 giây hoặc nộp bài hôm nay để giữ chuỗi!';
      }
    },

    bindAudioTracking() {
      document.addEventListener('timeupdate', (e) => {
        if (!e.target || e.target.tagName !== 'AUDIO') return;
        if (this.isTeacherMode || this.activityMarkedToday || !this.currentStudent) return;

        const audio = e.target;
        if (audio.paused) return;

        const nowT = audio.currentTime || 0;
        const prevT = this.lastAudioTimeMap.get(audio);
        if (typeof prevT === 'number') {
          const delta = nowT - prevT;
          if (delta > 0 && delta < 2.5) {
            this.accumulatedAudioSec += delta;
          }
        }
        this.lastAudioTimeMap.set(audio, nowT);

        if (this.accumulatedAudioSec >= REQUIRED_AUDIO_SECONDS) {
          this.markTodayActivityDone('Nghe Audio luyện tập');
        }
      }, true);
    },

    async markTodayActivityDone() {
      if (this.activityMarkedToday || this.isTeacherMode || !this.currentStudent) return;
      this.activityMarkedToday = true;

      if (!this.isConfigured()) return;

      const res = await callApi({
        action: 'recordActivity',
        name: this.currentStudent.name,
        classCode: this.currentStudent.prefixedClass
      });

      if (res && res.ok) {
        this.todayDone = true;
        this.currentStreakCount = Number(res.streakCount || this.currentStreakCount || 1);
        this.renderSidebarStreakPill();
        notify(`🔥 Tuyệt vời! Đã điểm danh chuỗi Chống Điếc hôm nay (${this.currentStreakCount} ngày liên tiếp)!`);
      } else {
        this.activityMarkedToday = false;
      }
    },

    openAdminModal() {
      this.ensureDomElements();
      const overlay = document.getElementById('streak-admin-overlay');
      if (overlay) overlay.classList.add('open');
      this.fetchAndRenderAdminList();
    },

    async fetchAndRenderAdminList() {
      const listEl = document.getElementById('sa-student-list');
      if (listEl) {
        listEl.innerHTML = '<div style="text-align:center;padding:26px;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu từ Google Sheet...</div>';
      }

      const res = await callApi({
        action: 'listStudents',
        adminKey: TEACHER_ADMIN_KEY
      });

      if (!res || !res.ok) {
        if (listEl) {
          listEl.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444;font-weight:700;">Không tải được dữ liệu (${escapeHtml(res && res.error ? res.error : 'Lỗi mạng')}).</div>`;
        }
        return;
      }

      this.cachedStudents = Array.isArray(res.students) ? res.students : [];
      this.cachedConfig = res.config || this.cachedConfig;
      this.syncConfigDropdowns();
      this.renderAdminList();
    },

    syncConfigDropdowns() {
      const enabledEl = document.getElementById('sa-cfg-enabled');
      const activityEl = document.getElementById('sa-cfg-activity');
      const sundayEl = document.getElementById('sa-cfg-sunday');
      const scopeEl = document.getElementById('sa-cfg-scope');
      if (enabledEl) enabledEl.value = this.cachedConfig.SystemEnabled ? 'true' : 'false';
      if (activityEl) activityEl.value = this.cachedConfig.RequireActivity || 'ACTIVITY';
      if (sundayEl) sundayEl.value = this.cachedConfig.StreakMode || 'STRICT_DAILY';
      if (scopeEl) scopeEl.value = this.currentCourseScope || 'cd';
    },

    renderAdminList() {
      const listEl = document.getElementById('sa-student-list');
      if (!listEl) return;

      const rawAll = this.cachedStudents || [];
      const all = this.currentCourseScope === 'all' ? rawAll : rawAll.filter(isChongDiecRow);

      const lockedList = all.filter((s) => s.status === 'LOCKED' || s.willBeLockedOnNextLogin);
      const reqList = all.filter((s) => s.unlockRequested);
      const activeList = all.filter((s) => s.status !== 'LOCKED' && !s.willBeLockedOnNextLogin);

      const setTxt = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(v);
      };
      setTxt('sa-stat-total', all.length);
      setTxt('sa-stat-active', activeList.length);
      setTxt('sa-stat-locked', lockedList.length);
      setTxt('sa-stat-req', reqList.length);

      // Badge chỉ đếm số học viên Chống Điếc đang bị khóa
      const cdLockedCount = rawAll.filter(isChongDiecRow).filter((s) => s.status === 'LOCKED' || s.willBeLockedOnNextLogin).length;
      this.updateTeacherBadges(cdLockedCount);

      let filtered = all;
      if (this.currentFilter === 'locked') {
        filtered = lockedList;
      } else if (this.currentFilter === 'active') {
        filtered = activeList;
      }

      if (this.currentSearch) {
        const q = this.currentSearch;
        filtered = filtered.filter((s) =>
          (s.fullName || '').toLowerCase().includes(q) ||
          (s.classCode || '').toLowerCase().includes(q)
        );
      }

      if (filtered.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:28px;color:#94a3b8;font-weight:700;">Chưa có học viên nào khớp bộ lọc này.</div>';
        return;
      }

      listEl.innerHTML = filtered.map((s) => {
        const isLocked = s.status === 'LOCKED' || s.willBeLockedOnNextLogin;
        const isCD = isChongDiecRow(s);
        const classDisplay = isCD ? stripCoursePrefix(s.classCode) : `[Tăng Cường] ${s.classCode}`;

        const statusPill = s.status === 'LOCKED'
          ? `<span class="streak-status-pill locked">🔒 ĐÃ KHÓA</span>`
          : (s.willBeLockedOnNextLogin
              ? `<span class="streak-status-pill locked">⚠️ BỎ CHUỖI (${s.daysMissed} ngày)</span>`
              : `<span class="streak-status-pill active">${s.todayDone ? '✅ ĐÃ NGHE HÔM NAY' : '🟢 ĐANG MỞ'}</span>`);

        const reqPill = s.unlockRequested
          ? `<span class="streak-status-pill req">📩 XIN MỞ KHÓA</span>`
          : '';

        const noteHtml = (s.unlockRequested || s.unlockRequestNote || s.lockReason)
          ? `<div class="streak-student-note">
               ${s.lockReason ? `<div><b>Lý do khóa:</b> ${escapeHtml(s.lockReason)}</div>` : ''}
               ${s.unlockRequestNote ? `<div><b>Học viên nhắn:</b> "${escapeHtml(s.unlockRequestNote)}"</div>` : ''}
             </div>`
          : '';

        const actionBtns = isLocked
          ? `
              <button type="button" class="btn-s-action btn-s-unlock" data-action="unlock" data-key="${escapeHtml(s.studentKey)}" title="Mở khóa và đặt lại chuỗi về 1">
                <i class="fa-solid fa-lock-open"></i> Mở khóa
              </button>
              <button type="button" class="btn-s-action btn-s-unlock-keep" data-action="unlock-keep" data-key="${escapeHtml(s.studentKey)}" title="Mở khóa và giữ nguyên chuỗi cũ">
                <i class="fa-solid fa-heart"></i> Mở & Giữ chuỗi
              </button>
            `
          : `
              <button type="button" class="btn-s-action btn-s-lock" data-action="lock" data-key="${escapeHtml(s.studentKey)}">
                <i class="fa-solid fa-lock"></i> Khóa thủ công
              </button>
            `;

        return `
          <div class="streak-student-row ${isLocked ? 'is-locked' : ''}">
            <div class="streak-student-main">
              <div class="streak-student-top">
                <span class="streak-student-name">${escapeHtml(s.fullName)}</span>
                <span class="streak-class-tag">${escapeHtml(classDisplay)}</span>
                ${statusPill}
                ${reqPill}
              </div>
              <div class="streak-student-sub">
                <span>🔥 Chuỗi: <b>${s.streakCount}</b> ngày (Kỷ lục: ${s.bestStreak})</span>
                <span>📅 Nghe gần nhất: <b>${escapeHtml(s.lastActiveDate || '--')}</b></span>
                <span>📚 Tổng ngày: ${s.totalDays}</span>
              </div>
              ${noteHtml}
            </div>
            <div class="streak-student-actions">
              ${actionBtns}
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.btn-s-action').forEach((btn) => {
        btn.addEventListener('click', () => this.handleAdminRowAction(btn));
      });
    },

    async handleAdminRowAction(btn) {
      const actionType = btn.dataset.action;
      const key = btn.dataset.key;
      if (!key) return;

      btn.disabled = true;
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

      let res;
      if (actionType === 'unlock' || actionType === 'unlock-keep') {
        res = await callApi({
          action: 'unlockStudent',
          adminKey: TEACHER_ADMIN_KEY,
          studentKey: key,
          keepStreak: actionType === 'unlock-keep' ? 'true' : 'false'
        });
      } else if (actionType === 'lock') {
        const reason = prompt('Nhập lý do khóa tài khoản này (hoặc nhấn OK để dùng mặc định):', 'Khóa bởi Miss Nguyệt');
        if (reason === null) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
          return;
        }
        res = await callApi({
          action: 'lockStudent',
          adminKey: TEACHER_ADMIN_KEY,
          studentKey: key,
          reason: reason
        });
      }

      if (res && res.ok) {
        notify(actionType === 'lock' ? '🔒 Đã khóa học viên thành công!' : '🔓 Đã mở khóa cho học viên! Em ấy có thể đăng nhập lại ngay.');
        await this.fetchAndRenderAdminList();
      } else {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        alert('Có lỗi xảy ra khi cập nhật Google Sheet. Vui lòng thử lại!');
      }
    }
  };

  root.StreakGuard = StreakGuard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StreakGuard.init());
  } else {
    StreakGuard.init();
  }

})(typeof window !== 'undefined' ? window : global);
