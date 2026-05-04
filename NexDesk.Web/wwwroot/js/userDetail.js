// ── User Detail / Profile ──────────────────────────────────────────────────
// Called from Settings iframe via: parent.openUserDetail(userId)
// Back navigation via: goBackFromUserDetail()

let _previousView = 'settings'; // default fallback

function openUserDetail(userId) {
    // Remember where we came from so back button works
    const currentActive = document.querySelector('.view.active');
    if (currentActive) _previousView = currentActive.id;

    // Switch all nav buttons off, switch all views off
    document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));

    // Activate the userDetail section
    document.getElementById('userDetail').classList.add('active');

    // Update topbar
    document.getElementById('topbarTitle').textContent = 'User Profile';
    document.getElementById('topbarDesc').textContent = 'Detailed overview of user activity and account.';

    // Show loading state
    document.getElementById('userDetailContent').innerHTML = `
        <p style="color:var(--muted, #8899aa); padding:1rem;">Loading user profile...</p>
    `;

    // Load and render
    loadUserDetail(userId);
}

function goBackFromUserDetail() {
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    document.getElementById(_previousView).classList.add('active');

    // Re-activate correct nav button
    const btn = document.querySelector(`.nav button[data-view="${_previousView}"]`);
    if (btn) {
        document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');

        // Restore topbar
        const viewDescriptions = {
            dashboard: { title: 'Dashboard', desc: 'Here you can see a list of recent tickets and an overview of statuses.' },
            tickets: { title: 'Tickets', desc: 'Search, filter and manage all support tickets.' },
            tasks: { title: 'Tasks', desc: 'Create and assign tasks to supporters based on open tickets.' },
            ticketDetail: { title: 'Ticket Details', desc: 'See full details, comments and history for a selected ticket.' },
            qrList: { title: 'Reports', desc: 'Browse all generated QR codes from resolved tickets.' },
            qrDetail: { title: 'QR Details', desc: 'See report and documentation after MAUI scan and confirmation.' },
            notifications: { title: 'Notifications', desc: 'See assignments, updates and reminders for your tickets.' },
            lookup: { title: 'Lookup Data', desc: 'Manage categories, departments, priorities and statuses.' },
            comment: { title: 'Comments', desc: 'See all comments and replies across tickets.' },
            history: { title: 'History', desc: 'See all changes and activities on tickets over time.' },
            settings: { title: 'Settings', desc: 'Manage password, users, roles and lookup data.' }
        };
        const view = viewDescriptions[_previousView];
        if (view) {
            document.getElementById('topbarTitle').textContent = view.title;
            document.getElementById('topbarDesc').textContent = view.desc;
        }
    }
}

async function loadUserDetail(userId) {
    try {
        const [userRes, ticketsRes, tasksRes, commentsRes, notificationsRes, historyRes, profileRes] = await Promise.all([
            fetch(`${apiBase}/api/users/${userId}`),
            fetch(`${apiBase}/api/tickets`),
            fetch(`${apiBase}/api/tasks`),
            fetch(`${apiBase}/api/comments`),
            fetch(`${apiBase}/api/notifications`),
            fetch(`${apiBase}/api/history`),
            fetch(`${apiBase}/api/userprofiles/byuser/${userId}`)
        ]);

        const user = await userRes.json();
        const allTickets = await ticketsRes.json();
        const allTasks = await tasksRes.json();
        const allComments = await commentsRes.json();
        const allNotifs = await notificationsRes.json();
        const allHistory = await historyRes.json();

        const profile = profileRes.ok ? await profileRes.json() : null;

        const ticketsCreated = allTickets.filter(t => t.createdByUserId === userId);
        const ticketsAssigned = allTickets.filter(t => t.assignedToUserId === userId);
        const tasksAssigned = allTasks.filter(t => t.assignedUserId === userId);
        const tasksCreated = allTasks.filter(t => t.createdByUserId === userId);
        const comments = allComments.filter(c => c.userId === userId);
        const notifications = allNotifs.filter(n => n.userId === userId);
        const history = allHistory.filter(h => h.changedByUserId === userId);

        renderUserDetail(user, profile, {
            ticketsCreated, ticketsAssigned,
            tasksCreated, tasksAssigned,
            comments, notifications, history
        });

    } catch (err) {
        console.error('loadUserDetail error:', err);
        document.getElementById('userDetailContent').innerHTML =
            `<p style="color:#ff6b6b; padding:1rem;">Error loading user profile.</p>`;
    }
}

