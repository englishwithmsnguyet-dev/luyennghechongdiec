// State
let currentDay = 'home';
let selectedAnswers = {};
let submittedPractices = {};

// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const submitBtn = document.getElementById('submit-btn');
const scoreDisplay = document.getElementById('score-display');
const dayList = document.getElementById('day-list');
const audioContainer = document.getElementById('audio-container');
const dayBadge = document.getElementById('day-badge');

// --- Exercise Time Tracking State & Logic ---
let daySessionStartTime = null;
let daySessionAudioSeconds = 0;
let dayLiveTimerInterval = null;
let lastAudioPlaybackTimestamp = null;
let isDaySubmitted = false;

function formatTimerDigits(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
}

function formatTimerHuman(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    if (mins === 0) {
        return `${remainingSecs} giây`;
    }
    return `${mins} phút ${remainingSecs < 10 ? '0' : ''}${remainingSecs} giây`;
}

function updateLiveTimerUI() {
    if (!daySessionStartTime || isDaySubmitted) return;
    const now = Date.now();
    const elapsedSec = Math.floor((now - daySessionStartTime) / 1000);
    const liveTimerEl = document.getElementById('live-timer-text');
    const liveAudioEl = document.getElementById('live-audio-timer-text');
    if (liveTimerEl) liveTimerEl.textContent = formatTimerDigits(elapsedSec);
    if (liveAudioEl) liveAudioEl.textContent = formatTimerDigits(daySessionAudioSeconds);
}

function startDayTimer() {
    stopDayTimer();
    daySessionStartTime = Date.now();
    daySessionAudioSeconds = 0;
    isDaySubmitted = false;
    lastAudioPlaybackTimestamp = null;
    
    const timerBar = document.getElementById('exercise-timer-bar');
    if (timerBar) {
        timerBar.classList.remove('hidden');
        timerBar.innerHTML = `
            <div class="timer-pill timer-pill-exercise">
                <i class="fa-solid fa-stopwatch"></i>
                <span>Thời gian làm bài: <strong id="live-timer-text">00:00</strong></span>
            </div>
            <div class="timer-pill timer-pill-audio">
                <i class="fa-solid fa-headphones"></i>
                <span>Đã nghe audio: <strong id="live-audio-timer-text">00:00</strong></span>
            </div>
        `;
    }
    updateLiveTimerUI();
    dayLiveTimerInterval = setInterval(updateLiveTimerUI, 1000);
}

function stopDayTimer() {
    if (dayLiveTimerInterval) {
        clearInterval(dayLiveTimerInterval);
        dayLiveTimerInterval = null;
    }
}

// Global Audio Playback Tracking
document.addEventListener('play', (e) => {
    if (e.target && e.target.tagName === 'AUDIO') {
        lastAudioPlaybackTimestamp = Date.now();
    }
}, true);

document.addEventListener('pause', (e) => {
    if (e.target && e.target.tagName === 'AUDIO') {
        if (lastAudioPlaybackTimestamp && !isDaySubmitted) {
            const now = Date.now();
            const delta = (now - lastAudioPlaybackTimestamp) / 1000;
            if (delta > 0 && delta < 5) {
                daySessionAudioSeconds += delta;
            }
        }
        lastAudioPlaybackTimestamp = null;
        updateLiveTimerUI();
    }
}, true);

document.addEventListener('timeupdate', (e) => {
    if (e.target && e.target.tagName === 'AUDIO') {
        if (isDaySubmitted) return;
        const now = Date.now();
        if (lastAudioPlaybackTimestamp) {
            const delta = (now - lastAudioPlaybackTimestamp) / 1000;
            if (delta > 0 && delta < 2.5) {
                daySessionAudioSeconds += delta;
            }
        }
        lastAudioPlaybackTimestamp = now;
        updateLiveTimerUI();
    }
}, true);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    updateProgress();
    loadDay(currentDay);
    initLogin();
    updateUserProfileBadge();
    initHistoryEvents();
});

function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const iconMoon = document.getElementById('theme-icon-moon');
    const iconSun = document.getElementById('theme-icon-sun');
    
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        iconMoon.classList.add('hidden');
        iconSun.classList.remove('hidden');
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        
        iconMoon.classList.toggle('hidden');
        iconSun.classList.toggle('hidden');
    });
}

function initSidebar() {
    dayList.innerHTML = '';
    
    // Add Garden tab (#1)
    const gardenLi = document.createElement('li');
    gardenLi.className = `day-item garden-nav-item ${currentDay === 'garden' ? 'active' : ''}`;
    gardenLi.id = 'sidebar-nav-garden';
    gardenLi.innerHTML = `<span style="font-size:1.15rem; margin-right:6px;">🌱</span><span>CHĂM HOA CHĂM HỌC</span>`;
    gardenLi.onclick = () => {
        if (currentDay !== 'garden') {
            document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
            gardenLi.classList.add('active');
            loadDay('garden');
        }
    };
    dayList.appendChild(gardenLi);

    // Add Home tab
    const homeLi = document.createElement('li');
    homeLi.className = `day-item ${currentDay === 'home' ? 'active' : ''}`;
    homeLi.textContent = 'HOME PAGE';
    homeLi.onclick = () => {
        if (currentDay !== 'home') {
            document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
            homeLi.classList.add('active');
            loadDay('home');
        }
    };
    dayList.appendChild(homeLi);
    
    // Sort keys just in case
    const days = Object.keys(daysData).sort((a, b) => Number(a) - Number(b));
    
    days.forEach(day => {
        const li = document.createElement('li');
        li.className = `day-item ${day == currentDay ? 'active' : ''}`;
        li.textContent = daysData[day].sidebarTitle || `DAY ${day < 10 ? '0' + day : day}`;
        li.onclick = () => {
            if (currentDay != day) {
                // Update active class
                document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                
                loadDay(day);
            }
        };
        dayList.appendChild(li);
    });
}

