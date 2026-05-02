// ── Users ──────────────────────────────────────────
let allUsers = []; // store for filtering
let allRoles = []; // store role metadata for user-form behavior

function roleRequiresRfid(roleId) {
    const role = allRoles.find(r => Number(r.id) === Number(roleId));
    if (!role) {
        const roleSelect = document.getElementById('uRoleId');
        const selectedText = roleSelect?.options?.[roleSelect.selectedIndex]?.text ?? '';
        return selectedText.toLowerCase().includes('admin');
    }
    if (Number(role.permissionLevel) === 3) return true;
    return String(role.name ?? '').toLowerCase().includes('admin');
}

function updateRfidFieldVisibility() {
    const roleId = document.getElementById('uRoleId')?.value;
    const rfidWrap = document.getElementById('uRfidField');
    const rfidInput = document.getElementById('uRfid');
    if (!rfidWrap || !rfidInput) return;

    const needsRfid = roleRequiresRfid(roleId);
    rfidWrap.style.display = needsRfid ? '' : 'none';
    rfidInput.disabled = !needsRfid;

    if (!needsRfid) {
        rfidInput.value = '';
    }
}

async function loadUsers() {
    const [usersRes, rolesRes] = await Promise.all([
        fetch(`${apiBase}/api/users`),
        fetch(`${apiBase}/api/roles`)
    ]);
    const users = await usersRes.json();
    const roles = await rolesRes.json();

    allUsers = users.map(u => ({
        ...u,
        roleName: roles.find(r => r.id === u.roleId)?.name ?? '-'
    }));

    // Populate role filter
    document.getElementById('userRoleFilter').innerHTML =
        '<option value="">Alle roller</option>' +
        roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    renderUsersTable(allUsers);
}

function filterUsers() {
    const q = document.getElementById('userSearch').value.toLowerCase();
    const roleId = document.getElementById('userRoleFilter').value;

    const filtered = allUsers.filter(u => {
        const matchQ = !q ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
            u.userName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q);
        const matchR = !roleId || String(u.roleId) === roleId;
        return matchQ && matchR;
    });

    renderUsersTable(filtered);
}

function renderUsersTable(users) {
    document.getElementById('usersTableBody').innerHTML = users.map(u => `
        <tr style="border-bottom:1px solid #243251;">
            <td style="padding:0.75rem 0.5rem;">${u.id}</td>
            <td style="padding:0.75rem 0.5rem;">${u.firstName} ${u.lastName}</td>
            <td style="padding:0.75rem 0.5rem;">${u.userName}</td>
            <td style="padding:0.75rem 0.5rem;">${u.email}</td>
            <td style="padding:0.75rem 0.5rem;">${u.roleName}</td>
            <td style="padding:0.75rem 0.5rem; text-align:right;">
                <button onclick="editUser(${u.id})" data-tooltip="btn-editUser"
                    style="background:#ffb454; color:#000; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; margin-right:0.25rem;">
                    Rediger
                </button>
                <button onclick="deleteUser(${u.id})" data-tooltip="btn-deleteUser"
                    style="background:#ff6b6b; color:#fff; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; margin-right:0.25rem;">
                    Slet
                </button>
                <button onclick="parent.openUserDetail(${u.id})" data-tooltip="btn-userProfile"
                    style="background:#4a9eff; color:#fff; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer;">
                    Profil
                </button>
            </td>
        </tr>
    `).join('');
}
async function loadRolesDropdown() {
    const res = await fetch(`${apiBase}/api/roles`);
    if (!res.ok) {
        updateRfidFieldVisibility();
        return;
    }
    const roles = await res.json();
    allRoles = roles;
    document.getElementById('uRoleId').innerHTML =
        roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    document.getElementById('uRoleId').onchange = updateRfidFieldVisibility;
    updateRfidFieldVisibility();
}

function showUserForm() {
    document.getElementById('userId').value = '';
    document.getElementById('uFirstName').value = '';
    document.getElementById('uLastName').value = '';
    document.getElementById('uUserName').value = '';
    document.getElementById('uEmail').value = '';
    document.getElementById('uPhone').value = '';
    document.getElementById('uRfid').value = '';
    document.getElementById('uPassword').value = '';
    updateRfidFieldVisibility();
    loadRolesDropdown();
    document.getElementById('userForm').style.display = 'block';
    document.getElementById('uSessionTimeout').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('uRoleId')?.addEventListener('change', updateRfidFieldVisibility);
    updateRfidFieldVisibility();
});

function cancelUserForm() {
    document.getElementById('userForm').style.display = 'none';
}

async function editUser(id) {
    const res = await fetch(`${apiBase}/api/users/${id}`);
    if (!res.ok) return;
    const u = await res.json();
    document.getElementById('userId').value = u.id;
    document.getElementById('uFirstName').value = u.firstName ?? '';
    document.getElementById('uLastName').value = u.lastName ?? '';
    document.getElementById('uUserName').value = u.userName ?? '';
    document.getElementById('uEmail').value = u.email ?? '';
    document.getElementById('uPhone').value = u.phone ?? '';
    document.getElementById('uRfid').value = u.rfidChip ?? '';
    document.getElementById('uPassword').value = '';
    await loadRolesDropdown();
    document.getElementById('uRoleId').value = u.roleId;
    updateRfidFieldVisibility();
    document.getElementById('userForm').style.display = 'block';

    // Load session timeout from UserProfile
    const profileRes = await fetch(`${apiBase}/api/userprofiles/byuser/${id}`);
    if (profileRes.ok) {
        const profile = await profileRes.json();
        document.getElementById('uSessionTimeout').value = profile.sessionTimeoutMinutes ?? '';
    } else {
        document.getElementById('uSessionTimeout').value = '';
    }
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const sessionVal = document.getElementById('uSessionTimeout').value;
    const selectedRoleId = Number(document.getElementById('uRoleId').value);
    const needsRfid = roleRequiresRfid(selectedRoleId);
    const payload = {
        id: id ? Number(id) : 0,
        firstName: document.getElementById('uFirstName').value,
        lastName: document.getElementById('uLastName').value,
        userName: document.getElementById('uUserName').value,
        email: document.getElementById('uEmail').value,
        phone: document.getElementById('uPhone').value,
        rfidChip: needsRfid ? document.getElementById('uRfid').value : null,
        roleId: selectedRoleId,
        passWord: document.getElementById('uPassword').value || null,
        sessionTimeoutMinutes: sessionVal ? Number(sessionVal) : null
    };

    const url = id ? `${apiBase}/api/users/${id}` : `${apiBase}/api/users`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        // ONLY update session timeout if editing existing user (has id)
        if (id) {
            await fetch(`${apiBase}/api/users/${id}/session`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Number(id), sessionTimeoutMinutes: sessionVal ? Number(sessionVal) : null })
            });
        }

        cancelUserForm();
        loadUsers();
        parent.showToast(id ? 'Bruger er opdateret!' : 'Bruger er oprettet!', 'success');
    } else {
        const err = await res.text();
        console.log('Create error:', err);
        parent.showToast('Fejl ved gem.', 'error');
    }
}



//----------------- In user.js — delete with confirm ---------------------
// deleteUser
async function deleteUser(id) {
    parent.showConfirm('Slet denne bruger?', async () => {
        const res = await fetch(`${apiBase}/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            parent.showToast('Bruger slettet.', 'info');
            loadUsers();
        } else {
            const err = await res.text();
            console.log('Delete error:', err); // ← add this
            parent.showToast('Fejl ved sletning.', 'error');
        }
    });
}


// Load users when panel opens
//document.addEventListener('DOMContentLoaded', loadUsers);


