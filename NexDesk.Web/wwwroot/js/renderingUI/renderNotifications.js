// Two variables to track notifications numner
let prevUnreadCount = 0;
let currentUnreadCount = 0;
let displayPrevCount = 0;


function renderNotifications() {
    const items = dashboardVm.notifications ?? [];

    // Track unread count properly
    currentUnreadCount = items.filter(n => !n.isRead).length;

    const badge = document.getElementById('notifBadge');
    if (currentUnreadCount > 0) {
        // Show prev count if it's different and greater than 0
        if (displayPrevCount > 0 && displayPrevCount !== currentUnreadCount) {
            badge.innerHTML = `<span style="opacity:0.6; text-decoration:line-through; font-size:0.85em; margin-right:3px; color:#ffcccc;">${displayPrevCount}</span>${currentUnreadCount}`;
        } else {
            badge.textContent = currentUnreadCount;
        }
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    document.getElementById('notificationList').innerHTML = items.length
        ? items.map(n => `
            <div class="list-item" style="opacity:${n.isRead ? '0.5' : '1'}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0;">${n.type}</h4>
                    ${!n.isRead ? `
                        <button onclick="markAsRead(${n.id})" data-tooltip="btn-markRead"
                            style="background:#5aa0ff; color:#fff; border:none; padding:0.3rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                            Mark as read
                        </button>` : '<span style="color:#4fd18b; font-size:0.8rem;">✓ Read</span>'
            }
                </div>
                <div class="meta">
                    <span>User: ${n.userName ?? 'Unknown'}</span>
                    <span>Ticket #${n.ticketId ?? '-'}</span>
                </div>
                <p>${n.message}</p>
            </div>
        `).join('')
        : `<div class="list-item"><div class="tiny">No notifications found.</div></div>`;
}

async function refreshNotifications() {
    const res = await fetch(`${apiBase}/api/notifications`);
    if (!res.ok) return;

    prevUnreadCount = currentUnreadCount;
    dashboardVm.notifications = await res.json();
    renderNotifications();

    console.log("⬅️ prev:", prevUnreadCount, "➡️ current:", currentUnreadCount);

    if (currentUnreadCount > prevUnreadCount) {
        displayPrevCount = prevUnreadCount;

        console.log(" NEW notification — refreshing data");

        // Fetch all lookup data in parallel
        const [ticketsRes, statusRes, priorityRes, categoryRes, deptRes, usersRes] = await Promise.all([
            fetch(`${apiBase}${api.tickets}`),
            fetch(`${apiBase}${api.ticketStatuses}`),
            fetch(`${apiBase}${api.ticketPriorities}`),
            fetch(`${apiBase}${api.ticketCategories}`),
            fetch(`${apiBase}${api.ticketDepartments}`),
            fetch(`${apiBase}${api.users}`)
        ]);

        // Update lookup data first
        if (statusRes.ok) dashboardVm.ticketStatuses = await statusRes.json();
        if (priorityRes.ok) dashboardVm.priorities = await priorityRes.json();
        if (categoryRes.ok) dashboardVm.categories = await categoryRes.json();
        if (deptRes.ok) dashboardVm.ticketDepartments = await deptRes.json();
        if (usersRes.ok) dashboardVm.users = await usersRes.json();

        //  Map names onto tickets AFTER lookups are ready
        if (ticketsRes.ok) {
            const freshTickets = await ticketsRes.json();
            dashboardVm.tickets = freshTickets.map(t => ({
                ...t,
                categoryName: dashboardVm.categories?.find(c => c.id === t.ticketCategoryId)?.name ?? '-',
                priorityName: dashboardVm.priorities?.find(p => p.id === t.ticketPriorityId)?.name ?? '-',
                statusName: dashboardVm.ticketStatuses?.find(s => s.id === t.statusId)?.name ?? '-',
                departmentName: dashboardVm.ticketDepartments?.find(d => d.id === t.ticketDepartmentId)?.name ?? '-',
                assignedToName: dashboardVm.users?.find(u => u.id === t.assignedToUserId)
                    ? `${dashboardVm.users.find(u => u.id === t.assignedToUserId).firstName} ${dashboardVm.users.find(u => u.id === t.assignedToUserId).lastName}`.trim()
                    : 'Unassigned'
            }));
            console.log(" Tickets mapped with names");
        }

        renderTickets(); // Render Ticket Panel
        populateFormSelects(); // updates ticket detail dropdown with new ticket
        renderTicketDetail(); // re-renders ticket detail view

        // Refresh reports in real time
        const reportsRes = await fetch(`${apiBase}${api.reports}`);
        if (reportsRes.ok) {
            dashboardVm.reports = await reportsRes.json();
            renderQrList();
            console.log("Reports refreshed");
        }
        console.log(" Tickets rendered — isAdmin:", isAdmin);

        // Refresh dashboard stats
        const dashRes = await fetch(`${apiBase}/api/dashboard`);
        if (dashRes.ok) {
            const freshDash = await dashRes.json();
            dashboardVm.openTickets = freshDash.openTickets;
            dashboardVm.inProgressTickets = freshDash.inProgressTickets;
            dashboardVm.resolvedTickets = freshDash.resolvedTickets;
            dashboardVm.totalTickets = freshDash.totalTickets;
            dashboardVm.activeAssignees = freshDash.activeAssignees;
            dashboardVm.unassignedTickets = freshDash.unassignedTickets;
            dashboardVm.overdueTickets = freshDash.overdueTickets;
            dashboardVm.recentTickets = freshDash.recentTickets;
            renderDashboard(); 
           
            console.log(" Dashboard rendered");
        }
    }
}

// Mark single notification as read
async function markAsRead(id) {
    const res = await fetch(`${apiBase}/api/notifications/${id}/mark-as-read`, { method: 'PATCH' });
    if (res.ok) {
        const n = dashboardVm.notifications.find(x => x.id === id);
        if (n) n.isRead = true;
        await refreshNotifications();
        showToast('Marked as read.', 'success');
    }
}

async function markAllAsRead(userId) {
    const res = await fetch(`${apiBase}/api/notifications/mark-all-as-read/${userId}`, {
        method: 'PATCH'
    });
    if (res.ok) {
        dashboardVm.notifications
            .filter(n => n.userId === userId)
            .forEach(n => n.isRead = true);
        await refreshNotifications();
        showToast('All marked as read.', 'success');
    }
}

window.addEventListener('load', () => {
    refreshNotifications();
    setInterval(() => refreshNotifications(), 5000);
});