// ── Departments ──────────────────────────────────────────
async function loadDepartments() {
    const res = await fetch(`${apiBase}/api/ticketdepartments`);
    if (!res.ok) { console.log('Departments failed:', res.status); return; }
    const items = await res.json();
    document.getElementById('departmentsTableBody').innerHTML = items.map(d => `
        <tr style="border-bottom:1px solid #243251;">
            <td style="padding:0.75rem 0.5rem;">${d.id}</td>
            <td style="padding:0.75rem 0.5rem;">${d.name}</td>
            <td style="padding:0.75rem 0.5rem; text-align:right;">
                <button onclick="editDepartment(${d.id}, '${d.name}')"
                    style="background:#ffb454; color:#000; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; margin-right:0.25rem;">
                    Rediger
                </button>
                <button onclick="deleteDepartment(${d.id})"
                    style="background:#ff6b6b; color:#fff; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer;">
                    Slet
                </button>
            </td>
        </tr>
    `).join('');
}

function showDepartmentForm() {
    document.getElementById('departmentId').value = '';
    document.getElementById('departmentName').value = '';
    document.getElementById('departmentForm').style.display = 'block';
}

function cancelDepartmentForm() {
    document.getElementById('departmentForm').style.display = 'none';
}

function editDepartment(id, name) {
    document.getElementById('departmentId').value = id;
    document.getElementById('departmentName').value = name;
    document.getElementById('departmentForm').style.display = 'block';
}

async function saveDepartment() {
    const id = document.getElementById('departmentId').value;
    const name = document.getElementById('departmentName').value;
    if (!name) return alert('Navn er påkrævet.');

    const url = id ? `${apiBase}/api/ticketdepartments/${id}` : `${apiBase}/api/ticketdepartments`;
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { id: Number(id), name } : { name };

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        cancelDepartmentForm();
        loadDepartments();
        parent.showToast(id ? 'Afdeling er opdateret!' : 'Afdeling er oprettet!', 'success');
    } else {
        const err = await res.text();
        console.log('Department error:', err);
        parent.showToast('Fejl ved gem.', 'error');
    }
}

async function deleteDepartment(id) {
    parent.showConfirm('Slet denne afdeling?', async () => {
        const res = await fetch(`${apiBase}/api/ticketdepartments/${id}`, { method: 'DELETE' });
        if (res.ok) {
            parent.showToast('Afdeling slettet.', 'info');
            loadDepartments();
        } else {
            parent.showToast('Fejl ved sletning.', 'error');
        }
    });
}

//document.addEventListener('DOMContentLoaded', loadDepartments);