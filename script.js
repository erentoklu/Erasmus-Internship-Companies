const SHEET_URL = "https://script.google.com/macros/s/AKfycbxjDVIB52kQD7liMwXesoyYDlgDpzIKSoVx1ZPb1LYJCjdSIjS2UObPb7i0t88yCQaK/exec";

let jobsData = []; 
let currentTab = 'cold'; 
let currentPage = 1;
const itemsPerPage = 50;
let currentFilteredJobs = [];

let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
savedJobs = savedJobs.filter(id => id !== null && id !== undefined && !isNaN(id));
localStorage.setItem('savedJobs', JSON.stringify(savedJobs));

const jobContainer = document.getElementById('job-container');
const tabButtons = document.querySelectorAll('.tab-btn');
const savedCount = document.getElementById('saved-count');
const companiesCount = document.getElementById('companies-count');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const modal = document.getElementById('job-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

const fieldSelect = document.getElementById('field-select');
const subcategorySelect = document.getElementById('subcategory-select');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
}

const heartSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const searchSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
const loadingSVG = `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;
const companySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`;

function updateSavedCount() {
    if (savedCount) savedCount.textContent = `(${savedJobs.length})`;
}

function updateCompaniesCount() {
    if (companiesCount) companiesCount.textContent = `(${jobsData.length})`;
}

function updateLocationCounts() {
    const locationSelect = document.getElementById('location-select');
    Array.from(locationSelect.options).forEach(option => {
        const loc = option.value.toUpperCase();
        if (loc === 'ALL') return;
        const count = jobsData.filter(job => job.location && job.location.includes(loc)).length;
        const baseText = option.text.split(' (')[0];
        option.text = `${baseText} (${count})`;
    });
}

