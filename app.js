const app = {
    currentUserRole: null,
    
    // 1. Initialize Application State
    init() {
        this.initializeData();
        window.addEventListener('hashchange', () => this.router());
        
        // Check if user is already "logged in" via localStorage
        const savedRole = localStorage.getItem('currentUserRole');
        if (savedRole) {
            this.login(savedRole, false);
        }
    },

    // 2. Mock Data Setup (Run once)
    initializeData() {
        if (!localStorage.getItem('platformData')) {
            const initialData = {
                professors: [],
                students: [],
                courses: [],
                payments: [],
                events: []
            };
            localStorage.setItem('platformData', JSON.stringify(initialData));
        }
    },

    // 3. Authentication / Role Selection
    login(role, redirect = true) {
        this.currentUserRole = role;
        localStorage.setItem('currentUserRole', role);
        
        document.getElementById('role-selection').classList.remove('active');
        document.getElementById('portal-layout').classList.add('active');
        
        this.renderSidebar();
        
        if (redirect) {
            window.location.hash = `#/${role}/dashboard`;
        } else {
            this.router();
        }
    },

    logout() {
        this.currentUserRole = null;
        localStorage.removeItem('currentUserRole');
        window.location.hash = '';
        document.getElementById('portal-layout').classList.remove('active');
        document.getElementById('role-selection').classList.add('active');
    },

    // 4. Sidebar Navigation Generation
    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        const title = document.getElementById('portal-title');
        let links = [];

        if (this.currentUserRole === 'admin') {
            title.innerText = "Admin Portal";
            links = [
                { path: '#/admin/dashboard', name: 'Dashboard' },
                { path: '#/admin/professors', name: 'Professor Mgmt' },
                { path: '#/admin/students', name: 'Student Mgmt' },
                { path: '#/admin/payments', name: 'Payments Overview' },
                { path: '#/admin/courses', name: 'Course Mgmt' },
                { path: '#/admin/calendar', name: 'Platform Calendar' },
                { path: '#/admin/settings', name: 'Settings' }
            ];
        } else if (this.currentUserRole === 'professor') {
            title.innerText = "Professor Portal";
            links = [
                { path: '#/professor/dashboard', name: 'Dashboard' },
                { path: '#/professor/students', name: 'My Students' },
                { path: '#/professor/calendar', name: 'My Calendar' },
                { path: '#/professor/deadlines', name: 'My Deadlines' },
                { path: '#/professor/courses', name: 'My Courses' }
            ];
        } else if (this.currentUserRole === 'student') {
            title.innerText = "Student Portal";
            links = [
                { path: '#/student/dashboard', name: 'Dashboard' },
                { path: '#/student/calendar', name: 'My Calendar' },
                { path: '#/student/exams', name: 'My Exams' },
                { path: '#/student/payments', name: 'Payment Status' },
                { path: '#/student/courses', name: 'My Courses' }
            ];
        }

        nav.innerHTML = links.map(link => `<a href="${link.path}">${link.name}</a>`).join('');
    },

    // 5. Hash-based Router
    router() {
        const hash = window.location.hash || `#/${this.currentUserRole}/dashboard`;
        const viewContainer = document.getElementById('app-view');
        const pageTitle = document.getElementById('page-title');

        // Extract route parts (e.g., #/admin/professors -> role: admin, view: professors)
        const parts = hash.replace('#/', '').split('/');
        const role = parts[0];
        const view = parts[1] || 'dashboard';

        // Update active state in sidebar
        document.querySelectorAll('#sidebar-nav a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === hash);
        });

        // Basic View Rendering (This is where we will inject specific page logic later)
        pageTitle.innerText = view.charAt(0).toUpperCase() + view.slice(1);
        viewContainer.innerHTML = `<div class="card"><h3>Welcome to the ${view} module</h3><p>Content for ${hash} will load here.</p></div>`;
    }
};

// Boot the app
app.init();