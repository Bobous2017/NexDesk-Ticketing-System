//-------------------- Initial render  tickets section includes ÚI ---------------------------------
function renderTickets() {
    const q = document.getElementById('ticketSearch').value.toLowerCase();
    const status = document.getElementById('ticketStatusFilter').value;
    const dep = document.getElementById('ticketDepartmentFilter').value;
    const user = document.getElementById('ticketUserFilter').value;

    const filteredByRole = typeof getVisibleTickets === 'function'
        ? getVisibleTickets()
        : (dashboardVm.tickets ?? []).filter(t => Number(t?.isActive ?? 1) === 1);

    const items = filteredByRole.filter(t => {
        const matchQ = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.assignedToName && t.assignedToName.toLowerCase().includes(q));
        const matchS = !status || String(t.statusId) === status;
        const matchD = !dep || String(t.ticketDepartmentId) === dep;
        const matchU = !user || String(t.assignedToUserId) === user;
        return matchQ && matchS && matchD && matchU;
    });
    // isAdmin is already global from Index.cshtml — no @ needed ✅
    const tableBody = document.getElementById('ticketTableBody');
    const mobileList = document.getElementById('ticketMobileList');

    if (tableBody) {
        tableBody.innerHTML = items.map(t => `
        <tr>
          <td>#${t.id}</td>
          <td><strong>${t.title}</strong><br><span class="tiny">${t.description}</span><br>${renderDueCountdown(t.dueDate)}</td>
          <td>${t.categoryName ?? '-'}</td>
          <td><span class="badge ${priorityBadgeClass(t.priorityName)}">${t.priorityName ?? '-'}</span></td>
          <td><span class="badge ${statusBadgeClass(t.statusName)}">${t.statusName ?? '-'}</span></td>
          <td>${t.departmentName ?? '-'}</td>
          <td>${t.assignedToName ?? 'Unassigned'}</td>
          <td class="actions">

            
            <button class="btn" onclick="openTicketDetail(${t.id})" data-tooltip="btn-viewTicket">View</button>
            ${!isAdmin && (t.statusName ?? '').toLowerCase() === 'closed' ? '' : `<button class="btn warn" onclick="openEditTicket(${t.id})" data-tooltip="btn-editTicket">Edit</button>`}
            ${isAdmin ? `<button class="btn" style="background:#dc2626;" onclick="deleteTicket(${t.id})" data-tooltip="btn-deleteTicket">Delete</button>` : ''}
          </td>
        </tr>
    `).join('');
    }

    if (mobileList) {
        mobileList.innerHTML = items.map(t => `
        <div class="ticket-mobile-card">
            <div class="ticket-card-id">#${t.id}</div>
            <h3 class="ticket-card-title">${t.title}</h3>
            ${t.description ? `<p class="ticket-card-desc">${t.description}</p>` : ''}
            <div class="ticket-card-due">${renderDueCountdown(t.dueDate)}</div>

            <div class="ticket-card-meta-row">
                <div class="meta-section">
                    <span class="meta-label">${t.categoryName ?? '-'}</span>
                </div>
                <div class="meta-badges">
                    <span class="badge ${priorityBadgeClass(t.priorityName)}">${t.priorityName ?? '-'}</span>
                    <span class="badge ${statusBadgeClass(t.statusName)}">${t.statusName ?? '-'}</span>
                </div>
            </div>

            <div class="ticket-card-meta-row">
                <div class="meta-section">
                    <span class="meta-label">${t.departmentName ?? '-'}</span>
                </div>
                <div class="meta-section">
                    <span class="meta-value">${t.assignedToName ?? 'Unassigned'}</span>
                </div>
            </div>

            <div class="ticket-card-actions">
                <button class="btn btn-mobile-block" onclick="openTicketDetail(${t.id})" data-tooltip="btn-viewTicket">View</button>
                <button class="btn btn-mobile-block warn" onclick="openEditTicket(${t.id})" data-tooltip="btn-editTicket">Edit</button>
                ${isAdmin ? `<button class="btn btn-mobile-block" style="background:#dc2626;" onclick="deleteTicket(${t.id})" data-tooltip="btn-deleteTicket">Delete</button>` : ''}
            </div>
        </div>
    `).join('');
    }
    
}

// Ticket due date countdown — "2 days left" or "overdue by 3 days" on each ticket row
function renderDueCountdown(dueDate) {
    if (!dueDate) return '';
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
        return `<span style="color:#ff6b6b; font-size:0.72rem; font-weight:600;">⚠ Overdue by ${Math.abs(diffDays)} day(s)</span>`;
    if (diffDays === 0)
        return `<span style="color:#ffb454; font-size:0.72rem; font-weight:600;">⚠ Expires today</span>`;
    if (diffDays <= 3)
        return `<span style="color:#ffb454; font-size:0.72rem; font-weight:600;">⏰ ${diffDays} day(s) left</span>`;
    return `<span style="color:#8899aa; font-size:0.72rem;">${diffDays} days left</span>`;
}

