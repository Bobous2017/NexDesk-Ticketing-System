async function addComment(ticketId) {
    const textarea = document.getElementById(`newComment-${ticketId}`);
    const text = (textarea?.value ?? '').trim();
    if (!text) {
        showToast('Please write a comment.', 'error');
        return;
    }

    const files = commentAttachmentDrafts[ticketId] ?? [];

    // Upload files first
    const uploadedAttachments = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append('ticketId', ticketId);
        formData.append('uploadedByUserId', loggedInUserId);
        formData.append('file', file);

        const uploadRes = await fetch(`${apiBase}/api/attachments/upload`, {
            method: 'POST',
            body: formData
        });

        if (uploadRes.ok) {
            const uploaded = await uploadRes.json();
            uploadedAttachments.push(uploaded);
        } else {
            showToast(`Failed to upload ${file.name}`, 'error');
        }
    }

    // Build comment text with attachment names
    let commentText = text;
    if (uploadedAttachments.length) {
        const attachmentLines = uploadedAttachments.map(a => `- ${a.fileName}`).join('\n');
        commentText += `\n\nAttachments:\n${attachmentLines}`;
    }

    // Save comment
    const res = await fetch(`${apiBase}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ticketId,
            userId: loggedInUserId,
            commentText
        })
    });

    if (!res.ok) {
        showToast('Failed to add comment.', 'error');
        return;
    }

    // Refresh comments
    const freshComments = await fetch(`${apiBase}/api/comments`);
    if (freshComments.ok) dashboardVm.comments = await freshComments.json();

    clearCommentComposerDraft(ticketId);
    if (textarea) textarea.value = '';
    showToast('Comment added.');
    await renderTicketDetail();
}

async function deleteComment(commentId, ticketId) {
    showConfirm('Slet denne kommentar?', async () => {
        const res = await fetch(`${apiBase}/api/comments/${commentId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Kommentar slettet.', 'info');
            // Remove from local dashboardVm and re-render
            dashboardVm.comments = dashboardVm.comments.filter(c => c.id !== commentId);
            renderTicketDetail();
        } else {
            showToast('Fejl ved sletning.', 'error');
        }
    });
}
function renderComments() {
    const items = dashboardVm.comments ?? [];
    document.getElementById('commentList').innerHTML = items.length
        ? items.map(c => `
              <div class="list-item">
                <h4>${c.userName ?? 'Unknown'}</h4>
                <div class="meta">
                  <span>Ticket #${c.ticketId}</span>
                  <span>${c.createdAt}</span>
                </div>
                <p>${c.commentText ?? ''}</p>
              </div>
            `).join('')
        : `<div class="list-item"><div class="tiny">No comments found.</div></div>`;
}