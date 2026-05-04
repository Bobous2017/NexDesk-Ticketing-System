function openCreateTicket() {
    document.getElementById('modalTitle').textContent = 'Create Ticket';
    document.getElementById('editTicketId').value = '';
    document.getElementById('fTitle').value = '';
    document.getElementById('fDesc').value = '';
    document.getElementById('fDueDate').value = '';
    populateModalSelects();
    document.getElementById('modalOverlay').style.display = 'block';
}

function openEditTicket(id) {
    const tickets = dashboardVm.tickets ?? [];
    const t = tickets.find(x => x.id === id);
    if (!t) return;
    document.getElementById('modalTitle').textContent = 'Edit Ticket #' + id;
    document.getElementById('editTicketId').value = id;
    document.getElementById('fTitle').value = t.title ?? '';
    document.getElementById('fDesc').value = t.description ?? '';
    document.getElementById('fDueDate').value =
        t?.dueDate ? t.dueDate.substring(0, 16) : '';
    populateModalSelects(t);
    document.getElementById('modalOverlay').style.display = 'block';
}


function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function populateModalSelects(t = null) {
    document.getElementById('fCategory').innerHTML = (dashboardVm.ticketCategories ?? []).map(x => `<option value="${x.id}" ${t?.ticketCategoryId == x.id ? 'selected' : ''}>${x.name}</option>`).join('');
    document.getElementById('fPriority').innerHTML = (dashboardVm.ticketPriorities ?? []).map(x => `<option value="${x.id}" ${t?.ticketPriorityId == x.id ? 'selected' : ''}>${x.name}</option>`).join('');
    document.getElementById('fStatus').innerHTML = (dashboardVm.ticketStatuses ?? []).map(x => `<option value="${x.id}" ${t?.statusId == x.id ? 'selected' : ''}>${x.name}</option>`).join('');
    document.getElementById('fDepartment').innerHTML = (dashboardVm.ticketDepartments ?? []).map(x => `<option value="${x.id}" ${t?.ticketDepartmentId == x.id ? 'selected' : ''}>${x.name}</option>`).join('');

    // Build unique users from tickets assignedToName + assignedToUserId
    const tickets = dashboardVm.tickets ?? [];
    const seen = new Set();
    const users = [];
    tickets.forEach(x => {
        if (x.assignedToUserId && !seen.has(x.assignedToUserId)) {
            seen.add(x.assignedToUserId);
            users.push({ id: x.assignedToUserId, name: x.assignedToName });
        }
    });

    document.getElementById('fAssign').innerHTML =
        '<option value="">Unassigned</option>' +
        (isAdmin
            ? (dashboardVm.users ?? [])
            : (dashboardVm.users ?? []).filter(u => u.id == loggedInUserId)
        ).map(u => {
            const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName;
            const selected = t?.assignedToUserId == u.id ? 'selected' : '';
            return `<option value="${u.id}" ${selected}>${fullName}</option>`;
        }).join('');
}

async function saveTicket() {
    const id = document.getElementById('editTicketId').value;
    const assignValue = document.getElementById('fAssign').value;
    const newAssignedId = assignValue === '' ? null : Number(assignValue);

    const payload = {
        id: id ? Number(id) : 0,
        createdByUserId: loggedInUserId,
        title: document.getElementById('fTitle').value,
        description: document.getElementById('fDesc').value,
        ticketCategoryId: Number(document.getElementById('fCategory').value),
        ticketPriorityId: Number(document.getElementById('fPriority').value),
        statusId: Number(document.getElementById('fStatus').value),
        ticketDepartmentId: Number(document.getElementById('fDepartment').value),
        assignedToUserId: newAssignedId,
        dueDate: document.getElementById('fDueDate').value || null
    };

    if (id) payload.id = Number(id);

    // Detect assignment change on edit
    const existingTicket = id ? (dashboardVm.tickets ?? []).find(x => x.id === Number(id)) : null;
    const previousAssignedId = existingTicket?.assignedToUserId ?? null;
    const assigneeChanged = id && newAssignedId && String(newAssignedId) !== String(previousAssignedId);

    async function doSave(sendEmail) {
        const url = id ? `${apiBase}/api/Tickets/${id}?sendEmail=${sendEmail}` : `${apiBase}/api/Tickets`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal();
            showToast(id ? 'Ticket updated successfully!' : 'Ticket created successfully!');

            const freshRes = await fetch(`${apiBase}/api/tickets`);
            if (freshRes.ok) {
                const freshTickets = await freshRes.json();
                dashboardVm.tickets = freshTickets.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    ticketCategoryId: t.ticketCategoryId,
                    categoryName: t.ticketCategory?.name ?? '-',
                    ticketPriorityId: t.ticketPriorityId,
                    priorityName: t.ticketPriority?.name ?? '-',
                    statusId: t.statusId,
                    statusName: t.status?.name ?? '-',
                    ticketDepartmentId: t.ticketDepartmentId,
                    departmentName: t.ticketDepartment?.name ?? '-',
                    assignedToUserId: t.assignedToUserId,
                    assignedToName: t.assignedToUser
                        ? `${t.assignedToUser.firstName} ${t.assignedToUser.lastName}`.trim()
                        : 'Unassigned',
                    dueDate: t.dueDate
                }));
                renderTickets();
            }
        } else {
            const err = await res.text();
            showToast('Failed to save ticket.', 'error');
            console.log('Error:', err);
        }
    }
    //alert('assigneeChanged: ' + assigneeChanged + ' | new: ' + newAssignedId + ' | previous: ' + previousAssignedId);
    if (assigneeChanged) {
        showConfirm('Would you like to send an email to the supporter?', () => doSave(true));
        document.querySelector('#genericConfirmOverlay .btn').onclick = () => {
            document.getElementById('genericConfirmOverlay').style.display = 'none';
            doSave(false);
        };
    } else {
        await doSave(false);
    }
}

async function deleteTicket(id) {
    showConfirm(`Er du sikker på, at du vil slette ticket #${id}?`, async () => {
        const res = await fetch(`${apiBase}/api/Tickets/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Ticket slettet.', 'info');
            setTimeout(() => location.reload(), 2000);
        } else {
            showToast('Kunne ikke slette ticket.', 'error');
        }
    });
}
function openTicketDetail(ticketId) {
    document.querySelector('[data-view="ticketDetail"]').click();
    document.getElementById('ticketDetailSelect').value = String(ticketId);
    document.getElementById('replyTicketId').value = String(ticketId);
    renderTicketDetail();
}