function renderHomePage() {
    quizContainer.innerHTML = `
        <style>
            .home-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
                margin-bottom: 40px;
            }
            .home-card {
                background: var(--bg-card);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid var(--border);
                position: relative;
                overflow: hidden;
            }
            .home-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
            }
            .home-card-icon {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
            }
            .home-card h3 {
                color: var(--text-main);
                font-size: 1.35rem;
                font-weight: 800;
                margin-bottom: 20px;
                letter-spacing: -0.3px;
            }
            .home-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .home-list li {
                color: var(--text-muted);
                margin-bottom: 16px;
                display: flex;
                align-items: flex-start;
                line-height: 1.6;
                font-size: 1rem;
                font-weight: 500;
            }
            .home-list li svg {
                width: 20px;
                height: 20px;
                min-width: 20px;
                margin-right: 12px;
                margin-top: 3px;
            }
            .hero-banner {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08));
                border-radius: 24px;
                padding: 50px 30px;
                text-align: center;
                margin-bottom: 40px;
                border: 1px solid rgba(99, 102, 241, 0.15);
            }
            .hero-banner h2 {
                color: var(--primary);
                font-size: 2.4rem;
                font-weight: 900;
                margin-bottom: 16px;
                letter-spacing: -1px;
            }
            .hero-banner p {
                color: var(--text-muted);
                font-size: 1.15rem;
                max-width: 600px;
                margin: 0 auto;
                line-height: 1.6;
                font-weight: 500;
            }
            .final-banner {
                background: linear-gradient(135deg, var(--primary), #3b82f6);
                border-radius: 24px;
                padding: 50px 30px;
                color: white;
                text-align: center;
                position: relative;
                overflow: hidden;
                box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.4);
            }
            .final-banner::after {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
                opacity: 0.5;
                pointer-events: none;
            }
            .final-banner h3 {
                font-size: 1.8rem;
                font-weight: 800;
                margin-bottom: 24px;
            }
            .final-banner p {
                font-size: 1.1rem;
                line-height: 1.7;
                margin-bottom: 12px;
                opacity: 0.95;
            }
            .final-box {
                background: rgba(255,255,255,0.15);
                backdrop-filter: blur(10px);
                padding: 24px;
                border-radius: 16px;
                display: inline-block;
                margin-top: 24px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .final-box p {
                font-weight: 700;
                font-size: 1.2rem;
                margin: 0;
                opacity: 1;
            }
        </style>

        <div class="home-page-content" style="animation: fadeIn 0.6s ease-out;">
            
            <div class="hero-banner">
                <h2>LƯU Ý KHI LUYỆN NGHE</h2>
                <p>Để chuỗi luyện nghe thực sự có hiệu quả, các bạn cần cam kết thực hiện nghiêm túc theo những nguyên tắc nền tảng sau đây.</p>
            </div>
            
            <div class="home-grid">
                <!-- Card 1 -->
                <div class="home-card">
                    <div class="home-card-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                    </div>
                    <h3>Khi làm bài</h3>
                    <ul class="home-list">
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Chỉ nghe 01 lần như trong phòng thi thật.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>Không bấm dừng giữa chừng.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>Không tua đi tua lại.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>Không chỉnh tốc độ nghe.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>Không vừa nghe vừa xem TRANSCRIPT.</span></li>
                    </ul>
                </div>

                <!-- Card 2 -->
                <div class="home-card">
                    <div class="home-card-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    </div>
                    <h3>Sau khi hoàn thành</h3>
                    <ul class="home-list">
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Xem kỹ phần giải thích đáp án.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Đọc TRANSCRIPT để xác định chính xác mình đã bỏ lỡ thông tin nào.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Tìm hiểu những từ vựng hoặc cách diễn đạt mới.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Ghi chú lại những lỗi bản thân thường mắc phải.</span></li>
                    </ul>
                </div>

                <!-- Card 3 -->
                <div class="home-card">
                    <div class="home-card-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                    </div>
                    <h3>Sau khi xem đáp án</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">Nhiều bạn có thói quen làm xong là đóng bài lại. Đây là một sai lầm rất lớn. Hãy nghe lại thêm nhiều lần:</p>
                    <ul class="home-list" style="margin-bottom: 16px;">
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg> <span><strong>Lần 1:</strong> Nghe và nhìn TRANSCRIPT.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg> <span><strong>Lần 2:</strong> Nghe và cố hiểu toàn bộ nội dung.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg> <span><strong>Lần 3:</strong> Nghe lại mà không nhìn TRANSCRIPT.</span></li>
                    </ul>
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid #ef4444;">
                        <p style="color: #ef4444; font-weight: 700; font-size: 0.9rem; margin: 0;">Mục tiêu không phải chỉ biết đáp án đúng, mà phải hiểu vì sao mình sai.</p>
                    </div>
                </div>

                <!-- Card 4 -->
                <div class="home-card">
                    <div class="home-card-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <h3>Đừng chỉ học từ vựng</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">Nhiều bạn nghĩ rằng nghe kém là do thiếu từ. Thực tế, rất nhiều câu sai đến từ:</p>
                    <ul class="home-list" style="margin-bottom: 16px;">
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg> <span>Không nhận ra paraphrase.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg> <span>Bỏ sót thông tin quan trọng.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg> <span>Nghe được từ khóa rồi chọn ngay.</span></li>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg> <span>Không theo kịp mạch nội dung.</span></li>
                    </ul>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 12px 16px; border-radius: 8px; border-left: 3px solid #10b981;">
                        <p style="color: #10b981; font-weight: 700; font-size: 0.9rem; margin: 0;">Vì vậy, hãy tập trung vào việc hiểu ý thay vì chỉ săn từ khóa.</p>
                    </div>
                </div>
            </div>

            <div class="final-banner">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                <h3>Điều quan trọng nhất</h3>
                <p>Không ai giỏi LISTENING chỉ nhờ làm nhiều đề.</p>
                <p>Người giỏi LISTENING là người dành thời gian phân tích kỹ những bài mình đã làm sai.</p>
                <p>Một bài nghe được chữa kỹ sẽ giá trị hơn rất nhiều bài nghe làm qua loa.</p>
                
                <div class="final-box">
                    <p>Hãy luyện nghe thật nghiêm túc.<br>
                    Đừng học để hoàn thành nhiệm vụ.<br>
                    Hãy học để ngày thi thật, các bạn thực sự nghe được.</p>
                </div>
            </div>
        </div>
    `;
    
    // Hide submit/reset buttons
    const submitBtn = document.getElementById('submit-btn-all');
    const resetBtn = document.getElementById('reset-btn-all');
    if (submitBtn) submitBtn.classList.add('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');
}

function renderGardenPage() {
    const quoteCard = document.getElementById('daily-quote-card');
    if (quoteCard) quoteCard.style.display = 'none';
    const flowerGardenEl = document.getElementById('flower-garden');
    if (flowerGardenEl) flowerGardenEl.style.display = 'block';

    quizContainer.innerHTML = '';
    audioContainer.innerHTML = '';
    const submitBtn = document.getElementById('submit-btn-all');
    const resetBtn = document.getElementById('reset-btn-all');
    if (submitBtn) submitBtn.classList.add('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');

    if (window.FlowerGarden) {
        FlowerGarden.ensureGardenContainerDom();
        FlowerGarden.render();
    }
}

