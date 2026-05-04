function renderHistory() {
    const items = dashboardVm.history ?? [];
    document.getElementById('historyList').innerHTML = items.length
        ? items.map(h => `
              <div class="list-item">
                <h4>${h.actionType ?? '-'}</h4>
                <div class="meta">
                  <span>${h.changedByUserName ?? 'Unknown'}</span>
                  <span>Ticket #${h.ticketId}</span>
                  <span>${h.createdAt}</span>
                </div>
                <p><strong>Old:</strong> ${h.oldValue ?? '-'}<br><strong>New:</strong> ${h.newValue ?? '-'}</p>
              </div>
            `).join('')
        : `<div class="list-item"><div class="tiny">No history found.</div></div>`;
}

async function deleteHistoryEntry(historyId, ticketId) {
    if (!confirm('Are you sure you want to delete this history entry?')) return;

    const res = await fetch(`${apiBase}/api/history/${historyId}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        showToast('Failed to delete history entry.', 'error');
        return;
    }

    // Remove from dashboardVm
    dashboardVm.history = (dashboardVm.history ?? []).filter(h => h.id !== historyId);

    showToast('History entry deleted.');
    await renderTicketDetail();
}