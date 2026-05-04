function renderDashboard() {
    const visibleTickets = typeof getVisibleTickets === 'function'
        ? getVisibleTickets()
        : (dashboardVm.tickets ?? []);
    const visibleTasks = typeof getVisibleTasks === 'function'
        ? getVisibleTasks()
        : (dashboardVm.tasks ?? []);

    const openTickets = visibleTickets.filter(t => (t.statusName ?? '').toLowerCase().includes('open')).length;
    const inProgressTickets = visibleTickets.filter(t => {
        const status = (t.statusName ?? '').toLowerCase();
        return status.includes('progress') || status.includes('waiting');
    }).length;
    const resolvedTickets = visibleTickets.filter(t => (t.statusName ?? '').toLowerCase().includes('resolved')).length;
    const totalTickets = visibleTickets.length;

    document.getElementById('statOpen').textContent = isAdmin ? (dashboardVm.openTickets ?? 0) : openTickets;
    document.getElementById('statProgress').textContent = isAdmin ? (dashboardVm.inProgressTickets ?? 0) : inProgressTickets;
    document.getElementById('statResolved').textContent = isAdmin ? (dashboardVm.resolvedTickets ?? 0) : resolvedTickets;
    document.getElementById('statTasks').textContent = isAdmin ? (dashboardVm.totalTickets ?? 0) : totalTickets;

    // ── Recent Tickets ──
    const supporterRecentTickets = visibleTickets
        .slice()
        .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            title: t.title,
            categoryName: t.categoryName,
            departmentName: t.departmentName,
            assignedToName: t.assignedToName,
            statusName: t.statusName,
            priorityName: t.priorityName
        }));

    const recentTickets = isAdmin
        ? (dashboardVm.recentTickets ?? [])
        : supporterRecentTickets;
    document.getElementById('recentTickets').innerHTML = recentTickets.length
        ? recentTickets.map(t => `
            <div class="list-item">
                <h4>#${t.id} - ${t.title}</h4>
                <div class="meta">
                    <span>${t.categoryName ?? '-'}</span>
                    <span>${t.departmentName ?? '-'}</span>
                    <span>Assigned: ${t.assignedToName ?? 'Unassigned'}</span>
                </div>
                <div class="actions">
                    <span class="badge ${statusBadgeClass(t.statusName)}">${t.statusName ?? '-'}</span>
                    <span class="badge ${priorityBadgeClass(t.priorityName)}">${t.priorityName ?? '-'}</span>
                </div>
            </div>`).join('')
        : `<div class="list-item"><div class="tiny">No tickets found.</div></div>`;
    renderActivityFeed();
    // ── Quick Overview ──
    document.getElementById('quickOverview').innerHTML = `
        <div class="list-item" data-tooltip="overview-assignees">
            <h4>Supporters on active work</h4>
            <div class="tiny">${isAdmin ? (dashboardVm.activeAssignees ?? 0) : new Set(visibleTasks.map(t => Number(t.assignedUserId ?? t.assignedToUserId ?? 0)).filter(Boolean)).size} active assignees</div>
        </div>
        <div class="list-item" data-tooltip="overview-unassigned">
            <h4>Unassigned tickets</h4>
            <div class="tiny">${isAdmin ? (dashboardVm.unassignedTickets ?? 0) : visibleTickets.filter(t => !t.assignedToUserId).length} tickets without supporter</div>
        </div>
        <div class="list-item" data-tooltip="overview-overdue">
            <h4>Overdue tickets</h4>
            <div class="tiny">${isAdmin ? (dashboardVm.overdueTickets ?? 0) : visibleTickets.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length} overdue items</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;">
            <div style="background:var(--panel,#111a2e); border-radius:12px; padding:1rem;">
                <div style="font-size:0.8rem; color:var(--muted,#8899aa); margin-bottom:0.75rem; font-weight:600;">Ticket Status</div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    ${barRow('Open', isAdmin ? (dashboardVm.openTickets ?? 0) : openTickets, isAdmin ? (dashboardVm.totalTickets ?? 1) : (totalTickets || 1), '#4a9eff')}
                    ${barRow('In Progress', isAdmin ? (dashboardVm.inProgressTickets ?? 0) : inProgressTickets, isAdmin ? (dashboardVm.totalTickets ?? 1) : (totalTickets || 1), '#ffb454')}
                    ${barRow('Resolved', isAdmin ? (dashboardVm.resolvedTickets ?? 0) : resolvedTickets, isAdmin ? (dashboardVm.totalTickets ?? 1) : (totalTickets || 1), '#95e06c')}
                </div>
            </div>
            <div style="background:var(--panel,#111a2e); border-radius:12px; padding:1rem; display:flex; flex-direction:column; align-items:center;">
                <div style="font-size:0.8rem; color:var(--muted,#8899aa); margin-bottom:0.75rem; font-weight:600; align-self:flex-start;">Distribution</div>
                <svg viewBox="0 0 42 42" width="120" height="120" style="transform:rotate(-90deg);">
                    ${pieSlices(isAdmin ? (dashboardVm.openTickets ?? 0) : openTickets, isAdmin ? (dashboardVm.inProgressTickets ?? 0) : inProgressTickets, isAdmin ? (dashboardVm.resolvedTickets ?? 0) : resolvedTickets, isAdmin ? (dashboardVm.totalTickets ?? 0) : totalTickets)}
                </svg>
                <div style="display:flex; flex-direction:column; gap:0.3rem; margin-top:0.75rem; align-self:flex-start; font-size:0.75rem;">
                    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#4a9eff;margin-right:0.4rem;"></span>Open (${isAdmin ? (dashboardVm.openTickets ?? 0) : openTickets})</span>
                    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#ffb454;margin-right:0.4rem;"></span>In Progress (${isAdmin ? (dashboardVm.inProgressTickets ?? 0) : inProgressTickets})</span>
                    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#95e06c;margin-right:0.4rem;"></span>Resolved (${isAdmin ? (dashboardVm.resolvedTickets ?? 0) : resolvedTickets})</span>
                </div>
            </div>
        </div>
    `;
}