function loadDay(dayId) {
    currentDay = dayId;
    
    // Reset state
    selectedAnswers = {};
    submittedPractices = {};
    
    // Clear containers
    audioContainer.innerHTML = '';
    quizContainer.innerHTML = '';
    
    const warningBox = document.querySelector('.audio-warning');
    const timerBar = document.getElementById('exercise-timer-bar');
    const flowerGardenEl = document.getElementById('flower-garden');
    const quoteCard = document.getElementById('daily-quote-card');
    
    if (dayId === 'garden') {
        stopDayTimer();
        if (timerBar) timerBar.classList.add('hidden');
        if (warningBox) warningBox.classList.add('hidden');
        renderGardenPage();
        return;
    }

    if (flowerGardenEl) flowerGardenEl.style.display = 'none';

    if (dayId === 'home') {
        stopDayTimer();
        if (timerBar) timerBar.classList.add('hidden');
        if (quoteCard) quoteCard.style.display = 'block';
        if (warningBox) warningBox.classList.add('hidden');
        renderHomePage();
        return;
    } else {
        if (quoteCard) quoteCard.style.display = 'none';
        if (warningBox) warningBox.classList.remove('hidden');
    }
    
    const dayInfo = daysData[dayId];
    
    if (dayInfo.practices) {
        // Handle nested practices (Day 04, 05, 06...)
        dayInfo.practices.forEach((practice, index) => {
            const practiceId = `practice-${index}`;
            // 1. Render Practice Audio & Title into quizContainer
            const wrapper = document.createElement('div');
            wrapper.className = 'audio-item';
            wrapper.style.marginBottom = '15px';
            wrapper.style.marginTop = index === 0 ? '0' : '30px';
            
            if (practice.title) {
                const title = document.createElement('h3');
                title.textContent = practice.title;
                title.style.color = 'var(--text-main)';
                title.style.fontWeight = '700';
                title.style.marginBottom = '10px';
                wrapper.appendChild(title);
            }
            
            const player = document.createElement('audio');
            player.controls = true;
            player.style.width = '100%';
            
            const source = document.createElement('source');
            source.src = practice.audioSrc;
            source.type = 'audio/mpeg';
            
            player.appendChild(source);
            wrapper.appendChild(player);
            quizContainer.appendChild(wrapper);
            
            // 2. Render Questions for this practice
            renderQuestions(practice.questions, quizContainer, practiceId);

            // 3. Render FULL TRANSCRIPT section if the practice has markers
            const firstQ = practice.questions[0];
            if (firstQ && firstQ.transcriptEN && /\(\s*1\s*\)/.test(firstQ.transcriptEN)) {
                const fullTranscriptContainer = document.createElement('div');
                fullTranscriptContainer.className = 'full-transcript-section';
                fullTranscriptContainer.id = `full-trans-section-${practiceId}`;
                fullTranscriptContainer.style.marginTop = '20px';
                fullTranscriptContainer.style.marginBottom = '25px';
                
                fullTranscriptContainer.innerHTML = `
                    <button class="btn-full-transcript" onclick="toggleFullTranscript('${practiceId}')">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        FULL TRANSCRIPT (${practice.title || `PRACTICE ${index + 1}`})
                    </button>
                    <div id="full-trans-${practiceId}" class="full-transcript-content hidden">
                        <div class="transcript-column">
                            <h4>TRANSCRIPT ĐẦY ĐỦ (TIẾNG ANH)</h4>
                            <p class="transcript-en">${formatTranscript(firstQ.transcriptEN)}</p>
                        </div>
                        <div class="transcript-column">
                            <h4>BẢN DỊCH ĐẦY ĐỦ (TIẾNG VIỆT)</h4>
                            <p class="transcript-vn">${formatTranscript(firstQ.transcriptVN)}</p>
                        </div>
                    </div>
                `;
                quizContainer.appendChild(fullTranscriptContainer);
            }
        });
    } else {
        // Single mode (Days 1, 2, 3...)
        const player = document.createElement('audio');
        player.controls = true;
        player.style.width = '100%';
        
        const source = document.createElement('source');
        source.src = dayInfo.audioSrc;
        source.type = 'audio/mpeg';
        
        player.appendChild(source);
        audioContainer.appendChild(player);
        
        // Render all questions
        renderQuestions(dayInfo.questions, quizContainer, "practice-0");

        // Render FULL TRANSCRIPT section if the single mode has markers
        const firstQ = dayInfo.questions[0];
        if (firstQ && firstQ.transcriptEN && /\(\s*1\s*\)/.test(firstQ.transcriptEN)) {
            const practiceId = 'practice-0';
            const fullTranscriptContainer = document.createElement('div');
            fullTranscriptContainer.className = 'full-transcript-section';
            fullTranscriptContainer.id = `full-trans-section-${practiceId}`;
            fullTranscriptContainer.style.marginTop = '20px';
            fullTranscriptContainer.style.marginBottom = '25px';
            
            fullTranscriptContainer.innerHTML = `
                <button class="btn-full-transcript" onclick="toggleFullTranscript('${practiceId}')">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    FULL TRANSCRIPT (BÀI NGHE CHI TIẾT)
                </button>
                <div id="full-trans-${practiceId}" class="full-transcript-content hidden">
                    <div class="transcript-column">
                        <h4>TRANSCRIPT ĐẦY ĐỦ (TIẾNG ANH)</h4>
                        <p class="transcript-en">${formatTranscript(firstQ.transcriptEN)}</p>
                    </div>
                    <div class="transcript-column">
                        <h4>BẢN DỊCH ĐẦY ĐỦ (TIẾNG VIỆT)</h4>
                        <p class="transcript-vn">${formatTranscript(firstQ.transcriptVN)}</p>
                    </div>
                </div>
            `;
            quizContainer.appendChild(fullTranscriptContainer);
        }
    }
    // Add unified actions for the entire day
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions unified-actions';
    actionsDiv.innerHTML = `
        <div class="action-buttons">
            <button id="submit-btn-all" class="submit-btn" onclick="submitAll()">Nộp Bài</button>
            <button id="reset-btn-all" class="reset-btn hidden" onclick="resetAll()">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Làm Lại
            </button>
        </div>
    `;
    quizContainer.appendChild(actionsDiv);

    
    // Kiểm tra xem Day này đã nộp bài trước đó hay chưa
    let isPrevSubmitted = false;
    let savedDayState = null;
    try {
        const raw = localStorage.getItem(`vstep_day_${dayId}`);
        if (raw) savedDayState = JSON.parse(raw);
        if (savedDayState && savedDayState.submitted) isPrevSubmitted = true;
    } catch(e) {}

    if (isPrevSubmitted) {
        isDaySubmitted = true;
        stopDayTimer();
        if (timerBar) {
            timerBar.classList.remove('hidden');
            const spentStr = savedDayState && typeof savedDayState.timeSpent === 'number' ? formatTimerHuman(savedDayState.timeSpent) : '--';
            const audioStr = savedDayState && typeof savedDayState.audioTime === 'number' ? formatTimerDigits(savedDayState.audioTime) : '--';
            timerBar.innerHTML = `
                <div class="timer-pill timer-pill-submitted">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Đã nộp bài: <strong>${spentStr}</strong> (Nghe audio: <strong>${audioStr}</strong>)</span>
                </div>
                <button type="button" class="btn-timer-view-confirm" onclick="openDayConfirmationModal('${dayId}')" title="Mở lại ảnh xác nhận kết quả để chụp màn hình gửi cô Nguyệt">
                    <i class="fa-solid fa-camera"></i> Xem lại ảnh xác nhận
                </button>
            `;
        }
    } else {
        startDayTimer();
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Load saved state
    loadState();
}

function formatTranscript(text) {
    if (!text) return "";
    const regex = /\b(M|W|Nam|Nữ|Rachel|Man)\s*:\s*/g;
    let formatted = text.replace(regex, (match, speaker) => {
        return `<br><strong>${speaker}:</strong> `;
    });
    formatted = formatted.trim();
    if (formatted.startsWith('<br>')) {
        formatted = formatted.substring(4);
    }
    return formatted;
}

function extractSegment(text, qIndex) {
    if (!text) return "";
    
    const hasMarkers = /\(\s*1\s*\)/.test(text);
    if (!hasMarkers) {
        return text;
    }
    
    const markerNum = qIndex + 1;
    const markerRegex = new RegExp(`\\(\\s*${markerNum}\\s*\\)`);
    const match = text.match(markerRegex);
    if (!match) {
        return text;
    }
    
    const startIdx = match.index;
    
    const nextMarkerNum = markerNum + 1;
    const nextMarkerRegex = new RegExp(`\\(\\s*${nextMarkerNum}\\s*\\)`);
    const nextMatch = text.match(nextMarkerRegex);
    
    let endIdx = text.length;
    if (nextMatch) {
        endIdx = nextMatch.index;
    }
    
    let sliced = text.substring(startIdx, endIdx).trim();
    sliced = sliced.replace(/\s*\b(M|W|Nam|Nữ|Rachel|Man|Woman)\s*:\s*$/, "");
    return sliced;
}

function renderQuestions(questions, container, practiceId) {
    questions.forEach((q, index) => {
        // Create question card
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `question-${q.id}`;

        // Question header
        const header = document.createElement('div');
        header.className = 'question-header';
        header.onclick = () => toggleTranslation(`q-trans-${q.id}`, practiceId);
        
        header.innerHTML = `
            <div class="question-text">${q.questionEN}</div>
            <div id="q-trans-${q.id}" class="translation">${q.questionVN}</div>
        `;

        // Options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';

        q.options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'option-label';
            label.id = `label-${q.id}-${opt.id}`;
            
            label.innerHTML = `
                <input type="radio" name="question-${q.id}" value="${opt.id}" 
                       onchange="handleSelection(${q.id}, \'${opt.id}\', \'${practiceId}\')">
                <div class="custom-radio"></div>
                <div class="option-content">
                    <div class="option-text">${opt.id}. ${opt.textEN}</div>
                    <div class="translation opt-trans">${opt.textVN}</div>
                </div>
            `;
            
            // Add click listener to show translation
            label.addEventListener('click', (e) => {
                if (!submittedPractices[practiceId]) return; // Only allow after submit
                const trans = label.querySelector('.opt-trans');
                if (trans) {
                    trans.classList.add('show-translation');
                }
            });

            optionsContainer.appendChild(label);
        });

        // Explanation section (hidden initially)
        const explanationSection = document.createElement('div');
        explanationSection.className = 'explanation-section';
        explanationSection.id = `explanation-${q.id}`;
        
        const hasMarkers = q.transcriptEN && /\(\s*1\s*\)/.test(q.transcriptEN);
        const hasHighlights = hasMarkers || (q.transcriptEN && q.transcriptEN.includes('highlight-answer'));
        const labelEN = hasHighlights ? "Transcript chứa đáp án:" : "Transcript:";
        const labelVN = hasHighlights ? "Dịch nghĩa:" : "Dịch nghĩa:";
        const finalEN = hasMarkers ? extractSegment(q.transcriptEN, index) : q.transcriptEN;
        const finalVN = hasMarkers ? extractSegment(q.transcriptVN, index) : q.transcriptVN;
        
        const formattedEN = formatTranscript(finalEN);
        const formattedVN = formatTranscript(finalVN);
        
        const displayEN = hasMarkers ? `<span class="highlight-answer">${formattedEN}</span>` : formattedEN;
        const displayVN = hasMarkers ? `<span class="highlight-answer">${formattedVN}</span>` : formattedVN;
        
        let usefulVocabHtml = '';
        if (q.vocabulary && q.vocabulary.length > 0) {
            const vocabListItems = q.vocabulary.map(v => {
                const match = v.match(/^([^/(:]+)(.*)$/);
                if (match) {
                    const wordPart = match[1].trim();
                    const restPart = match[2] || '';
                    return `
                        <div class="vocab-item">
                            <button class="btn-speak-vocab" onclick="window.speakWord('${wordPart.replace(/'/g, "\\'")}')" title="Nghe đọc mẫu">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M12 3L6.5 8H2V16H6.5L12 21V3ZM16.5 12C16.5 10.23 15.48 8.71 14 8V16C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z"/>
                                </svg>
                            </button>
                            <div class="vocab-text">
                                - <strong>${wordPart}</strong> ${restPart}
                            </div>
                        </div>
                    `;
                }
                return `<div class="vocab-item"><div class="vocab-text">- ${v}</div></div>`;
            }).join('');

            usefulVocabHtml = `
                <div class="vocab-divider"></div>
                <h4 class="vocab-heading">TỪ VỰNG HỮU ÍCH</h4>
                <div class="vocab-list">
                    ${vocabListItems}
                </div>
            `;
        }

        explanationSection.innerHTML = `
            <button class="btn-explain" onclick="toggleExplanation(${q.id}, \'${practiceId}\')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${hasHighlights ? 'Giải thích chi tiết (Khoanh vùng đáp án)' : 'Giải thích chi tiết'}
            </button>
            <div id="exp-content-${q.id}" class="explanation-content hidden">
                <h4 class="exp-heading">TIẾNG ANH</h4>
                <div class="transcript-box text-en">${displayEN}</div>
                <h4 class="exp-heading">TIẾNG VIỆT</h4>
                <div class="transcript-box text-vi">${displayVN}</div>
                ${usefulVocabHtml}
            </div>
        `;

        card.appendChild(header);
        card.appendChild(optionsContainer);
        card.appendChild(explanationSection);

        container.appendChild(card);
    });
}

