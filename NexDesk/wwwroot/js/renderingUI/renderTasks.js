function renderTasks() {
    const tasksSection = document.getElementById('tasks');
    if (tasksSection) {
        const assignmentForm = tasksSection.querySelector('form.form-grid');
        const assignmentCard = assignmentForm?.closest('.card');
        const grid = tasksSection.querySelector('.grid');

        if (!isAdmin) {
            if (assignmentCard) assignmentCard.style.display = 'none';
            if (grid) grid.style.gridTemplateColumns = '1fr';
        } else {
            if (assignmentCard) assignmentCard.style.display = '';
            if (grid) grid.style.gridTemplateColumns = '';
        }
    }

    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    const allTasks = ((dashboardVm?.tasks?.length ? dashboardVm.tasks : state.tasks) ?? [])
        .filter(t => Number(t?.isActive ?? 1) === 1);
    const myUserId = Number(loggedInUserId || 0);
   
    const visibleTasks = isAdmin
        ? allTasks
        : allTasks.filter(t => {
            const assignedId = Number(t?.assignedUserId ?? t?.assignedToUserId ?? 0);
            return assignedId === myUserId;
        });

    if (!visibleTasks.length) {
        taskList.innerHTML = `<div class="tiny">${isAdmin ? 'No tasks yet.' : 'No tasks assigned to you.'}</div>`;
        return;
    }

    taskList.innerHTML = visibleTasks.map(t => `
            <div class="list-item" style="cursor:pointer;" onclick="openTaskFromList(${t.id}, ${t.ticketId})" title="Open task">
              <h4>${t.title}</h4>
              <div class="meta">
                <span>Ticket #${t.ticketId}</span>
                <span>${resolveTaskAssigneeLabel(t)}</span>
                <span>${t.dueDate || ''}</span>
              </div>
              <p>${t.description}</p>
            <div class="actions"><span class="badge ${statusBadgeClass(resolveTaskStatusName(t))}">${resolveTaskStatusName(t)}</span></div>            </div>
          `).join('');
}


function resolveTaskStatusName(task) {
    return task.status?.name
        ?? (dashboardVm.ticketStatuses ?? []).find(s => s.id === task.statusId)?.name
        ?? '-';
}
function resolveTaskAssigneeLabel(task) {
    const assignedId = Number(task?.assignedUserId ?? task?.assignedToUserId ?? 0);
    if (!assignedId) return 'Unassigned';

    const users = dashboardVm?.users ?? [];
    const user = users.find(u => Number(u?.id) === assignedId);
    if (!user) return typeof userName === 'function' ? userName(assignedId) : 'Unassigned';

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return user.userName || fullName || `User #${assignedId}`;
}

function openTaskFromList(taskId, ticketId) {
    const ticketDetailNavButton = document.querySelector('.nav button[data-view="ticketDetail"]');
    if (ticketDetailNavButton) {
        ticketDetailNavButton.click();
    }

    const ticketDetailSelect = document.getElementById('ticketDetailSelect');
    if (ticketDetailSelect && ticketId) {
        ticketDetailSelect.value = String(ticketId);
    }

    if (typeof openTaskEditorForEdit === 'function') {
        openTaskEditorForEdit(Number(taskId));
        return;
    }

    if (typeof openTicketDetail === 'function') {
        openTicketDetail(Number(ticketId));
    }
}



function createTask(e) {
    e.preventDefault();
    state.tasks.unshift({
        id: state.tasks.length ? Math.max(...state.tasks.map(x => x.id)) + 1 : 1,
        ticketId: Number(document.getElementById('taskTicketId').value),
        title: document.getElementById('taskTitle').value,
        assignedUserId: Number(document.getElementById('taskAssignedUserId').value),
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDueDate').value,
        isActive: true
    });
    e.target.reset();
    populateFormSelects();
    renderAll();
}