async function fetchJobs() {
    const cachedData = localStorage.getItem('cachedJobsData');
    
    if (cachedData) {
        jobsData = JSON.parse(cachedData);
        updateLocationCounts();
        updateCompaniesCount();
        renderJobs(true);
    } else {
        jobContainer.innerHTML = `
            <div class="empty-state">
                ${loadingSVG}
                <p>LOADING...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(SHEET_URL, { redirect: "follow" });
        const data = await response.json();
        
        const formattedData = data.map(job => ({
            id: parseInt(job.id),
            company: job.company ? String(job.company).toUpperCase() : '',
            location: job.location ? String(job.location).toUpperCase() : '',
            category: job.category ? String(job.category).toUpperCase() : '',
            subcategory: job.subcategory ? String(job.subcategory).toUpperCase().split(',').map(s => s.trim()).filter(s => s) : [],
            subcategory2: job.subcategory2 ? String(job.subcategory2).toUpperCase().split(',').map(s => s.trim()).filter(s => s) : [],
            tab: job.tab ? String(job.tab).toLowerCase() : '',
            description: job.description ? String(job.description).toUpperCase() : '',
            requirements: job.requirements ? String(job.requirements).toUpperCase() : '',
            contact: (job.contacts || job.contact) ? String(job.contacts || job.contact).toUpperCase() : '', 
            link: job.link || ''
        }));
        
        localStorage.setItem('cachedJobsData', JSON.stringify(formattedData));
        
        if (!cachedData || JSON.stringify(jobsData) !== JSON.stringify(formattedData)) {
            jobsData = formattedData;
            updateLocationCounts();
            updateCompaniesCount();
            
            const searchText = document.getElementById('search-input').value;
            if (currentPage === 1 && searchText === '') {
                renderJobs(true);
            }
        }
        
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        if (!cachedData) {
            jobContainer.innerHTML = `
                <div class="empty-state">
                    <p style="color: #ef4444;">FAILED TO LOAD DATA.<br>MAKE SURE GOOGLE APPS SCRIPT IS DEPLOYED AS "ANYONE".</p>
                </div>
            `;
        }
    }
}

fieldSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Engineering') {
        subcategorySelect.classList.remove('hidden');
    } else {
        subcategorySelect.classList.add('hidden');
        subcategorySelect.value = 'All';
    }
    renderJobs(true);
});

function renderJobs(resetPage = true) {
    if (currentTab === 'about' || currentTab === 'analytics' || currentTab === 'recommendations') {
        document.querySelector('.search-filter-section').classList.add('hidden');
        
        if (currentTab === 'about') {
            jobContainer.innerHTML = `
                <div style="grid-column: 1 / -1; max-width: 800px; margin: 2rem auto; padding: 3rem; background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <h2 style="margin-bottom: 1.5rem; color: var(--text-main); font-size: 1.8rem; text-align: center;">ABOUT INTERNERASMUS</h2>
                    
                    <div style="margin-bottom: 2rem; background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 1rem; border-radius: 0 4px 4px 0;">
                        <h4 style="color: #ef4444; margin-bottom: 0.5rem; font-size: 0.9rem;">DISCLAIMER</h4>
                        <p style="color: var(--text-main); font-size: 0.9rem; line-height: 1.6;">
                            THIS PROJECT IS AN INDEPENDENT, NON-PROFIT INITIATIVE. IT IS NOT AFFILIATED WITH, ENDORSED BY, OR CONNECTED TO THE EUROPEAN UNION OR THE OFFICIAL ERASMUS+ PROGRAMME IN ANY WAY.
                        </p>
                    </div>

                    <h3 style="color: var(--accent-text); font-size: 1.1rem; margin-bottom: 0.5rem;">WHAT IS THIS WEBSITE?</h3>
                    <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.8; margin-bottom: 1.5rem;">
                       I originally built this website to help myself and my friends find Erasmus internships. But it's definitely not just for Erasmus. You can also utilize it to find jobs and other internships in Europe, too.

The main goal here is to save you time. The site is all about simplicity and works exactly like an interactive Excel table. It acts as a quick search engine where you can just open the page and start doing your research right away.

If you find it useful, please share it so it can reach more people. Also, feel free to leave feedback to help it grow. Best of luck with your search!
                    </p>

                    <h3 style="color: var(--accent-text); font-size: 1.1rem; margin-bottom: 0.5rem;">YOUR DATA IS YOURS</h3>
                    <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.8;">
                        NO ACCOUNT CREATION IS REQUIRED. EVERY COMPANY YOU SAVE IS STORED STRICTLY ON YOUR OWN DEVICE'S BROWSER (LOCALSTORAGE). WE DO NOT TRACK, STORE, OR SELL YOUR PERSONAL DATA.
                    </p>
                </div>
            `;
        } else if (currentTab === 'recommendations') {
            jobContainer.innerHTML = `
                <div style="grid-column: 1 / -1; max-width: 900px; margin: 2rem auto; display: flex; flex-wrap: wrap; gap: 2rem;">
                    
                    <!-- Sol Taraf: Öneriler -->
                    <div style="flex: 1; min-width: 300px; background-color: var(--surface-color); padding: 2rem; border: 1px solid var(--border-color); border-radius: 8px;">
                        <h2 style="color: var(--accent-text); margin-bottom: 1.5rem; font-size: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">TIPS FOR YOUR SEARCH</h2>
                        
                        <ul style="list-style: none; display: flex; flex-direction: column; gap: 1.5rem; color: var(--text-muted);">
                            <li>
                                <strong style="color: var(--text-main); display: block; margin-bottom: 0.3rem;">1. TAILOR YOUR EMAILS</strong>
                                Don't just copy-paste the templates. Modify them to mention a specific recent project the company worked on to show genuine interest.
                            </li>
                            <li>
                                <strong style="color: var(--text-main); display: block; margin-bottom: 0.3rem;">2. SHOWCASE YOUR PROJECTS</strong>
                                A standard CV often isn't enough. If you are in engineering, design, or software, attach a personal portfolio highlighting hands-on projects or independent research.
                            </li>
                            <li>
                                <strong style="color: var(--text-main); display: block; margin-bottom: 0.3rem;">3. THE 1-WEEK FOLLOW-UP</strong>
                                Companies are busy. If you don't hear back after 7 days, reply to your original email with a polite, one-sentence reminder. This dramatically increases response rates.
                            </li>
                            <li>
                                <strong style="color: var(--text-main); display: block; margin-bottom: 0.3rem;">4. EMPHASIZE THE GRANT</strong>
                                Always make it clear early in your communication that you are eligible for an Erasmus+ grant, meaning you won't be a financial burden on the host organization.
                            </li>
                        </ul>
                    </div>

                    <!-- Sağ Taraf: Feedback Formu -->
                    <div style="flex: 1; min-width: 300px; background-color: var(--surface-color); padding: 2rem; border: 1px solid var(--border-color); border-radius: 8px;">
                        <h2 style="color: var(--text-main); margin-bottom: 1rem; font-size: 1.5rem;">WE VALUE YOUR FEEDBACK</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                            Do you want to suggest a new company, report a broken link, or share ideas to improve this platform? Send a message directly to the developer. (This is private and won't be displayed publicly).
                        </p>

                        <form name="feedback-form" method="POST" data-netlify="true" style="display: flex; flex-direction: column; gap: 1rem;">
                            <input type="hidden" name="form-name" value="feedback-form" />
                            
                            <select name="topic" class="filter-input custom-select" required style="width: 100%;">
                                <option value="" disabled selected>SELECT A TOPIC...</option>
                                <option value="SUGGEST_COMPANY">Suggest a New Company</option>
                                <option value="REPORT_ERROR">Report Broken Link / Error</option>
                                <option value="UX_SUGGESTION">Site Improvement Suggestion</option>
                                <option value="OTHER">Other</option>
                            </select>

                            <textarea name="message" class="filter-input" rows="6" placeholder="WRITE YOUR MESSAGE HERE..." required style="width: 100%; resize: vertical; font-family: inherit;"></textarea>

                            <button type="submit" class="copy-btn" style="margin-top: 0.5rem;">SEND FEEDBACK</button>
                        </form>
                    </div>
                </div>
            `;
        } else if (currentTab === 'analytics') {
            const totalCompanies = jobsData.length;
            const savedJobsData = jobsData.filter(job => savedJobs.includes(job.id));
            const savedCountTotal = savedJobsData.length;
            
            const getCountryCounts = (dataArray) => {
                const counts = {};
                dataArray.forEach(item => {
                    if (item.location && item.location.trim() !== '') {
                        const parts = item.location.split(',');
                        const country = parts[parts.length - 1].trim(); 
                        counts[country] = (counts[country] || 0) + 1;
                    }
                });
                return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
            };

            const getFixedCategoryCounts = (dataArray) => {
                const counts = { 'BUSINESS': 0, 'ENGINEERING': 0, 'SOFTWARE': 0, 'ART': 0 };
                dataArray.forEach(item => {
                    const combinedCats = [item.category, ...item.subcategory, ...item.subcategory2].join(' ').toUpperCase();
                    if (combinedCats.includes('BUSINESS') || combinedCats.includes('BUSSINESS')) counts['BUSINESS']++;
                    if (combinedCats.includes('ENGINEERING')) counts['ENGINEERING']++;
                    if (combinedCats.includes('SOFTWARE')) counts['SOFTWARE']++;
                    if (combinedCats.includes('ART')) counts['ART']++;
                });
                return Object.entries(counts).sort((a, b) => b[1] - a[1]);
            };

            const allLocData = getCountryCounts(jobsData);
            const allCatData = getFixedCategoryCounts(jobsData);
            const savedLocData = getCountryCounts(savedJobsData);
            const savedCatData = getFixedCategoryCounts(savedJobsData);

            jobContainer.innerHTML = `
                <div style="grid-column: 1 / -1; width: 100%; margin: 1rem auto; padding: 2rem; background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <h2 style="margin-bottom: 2rem; color: var(--text-main); font-size: 1.8rem; text-align: center;">ANALYTICS IN NUMBERS</h2>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
                        <div style="flex: 1; min-width: 300px; background: var(--bg-color); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <h3 style="color: var(--accent-text); margin-bottom: 1.5rem; text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">ALL COMPANIES (${totalCompanies})</h3>
                            
                            <div style="margin-bottom: 2.5rem;">
                                <h4 style="text-align: center; color: var(--text-main); font-size: 0.95rem; margin-bottom: 1rem; font-weight: 500;">COMPANIES BY COUNTRY</h4>
                                <canvas id="chart-all-loc"></canvas>
                            </div>
                            <div>
                                <h4 style="text-align: center; color: var(--text-main); font-size: 0.95rem; margin-bottom: 1rem; font-weight: 500;">COMPANIES BY CATEGORY</h4>
                                <canvas id="chart-all-cat"></canvas>
                            </div>
                        </div>

                        <div style="flex: 1; min-width: 300px; background: var(--bg-color); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <h3 style="color: var(--heart-active); margin-bottom: 1.5rem; text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">YOUR SAVED COMPANIES (${savedCountTotal})</h3>
                            
                            ${savedCountTotal > 0 ? `
                                <div style="margin-bottom: 2.5rem;">
                                    <h4 style="text-align: center; color: var(--text-main); font-size: 0.95rem; margin-bottom: 1rem; font-weight: 500;">SAVED BY COUNTRY</h4>
                                    <canvas id="chart-saved-loc"></canvas>
                                </div>
                                <div>
                                    <h4 style="text-align: center; color: var(--text-main); font-size: 0.95rem; margin-bottom: 1rem; font-weight: 500;">SAVED BY CATEGORY</h4>
                                    <canvas id="chart-saved-cat"></canvas>
                                </div>
                            ` : `
                                <div style="display: flex; height: 80%; align-items: center; justify-content: center; color: var(--text-muted); font-style: italic;">
                                    YOU HAVEN'T SAVED ANY COMPANIES YET.
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;

            const style = getComputedStyle(document.body);
            const colorAll = style.getPropertyValue('--accent-text').trim() || '#3730a3';
            const colorSaved = style.getPropertyValue('--heart-active').trim() || '#ef4444';
            const colorText = style.getPropertyValue('--text-main').trim() || '#0f172a';
            const colorGrid = style.getPropertyValue('--border-color').trim() || '#e2e8f0';

            const renderChart = (canvasId, dataArray, barColor) => {
                const ctx = document.getElementById(canvasId);
                if (!ctx) return;
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: dataArray.map(item => item[0]),
                        datasets: [{
                            data: dataArray.map(item => item[1]),
                            backgroundColor: barColor,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                ticks: { precision: 0, color: colorText },
                                grid: { color: colorGrid }
                            },
                            x: { 
                                ticks: { color: colorText },
                                grid: { display: false }
                            }
                        }
                    }
                });
            };

            setTimeout(() => {
                renderChart('chart-all-loc', allLocData, colorAll);
                renderChart('chart-all-cat', allCatData, colorAll);
                if (savedCountTotal > 0) {
                    renderChart('chart-saved-loc', savedLocData, colorSaved);
                    renderChart('chart-saved-cat', savedCatData, colorSaved);
                }
            }, 50);
        }
        return;
    }

    document.querySelector('.search-filter-section').classList.remove('hidden');

    if (resetPage) {
        jobContainer.innerHTML = '';
        currentPage = 1;
        updateSavedCount();

        if (currentTab === 'kaydedilenler') {
            const warningHTML = `
                <div class="local-storage-warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>NOTE: YOUR SAVED ITEMS ARE STORED LOCALLY ON THIS DEVICE. THEY WILL BE LOST IF YOU CLEAR YOUR BROWSER DATA OR ACCESS THE SITE FROM ANOTHER DEVICE.</span>
                </div>
            `;
            jobContainer.insertAdjacentHTML('beforeend', warningHTML);
        }

        const searchText = document.getElementById('search-input').value.toUpperCase();
        const loc = document.getElementById('location-select').value.toUpperCase();
        const field = fieldSelect.value.toUpperCase();
        const subField = subcategorySelect.value.toUpperCase();

        currentFilteredJobs = jobsData.filter(job => {
            if (currentTab === 'kaydedilenler') {
                if (!savedJobs.includes(job.id)) return false;
            } else {
                if (job.tab !== currentTab && currentTab !== 'about' && currentTab !== 'analytics' && currentTab !== 'recommendations') return false;
            }

            const matchSearch = job.company.includes(searchText) || 
                                job.location.includes(searchText) ||
                                job.category.includes(searchText) ||
                                job.subcategory.some(sub => sub.includes(searchText)) ||
                                job.subcategory2.some(sub => sub.includes(searchText));
            
            const matchLoc = loc === 'ALL' || job.location.includes(loc);
            
            let matchField = false;
            if (field === 'ALL') {
                matchField = true;
            } else if (field === 'ENGINEERING') {
                const isEng = job.category.includes('ENGINEERING') || job.category.includes('ENGINEER');
                if (subField === 'ALL') {
                    matchField = isEng;
                } else {
                    matchField = isEng && (
                        job.subcategory.some(sub => sub.includes(subField)) ||
                        job.subcategory2.some(sub => sub.includes(subField))
                    );
                }
            } else {
                matchField = job.category === field;
            }

            return matchSearch && matchLoc && matchField;
        });
    }

    if (currentFilteredJobs.length === 0 && resetPage) {
        const emptyMsg = currentTab === 'kaydedilenler' ? "YOU HAVEN'T SAVED ANY ITEMS YET." : "NO RECORDS FOUND MATCHING THESE CRITERIA.";
        jobContainer.innerHTML += `
            <div class="empty-state">
                ${searchSVG}
                <p>${emptyMsg}</p>
            </div>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const jobsToRender = currentFilteredJobs.slice(startIndex, endIndex);

    jobsToRender.forEach(job => {
        const isSaved = savedJobs.includes(job.id);

        const subcategoriesHTML = job.subcategory.map(sub => `<span class="job-subcategory-tag">${sub}</span>`).join('');
        const subcategories2HTML = job.subcategory2.map(sub => `<span class="job-subcategory-tag">${sub}</span>`).join('');

        const card = document.createElement('div');
        card.className = 'job-card';
        card.setAttribute('data-id', job.id);
        
        card.innerHTML = `
            <button class="save-btn ${isSaved ? 'saved' : ''}" aria-label="Save">
                ${heartSVG}
            </button>
            <div class="job-header">
                <div class="job-tags-top">
                    <div class="tags-group-primary">
                        ${job.category ? `<span class="job-category">${job.category}</span>` : ''}
                        ${subcategoriesHTML}
                    </div>
                    ${subcategories2HTML ? `<div class="tags-group-secondary">${subcategories2HTML}</div>` : ''}
                </div>
            </div>
            <h3 class="job-title">
                ${companySVG}
                ${job.company || 'UNKNOWN COMPANY'}
            </h3>
            <div class="job-footer" style="position: relative;">
                <span class="job-location">${job.location || 'LOCATION NOT SPECIFIED'}</span>
            </div>
            <span style="position: absolute; bottom: 0.8rem; right: 1rem; font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; font-weight: 500;">#${job.id}</span>
        `;
        jobContainer.appendChild(card);
    });

    const oldLoadMoreBtn = document.getElementById('load-more-btn');
    if (oldLoadMoreBtn) {
        oldLoadMoreBtn.remove();
    }

    if (endIndex < currentFilteredJobs.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'load-more-btn';
        loadMoreBtn.textContent = 'LOAD MORE';
        loadMoreBtn.className = 'advanced-btn'; 
        loadMoreBtn.style.gridColumn = '1 / -1'; 
        loadMoreBtn.style.margin = '2rem auto';
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => {
            currentPage++;
            renderJobs(false); 
        };
        jobContainer.appendChild(loadMoreBtn);
    }
}

jobContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card');
    if (!card) return;

    const jobId = parseInt(card.getAttribute('data-id'));
    const saveBtn = e.target.closest('.save-btn');

    if (saveBtn) {
        e.stopPropagation(); 
        if (savedJobs.includes(jobId)) {
            savedJobs = savedJobs.filter(id => id !== jobId);
            saveBtn.classList.remove('saved');
        } else {
            savedJobs.push(jobId);
            saveBtn.classList.add('saved');
        }
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        updateSavedCount();
        
        if (currentTab === 'kaydedilenler' || currentTab === 'analytics') {
            renderJobs(true);
        }
    } else {
        openModal(jobId);
    }
});

function openModal(jobId) {
    const job = jobsData.find(j => j.id === jobId);
    if (!job) return;

    const allSubs = [...job.subcategory, ...job.subcategory2];
    const subCategoriesText = allSubs.length > 0 ? allSubs.join(', ') : (job.category || 'GENERAL');

    let contactHTML = '';
    if (job.contact && job.contact.trim() !== '') {
        contactHTML = `
            <div class="modal-section" style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;">
                <h4 style="color: var(--accent-text); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    CONTACT INFO
                </h4>
                <p style="font-family: monospace; font-size: 0.95rem;">${job.contact}</p>
            </div>
        `;
    }

    let contentHTML = `
        <h2 class="modal-title">
            ${companySVG}
            ${job.company}
        </h2>
        <div class="modal-company">${subCategoriesText} — ${job.location}</div>
        
        <div class="modal-section">
            <h4>DESCRIPTION</h4>
            <p>${job.description || 'NO DESCRIPTION PROVIDED.'}</p>
        </div>
        <div class="modal-section">
            <h4>REQUIREMENTS & DETAILS</h4>
            <p>${job.requirements || 'NOT SPECIFIED.'}</p>
        </div>
        
        ${contactHTML}
    `;

    if (job.tab === 'cold') {
        const templates = {
            standard: `Subject: Inquiry Regarding Erasmus+ Internship Opportunities - [Your Name]\n\nDear Hiring Team at ${job.company},\n\nI hope this email finds you well. \nI am currently studying [Your Major] at [Your University] in [Your Country], and I have been following the impressive work your team is doing. \n\nI am reaching out to inquire about the possibility of joining ${job.company} for an Erasmus+ internship. I am eligible for an Erasmus+ grant, which will fully support my stay.\n\nPlease find my CV attached. I would be thrilled to discuss how my background could contribute to your projects.\n\nBest regards,\n[Your Name]`,
            casual: `Subject: Reaching out for an Erasmus+ Internship - [Your Name]\n\nHi ${job.company} Team,\n\nI've been following your recent projects and I really love the direction you're heading! I'm a [Your Major] student at [Your University] and I'm looking for a team where I can contribute and learn as part of an Erasmus+ internship.\n\nI have full grant coverage from the Erasmus program, meaning my stay is completely funded. I'd love to chat about how I could help out your team during my internship.\n\nI've attached my CV for your review. Let me know if you'd be open to a quick call!\n\nBest,\n[Your Name]`,
            technical: `Subject: Technical Erasmus+ Internship Inquiry - [Your Name]\n\nDear Hiring Manager,\n\nI am a [Your Major] student with a strong background in [Skill 1] and [Skill 2]. I have been closely following ${job.company}'s work, particularly regarding [Specific Project/Technology], and I am very interested in contributing to your engineering team.\n\nI am planning an Erasmus+ internship and have secured full funding. My previous experience includes [Briefly mention a project or technical achievement], which aligns closely with your current technical focus.\n\nPlease find my CV and portfolio attached. I would appreciate the opportunity to discuss how my technical skills can bring value to ${job.company}.\n\nSincerely,\n[Your Name]`,
            enthusiastic: `Subject: Highly Driven [Your Major] Student Eager to Join ${job.company} - Erasmus+\n\nDear ${job.company} Team,\n\nI am an absolute fan of the innovative work you do! As a [Your Major] student at [Your University], joining your team has been a significant goal of mine. I am reaching out to see if you would be open to hosting a passionate and dedicated intern under the Erasmus+ program.\n\nSince I am fully supported by the Erasmus+ grant, there would be no financial burden on the company. I am highly motivated, a fast learner, and absolutely ready to give my 100% to your upcoming projects. \n\nI have attached my CV and would be incredibly grateful for the chance to speak with you. Thank you for your time and inspiring work!\n\nWarm regards,\n[Your Name]`
        };

        contentHTML += `
            <div class="modal-section">
                <h4>COLD MAIL TEMPLATES</h4>
                <select id="template-selector" class="filter-input custom-select" style="margin-bottom: 1rem; width: 100%;">
                    <option value="standard">Standard / Professional</option>
                    <option value="casual">Casual Corporate</option>
                    <option value="technical">Technical Focus</option>
                    <option value="enthusiastic">Highly Enthusiastic</option>
                </select>
                <div class="mail-template-box" id="mail-text">${templates.standard}</div>
                <button class="copy-btn" id="copy-btn" style="margin-bottom: 1rem;">COPY TEMPLATE</button>
            </div>
        `;
    }

    if (job.link && job.link.trim() !== "") {
        contentHTML += `
            <div class="modal-section" style="margin-top: 1.5rem;">
                <a href="${job.link}" target="_blank" rel="noopener noreferrer" class="copy-btn" style="display: block; text-align: center; text-decoration: none; background-color: var(--text-main);">
                    GO TO TARGET LINK
                </a>
            </div>
        `;
    }

    modalBody.innerHTML = contentHTML;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 

    const templateSelector = document.getElementById('template-selector');
    const mailTextElement = document.getElementById('mail-text');
    
    if (templateSelector && mailTextElement && job.tab === 'cold') {
        const templates = {
            standard: `Subject: Inquiry Regarding Erasmus+ Internship Opportunities - [Your Name]\n\nDear Hiring Team at ${job.company},\n\nI hope this email finds you well. \nI am currently studying [Your Major] at [Your University] in [Your Country], and I have been following the impressive work your team is doing. \n\nI am reaching out to inquire about the possibility of joining ${job.company} for an Erasmus+ internship. I am eligible for an Erasmus+ grant, which will fully support my stay.\n\nPlease find my CV attached. I would be thrilled to discuss how my background could contribute to your projects.\n\nBest regards,\n[Your Name]`,
            casual: `Subject: Reaching out for an Erasmus+ Internship - [Your Name]\n\nHi ${job.company} Team,\n\nI've been following your recent projects and I really love the direction you're heading! I'm a [Your Major] student at [Your University] and I'm looking for a team where I can contribute and learn as part of an Erasmus+ internship.\n\nI have full grant coverage from the Erasmus program, meaning my stay is completely funded. I'd love to chat about how I could help out your team during my internship.\n\nI've attached my CV for your review. Let me know if you'd be open to a quick call!\n\nBest,\n[Your Name]`,
            technical: `Subject: Technical Erasmus+ Internship Inquiry - [Your Name]\n\nDear Hiring Manager,\n\nI am a [Your Major] student with a strong background in [Skill 1] and [Skill 2]. I have been closely following ${job.company}'s work, particularly regarding [Specific Project/Technology], and I am very interested in contributing to your engineering team.\n\nI am planning an Erasmus+ internship and have secured full funding. My previous experience includes [Briefly mention a project or technical achievement], which aligns closely with your current technical focus.\n\nPlease find my CV and portfolio attached. I would appreciate the opportunity to discuss how my technical skills can bring value to ${job.company}.\n\nSincerely,\n[Your Name]`,
            enthusiastic: `Subject: Highly Driven [Your Major] Student Eager to Join ${job.company} - Erasmus+\n\nDear ${job.company} Team,\n\nI am an absolute fan of the innovative work you do! As a [Your Major] student at [Your University], joining your team has been a significant goal of mine. I am reaching out to see if you would be open to hosting a passionate and dedicated intern under the Erasmus+ program.\n\nSince I am fully supported by the Erasmus+ grant, there would be no financial burden on the company. I am highly motivated, a fast learner, and absolutely ready to give my 100% to your upcoming projects. \n\nI have attached my CV and would be incredibly grateful for the chance to speak with you. Thank you for your time and inspiring work!\n\nWarm regards,\n[Your Name]`
        };
        templateSelector.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            mailTextElement.innerText = templates[selectedType];
        });
    }

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('mail-text').innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.textContent = 'COPIED! ✓';
                copyBtn.classList.add('success');
                setTimeout(() => {
                    copyBtn.textContent = 'COPY TEMPLATE';
                    copyBtn.classList.remove('success');
                }, 2000);
            });
        });
    }
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTab = button.getAttribute('data-tab');
        renderJobs(true);
    });
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    moonIcon.classList.toggle('hidden');
    sunIcon.classList.toggle('hidden');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }

    if (currentTab === 'analytics') {
        renderJobs(true);
    }
});

const filterInputs = document.querySelectorAll('.filter-input');
filterInputs.forEach(el => el.addEventListener('input', () => renderJobs(true)));

fetchJobs();