function handleSelection(questionId, optionId, practiceId) {
    if (submittedPractices[practiceId]) return; // Prevent changing after submit
    
    selectedAnswers[questionId] = optionId;
    
    // Highlight the selected label
    const labels = document.querySelectorAll(`input[name="question-${questionId}"]`);
    labels.forEach(radio => {
        const parent = radio.closest('.option-label');
        if (radio.checked) {
            parent.classList.add('selected');
        } else {
            parent.classList.remove('selected');
        }
    });
}

function toggleTranslation(elementId, practiceId) {
    if (!submittedPractices[practiceId]) return; // Only allow after submit
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.toggle('show-translation');
    }
}

function toggleExplanation(questionId) {
    const el = document.getElementById(`exp-content-${questionId}`);
    if (el) {
        el.classList.toggle('hidden');
    }
}

window.speakWord = function(word) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let cleanWord = word.split('/')[0].split(',')[0].trim();
        cleanWord = cleanWord.replace(/\([^)]*\)/g, '').trim();
        cleanWord = cleanWord.replace(/[^\w\s\-]/g, '').trim();

        if (!cleanWord) return;

        const utterance = new SpeechSynthesisUtterance(cleanWord);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const priorities = ["Google US English", "Ava", "Allison", "Siri", "Samantha", "Victoria"];
        for (const name of priorities) {
            const found = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
            if (found) {
                utterance.voice = found;
                break;
            }
        }
        window.speechSynthesis.speak(utterance);
    }
};

function toggleFullTranscript(practiceId) {
    const el = document.getElementById(`full-trans-${practiceId}`);
    if (el) {
        el.classList.toggle('hidden');
    }
}

function submitAll(isRestore = false) {
    const dayInfo = daysData[currentDay];
    const numPractices = dayInfo.practices ? dayInfo.practices.length : 1;
    
    // Check if all questions are answered
    if (!isRestore) {
        let allAnswered = true;
        let unansweredCount = 0;
        
        for (let i = 0; i < numPractices; i++) {
            let practice = dayInfo.practices ? dayInfo.practices[i] : dayInfo;
            practice.questions.forEach(q => {
                if (!selectedAnswers[q.id]) {
                    allAnswered = false;
                    unansweredCount++;
                }
            });
        }
        
        if (!allAnswered) {
            alert(`Bạn còn ${unansweredCount} câu chưa trả lời. Hãy hoàn thành tất cả để xem kết quả nhé!`);
            return;
        }
    }
    
    let totalScore = 0;
    let totalQuestions = 0;
    
    for (let i = 0; i < numPractices; i++) {
        let practiceId = `practice-${i}`;
        submittedPractices[practiceId] = true;
        
        // Reveal FULL TRANSCRIPT section if it exists
        const ftSection = document.getElementById(`full-trans-section-${practiceId}`);
        if (ftSection) {
            ftSection.classList.add('visible');
        }
        
        let practice = dayInfo.practices ? dayInfo.practices[i] : dayInfo;
        practice.questions.forEach(q => {
            totalQuestions++;
            const selected = selectedAnswers[q.id];
            
            // Show question translation automatically
            const qTrans = document.getElementById(`q-trans-${q.id}`);
            if (qTrans) qTrans.classList.add('show-translation');
            
            const options = document.querySelectorAll(`input[name="question-${q.id}"]`);
            options.forEach(opt => {
                opt.disabled = true;
                const label = document.getElementById(`label-${q.id}-${opt.value}`);
                
                if (label) {
                    // Show option translation automatically
                    const trans = label.querySelector('.opt-trans');
                    if (trans) trans.classList.add('show-translation');
                }
                
                if (opt.value === q.correctAnswer) {
                    label.classList.add('correct');
                    if (selected === opt.value) {
                        totalScore++;
                    }
                } else if (selected === opt.value) {
                    label.classList.add('wrong');
                }
            });
            
            const expSection = document.getElementById(`explanation-${q.id}`);
            if (expSection) {
                expSection.classList.add('visible');
            }
        });
    }
    
    const submitBtn = document.getElementById('submit-btn-all');
    const resetBtn = document.getElementById('reset-btn-all');
    if (submitBtn) submitBtn.classList.add('hidden');
    if (resetBtn) resetBtn.classList.remove('hidden');
    
    // Calculate final time elapsed and audio time
    const totalElapsedSeconds = daySessionStartTime ? Math.max(1, Math.floor((Date.now() - daySessionStartTime) / 1000)) : 0;
    const recordedAudioSec = Math.floor(daySessionAudioSeconds);
    isDaySubmitted = true;
    stopDayTimer();

    const percentage = (totalScore / totalQuestions) * 100;
    let message = "";
    if (percentage === 0) {
        message = "Ôi không, 0 điểm rồi kìa! Mau nghe lại và làm lại ngay nhé, nếu không, Miss Nguyệt đấm cậu đó!";
    } else if (percentage >= 50) {
        message = "Cậu đã làm tốt lắm. Tiếp tục cố gắng nhé! Miss Nguyệt khen cậu đó!";
    } else {
        message = "Không sao đâu, miễn là cậu vẫn đang cố gắng! Kiên nhẫn thêm một chút nhé! Nếu không, Miss Nguyệt đấm cậu đó!";
    }

    // Save state to localStorage
    localStorage.setItem(`vstep_day_${currentDay}`, JSON.stringify({
        submitted: true,
        score: totalScore,
        total: totalQuestions,
        message: message,
        timeSpent: totalElapsedSeconds,
        audioTime: recordedAudioSec,
        submittedAt: new Date().toISOString()
    }));

    const timerBar = document.getElementById('exercise-timer-bar');
    if (timerBar) {
        timerBar.classList.remove('hidden');
        timerBar.innerHTML = `
            <div class="timer-pill timer-pill-submitted">
                <i class="fa-solid fa-circle-check"></i>
                <span>Đã nộp bài: <strong>${formatTimerHuman(totalElapsedSeconds)}</strong> (Nghe audio: <strong>${formatTimerDigits(recordedAudioSec)}</strong>)</span>
            </div>
            <button type="button" class="btn-timer-view-confirm" onclick="openDayConfirmationModal('${currentDay}')" title="Mở lại ảnh xác nhận kết quả để chụp màn hình gửi cô Nguyệt">
                <i class="fa-solid fa-camera"></i> Xem lại ảnh xác nhận
            </button>
        `;
    }
    
    updateProgress();
    
    if (!isRestore) {
        if (window.FlowerGarden) {
            const earnedWater = totalScore > 0 ? (totalScore * 2 + 5) : 5;
            FlowerGarden.addWaterDrops(earnedWater, `Hoàn thành bài luyện nghe Day ${currentDay}`);
        }
        if (window.StreakGuard) {
            window.StreakGuard.markTodayActivityDone();
        }
        showModal(totalScore, totalQuestions, message, totalElapsedSeconds, recordedAudioSec);
    }
}