function renderUserDetail(user, profile, data) {
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const rfidDisplay = isAdmin ? (user.rfidChip ? '●●●●●●' : '—') : null;
    const unreadCount = data.notifications.filter(n => !n.isRead).length;


    // The + 'Z' tells JavaScript the timestamp is UTC, so it converts correctly to your local time before comparing.
    // Online indicator — active within last 15 min
    const isOnline = profile?.lastLoginAt
        ? (new Date() - new Date(profile.lastLoginAt + 'Z')) < 15 * 60 * 1000
        : false;

    const minutesAgo = profile?.lastLoginAt
        ? Math.floor((new Date() - new Date(profile.lastLoginAt + 'Z')) / 60000)
        : null;

    const onlineHtml = profile?.lastLoginAt ? (isOnline
        ? `<span style="display:inline-flex;align-items:center;gap:0.4rem;">
        <span data-tooltip="profile-online" style="width:10px;height:10px;border-radius:50%;background:#95e06c;
            display:inline-block;animation:blink 1.5s infinite;"></span>
        <span style="color:#95e06c;font-weight:600;">Online now</span>
        <span style="color:var(--muted,#8899aa);">(${minutesAgo === 0 ? 'just now' : minutesAgo + ' min ago'})</span>
       </span>`
        : `<span style="display:inline-flex;align-items:center;gap:0.4rem;">
        <span data-tooltip="profile-offline" style="width:10px;height:10px;border-radius:50%;background:#8899aa;
            display:inline-block;"></span>
        <span style="color:var(--muted,#8899aa);">Inactive — last seen ${fmtDate(profile.lastLoginAt)}</span>
       </span>`)
        : `<span style="color:var(--muted,#8899aa);">Last seen: —</span>`;

    const isActive = profile ? profile.isActive : null;
    // Avatar — profile picture or initials
    const avatarHtml = profile?.profilePicture
        ? `<div style="position:relative;width:72px;height:72px;flex-shrink:0;cursor:pointer;"
            onmouseenter="this.querySelector('.avatar-overlay').style.opacity='1'"
            onmouseleave="this.querySelector('.avatar-overlay').style.opacity='0'">
            <img src="${profile.profilePicture}" 
                style="width:72px;height:72px;border-radius:50%;object-fit:cover;"
                onclick="triggerAvatarUpload(${user.id})" data-tooltip="profile-avatar" title="Click to change picture" />
            <div class="avatar-overlay" onclick="deleteProfilePicture(${user.id})"
                style="position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,0.6);
                display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;
                font-size:1.2rem;" title="Delete picture">🗑️</div>
        </div>`
        : `<div onclick="triggerAvatarUpload(${user.id})" data-tooltip="profile-avatar" title="Click to upload picture"
        style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#4a9eff,#7c5cbf);
        display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;
        color:#fff;flex-shrink:0;cursor:pointer;position:relative;">
        ${initials}
        <span style="position:absolute;bottom:0;right:0;background:#4a9eff;border-radius:50%;
            width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;">+</span>
       </div>`;

    // Workload chart data
    const open = data.ticketsAssigned.filter(t => t.status?.name?.toLowerCase().includes('open')).length;
    const progress = data.ticketsAssigned.filter(t => t.status?.name?.toLowerCase().includes('progress') || t.status?.name?.toLowerCase().includes('waiting')).length;
    const resolved = data.ticketsAssigned.filter(t => t.status?.name?.toLowerCase().includes('resolved')).length;
    const closed = data.ticketsAssigned.filter(t => t.status?.name?.toLowerCase().includes('closed')).length;

    document.getElementById('userDetailContent').innerHTML = `

        <!-- ── 1. PROFILE HEADER ── -->
        <div style="gap:1.5rem;padding:1.5rem;background:var(--panel,#111a2e);border-radius:12px;margin-bottom:1.5rem;">
            <div style="position:relative;">
                ${avatarHtml}
               
            </div>
           <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                    <h2 style="margin:0;font-size:1.4rem;">${fullName}</h2>
                    <span style="${rolePermissionBadgeStyle(getPermissionLevel(user))}">${getRoleName(user)}</span>
                   ${profile && !profile.isActive ? `
                    <span style="font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:999px;font-weight:600;
                        background:#ff6b6b22;color:#ff6b6b;border:1px solid #ff6b6b55;">
                        Disabled
                    </span>` : ''}
                </div>
                <div style="color:var(--muted,#8899aa);margin-top:0.35rem;font-size:0.9rem;">
                    @${user.userName ?? '—'} &nbsp;·&nbsp; ${user.email ?? '—'} &nbsp;·&nbsp; ${user.phone ?? '—'}
                </div>
                <div style="color:var(--muted,#8899aa);font-size:0.85rem;margin-top:0.25rem;">
                    ${isAdmin ? `RFID: <span style="font-family:monospace;">●●●●●●</span> &nbsp;·&nbsp;` : ''}${onlineHtml}
                </div>
            </div>
            ${isAdmin && profile ? `
            <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end;">
                <button class="btn" onclick="toggleUserActive(${user.id})" data-tooltip="btn-deactivate"
                    style="background:${profile.isActive ? '#ff6b6b' : '#95e06c'};color:${profile.isActive ? '#fff' : '#000'};">
                    ${profile.isActive ? 'Deactivate account' : 'Activate account'}
                </button>
            </div>
        </div>` : ''} 

        <!-- ── 2. STATS CARDS ── -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;">
            ${statCard('Created tickets', data.ticketsCreated.length, '#4a9eff')}
            ${statCard('Assigned tickets', data.ticketsAssigned.length, '#7c5cbf')}
            ${statCard('Created tasks', data.tasksCreated.length, '#ffb454')}
            ${statCard('Assigned tasks', data.tasksAssigned.length, '#4ecdc4')}
            ${statCard('Comments', data.comments.length, '#95e06c')}
            ${statCard('Notifications', data.notifications.length, '#ff6b6b')}
            ${statCard('Unread notif.', unreadCount, '#ff9f43')}
            ${statCard('History', data.history.length, '#a29bfe')}
        </div>

        <!-- ── 3. WORKLOAD CHART ── -->
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="section-head" data-tooltip="profile-workload"><div><h3>Ticket workload</h3><div class="muted">Distribution of assigned tickets</div></div></div>
            ${workloadChart(open, progress, resolved, closed)}
        </div>

        <!-- ── 4. TICKETS ── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
            <div class="card">
                <div class="section-head" data-tooltip="profile-stat-created"><div><h3>Created tickets</h3><div class="muted">Tickets created by this user</div></div></div>
                ${ticketTable(data.ticketsCreated)}
            </div>
            <div class="card">
                <div class="section-head" data-tooltip="profile-stat-assigned"><div><h3>Assigned tickets</h3><div class="muted">Tickets where user is responsible</div></div></div>
                ${ticketTable(data.ticketsAssigned)}
            </div>
        </div>

        <!-- ── 5. TASKS ── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
            <div class="card">
                <div class="section-head" data-tooltip="profile-stat-tasks-created"><div><h3>Created tasks</h3><div class="muted">Tasks created by this user</div></div></div>
                ${taskTable(data.tasksCreated)}
            </div>
            <div class="card">
                <div class="section-head" data-tooltip="profile-stat-tasks-assigned"><div><h3>Assigned tasks</h3><div class="muted">Tasks assigned to this user</div></div></div>
                ${taskTable(data.tasksAssigned)}
            </div>
        </div>

        <!-- ── 6. COMMENTS ── -->
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="section-head" data-tooltip="profile-stat-comments"><div><h3>Comments</h3><div class="muted">All comments written by this user</div></div></div>
            ${commentsTable(data.comments)}
        </div>

        <!-- ── 7. NOTIFICATIONS ── -->
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="section-head" data-tooltip="profile-stat-notifs"><div><h3>Notifications</h3><div class="muted">All notifications for this user</div></div></div>
            ${notificationsTable(data.notifications)}
        </div>

        <!-- ── 8. HISTORY ── -->
        <div class="card" style="margin-bottom:1.5rem;">
            <div class="section-head" data-tooltip="profile-stat-history"><div><h3>Activity Log</h3><div class="muted">All changes made by this user</div></div></div>
            ${historyTable(data.history)}
        </div>

        <!-- ── 9. SECURITY (Admin only) ── -->
        ${isAdmin ? securitySection(user) : ''}
    `;

    // Add blink animation if not already added
    if (!document.getElementById('blinkStyle')) {
        const style = document.createElement('style');
        style.id = 'blinkStyle';
        style.textContent = `
        @keyframes blink {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.85); }
        }`;
        document.head.appendChild(style);
    }

    // Wire up PDF export button with current data
    const pdfBtn = document.getElementById('exportPdfBtn');
    if (pdfBtn) pdfBtn.onclick = () => exportUserPdf(user, profile, data, currentAdminUser);
}

