function renderGlobalSearch(query) {
    const box = document.getElementById('globalSearchResults');
    if (!query || query.length < 2) { box.style.display = 'none'; return; }

    const q = query.toLowerCase();
    const tickets = (dashboardVm.tickets ?? []).filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    ).slice(0, 5);

    const users = (dashboardVm.users ?? []).filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    ).slice(0, 5);

    const comments = (dashboardVm.comments ?? []).filter(c =>
        c.commentText?.toLowerCase().includes(q)
    ).slice(0, 3);

    const history = (dashboardVm.history ?? []).filter(h =>
        h.actionType?.toLowerCase().includes(q) ||
        h.newValue?.toLowerCase().includes(q) ||
        h.oldValue?.toLowerCase().includes(q)
    ).slice(0, 3);

    const section = (title, items) => items.length ? `
        <div style="padding:0.5rem 1rem; font-size:0.75rem; color:#8899aa; 
                    border-bottom:1px solid #243251; font-weight:600;">
            ${title}
        </div>
        ${items}` : '';

    const ticketRows = tickets.map(t => `
        <div onclick="openTicketDetail(${t.id})" 
             style="padding:0.6rem 1rem; cursor:pointer; border-bottom:1px solid #1a2440;"
             onmouseover="this.style.background='#1a2440'" 
             onmouseout="this.style.background='transparent'">
            <div style="font-size:0.85rem; font-weight:600;">#${t.id} — ${t.title}</div>
            <div style="font-size:0.75rem; color:#8899aa;">${t.statusName ?? ''} · ${t.categoryName ?? ''}</div>
        </div>`).join('');

    const userRows = users.map(u => `
        <div onclick="openUserDetail(${u.id})"
             style="padding:0.6rem 1rem; cursor:pointer; border-bottom:1px solid #1a2440;"
             onmouseover="this.style.background='#1a2440'"
             onmouseout="this.style.background='transparent'">
            <div style="font-size:0.85rem; font-weight:600;">${u.firstName} ${u.lastName}</div>
            <div style="font-size:0.75rem; color:#8899aa;">${u.userName ?? ''} · ${u.email ?? ''}</div>
        </div>`).join('');

    const commentRows = comments.map(c => `
        <div onclick="openTicketDetail(${c.ticketId})"
             style="padding:0.6rem 1rem; cursor:pointer; border-bottom:1px solid #1a2440;"
             onmouseover="this.style.background='#1a2440'"
             onmouseout="this.style.background='transparent'">
            <div style="font-size:0.85rem;">${c.commentText?.substring(0, 80)}...</div>
            <div style="font-size:0.75rem; color:#8899aa;">Comment · Ticket #${c.ticketId}</div>
        </div>`).join('');

    const historyRows = history.map(h => `
        <div style="padding:0.6rem 1rem; border-bottom:1px solid #1a2440;">
            <div style="font-size:0.85rem;">${h.actionType} · ${h.newValue?.substring(0, 60)}</div>
            <div style="font-size:0.75rem; color:#8899aa;">History · Ticket #${h.ticketId}</div>
        </div>`).join('');

    const total = tickets.length + users.length + comments.length + history.length;

    if (total === 0) {
        box.innerHTML = `<div style="padding:1rem; color:#8899aa; text-align:center;">No results found.</div>`;
    } else {
        box.innerHTML =
            section('Tickets', ticketRows) +
            section('Users', userRows) +
            section('Comments', commentRows) +
            section('History', historyRows);
    }
    box.style.display = 'block';
}

// Close search when clicking outside
document.addEventListener('click', e => {
    if (!e.target.closest('#globalSearch') && !e.target.closest('#globalSearchResults')) {
        const box = document.getElementById('globalSearchResults');
        if (box) box.style.display = 'none';
    }
});


function openTicketDetail(ticketId) {
    document.getElementById('globalSearch').value = '';
    document.getElementById('globalSearchResults').style.display = 'none';
    document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    document.querySelector('.nav button[data-view="ticketDetail"]').classList.add('active');
    document.getElementById('ticketDetail').classList.add('active');
    document.getElementById('ticketDetailSelect').value = ticketId;
    renderTicketDetail();
}