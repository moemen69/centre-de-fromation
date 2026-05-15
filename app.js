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

    // --- Mock Database ---
    initializeData() {
        if (!localStorage.getItem('platformData')) {
            localStorage.setItem('platformData', JSON.stringify({
                professors: [{ id: 1, name: 'Dr. Alan Turing', email: 'alan@ict.tn', specialty: 'Computer Science' }],
                students: [{ id: 1, name: 'Sarah Connor', email: 'sarah@student.ict.tn', level: 'Advanced', joinedClasses: ['ICT-101'] }],
                classrooms: [{ id: 1, code: 'ICT-101', name: 'Advanced Cybersecurity', professorEmail: 'alan@ict.tn' }],
                tasks: [],
                posts: [
                    { id: 1, classCode: 'ICT-101', author: 'Dr. Alan Turing', type: 'Exercise', title: 'Network Config Lab', content: 'Please configure the VPN protocols discussed in Chapter 4. Submit via email before Friday.', date: 'May 14, 2026', likes: 2, comments: [{author: 'Sarah Connor', text: 'Understood, starting now.'}] }
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
        const landingMenu = document.getElementById('mobile-nav-menu');
        if (landingMenu.classList.contains('open')) landingMenu.classList.remove('open');
    },

    handleContactSubmit(e) {
        e.preventDefault();
        alert('Thank you for contacting ICT! Your message has been sent to admissions.');
        e.target.reset();
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
            
            const data = this.getData();
            if(role === 'student') data.students.push({ id: Date.now(), name, email, level: 'Beginner', joinedClasses: [] });
            if(role === 'professor') data.professors.push({ id: Date.now(), name, email, specialty: 'General' });
            this.saveData(data);
            alert('Account created successfully!');
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
            links = [{ path: '#/admin/dashboard', icon: 'fa-chart-line', name: 'Overview' }, { path: '#/admin/professors', icon: 'fa-chalkboard-teacher', name: 'Professors' }, { path: '#/admin/students', icon: 'fa-user-graduate', name: 'Students' }, { path: '#/admin/classroom', icon: 'fa-school', name: 'Global Classroom' }, { path: '#/admin/tasks', icon: 'fa-tasks', name: 'My Tasks' }, { path: '#/admin/profile', icon: 'fa-id-badge', name: 'My Profile' }];
        } else if (this.currentUserRole === 'professor') {
            links = [{ path: '#/professor/dashboard', icon: 'fa-chart-line', name: 'Dashboard' }, { path: '#/professor/classroom', icon: 'fa-school', name: 'My Classrooms' }, { path: '#/professor/tasks', icon: 'fa-tasks', name: 'Task Board' }, { path: '#/professor/profile', icon: 'fa-id-badge', name: 'My Profile' }];
        } else if (this.currentUserRole === 'student') {
            links = [{ path: '#/student/dashboard', icon: 'fa-chart-line', name: 'Dashboard' }, { path: '#/student/classroom', icon: 'fa-school', name: 'My Classes' }, { path: '#/student/tasks', icon: 'fa-tasks', name: 'My Tasks' }, { path: '#/student/profile', icon: 'fa-id-badge', name: 'My Profile' }];
        }
        nav.innerHTML = links.map(l => `<a href="${l.path}" onclick="app.closeMobileMenuIfOpen()"><i class="fas ${l.icon}" style="width:20px;"></i> ${l.name}</a>`).join('');
    },

    router() {
        if (!this.currentUserRole) return; 
        const hash = window.location.hash || `#/${this.currentUserRole}/dashboard`;
        const viewContainer = document.getElementById('app-view');
        const pageTitle = document.getElementById('page-title');
        const view = hash.replace('#/', '').split('/')[1] || 'dashboard';

        document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
        
        const titleMap = { 'dashboard': 'Dashboard', 'professors': 'Manage Professors', 'students': 'Manage Students', 'profile': 'My Profile', 'tasks': 'Task Board', 'classroom': 'Classroom Feed' };
        pageTitle.innerText = titleMap[view] || view;
        
        viewContainer.innerHTML = ''; 
        viewContainer.classList.add('fade-in-up');
        setTimeout(() => viewContainer.classList.remove('fade-in-up'), 600);

        if (view === 'dashboard') this.renderDashboard(viewContainer);
        else if (view === 'professors' && this.currentUserRole === 'admin') this.renderAdminProfessors(viewContainer);
        else if (view === 'students' && this.currentUserRole === 'admin') this.renderAdminStudents(viewContainer);
        else if (view === 'profile') this.renderProfile(viewContainer);
        else if (view === 'tasks') this.renderTasks(viewContainer);
        else if (view === 'classroom') this.renderClassroom(viewContainer);
    },

    // ==========================================
    // MODULE RENDERERS 
    // ==========================================

    renderDashboard(container) {
        const data = this.getData();
        if(this.currentUserRole === 'admin') {
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card"><h3><i class="fas fa-chalkboard-teacher gold-text"></i> Total Professors</h3><p class="stat-number">${data.professors.length}</p></div>
                    <div class="card stat-card"><h3><i class="fas fa-user-graduate gold-text"></i> Total Students</h3><p class="stat-number">${data.students.length}</p></div>
                    <div class="card stat-card"><h3><i class="fas fa-server gold-text"></i> System Status</h3><p class="stat-number gold-text">Online</p></div>
                </div>
                <div class="card chart-container"><h3>Activity Overview</h3><canvas id="dashboardChart"></canvas></div>`;
        } else {
            const myTasks = data.tasks.filter(t => t.ownerEmail === this.currentUserEmail && t.status !== 'done').length;
            container.innerHTML = `
                <div class="dashboard-grid">
                    <div class="card stat-card"><h3><i class="fas fa-tasks gold-text"></i> Pending Tasks</h3><p class="stat-number">${myTasks}</p></div>
                    <div class="card stat-card"><h3><i class="fas fa-school gold-text"></i> Total Classes</h3><p class="stat-number">${this.currentUserRole === 'professor' ? data.classrooms.filter(c=>c.professorEmail===this.currentUserEmail).length : 'Active'}</p></div>
                </div>
                <div class="card chart-container"><h3>Engagement Timeline</h3><canvas id="dashboardChart"></canvas></div>`;
        }
        setTimeout(() => this.initChart(), 50);
    },

    renderProfile(container) {
        container.innerHTML = `
            <div class="card profile-wrap">
                <div class="profile-sidebar">
                    <div class="profile-avatar-large"><i class="fas fa-user"></i></div>
                    <h2>${this.currentUserName}</h2>
                    <p style="color: var(--text-muted); margin-top: 5px; text-transform: uppercase; font-size:0.85rem; letter-spacing:1px;">${this.currentUserRole}</p>
                </div>
                <div class="profile-main">
                    <h3>Account Information</h3>
                    <div class="info-row"><span class="info-label">Full Name</span><span class="info-value">${this.currentUserName}</span></div>
                    <div class="info-row"><span class="info-label">Email Address</span><span class="info-value" style="word-break: break-all;">${this.currentUserEmail}</span></div>
                    <div class="info-row"><span class="info-label">Status</span><span class="info-value gold-text"><i class="fas fa-check-circle"></i> Active</span></div>
                </div>
            </div>`;
    },

    renderTasks(container) {
        container.innerHTML = `
            <div class="card">
                <h3>Add New Task</h3>
                <form onsubmit="app.handleAddTask(event)" style="display: flex; gap: 1rem; margin-top: 1rem; align-items:center;">
                    <div style="flex:1;"><input type="text" id="task-title" placeholder="Describe your task..." required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"></div>
                    <button type="submit" class="gold-btn" style="width: auto;"><i class="fas fa-plus"></i> Create</button>
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
                <div style="margin-top: 15px; display: flex; gap: 5px; flex-wrap:wrap;">
                    ${task.status !== 'todo' ? `<button onclick="app.moveTask(${task.id}, 'todo')" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); color:var(--text-main); cursor:pointer; padding:4px 10px; border-radius:4px; font-size:0.8rem;">To Do</button>` : ''}
                    ${task.status !== 'inprogress' ? `<button onclick="app.moveTask(${task.id}, 'inprogress')" style="background:rgba(212,175,55,0.1); border:1px solid var(--border-gold); color:var(--gold-primary); cursor:pointer; padding:4px 10px; border-radius:4px; font-size:0.8rem;">Doing</button>` : ''}
                    ${task.status !== 'done' ? `<button onclick="app.moveTask(${task.id}, 'done')" style="background:rgba(74, 222, 128, 0.1); border:1px solid #4ade80; color:#4ade80; cursor:pointer; padding:4px 10px; border-radius:4px; font-size:0.8rem;">Done</button>` : ''}
                    <button onclick="app.deleteTask(${task.id})" style="background:transparent; border:none; color:#f87171; cursor:pointer; padding:4px; margin-left:auto; font-size:1rem;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;

        board.innerHTML = `
            <div class="kanban-col"><div class="kanban-header">Pending <span class="gold-text">${tasks.filter(t=>t.status==='todo').length}</span></div>${tasks.filter(t=>t.status==='todo').map(buildCard).join('')}</div>
            <div class="kanban-col"><div class="kanban-header">In Progress <span class="gold-text">${tasks.filter(t=>t.status==='inprogress').length}</span></div>${tasks.filter(t=>t.status==='inprogress').map(buildCard).join('')}</div>
            <div class="kanban-col"><div class="kanban-header">Completed <span class="gold-text">${tasks.filter(t=>t.status==='done').length}</span></div>${tasks.filter(t=>t.status==='done').map(buildCard).join('')}</div>
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
                    <h3>Create Classroom</h3>
                    <form onsubmit="app.handleCreateClass(event)">
                        <div class="input-group"><input type="text" id="new-class-name" placeholder="Class Name..." required></div>
                        <button type="submit" class="gold-btn">Generate Space</button>
                    </form>
                </div>
                <div class="card">
                    <h3>My Classrooms</h3>
                    ${myClasses.map(c => `<div class="class-item"><strong>${c.name}</strong><br><span style="color:var(--text-muted); font-size:0.85rem; margin-top:5px; display:block;">Code: <span class="gold-text">${c.code}</span></span></div>`).join('') || '<p style="color:var(--text-muted);">No classes created yet.</p>'}
                </div>
            `;
            if(myClasses.length > 0) {
                feedFormHtml = `
                    <div class="card">
                        <h3>Publish Post</h3>
                        <form onsubmit="app.handleAddPost(event)">
                            <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
                                <div style="flex:1; min-width:200px;"><select id="post-class-code" required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;">${myClasses.map(c => `<option value="${c.code}">${c.name} (${c.code})</option>`).join('')}</select></div>
                                <div style="flex:1; min-width:200px;"><select id="post-type" style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"><option value="Exercise">Exercise / Assignment</option><option value="Correction">Correction / Resource</option></select></div>
                            </div>
                            <div class="input-group"><input type="text" id="post-title" placeholder="Post Title" required></div>
                            <div class="input-group"><textarea id="post-content" placeholder="Instructions or message..." rows="4" required></textarea></div>
                            <button type="submit" class="gold-btn" style="width:auto;"><i class="fas fa-paper-plane"></i> Publish to Class</button>
                        </form>
                    </div>`;
            }
        } else if (this.currentUserRole === 'student') {
            const student = data.students.find(s => s.email === this.currentUserEmail);
            const joined = student?.joinedClasses || [];
            sidebarHtml = `
                <div class="card">
                    <h3>Join Classroom</h3>
                    <form onsubmit="app.handleJoinClass(event)">
                        <div class="input-group"><input type="text" id="join-class-code" placeholder="Enter Class Code (e.g. ICT-1234)" required></div>
                        <button type="submit" class="gold-btn outline">Join Class</button>
                    </form>
                </div>
                <div class="card">
                    <h3>Joined Classes</h3>
                    ${joined.map(code => {
                        const cInfo = data.classrooms.find(c=>c.code===code);
                        return `<div class="class-item"><strong class="gold-text">${cInfo?cInfo.name:'Unknown'}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${code}</span></div>`;
                    }).join('') || '<p style="color:var(--text-muted);">No classes joined.</p>'}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="class-split">
                <div class="class-sidebar">${sidebarHtml}</div>
                <div class="class-feed-area">
                    ${feedFormHtml}
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
        this.router(); 
    },

    handleJoinClass(e) {
        e.preventDefault();
        const code = document.getElementById('join-class-code').value;
        const data = this.getData();
        if(!data.classrooms.find(c => c.code === code)) return alert('Class code not found or invalid.');
        
        const student = data.students.find(s => s.email === this.currentUserEmail);
        if(student) {
            if(!student.joinedClasses) student.joinedClasses = [];
            if(!student.joinedClasses.includes(code)) student.joinedClasses.push(code);
            this.saveData(data);
            this.router();
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
                    <div class="post-author"><i class="fas fa-user-circle" style="color:var(--gold-primary); font-size:1.5rem;"></i> <span>${post.author} <br><span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">${post.date} &bull; ${post.classCode}</span></span></div>
                    <span class="badge ${post.type.toLowerCase()}">${post.type}</span>
                </div>
                <h3>${post.title}</h3>
                <div class="post-body">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="app.likePost(${post.id})"><i class="fas fa-thumbs-up"></i> ${post.likes || 0} Helpful</button>
                    <button class="action-btn" onclick="document.getElementById('comments-${post.id}').classList.toggle('hidden')"><i class="fas fa-comment"></i> ${(post.comments||[]).length} Reply</button>
                </div>
                <div id="comments-${post.id}" class="comments-section hidden">
                    ${(post.comments||[]).map(c => `<div class="comment-item"><span class="comment-author">${c.author}:</span> ${c.text}</div>`).join('')}
                    <form class="comment-form" onsubmit="app.handleAddComment(event, ${post.id})">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a reply..." required style="flex:1; padding:0.8rem; background:var(--bg-surface); border:1px solid var(--border-subtle); color:white; border-radius:6px;">
                        <button type="submit" class="gold-btn" style="width:auto; padding:0.5rem 1rem;">Post</button>
                    </form>
                </div>
            </div>
        `).join('') || '<div class="card" style="text-align:center; padding:3rem;"><i class="fas fa-folder-open" style="font-size:3rem; color:var(--border-gold); margin-bottom:1rem;"></i><p style="color:var(--text-muted);">No posts available in your classrooms.</p></div>';
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
        container.innerHTML = `
            <div class="card">
                <h3>Register Professor</h3>
                <form onsubmit="app.handleAddProf(event)" style="display:flex; gap:1rem; margin-top:1rem; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;"><input type="text" id="prof-name" placeholder="Full Name" required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"></div>
                    <div style="flex:1; min-width:200px;"><input type="email" id="prof-email" placeholder="Email Address" required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"></div>
                    <button type="submit" class="gold-btn" style="width:auto;"><i class="fas fa-user-plus"></i> Add</button>
                </form>
            </div>
            <div class="card">
                <h3>Directory</h3>
                <div class="table-responsive" style="margin-top:1rem;">
                    <table><thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Action</th></tr></thead><tbody id="prof-table-body"></tbody></table>
                </div>
            </div>`;
        this.updateProfTable();
    },
    handleAddProf(e) { e.preventDefault(); const data = this.getData(); data.professors.push({ id: Date.now(), name: document.getElementById('prof-name').value, email: document.getElementById('prof-email').value, specialty: 'General' }); this.saveData(data); e.target.reset(); this.updateProfTable(); },
    updateProfTable() { document.getElementById('prof-table-body').innerHTML = this.getData().professors.map(prof => `<tr><td><strong>${prof.name}</strong></td><td>${prof.email}</td><td><span class="badge correction">${prof.specialty}</span></td><td><button onclick="app.deleteUser('professors', ${prof.id})" style="background:transparent; border:1px solid #f87171; color:#f87171; padding:6px 12px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button></td></tr>`).join(''); },

    renderAdminStudents(container) {
        container.innerHTML = `
            <div class="card">
                <h3>Enroll Student</h3>
                <form onsubmit="app.handleAddStud(event)" style="display:flex; gap:1rem; margin-top:1rem; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;"><input type="text" id="stud-name" placeholder="Full Name" required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"></div>
                    <div style="flex:1; min-width:200px;"><input type="email" id="stud-email" placeholder="Email Address" required style="width:100%; padding:0.8rem; background:var(--bg-base); border:1px solid var(--border-subtle); color:#fff; border-radius:6px;"></div>
                    <button type="submit" class="gold-btn" style="width:auto;"><i class="fas fa-user-plus"></i> Enroll</button>
                </form>
            </div>
            <div class="card">
                <h3>Directory</h3>
                <div class="table-responsive" style="margin-top:1rem;">
                    <table><thead><tr><th>Name</th><th>Email</th><th>Level</th><th>Action</th></tr></thead><tbody id="stud-table-body"></tbody></table>
                </div>
            </div>`;
        this.updateStudTable();
    },
    handleAddStud(e) { e.preventDefault(); const data = this.getData(); data.students.push({ id: Date.now(), name: document.getElementById('stud-name').value, email: document.getElementById('stud-email').value, level: 'Beginner', joinedClasses:[] }); this.saveData(data); e.target.reset(); this.updateStudTable(); },
    updateStudTable() { document.getElementById('stud-table-body').innerHTML = this.getData().students.map(stud => `<tr><td><strong>${stud.name}</strong></td><td>${stud.email}</td><td><span class="badge exercise">${stud.level}</span></td><td><button onclick="app.deleteUser('students', ${stud.id})" style="background:transparent; border:1px solid #f87171; color:#f87171; padding:6px 12px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button></td></tr>`).join(''); },

    deleteUser(type, id) { if(confirm('Permanently remove this user?')) { const data = this.getData(); data[type] = data[type].filter(item => item.id !== id); this.saveData(data); type==='professors'?this.updateProfTable():this.updateStudTable(); } },

    initChart() {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;
        if (this.currentChart) this.currentChart.destroy();
        Chart.defaults.color = '#9ca3af'; Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)'; Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
        this.currentChart = new Chart(ctx, { type: 'line', data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], datasets: [{ label: 'Platform Engagement', data: [35, 65, 50, 90], borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#D4AF37' }] }, options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }});
    }
};

app.init();