// ============================================
// UPDATE SIDEBAR FOOTER WITH USER PROFILE PICTURE
// ============================================

async function updateSidebarUserProfile() {
    try {
        const userId = loggedInUserId;
        const profileRes = await fetch(`${apiBase}/api/userprofiles/byuser/${userId}`);

        if (!profileRes.ok) {
            console.log('No profile picture found');
            return;
        }

        const profile = await profileRes.json();
        const userName = document.querySelector('.user-name')?.innerText?.replace('Hi, ', '') || 'User';
        const userRole = document.querySelector('.user-role-badge span')?.innerText || '';

        // Get initials from the name
        const initials = userName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        const userAvatarDiv = document.querySelector('.user-avatar');
        if (!userAvatarDiv) return;

        if (profile.profilePicture) {
            // Show actual profile picture
            userAvatarDiv.innerHTML = `
                <img src="${profile.profilePicture}" 
                    class="avatar-img" 
                    alt="Profile"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="avatar-initials" style="display: none;">${initials}</div>
            `;
            const img = userAvatarDiv.querySelector('.avatar-img');
            if (img && img.complete && img.naturalWidth === 0) {
                img.style.display = 'none';
                img.nextElementSibling.style.display = 'flex';
            }
        } else {
            // Show initials
            userAvatarDiv.innerHTML = `<div class="avatar-initials">${initials}</div>`;
        }

    } catch (err) {
        console.error('Failed to load profile picture:', err);
    }
}

// Call this when page loads and after profile updates
window.addEventListener('load', function () {
    if (typeof loggedInUserId !== 'undefined') {
        setTimeout(updateSidebarUserProfile, 500);
    }
});