// ── Activity Feed ──
async function renderActivityFeed() {
    let history = [];
    try {
        const res = await fetch(`${apiBase}/api/history`);
        history = await res.json();
    } catch {
        history = dashboardVm.history ?? [];
    }

    if (!isAdmin && typeof getVisibleTickets === 'function') {
        const visibleTicketIds = new Set(getVisibleTickets().map(t => Number(t.id)));
        history = history.filter(h => visibleTicketIds.has(Number(h.ticketId)));
    }

    history = history
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 15);

    const iconMap = {
        'StatusChanged': { icon: '🔄', label: 'Status changed' },
        'Status Changed': { icon: '🔄', label: 'Status changed' },
        'CommentAdded': { icon: '💬', label: 'Comment added' },
        'Comment Added': { icon: '💬', label: 'Comment added' },
        'TaskCreated': { icon: '✅', label: 'Task created' },
        'Task Created': { icon: '✅', label: 'Task created' },
        'AssignmentChanged': { icon: '👤', label: 'Assigned' },
        'Assignee Changed': { icon: '👤', label: 'Assigned' },
        'Priority Changed': { icon: '⚡', label: 'Priority changed' },
        'Department Changed': { icon: '🏢', label: 'Department changed' },
        'Due Date Changed': { icon: '📅', label: 'Due date changed' },
    };

    function timeAgo(dateStr) {
        const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
        const diff = Math.floor((new Date() - date) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    document.getElementById('activityFeed').innerHTML = history.length
        ? history.map(h => {
            const { icon, label } = iconMap[h.actionType] ?? { icon: '📋', label: h.actionType };
            const change = h.oldValue && h.newValue
                ? `<span style="color:var(--muted,#8899aa);">${h.oldValue}</span> → <strong>${h.newValue}</strong>`
                : `<strong>${h.newValue ?? h.oldValue ?? ''}</strong>`;

            return `
                <div class="list-item" style="padding:0.6rem 0.8rem;">
                    <div style="display:flex; align-items:flex-start; gap:0.6rem;">
                        <span style="font-size:1rem; margin-top:2px;">${icon}</span>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:0.82rem; color:var(--text,#cdd6f4);">
                                <strong>${h.changedByUserName}</strong> · ${label} · Ticket #${h.ticketId}
                            </div>
                            <div style="font-size:0.78rem; margin-top:2px;">${change}</div>
                            <div style="font-size:0.72rem; color:var(--muted,#8899aa); margin-top:3px;">
                                ${timeAgo(h.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('')
        : `<div class="list-item"><div class="tiny">Ingen aktivitet endnu.</div></div>`;
}

setInterval(() => renderActivityFeed(), 5000);
// ----------------- Bar Graphs --------------------
function barRow(label, value, total, color) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return `
        <div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.2rem;">
                <span style="color:var(--muted,#8899aa);">${label}</span>
                <span style="color:${color}; font-weight:600;">${value} (${pct}%)</span>
            </div>
            <div style="background:#243251; border-radius:999px; height:7px;">
                <div style="width:${pct}%; background:${color}; border-radius:999px; height:7px; transition:width 0.5s;"></div>
            </div>
        </div>`;
}


// ----------------- Pie Chart ----------------------
function pieSlices(open, progress, resolved, total) {
    if (total === 0) return `<circle cx="21" cy="21" r="15.9" fill="none" stroke="#243251" stroke-width="10"/>`;
    const colors = ['#4a9eff', '#ffb454', '#95e06c'];
    const values = [open, progress, resolved];
    const circumference = 100;
    let offset = 0;
    const r = 15.9;
    const c = 2 * Math.PI * r;

    return values.map((val, i) => {
        const pct = (val / total) * circumference;
        const slice = `<circle cx="21" cy="21" r="${r}" fill="none"
            stroke="${colors[i]}" stroke-width="10"
            stroke-dasharray="${(pct / 100) * c} ${c}"
            stroke-dashoffset="${-offset * c / 100}"
            style="transition: stroke-dasharray 0.5s;"/>`;
        offset += pct;
        return slice;
    }).join('');
}