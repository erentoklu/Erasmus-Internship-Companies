const SHEET_URL = "https://script.google.com/macros/s/AKfycbxjDVIB52kQD7liMwXesoyYDlgDpzIKSoVx1ZPb1LYJCjdSIjS2UObPb7i0t88yCQaK/exec";

let jobsData = []; 
let currentTab = 'cold'; 
let currentPage = 1;
const itemsPerPage = 50;
let currentFilteredJobs = [];
let currentOpenJobId = null;

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

function toTitleCase(str) {
    if (!str) return "";
    return str.split(' ').map(word => {
        if(!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function toSentenceCase(str) {
    if (!str) return "";
    if (str === str.toUpperCase()) {
        str = str.toLowerCase();
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanCompanyName(name) {
    if (!name) return "";
    let cleaned = String(name).toUpperCase();
    
    const suffixes = [
        'GMBH & CO\\. KG', 'GMBH & CO\\.KG', 'GMBH', 'LTD\\. ŞTİ\\.', 'LTD ŞTI', 'LTD ŞTİ', 'LTD\\.', 'LTD', 'ŞTİ\\.', 'ŞTİ', 'STI',
        'A\\.Ş\\.', 'A\\.S\\.', 'AŞ', 'AS', 'SP\\. Z O\\.O\\.', 'SP\\. Z O\\. O\\.', 'SP Z O O', 'SP Z\\.O\\.O\\.',
        'LLC', 'INC\\.', 'INC', 'CORP\\.', 'CORP', 'S\\.A\\.', 'SA', 'S\\.R\\.L\\.', 'SRL', 
        'S\\.L\\.', 'SL', 'B\\.V\\.', 'BV', 'N\\.V\\.', 'NV', 'S\\.P\\.A\\.', 'SPA', 
        'LIMITED', 'COMPANY', 'INCORPORATED', 'CORPORATION',
        'UG', 'AG', 'AB', 'OY', 'S\\.A\\.R\\.L\\.', 'SARL', 'S\\.A\\.S\\.', 'SAS', 'KG'
    ];
    
    const regex = new RegExp(`\\b(?:${suffixes.join('|')})\\b\\.?`, 'g');
    cleaned = cleaned.replace(regex, '');
    cleaned = cleaned.replace(/[,.\-\s]+$/, ''); 
    cleaned = cleaned.replace(/\s+/g, ' ').trim(); 
    
    return cleaned;
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || savedTheme === null) {
    document.body.classList.add('dark-mode');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
    if (savedTheme === null) {
        localStorage.setItem('theme', 'dark');
    }
}

const heartSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const searchSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
const loadingSVG = `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;
const companySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`;
const flagSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
const leftArrowSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
const rightArrowSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

function setupLocationDropdown() {
    const locationAnchor = document.getElementById('location-anchor');
    const checkList = document.querySelector('.dropdown-check-list');
    const locCheckboxes = document.querySelectorAll('#location-items input[type="checkbox"]');

    locationAnchor.addEventListener('click', (e) => {
        checkList.classList.toggle('visible');
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (!checkList.contains(e.target)) {
            checkList.classList.remove('visible');
        }
    });

    locCheckboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.value === 'All' && e.target.checked) {
                locCheckboxes.forEach(box => {
                    if (box.value !== 'All') box.checked = false;
                });
            } else if (e.target.value !== 'All' && e.target.checked) {
                locCheckboxes[0].checked = false;
            }

            const anyChecked = Array.from(locCheckboxes).some(box => box.checked);
            if (!anyChecked) {
                locCheckboxes[0].checked = true;
            }

            const checkedBoxes = Array.from(locCheckboxes).filter(box => box.checked);
            if (checkedBoxes[0].value === 'All') {
                locationAnchor.textContent = 'All Locations';
            } else {
                const names = checkedBoxes.map(b => b.value);
                locationAnchor.textContent = names.join(', ');
            }

            renderJobs(true);
        });
    });
}
setupLocationDropdown();

function updateSavedCount() {
    if (savedCount) savedCount.textContent = `(${savedJobs.length})`;
}

function updateCompaniesCount() {
    if (companiesCount) companiesCount.textContent = `(${jobsData.length})`;
}

function updateLocationCounts() {
    const labels = document.querySelectorAll('#location-items label');
    labels.forEach(label => {
        const cb = label.querySelector('input');
        const span = label.querySelector('.loc-text');
        if (!span) return;
        
        const loc = cb.value.toUpperCase();
        if (loc === 'ALL') return;
        
        const count = jobsData.filter(job => job.location && job.location.toUpperCase().includes(loc)).length;
        span.textContent = `${cb.value} (${count})`;
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
            company: job.company ? cleanCompanyName(job.company) : '',
            location: job.location ? toTitleCase(String(job.location)) : '',
            category: job.category ? String(job.category).toUpperCase() : '',
            subcategory: job.subcategory ? String(job.subcategory).toUpperCase().split(',').map(s => s.trim()).filter(s => s) : [],
            subcategory2: job.subcategory2 ? String(job.subcategory2).toUpperCase().split(',').map(s => s.trim()).filter(s => s) : [],
            tab: job.tab ? String(job.tab).toLowerCase() : '',
            description: job.description ? toSentenceCase(String(job.description)) : '',
            requirements: job.requirements ? toSentenceCase(String(job.requirements)) : '',
            contact: (job.contacts || job.contact) ? String(job.contacts || job.contact) : '', 
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
                     I initially built this website to help my friends and myself find Erasmus internships. Everyone I talked to had to contact 100+ companies, and only a few of them received replies. In the end, they found their internships by emailing so many companies.

However, finding a company that meets your criteria takes a lot of time. So here, I share my database as an interactive Excel table. By filtering based on your criteria and using this website as a search engine, you can save a lot of time and find opportunities more easily. You can also use it to find job opportunities, not just Erasmus internships.

If you find it useful, please share this website so it can reach more people. Also, feel free to leave feedback to help it grow.

Best of luck with your search!

                    </p>

                    <h3 style="color: var(--accent-text); font-size: 1.1rem; margin-bottom: 0.5rem; text-transform: uppercase;">YOUR DATA IS YOURS</h3>
                    <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.8;">
                        No account creation is required. Every company you save is stored strictly on your own device's browser (localStorage). We do not track, store, or sell your personal data.
                    </p>
                </div>
            `;
        } else if (currentTab === 'recommendations') {
            jobContainer.innerHTML = `
                <div style="grid-column: 1 / -1; max-width: 600px; margin: 2rem auto; width: 100%;">
                    <div style="background-color: var(--surface-color); padding: 2.5rem; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h2 style="color: var(--text-main); margin-bottom: 1rem; font-size: 1.8rem; text-align: center;">WE VALUE YOUR FEEDBACK</h2>
                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem; text-align: center;">Do you want to suggest a new company, report a broken link, or share ideas to improve this platform? Send a message directly to the developer.</p>
                        <form id="recommendation-form" onsubmit="submitFeedback(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                            <input type="hidden" name="form-name" value="feedback-form" />
                            <select id="topic-select" name="topic" class="filter-input custom-select" required style="width: 100%;">
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

            const topicSelect = document.getElementById('topic-select');
            if (topicSelect) {
                topicSelect.addEventListener('invalid', function() {
                    this.setCustomValidity('Please select an item in the list.');
                });
                topicSelect.addEventListener('input', function() {
                    this.setCustomValidity('');
                });
            }
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
                        <div style="flex: 1; min-width: 300px; background: var(--box-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
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

                        <div style="flex: 1; min-width: 300px; background: var(--box-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <h3 style="color: #8e72be; margin-bottom: 1.5rem; text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">YOUR SAVED COMPANIES (${savedCountTotal})</h3>
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
            const colorText = style.getPropertyValue('--text-main').trim() || '#0f172a';
            const colorGrid = style.getPropertyValue('--border-color').trim() || '#e2e8f0';
            
            const colorSavedBg = 'rgba(177, 156, 217, 0.9)';
            const colorSavedBorder = 'rgba(142, 114, 190, 1)';

            const renderChart = (canvasId, dataArray, barColorBg, barColorBorder = null) => {
                const ctx = document.getElementById(canvasId);
                if (!ctx) return;
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: dataArray.map(item => item[0]),
                        datasets: [{
                            data: dataArray.map(item => item[1]),
                            backgroundColor: barColorBg,
                            borderColor: barColorBorder || barColorBg,
                            borderWidth: barColorBorder ? 1 : 0,
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
                    renderChart('chart-saved-loc', savedLocData, colorSavedBg, colorSavedBorder);
                    renderChart('chart-saved-cat', savedCatData, colorSavedBg, colorSavedBorder);
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
        
        const checkedLocationBoxes = document.querySelectorAll('#location-items input[type="checkbox"]:checked');
        const selectedLocations = Array.from(checkedLocationBoxes).map(cb => cb.value.toUpperCase());

        const field = fieldSelect.value.toUpperCase();
        const subField = subcategorySelect.value.toUpperCase();

        currentFilteredJobs = jobsData.filter(job => {
            if (currentTab === 'kaydedilenler') {
                if (!savedJobs.includes(job.id)) return false;
            } else if (currentTab === 'newly_added') {
                if (job.tab === 'about' || job.tab === 'analytics' || job.tab === 'recommendations') return false;
            } else {
                if (job.tab !== currentTab && currentTab !== 'about' && currentTab !== 'analytics' && currentTab !== 'recommendations') return false;
            }

            const matchSearch = job.company.includes(searchText) || 
                                job.location.toUpperCase().includes(searchText) ||
                                job.category.includes(searchText) ||
                                job.subcategory.some(sub => sub.includes(searchText)) ||
                                job.subcategory2.some(sub => sub.includes(searchText));
            
            const matchLoc = selectedLocations.length === 0 || 
                             selectedLocations.includes('ALL') || 
                             selectedLocations.some(loc => job.location.toUpperCase().includes(loc));
            
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

        if (currentTab === 'newly_added') {
            currentFilteredJobs.sort((a, b) => b.id - a.id);
            currentFilteredJobs = currentFilteredJobs.slice(0, 100);
        }
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
        card.setAttribute('tabindex', '0'); 
        
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
            <div class="job-footer" style="margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1rem;">
                <span class="job-location" style="font-size: 0.85rem; color: var(--text-main); font-weight: 500;">${job.location || 'LOCATION NOT SPECIFIED'}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; font-weight: 500;">#${job.id}</span>
            </div>
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

window.submitFeedback = function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.textContent = "SENDING...";
    submitBtn.disabled = true;

    fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        form.innerHTML = `
            <div style='color: #10b981; font-weight: 600; text-align: center; padding: 2rem; border: 1px dashed #10b981; border-radius: 6px;'>
                ✓ THANK YOU!
                <br>
                <span style='color: var(--text-muted); font-size: 0.9rem; font-weight: 400;'>Your message has been sent successfully.</span>
            </div>
        `;
    })
    .catch(error => {
        console.error("Error:", error);
        submitBtn.textContent = "ERROR. TRY AGAIN";
        submitBtn.disabled = false;
    });
};

function openModal(jobId) {
    currentOpenJobId = jobId; 
    const job = jobsData.find(j => j.id === jobId);
    if (!job) return;

    const allSubs = [...job.subcategory, ...job.subcategory2];
    const subCategoriesText = allSubs.length > 0 ? allSubs.join(', ') : (job.category || 'GENERAL');

    let contactHTML = '';
    if (job.contact && job.contact.trim() !== '') {
        contactHTML = `
            <div class="modal-section" style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--box-bg); border: 1px solid var(--border-color); border-radius: 6px;">
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
            <p>${job.description || 'No description provided.'}</p>
        </div>
        <div class="modal-section">
            <h4>REQUIREMENTS & DETAILS</h4>
            <p>${job.requirements || 'Not specified.'}</p>
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
            <div class="modal-section" style="margin-top: 1.5rem; text-align: center;">
                <a href="${job.link}" target="_blank" rel="noopener noreferrer" class="copy-btn" style="display: block; text-decoration: none; background-color: var(--text-main);">
                    GO TO WEBSITE
                </a>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; word-break: break-all;">
                    🔗 ${job.link}
                </div>
            </div>
        `;
    }

    contentHTML += `
        <div class="modal-nav-hint">
            <button class="modal-nav-btn" onclick="navigateModal(-1)" aria-label="Previous">
                ${leftArrowSVG} <span class="nav-text"><kbd>A</kbd> / <kbd>←</kbd> PREV</span>
            </button>
            <button id="modal-report-btn" class="report-btn" data-company="${job.company}" data-id="${job.id}" aria-label="Report an issue">
                ${flagSVG} REPORT
            </button>
            <button class="modal-nav-btn" onclick="navigateModal(1)" aria-label="Next">
                <span class="nav-text">NEXT <kbd>→</kbd> / <kbd>D</kbd></span> ${rightArrowSVG}
            </button>
        </div>
    `;

    modalBody.innerHTML = contentHTML;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    document.querySelector('.modal-content').scrollTop = 0; 

    const modalReportBtn = document.getElementById('modal-report-btn');
    if (modalReportBtn) {
        modalReportBtn.addEventListener('click', (e) => {
            modalReportBtn.innerHTML = '✓ THANKS!';
            modalReportBtn.classList.add('success-state');
            modalReportBtn.disabled = true;
            modalReportBtn.style.cursor = 'default';

            const companyName = modalReportBtn.getAttribute('data-company');
            const clickedJobId = modalReportBtn.getAttribute('data-id');

            const formData = new URLSearchParams();
            formData.append("form-name", "feedback-form");
            formData.append("topic", "REPORT_ERROR");
            formData.append("company_name", companyName);
            formData.append("company_id", clickedJobId);
            formData.append("message", `Kullanıcı "${companyName}" (ID: #${clickedJobId}) adlı şirket için hata bildiriminde bulundu.`);

            fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            }).catch(err => console.error("Rapor gönderilemedi:", err));
        });
    }

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

function navigateModal(direction) {
    if (currentFilteredJobs.length === 0) return;
    const currentIndex = currentFilteredJobs.findIndex(job => job.id === currentOpenJobId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;
    
    if (newIndex >= currentFilteredJobs.length) {
        newIndex = 0;
    } else if (newIndex < 0) {
        newIndex = currentFilteredJobs.length - 1;
    }

    openModal(currentFilteredJobs[newIndex].id);
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentOpenJobId = null; 
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

const filterInputs = document.querySelectorAll('.filter-input:not(#location-select)');
filterInputs.forEach(el => el.addEventListener('input', () => renderJobs(true)));

jobContainer.addEventListener('keydown', (e) => {
    if (e.target.id === 'load-more-btn') {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            e.preventDefault();
            const cards = Array.from(jobContainer.querySelectorAll('.job-card'));
            if (cards.length > 0) {
                cards[cards.length - 1].focus(); 
            }
        }
        return; 
    }

    const card = e.target.closest('.job-card');
    if (!card) return;

    if (e.key === 'Enter') {
        e.preventDefault();
        card.click();
        return;
    }

    const cards = Array.from(jobContainer.querySelectorAll('.job-card'));
    const index = cards.indexOf(card);
    if (index === -1) return;

    const gridStyle = window.getComputedStyle(jobContainer);
    const columns = gridStyle.gridTemplateColumns.trim().split(/\s+/).length;
    let nextIndex = null;

    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        nextIndex = index + 1;
    } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        nextIndex = index - 1;
    } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        nextIndex = index + columns;
        
        if (nextIndex >= cards.length) {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                e.preventDefault();
                loadMoreBtn.focus();
                return;
            }
        }
    } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        nextIndex = index - columns;
    }

    if (nextIndex !== null && nextIndex >= 0 && nextIndex < cards.length) {
        e.preventDefault(); 
        cards[nextIndex].focus();
    }
});

document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hidden') && currentOpenJobId !== null) {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            navigateModal(1);
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            navigateModal(-1);
        }
    }
});

const logoLink = document.getElementById('logo-link');
if (logoLink) {
    logoLink.addEventListener('click', () => {
        const coldTab = document.querySelector('.tab-btn[data-tab="cold"]');
        if (coldTab && currentTab !== 'cold') {
            coldTab.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

fetchJobs();