// Supporter workload Overview
function renderWorkload() {
    const tickets = dashboardVm.tickets ?? [];
    const users = dashboardVm.users ?? [];
    const tasks = dashboardVm.tasks ?? [];
    // Only supporters and admins
    const supporters = users.filter(u => u.roleName === 'Support' || u.permissionLevel <= 2);

    const userData = users
        .map(u => {
            const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName;
            const assigned = tickets.filter(t => t.assignedToUserId === u.id);
            const open = assigned.filter(t => t.statusName?.toLowerCase().includes('open')).length;
            const inProgress = assigned.filter(t => t.statusName?.toLowerCase().includes('progress') || t.statusName?.toLowerCase().includes('waiting')).length;
            const resolved = assigned.filter(t => t.statusName?.toLowerCase().includes('resolved')).length;
            const closed = assigned.filter(t => t.statusName?.toLowerCase().includes('closed')).length;
            const total = assigned.length;
            const totalTasks = tasks.filter(t => t.assignedUserId === u.id).length;
            return { u, fullName, open, inProgress, resolved, closed, total, totalTasks };
        })
        .sort((a, b) => b.total - a.total); // sort by total descending

    const rows = userData
        .map(({ u, fullName, open, inProgress, resolved, closed, total, totalTasks }) => `
        <tr style="border-bottom:1px solid #243251;">
            <td style="padding:0.75rem 0.5rem;">
                <span style="cursor:pointer;color:#4a9eff;" onclick="openUserDetail(${u.id})">${fullName}</span>
            </td>
            <td style="padding:0.75rem 0.5rem;"><span style="color:#4a9eff;font-weight:600;">${total === 0 ? '-' : open}</span></td>
            <td style="padding:0.75rem 0.5rem;"><span style="color:#ffb454;font-weight:600;">${total === 0 ? '-' : inProgress}</span></td>
            <td style="padding:0.75rem 0.5rem;"><span style="color:#95e06c;font-weight:600;">${total === 0 ? '-' : resolved}</span></td>
            <td style="padding:0.75rem 0.5rem;"><span style="color:#ff6b6b;font-weight:600;">${total === 0 ? '-' : closed}</span></td>
            <td style="padding:0.75rem 0.5rem;font-weight:700;">${total === 0 ? '-' : total}</td>
            <td style="padding:0.75rem 0.5rem;font-weight:700;">${totalTasks === 0 ? '-' : totalTasks}</td>
        </tr>`
        ).join('');

    const cards = userData
        .map(({ u, fullName, open, inProgress, resolved, closed, total, totalTasks }) => `
        <div style="background:#0f1419;border:1px solid #243251;border-radius:8px;padding:1rem;margin-bottom:1rem;">
            <div style="font-weight:600;color:#4a9eff;margin-bottom:0.75rem;cursor:pointer;" onclick="openUserDetail(${u.id})">${fullName}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.9rem;">
                <div><span style="color:#9fb0d0;">Open:</span> <span style="color:#4a9eff;font-weight:600;">${total === 0 ? '-' : open}</span></div>
                <div><span style="color:#9fb0d0;">In Progress:</span> <span style="color:#ffb454;font-weight:600;">${total === 0 ? '-' : inProgress}</span></div>
                <div><span style="color:#9fb0d0;">Resolved:</span> <span style="color:#95e06c;font-weight:600;">${total === 0 ? '-' : resolved}</span></div>
                <div><span style="color:#9fb0d0;">Closed:</span> <span style="color:#ff6b6b;font-weight:600;">${total === 0 ? '-' : closed}</span></div>
                <div><span style="color:#9fb0d0;">Total Tickets:</span> <span style="font-weight:700;">${total === 0 ? '-' : total}</span></div>
                <div><span style="color:#9fb0d0;">Total Tasks:</span> <span style="font-weight:700;">${totalTasks === 0 ? '-' : totalTasks}</span></div>
            </div>
        </div>`
        ).join('');

    const workloadContent = document.getElementById('workloadContent');

    // Render table for desktop, cards for mobile
    const tableHtml = `
        <div class="workload-table-container">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="color:#9fb0d0;font-size:0.85rem;border-bottom:1px solid #243251;">
                        <th style="text-align:left;padding:0.5rem;">Name</th>
                        <th style="text-align:left;padding:0.5rem;">Open</th>
                        <th style="text-align:left;padding:0.5rem;">In Progress</th>
                        <th style="text-align:left;padding:0.5rem;">Resolved</th>
                        <th style="text-align:left;padding:0.5rem;">Closed</th>
                        <th style="text-align:left;padding:0.5rem;">Total Tickets</th>
                        <th style="text-align:left;padding:0.5rem;">Total Tasks</th>
                    </tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="7" style="padding:1rem;color:#8899aa;text-align:center;">No data</td></tr>'}</tbody>
            </table>
        </div>`;

    const cardsHtml = `
        <div class="workload-cards-container" style="display:none;">
            ${cards || '<div style="padding:1rem;color:#8899aa;text-align:center;">No data</div>'}
        </div>`;

    workloadContent.innerHTML = tableHtml + cardsHtml;

    // Add responsive behavior
    const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        const tableContainer = workloadContent.querySelector('.workload-table-container');
        const cardsContainer = workloadContent.querySelector('.workload-cards-container');

        if (isMobile) {
            tableContainer.style.display = 'none';
            cardsContainer.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            cardsContainer.style.display = 'none';
        }
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
}