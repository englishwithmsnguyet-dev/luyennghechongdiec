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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    updateProgress();
    loadDay(currentDay);
    initLogin();
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

function loadDay(dayId) {
    currentDay = dayId;
    
    // Reset state
    selectedAnswers = {};
    submittedPractices = {};
    
    // Clear containers
    audioContainer.innerHTML = '';
    quizContainer.innerHTML = '';
    
    const warningBox = document.querySelector('.audio-warning');
    
    if (dayId === 'home') {
        if (warningBox) warningBox.classList.add('hidden');
        renderHomePage();
        return;
    } else {
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
        
        explanationSection.innerHTML = `
            <button class="btn-explain" onclick="toggleExplanation(${q.id}, \'${practiceId}\')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${hasHighlights ? 'Giải thích chi tiết (Khoanh vùng đáp án)' : 'Giải thích chi tiết'}
            </button>
            <div id="exp-content-${q.id}" class="explanation-content hidden">
                <p class="transcript-en"><strong>${labelEN}</strong><br>${displayEN}</p>
                <p class="transcript-vn"><strong>${labelVN}</strong><br>${displayVN}</p>
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
    
    // Save state to localStorage
    localStorage.setItem(`vstep_day_${currentDay}`, JSON.stringify({ submitted: true }));
    
    updateProgress();
    
    if (!isRestore) {
        const percentage = (totalScore / totalQuestions) * 100;
        let message = "";
        if (percentage === 0) {
            message = "Tới là Doraemon nè Nobita. Cậu đang áp lực lắm hả?";
        } else if (percentage >= 50) {
            message = "Cậu đã làm tốt lắm. Tiếp tục cố gắng nhé!";
        } else {
            message = "Không sao đâu, miễn là cậu vẫn đang cố gắng! Kiên nhẫn thêm một chút nhé!";
        }
        showModal(totalScore, totalQuestions, message);
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
}

function showModal(score, total, message) {
    const modal = document.getElementById('result-modal');
    if (!modal) return;
    
    document.getElementById('modal-score').textContent = score;
    document.getElementById('modal-total').textContent = '/' + total;
    document.getElementById('modal-message').textContent = message;
    
    const retryBtn = document.getElementById('modal-retry-btn');
    retryBtn.onclick = () => {
        closeModal();
        resetAll();
    };
    
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');
}

// --- Login Logic ---
const ALLOWED_CLASSES = ['CB196', 'CB201', 'CB202', 'B209'];
const REQUIRED_PASSWORD = 'PRACTICELISTENING';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScU5Jd_R15uECAgsBMHZsqKAaCR2g2K1IzqOGs-ZN9_RbDkdQ/formResponse';
const GOOGLE_FORM_ENTRY = 'entry.388968236';

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
    const savedName = localStorage.getItem('vstep_student_name') || '';
    const savedClass = localStorage.getItem('vstep_student_class') || '';
    if (studentNameInput && savedName) studentNameInput.value = savedName;
    if (studentClassInput && savedClass) studentClassInput.value = savedClass;
    if (studentPasswordInput) studentPasswordInput.value = '';
    if (loginError) {
        loginError.style.display = 'none';
        loginError.textContent = '';
    }

    setTimeout(() => {
        if (studentPasswordInput && savedName && savedClass) {
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

    function handleLoginSubmit() {
        const nameVal = studentNameInput ? studentNameInput.value.trim() : '';
        const rawClassVal = studentClassInput ? studentClassInput.value.trim().toUpperCase().replace(/\s+/g, '') : '';
        const passwordVal = studentPasswordInput ? studentPasswordInput.value.trim() : '';

        if (!nameVal) {
            showLoginError('Vui lòng nhập đầy đủ Họ và tên.');
            if (studentNameInput) studentNameInput.focus();
            return;
        }

        if (!rawClassVal) {
            showLoginError('Vui lòng nhập Lớp học.');
            if (studentClassInput) studentClassInput.focus();
            return;
        }

        if (!ALLOWED_CLASSES.includes(rawClassVal)) {
            showLoginError(`Lớp học không hợp lệ. Chỉ chấp nhận các lớp: ${ALLOWED_CLASSES.join(', ')}.`);
            if (studentClassInput) studentClassInput.focus();
            return;
        }

        if (!passwordVal) {
            showLoginError('Vui lòng nhập Mật khẩu.');
            if (studentPasswordInput) studentPasswordInput.focus();
            return;
        }

        if (passwordVal.toUpperCase() !== REQUIRED_PASSWORD) {
            showLoginError('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
            if (studentPasswordInput) {
                studentPasswordInput.focus();
                studentPasswordInput.select();
            }
            return;
        }

        if (loginError) loginError.style.display = 'none';
        if (btnLogin) {
            btnLogin.textContent = 'ĐANG VÀO LỚP...';
            btnLogin.disabled = true;
        }

        // Save student info to storage
        localStorage.setItem('vstep_student_name', nameVal);
        localStorage.setItem('vstep_student_class', rawClassVal);
        localStorage.setItem('vstep_student_logged_in', 'true');
        sessionStorage.setItem('vstep_student_logged_in', 'true');

        // Submit to Google Form (no-cors)
        try {
            const formData = new URLSearchParams();
            formData.append(GOOGLE_FORM_ENTRY, `${nameVal} - ${rawClassVal}`);
            fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            }).catch(e => console.log('Log form info error', e));
        } catch (e) {
            console.log('Log form error', e);
        }

        setTimeout(() => {
            if (loginOverlay) loginOverlay.classList.add('hidden');
            if (btnLogin) {
                btnLogin.textContent = 'BẮT ĐẦU HỌC NGAY';
                btnLogin.disabled = false;
            }
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
}

