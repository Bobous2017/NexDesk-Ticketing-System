function renderLookups() {
    document.getElementById('categoryList').innerHTML =
        (dashboardVm.ticketCategories ?? []).map(x => `<div class="list-item">${x.name}</div>`).join('');

    document.getElementById('departmentList').innerHTML =
        (dashboardVm.ticketDepartments ?? []).map(x => `<div class="list-item">${x.name}</div>`).join('');

    document.getElementById('priorityList').innerHTML =
        (dashboardVm.ticketPriorities ?? []).map(x => `<div class="list-item">${x.name}</div>`).join('');

    document.getElementById('statusList').innerHTML =
        (dashboardVm.ticketStatuses ?? []).map(x => `<div class="list-item">${x.name}</div>`).join('');
}