function resetAll() {
    if (!confirm('Bạn có chắc chắn muốn làm lại từ đầu? Toàn bộ kết quả hiện tại sẽ bị xóa.')) return;
    
    const dayInfo = daysData[currentDay];
    const numPractices = dayInfo.practices ? dayInfo.practices.length : 1;
    
    for (let i = 0; i < numPractices; i++) {
        let practiceId = `practice-${i}`;
        submittedPractices[practiceId] = false;
        
        // Hide FULL TRANSCRIPT section
        const ftSection = document.getElementById(`full-trans-section-${practiceId}`);
        if (ftSection) {
            ftSection.classList.remove('visible');
            const ftContent = document.getElementById(`full-trans-${practiceId}`);
            if (ftContent) ftContent.classList.add('hidden');
        }
        
        let practice = dayInfo.practices ? dayInfo.practices[i] : dayInfo;
        practice.questions.forEach(q => {
            delete selectedAnswers[q.id];
            
            // Hide question translation
            const qTrans = document.getElementById(`q-trans-${q.id}`);
            if (qTrans) qTrans.classList.remove('show-translation');
            
            const options = document.querySelectorAll(`input[name="question-${q.id}"]`);
            options.forEach(opt => {
                opt.disabled = false;
                opt.checked = false;
                const label = document.getElementById(`label-${q.id}-${opt.value}`);
                if (label) {
                    label.classList.remove('correct', 'wrong');
                    const trans = label.querySelector('.opt-trans');
                    if (trans) trans.classList.remove('show-translation');
                }
            });
            
            const expSection = document.getElementById(`explanation-${q.id}`);
            if (expSection) {
                expSection.classList.remove('visible');
                const expContent = document.getElementById(`exp-content-${q.id}`);
                if (expContent) expContent.classList.add('hidden');
            }
        });
    }
    
    const submitBtn = document.getElementById('submit-btn-all');
    const resetBtn = document.getElementById('reset-btn-all');
    if (submitBtn) submitBtn.classList.remove('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');
    
    // Remove state from localStorage
    localStorage.removeItem(`vstep_day_${currentDay}`);
    
    updateProgress();
    startDayTimer();
}

function loadState() {
    // Intentionally left blank
}

function updateProgress() {
    const totalDays = Object.keys(daysData).length;
    let completedDays = 0;
    
    Object.keys(daysData).forEach(day => {
        const stateStr = localStorage.getItem(`vstep_day_${day}`);
        // Find corresponding sidebar list item
        let dayLi = null;
        const dayItems = document.querySelectorAll('.day-item');
        dayItems.forEach(el => {
            const title = daysData[day].sidebarTitle || `DAY ${day < 10 ? '0' + day : day}`;
            if (el.textContent.includes(title)) {
                dayLi = el;
            }
        });
        
        if (stateStr) {
            try {
                const state = JSON.parse(stateStr);
                const isFullySubmitted = state.submittedPractices ? 
                    Object.values(state.submittedPractices).some(val => val === true) : 
                    state.submitted;
                    
                if (isFullySubmitted) {
                    completedDays++;
                    if (dayLi && !dayLi.classList.contains('completed')) {
                        dayLi.classList.add('completed');
                    }
                } else if (dayLi) {
                    dayLi.classList.remove('completed');
                }
            } catch(e) {}
        } else if (dayLi) {
            dayLi.classList.remove('completed');
        }
    });
    
    const percentage = Math.round((completedDays / totalDays) * 100) || 0;
    const pctEl = document.getElementById('progress-percentage');
    const fillEl = document.getElementById('progress-bar-fill');
    
    if (pctEl) pctEl.textContent = `${percentage}%`;
    if (fillEl) fillEl.style.width = `${percentage}%`;

    const countBadge = document.getElementById('sidebar-history-count');
    if (countBadge) {
        if (completedDays > 0) {
            countBadge.textContent = String(completedDays);
            countBadge.style.display = 'inline-block';
        } else {
            countBadge.style.display = 'none';
        }
    }
}

function showModal(score, total, message, timeSpent, audioTime, targetDayId) {
    const modal = document.getElementById('result-modal');
    if (!modal) return;
    
    const activeDay = targetDayId || currentDay;

    // Hiển thị tên học viên, lớp, DAY
    const savedName = localStorage.getItem('vstep_student_name') || 'Học viên';
    const savedClass = localStorage.getItem('vstep_student_class') || '--';
    const rawDayNum = String(activeDay || '').replace(/\D+/g, '');
    const dayStr = rawDayNum ? `DAY ${rawDayNum.padStart(2, '0')}` : ((daysData[activeDay] && daysData[activeDay].title) || 'DAY');

    const dayTextEl = document.getElementById('modal-day-text');
    const nameEl = document.getElementById('modal-student-name');
    const classEl = document.getElementById('modal-student-class');

    if (dayTextEl) dayTextEl.textContent = dayStr;
    if (nameEl) nameEl.textContent = savedName;
    if (classEl) classEl.textContent = `LỚP: ${savedClass}`;

    document.getElementById('modal-score').textContent = score;
    document.getElementById('modal-total').textContent = '/' + total;
    document.getElementById('modal-message').textContent = message;

    // Hiển thị thời gian làm bài & thời lượng nghe audio thực tế
    let finalTimeSpent = typeof timeSpent === 'number' ? timeSpent : null;
    let finalAudioTime = typeof audioTime === 'number' ? audioTime : null;
    if (finalTimeSpent === null) {
        try {
            const savedState = JSON.parse(localStorage.getItem(`vstep_day_${activeDay}`) || '{}');
            if (typeof savedState.timeSpent === 'number') finalTimeSpent = savedState.timeSpent;
            if (typeof savedState.audioTime === 'number') finalAudioTime = savedState.audioTime;
        } catch(e) {}
    }

    const timeSpentEl = document.getElementById('modal-time-spent');
    const audioTimeEl = document.getElementById('modal-audio-time');
    const warningEl = document.getElementById('modal-time-warning');
    const validEl = document.getElementById('modal-time-valid');

    if (timeSpentEl) {
        timeSpentEl.textContent = finalTimeSpent !== null ? formatTimerHuman(finalTimeSpent) : '--';
    }
    if (audioTimeEl) {
        audioTimeEl.textContent = finalAudioTime !== null ? formatTimerDigits(finalAudioTime) : '--';
    }

    if (finalTimeSpent !== null) {
        // Cảnh báo đối phó: Làm bài dưới 60 giây hoặc nghe audio dưới 15 giây
        const isRushed = finalTimeSpent < 60 || (finalAudioTime !== null && finalAudioTime < 15);
        if (warningEl && validEl) {
            if (isRushed) {
                warningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Cảnh báo: Làm bài quá nhanh (${formatTimerHuman(finalTimeSpent)})! Có dấu hiệu chọn bừa đối phó mà chưa nghe kỹ audio.</span>`;
                warningEl.classList.remove('hidden');
                validEl.classList.add('hidden');
            } else {
                validEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Thời gian làm bài hợp lệ (${formatTimerHuman(finalTimeSpent)})</span>`;
                validEl.classList.remove('hidden');
                warningEl.classList.add('hidden');
            }
        }
    } else {
        if (warningEl) warningEl.classList.add('hidden');
        if (validEl) validEl.classList.add('hidden');
    }
    
    const retryBtn = document.getElementById('modal-retry-btn');
    retryBtn.onclick = () => {
        closeModal();
        if (targetDayId && targetDayId !== currentDay) {
            loadDay(targetDayId);
        }
        resetAll();
    };
    
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');
}

