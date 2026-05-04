// ===== Tabs =====
const TicketDetailTab = {
    TicketThread: 'ticket-thread',
    Tasks: 'tasks'
};

// ===== State =====
let ticketDetailSelectedTab = TicketDetailTab.TicketThread;
let ticketDetailTasksCache = [];
let ticketDetailEditingTaskId = null;

// Draft attachments per ticket: store actual File objects
const commentAttachmentDrafts = {}; // { [ticketId]: File[] }
// Object URLs per ticket (avoid cross-ticket collisions)
const commentAttachmentObjectUrlsByTicket = {}; // { [ticketId]: { [fileName]: objectUrl } }
// Backward-compatible global map (if other code still reads it)
const commentAttachmentObjectUrls = {}; // { [fileName]: objectUrl }

// Per-session priority overrides for quick display sync
const taskPriorityOverrides = {}; // { [taskId]: priorityId }
const ticketAutoSaveTimers = {}; // { [ticketId]: timeoutId }


// ============================================================================
// Rendering
// ============================================================================
// Fetch all attachments for a ticket from API
async function loadTicketAttachmentsAsync(ticketId) {
    try {
        const res = await fetch(`${apiBase}/api/attachments/ticket/${ticketId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}
async function renderTicketDetail() {
    const ticketId = Number(document.getElementById('ticketDetailSelect')?.value || 1);
    const sourceTickets = dashboardVm.tickets ?? [];
    const ticket = sourceTickets.find(x => x.id === ticketId);

    

    if (!ticket) {
        const box = document.getElementById('ticketDetailBox');
        if (box) box.innerHTML = `<div class="tiny">No ticket found.</div>`;
        return;
    }

    const comments = (dashboardVm.comments ?? []).filter(x => x.ticketId === ticketId);
    const historyItems = (dashboardVm.history ?? []).filter(x => x.ticketId === ticketId);
    const reports = (dashboardVm.reports ?? []).filter(x => x.ticketId === ticketId);
    const tasks = await loadTasksForTicketDetailAsync(ticketId);
    const ticketAttachments = await loadTicketAttachmentsAsync(ticketId);  
    ticketDetailTasksCache = tasks;

    const threadCount = comments.length;
    const taskCount = tasks.length;

    const box = document.getElementById('ticketDetailBox');
    if (!box) return;

    //  Closed state — supporters cannot edit
    const isClosed = (ticket.statusName ?? '').toLowerCase() === 'closed';
    const disabledAttr = !isAdmin && isClosed ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';
    const disabledSelect = !isAdmin && isClosed ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';

    box.innerHTML = `
         ${renderTicketTimeline(ticket.statusName)}
         ${renderTicketDueCountdown(ticket.dueDate)}
        <div class="info-grid ticket-detail-fields">
          <div class="info-chip ticket-field ticket-field-title">
            <label class="ticket-field-label" for="ticketTitleInput-${ticket.id}">Title</label>
            <input id="ticketTitleInput-${ticket.id}" 
                   class="ticket-field-input ticket-field-value ticket-title-input"
                   value="${escapeHtml(ticket.title ?? '')}"
                   ${disabledAttr} />
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketAssignedSelect-${ticket.id}">Assigned</label>
            <div class="ticket-field-control ticket-field-select-wrap">
                <select id="ticketAssignedSelect-${ticket.id}" class="ticket-field-select ticket-field-value" ${disabledSelect}>
                    ${renderTicketAssigneeOptions(ticket.assignedToUserId)}
                </select>
            </div>
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketStatusSelect-${ticket.id}">Status</label>
            <div class="ticket-field-control ticket-field-select-wrap">
                <select id="ticketStatusSelect-${ticket.id}"
                        class="ticket-pill-select ticket-field-select ticket-field-value badge ${statusBadgeClass(ticket.statusName)}"
                        aria-label="Status" ${disabledSelect}>
                    ${renderTicketStatusOptions(ticket.statusId)}
                </select>
            </div>
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketPrioritySelect-${ticket.id}">Priority</label>
            <div class="ticket-field-control ticket-field-select-wrap">
                <select id="ticketPrioritySelect-${ticket.id}"
                        class="ticket-pill-select ticket-field-select ticket-field-value badge ${priorityBadgeClass(ticket.priorityName)}"
                        aria-label="Priority" ${disabledSelect}>
                    ${renderTaskPriorityOptions(ticket.ticketPriorityId)}
                </select>
            </div>
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketDepartmentSelect-${ticket.id}">Department</label>
            <div class="ticket-field-control ticket-field-select-wrap">
                <select id="ticketDepartmentSelect-${ticket.id}" class="ticket-field-select ticket-field-value" ${disabledSelect}>
                    ${renderTicketDepartmentOptions(ticket.ticketDepartmentId)}
                </select>
            </div>
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketCategorySelect-${ticket.id}">Category</label>
            <div class="ticket-field-control ticket-field-select-wrap">
                <select id="ticketCategorySelect-${ticket.id}" class="ticket-field-select ticket-field-value" ${disabledSelect}>
                    ${renderTicketCategoryOptions(ticket.ticketCategoryId)}
                </select>
            </div>
          </div>

          <div class="info-chip ticket-field">
            <label class="ticket-field-label" for="ticketDueDateInput-${ticket.id}">Due Date</label>
            <div class="ticket-field-control ticket-field-date-wrap">
              <input id="ticketDueDateInput-${ticket.id}"
                     class="ticket-field-date ticket-field-value"
                     type="date"
                     value="${formatDateForInput(ticket.dueDate)}"
                     ${disabledAttr} />
            </div>                      
          </div>
          <div class="info-chip ticket-field">
            <label class="ticket-field-label">Created At</label>
            <div class="ticket-field-value" style="padding:0.4rem 0; font-size:0.9rem;">
                ${ticket.createdAt
                            ? new Date(ticket.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString('da-DK', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                                timeZone: 'Europe/Copenhagen'
                            })
                            : '-'}
            </div>
        </div>
        </div>

        <div class="divider"></div>

        <div>
          <h4>Description</h4>
          <div id="ticketDescriptionInput-${ticket.id}"
               contenteditable="${!isAdmin && isClosed ? 'false' : 'true'}"
               style="white-space:pre-wrap; min-height:28px; color:inherit; outline:none; border:1px solid transparent; border-radius:6px; ${!isAdmin && isClosed ? 'opacity:0.5;cursor:not-allowed;' : ''}">${escapeHtml(ticket.description ?? '')}</div>
        </div>
        
        <div class="ticket-detail-tabs">
            <button type="button"
                    class="ticket-detail-tab ${ticketDetailSelectedTab === TicketDetailTab.TicketThread ? 'active' : ''}"
                    onclick="setTicketDetailTab('${TicketDetailTab.TicketThread}')">
                Ticket Thread (${threadCount})
            </button>
            <button type="button"
                    class="ticket-detail-tab ${ticketDetailSelectedTab === TicketDetailTab.Tasks ? 'active' : ''}"
                    onclick="setTicketDetailTab('${TicketDetailTab.Tasks}')">
                Tasks (${taskCount})
            </button>
        </div>

        ${ticketDetailSelectedTab === TicketDetailTab.TicketThread
        ? renderTicketThreadTabContent(ticket, comments, historyItems, reports, ticketAttachments)
            : renderTasksTabContent(ticket, tasks, isClosed)
        }
    `;

    await renderTicketDetailSidePanel(ticket);

    if (ticketDetailSelectedTab === TicketDetailTab.TicketThread) {
        initCommentComposer(ticket.id);
    }

    // Only bind autosave if ticket is not closed (or user is admin)
    if (isAdmin || !isClosed) {
        initTicketDetailAutoSave(ticket.id);
    }
}
async function saveTicketDetailChanges(ticketId) {
    const ticket = (dashboardVm.tickets ?? []).find(x => Number(x.id) === Number(ticketId));
    if (!ticket) {
        showToast('Ticket not found.', 'error');
        return;
    }

    const selectedStatusId = normalizeNullableId(document.getElementById(`ticketStatusSelect-${ticketId}`)?.value)
        ?? normalizeNullableId(ticket.statusId);
    const selectedPriorityId = normalizeNullableId(document.getElementById(`ticketPrioritySelect-${ticketId}`)?.value)
        ?? normalizeNullableId(ticket.ticketPriorityId);
    const selectedDepartmentId = normalizeNullableId(document.getElementById(`ticketDepartmentSelect-${ticketId}`)?.value)
        ?? normalizeNullableId(ticket.ticketDepartmentId);
    const selectedCategoryId = normalizeNullableId(document.getElementById(`ticketCategorySelect-${ticketId}`)?.value)
        ?? normalizeNullableId(ticket.ticketCategoryId);
    const selectedAssignedUserId = normalizeNullableId(document.getElementById(`ticketAssignedSelect-${ticketId}`)?.value);
    const selectedDueDate = (document.getElementById(`ticketDueDateInput-${ticketId}`)?.value ?? '').trim() || null;
    const selectedTitle = (document.getElementById(`ticketTitleInput-${ticketId}`)?.value ?? '').trim();
    const selectedDescription = (document.getElementById(`ticketDescriptionInput-${ticketId}`)?.innerText ?? '').trim();

    const oldStatusName = ticket.statusName ?? '-';
    const oldPriorityName = ticket.priorityName ?? '-';
    const oldDepartmentName = ticket.departmentName ?? '-';
    const oldCategoryName = ticket.categoryName ?? '-';
    const oldAssignedName = ticket.assignedToName ?? 'Unassigned';
    const oldDueDate = formatDateForInput(ticket.dueDate) || '-';
    const oldTitle = (ticket.title ?? '').trim();
    const oldDescription = (ticket.description ?? '').trim();

    const selectedStatus = (dashboardVm.ticketStatuses ?? []).find(x => Number(x.id) === selectedStatusId);
    const selectedPriority = (dashboardVm.ticketPriorities ?? []).find(x => Number(x.id) === selectedPriorityId);
    const selectedDepartment = (dashboardVm.ticketDepartments ?? []).find(x => Number(x.id) === selectedDepartmentId);
    const selectedCategory = (dashboardVm.ticketCategories ?? []).find(x => Number(x.id) === selectedCategoryId);
    const selectedAssignedName = selectedAssignedUserId ? getUserDisplayNameById(selectedAssignedUserId) : 'Unassigned';

    const newStatusName = selectedStatus?.name ?? oldStatusName;
    const newPriorityName = selectedPriority?.name ?? oldPriorityName;
    const newDepartmentName = selectedDepartment?.name ?? oldDepartmentName;
    const newCategoryName = selectedCategory?.name ?? oldCategoryName;
    const newDueDate = selectedDueDate || '-';

    const hasChanges =
        selectedStatusId !== normalizeNullableId(ticket.statusId)
        || selectedPriorityId !== normalizeNullableId(ticket.ticketPriorityId)
        || selectedDepartmentId !== normalizeNullableId(ticket.ticketDepartmentId)
        || selectedCategoryId !== normalizeNullableId(ticket.ticketCategoryId)
        || selectedAssignedUserId !== normalizeNullableId(ticket.assignedToUserId)
        || (selectedDueDate || '') !== (formatDateForInput(ticket.dueDate) || '')
        || selectedTitle !== (ticket.title ?? '').trim()
        || selectedDescription !== (ticket.description ?? '').trim();

    if (!hasChanges) {
        return;
    }

    if (!selectedStatusId || !selectedPriorityId) {
        showToast('Status and priority are required.', 'error');
        return;
    }

    const payload = {
        id: ticket.id,
        createdByUserId: normalizeNullableId(ticket.createdByUserId) ?? normalizeNullableId(loggedInUserId),
        assignedToUserId: selectedAssignedUserId,
        ticketCategoryId: selectedCategoryId,
        ticketPriorityId: selectedPriorityId,
        statusId: selectedStatusId,
        ticketDepartmentId: selectedDepartmentId,
        title: selectedTitle,
        description: selectedDescription,
        dueDate: selectedDueDate || null,
        closedAt: ticket.closedAt ?? null
    };

    if (!payload.createdByUserId || !payload.ticketCategoryId || !payload.ticketDepartmentId || !payload.title) {
        showToast('Ticket data is incomplete for update.', 'error');
        return;
    }

    const assigneeChanged = selectedAssignedUserId &&
        selectedAssignedUserId !== normalizeNullableId(ticket.assignedToUserId);

    async function doSave(sendEmail) {
        const res = await fetch(`${apiBase}/api/tickets/${ticketId}?sendEmail=${sendEmail}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res;
    }

    let res;
    if (assigneeChanged) {
        await new Promise(resolve => {
            showConfirm('Vil du sende en e-mail til supporteren?', async () => {
                res = await doSave(true);
                resolve();
            });
            document.querySelector('#genericConfirmOverlay .btn').onclick = async () => {
                document.getElementById('genericConfirmOverlay').style.display = 'none';
                res = await doSave(false);
                resolve();
            };
        });
    } else {
        res = await doSave(false);
    }

    if (!res.ok) {
        const errorText = await res.text();
        showToast(`Failed to update ticket. ${errorText || ''}`.trim(), 'error');
        return;
    }

    ticket.statusId = selectedStatusId;
    ticket.ticketPriorityId = selectedPriorityId;
    ticket.ticketDepartmentId = selectedDepartmentId;
    ticket.ticketCategoryId = selectedCategoryId;
    ticket.assignedToUserId = selectedAssignedUserId;
    ticket.title = selectedTitle;
    ticket.description = selectedDescription;
    ticket.dueDate = payload.dueDate;

    ticket.statusName = newStatusName;
    ticket.priorityName = newPriorityName;
    ticket.departmentName = newDepartmentName;
    ticket.categoryName = newCategoryName;

    if (selectedAssignedUserId) {
        ticket.assignedToName = selectedAssignedName;
    } else {
        ticket.assignedToName = 'Unassigned';
    }

    const history = dashboardVm.history ?? (dashboardVm.history = []);
    const changedByUserId = normalizeNullableId(loggedInUserId)
        ?? normalizeNullableId(ticket.createdByUserId)
        ?? normalizeNullableId(selectedAssignedUserId);

    const pendingHistoryEntries = [];

    if (oldStatusName !== newStatusName) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Status Changed',
            oldValue: oldStatusName,
            newValue: newStatusName
        });
    }

    if (oldPriorityName !== newPriorityName) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Priority Changed',
            oldValue: oldPriorityName,
            newValue: newPriorityName
        });
    }

    if (oldDepartmentName !== newDepartmentName) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Department Changed',
            oldValue: oldDepartmentName,
            newValue: newDepartmentName
        });
    }

    if (oldCategoryName !== newCategoryName) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Category Changed',
            oldValue: oldCategoryName,
            newValue: newCategoryName
        });
    }

    if (oldDueDate !== newDueDate) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Due Date Changed',
            oldValue: oldDueDate,
            newValue: newDueDate
        });
    }

    if (oldAssignedName !== ticket.assignedToName) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Assignee Changed',
            oldValue: oldAssignedName,
            newValue: ticket.assignedToName
        });
    }

    if (oldTitle !== selectedTitle) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Title Changed',
            oldValue: oldTitle || '-',
            newValue: selectedTitle || '-'
        });
    }

    if (oldDescription !== selectedDescription) {
        pendingHistoryEntries.push({
            ticketId,
            changedByUserId,
            actionType: 'Description Changed',
            oldValue: oldDescription || '-',
            newValue: selectedDescription || '-'
        });
    }

    const persistedHistoryEntries = await persistHistoryEntriesAsync(pendingHistoryEntries);
    if (persistedHistoryEntries.length) {
        history.unshift(...persistedHistoryEntries);
    }

    await renderTicketDetail();
    await refreshNotifications();
    renderTickets(); //updates instantly without page reload
    populateFormSelects(); // Repopulate all dropdowns with new ticket included
}