// Also update after profile picture changes
const originalLoadUserDetail = loadUserDetail;
window.loadUserDetail = async function (userId) {
    await originalLoadUserDetail(userId);
    if (userId === loggedInUserId) {
        await updateSidebarUserProfile();
    }
};
// ── Helpers ────────────────────────────────────────────────────────────────

function statCard(label, value, color) {
    return `
        <div style="background:var(--panel,#111a2e); border-radius:10px; padding:1rem; text-align:center; border-top:3px solid ${color};">
            <div style="font-size:1.6rem; font-weight:700; color:${color};">${value}</div>
            <div style="font-size:0.78rem; color:var(--muted,#8899aa); margin-top:0.25rem;">${label}</div>
        </div>`;
}



function roleBadgeStyle(roleName) {
    const base = 'font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:999px; font-weight:600;';

    // Generate a consistent color based on role name (no hardcoded mappings)
    const getColorFromName = (name) => {
        if (!name) return '#8899aa';
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ['#ff6b6b', '#4a9eff', '#95e06c', '#ffb454', '#a29bfe', '#4ecdc4'];
        return colors[hash % colors.length];
    };

    const color = getColorFromName(roleName);
    return base + `background:${color}22; color:${color}; border:1px solid ${color}55;`;
}

function getPermissionLevel(user) {
        const direct = Number(user?.permissionLevel);
        if (Number.isFinite(direct) && direct > 0) return direct;

        const fromRole = Number(user?.role?.permissionLevel);
        if (Number.isFinite(fromRole) && fromRole > 0) return fromRole;

        // Legacy fallback only
        if (Number(user?.roleId) === 1) return 3;
        if (Number(user?.roleId) === 2) return 2;
        return 1;
}

function getRoleName(user) {
        const roleName = user?.roleName ?? user?.role?.name;
        if (roleName) return roleName;

        const permissionLevel = getPermissionLevel(user);
        if (permissionLevel === 3) return 'Administrator';
        if (permissionLevel === 2) return 'Support';
        return 'User';
}