function openDayConfirmationModal(dayId) {
    try {
        const raw = localStorage.getItem(`vstep_day_${dayId}`);
        if (!raw) {
            alert('Chưa tìm thấy dữ liệu nộp bài của ngày này!');
            return;
        }
        const state = JSON.parse(raw);
        const dayInfo = daysData[dayId] || {};
        let totalQuestions = state.total;
        if (!totalQuestions) {
            let qCount = 0;
            const practices = dayInfo.practices || [dayInfo];
            practices.forEach(p => { if (p && p.questions) qCount += p.questions.length; });
            totalQuestions = qCount || 8;
        }
        const score = typeof state.score === 'number' ? state.score : totalQuestions;
        const message = state.message || (
            score === 0 ? "Ôi không, 0 điểm rồi kìa! Mau nghe lại và làm lại ngay nhé, nếu không, Miss Nguyệt đấm cậu đó!" :
            (score / totalQuestions >= 0.5 ? "Cậu đã làm tốt lắm. Tiếp tục cố gắng nhé! Miss Nguyệt khen cậu đó!" :
            "Không sao đâu, miễn là cậu vẫn đang cố gắng! Kiên nhẫn thêm một chút nhé! Nếu không, Miss Nguyệt đấm cậu đó!")
        );
        showModal(score, totalQuestions, message, state.timeSpent, state.audioTime, dayId);
    } catch(e) {
        console.warn('Error opening confirmation modal:', e);
    }
}

function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    renderHistoryList();
    modal.classList.remove('hidden');
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden');
}

function renderHistoryList() {
    const listEl = document.getElementById('history-list');
    const nameEl = document.getElementById('hist-student-name');
    const classEl = document.getElementById('hist-student-class');
    const totalEl = document.getElementById('hist-total-count');
    const sidebarCountEl = document.getElementById('sidebar-history-count');

    const savedName = localStorage.getItem('vstep_student_name') || 'Học viên';
    const savedClass = localStorage.getItem('vstep_student_class') || '--';

    if (nameEl) nameEl.textContent = savedName;
    if (classEl) classEl.textContent = `Lớp: ${savedClass}`;

    const submittedItems = [];

    // Quét toàn bộ các DAY đã nộp bài
    Object.keys(daysData).forEach(dayKey => {
        try {
            const raw = localStorage.getItem(`vstep_day_${dayKey}`);
            if (!raw) return;
            const state = JSON.parse(raw);
            const isSubmitted = state.submittedPractices ? 
                Object.values(state.submittedPractices).some(val => val === true) : 
                Boolean(state.submitted);

            if (isSubmitted) {
                const dayInfo = daysData[dayKey] || {};
                let totalQ = state.total;
                if (!totalQ) {
                    let count = 0;
                    const practices = dayInfo.practices || [dayInfo];
                    practices.forEach(p => { if (p && p.questions) count += p.questions.length; });
                    totalQ = count || 8;
                }
                const score = typeof state.score === 'number' ? state.score : totalQ;
                
                submittedItems.push({
                    dayId: dayKey,
                    dayNum: parseInt(String(dayKey).replace(/\D+/g, ''), 10) || 0,
                    title: dayInfo.sidebarTitle || `DAY ${String(dayKey).padStart(2, '0')}`,
                    score: score,
                    total: totalQ,
                    timeSpent: state.timeSpent,
                    audioTime: state.audioTime,
                    submittedAt: state.submittedAt
                });
            }
        } catch(e) {}
    });

    // Sắp xếp: bài nộp gần nhất lên đầu (theo thời gian hoặc số DAY)
    submittedItems.sort((a, b) => {
        if (a.submittedAt && b.submittedAt) {
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        }
        return b.dayNum - a.dayNum;
    });

    if (totalEl) totalEl.textContent = String(submittedItems.length);
    if (sidebarCountEl) {
        if (submittedItems.length > 0) {
            sidebarCountEl.textContent = String(submittedItems.length);
            sidebarCountEl.style.display = 'inline-block';
        } else {
            sidebarCountEl.style.display = 'none';
        }
    }

    if (!listEl) return;

    if (submittedItems.length === 0) {
        listEl.innerHTML = `
            <div class="history-empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h4 style="margin: 0 0 6px 0; color: #64748b;">Chưa có bài nghe nào được nộp</h4>
                <p style="margin: 0; font-size: 0.84rem;">Sau khi hoàn thành và nộp bất kỳ bài nghe nào, kết quả và ảnh xác nhận sẽ hiển thị ở đây để bạn xem lại bất cứ lúc nào!</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = submittedItems.map(item => {
        const pct = Math.round((item.score / item.total) * 100);
        let scoreClass = 'score-good';
        if (pct === 0) scoreClass = 'score-low';
        else if (pct < 50) scoreClass = 'score-mid';

        const spentStr = typeof item.timeSpent === 'number' ? formatTimerHuman(item.timeSpent) : '--';
        const audioStr = typeof item.audioTime === 'number' ? formatTimerDigits(item.audioTime) : '--';

        const isRushed = typeof item.timeSpent === 'number' && (item.timeSpent < 60 || (typeof item.audioTime === 'number' && item.audioTime < 15));
        const statusBadge = isRushed
            ? `<span class="history-time-badge warning"><i class="fa-solid fa-triangle-exclamation"></i> Làm quá nhanh</span>`
            : (typeof item.timeSpent === 'number'
                ? `<span class="history-time-badge valid"><i class="fa-solid fa-circle-check"></i> Hợp lệ</span>`
                : '');

        let dateStr = '';
        if (item.submittedAt) {
            try {
                const d = new Date(item.submittedAt);
                dateStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            } catch(e) {}
        }

        return `
            <div class="history-item-row">
                <div class="history-item-main">
                    <div class="history-item-top">
                        <span class="history-day-badge"><i class="fa-solid fa-headphones"></i> ${item.title}</span>
                        <span class="history-score-badge ${scoreClass}">${item.score}/${item.total} câu (${pct}%)</span>
                        ${statusBadge}
                    </div>
                    <div class="history-item-meta">
                        <span><i class="fa-solid fa-stopwatch"></i> Làm bài: <strong>${spentStr}</strong></span>
                        <span><i class="fa-solid fa-headphones"></i> Nghe audio: <strong>${audioStr}</strong></span>
                        ${dateStr ? `<span><i class="fa-regular fa-calendar-check"></i> ${dateStr}</span>` : ''}
                    </div>
                </div>
                <div class="history-item-actions">
                    <button type="button" class="btn-history-view-confirm" onclick="closeHistoryModal(); openDayConfirmationModal('${item.dayId}')" title="Mở bảng điểm để chụp ảnh màn hình">
                        <i class="fa-solid fa-camera"></i> Xem ảnh xác nhận
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function initHistoryEvents() {
    const btnSidebar = document.getElementById('btn-sidebar-history');
    if (btnSidebar) {
        btnSidebar.addEventListener('click', () => openHistoryModal());
    }

    const btnHeader = document.getElementById('btn-header-history');
    if (btnHeader) {
        btnHeader.addEventListener('click', () => openHistoryModal());
    }

    const btnClose = document.getElementById('btn-close-history');
    if (btnClose) {
        btnClose.addEventListener('click', () => closeHistoryModal());
    }

    const historyModal = document.getElementById('history-modal');
    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) closeHistoryModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHistoryModal();
            closeModal();
        }
    });

    // Refresh history badge count initially
    renderHistoryList();
}