function renderTicketStatusOptions(selectedStatusId) {
    const statuses = dashboardVm.ticketStatuses ?? [];
    return [...statuses]
        .filter(s => isAdmin || (s.name ?? '').toLowerCase() !== 'closed')
        .sort((a, b) => getStatusSortOrder(a.name) - getStatusSortOrder(b.name))
        .map(status =>
            `<option value="${status.id}" ${Number(status.id) === Number(selectedStatusId) ? 'selected' : ''} style="${getStatusOptionStyle(status.name)}">${escapeHtml(status.name ?? '-')}</option>`
        ).join('');
}
async function persistHistoryEntriesAsync(entries) {
    const validEntries = (entries ?? []).filter(x =>
        normalizeNullableId(x?.ticketId)
        && normalizeNullableId(x?.changedByUserId)
        && String(x?.actionType ?? '').trim()
    );

    if (!validEntries.length) return [];

    const saved = [];

    for (const entry of validEntries) {
        const payload = {
            ticketId: normalizeNullableId(entry.ticketId),
            changedByUserId: normalizeNullableId(entry.changedByUserId),
            actionType: String(entry.actionType ?? '').trim(),
            oldValue: entry.oldValue ?? null,
            newValue: entry.newValue ?? null
        };

        const res = await fetch(`${apiBase}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to persist history entry:', res.status, errorText);
            continue;
        }

        const created = await res.json();
        saved.push({
            id: created.id,
            ticketId: created.ticketId,
            changedByUserId: created.changedByUserId,
            changedByUserName: created.changedByUserName,
            actionType: created.actionType,
            oldValue: created.oldValue,
            newValue: created.newValue,
            createdAt: created.createdAt
        });
    }

    return saved;
}

function initTicketDetailAutoSave(ticketId) {
    const ticket = (dashboardVm.tickets ?? []).find(x => Number(x.id) === Number(ticketId));
    if ((ticket?.statusName ?? '').toLowerCase() === 'closed') return; // No autosave on closed tickets


    const schedule = (delay = 300) => {
        clearTimeout(ticketAutoSaveTimers[ticketId]);
        ticketAutoSaveTimers[ticketId] = setTimeout(() => {
            saveTicketDetailChanges(ticketId);
        }, delay);
    };

    const titleInput = document.getElementById(`ticketTitleInput-${ticketId}`);
    if (titleInput && titleInput.dataset.autosaveBound !== '1') {
        titleInput.dataset.autosaveBound = '1';
        titleInput.addEventListener('blur', () => schedule(0));
        titleInput.addEventListener('change', () => schedule(0));
    }

    const descriptionInput = document.getElementById(`ticketDescriptionInput-${ticketId}`);
    if (descriptionInput && descriptionInput.dataset.autosaveBound !== '1') {
        descriptionInput.dataset.autosaveBound = '1';
        descriptionInput.addEventListener('input', () => schedule(700));
        descriptionInput.addEventListener('blur', () => schedule(0));
    }

    const statusSelect = document.getElementById(`ticketStatusSelect-${ticketId}`);
    if (statusSelect && statusSelect.dataset.autosaveBound !== '1') {
        statusSelect.dataset.autosaveBound = '1';
        statusSelect.addEventListener('change', () => schedule(0));
    }

    const prioritySelect = document.getElementById(`ticketPrioritySelect-${ticketId}`);
    if (prioritySelect && prioritySelect.dataset.autosaveBound !== '1') {
        prioritySelect.dataset.autosaveBound = '1';
        prioritySelect.addEventListener('change', () => schedule(0));
    }

    const departmentSelect = document.getElementById(`ticketDepartmentSelect-${ticketId}`);
    if (departmentSelect && departmentSelect.dataset.autosaveBound !== '1') {
        departmentSelect.dataset.autosaveBound = '1';
        departmentSelect.addEventListener('change', () => schedule(0));
    }

    const categorySelect = document.getElementById(`ticketCategorySelect-${ticketId}`);
    if (categorySelect && categorySelect.dataset.autosaveBound !== '1') {
        categorySelect.dataset.autosaveBound = '1';
        categorySelect.addEventListener('change', () => schedule(0));
    }

    const dueDateInput = document.getElementById(`ticketDueDateInput-${ticketId}`);
    if (dueDateInput && dueDateInput.dataset.autosaveBound !== '1') {
        dueDateInput.dataset.autosaveBound = '1';
        dueDateInput.addEventListener('change', () => schedule(0));
    }

    const assignedSelect = document.getElementById(`ticketAssignedSelect-${ticketId}`);
    if (assignedSelect && assignedSelect.dataset.autosaveBound !== '1') {
        assignedSelect.dataset.autosaveBound = '1';
        assignedSelect.addEventListener('change', () => schedule(0));
    }
}

function setTicketDetailTab(tab) {
    ticketDetailSelectedTab = tab;
    ticketDetailEditingTaskId = null;
    renderTicketDetail();
}

function renderTicketDueCountdown(dueDate) {
    if (!dueDate) return '';

    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `<span style="color:#ff6b6b; font-size:0.72rem; font-weight:600;">⚠ Overskredet med ${Math.abs(diffDays)} dag(e)</span>`;
    }

    if (diffDays === 0) {
        return `<span style="color:#ffb454; font-size:0.72rem; font-weight:600;">⚠ Udløber i dag</span>`;
    }

    if (diffDays <= 3) {
        return `<span style="color:#ffb454; font-size:0.72rem; font-weight:600;">⏰ ${diffDays} dag(e) tilbage</span>`;
    }

    return `<span style="color:#8899aa; font-size:0.72rem;">${diffDays} dage tilbage</span>`;
}

// Tickets  Time
function renderTicketTimeline(currentStatusName) {
    const steps = ['Open', 'Waiting for Support', 'In Progress', 'Resolved', 'Closed'];
    const currentIndex = steps.findIndex(s =>
        s.toLowerCase() === (currentStatusName ?? '').toLowerCase()
    );

    return `
    <div style="display:flex; align-items:center; justify-content:space-between; 
                padding:1rem 1.5rem; background:var(--panel,#111a2e); 
                border-radius:10px; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        ${steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isFinalClosed = active && step === 'Closed';
        const color = isFinalClosed ? '#ff6b6b' : done ? '#95e06c' : active ? '#4a9eff' : '#243251';
        const textColor = isFinalClosed ? '#ff6b6b' : done ? '#95e06c' : active ? '#4a9eff' : '#8899aa';
        return `
            <div style="display:flex; align-items:center; gap:0.5rem; flex:1; min-width:0;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem; flex:1;">
                    <div style="width:28px; height:28px; border-radius:50%; 
                                background:${color}22; border:2px solid ${color};
                                display:flex; align-items:center; justify-content:center;
                                font-size:0.75rem; color:${color}; font-weight:700; flex-shrink:0;">
                        ${done ? '✓' : i + 1}
                    </div>
                    <span style="font-size:0.7rem; color:${textColor}; text-align:center; 
                                 font-weight:${active ? '600' : '400'}; white-space:nowrap;">
                        ${step}
                    </span>
                </div>
                ${i < steps.length - 1 ? `
                <div style="flex:1; height:2px; background:${done ? '#95e06c' : '#243251'}; 
                             margin-bottom:1.1rem; min-width:10px;"></div>` : ''}
            </div>`;
    }).join('')}
    </div>`;
}
// ============================================================================
// Ticket Thread (Comments / History / Attachments / Report)
// ============================================================================

function renderTicketThreadTabContent(ticket, comments, historyItems, reports, ticketAttachments = []) {
    const attachmentFiles = extractCommentAttachments(comments);
    const commentsMarkup = (comments ?? []).map(c => `
                        <div class="list-item">
                            <div class="meta" style="display:flex; justify-content:space-between;">
                                <div>
                                    <span>${c.userName ?? 'Unknown'}</span>
                                    <span>${c.createdAt ?? ''}</span>
                                </div>
                                <button onclick="deleteComment(${c.id}, ${ticket.id})"
                                        style="background:#ff6b6b; color:#fff; border:none; padding:0.3rem 0.6rem; border-radius:6px; cursor:pointer; font-size:0.75rem;">
                                    Slet
                                </button>
                            </div>
                            <div>${renderCommentBodyHtml(c.commentText ?? '')}</div>
                        </div>
                    `).join('');

    const historyMarkup = (historyItems ?? []).map(h => `
                        <div class="list-item" style="padding:0.5rem 0.65rem;">
                            <div class="meta" style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; gap:0.45rem; margin-bottom:0.2rem;">
                                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                                    <span>${h.changedByUserName ?? 'Unknown'}</span>
                                    <span>${h.actionType ?? '-'}</span>
                                    <span>${h.createdAt ?? ''}</span>
                                </div>
                                <button type="button" onclick="deleteHistoryEntry(${h.id}, ${ticket.id})"
                                        style="background:#ff6b6b; color:#fff; border:none; padding:0.2rem 0.45rem; border-radius:6px; cursor:pointer; font-size:0.72rem;">
                                    Slet
                                </button>
                            </div>
                            <p style="margin:0; line-height:1.25; font-size:0.92rem;">
                                <strong>Old:</strong> ${h.oldValue ?? '-'}<br>
                                <strong>New:</strong> ${h.newValue ?? '-'}
                            </p>
                        </div>
                    `).join('');

    return `
        <div>
            <h4>Comments / Replies / History</h4>
            <div style="max-height:630px; overflow-y:auto;" class="list" id="commentList-${ticket.id}">
                ${commentsMarkup || historyMarkup
            ? `${commentsMarkup}${historyMarkup}`
            : '<div class="tiny">No comments or history yet.</div>'}
            </div>

            <div style="margin-top:1rem; background:#16213a; border-radius:8px; padding:1rem;">
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.6rem;">
                    <button type="button" class="btn" style="padding:0.25rem 0.55rem;" onclick="applyCommentFormat(${ticket.id}, 'bold')"><strong>B</strong></button>
                    <button type="button" class="btn" style="padding:0.25rem 0.55rem;" onclick="applyCommentFormat(${ticket.id}, 'italic')"><em>I</em></button>
                    <button type="button" class="btn" style="padding:0.25rem 0.55rem;" onclick="applyCommentFormat(${ticket.id}, 'list')">• List</button>
                    <button type="button" class="btn" style="padding:0.25rem 0.55rem;" onclick="applyCommentFormat(${ticket.id}, 'link')">🔗 Link</button>
                    <button type="button" class="btn" style="padding:0.25rem 0.55rem;" onclick="applyCommentFormat(${ticket.id}, 'code')">&lt;/&gt;</button>
                </div>

                <textarea id="newComment-${ticket.id}" class="input" placeholder=" Write a comment..."
                ${(ticket.statusName ?? '').toLowerCase() === 'closed' ? 'disabled' : ''}
                    style="width:100%; min-height:80px; margin-bottom:0.5rem; background:#0f1b33; color:#e6eefc; border:1px solid #3d5b89; border-radius:8px;"></textarea>

                <input id="commentFiles-${ticket.id}" type="file" multiple style="display:none;" onchange="handleCommentFilesSelected(${ticket.id}, this.files)" />
                <div id="commentDrop-${ticket.id}" style="border:1px dashed #3d5b89; border-radius:8px; padding:0.55rem; margin-bottom:0.55rem; color:#9fb0d0; font-size:0.85rem;">
                    📎 Drag files here or <a href="javascript:void(0)" onclick="openCommentFilePicker(${ticket.id})" style="color:#9ecbff; text-decoration:underline; text-underline-offset:2px; font-weight:600;">choose files</a>
                </div>
                <div id="commentFilesList-${ticket.id}" class="tiny" style="margin-bottom:0.55rem;"></div>

                <div style="display:flex; align-items:center; gap:1rem;">
                   <button onclick="addComment(${ticket.id})"
                        style="background:#5aa0ff; color:#fff; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer;"
                        ${(ticket.statusName ?? '').toLowerCase() === 'closed' ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    Add comment
                </button>
                </div>
            </div>
        </div>

        <div>
    <h4>Attachments</h4>
    <div class="list">

        ${/*  Show WebForm original attachments first */
        ticketAttachments.length > 0 ? `
            <div style="margin-bottom:0.5rem;">
                <div class="tiny" style="color:#9fb0d0; margin-bottom:0.4rem;">
                     
                </div>
                ${ticketAttachments.map(a => `
                    <div class="list-item">
                        <div class="tiny">
                            📎 <a href="${a.downloadUrl}" 
                                  target="_blank" 
                                  style="color:#9ecbff; text-decoration:underline;">
                                ${a.fileName}
                            </a>
                            <span style="color:#6b7fa3; margin-left:0.5rem;">
                                ${a.uploadedByUserName ?? 'User'} — ${a.createdAt ?? ''}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${/*  Show comment attachments as before */
        attachmentFiles.length > 0 ? `
            <div>
                <div class="tiny" style="color:#9fb0d0; margin-bottom:0.4rem;">
                    📋 Attachments from thread:
                </div>
                ${attachmentFiles.map(name => `
                    <div class="list-item">
                        <div class="tiny">📎 ${renderAttachmentLink(name)}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${ticketAttachments.length === 0 && attachmentFiles.length === 0
            ? '<div class="tiny">No attachments yet.</div>'
            : ''
        }
    </div>
</div>

        <div>
            <h4>Generated Report</h4>
            <div class="list">
                ${reports.length
            ? reports.map(r => `
                        <div class="list-item">
                            <strong>${r.summary ?? ''}</strong>
                            <p>${r.resolutionText ?? ''}</p>
                            <div class="meta">
                                <span>${r.createdByUserName ?? 'Unknown'}</span>
                                <span>${r.createdAt ?? ''}</span>
                            </div>
                        </div>
                    `).join('')
            : '<div class="tiny">No report generated yet.</div>'
        }
            </div>
        </div>
    `;
}

function extractCommentAttachments(comments) {
    const files = [];

    (comments ?? []).forEach(comment => {
        const lines = String(comment?.commentText ?? '').split('\n');
        const markerIndex = lines.findIndex(x => x.trim().toLowerCase() === 'attachments:');
        if (markerIndex < 0) return;

        for (let i = markerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line.startsWith('- ')) break;

            const fileName = line.slice(2).trim();
            if (fileName) files.push(fileName);
        }
    });

    return [...new Set(files)];
}

function renderCommentBodyHtml(commentText) {
    const lines = String(commentText ?? '').split('\n');
    const html = [];
    let inList = false;
    let inAttachmentSection = false;

    for (const rawLine of lines) {
        const line = rawLine ?? '';
        const isListItem = line.trim().startsWith('- ');

        if (line.trim().toLowerCase() === 'attachments:') {
            inAttachmentSection = true;
            if (inList) {
                html.push('</ul>');
                inList = false;
            }
            html.push('<div><strong>Attachments:</strong></div>');
            continue;
        }

        if (isListItem) {
            if (!inList) {
                html.push('<ul style="margin:0.4rem 0; padding-left:1.2rem;">');
                inList = true;
            }

            const content = line.trim().slice(2);
            if (inAttachmentSection) {
                html.push(`<li>${renderAttachmentLink(content)}</li>`);
            } else {
                html.push(`<li>${applyInlineCommentFormatting(escapeHtml(content))}</li>`);
            }
            continue;
        }

        if (inList) {
            html.push('</ul>');
            inList = false;
        }

        if (!line.trim()) {
            html.push('<div style="height:0.35rem;"></div>');
            continue;
        }

        inAttachmentSection = false;

        html.push(`<div>${applyInlineCommentFormatting(escapeHtml(line))}</div>`);
    }

    if (inList) {
        html.push('</ul>');
    }

    return html.join('');
}

function applyInlineCommentFormatting(escapedText) {
    return escapedText
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/__([^_]+)__/g, '<u>$1</u>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderAttachmentLink(fileName) {
    const encodedName = encodeURIComponent(fileName);
    return `<a href="#" onclick="openCommentAttachment('${encodedName}'); return false;" style="color:#9ecbff; text-decoration:underline; text-underline-offset:2px; font-weight:600;">${escapeHtml(fileName)}</a>`;
}


// ============================================================================
// Comment Composer (Drag/Drop, Paste, Attachments)
// ============================================================================

function initCommentComposer(ticketId) {
    const dropZone = document.getElementById(`commentDrop-${ticketId}`);
    const textarea = document.getElementById(`newComment-${ticketId}`);

    if (!dropZone) {
        renderCommentFilesList(ticketId);
        return;
    }
    if (dropZone.dataset.bound === '1') {
        renderCommentFilesList(ticketId);
        return;
    }
    dropZone.dataset.bound = '1';
    // Bind file input change event
    const fileInput = document.getElementById(`commentFiles-${ticketId}`);
    if (fileInput && fileInput.dataset.bound !== '1') {
        fileInput.dataset.bound = '1';
        fileInput.addEventListener('change', () => {
            handleCommentFilesSelected(ticketId, fileInput.files);
        });
    }

    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#5aa0ff';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#3d5b89';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3d5b89';
        handleCommentFilesSelected(ticketId, e.dataTransfer?.files ?? []);
    });

    // Paste files in dropzone and textarea (e.g., screenshots)
    const bindPasteFiles = (node) => {
        if (!node) return;
        node.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items ?? [];
            const files = [];
            for (const it of items) {
                if (it.kind === 'file') {
                    const f = it.getAsFile();
                    if (f) files.push(f);
                }
            }
            if (files.length) {
                e.preventDefault();
                handleCommentFilesSelected(ticketId, files);
            }
        });
    };
    bindPasteFiles(dropZone);
    bindPasteFiles(textarea);

    renderCommentFilesList(ticketId);
}

function applyCommentFormat(ticketId, format) {
    const area = document.getElementById(`newComment-${ticketId}`);
    if (!area) return;

    const start = area.selectionStart ?? 0;
    const end = area.selectionEnd ?? 0;
    const text = area.value ?? '';
    const selected = text.substring(start, end) || 'text';

    const wrappers = {
        bold: ['**', '**'],
        italic: ['*', '*'],
        underline: ['__', '__'],
        strike: ['~~', '~~'],
        code: ['`', '`'],
        list: ['\n- ', ''],
        link: ['[', '](https://)']
    };

    // Special handling for lists: add "- " to each selected line (or a single "- item")
    if (format === 'list') {
        const before = text.slice(0, start);
        const inside = text.slice(start, end) || 'item';
        const after = text.slice(end);

        const block = inside
            .split('\n')
            .map(line => line ? `- ${line}` : '- ')
            .join('\n');

        const next = `${before}${block}${after}`;
        const newStart = before.length;
        const newEnd = newStart + block.length;

        area.value = next;
        area.focus();
        area.setSelectionRange(newStart, newEnd);
        area.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }

    const [prefix, suffix] = wrappers[format] ?? ['', ''];
    const next = `${text.substring(0, start)}${prefix}${selected}${suffix}${text.substring(end)}`;
    const newStart = start + prefix.length;
    const newEnd = newStart + selected.length;

    area.value = next;
    area.focus();
    area.setSelectionRange(newStart, newEnd);
    area.dispatchEvent(new Event('input', { bubbles: true }));
}

function openCommentFilePicker(ticketId) {
    document.getElementById(`commentFiles-${ticketId}`)?.click();
}

function handleCommentFilesSelected(ticketId, files) {
    if (!commentAttachmentDrafts[ticketId]) commentAttachmentDrafts[ticketId] = [];
    if (!commentAttachmentObjectUrlsByTicket[ticketId]) commentAttachmentObjectUrlsByTicket[ticketId] = {};

    const draft = commentAttachmentDrafts[ticketId]; // File[]
    const urlMap = commentAttachmentObjectUrlsByTicket[ticketId]; // name -> url

    Array.from(files ?? []).forEach(file => {
        if (!file?.name) return;

        // Deduplicate by filename within this ticket
        const already = draft.some(f => f.name === file.name);
        if (already) return;

        draft.push(file);

        if (!urlMap[file.name]) {
            const url = URL.createObjectURL(file);
            urlMap[file.name] = url;
        }

        // Legacy global map for compatibility
        if (!commentAttachmentObjectUrls[file.name]) {
            commentAttachmentObjectUrls[file.name] = urlMap[file.name];
        }
    });

    renderCommentFilesList(ticketId);
}

function removeCommentFile(ticketId, index) {
    const draft = commentAttachmentDrafts[ticketId] ?? [];
    if (index < 0 || index >= draft.length) return;

    const file = draft[index];
    draft.splice(index, 1);

    const url = commentAttachmentObjectUrlsByTicket[ticketId]?.[file.name];
    if (url) {
        URL.revokeObjectURL(url);
        delete commentAttachmentObjectUrlsByTicket[ticketId][file.name];
    }

    // If no other ticket references this filename, clear from global cache too
    const stillReferenced = Object.values(commentAttachmentObjectUrlsByTicket)
        .some(map => map && map[file.name]);
    if (!stillReferenced) {
        delete commentAttachmentObjectUrls[file.name];
    }

    renderCommentFilesList(ticketId);
}

function renderCommentFilesList(ticketId) {
    const host = document.getElementById(`commentFilesList-${ticketId}`);
    if (!host) return;

    const files = commentAttachmentDrafts[ticketId] ?? [];
    host.innerHTML = files.length
        ? files.map((file, index) =>
            `<span style="display:inline-flex; align-items:center; gap:0.35rem; margin:0 0.4rem 0.35rem 0; padding:0.2rem 0.45rem; border:1px solid #3d5b89; border-radius:999px;">
                <span>${escapeHtml(file.name)} <span class="tiny">(${formatBytes(file.size)})</span></span>
                <button type="button" class="btn" style="padding:0 0.35rem; line-height:1;" onclick="removeCommentFile(${ticketId}, ${index})">×</button>
            </span>`
        ).join('')
        : 'No files selected.';
}

function appendCommentAttachmentsToText(ticketId, text) {
    const files = commentAttachmentDrafts[ticketId] ?? [];
    if (!files.length) return text;

    const attachmentLines = files.map(f => `- ${f.name}`).join('\n');
    return `${text}\n\nAttachments:\n${attachmentLines}`;
}

async function openCommentAttachment(encodedFileName) {
    const fileName = decodeURIComponent(encodedFileName);

    // Try session cache first
    for (const map of Object.values(commentAttachmentObjectUrlsByTicket)) {
        const url = map?.[fileName];
        if (url) {
            window.open(url, '_blank', 'noopener');
            return;
        }
    }

    // Look up from API by filename
    const ticketId = Number(document.getElementById('ticketDetailSelect')?.value || 0);
    if (ticketId) {
        const res = await fetch(`${apiBase}/api/attachments/ticket/${ticketId}`);
        if (res.ok) {
            const attachments = await res.json();
            const match = attachments.find(a => a.fileName === fileName);
            if (match?.downloadUrl) {
                window.open(match.downloadUrl, '_blank', 'noopener');
                return;
            }
        }
    }

    showToast('Attachment not found.', 'error');
}


// ============================================================================
// Tasks
// ============================================================================

//function renderTasksTabContent(ticket, tasks) {
function renderTasksTabContent(ticket, tasks, isClosed = false) {
    const visibleTasks = (tasks ?? []).filter(task => Number(task?.isActive ?? 1) === 1);


    return `
        <div class="section-head" style="padding:0; margin-top:2px;">
            <div>
                <h4 style="margin:0;">Tasks</h4>
                <div class="muted">Work items related to this ticket.</div>
            </div>
        </div>

        <div class="ticket-task-list">
            ${visibleTasks.length
            ? visibleTasks.map(task => {
                const priorityName = resolveTaskPriorityName(task, ticket);

                const isResolved = (task.status?.name ?? '').toLowerCase().includes('resolved');
                const canAssignToMe = Number(task.assignedUserId || 0) !== Number(loggedInUserId || 0);
                const titleText = (task.title ?? '').trim();
                const descriptionText = (task.description ?? '').trim();

                const createdByUser = (dashboardVm.users ?? []).find(u => u.id === task.createdByUserId);
                const createdByLabel = createdByUser
                    ? `${createdByUser.firstName} ${createdByUser.lastName}`.trim()
                    : 'Ukendt';
                return `
                       <div class="task-card-compact" style="${isResolved ? 'border:1px solid #95e06c44; background:#95e06c08;' : ''}">
                            <div class="task-display-section">
                                <div class="task-title-block">
                                    <div class="task-title-display" id="taskTitleDisplay-${task.id}">
                                       <h4 class="task-title-text">${titleText ? escapeHtml(titleText) : '<span class="text-muted">Untitled task</span>'} ${isResolved ? '<span style="color:#95e06c; font-size:1rem;" title="Resolved">✅</span>' : ''}</h4>
                                     </div>
                                    <button type="button" class="edit-icon-btn" title="Edit title" onclick="editTaskTitle(${task.id})">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.586 1.586a2 2 0 1 1 2.828 2.828l-7.71 7.71A2 2 0 0 1 5 11.414V14a1 1 0 1 1-2 0v-2.586a2 2 0 0 1 .586-1.414l7.71-7.71z" stroke="currentColor" stroke-width="0.5" fill="currentColor"/>
                                        </svg>
                                    </button>
                                    <input id="taskTitleInput-${task.id}" class="input task-title-input" type="text" value="${escapeHtml(task.title ?? '')}" placeholder="Task title" style="display:none;" />
                                    </div>

                                <div class="task-desc-block">
                                    <div class="task-desc-display" id="taskDescDisplay-${task.id}">
                                        <p class="task-desc-text">${descriptionText ? escapeHtml(descriptionText) : '<span class="text-muted">No description</span>'}</p>
                                    </div>
                                    <button type="button" class="edit-icon-btn" title="Edit description" onclick="editTaskDesc(${task.id})">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.586 1.586a2 2 0 1 1 2.828 2.828l-7.71 7.71A2 2 0 0 1 5 11.414V14a1 1 0 1 1-2 0v-2.586a2 2 0 0 1 .586-1.414l7.71-7.71z" stroke="currentColor" stroke-width="0.5" fill="currentColor"/>
                                        </svg>
                                    </button>
                                    <textarea id="taskDescInput-${task.id}" class="input task-desc-input" placeholder="Task description" style="display:none;">${escapeHtml(task.description ?? '')}</textarea>
                                </div>

                                <div class="task-badges">
                                    <span class="badge-compact ${statusBadgeClass(task.status?.name)}">${task.status?.name ?? '-'}</span>
                                    <span class="badge-compact ${priorityBadgeClass(priorityName)}">${priorityName}</span>
                                </div>
                              
                                <div style="font-size:0.75rem; color:var(--muted,#8899aa); margin-top:4px;">
                                    Denne task er skabt af: <strong>${createdByLabel}</strong>
                                </div>
                            </div>

                            <div class="task-card-controls">
                              <div class="control-group">
                                 <label>Status</label>
                                    <select id="taskStatusSelect-${task.id}" class="input" ${!isAdmin && isClosed ? 'disabled style="opacity:0.5;"' : ''}>
                                        ${renderTicketStatusOptions(task.statusId)}
                                    </select>
                                </div>
                               <div class="control-group">
                                    <label>Due Date</label>
                                    <input type="date" id="taskDueDateInput-${task.id}" class="input" 
                                        value="${task.dueDate ? task.dueDate.split('T')[0] : ''}"
                                        ${!isAdmin && isClosed ? 'disabled style="opacity:0.5;"' : ''}>
                                </div>
                                <div class="control-group">
                                    <label>Assigned</label>
                                    <select id="taskAssignedSelect-${task.id}" class="input" ${!isAdmin && isClosed ? 'disabled style="opacity:0.5;"' : ''}>
                                        ${renderTaskAssigneeOptions(task.assignedUserId)}
                                    </select>
                                </div>
                            </div>

                           <div class="task-card-actions">
                            ${!isAdmin && isClosed ? '' : `
                                <button class="btn-compact primary" type="button" onclick="saveTaskQuickChanges(${task.id}, ${ticket.id})">Save</button>
                                ${canAssignToMe ? `<button class="btn-compact" type="button" onclick="assignTaskToMe(${task.id})">Assign me</button>` : ''}
                                <button class="btn-compact" type="button" style="background:var(--danger,#ff6b6b);color:#fff;" onclick="deleteTask(${task.id}, ${ticket.id})">Slet</button>
                            `}
                        </div>
                        </div>
                    `;
            }).join('')
            : '<div class="tiny">No tasks yet.</div>'
        }
        </div>
    `;
}

async function deleteTask(taskId, ticketId) {
    showConfirm('Er du sikker på, at du vil slette denne task?', async () => {
        const res = await fetch(`${apiBase}/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            showToast('Kunne ikke slette task.', 'error');
            return;
        }

        showToast('Task slettet.', 'info');
        await renderTicketDetail();
    });
}
async function saveTaskQuickChanges(taskId, ticketId) {
    const task = ticketDetailTasksCache.find(x => x.id === taskId);
    if (!task) return;

    const selectedTicket = (dashboardVm.tickets ?? []).find(x => x.id === ticketId);
    const title = (document.getElementById(`taskTitleInput-${taskId}`)?.value ?? '').trim();
    const description = (document.getElementById(`taskDescInput-${taskId}`)?.value ?? '').trim();

    const selectedStatusId = normalizeNullableId(document.getElementById(`taskStatusSelect-${taskId}`)?.value)
        ?? normalizeNullableId(task.statusId)
        ?? getDefaultTaskStatusId(selectedTicket);

    const createdByUserId = normalizeNullableId(task.createdByUserId)
        ?? normalizeNullableId(loggedInUserId)
        ?? normalizeNullableId(selectedTicket?.createdByUserId)
        ?? normalizeNullableId(selectedTicket?.assignedToUserId);


    //  After — check if user explicitly selected Unassigned
    const rawAssignedValue = document.getElementById(`taskAssignedSelect-${taskId}`)?.value;
    const userExplicitlyUnassigned = rawAssignedValue === '' || rawAssignedValue === '0' || rawAssignedValue === 'null';
    const selectedAssignedUserId = normalizeNullableId(rawAssignedValue);

    const assignedUserId = userExplicitlyUnassigned
        ? null  // ← user wants Unassigned — respect it
        : selectedAssignedUserId
        ?? normalizeNullableId(task.assignedUserId)
        ?? normalizeNullableId(selectedTicket?.assignedToUserId)
        ?? createdByUserId;

   
 

    const dueDateValue = document.getElementById(`taskDueDateInput-${taskId}`)?.value || null;

    if (!selectedStatusId || !createdByUserId) {
        showToast('Status/creator could not be resolved.', 'error');
        return;
    }
    if (!title) {
        showToast('Task title is required.', 'error');
        return;
    }

    // ALl to  TextArea  to  show  beskrivelse for  each task
    const resolvedStatusId = (dashboardVm.ticketStatuses ?? [])
        .find(s => s.name?.toLowerCase() === 'resolved')?.id;

    const isResolvingTask = selectedStatusId === resolvedStatusId
        && normalizeNullableId(task.statusId) !== resolvedStatusId;

    const assigneeChanged = selectedAssignedUserId &&
        selectedAssignedUserId !== normalizeNullableId(task.assignedUserId);

    // inner save function
    async function doSave(sendEmail, resolveNote = null) {
        const payload = {
            id: task.id,
            ticketId: task.ticketId,
            createdByUserId,
            assignedUserId,
            statusId: selectedStatusId,
            title,
            description,
            dueDate: dueDateValue ?? task.dueDate ?? null,
            closedAt: task.closedAt ?? null,
            sendEmail
        };

        const res = await fetch(`${apiBase}/api/tasks/${taskId}?sendEmail=${sendEmail}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            showToast(`Failed to save changes. ${errorText || ''}`.trim(), 'error');
            return;
        }

        // Save resolve note as comment if provided
        if (resolveNote && resolveNote.trim()) {
            await fetch(`${apiBase}/api/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: task.ticketId,
                    userId: loggedInUserId,
                    commentText: `[Task: ${title}] ${resolveNote.trim()}`
                
                })
            });

            const freshComments = await fetch(`${apiBase}/api/comments`);
            if (freshComments.ok) {
                dashboardVm.comments = await freshComments.json();
            }
        }

        showToast('Task updated successfully!');

        await renderTicketDetail();
        await refreshNotifications();
    }

    // Show resolve note popup if resolving
    if (isResolvingTask) {
        document.getElementById('taskResolveOverlay').style.display = 'block';
        document.getElementById('taskResolveNote').value = '';
        document.getElementById('taskResolveGemBtn').onclick = async () => {
            const note = document.getElementById('taskResolveNote').value;
            document.getElementById('taskResolveOverlay').style.display = 'none';
            if (assigneeChanged) {
                showConfirm('Vil du sende en e-mail til supporteren?', () => doSave(true, note));
                document.querySelector('#genericConfirmOverlay .btn').onclick = () => {
                    document.getElementById('genericConfirmOverlay').style.display = 'none';
                    doSave(false, note);
                };
            } else {
                await doSave(false, note);
            }
        };
    } else if (assigneeChanged) {
        showConfirm('Vil du sende en e-mail til supporteren?', () => doSave(true));
        document.getElementById('confirmYesBtn').onclick = () => {
            document.getElementById('genericConfirmOverlay').style.display = 'none';
            doSave(true);
        };
        document.querySelector('#genericConfirmOverlay .btn').onclick = () => {
            document.getElementById('genericConfirmOverlay').style.display = 'none';
            doSave(false);
        };
    } else {
        await doSave(false);
    }
}

async function renderTicketDetailSidePanel(ticket) {
    const linkedReportDebug = (dashboardVm.reports ?? []).find(r => r.ticketId === ticket.id);

    const sideTitle = document.getElementById('ticketDetailSideTitle');
    const sideDesc = document.getElementById('ticketDetailSideDesc');
    const panel = document.getElementById('ticketDetailSidePanel');
    const isClosed = (ticket.statusName ?? '').toLowerCase() === 'closed';
    if (!panel) return;

    if (ticketDetailSelectedTab === TicketDetailTab.TicketThread) {
        if (sideTitle) sideTitle.textContent = 'Support Reply / Finish Work';
        if (sideDesc) sideDesc.textContent = 'When confirmed, the system generates report + QR from the ticket reply.';

        const tasks = ticketDetailTasksCache ?? [];
        const linkedReport = (dashboardVm.reports ?? []).find(r => r.ticketId === ticket.id);
        const adminFeedback = linkedReport?.adminFeedback ?? null;

        const comments = (dashboardVm.comments ?? []).filter(x => x.ticketId === ticket.id);
        const attachments = extractCommentAttachments(comments);
        let ticketAttachments = [];
        try {
            const attRes = await fetch(`${apiBase}/api/attachments/ticket/${ticket.id}`);
            if (attRes.ok) ticketAttachments = await attRes.json();
        } catch { ticketAttachments = []; }
        const assignedName = ticket.assignedToName ?? 'Unassigned';
        const createdByUser = (dashboardVm.users ?? []).find(u => u.id === ticket.createdByUserId);
        const createdByName = createdByUser
            ? `${createdByUser.firstName ?? ''} ${createdByUser.lastName ?? ''}`.trim()
            : 'Ukendt';

        // Task resolve notes from comments
        const taskResolveNotes = comments.filter(c => (c.commentText ?? '').startsWith('[Task:'));

        const tasksHtml = tasks.length ? tasks.map(t => {
            const assignedUser = (dashboardVm.users ?? []).find(u => u.id === t.assignedUserId);
            const assignedTaskName = assignedUser
                ? `${assignedUser.firstName ?? ''} ${assignedUser.lastName ?? ''}`.trim()
                : 'Unassigned';
            const resolveNote = taskResolveNotes.find(c => c.commentText?.includes(`[Task: ${t.title}]`));
            const resolveText = resolveNote
                ? resolveNote.commentText.replace(`[Task: ${t.title}] `, '')
                : 'Ikke angivet';
            return `
            <div style="background:var(--panel,#111a2e); border-radius:8px; padding:0.75rem; margin-bottom:0.5rem;">
                <div style="font-weight:600; color:var(--text,#cdd6f4);">📋 ${t.title ?? '-'}</div>
                <div style="font-size:0.8rem; color:var(--muted,#8899aa); margin-top:4px;">${t.description ?? '-'}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Assigned:</strong> ${assignedTaskName}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Rapport:</strong> ${resolveText}</div>
            </div>`;
        }).join('') : '<div class="tiny">Ingen tasks.</div>';

        //show both types
        const originalHtml = ticketAttachments.length
            ? ticketAttachments.map(a => `
        <div style="font-size:0.8rem;">
            📎 <a href="${a.downloadUrl}" target="_blank" 
                style="color:#9ecbff;text-decoration:underline;">
                ${a.fileName}
            </a>
            <span style="color:#6b7fa3; font-size:0.75rem;"> — ${a.uploadedByUserName ?? 'User'}</span>
        </div>`).join('')
            : '';

        // Filter out filenames already shown in original attachments
        const ticketAttachmentFilenames = ticketAttachments.map(a => a.fileName);
        const filteredAttachments = attachments.filter(f => !ticketAttachmentFilenames.includes(f));

        const threadHtml2 = filteredAttachments.length
            ? filteredAttachments.map(f => `<div style="font-size:0.8rem;">📎 ${renderAttachmentLink(f)}</div>`).join('')
            : '';

        const attachmentsHtml = (originalHtml || threadHtml2)
            ? originalHtml + threadHtml2
            : '<div class="tiny">Ingen vedhæftede filer.</div>';

        const threadHtml = comments.filter(c => !(c.commentText ?? '').startsWith('[Task:')).length
            ? comments.filter(c => !(c.commentText ?? '').startsWith('[Task:')).map(c =>
                `<div style="font-size:0.8rem; padding:0.4rem 0; border-bottom:1px solid #243251;">
                <strong>${c.userName ?? 'Unknown'}</strong>: ${c.commentText ?? ''}
            </div>`).join('')
            : '<div class="tiny">Ingen kommentarer.</div>';

        const adminFeedbackField = isClosed && adminFeedback ? `
            <div style="margin-top:1rem; background:#1a0a0a; border:1px solid #ff6b6b44; border-radius:8px; padding:0.75rem;">
                <div style="font-size:0.85rem; color:#ff6b6b; margin-bottom:4px; font-weight:600;">🔒 Admin Feedback</div>
                <div style="font-size:0.9rem; color:#e6eefc;">${adminFeedback}</div>
            </div>`
                    : isAdmin && !isClosed ? `
            <div style="margin-top:1rem;">
                <label style="font-size:0.85rem; color:var(--muted,#8899aa);">Admin Feedback</label>
                <textarea id="adminFeedback" class="input" style="width:100%; min-height:60px; margin-top:4px;"
                    placeholder="Skriv admin feedback til supporterne..."></textarea>
            </div>`
                        : ''; 

        panel.innerHTML = `
        <form class="reply-form" onsubmit="submitSupportReplyFromDetail(event)">
            <input type="hidden" id="replyTicketId" value="${ticket.id}" />
            <input type="hidden" id="replyUserId" value="${loggedInUserId}" />

            <!-- Ticket Info -->
            <div style="background:var(--panel,#111a2e); border-radius:8px; padding:0.75rem; margin-bottom:0.75rem;">
                <div style="font-size:0.85rem; color:var(--muted,#8899aa);">Ticket</div>
                <div style="font-weight:600;">#${ticket.id} - ${ticket.title ?? '-'}</div>
                <div style="font-size:0.8rem; margin-top:4px; color:var(--muted,#8899aa);">${ticket.description ?? '-'}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Assigned to:</strong> ${assignedName}</div>
                <div style="font-size:0.8rem; margin-top:2px;"><strong>Created by:</strong> ${createdByName}</div>
                <div style="font-size:0.8rem; margin-top:2px;"><strong>Created at:</strong> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
            </div>

            <!-- Resolve Beskrivelse -->
            <div style="margin-bottom:0.75rem;">
                <label style="font-size:0.85rem; color:var(--muted,#8899aa);">Resolve Beskrivelse</label>
                <textarea id="replySummary" class="input" style="width:100%; min-height:80px; margin-top:4px;"
                    placeholder="Beskriv hvad der blev udført på denne ticket..." required></textarea>
            </div>

            <!-- Ticket Thread -->
            <div style="margin-bottom:0.75rem;">
                <div style="font-size:0.85rem; color:var(--muted,#8899aa); margin-bottom:4px;">Ticket Thread</div>
                <div style="max-height:120px; overflow-y:auto; background:var(--panel,#111a2e); border-radius:8px; padding:0.5rem;">
                    ${threadHtml}
                </div>
            </div>

            <!-- Tasks -->
            <div style="margin-bottom:0.75rem;">
                <div style="font-size:0.85rem; color:var(--muted,#8899aa); margin-bottom:4px;">Tasks</div>
                ${tasksHtml}
            </div>

            <!-- Attachments -->
            <div style="margin-bottom:0.75rem;">
                <div style="font-size:0.85rem; color:var(--muted,#8899aa); margin-bottom:4px;">Attachments</div>
                ${attachmentsHtml}
            </div>

            ${adminFeedbackField}

            <div class="actions">
               <button class="btn success" type="submit" ${isClosed ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    ${isClosed ? '🔒 Ticket Lukket' : 'Confirm and Generate Report + QR'}
                </button>
            </div>
        </form>
    `;
        return;
    }

    const editingTask = ticketDetailTasksCache.find(x => x.id === ticketDetailEditingTaskId);
    const editorTitle = editingTask ? `Edit Task #${editingTask.id}` : 'Create Task';

    if (sideTitle) sideTitle.textContent = 'Task Controls';
    if (sideDesc) sideDesc.textContent = 'Create or update task details for the selected ticket.';

    panel.innerHTML = `
        <form class="reply-form" onsubmit="saveTaskFromTicketDetail(event)">
            <input type="hidden" id="taskEditorId" value="${editingTask?.id ?? ''}" />
            <input type="hidden" id="taskEditorTicketId" value="${ticket.id}" />
            <div class="muted">${editorTitle}</div>
            <input id="taskEditorTitle" placeholder="Task title" value="${escapeHtml(editingTask?.title ?? '')}" required />
            <textarea id="taskEditorDescription" placeholder="Task description" required>${escapeHtml(editingTask?.description ?? '')}</textarea>
            <div class="actions">
                <button class="btn primary" type="submit" ${!isAdmin && isClosed ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>${editingTask ? 'Save Task' : 'Create Task'}</button>
                ${editingTask ? '<button class="btn" type="button" onclick="clearTaskEditor()">Cancel Edit</button>' : ''}
            </div>
        </form>
    `;
}

async function openTaskEditorForCreate() {
    ticketDetailSelectedTab = TicketDetailTab.Tasks;
    ticketDetailEditingTaskId = null;
    await renderTicketDetail();
    focusTaskEditor();
}

async function openTaskEditorForEdit(taskId) {
    ticketDetailSelectedTab = TicketDetailTab.Tasks;
    ticketDetailEditingTaskId = taskId;
    await renderTicketDetail();
    focusTaskEditor();
}

async function clearTaskEditor() {
    ticketDetailEditingTaskId = null;
    await renderTicketDetail();
    focusTaskEditor();
}

function focusTaskEditor() {
    const titleInput = document.getElementById('taskEditorTitle');
    if (!titleInput) return;

    titleInput.focus();
    titleInput.select();
    titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function saveTaskFromTicketDetail(e) {
    e.preventDefault();

    const id = Number(document.getElementById('taskEditorId')?.value || 0);
    const ticketId = Number(document.getElementById('taskEditorTicketId')?.value || 0);
    const title = (document.getElementById('taskEditorTitle')?.value ?? '').trim();
    const description = (document.getElementById('taskEditorDescription')?.value ?? '').trim();

    if (!title || !ticketId) {
        showToast('Task title is required.', 'error');
        return;
    }

    const selectedTicket = (dashboardVm.tickets ?? []).find(x => x.id === ticketId);
    const existingTask = ticketDetailTasksCache.find(x => x.id === id);
    const dueDate = existingTask?.dueDate ?? null;
    const currentUserId = normalizeNullableId(loggedInUserId);
    const defaultStatusId = getDefaultTaskStatusId(selectedTicket);

    const createdByUserId = normalizeNullableId(existingTask?.createdByUserId)
        ?? currentUserId
        ?? normalizeNullableId(selectedTicket?.createdByUserId)
        ?? normalizeNullableId(selectedTicket?.assignedToUserId);

    const assignedUserId = normalizeNullableId(existingTask?.assignedUserId)
        ?? normalizeNullableId(selectedTicket?.assignedToUserId)
        ?? createdByUserId;

    if (!defaultStatusId) {
        showToast('Task status is missing. Please configure ticket statuses.', 'error');
        return;
    }
    if (!createdByUserId) {
        showToast('Could not resolve task creator user id.', 'error');
        return;
    }

    const payload = {
        id,
        ticketId,
        createdByUserId,
        assignedUserId,
        statusId: normalizeNullableId(existingTask?.statusId) ?? defaultStatusId,
        title,
        description,
        dueDate,
        closedAt: existingTask?.closedAt ?? null
    };

    const url = id ? `${apiBase}/api/tasks/${id}` : `${apiBase}/api/tasks`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        const apiMessage = (errorText || '').trim();
        showToast(
            (id ? 'Failed to update task.' : 'Failed to create task.') + (apiMessage ? ` ${apiMessage}` : ''),
            'error'
        );
        console.error('Task save failed:', res.status, errorText);
        return;
    }

    ticketDetailEditingTaskId = null;
    showToast(id ? 'Task updated successfully!' : 'Task created successfully!');
    await renderTicketDetail();
    await refreshNotifications();
}

async function assignTaskToMe(taskId) {
    const task = ticketDetailTasksCache.find(x => x.id === taskId);
    if (!task) return;

    const currentUserId = normalizeNullableId(loggedInUserId);
    if (!currentUserId) {
        showToast('Could not resolve current user id.', 'error');
        return;
    }


    const payload = {
        id: task.id,
        ticketId: task.ticketId,
        createdByUserId: normalizeNullableId(task.createdByUserId)
            ?? currentUserId
            ?? normalizeNullableId((dashboardVm.tickets ?? []).find(x => x.id === task.ticketId)?.createdByUserId),
        assignedUserId: currentUserId,
        statusId: normalizeNullableId(task.statusId) ?? getDefaultTaskStatusId(),
        title: task.title ?? '',
        description: task.description ?? '',
        dueDate: task.dueDate ?? null,
        closedAt: task.closedAt ?? null
    };

    const res = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        showToast('Failed to assign task.', 'error');
        console.error('Assign task failed:', res.status, errorText);
        return;
    }

    showToast('Task assigned to you.');
    await renderTicketDetail();
    await refreshNotifications();
}

async function markTaskClosed(taskId) {
    const task = ticketDetailTasksCache.find(x => x.id === taskId);
    if (!task) return;

    const closedStatusId = getStatusIdByName('closed') ?? task.statusId ?? 1;

    const payload = {
        id: task.id,
        ticketId: task.ticketId,
        createdByUserId: normalizeNullableId(task.createdByUserId)
            ?? normalizeNullableId(loggedInUserId)
            ?? normalizeNullableId((dashboardVm.tickets ?? []).find(x => x.id === task.ticketId)?.createdByUserId),
        assignedUserId: normalizeNullableId(task.assignedUserId),
        statusId: normalizeNullableId(closedStatusId) ?? getDefaultTaskStatusId(),
        title: task.title ?? '',
        description: task.description ?? '',
        dueDate: task.dueDate ?? null,
        closedAt: new Date().toISOString()
    };

    const res = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        showToast('Failed to close task.', 'error');
        console.error('Close task failed:', res.status, errorText);
        return;
    }

    showToast('Task marked as closed.');
    await renderTicketDetail();
    await refreshNotifications();
}

async function loadTasksForTicketDetailAsync(ticketId) {
    try {
        const res = await fetch(`${apiBase}/api/tasks`);
        if (!res.ok) {
            const t = (await res.text()) || '';
            throw new Error(t);
        }
        const allTasks = await res.json();
        return (allTasks ?? []).filter(x => Number(x.ticketId) === Number(ticketId));
    } catch (err) {
        console.error('Failed to load tasks:', err);
        showToast('Could not load tasks right now.', 'error');
        return [];
    }
}


// ============================================================================
/* Helpers */
// ============================================================================

function getStatusIdByName(name) {
    return (dashboardVm.ticketStatuses ?? [])
        .find(x => (x.name ?? '').toLowerCase() === String(name).toLowerCase())?.id;
}

function getDefaultTaskStatusId(ticket = null) {
    return normalizeNullableId(getStatusIdByName('open'))
        ?? normalizeNullableId(ticket?.statusId)
        ?? normalizeNullableId((dashboardVm.ticketStatuses ?? [])[0]?.id);
}

function normalizeNullableId(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
}

function resolveTaskAssigneeName(task) {
    if (task.assignedUser) {
        if (task.assignedUser.userName) {
            return task.assignedUser.userName;
        }
        return `${task.assignedUser.firstName ?? ''} ${task.assignedUser.lastName ?? ''}`.trim();
    }

    if (task.assignedUserId) {
        const user = (dashboardVm.users ?? []).find(x => x.id === task.assignedUserId);
        if (user) {
            if (user.userName) return user.userName;
            const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
            if (name) return name;
        }
    }

    return 'Unassigned';
}

function resolveTaskPriorityName(task, ticket) {
    const overridePriorityId = taskPriorityOverrides[task.id];
    if (overridePriorityId) {
        const overridePriority = (dashboardVm.ticketPriorities ?? []).find(x => x.id === overridePriorityId);
        if (overridePriority?.name) return overridePriority.name;
    }

    if (task.priority?.name) return task.priority.name;

    if (task.priorityId) {
        const priority = (dashboardVm.ticketPriorities ?? []).find(x => x.id === task.priorityId);
        if (priority?.name) return priority.name;
    }

    return ticket?.priorityName ?? '-';
}

function resolveTaskPriorityId(task, ticket) {
    const overridePriorityId = taskPriorityOverrides[task.id];
    if (overridePriorityId) return overridePriorityId;

    return normalizeNullableId(task.priorityId)
        ?? normalizeNullableId(ticket?.ticketPriorityId)
        ?? normalizeNullableId((dashboardVm.ticketPriorities ?? [])[0]?.id);
}

function renderTaskStatusOptions(selectedStatusId) {
    const statuses = dashboardVm.ticketStatuses ?? [];
    return [...statuses]
        .filter(s => (s.name ?? '').toLowerCase() !== 'closed') // remove closed in Tasks, only admin can close  the whole ticket
        .sort((a, b) => getStatusSortOrder(a.name) - getStatusSortOrder(b.name))
        .map(status =>
            `<option value="${status.id}" ${Number(status.id) === Number(selectedStatusId) ? 'selected' : ''} style="${getStatusOptionStyle(status.name)}">${escapeHtml(status.name ?? '-')}</option>`
        ).join('');
}
function renderTaskAssigneeOptions(selectedAssignedUserId) {
    const users = dashboardVm.users ?? [];
    const selectedId = normalizeNullableId(selectedAssignedUserId);
    const options = [
        `<option value="" ${selectedId ? '' : 'selected'} style="color:#000; background:#fff;">Unassigned</option>`,
        ...users.map(user => {
            const userId = normalizeNullableId(user.id);
            if (!userId) return '';
            const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
            const label = user.userName || fullName || `User #${userId}`;
            return `<option value="${userId}" ${userId === selectedId ? 'selected' : ''} style="color:#000; background:#fff;">${escapeHtml(label)}</option>`;
        })
    ];
    return options.join('');
}
function getStatusSortOrder(statusName) {
    const name = String(statusName ?? '').toLowerCase();

    if (name === 'open') return 1;
    if (name === 'in progress') return 2;
    if (name === 'waiting for support') return 3;
    if (name === 'resolved') return 4;
    if (name === 'closed') return 5;

    return 99;
}

function getStatusOptionStyle(statusName) {
    const name = String(statusName ?? '').toLowerCase();

    if (name === 'open') return 'color:#4a86ff; background:#111a2e; font-weight:700;';
    if (name === 'in progress') return 'color:#ffb454; background:#111a2e; font-weight:700;';
    if (name === 'waiting for support') return 'color:#ffd27b; background:#111a2e; font-weight:700;';
    if (name === 'resolved') return 'color:#95e06c; background:#111a2e; font-weight:700;';
    if (name === 'closed') return 'color:#c7d2e6; background:#111a2e; font-weight:700;';

    return 'color:#e6eefc; background:#111a2e;';
}

function renderTaskPriorityOptions(selectedPriorityId) {
    const priorities = dashboardVm.ticketPriorities ?? [];
    return priorities.map(priority => {
        const style = getPriorityOptionStyle(priority.name);
        return `<option value="${priority.id}" ${Number(priority.id) === Number(selectedPriorityId) ? 'selected' : ''} style="${style}">${escapeHtml(priority.name ?? '-')}</option>`;
    }).join('');
}

function getPriorityOptionStyle(priorityName) {
    const name = String(priorityName ?? '').toLowerCase();

    if (name.includes('critical')) return 'color:#ff6b6b; background:#111a2e; font-weight:700;';
    if (name.includes('high')) return 'color:#ff8a65; background:#111a2e; font-weight:700;';
    if (name.includes('medium')) return 'color:#6fb2ff; background:#111a2e; font-weight:700;';
    if (name.includes('low')) return 'color:#9ad86f; background:#111a2e; font-weight:700;';

    return 'color:#e6eefc; background:#111a2e;';
}

function renderTicketAssigneeOptions(selectedAssignedUserId) {
    const users = dashboardVm.users ?? [];
    const selectedId = normalizeNullableId(selectedAssignedUserId);

    // Supporters only see themselves, admins see all
    const filteredUsers = isAdmin
        ? users
        : users.filter(u => u.id == loggedInUserId);

    const options = [
        `<option value="" ${selectedId ? '' : 'selected'} style="color:#000; background:#fff;">Unassigned</option>`,
        ...filteredUsers.map(user => {
            const userId = normalizeNullableId(user.id);
            if (!userId) return '';
            const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
            const label = user.userName || fullName || `User #${userId}`;
            return `<option value="${userId}" ${userId === selectedId ? 'selected' : ''} style="color:#000; background:#fff;">${escapeHtml(label)}</option>`;
        })
    ];
    return options.join('');
}

function renderTicketDepartmentOptions(selectedDepartmentId) {
    const departments = dashboardVm.ticketDepartments ?? [];
    const selectedId = normalizeNullableId(selectedDepartmentId);

    return departments.map(department => {
        const departmentId = normalizeNullableId(department.id);
        if (!departmentId) return '';
        return `<option value="${departmentId}" ${departmentId === selectedId ? 'selected' : ''} style="color:#000; background:#fff;">${escapeHtml(department.name ?? '-')}</option>`;
    }).join('');
}

function renderTicketCategoryOptions(selectedCategoryId) {
    const categories = dashboardVm.ticketCategories ?? [];
    const selectedId = normalizeNullableId(selectedCategoryId);

    return categories.map(category => {
        const categoryId = normalizeNullableId(category.id);
        if (!categoryId) return '';
        return `<option value="${categoryId}" ${categoryId === selectedId ? 'selected' : ''} style="color:#000; background:#fff;">${escapeHtml(category.name ?? '-')}</option>`;
    }).join('');
}

function formatDateForInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
    const value = n / (1024 ** i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function clearCommentComposerDraft(ticketId) {
    const draft = commentAttachmentDrafts[ticketId] ?? [];

    for (const file of draft) {
        const url = commentAttachmentObjectUrlsByTicket[ticketId]?.[file.name];
        if (url) {
            URL.revokeObjectURL(url);
            delete commentAttachmentObjectUrlsByTicket[ticketId][file.name];
        }

        const stillReferenced = Object.values(commentAttachmentObjectUrlsByTicket)
            .some(map => map && map[file.name]);
        if (!stillReferenced) {
            delete commentAttachmentObjectUrls[file.name];
        }
    }

    commentAttachmentDrafts[ticketId] = [];
    const fileInput = document.getElementById(`commentFiles-${ticketId}`);
    if (fileInput) fileInput.value = '';
    renderCommentFilesList(ticketId);
}

// Report from tickets where  Supporter  was assigned to need  to reply
async function submitSupportReplyFromDetail(e) {
    e.preventDefault();

    const ticketId = Number(document.getElementById('replyTicketId')?.value || 0);
    const userId = Number(document.getElementById('replyUserId')?.value || 0);
    const summary = (document.getElementById('replySummary')?.value ?? '').trim();
    const adminFeedback = (document.getElementById('adminFeedback')?.value ?? '').trim();

    if (!ticketId || !summary) {
        showToast('Please fill the resolve beskrivelse.', 'error');
        return;
    }

    const comments = dashboardVm.comments ?? (dashboardVm.comments = []);
    const reports = dashboardVm.reports ?? (dashboardVm.reports = []);
    const history = dashboardVm.history ?? (dashboardVm.history = []);

    // Save resolve note as comment
    await fetch(`${apiBase}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ticketId,
            userId,
            commentText: summary,
          
        })
    });

    // Save admin feedback as internal comment
    if (adminFeedback) {
        await fetch(`${apiBase}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId,
                userId,
                commentText: `[Admin Feedback] ${adminFeedback}`,
              
            })
        });
    }

    // Save report
    const reportRes = await fetch(`${apiBase}/api/reports/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ticketId: ticketId,
            createdByUserId: userId,
            summary: summary.substring(0, 255),
            resolutionText: summary,
            qrTokenTtlMinutes: 60,
            reuseExistingReport: true
        })
    });

    if (reportRes.ok) {
        const reportData = await reportRes.json();
        showToast(`Rapport genereret! QR token klar.`);
        console.log('QR Token:', reportData.qrToken);

        //  Add notification to ticket creator and assigned user
        const ticket = (dashboardVm.tickets ?? []).find(t => t.id === ticketId);
        if (ticket) {
            // Notify ticket creator
            await fetch(`${apiBase}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: ticket.createdByUserId,
                    ticketId: ticketId,
                    type: 'Resolved',
                    message: `Ticket #${ticketId} has been resolved and a report has been generated.`
                })
            });

            // Notify assigned supporter if exists
            if (ticket.assignedToUserId) {
                await fetch(`${apiBase}/api/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: ticket.assignedToUserId,
                        ticketId: ticketId,
                        type: 'Resolved',
                        message: `Report generated for ticket #${ticketId} - ${ticket.title}.`
                    })
                });
            }
        }
    }
    // Refresh comments
    const freshComments = await fetch(`${apiBase}/api/comments`);
    if (freshComments.ok) dashboardVm.comments = await freshComments.json();

    const freshReports = await fetch(`${apiBase}/api/reports`);
    if (freshReports.ok) dashboardVm.reports = await freshReports.json();

    showToast('Reply submitted and report generated.');
    clearCommentComposerDraft(ticketId);
    await renderTicketDetail();
    await refreshNotifications();
}

