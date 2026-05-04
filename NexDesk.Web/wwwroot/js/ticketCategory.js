// ── Categories ──────────────────────────────────────────
async function loadCategories() {
    const res = await fetch(`${apiBase}/api/ticketcategories`);
    if (!res.ok) { console.log('Categories failed:', res.status); return; }
    const items = await res.json();
    document.getElementById('categoriesTableBody').innerHTML = items.map(c => `
        <tr style="border-bottom:1px solid #243251;">
            <td style="padding:0.75rem 0.5rem;">${c.id}</td>
            <td style="padding:0.75rem 0.5rem;">${c.name}</td>
            <td style="padding:0.75rem 0.5rem; text-align:right;">
                <button onclick="editCategory(${c.id}, '${c.name}')"
                    style="background:#ffb454; color:#000; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; margin-right:0.25rem;">
                    Rediger
                </button>
                <button onclick="deleteCategory(${c.id})"
                    style="background:#ff6b6b; color:#fff; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer;">
                    Slet
                </button>
            </td>
        </tr>
    `).join('');
}
function showCategoryForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryForm').style.display = 'block';
}
function cancelCategoryForm() {
    document.getElementById('categoryForm').style.display = 'none';
}
function editCategory(id, name) {
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryName').value = name;
    document.getElementById('categoryForm').style.display = 'block';
}

async function saveCategory() {
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;
    if (!name) return alert('Navn er påkrævet.');

    const url = id ? `${apiBase}/api/ticketcategories/${id}` : `${apiBase}/api/ticketcategories`;
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { id: Number(id), name } : { name };

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        cancelCategoryForm();
        loadCategories();
        parent.showToast(id ? 'Kategori er opdateret!' : 'Kategori er oprettet!', 'success');
    } else {
        const err = await res.text();
        console.log('Category error:', err);
        parent.showToast('Fejl ved gem.', 'error');
    }
}

async function deleteCategory(id) {
    parent.showConfirm('Slet denne kategori?', async () => {
        const res = await fetch(`${apiBase}/api/ticketcategories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            parent.showToast('Kategori slettet.', 'info');
            loadCategories();
        } else {
            parent.showToast('Fejl ved sletning.', 'error');
        }
    });
}

//document.addEventListener('DOMContentLoaded', loadCategories);