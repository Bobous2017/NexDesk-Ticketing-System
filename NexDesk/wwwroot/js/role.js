// Role CRUD JS (simplified, replace with actual AJAX calls)

// ── Roles ──────────────────────────────────────────
async function loadRoles() {
    const res = await fetch(`${apiBase}/api/roles`);
    if (!res.ok) {
        console.log('Roles failed:', res.status, await res.text());
        return;
    }
    const roles = await res.json();
    document.getElementById('rolesTableBody').innerHTML = roles.map(r => `
        <tr style="border-bottom:1px solid #243251;">
            <td style="padding:0.75rem 0.5rem;">${r.id}</td>
            
            <td style="padding:0.75rem 0.5rem;">${r.name}</td>
            <td style="padding:0.75rem 0.5rem;">${r.permissionLevel}</td>
            <td style="padding:0.75rem 0.5rem; text-align:right;">
                <button onclick="editRole(${r.id}, '${r.name}', ${r.permissionLevel})"
                    style="background:#ffb454; color:#000; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; margin-right:0.25rem;">
                    Rediger
                </button>
                <button onclick="deleteRole(${r.id})"
                    style="background:#ff6b6b; color:#fff; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer;">
                    Slet
                </button>
            </td>
            
        </tr>
    `).join('');
}
function showRoleForm() {
    document.getElementById('roleId').value = '';
    document.getElementById('roleName').value = '';
    document.getElementById('rolePermissionLevel').value = '';
    document.getElementById('roleForm').style.display = 'block';
}

function cancelRoleForm() {
    document.getElementById('roleForm').style.display = 'none';
}

function editRole(id, name, permissionLevel) {
    document.getElementById('roleId').value = id;
    document.getElementById('roleName').value = name;
    document.getElementById('rolePermissionLevel').value = permissionLevel;
    document.getElementById('roleForm').style.display = 'block';
}

async function saveRole() {
    const id = document.getElementById('roleId').value;
    const name = document.getElementById('roleName').value;
    if (!name) return alert('Navn er påkrævet.');

    const url = id ? `${apiBase}/api/roles/${id}` : `${apiBase}/api/roles`;
    const method = id ? 'PUT' : 'POST';
    const permissionLevel = Number(document.getElementById('rolePermissionLevel').value) || 1;
    const payload = id
        ? { id: Number(id), name, permissionLevel }
        : { name, permissionLevel };

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });


    if (res.ok) {
        cancelRoleForm();
        loadRoles();
        parent.showToast(id ? 'Rolle er opdateret!' : 'Rolle er oprettet!', 'success');
    } else {
        const err = await res.text();
        parent.showToast('Fejl ved gem.', 'error');
    }
}


//----------------- In role.js — delete with confirm ---------------------
async function deleteRole(id) {
    parent.showConfirm('Slet denne rolle?', async () => {
        const res = await fetch(`${apiBase}/api/roles/${id}`, { method: 'DELETE' });
        if (res.ok) { parent.showToast('Rolle slettet.', 'info'); loadRoles(); }
        else parent.showToast('Fejl ved sletning.', 'error');
    });
}


// Load roles when panel opens
//document.addEventListener('DOMContentLoaded', loadRoles);