function resolveReplyUserName(userId) {
    const user = (dashboardVm.users ?? []).find(x => x.id === userId);
    if (!user) return 'Unknown';

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (fullName) return fullName;
    return user.userName ?? 'Unknown';
}

function getUserDisplayNameById(userId) {
    const user = (dashboardVm.users ?? []).find(x => Number(x.id) === Number(userId));
    if (!user) return 'Unassigned';

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return user.userName || fullName || 'Unassigned';
}

// ============================================================================
// Task Title & Description Editing (inline)
// ============================================================================

function editTaskTitle(taskId) {
    const displayEl = document.getElementById(`taskTitleDisplay-${taskId}`);
    const inputEl = document.getElementById(`taskTitleInput-${taskId}`);

    if (!displayEl || !inputEl) return;

    displayEl.style.display = 'none';
    inputEl.style.display = 'block';
    inputEl.classList.add('editing');
    inputEl.focus();
    inputEl.select();
}

function editTaskDesc(taskId) {
    const displayEl = document.getElementById(`taskDescDisplay-${taskId}`);
    const inputEl = document.getElementById(`taskDescInput-${taskId}`);

    if (!displayEl || !inputEl) return;

    displayEl.style.display = 'none';
    inputEl.style.display = 'block';
    inputEl.classList.add('editing');
    inputEl.focus();
}

function cancelTaskEdit(taskId, isTitle = false) {
    if (isTitle) {
        const displayEl = document.getElementById(`taskTitleDisplay-${taskId}`);
        const inputEl = document.getElementById(`taskTitleInput-${taskId}`);
        if (displayEl && inputEl) {
            inputEl.style.display = 'none';
            inputEl.classList.remove('editing');
            displayEl.style.display = 'block';
        }
    } else {
        const displayEl = document.getElementById(`taskDescDisplay-${taskId}`);
        const inputEl = document.getElementById(`taskDescInput-${taskId}`);
        if (displayEl && inputEl) {
            inputEl.style.display = 'none';
            inputEl.classList.remove('editing');
            displayEl.style.display = 'block';
        }
    }
}