function rolePermissionBadgeStyle(permissionLevel) {
        const colors = {
            3: 'background:#ff6b6b22; color:#ff6b6b; border:1px solid #ff6b6b55;',
            2: 'background:#4a9eff22; color:#4a9eff; border:1px solid #4a9eff55;',
        };
        const base = 'font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:999px; font-weight:600;';
        return base + (colors[permissionLevel] ?? 'background:#ffffff22; color:#ccc; border:1px solid #ffffff33;');
}

    function fmtDate(val) {
        if (!val) return '—';
        const d = new Date(val);
        return isNaN(d) ? val : d.toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function statusBadge(statusName) {
        if (!statusName) return '—';
        const n = statusName.toLowerCase();
        let color = '#8899aa';
        if (n.includes('open')) color = '#4a9eff';
        if (n.includes('progress') || n.includes('waiting')) color = '#ffb454';
        if (n.includes('resolved')) color = '#95e06c';
        if (n.includes('closed')) color = '#ff6b6b';
        return `<span style="background:${color}22; color:${color}; border:1px solid ${color}55;
        font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:999px; font-weight:600;">${statusName}</span>`;
    }

    function emptyRow(colspan, msg = 'Ingen data') {
        return `<tr><td colspan="${colspan}" style="padding:1rem; color:var(--muted,#8899aa); text-align:center;">${msg}</td></tr>`;
    }

    function tableWrap(headHtml, bodyHtml) {
        return `<div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead style="color:var(--muted,#8899aa); border-bottom:1px solid #243251;">${headHtml}</thead>
            <tbody>${bodyHtml}</tbody>
        </table>
    </div>`;
    }

    function ticketTable(tickets) {
        const head = `<tr>
        <th style="padding:0.5rem; text-align:left;">ID</th>
        <th style="padding:0.5rem; text-align:left;">Titel</th>
        <th style="padding:0.5rem; text-align:left;">Status</th>
        <th style="padding:0.5rem; text-align:left;">Prioritet</th>
        <th style="padding:0.5rem; text-align:left;">Oprettet</th>
    </tr>`;
        if (!tickets.length) return tableWrap(head, emptyRow(5, 'Ingen sager'));
        const rows = tickets.map(t => `<tr style="border-bottom:1px solid #243251;">
        <td style="padding:0.5rem;">#${t.id}</td>
        <td style="padding:0.5rem;">${t.title ?? '—'}</td>
        <td style="padding:0.5rem;">${statusBadge(t.status?.name)}</td>
        <td style="padding:0.5rem;">${t.ticketPriority?.name ?? '—'}</td>
        <td style="padding:0.5rem;">${fmtDate(t.createdAt)}</td>
    </tr>`).join('');
        return tableWrap(head, rows);
    }

    function taskTable(tasks) {
        const head = `<tr>
        <th style="padding:0.5rem; text-align:left;">ID</th>
        <th style="padding:0.5rem; text-align:left;">Titel</th>
        <th style="padding:0.5rem; text-align:left;">Sag</th>
        <th style="padding:0.5rem; text-align:left;">Status</th>
        <th style="padding:0.5rem; text-align:left;">Frist</th>
    </tr>`;
        if (!tasks.length) return tableWrap(head, emptyRow(5, 'Ingen opgaver'));
        const rows = tasks.map(t => `<tr style="border-bottom:1px solid #243251;">
        <td style="padding:0.5rem;">#${t.id}</td>
        <td style="padding:0.5rem;">${t.title ?? '—'}</td>
        <td style="padding:0.5rem;">#${t.ticketId ?? '—'}</td>
        <td style="padding:0.5rem;">${statusBadge(t.status?.name)}</td>
        <td style="padding:0.5rem;">${fmtDate(t.dueDate)}</td>
    </tr>`).join('');
        return tableWrap(head, rows);
    }

    function commentsTable(comments) {
        const head = `<tr>
        <th style="padding:0.5rem; text-align:left;">Sag</th>
        <th style="padding:0.5rem; text-align:left;">Kommentar</th>
        <th style="padding:0.5rem; text-align:left;">Dato</th>
    </tr>`;
        if (!comments.length) return tableWrap(head, emptyRow(3, 'Ingen kommentarer'));
        const rows = comments.map(c => `<tr style="border-bottom:1px solid #243251;">
        <td style="padding:0.5rem;">#${c.ticketId}</td>
        <td style="padding:0.5rem; max-width:360px;">${c.commentText ?? '—'}</td>
        <td style="padding:0.5rem;">${fmtDate(c.createdAt)}</td>
    </tr>`).join('');
        return tableWrap(head, rows);
    }

    function notificationsTable(notifs) {
        const head = `<tr>
        <th style="padding:0.5rem; text-align:left;">Type</th>
        <th style="padding:0.5rem; text-align:left;">Besked</th>
        <th style="padding:0.5rem; text-align:left;">Sag</th>
        <th style="padding:0.5rem; text-align:left;">Status</th>
        <th style="padding:0.5rem; text-align:left;">Dato</th>
    </tr>`;
        if (!notifs.length) return tableWrap(head, emptyRow(5, 'Ingen notifikationer'));
        const rows = notifs.map(n => `<tr style="border-bottom:1px solid #243251;">
        <td style="padding:0.5rem;">${n.type ?? '—'}</td>
        <td style="padding:0.5rem; max-width:320px;">${n.message ?? '—'}</td>
        <td style="padding:0.5rem;">${n.ticketTitle ? `#${n.ticketId} ${n.ticketTitle}` : '—'}</td>
        <td style="padding:0.5rem;">
            <span style="font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:999px; font-weight:600;
                ${n.isRead
                ? 'background:#ffffff11; color:#8899aa; border:1px solid #ffffff22;'
                : 'background:#4a9eff22; color:#4a9eff; border:1px solid #4a9eff55;'}">
                ${n.isRead ? 'Læst' : 'Ulæst'}
            </span>
        </td>
        <td style="padding:0.5rem;">${fmtDate(n.createdAt)}</td>
    </tr>`).join('');
        return tableWrap(head, rows);
    }

    function historyTable(history) {
        const head = `<tr>
        <th style="padding:0.5rem; text-align:left;">Handling</th>
        <th style="padding:0.5rem; text-align:left;">Gammel værdi</th>
        <th style="padding:0.5rem; text-align:left;">Ny værdi</th>
        <th style="padding:0.5rem; text-align:left;">Sag</th>
        <th style="padding:0.5rem; text-align:left;">Dato</th>
    </tr>`;
        if (!history.length) return tableWrap(head, emptyRow(5, 'Ingen aktivitet'));
        const rows = history.map(h => `<tr style="border-bottom:1px solid #243251;">
        <td style="padding:0.5rem;">${h.actionType ?? '—'}</td>
        <td style="padding:0.5rem; color:var(--muted,#8899aa);">${h.oldValue ?? '—'}</td>
        <td style="padding:0.5rem;">${h.newValue ?? '—'}</td>
        <td style="padding:0.5rem;">#${h.ticketId}</td>
        <td style="padding:0.5rem;">${fmtDate(h.createdAt)}</td>
    </tr>`).join('');
        return tableWrap(head, rows);
    }

    function securitySection(user) {
        return `
        <div class="card" style="margin-bottom:1.5rem; border-top:3px solid #ff6b6b;">
            <div class="section-head">
                <div>
                    <h3 data-tooltip="profile-security">Sikkerhed</h3>
                    <div class="muted">Kun synlig for administratorer</div>
                </div>
                <button class="btn" data-tooltip="btn-clearTokens" onclick="clearUserTokens(${user.id})"
                    style="background:#ff6b6b; color:#fff;">
                    Ryd tokens
                </button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; padding:0.5rem 0;">
                ${secRow('RFID chip', `<span style="font-family:monospace;">${user.rfidChip ? '●●●●●●' : '—'}</span>`)}
                ${secRow('Reset token', user.passwordResetToken ? '●●●●●●●●' : 'Ingen aktiv')}
                ${secRow('Token udløb', fmtDate(user.passwordResetTokenExpiry))}
                ${secRow('OTP kode', user.passwordResetOtp ? '●●●●●●' : 'Ingen aktiv')}
                ${secRow('OTP udløb', fmtDate(user.passwordResetOtpExpiry))}
            </div>
        </div>`;
    }

    async function clearUserTokens(userId) {
        showConfirm('Ryd alle tokens for denne bruger?', async () => {
            const res = await fetch(`${apiBase}/api/users/${userId}/clear-tokens`, {
                method: 'PATCH'
            });
            if (res.ok) {
                showToast('Tokens er ryddet.', 'success');
                loadUserDetail(userId);  // reload profile to reflect changes
            } else {
                showToast('Fejl ved rydning af tokens.', 'error');
            }
        });
    }
    function secRow(label, value) {
        return `
        <div style="background:var(--panel,#111a2e); border-radius:8px; padding:0.75rem 1rem;">
            <div style="font-size:0.75rem; color:var(--muted,#8899aa); margin-bottom:0.25rem;">${label}</div>
            <div style="font-weight:600;">${value}</div>
        </div>`;
    }

    // Workload chart — pure CSS bars, no library needed
    function workloadChart(open, progress, resolved, closed) {
        const total = open + progress + resolved + closed;
        if (total === 0) return `<p style="color:var(--muted,#8899aa);padding:0.5rem;">Ingen tildelte sager.</p>`;

        const bar = (label, count, color) => {
            const pct = Math.round((count / total) * 100);
            return `
        <div style="margin-bottom:0.75rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;">
                <span>${label}</span><span style="color:${color};font-weight:600;">${count} (${pct}%)</span>
            </div>
            <div style="background:#243251;border-radius:999px;height:8px;">
                <div style="width:${pct}%;background:${color};border-radius:999px;height:8px;transition:width 0.4s;"></div>
            </div>
        </div>`;
        };

        return `<div style="padding:0.5rem 0;">
        ${bar('Open', open, '#4a9eff')}
        ${bar('In Progress', progress, '#ffb454')}
        ${bar('Resolved', resolved, '#95e06c')}
        ${bar('Closed', closed, '#ff6b6b')}
    </div>`;
    }

    // Toggle IsActive on UserProfile
    async function toggleUserActive(userId, profileId) {
        showConfirm('Ændre kontostatus for denne bruger?', async () => {
            const res = await fetch(`${apiBase}/api/userprofiles/byuser/${userId}/toggle-active`, {
                method: 'PATCH'
            });
            if (res.ok) {
                showToast('Kontostatus opdateret.', 'success');
                loadUserDetail(userId);
            } else {
                showToast('Fejl ved opdatering af status.', 'error');
            }
        });
    }

    //---------------Pdf ----------------
    //  Simplest approach for your setup is client-side PDF using the browser's print function — no library needed, no NuGet package, no backend changes.
    function exportUserPdf(user, profile, data, adminUser) {
        // ── Build checkbox dialog ──
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        overlay.innerHTML = `
        <div style="background:#1e2a3a;border-radius:12px;padding:2rem;width:420px;color:#fff;">
            <h3 style="margin:0 0 1rem;">Vælg sektioner til PDF</h3>
            ${[
                ['sec_header', 'Profil header', true],
                ['sec_stats', 'Statistik kort', true],
                ['sec_tickets', 'Sager', true],
                ['sec_tasks', 'Opgaver', true],
                ['sec_comments', 'Kommentarer', true],
                ['sec_notifs', 'Notifikationer', true],
                ['sec_history', 'Historik', true],
                ['sec_security', 'Sikkerhed (kun admin)', false],
            ].map(([id, label, checked]) => `
                <label style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;cursor:pointer;">
                    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:16px;height:16px;">
                    <span>${label}</span>
                </label>`).join('')}
            <div style="display:flex;gap:1rem;margin-top:1.5rem;justify-content:flex-end;">
                <button onclick="this.closest('div').parentElement.parentElement.remove()"
                    style="background:#243251;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                    Annuller
                </button>
                <button id="confirmPdfBtn"
                    style="background:#4a9eff;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                    Eksporter PDF
                </button>
            </div>
        </div>`;

        document.body.appendChild(overlay);

        document.getElementById('confirmPdfBtn').onclick = () => {
            const get = id => document.getElementById(id)?.checked;
            const sections = {
                header: get('sec_header'),
                stats: get('sec_stats'),
                tickets: get('sec_tickets'),
                tasks: get('sec_tasks'),
                comments: get('sec_comments'),
                notifs: get('sec_notifs'),
                history: get('sec_history'),
                security: get('sec_security') && isAdmin,
            };
            overlay.remove();
            setTimeout(() => generatePdf(user, adminUser, profile, data, sections), 100);
        };
    }

    function generatePdf(user, adminUser, profile, data, sections) {
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        const roleName = user.roleName || 'User';
        const permissionLevel = getPermissionLevel(user);
        const now = new Date().toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' });
        const printedBy = `Udskrevet af: ${adminUser.firstName} ${adminUser.lastName}`;
        const unread = data.notifications.filter(n => !n.isRead).length;

        const table = (headers, rows) => `
        <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="empty">Ingen data</td></tr>`}</tbody>
        </table>`;

        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Brugerprofil — ${fullName}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 2rem; }
        h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
        h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; border-bottom: 2px solid #4a9eff; padding-bottom: 0.25rem; color: #1a1a2e; }
        .meta { color: #555; font-size: 0.85rem; margin-bottom: 0.25rem; }
        .badge { display:inline-block; padding:0.15rem 0.5rem; border-radius:999px; font-size:0.75rem; font-weight:600; margin-left:0.5rem; }
        .badge-admin    { background:#ff6b6b22; color:#c0392b; border:1px solid #ff6b6b; }
        .badge-support  { background:#4a9eff22; color:#1a5fa8; border:1px solid #4a9eff; }
        .badge-user     { background:#cccccc33; color:#444;    border:1px solid #aaa; }
        .badge-active   { background:#95e06c22; color:#27ae60; border:1px solid #95e06c; }
        .badge-inactive { background:#ff6b6b22; color:#c0392b; border:1px solid #ff6b6b; }
        .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0.75rem; margin:0.75rem 0; }
        .stat  { border:1px solid #ddd; border-radius:6px; padding:0.5rem; text-align:center; }
        .stat-val { font-size:1.4rem; font-weight:700; color:#4a9eff; }
        .stat-lbl { font-size:0.7rem; color:#777; margin-top:0.15rem; }
        table { width:100%; border-collapse:collapse; margin-top:0.5rem; font-size:0.82rem; }
        th { background:#f0f4ff; text-align:left; padding:0.4rem 0.5rem; border:1px solid #ddd; }
        td { padding:0.35rem 0.5rem; border:1px solid #eee; }
        tr:nth-child(even) td { background:#fafafa; }
        .empty { color:#aaa; text-align:center; font-style:italic; }
        .footer { margin-top:2rem; font-size:0.75rem; color:#aaa; text-align:center; border-top:1px solid #eee; padding-top:0.75rem; }
        @media print { body { padding: 1rem; } }
    </style></head><body>`;

        // ── Header ──
        if (sections.header) {
            const statusBadge = profile
                ? `<span data-tooltip="profile-avatar" class="badge ${profile.isActive ? 'badge-active' : 'badge-inactive'}">${profile.isActive ? 'Aktiv' : 'Deaktiveret'}</span>`
                : '';
            const roleClass = `badge-${roleName.toLowerCase()}`;

            html += `
        <h1>${fullName} <span data-tooltip="profile-role" class="badge ${roleClass}">${roleName}</span>${statusBadge}</h1>
        <div class="meta">@${user.userName ?? '—'} &nbsp;|&nbsp; ${user.email ?? '—'} &nbsp;|&nbsp; ${user.phone ?? '—'}</div>
        <div class="meta" data-tooltip="profile-lastSeen">RFID: ${user.rfidChip ? '●●●●●●' : '—'} &nbsp;|&nbsp; Sidst set: ${profile?.lastLoginAt ? fmtDate(profile.lastLoginAt) : '—'}</div>
        <div class="meta" data-tooltip="" style="margin-top:0.25rem;">Rapport genereret: ${now}</div>`;
        }

        // ── Stats ──
        if (sections.stats) {
            html += `<h2>Statistik</h2>
        <div class="stats">
            <div class="stat"><div class="stat-val">${data.ticketsCreated.length}</div><div class="stat-lbl">Oprettede sager</div></div>
            <div class="stat"><div class="stat-val">${data.ticketsAssigned.length}</div><div class="stat-lbl">Tildelte sager</div></div>
            <div class="stat"><div class="stat-val">${data.tasksCreated.length}</div><div class="stat-lbl">Oprettede opgaver</div></div>
            <div class="stat"><div class="stat-val">${data.tasksAssigned.length}</div><div class="stat-lbl">Tildelte opgaver</div></div>
            <div class="stat"><div class="stat-val">${data.comments.length}</div><div class="stat-lbl">Kommentarer</div></div>
            <div class="stat"><div class="stat-val">${data.notifications.length}</div><div class="stat-lbl">Notifikationer</div></div>
            <div class="stat"><div class="stat-val">${unread}</div><div class="stat-lbl">Ulæste notif.</div></div>
            <div class="stat"><div class="stat-val">${data.history.length}</div><div class="stat-lbl">Historik</div></div>
        </div>`;
        }

        // ── Tickets ──
        if (sections.tickets) {
            const ticketRows = t => t.map(r => `<tr>
            <td>#${r.id}</td><td>${r.title ?? '—'}</td>
            <td>${r.status?.name ?? '—'}</td><td>${r.ticketPriority?.name ?? '—'}</td>
            <td>${fmtDate(r.createdAt)}</td></tr>`);
            html += `<h2 data-tooltip="profile-stat-created">Oprettede sager</h2>
        ${table(['ID', 'Titel', 'Status', 'Prioritet', 'Oprettet'], ticketRows(data.ticketsCreated))}
        <h2 data-tooltip="profile-stat-assigned">Tildelte sager</h2>
        ${table(['ID', 'Titel', 'Status', 'Prioritet', 'Oprettet'], ticketRows(data.ticketsAssigned))}`;
        }

        // ── Tasks ──
        if (sections.tasks) {
            const taskRows = t => t.map(r => `<tr>
            <td>#${r.id}</td><td>${r.title ?? '—'}</td>
            <td>#${r.ticketId ?? '—'}</td><td>${r.status?.name ?? '—'}</td>
            <td>${fmtDate(r.dueDate)}</td></tr>`);
            html += `<h2 data-tooltip="profile-stat-tasks-created">Oprettede opgaver</h2>
        ${table(['ID', 'Titel', 'Sag', 'Status', 'Frist'], taskRows(data.tasksCreated))}
        <h2 data-tooltip="profile-stat-tasks-assigned">Tildelte opgaver</h2>
        ${table(['ID', 'Titel', 'Sag', 'Status', 'Frist'], taskRows(data.tasksAssigned))}`;
        }

        // ── Comments ──
        if (sections.comments) {
            const rows = data.comments.map(c => `<tr>
            <td>#${c.ticketId}</td><td>${c.commentText ?? '—'}</td></tr>`);
            html += `<h2 data-tooltip="profile-stat-comments">Kommentarer</h2>${table(['Sag', 'Kommentar', 'Type', 'Dato'], rows)}`;
        }

        // ── Notifications ──
        if (sections.notifs) {
            const rows = data.notifications.map(n => `<tr>
            <td>${n.type ?? '—'}</td><td>${n.message ?? '—'}</td>
            <td>${n.isRead ? 'Læst' : 'Ulæst'}</td><td>${fmtDate(n.createdAt)}</td></tr>`);
            html += `<h2 data-tooltip="profile-stat-notifs">Notifikationer</h2>${table(['Type', 'Besked', 'Status', 'Dato'], rows)}`;
        }

        // ── History ──
        if (sections.history) {
            const rows = data.history.map(h => `<tr>
            <td>${h.actionType ?? '—'}</td><td>${h.oldValue ?? '—'}</td>
            <td>${h.newValue ?? '—'}</td><td>#${h.ticketId}</td>
            <td>${fmtDate(h.createdAt)}</td></tr>`);
            html += `<h2 data-tooltip="profile-stat-history">Aktivitetslog</h2>${table(['Handling', 'Gammel værdi', 'Ny værdi', 'Sag', 'Dato'], rows)}`;
        }

        // ── Security (Admin only) ──
        if (sections.security) {
            html += `<h2 data-tooltip="profile-security">Sikkerhed</h2>
        <table><tbody>
            <tr><td><strong>RFID chip</strong></td><td style="font-family:monospace;">${user.rfidChip ? '●●●●●●' : '—'}</td></tr>
            <tr><td><strong>Reset token</strong></td><td>${user.passwordResetToken ? '●●●●●●●●' : 'Ingen aktiv'}</td></tr>
            <tr><td><strong>Token udløb</strong></td><td>${fmtDate(user.passwordResetTokenExpiry)}</td></tr>
            <tr><td><strong>OTP kode</strong></td><td>${user.passwordResetOtp ? '●●●●●●' : 'Ingen aktiv'}</td></tr>
            <tr><td><strong>OTP udløb</strong></td><td>${fmtDate(user.passwordResetOtpExpiry)}</td></tr>
        </tbody></table>`;
        }

        html += `<div class="footer" style="display:flex;justify-content:space-between;">
        <span>NexDesk — Brugerprofil rapport for ${fullName} — ${now}</span>
        <span>${printedBy}</span>
    </div>`;

        // ── Open print window ──
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.onload = () => win.print();
    }
// ---------- TryggerAvarUpload -------------------
function triggerAvatarUpload(userId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // Max 2MB check
        if (file.size > 2 * 1024 * 1024) {
            showToast('Billedet må maks være 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result; // full data:image/...;base64,... string
            const res = await fetch(`${apiBase}/api/userprofiles/byuser/${userId}/update-picture`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePicture: base64 })
            });
            if (res.ok) {
                showToast('Profilbillede opdateret.', 'success');
                loadUserDetail(userId);
            } else {
                showToast('Fejl ved upload.', 'error');
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

async function deleteProfilePicture(userId) {
    showConfirm('Slet profilbillede?', async () => {
        const res = await fetch(`${apiBase}/api/userprofiles/byuser/${userId}/delete-picture`, {
            method: 'PATCH'
        });
        if (res.ok) {
            showToast('Profilbillede slettet.', 'info');
            loadUserDetail(userId);
        } else {
            showToast('Fejl ved sletning.', 'error');
        }
    });
}