// --- Login Logic ---
const ALLOWED_CLASSES = ['ONB103', 'CB213', 'CB211', 'CB210', 'GV'];
const VALID_PASSWORDS = ['STUDYHARD', 'PRACTICELISTENING'];
const REQUIRED_PASSWORD = 'PRACTICELISTENING';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe1aPeztsRKWBdl_fG_2HulMol6L9p0EDWPaxzKR69E5vHJcA/formResponse';
const GOOGLE_FORM_ENTRY = 'entry.1205151935';

const CLASS_STUDENTS = {
    'ONB103': [
        'Nguyễn Thị Duy',
        'Phạm Trần Mỹ Hân',
        'Trịnh Thị Thu Hiền',
        'Nguyễn Hoàng Kha',
        'Phạm Thị Út Lụa',
        'Lê Huỳnh Diễm My',
        'Nguyễn Thị Ngọc Mỹ',
        'Huỳnh Thị Kim Ngân',
        'Trần Thị Kim Ngân',
        'Nguyễn Thị Tiểu Phụng',
        'Trần Yến Phụng',
        'Phạm Ngọc Thạch',
        'Cao Thị Thu Trang',
        'Nguyễn Thị Thanh Tuyền',
        'Trần Phạm Phương Uyên',
        'Trần Ngô Mỹ Vy'
    ],
    'CB213': [
        'Nguyễn Quốc Anh',
        'Hoàng Hợp Minh Châu',
        'Đặng Châu Gia Huy',
        'Trần Minh Tuệ Mẩn',
        'Đặng Thị Trúc Măng',
        'Trương Thị Kha My',
        'Ngô Diễm My',
        'Chiêm Chúc Ngân',
        'Huỳnh Thị Yến Nhi',
        'Phạm Nguyễn Tâm Như',
        'Phạm Nhựt Tiến',
        'Lê Thị Tú Trinh',
        'Trần Ngọc Vinh'
    ],
    'CB211': [
        'Hồ Anh Quân',
        'Lê Thành Nghiệp',
        'Lê Khánh Lâm',
        'Huỳnh Thị Ngọc Thắm',
        'Mai Trần Xuân Mai',
        'Lê Thị Uyển Nhi',
        'Nguyễn Thụy Thanh Trúc'
    ],
    'CB210': [
        'Nguyễn Võ Thành Đạt',
        'Lê Huỳnh Thanh Duy',
        'Nguyễn Cao Kỳ Duyên',
        'Đào Ngọc Hân',
        'Trần Văn Hữu',
        'Trần Văn Kim Khoa',
        'Nguyễn Thanh Nâng',
        'Huỳnh Kỳ Nguyên',
        'Võ Thị Kim Nguyên',
        'Võ Hùng Sanh',
        'Tiền Thị Thanh Thảo',
        'Đặng Thị Kim Thoa',
        'Trần Thị Tiên Tiên',
        'Lê Kim Tuyền'
    ],
    };

const AUTHORIZED_STUDENTS = [
    ...CLASS_STUDENTS['ONB103'],
    ...CLASS_STUDENTS['CB213'],
    ...CLASS_STUDENTS['CB211'],
    ...CLASS_STUDENTS['CB210'],
    ...CLASS_STUDENTS['B2']
];

function normalizeName(str) {
    if (!str) return '';
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ');
}

function isAuthorizedStudent(name, classVal) {
    const norm = normalizeName(name);
    const noAcc = removeAccents(name);
    if (noAcc.includes('gia tue') || noAcc.replace(/\s+/g, '').includes('giatue') || classVal === 'B2') return false;
    if (norm === 'ptmn' || norm.includes('ptmn') || noAcc.includes('co nguyet')) return true;

    const matchesName = (auth) => {
        const authNorm = normalizeName(auth);
        const authNoAcc = removeAccents(auth);
        return authNorm === norm || authNoAcc === noAcc || norm.endsWith(' ' + authNorm) || noAcc.endsWith(' ' + authNoAcc);
    };

    if (classVal && CLASS_STUDENTS[classVal]) {
        return CLASS_STUDENTS[classVal].some(matchesName);
    }

    return AUTHORIZED_STUDENTS.some(matchesName);
}

