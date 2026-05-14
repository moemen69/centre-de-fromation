const app = {
    currentUserRole: null,
    currentUserName: null,
    currentChart: null,
    
    // --- Initialize ---
    init() {
        this.initializeData();
        window.addEventListener('hashchange', () => this.router());
        
        // Check if user is already logged in via memory
        const savedRole = localStorage.getItem('currentUserRole');
        const savedName = localStorage.getItem('currentUserName');
        
        if (savedRole) {
            this.loginSuccess(savedRole, savedName, false);
        } else {
            this.showScreen('landing-screen');
        }
    },

    // --- Mock Data Management ---
    initializeData() {
        if (!localStorage.getItem('platformData')) {
            localStorage.setItem('platformData', JSON.stringify({
                professors: [
                    { id: 1, name: 'Dr. Alan Turing', email: 'alan@ict.tn', specialty: 'Computer Science' }
                ],
                students: [
                    { id: 1, name: 'Sarah Connor', email: 'sarah@student.ict.tn', level: 'Advanced' }
                ]
            }));
        }
    },

    getData() { return JSON.parse(localStorage.getItem('platformData')); },
    saveData(data) { localStorage.setItem('platformData', JSON.stringify(data)); },

    // --- Strict Screen Routing (Fixes Dashboard on Landing Page) ---
    showScreen(screenId) {
        // Force hide everything
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        // Show ONLY the requested screen
        document.getElementById(screenId).classList.add('active');
        window.scrollTo(0, 0); 
    },

    goToAuth() { this.showScreen('auth-screen'); },
    goToLanding() { this.showScreen('landing-screen'); },

    toggleLandingMenu() {
        const menu = document.getElementById('mobile-nav-menu');
        menu.classList.toggle('open');
    },

    // --- Authentication Flow ---
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
        let role, email, name;

        if (type === 'login') {
            role = document.querySelector('input[name="login-role"]:checked').value;
            email = document.getElementById('login-email').value;
            name = email.split('@')[0]; 
        } else {
            role = document.querySelector('input[name="reg-role"]:checked').value;
            name = document.getElementById('reg-name').value;
            email = document.getElementById('reg-email').value;
            alert('Account created successfully! Logging you in...');
        }

        if (email) {
            // Trigger login success which HIDES the auth screen and SHOWS the dashboard
            this.loginSuccess(role, name);
        }
    },

    loginSuccess(role, name, redirect = true) {
        this.currentUserRole = role;
        this.currentUserName = name || role;
        
        localStorage.setItem('currentUserRole', this.currentUserRole);
        localStorage.setItem('currentUserName', this.currentUserName);
        
        // Strictly switch from Login Screen to Portal Layout
        this.showScreen('portal-layout');
        document.getElementById('user-name-display').innerText = this.currentUserName;
        
        this.renderSidebar();
        
        if (redirect) window.location.hash = `#/${role}/dashboard`;
        else this.router();
    },

    logout() {
        this.currentUserRole = null;
        this.currentUserName = null;
        localStorage.removeItem('currentUserRole');
        localStorage.removeItem('currentUserName');
        window.location.hash = '';
        
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        this.toggleAuth('login');
        
        // Go back to public landing page
        this.showScreen('landing-screen');
    },

    // --- Portal Sidebar & Internal Routing ---
    toggleAppSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    },

    closeMobileMenuIfOpen() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
    },

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let links = [];

        // Dynamic links based on the role the user chose
        if (this.currentUserRole === 'admin') {
            links = [
                { path: '#/admin/dashboard', name: 'Dashboard' },
                { path: '#/admin/professors', name: 'Manage Professors' },
                { path: '#/admin/students', name: 'Manage Students' },
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
        
        // Render Correct View Based on Role
        if (view === 'dashboard') {
            this.renderDashboard(viewContainer);
        } else if (view === 'professors' && this.currentUserRole === 'admin') {
            this.renderAdminProfessors(viewContainer);
        } else if (view === 'students' && this.currentUserRole === 'admin') {
            this.renderAdminStudents(viewContainer);
        } else {
            // Generic view for other Professor/Student pages
            viewContainer.innerHTML = `
                <div class="card">
                    <h3 class="gold-text">${pageTitle.innerText} Space</h3>
                    <p style="color: var(--text-gray); margin-top: 10px;">Welcome to your personalized ${view} area. Data and modules will load here.</p>
                </div>
            `;
        }
    },

    // --- Internal App Views ---
    renderDashboard(container) {
        const data = this.getData();
        
        if(this.currentUserRole === 'admin') {
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card">
                        <h3>Registered Professors</h3>
                        <p class="stat-number">${data.professors.length}</p>
                    </div>
                    <div class="card stat-card">
                        <h3>Enrolled Students</h3>
                        <p class="stat-number">${data.students.length}</p>
                    </div>
                    <div class="card stat-card">
                        <h3>System Status</h3>
                        <p class="stat-number gold-text">Online</p>
                    </div>
                </div>
                <div class="card chart-container">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Admin Activity Overview</h3>
                    <canvas id="dashboardChart"></canvas>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card">
                        <h3>Upcoming Events</h3>
                        <p class="stat-number">2</p>
                    </div>
                    <div class="card stat-card">
                        <h3>Active Courses</h3>
                        <p class="stat-number">4</p>
                    </div>
                </div>
                <div class="card chart-container">
                    <h3 class="gold-text" style="margin-bottom: 15px;">Your Activity</h3>
                    <canvas id="dashboardChart"></canvas>
                </div>
            `;
        }
        
        setTimeout(() => this.initChart(), 50);
    },

    renderAdminProfessors(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="gold-text">Add New Professor</h3>
                <form id="add-prof-form" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <div class="input-group" style="flex:1; margin:0;"><input type="text" id="prof-name" placeholder="Full Name" required></div>
                    <div class="input-group" style="flex:1; margin:0;"><input type="email" id="prof-email" placeholder="Email" required></div>
                    <div class="input-group" style="flex:1; margin:0;"><input type="text" id="prof-spec" placeholder="Specialty" required></div>
                    <button type="submit" class="gold-btn" style="width: auto;">Add</button>
                </form>
            </div>
            <div class="card">
                <h3 class="gold-text">Professor Directory</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Specialty</th><th>Action</th></tr>
                        </thead>
                        <tbody id="prof-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('add-prof-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = this.getData();
            data.professors.push({
                id: Date.now(),
                name: document.getElementById('prof-name').value,
                email: document.getElementById('prof-email').value,
                specialty: document.getElementById('prof-spec').value,
            });
            this.saveData(data);
            e.target.reset();
            this.updateProfTable();
        });
        this.updateProfTable();
    },

    updateProfTable() {
        const tbody = document.getElementById('prof-table-body');
        tbody.innerHTML = this.getData().professors.map(prof => `
            <tr>
                <td>${prof.name}</td>
                <td style="color: var(--text-gray);">${prof.email}</td>
                <td>${prof.specialty}</td>
                <td><button onclick="app.deleteUser('professors', ${prof.id})" style="background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button></td>
            </tr>
        `).join('');
    },

    renderAdminStudents(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="gold-text">Enroll New Student</h3>
                <form id="add-stud-form" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <div class="input-group" style="flex:1; margin:0;"><input type="text" id="stud-name" placeholder="Full Name" required></div>
                    <div class="input-group" style="flex:1; margin:0;"><input type="email" id="stud-email" placeholder="Email" required></div>
                    <div class="input-group" style="flex:1; margin:0;">
                        <select id="stud-level" required>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <button type="submit" class="gold-btn" style="width: auto;">Enroll</button>
                </form>
            </div>
            <div class="card">
                <h3 class="gold-text">Student Directory</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Level</th><th>Action</th></tr>
                        </thead>
                        <tbody id="stud-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('add-stud-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = this.getData();
            data.students.push({
                id: Date.now(),
                name: document.getElementById('stud-name').value,
                email: document.getElementById('stud-email').value,
                level: document.getElementById('stud-level').value
            });
            this.saveData(data);
            e.target.reset();
            this.updateStudTable();
        });
        this.updateStudTable();
    },

    updateStudTable() {
        const tbody = document.getElementById('stud-table-body');
        tbody.innerHTML = this.getData().students.map(stud => `
            <tr>
                <td>${stud.name}</td>
                <td style="color: var(--text-gray);">${stud.email}</td>
                <td>${stud.level}</td>
                <td><button onclick="app.deleteUser('students', ${stud.id})" style="background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button></td>
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

    initChart() {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;
        if (this.currentChart) this.currentChart.destroy();

        Chart.defaults.color = '#a0a0a0';
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
        Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [{
                    label: 'Platform Engagement',
                    data: [45, 60, 55, 80, 95],
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

app.init();