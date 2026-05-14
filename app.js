const app = {
    currentUserRole: null,
    currentUserName: null,
    currentUserEmail: null,
    currentChart: null,
    
    init() {
        this.initializeData();
        window.addEventListener('hashchange', () => this.router());
        
        const savedRole = localStorage.getItem('currentUserRole');
        const savedName = localStorage.getItem('currentUserName');
        const savedEmail = localStorage.getItem('currentUserEmail');
        
        if (savedRole && savedEmail) {
            this.currentUserEmail = savedEmail;
            this.loginSuccess(savedRole, savedName, false);
        } else {
            this.showScreen('landing-screen');
        }
    },

    // --- Core Data Initialization ---
    initializeData() {
        if (!localStorage.getItem('platformData')) {
            localStorage.setItem('platformData', JSON.stringify({
                professors: [{ id: 1, name: 'Dr. Alan Turing', email: 'alan@ict.tn', specialty: 'Computer Science' }],
                students: [{ id: 1, name: 'Sarah Connor', email: 'sarah@student.ict.tn', level: 'Advanced', joinedClasses: ['ICT-101'] }],
                classrooms: [{ id: 1, code: 'ICT-101', name: 'Intro to Cybersecurity', professorEmail: 'alan@ict.tn' }],
                tasks: [],
                posts: [
                    { id: 1, classCode: 'ICT-101', author: 'Dr. Alan Turing', type: 'Exercise', title: 'Network Config', content: 'Configure the VPN.', date: 'May 14, 2026', likes: 2, comments: [{author: 'Sarah Connor', text: 'Done!'}] }
                ]
            }));
        }
    },

    getData() { return JSON.parse(localStorage.getItem('platformData')); },
    saveData(data) { localStorage.setItem('platformData', JSON.stringify(data)); },

    // --- Screen State Management ---
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        window.scrollTo(0, 0); 
    },

    goToAuth() { this.showScreen('auth-screen'); },
    goToLanding() { this.showScreen('landing-screen'); },
    toggleLandingMenu() { document.getElementById('mobile-nav-menu').classList.toggle('open'); },
    toggleAppSidebar() { document.getElementById('sidebar').classList.toggle('open'); },
    closeMobileMenuIfOpen() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
    },

    // --- Authentication ---
    toggleAuth(tab) {
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('tab-register').classList.remove('active');

        if (tab === 'login') {
            document.getElementById('tab-login').classList.add('active');
            loginForm.classList.remove('hidden');
            regForm.classList.add('hidden');
            document.getElementById('auth-subtitle').innerText = "Welcome back, please log in.";
        } else {
            document.getElementById('tab-register').classList.add('active');
            regForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            document.getElementById('auth-subtitle').innerText = "Create a new account.";
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
            alert('Account created successfully!');
            
            // Add user to database based on role
            const data = this.getData();
            if(role === 'student') data.students.push({ id: Date.now(), name, email, level: 'Beginner', joinedClasses: [] });
            if(role === 'professor') data.professors.push({ id: Date.now(), name, email, specialty: 'General' });
            this.saveData(data);
        }

        if (email) {
            this.currentUserEmail = email;
            localStorage.setItem('currentUserEmail', email);
            this.loginSuccess(role, name);
        }
    },

    loginSuccess(role, name, redirect = true) {
        this.currentUserRole = role;
        this.currentUserName = name || role;
        localStorage.setItem('currentUserRole', role);
        localStorage.setItem('currentUserName', this.currentUserName);
        
        this.showScreen('portal-layout');
        document.getElementById('user-name-display').innerText = this.currentUserName;
        this.renderSidebar();
        
        if (redirect) window.location.hash = `#/${role}/dashboard`;
        else this.router();
    },

    logout() {
        this.currentUserRole = null;
        this.currentUserName = null;
        this.currentUserEmail = null;
        localStorage.clear();
        window.location.hash = '';
        
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        this.toggleAuth('login');
        this.showScreen('landing-screen');
    },

    // --- Dynamic Sidebar ---
    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let links = [];

        if (this.currentUserRole === 'admin') {
            links = [{ path: '#/admin/dashboard', name: 'Dashboard' }, { path: '#/admin/professors', name: 'Manage Professors' }, { path: '#/admin/students', name: 'Manage Students' }, { path: '#/admin/classroom', name: 'Global Classroom' }, { path: '#/admin/tasks', name: 'My Tasks' }, { path: '#/admin/profile', name: 'My Profile' }];
        } else if (this.currentUserRole === 'professor') {
            links = [{ path: '#/professor/dashboard', name: 'Dashboard' }, { path: '#/professor/classroom', name: 'My Classroom' }, { path: '#/professor/tasks', name: 'My Tasks' }, { path: '#/professor/profile', name: 'My Profile' }];
        } else if (this.currentUserRole === 'student') {
            links = [{ path: '#/student/dashboard', name: 'Dashboard' }, { path: '#/student/classroom', name: 'My Classroom' }, { path: '#/student/tasks', name: 'My Tasks' }, { path: '#/student/profile', name: 'My Profile' }];
        }
        nav.innerHTML = links.map(link => `<a href="${link.path}" onclick="app.closeMobileMenuIfOpen()">${link.name}</a>`).join('');
    },

    router() {
        if (!this.currentUserRole) return; 
        const hash = window.location.hash || `#/${this.currentUserRole}/dashboard`;
        const viewContainer = document.getElementById('app-view');
        const pageTitle = document.getElementById('page-title');
        const view = hash.replace('#/', '').split('/')[1] || 'dashboard';

        document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
        pageTitle.innerText = view.charAt(0).toUpperCase() + view.slice(1);
        
        if (view === 'dashboard') this.renderDashboard(viewContainer);
        else if (view === 'professors' && this.currentUserRole === 'admin') this.renderAdminProfessors(viewContainer);
        else if (view === 'students' && this.currentUserRole === 'admin') this.renderAdminStudents(viewContainer);
        else if (view === 'profile') this.renderProfile(viewContainer);
        else if (view === 'tasks') this.renderTasks(viewContainer);
        else if (view === 'classroom') this.renderClassroom(viewContainer);
    },

    // ==========================================
    // MODULE RENDERERS & LOGIC
    // ==========================================

    renderDashboard(container) {
        const data = this.getData();
        if(this.currentUserRole === 'admin') {
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card"><h3>Total Professors</h3><p class="stat-number">${data.professors.length}</p></div>
                    <div class="card stat-card"><h3>Total Students</h3><p class="stat-number">${data.students.length}</p></div>
                    <div class="card stat-card"><h3>System Status</h3><p class="stat-number gold-text">Online</p></div>
                </div>
                <div class="card chart-container"><h3 class="gold-text">Platform Overview</h3><canvas id="dashboardChart"></canvas></div>`;
        } else {
            const myTasks = data.tasks.filter(t => t.ownerEmail === this.currentUserEmail && t.status !== 'done').length;
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card"><h3>Pending Tasks</h3><p class="stat-number">${myTasks}</p></div>
                    <div class="card stat-card"><h3>Total Classes</h3><p class="stat-number">${this.currentUserRole === 'professor' ? data.classrooms.filter(c=>c.professorEmail===this.currentUserEmail).length : 'N/A'}</p></div>
                </div>
                <div class="card chart-container"><h3 class="gold-text">Engagement</h3><canvas id="dashboardChart"></canvas></div>`;
        }
        setTimeout(() => this.initChart(), 50);
    },

    // --- Profile ---
    renderProfile(container) {
        container.innerHTML = `
            <div class="card profile-wrap">
                <div class="profile-sidebar">
                    <div class="profile-avatar-large"><i class="fas fa-user"></i></div>
                    <h2 class="gold-text">${this.currentUserName}</h2>
                    <p style="color: var(--text-gray);">${this.currentUserRole.toUpperCase()}</p>
                </div>
                <div class="profile-main">
                    <h3 style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">Private Information</h3>
                    <div class="info-row"><span class="info-label">Full Name</span><span class="info-value">${this.currentUserName}</span></div>
                    <div class="info-row"><span class="info-label">Email Address</span><span class="info-value">${this.currentUserEmail}</span></div>
                    <div class="info-row"><span class="info-label">Status</span><span class="info-value gold-text">Active</span></div>
                </div>
            </div>`;
    },

    // --- Private Tasks Kanban ---
    renderTasks(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="gold-text">Add New Task</h3>
                <form onsubmit="app.handleAddTask(event)" style="display: flex; gap: 10px; margin-top: 15px;">
                    <div class="input-group" style="flex:1; margin:0;"><input type="text" id="task-title" placeholder="Task description..." required></div>
                    <button type="submit" class="gold-btn" style="width: auto;">Add to Board</button>
                </form>
            </div>
            <div class="kanban-board" id="kanban-board"></div>
        `;
        this.updateTaskBoard();
    },

    handleAddTask(e) {
        e.preventDefault();
        const data = this.getData();
        data.tasks.push({ id: Date.now(), title: document.getElementById('task-title').value, status: 'todo', ownerEmail: this.currentUserEmail });
        this.saveData(data);
        document.getElementById('task-title').value = '';
        this.updateTaskBoard();
    },

    updateTaskBoard() {
        const board = document.getElementById('kanban-board');
        if(!board) return;
        const tasks = this.getData().tasks.filter(t => t.ownerEmail === this.currentUserEmail);

        const buildCard = (task) => `
            <div class="task-card">
                <div class="task-title">${task.title}</div>
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    ${task.status !== 'todo' ? `<button onclick="app.moveTask(${task.id}, 'todo')" style="background:none; border:1px solid #333; color:#fff; cursor:pointer; padding:3px 8px; border-radius:3px;">To Do</button>` : ''}
                    ${task.status !== 'inprogress' ? `<button onclick="app.moveTask(${task.id}, 'inprogress')" style="background:none; border:1px solid var(--gold-primary); color:var(--gold-primary); cursor:pointer; padding:3px 8px; border-radius:3px;">Doing</button>` : ''}
                    ${task.status !== 'done' ? `<button onclick="app.moveTask(${task.id}, 'done')" style="background:none; border:1px solid #4ade80; color:#4ade80; cursor:pointer; padding:3px 8px; border-radius:3px;">Done</button>` : ''}
                    <button onclick="app.deleteTask(${task.id})" style="background:none; border:1px solid #f87171; color:#f87171; cursor:pointer; padding:3px 8px; border-radius:3px; margin-left:auto;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;

        board.innerHTML = `
            <div class="kanban-col"><div class="kanban-header">To Do <span class="gold-text">${tasks.filter(t=>t.status==='todo').length}</span></div>${tasks.filter(t=>t.status==='todo').map(buildCard).join('')}</div>
            <div class="kanban-col"><div class="kanban-header">In Progress <span class="gold-text">${tasks.filter(t=>t.status==='inprogress').length}</span></div>${tasks.filter(t=>t.status==='inprogress').map(buildCard).join('')}</div>
            <div class="kanban-col"><div class="kanban-header">Done <span class="gold-text">${tasks.filter(t=>t.status==='done').length}</span></div>${tasks.filter(t=>t.status==='done').map(buildCard).join('')}</div>
        `;
    },
    moveTask(id, newStatus) { const data = this.getData(); const task = data.tasks.find(t => t.id === id); if(task) { task.status = newStatus; this.saveData(data); this.updateTaskBoard(); } },
    deleteTask(id) { const data = this.getData(); data.tasks = data.tasks.filter(t => t.id !== id); this.saveData(data); this.updateTaskBoard(); },

    // --- Classroom Logic ---
    renderClassroom(container) {
        const data = this.getData();
        let sidebarHtml = '';
        let feedFormHtml = '';

        if (this.currentUserRole === 'professor' || this.currentUserRole === 'admin') {
            const myClasses = this.currentUserRole === 'admin' ? data.classrooms : data.classrooms.filter(c => c.professorEmail === this.currentUserEmail);
            
            sidebarHtml = `
                <div class="card">
                    <h3 class="gold-text">Create Classroom</h3>
                    <form onsubmit="app.handleCreateClass(event)" style="margin-top:10px;">
                        <input type="text" id="new-class-name" placeholder="Class Name..." required style="width:100%; padding:0.8rem; background:#000; border:1px solid #333; color:#fff; border-radius:4px; margin-bottom:10px;">
                        <button type="submit" class="gold-btn">Generate Code</button>
                    </form>
                </div>
                <div class="card">
                    <h3 class="gold-text">My Class Codes</h3>
                    ${myClasses.map(c => `<div class="class-item"><strong>${c.name}</strong><br><span style="color:var(--gold-primary);">Code: ${c.code}</span></div>`).join('') || '<p>No classes created yet.</p>'}
                </div>
            `;

            if(myClasses.length > 0) {
                feedFormHtml = `
                    <div class="card">
                        <h3 class="gold-text">Publish Post</h3>
                        <form onsubmit="app.handleAddPost(event)" style="margin-top: 15px;">
                            <div style="display:flex; gap:10px; margin-bottom:10px;">
                                <select id="post-class-code" required style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;">
                                    ${myClasses.map(c => `<option value="${c.code}">${c.name} (${c.code})</option>`).join('')}
                                </select>
                                <select id="post-type" style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;">
                                    <option value="Exercise">Exercise</option><option value="Correction">Correction</option>
                                </select>
                            </div>
                            <input type="text" id="post-title" placeholder="Post Title" required style="width:100%; padding:0.8rem; background:#000; border:1px solid #333; color:#fff; margin-bottom:10px;">
                            <textarea id="post-content" placeholder="Instructions or message..." rows="3" required style="width:100%; padding:0.8rem; background:#000; border:1px solid #333; color:#fff; margin-bottom:10px;"></textarea>
                            <button type="submit" class="gold-btn" style="width:auto;">Publish</button>
                        </form>
                    </div>`;
            }
        } else if (this.currentUserRole === 'student') {
            const student = data.students.find(s => s.email === this.currentUserEmail);
            const joined = student?.joinedClasses || [];
            
            sidebarHtml = `
                <div class="card">
                    <h3 class="gold-text">Join Classroom</h3>
                    <form onsubmit="app.handleJoinClass(event)" style="margin-top:10px;">
                        <input type="text" id="join-class-code" placeholder="Enter Class Code (e.g. ICT-1234)" required style="width:100%; padding:0.8rem; background:#000; border:1px solid #333; color:#fff; border-radius:4px; margin-bottom:10px;">
                        <button type="submit" class="gold-btn outline">Join</button>
                    </form>
                </div>
                <div class="card">
                    <h3 class="gold-text">Joined Classes</h3>
                    ${joined.map(code => `<div class="class-item"><span style="color:var(--gold-primary);">${code}</span></div>`).join('') || '<p>No classes joined.</p>'}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="class-split">
                <div class="class-sidebar">${sidebarHtml}</div>
                <div class="class-feed-area">
                    ${feedFormHtml}
                    <h3 style="margin: 1rem 0; border-bottom: 1px solid #333; padding-bottom: 0.5rem;">Classroom Feed</h3>
                    <div id="classroom-posts"></div>
                </div>
            </div>
        `;
        this.updateClassroomFeed();
    },

    handleCreateClass(e) {
        e.preventDefault();
        const name = document.getElementById('new-class-name').value;
        const code = 'ICT-' + Math.floor(1000 + Math.random() * 9000);
        const data = this.getData();
        data.classrooms.push({ id: Date.now(), code, name, professorEmail: this.currentUserEmail });
        this.saveData(data);
        this.router(); // Reload view
    },

    handleJoinClass(e) {
        e.preventDefault();
        const code = document.getElementById('join-class-code').value;
        const data = this.getData();
        if(!data.classrooms.find(c => c.code === code)) return alert('Class code not found!');
        
        const student = data.students.find(s => s.email === this.currentUserEmail);
        if(student) {
            if(!student.joinedClasses) student.joinedClasses = [];
            if(!student.joinedClasses.includes(code)) student.joinedClasses.push(code);
            this.saveData(data);
            this.router(); // Reload view
        }
    },

    handleAddPost(e) {
        e.preventDefault();
        const data = this.getData();
        data.posts.unshift({
            id: Date.now(),
            classCode: document.getElementById('post-class-code').value,
            type: document.getElementById('post-type').value,
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-content').value,
            author: this.currentUserName,
            date: new Date().toLocaleDateString(),
            likes: 0, comments: []
        });
        this.saveData(data);
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        this.updateClassroomFeed();
    },

    updateClassroomFeed() {
        const feed = document.getElementById('classroom-posts');
        if(!feed) return;
        const data = this.getData();
        
        let visiblePosts = [];
        if(this.currentUserRole === 'admin') visiblePosts = data.posts;
        else if (this.currentUserRole === 'professor') {
            const myCodes = data.classrooms.filter(c => c.professorEmail === this.currentUserEmail).map(c=>c.code);
            visiblePosts = data.posts.filter(p => myCodes.includes(p.classCode));
        } else {
            const student = data.students.find(s => s.email === this.currentUserEmail);
            const joined = student?.joinedClasses || [];
            visiblePosts = data.posts.filter(p => joined.includes(p.classCode));
        }

        feed.innerHTML = visiblePosts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-author"><i class="fas fa-user-circle" style="color:var(--gold-primary);"></i> ${post.author} <span style="font-size:0.8rem; color:#666; margin-left:10px;">${post.classCode}</span></div>
                    <span class="badge ${post.type.toLowerCase()}">${post.type}</span>
                </div>
                <h3 style="margin-bottom: 10px;">${post.title}</h3>
                <div class="post-body">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="app.likePost(${post.id})"><i class="fas fa-thumbs-up"></i> ${post.likes || 0} Likes</button>
                    <button class="action-btn" onclick="document.getElementById('comments-${post.id}').classList.toggle('hidden')"><i class="fas fa-comment"></i> ${(post.comments||[]).length} Comments</button>
                </div>
                <div id="comments-${post.id}" class="comments-section hidden">
                    ${(post.comments||[]).map(c => `<div class="comment-item"><span class="comment-author">${c.author}:</span> ${c.text}</div>`).join('')}
                    <form class="comment-form" onsubmit="app.handleAddComment(event, ${post.id})">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." required>
                        <button type="submit" class="gold-btn" style="width:auto; padding:0.5rem 1rem;">Post</button>
                    </form>
                </div>
            </div>
        `).join('') || '<p style="color:#666;">No posts in your classrooms yet.</p>';
    },

    likePost(id) { const data = this.getData(); const post = data.posts.find(p=>p.id===id); if(post){ post.likes = (post.likes||0)+1; this.saveData(data); this.updateClassroomFeed(); } },
    handleAddComment(e, id) {
        e.preventDefault();
        const text = document.getElementById(`comment-input-${id}`).value;
        const data = this.getData();
        const post = data.posts.find(p=>p.id===id);
        if(post){
            if(!post.comments) post.comments = [];
            post.comments.push({ author: this.currentUserName, text });
            this.saveData(data);
            this.updateClassroomFeed();
            document.getElementById(`comments-${id}`).classList.remove('hidden');
        }
    },

    // --- Admin Tables ---
    renderAdminProfessors(container) {
        container.innerHTML = `<div class="card"><h3 class="gold-text">Add Professor</h3><form onsubmit="app.handleAddProf(event)" style="display:flex; gap:10px; margin-top:15px;"><input type="text" id="prof-name" placeholder="Name" required style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;"><input type="email" id="prof-email" placeholder="Email" required style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;"><button type="submit" class="gold-btn" style="width:auto;">Add</button></form></div><div class="card"><h3 class="gold-text">Directory</h3><div style="overflow-x:auto; margin-top:15px;"><table><thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead><tbody id="prof-table-body"></tbody></table></div></div>`;
        this.updateProfTable();
    },
    handleAddProf(e) { e.preventDefault(); const data = this.getData(); data.professors.push({ id: Date.now(), name: document.getElementById('prof-name').value, email: document.getElementById('prof-email').value, specialty: 'General' }); this.saveData(data); e.target.reset(); this.updateProfTable(); },
    updateProfTable() { document.getElementById('prof-table-body').innerHTML = this.getData().professors.map(prof => `<tr><td>${prof.name}</td><td>${prof.email}</td><td><button onclick="app.deleteUser('professors', ${prof.id})" style="background:transparent; border:1px solid #f87171; color:#f87171; padding:5px 10px; cursor:pointer;">Delete</button></td></tr>`).join(''); },

    renderAdminStudents(container) {
        container.innerHTML = `<div class="card"><h3 class="gold-text">Enroll Student</h3><form onsubmit="app.handleAddStud(event)" style="display:flex; gap:10px; margin-top:15px;"><input type="text" id="stud-name" placeholder="Name" required style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;"><input type="email" id="stud-email" placeholder="Email" required style="flex:1; padding:0.8rem; background:#000; border:1px solid #333; color:#fff;"><button type="submit" class="gold-btn" style="width:auto;">Enroll</button></form></div><div class="card"><h3 class="gold-text">Directory</h3><div style="overflow-x:auto; margin-top:15px;"><table><thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead><tbody id="stud-table-body"></tbody></table></div></div>`;
        this.updateStudTable();
    },
    handleAddStud(e) { e.preventDefault(); const data = this.getData(); data.students.push({ id: Date.now(), name: document.getElementById('stud-name').value, email: document.getElementById('stud-email').value, level: 'Beginner', joinedClasses:[] }); this.saveData(data); e.target.reset(); this.updateStudTable(); },
    updateStudTable() { document.getElementById('stud-table-body').innerHTML = this.getData().students.map(stud => `<tr><td>${stud.name}</td><td>${stud.email}</td><td><button onclick="app.deleteUser('students', ${stud.id})" style="background:transparent; border:1px solid #f87171; color:#f87171; padding:5px 10px; cursor:pointer;">Delete</button></td></tr>`).join(''); },

    deleteUser(type, id) { if(confirm('Delete user?')) { const data = this.getData(); data[type] = data[type].filter(item => item.id !== id); this.saveData(data); type==='professors'?this.updateProfTable():this.updateStudTable(); } },

    initChart() {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;
        if (this.currentChart) this.currentChart.destroy();
        Chart.defaults.color = '#a0a0a0'; Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)'; Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
        this.currentChart = new Chart(ctx, { type: 'line', data: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ label: 'Activity', data: [45, 60, 55, 95], borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false }});
    }
};

app.init();