function initLogin() {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const studentNameInput = document.getElementById('studentName');
    const studentClassInput = document.getElementById('studentClass');
    const studentPasswordInput = document.getElementById('studentPassword');
    const loginError = document.getElementById('loginError');
    const btnLogin = document.getElementById('btnLogin');

    if (!loginOverlay) return;

    // Luôn luôn hiển thị màn hình đăng nhập khi mở hoặc tải lại trang
    loginOverlay.classList.remove('hidden');
    updateUserProfileBadge();
    let savedName = localStorage.getItem('vstep_student_name') || '';
    let savedClass = localStorage.getItem('vstep_student_class') || '';
    const normSaved = (typeof removeAccents === 'function' ? removeAccents(savedName) : savedName.toLowerCase());
    if (normSaved.includes('gia tue') || normSaved.replace(/\s+/g, '').includes('giatue') || savedClass === 'B2') {
        localStorage.removeItem('vstep_student_name');
        localStorage.removeItem('vstep_student_class');
        localStorage.removeItem('vstep_student_logged_in');
        sessionStorage.removeItem('vstep_student_logged_in');
        savedName = '';
        savedClass = '';
    }

    const isTeacherSaved = savedName.toUpperCase().includes('PTMN') || savedName.toLowerCase().includes('cô nguyệt');
    if (studentNameInput) {
        studentNameInput.value = isTeacherSaved ? 'PTMN' : savedName;
    }
    if (studentClassInput) {
        studentClassInput.value = isTeacherSaved ? 'GV' : savedClass;
    }
    if (studentPasswordInput) {
        studentPasswordInput.value = isTeacherSaved ? 'GV' : '';
    }

    function getVietnamHour() {
        try {
            const hourStr = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: 'numeric',
                hour12: false
            }).format(new Date());
            return parseInt(hourStr, 10) % 24;
        } catch (e) {
            return (new Date().getUTCHours() + 7) % 24;
        }
    }

    const currentVnHour = getVietnamHour();
    const isQuietHours = currentVnHour >= 22 || currentVnHour < 5;

    if (studentNameInput) {
        studentNameInput.addEventListener('input', () => {
            const val = studentNameInput.value.trim().toUpperCase();
            if (val === 'PTMN' || val.includes('PTMN')) {
                if (studentClassInput && !studentClassInput.value) studentClassInput.value = 'GV';
                if (studentPasswordInput && !studentPasswordInput.value) studentPasswordInput.value = 'GV';
                if (loginError && isQuietHours) {
                    loginError.style.display = 'none';
                    loginError.textContent = '';
                }
            }
        });
    }

    if (loginError) {
        if (!isTeacherSaved && isQuietHours) {
            showLoginError('Miss Nguyệt đóng cửa tiễn khách rồi. Hãy ngủ sớm và quay lại sau 05:00 sáng nhé! 😴');
        } else {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }
    }

    setTimeout(() => {
        if (studentPasswordInput && savedName && savedClass && !isTeacherSaved) {
            studentPasswordInput.focus();
        } else if (studentNameInput) {
            studentNameInput.focus();
        }
    }, 150);

    function showLoginError(msg) {
        if (!loginError) return;
        loginError.textContent = msg;
        loginError.style.display = 'block';
    }

    async function handleLoginSubmit() {
        if (btnLogin && btnLogin.disabled) return;
        const nameVal = studentNameInput ? studentNameInput.value.trim() : '';
        let rawClassVal = studentClassInput ? studentClassInput.value.trim().toUpperCase().replace(/\s+/g, '') : '';
        const passwordVal = studentPasswordInput ? studentPasswordInput.value.trim() : '';

        if (!nameVal) {
            showLoginError('Vui lòng nhập đầy đủ Họ và tên.');
            if (studentNameInput) studentNameInput.focus();
            return;
        }

        const isTeacher = nameVal.toUpperCase() === 'PTMN' || nameVal.toUpperCase().includes('PTMN') || nameVal.toLowerCase().includes('cô nguyệt');

        if (isTeacher) {
            rawClassVal = 'GV';
            // Giáo viên đăng nhập: Không bắt buộc nhập mật khẩu (cho phép để trống, hoặc nhập GV ở ô lớp/mật khẩu)
            const isTeacherPassValid = !passwordVal || passwordVal.toUpperCase() === 'GV' || VALID_PASSWORDS.includes(passwordVal.toUpperCase());
            if (!isTeacherPassValid) {
                showLoginError('Mật khẩu giáo viên không chính xác!');
                if (studentPasswordInput) studentPasswordInput.focus();
                return;
            }
        } else {
            // Giới hạn thời gian đăng nhập cho học viên: Không cho đăng nhập từ 22:00 đến 05:00 sáng (Giờ Việt Nam)
            const vnH = getVietnamHour();
            if (vnH >= 22 || vnH < 5) {
                showLoginError('Miss Nguyệt đóng cửa tiễn khách rồi. Hãy ngủ sớm và quay lại sau 05:00 sáng nhé! 😴');
                return;
            }

            if (!rawClassVal) {
                showLoginError('Vui lòng nhập Lớp học (ONB103, CB213, CB211, CB210 hoặc B2).');
                if (studentClassInput) studentClassInput.focus();
                return;
            }

            const noAcc = removeAccents(nameVal);
            if (noAcc.includes('gia tue') || noAcc.replace(/\s+/g, '').includes('giatue') || rawClassVal === 'B2') {
                showLoginError('Tài khoản học viên "Gia Tuệ" hiện đã bị KHÓA! Vui lòng liên hệ Giáo viên (Cô Nguyệt).');
                if (studentNameInput) studentNameInput.focus();
                return;
            }

            if (rawClassVal === 'GV') {
                showLoginError('Mã lớp GV chỉ dành riêng cho tài khoản Giáo viên (PTMN)!');
                if (studentClassInput) studentClassInput.focus();
                return;
            }

            if (!ALLOWED_CLASSES.includes(rawClassVal)) {
                showLoginError('Hệ thống hiện chỉ mở cho học viên lớp ONB103, CB213, CB211, CB210 và B2!');
                if (studentClassInput) studentClassInput.focus();
                return;
            }

            if (!isAuthorizedStudent(nameVal, rawClassVal)) {
                showLoginError(`Họ và tên không nằm trong danh sách học viên lớp ${rawClassVal}!`);
                if (studentNameInput) studentNameInput.focus();
                return;
            }

            if (!passwordVal) {
                showLoginError('Vui lòng nhập Mật khẩu.');
                if (studentPasswordInput) studentPasswordInput.focus();
                return;
            }

            if (!VALID_PASSWORDS.includes(passwordVal.toUpperCase())) {
                showLoginError('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
                if (studentPasswordInput) {
                    studentPasswordInput.focus();
                    studentPasswordInput.select();
                }
                return;
            }
        }

        if (loginError) loginError.style.display = 'none';
        if (btnLogin) {
            btnLogin.textContent = isTeacher ? 'ĐANG VÀO LỚP...' : 'ĐANG KIỂM TRA CHUỖI...';
            btnLogin.disabled = true;
        }

        // Save student info to storage
        let displayName = nameVal;
        if (isTeacher) {
            displayName = 'Cô Nguyệt (PTMN)';
        } else {
            const classPool = (CLASS_STUDENTS[rawClassVal] || AUTHORIZED_STUDENTS);
            const matched = classPool.find(auth => {
                const authNorm = normalizeName(auth);
                const authNoAcc = removeAccents(auth);
                const nNorm = normalizeName(nameVal);
                const nNoAcc = removeAccents(nameVal);
                return authNorm === nNorm || authNoAcc === nNoAcc || nNorm.endsWith(' ' + authNorm) || nNoAcc.endsWith(' ' + authNoAcc);
            });
            if (matched) {
                displayName = matched;
            }
        }

        if (window.StreakGuard) {
            if (isTeacher) {
                window.StreakGuard.onTeacherLoggedIn();
            } else {
                const streakRes = await window.StreakGuard.checkStudentLogin(displayName, rawClassVal);
                if (!streakRes || !streakRes.allowed) {
                    if (btnLogin) {
                        btnLogin.innerHTML = `<span>BẮT ĐẦU HỌC</span> <i class="fa-solid fa-arrow-right"></i>`;
                        btnLogin.disabled = false;
                    }
                    return;
                }
            }
        }

        if (btnLogin) {
            btnLogin.textContent = 'ĐANG VÀO LỚP...';
        }

        localStorage.setItem('vstep_student_name', displayName);
        localStorage.setItem('vstep_student_class', rawClassVal);
        localStorage.setItem('vstep_student_logged_in', 'true');
        sessionStorage.setItem('vstep_student_logged_in', 'true');

        // Submit to Google Form (no-cors)
        try {
            const formData = new URLSearchParams();
            formData.append(GOOGLE_FORM_ENTRY, `${displayName} - ${rawClassVal}`);
            fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            }).catch(e => console.log('Log form info error', e));
        } catch (e) {
            console.log('Log form error', e);
        }

        if (window.FlowerGarden) {
            FlowerGarden.updateTitleWithStudentName();
        }
        setTimeout(() => {
            if (loginOverlay) loginOverlay.classList.add('hidden');
            if (btnLogin) {
                btnLogin.textContent = 'BẮT ĐẦU HỌC NGAY';
                btnLogin.disabled = false;
            }
            updateUserProfileBadge();
        }, 300);
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            handleLoginSubmit();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLoginSubmit();
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Bạn có muốn đổi tài khoản học viên khác không?')) {
                if (loginOverlay) {
                    loginOverlay.classList.remove('hidden');
                    updateUserProfileBadge();
                    if (studentPasswordInput) {
                        studentPasswordInput.value = '';
                        studentPasswordInput.focus();
                    }
                }
            }
        });
    }
}

function updateUserProfileBadge() {
    const badge = document.getElementById('userProfileBadge');
    const nameEl = document.getElementById('displayUserName');
    const classEl = document.getElementById('displayUserClass');
    const loginOverlay = document.getElementById('loginOverlay');
    if (!badge || !nameEl || !classEl) return;

    // Khi cửa sổ đăng nhập đang mở, ẩn huy hiệu thông tin ở góc
    if (loginOverlay && !loginOverlay.classList.contains('hidden')) {
        badge.classList.add('hidden');
        return;
    }

    let savedName = localStorage.getItem('vstep_student_name') || '';
    let savedClass = localStorage.getItem('vstep_student_class') || '';
    const normSaved = (typeof removeAccents === 'function' ? removeAccents(savedName) : savedName.toLowerCase());
    if (normSaved.includes('gia tue') || normSaved.replace(/\s+/g, '').includes('giatue') || savedClass === 'B2') {
        localStorage.removeItem('vstep_student_name');
        localStorage.removeItem('vstep_student_class');
        localStorage.removeItem('vstep_student_logged_in');
        sessionStorage.removeItem('vstep_student_logged_in');
        savedName = '';
        savedClass = '';
    }

    if (savedName) {
        nameEl.textContent = savedName;
        classEl.textContent = savedClass ? `Lớp: ${savedClass}` : '';
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}




function toggleChongDiecPassword() {
    const pwdInput = document.getElementById('studentPassword');
    const icon = document.getElementById('toggle-pwd-icon');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (icon) {
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        }
    } else {
        pwdInput.type = 'password';
        if (icon) {
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
    }
}
window.toggleChongDiecPassword = toggleChongDiecPassword;
