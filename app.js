const app = {
    currentUserRole: null,
    currentUserName: null,
    currentChart: null,
    
    // --- 1. Initialization ---
    init() {
        this.initializeData();
        window.addEventListener('hashchange', () => this.router());
        
        // Check for active session
        const savedRole = localStorage.getItem('currentUserRole');
        const savedName = localStorage.getItem('currentUserName');
        
        if (savedRole) {
            // If logged in, skip landing and auth, go straight to portal
            this.loginSuccess(savedRole, savedName, false);
        } else {
            // If not logged in, show the Landing Page by default
            this.showScreen('landing-screen');
        }
    },

    initializeData() {
        if (!localStorage.getItem('platformData')) {
            localStorage.setItem('platformData', JSON.stringify({
                professors: [
                    { id: 1, name: 'Dr. Alan Turing', email: 'alan@training.com', specialty: 'Computer Science', status: 'Paid' }
                ],
                students: [
                    { id: 1, name: 'Sarah Connor', email: 'sarah@student.com', level: 'Advanced', course: 'Cybersecurity' }
                ],
                courses: [],
                payments: []
            }));
        }
    },

    getData() {
        return JSON.parse(localStorage.getItem('platformData'));
    },

    saveData(data) {
        localStorage.setItem('platformData', JSON.stringify(data));
    },

    // --- 2. Screen Navigation (Pre-Login) ---
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    goToAuth() {
        this.showScreen('auth-screen');
    },

    goToLanding() {
        this.showScreen('landing-screen');
    },

    // --- 3. Authentication UI Flow ---
    toggleAuth(tab) {
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');
        const subtitle = document.getElementById('auth-subtitle');

        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('tab-register').classList.remove('active');

        if (tab === 'login') {
            document.getElementById('tab-login').classList.add('active');
            loginForm.classList.remove('hidden');
            regForm.classList.add('hidden');
            subtitle.innerText = "Welcome back, please log in.";
        } else {
            document.getElementById('tab-register').classList.add('active');
            regForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            subtitle.innerText = "Create a new account.";
        }
    },

    handleAuth(event, type) {
        event.preventDefault();

        let role, email, password, name;

        if (type === 'login') {
            role = document.querySelector('input[name="login-role"]:checked').value;
            email = document.getElementById('login-email').value;
            password = document.getElementById('login-password').value;
            name = email.split('@')[0]; 
        } else {
            role = document.querySelector('input[name="reg-role"]:checked').value;
            name = document.getElementById('reg-name').value;
            email = document.getElementById('reg-email').value;
            password = document.getElementById('reg-password').value;
            alert('Account created successfully! Logging you in...');
        }

        if (email && password) {
            this.loginSuccess(role, name);
        }
    },

    loginSuccess(role, name, redirect = true) {
        this.currentUserRole = role;
        this.currentUserName = name || role;
        
        localStorage.setItem('currentUserRole', this.currentUserRole);
        localStorage.setItem('currentUserName', this.currentUserName);
        
        this.showScreen('portal-layout');
        document.getElementById('user-name-display').innerText = this.currentUserName;
        
        this.renderSidebar();
        
        if (redirect) {
            window.location.hash = `#/${role}/dashboard`;
        } else {
            this.router();
        }
    },

    logout() {
        this.currentUserRole = null;
        this.currentUserName = null;
        localStorage.removeItem('currentUserRole');
        localStorage.removeItem('currentUserName');
        
        window.location.hash = '';
        
        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        this.toggleAuth('login');

        // Go back to the landing page on logout
        this.showScreen('landing-screen');
    },

    toggleMobileMenu() {
        document.getElementById('sidebar').classList.toggle('open');
    },

    closeMobileMenuIfOpen() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
    },

    // --- 4. Navigation & Routing ---
    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let links = [];

        if (this.currentUserRole === 'admin') {
            links = [
                { path: '#/admin/dashboard', name: 'Dashboard' },
                { path: '#/admin/professors', name: 'Professors' },
                { path: '#/admin/students', name: 'Students' },
                { path: '#/admin/payments', name: 'Payments' },
                { path: '#/admin/courses', name: 'Courses' }
            ];
        } else if (this.currentUserRole === 'professor') {
            links = [
                { path: '#/professor/dashboard', name: 'Dashboard' },
                { path: '#/professor/students', name: 'My Students' },
                { path: '#/professor/courses', name: 'My Courses' }
            ];
        } else if (this.currentUserRole === 'student') {
            links = [
                { path: '#/student/dashboard', name: 'Dashboard' },
                { path: '#/student/exams', name: 'My Exams' },
                { path: '#/student/courses', name: 'My Courses' }
            ];
        }

        nav.innerHTML = links.map(link => 
            `<a href="${link.path}" onclick="app.closeMobileMenuIfOpen()">${link.name}</a>`
        ).join('');
    },

    router() {
        // If not logged in, ignore routing and keep on current public screen
        if (!this.currentUserRole) return; 

        const hash = window.location.hash || `#/${this.currentUserRole}/dashboard`;
        const viewContainer = document.getElementById('app-view');
        const pageTitle = document.getElementById('page-title');

        const parts = hash.replace('#/', '').split('/');
        const view = parts[1] || 'dashboard';

        document.querySelectorAll('#sidebar-nav a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === hash);
        });

        pageTitle.innerText = view.charAt(0).toUpperCase() + view.slice(1);
        
        // Route Controller
        if (view === 'dashboard') {
            this.renderDashboard(viewContainer);
        } else if (view === 'professors' && this.currentUserRole === 'admin') {
            this.renderAdminProfessors(viewContainer);
        } else if (view === 'students' && this.currentUserRole === 'admin') {
            this.renderAdminStudents(viewContainer);
        } else {
            viewContainer.innerHTML = `
                <div class="card">
                    <h3 class="gold-text">${pageTitle.innerText} Module</h3>
                    <p style="color: var(--text-gray); margin-top: 10px;">This section is under construction.</p>
                </div>
            `;
        }
    },

    // --- 5. Page Renderers ---
    renderDashboard(container) {
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <h3>Registered Professors</h3>
                    <p class="stat-number" id="stat-prof">0</p>
                </div>
                <div class="card stat-card">
                    <h3>Enrolled Students</h3>
                    <p class="stat-number" id="stat-stud">0</p>
                </div>
                <div class="card stat-card">
                    <h3>System Status</h3>
                    <p class="stat-number gold">Online</p>
                </div>
            </div>
            <div class="card chart-container">
                <h3 class="gold-text" style="margin-bottom: 15px;">Activity Overview</h3>
                <canvas id="dashboardChart"></canvas>
            </div>
        `;
        
        const data = this.getData();
        document.getElementById('stat-prof').innerText = data.professors.length;
        document.getElementById('stat-stud').innerText = data.students.length;
        
        setTimeout(() => this.initChart(this.currentUserRole), 50);
    },

    renderAdminProfessors(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="gold-text">Add New Professor</h3>
                <form id="add-prof-form" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <input type="text" id="prof-name" placeholder="Full Name" required style="flex: 1; min-width: 200px;">
                    <input type="email" id="prof-email" placeholder="Email" required style="flex: 1; min-width: 200px;">
                    <input type="text" id="prof-spec" placeholder="Specialty" required style="flex: 1; min-width: 200px;">
                    <button type="submit" class="gold-btn" style="width: auto; padding: 0.8rem 1.5rem;">Add Professor</button>
                </form>
            </div>
            <div class="card">
                <h3 class="gold-text">Professor Directory</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border); color: var(--gold-primary);">
                                <th style="padding: 10px;">Name</th>
                                <th style="padding: 10px;">Email</th>
                                <th style="padding: 10px;">Specialty</th>
                                <th style="padding: 10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="prof-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('add-prof-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = this.getData();
            const newProf = {
                id: Date.now(),
                name: document.getElementById('prof-name').value,
                email: document.getElementById('prof-email').value,
                specialty: document.getElementById('prof-spec').value,
                status: 'Unpaid'
            };
            data.professors.push(newProf);
            this.saveData(data);
            e.target.reset();
            this.updateProfTable();
        });

        this.updateProfTable();
    },

    updateProfTable() {
        const tbody = document.getElementById('prof-table-body');
        const data = this.getData();
        tbody.innerHTML = data.professors.map(prof => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px;">${prof.name}</td>
                <td style="padding: 10px; color: var(--text-gray);">${prof.email}</td>
                <td style="padding: 10px;">${prof.specialty}</td>
                <td style="padding: 10px;">
                    <button onclick="app.deleteUser('professors', ${prof.id})" style="background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    renderAdminStudents(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="gold-text">Enroll New Student</h3>
                <form id="add-stud-form" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <input type="text" id="stud-name" placeholder="Full Name" required style="flex: 1; min-width: 200px;">
                    <input type="email" id="stud-email" placeholder="Email" required style="flex: 1; min-width: 200px;">
                    <select id="stud-level" style="flex: 1; min-width: 200px; padding: 1rem; background: rgba(0, 0, 0, 0.3); border: 1px solid #333; color: white; border-radius: 8px;">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                    <button type="submit" class="gold-btn" style="width: auto; padding: 0.8rem 1.5rem;">Enroll</button>
                </form>
            </div>
            <div class="card">
                <h3 class="gold-text">Student Directory</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table style="width: 100%; text-align: left; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border); color: var(--gold-primary);">
                                <th style="padding: 10px;">Name</th>
                                <th style="padding: 10px;">Email</th>
                                <th style="padding: 10px;">Level</th>
                                <th style="padding: 10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="stud-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('add-stud-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = this.getData();
            const newStud = {
                id: Date.now(),
                name: document.getElementById('stud-name').value,
                email: document.getElementById('stud-email').value,
                level: document.getElementById('stud-level').value
            };
            data.students.push(newStud);
            this.saveData(data);
            e.target.reset();
            this.updateStudTable();
        });

        this.updateStudTable();
    },

    updateStudTable() {
        const tbody = document.getElementById('stud-table-body');
        const data = this.getData();
        tbody.innerHTML = data.students.map(stud => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px;">${stud.name}</td>
                <td style="padding: 10px; color: var(--text-gray);">${stud.email}</td>
                <td style="padding: 10px;">${stud.level}</td>
                <td style="padding: 10px;">
                    <button onclick="app.deleteUser('students', ${stud.id})" style="background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    deleteUser(type, id) {
        if(confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
            const data = this.getData();
            data[type] = data[type].filter(item => item.id !== id);
            this.saveData(data);
            
            if(type === 'professors') this.updateProfTable();
            if(type === 'students') this.updateStudTable();
        }
    },

    // --- 6. Charts ---
    initChart(role) {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;
        if (this.currentChart) this.currentChart.destroy();

        Chart.defaults.color = '#a0a0a0';
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

        let config = {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Platform Activity',
                    data: [12, 19, 15, 22, 18, 28],
                    backgroundColor: '#D4AF37',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        };

        this.currentChart = new Chart(ctx, config);
    }
};

app.init();