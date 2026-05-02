const qrAccessGrantCache = {}; // { [reportId]: { grant: string, expiresAtUtc: string } }
const qrDetailExportState = { report: null, ticket: null };

function cacheQrAccessGrant(reportId, accessGrant, accessGrantExpiresAtUtc) {
    qrAccessGrantCache[reportId] = {
        grant: accessGrant,
        expiresAtUtc: accessGrantExpiresAtUtc
    };
    // Refresh the QR detail display if this report is currently selected
    const select = document.getElementById('qrDetailSelect');
    if (select && Number(select.value) === Number(reportId)) {
        loadAndRenderSecureQrDetail(reportId);
    }
}

function renderQrDetail() {
    const select = document.getElementById('qrDetailSelect');
    if (!select) return;

    const reports = Array.isArray(dashboardVm?.reports) ? dashboardVm.reports : [];
    if (!reports.length) {
        const host = document.getElementById('qrDetailBox');
        if (host) host.innerHTML = `<div class="tiny">No report found.</div>`;
        return;
    }

    const reportId = Number(select.value || reports[0]?.id || 1);
    loadAndRenderSecureQrDetail(reportId);
}


// QR report UI in
async function loadAndRenderSecureQrDetail(reportId) {
    const host = document.getElementById('qrDetailBox');
    if (!host) return;

    const reports = dashboardVm.reports ?? [];
    const report = reports.find(x => Number(x.id) === Number(reportId));
    if (!report) {
        qrDetailExportState.report = null;
        qrDetailExportState.ticket = null;
        host.innerHTML = `<div class="tiny">No report found.</div>`;
        return;
    }

    const grantEntry = qrAccessGrantCache[reportId];
    if (!grantEntry?.grant || isGrantExpired(grantEntry.expiresAtUtc)) {
        qrDetailExportState.report = null;
        qrDetailExportState.ticket = null;
        host.innerHTML = `
            <div class="list-item">
              <div class="tiny">QR detail access is blocked until MAUI approval is completed.</div>
            </div>`;
        return;
    }

    const url = `${apiBase}/api/reports/${reportId}/secure?grant=${encodeURIComponent(grantEntry.grant)}`;
    const res = await fetch(url);
    if (!res.ok) {
        qrDetailExportState.report = null;
        qrDetailExportState.ticket = null;
        const errorText = await res.text();
        host.innerHTML = `<div class="list-item"><div class="tiny">${qrEscape(errorText || 'Secure report access denied.')}</div></div>`;
        return;
    }

    const secureReport = await res.json();
    const tickets = dashboardVm.tickets ?? [];
    const ticket = tickets.find(x => Number(x.id) === Number(secureReport.ticketId));
    qrDetailExportState.report = secureReport;
    qrDetailExportState.ticket = ticket ?? null;

    // ── Enrich with local data ──
    const allComments = (dashboardVm.comments ?? []).filter(c => c.ticketId === secureReport.ticketId);
    const allTasks = (dashboardVm.tasks ?? []).filter(t => t.ticketId === secureReport.ticketId);
    const attachments = extractCommentAttachments(allComments);
    let ticketAttachments = [];
    try {
        const attRes = await fetch(`${apiBase}/api/attachments/ticket/${secureReport.ticketId}`);
        if (attRes.ok) ticketAttachments = await attRes.json();
    } catch { ticketAttachments = []; }

    const taskResolveNotes = allComments.filter(c => (c.commentText ?? '').startsWith('[Task:'));

    // People involved
    const involvedIds = new Set();
    if (ticket?.assignedToUserId) involvedIds.add(ticket.assignedToUserId);
    allTasks.forEach(t => { if (t.assignedUserId) involvedIds.add(t.assignedUserId); });
    const involvedUsers = (dashboardVm.users ?? []).filter(u => involvedIds.has(u.id));

    // Closed state
    const isClosed = !!secureReport.closedAt;
    const closedBadge = isClosed
        ? `<span style="background:#c0392b;color:#fff;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;">Lukket</span>`
        : `<span style="background:#27ae60;color:#fff;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;">Åben</span>`;

    const closeBtnHtml = (isAdmin && !isClosed)
        ? `<button type="button" class="btn danger" onclick="openCloseReportPopup(${secureReport.id})">Luk Ticket</button>`
        : '';

    // ── Thread HTML ──
    const threadHtml = allComments.length
        ? allComments.map(c => `
            <div style="padding:0.5rem 0; border-bottom:1px solid #243251; font-size:0.85rem;">
                <strong>${qrEscape(c.userName ?? 'Unknown')}</strong>: ${qrEscape(c.commentText ?? '')}
                <span style="color:#8899aa; font-size:0.75rem; margin-left:0.5rem;">${formatQrDate(c.createdAt)}</span>
            </div>`).join('')
        : '<div class="tiny">Ingen kommentarer.</div>';

    // ── Tasks HTML ──
    const tasksHtml = allTasks.length
        ? allTasks.map(t => {
            const assignedUser = (dashboardVm.users ?? []).find(u => u.id === t.assignedUserId);
            const assignedName = assignedUser
                ? `${assignedUser.firstName ?? ''} ${assignedUser.lastName ?? ''}`.trim()
                : 'Unassigned';
            const resolveNote = taskResolveNotes.find(c => c.commentText?.includes(`[Task: ${t.title}]`));
            const resolveText = resolveNote
                ? resolveNote.commentText.replace(`[Task: ${t.title}] `, '')
                : 'Ikke angivet';
            const status = (dashboardVm.ticketStatuses ?? []).find(s => s.id === t.statusId);
            return `
            <div style="background:#0d1626; border:1px solid #2a3f5f; border-radius:8px; padding:0.75rem; margin-bottom:0.5rem;">
                <div style="font-weight:600;">📋 ${qrEscape(t.title ?? '-')}</div>
                <div style="font-size:0.8rem; color:#8899aa; margin-top:4px;">${qrEscape(t.description ?? '-')}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Status:</strong> ${qrEscape(status?.name ?? '-')}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Assigned:</strong> ${qrEscape(assignedName)}</div>
                <div style="font-size:0.8rem; margin-top:4px;"><strong>Rapport:</strong> ${qrEscape(resolveText)}</div>
            </div>`;
        }).join('')
        : '<div class="tiny">Ingen tasks.</div>';

    // ── Attachments HTML — both WebForm originals and thread attachments ──
    const originalAttachmentsHtml = ticketAttachments.length
        ? `<div style="font-size:0.8rem; color:#9fb0d0; margin-bottom:0.4rem;">📋 Original attachments from ticket creator:</div>` +
        ticketAttachments.map(a => `
        <div style="font-size:0.85rem;">
            📎 <a href="${a.downloadUrl}" 
                target="_blank"
                style="color:#9ecbff;text-decoration:underline;cursor:pointer;">
                ${qrEscape(a.fileName)}
            </a>
            <span style="color:#6b7fa3; margin-left:0.5rem; font-size:0.75rem;">
                ${qrEscape(a.uploadedByUserName ?? 'User')}
            </span>
        </div>`).join('')
        : '';

    const threadAttachmentsHtml = attachments.length
        ? `<div style="font-size:0.8rem; color:#9fb0d0; margin-bottom:0.4rem; margin-top:0.5rem;">📋 Attachments from thread:</div>` +
        attachments.map(f => `
        <div style="font-size:0.85rem;">
            📎 <a href="javascript:void(0)" 
                onclick="openCommentAttachment('${encodeURIComponent(f)}')"
                style="color:#9ecbff;text-decoration:underline;cursor:pointer;">
                ${qrEscape(f)}
            </a>
        </div>`).join('')
        : '';

    const attachmentsHtml = (originalAttachmentsHtml || threadAttachmentsHtml)
        ? originalAttachmentsHtml + threadAttachmentsHtml
        : '<div class="tiny">Ingen vedhæftede filer.</div>';

    // ── People involved HTML ──
    const peopleHtml = involvedUsers.length
        ? involvedUsers.map(u => {
            const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName;
            const roleMap = { 1: 'Admin', 2: 'Supporter', 3: 'User' };
            const role = u.roleName ?? roleMap[u.roleId] ?? '—';
            return `<div style="font-size:0.85rem;">👤 ${qrEscape(name)} <span style="color:#8899aa;">(${qrEscape(role)})</span></div>`;
        }).join('')
        : '<div class="tiny">Ingen.</div>';

    // ── Admin Feedback HTML ──
    const adminFeedbackHtml = isClosed ? `
        <div class="divider"></div>
        <div class="qr-detail-summary">
            <h4>Admin Feedback</h4>
            <p>${qrEscape(secureReport.adminFeedback ?? 'Ikke angivet')}</p>
            <div class="tiny" style="color:#9fb0d0;">Lukket: ${formatQrDate(secureReport.closedAt)}</div>
        </div>` : '';

    host.innerHTML = `
        <div class="qr-detail-shell" id="qrDetailPrintable">
            <div class="qr-detail-head">
                <div>
                    <div class="qr-detail-kicker">Secure dossier</div>
                    <h3 class="qr-detail-title">QR Verified Report #${secureReport.id} ${closedBadge}</h3>
                    <div class="tiny">Exclusive report view unlocked after MAUI approval.</div>
                </div>
              <div class="qr-detail-actions">
                    <button type="button" class="btn primary" onclick="saveQrDetailAsPdf()">Save PDF</button>
                    <button type="button" class="btn" style="background:#e67e22;color:#fff;" onclick="sendEmailToCustomer(${secureReport.id})">📧 Send til Kunde</button>
                    ${closeBtnHtml}
                </div>
            </div>

            <div class="info-grid">
                <div class="info-chip"><strong>Report</strong><div class="tiny">#${secureReport.id}</div></div>
                <div class="info-chip"><strong>Ticket</strong><div class="tiny">#${secureReport.ticketId} - ${qrEscape(ticket?.title ?? secureReport.ticketTitle ?? '')}</div></div>
                <div class="info-chip"><strong>Created By</strong><div class="tiny">${qrEscape(secureReport.createdByUserName ?? 'Unknown')}</div></div>
                <div class="info-chip"><strong>Created At</strong><div class="tiny">${formatQrDate(secureReport.createdAt)}</div></div>
            </div>

            <!-- Ticket Info -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>Ticket Info</h4>
                <div style="font-size:0.85rem;"><strong>Assigned to:</strong> ${qrEscape(ticket?.assignedToName ?? 'Unassigned')}</div>
                <div style="font-size:0.85rem; margin-top:4px;"><strong>Status:</strong> ${qrEscape(ticket?.statusName ?? '-')}</div>
                <div style="font-size:0.85rem; margin-top:4px;"><strong>Priority:</strong> ${qrEscape(ticket?.priorityName ?? '-')}</div>
                <div style="font-size:0.85rem; margin-top:4px;"><strong>Department:</strong> ${qrEscape(ticket?.departmentName ?? '-')}</div>
            <div style="font-size:0.85rem; margin-top:4px;"><strong>Description:</strong> ${qrEscape(ticket?.description ?? '-')}</div>
           </div>

            <!-- People Involved -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>People Involved</h4>
                ${peopleHtml}
            </div>

            <!-- Executive Summary -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>Executive Summary</h4>
                <p><strong>${qrEscape(secureReport.summary ?? '')}</strong></p>
                <p>${qrEscape(secureReport.resolutionText ?? '')}</p>
            </div>

            <!-- Ticket Thread -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>Ticket Thread</h4>
                ${threadHtml}
            </div>

            <!-- Tasks -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>Tasks</h4>
                ${tasksHtml}
            </div>

            <!-- Attachments -->
            <div class="divider"></div>
            <div class="qr-detail-summary">
                <h4>Attachments</h4>
                ${attachmentsHtml}
            </div>

            ${adminFeedbackHtml}
        </div>`;
}

// Close  model Pop  for Report Admin side
function openCloseReportPopup(reportId) {
    const existing = document.getElementById('closeReportOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'closeReportOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML = `
      <div style="background:#111a2e;border:1px solid #2a3f5f;border-radius:14px;padding:1.5rem;width:min(92vw,480px);box-shadow:0 16px 40px rgba(0,0,0,0.45);">
        <h3 style="color:#e6eefc;margin:0 0 0.5rem;">Luk Ticket</h3>
        <p style="color:#9fb0d0;font-size:0.9rem;margin-bottom:1rem;">Skriv admin feedback inden du lukker ticket. Supportere modtager en e-mail.</p>
        <textarea id="closeReportFeedback" rows="4"
          style="width:100%;background:#0d1626;border:1px solid #2a3f5f;color:#e6eefc;border-radius:8px;padding:0.75rem;font-size:0.9rem;resize:vertical;box-sizing:border-box;"
          placeholder="Admin feedback (valgfrit)..."></textarea>
        <div style="display:flex;gap:0.75rem;margin-top:1rem;justify-content:flex-end;">
          <button type="button" class="btn" onclick="document.getElementById('closeReportOverlay').remove()">Annuller</button>
          <button type="button" class="btn danger" onclick="confirmCloseReport(${reportId})">Bekræft Luk</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
}

// Send  email  to Customer regarless the ticket is closed or not
async function sendEmailToCustomer(reportId) {
    const report = qrDetailExportState.report;
    const ticket = qrDetailExportState.ticket;

    // Try to get customer email from ticket creator
    const creator = (dashboardVm.users ?? []).find(u => u.id === ticket?.createdByUserId);
    const defaultEmail = creator?.email ?? '';

    const existing = document.getElementById('customerEmailOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customerEmailOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML = `
        <div style="background:#111a2e;border:1px solid #2a3f5f;border-radius:14px;padding:1.5rem;width:min(92vw,480px);box-shadow:0 16px 40px rgba(0,0,0,0.45);">
            <h3 style="color:#e6eefc;margin:0 0 0.5rem;">📧 Send Email til Kunde</h3>
            <p style="color:#9fb0d0;font-size:0.9rem;margin-bottom:1rem;">
                Bekræft eller ændr kundens email-adresse.
            </p>
            <div style="margin-bottom:0.75rem;">
                <label style="font-size:0.85rem;color:#9fb0d0;">Ticket</label>
                <div style="color:#e6eefc;font-weight:600;">#${ticket?.id} — ${ticket?.title ?? ''}</div>
                <div style="color:#9fb0d0;font-size:0.82rem;margin-top:4px;">${ticket?.description ?? ''}</div>
            </div>
            <div style="margin-bottom:1rem;">
                <label style="font-size:0.85rem;color:#9fb0d0;display:block;margin-bottom:4px;">Modtager email</label>
                <input id="customerEmailInput" type="email" 
                    value="${defaultEmail}"
                    style="width:100%;background:#0d1626;border:1px solid #2a3f5f;color:#e6eefc;border-radius:8px;padding:0.75rem;font-size:0.9rem;box-sizing:border-box;"
                    placeholder="kunde@email.dk" />
            </div>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                <button type="button" class="btn" onclick="document.getElementById('customerEmailOverlay').remove()">Annuller</button>
                <button type="button" class="btn" style="background:#e67e22;color:#fff;" onclick="confirmSendCustomerEmail(${reportId})">Send Email</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
}

async function confirmSendCustomerEmail(reportId, forceResend = false) {
    const email = document.getElementById('customerEmailInput')?.value?.trim();
    if (!email) {
        showToast('Indtast en gyldig email.', 'error');
        return;
    }

    const res = await fetch(`${apiBase}/api/reports/${reportId}/send-customer-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email, forceResend })
    });

    // Email already sent to this address
    if (res.status === 409) {
        const data = await res.json();
        const sentDate = formatQrDate(data.sentAt);
        showConfirm(
            `Denne email (${email}) har allerede modtaget denne rapport (${sentDate}). Vil du sende igen?`,
            () => confirmSendCustomerEmail(reportId, true)
        );
        document.querySelector('#genericConfirmOverlay .btn').onclick = () => {
            document.getElementById('genericConfirmOverlay').style.display = 'none';
        };
        return;
    }

    if (res.ok) {
        document.getElementById('customerEmailOverlay')?.remove();
        showToast('Email sendt til kunden!');

        // Refresh reports in memory
        const freshReports = await fetch(`${apiBase}/api/reports`);
        if (freshReports.ok) {
            dashboardVm.reports = await freshReports.json();
            renderQrList();
        }
    } else {
        const err = await res.text();
        showToast(err || 'Kunne ikke sende email.', 'error');
    }
}

async function confirmCloseReport(reportId) {
    const feedback = document.getElementById('closeReportFeedback')?.value?.trim() ?? '';

    const res = await fetch(`${apiBase}/api/reports/${reportId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminFeedback: feedback })
    });

    if (!res.ok) {
        const err = await res.text();
        showToast(err || 'Kunne ikke lukke rapporten.', 'error');
        return;
    }

    document.getElementById('closeReportOverlay')?.remove();
    showToast('Ticket lukket og e-mails sendt.');

    // Refresh data
    const freshReports = await fetch(`${apiBase}/api/reports`);
    if (freshReports.ok) dashboardVm.reports = await freshReports.json();

   
    // Re-render the detail view
    // Update ticket status in memory so detail view reflects closed state
    const closedTicket = (dashboardVm.tickets ?? []).find(t => t.id === qrDetailExportState.ticket?.id);
    if (closedTicket) {
        closedTicket.statusId = getStatusIdByName('closed') ?? closedTicket.statusId;
        closedTicket.statusName = 'Closed';
    }
    loadAndRenderSecureQrDetail(reportId);
    renderTickets();
}


function submitSupportReply(e) {
    e.preventDefault();
    const ticketId = Number(document.getElementById('replyTicketId').value);
    const userId = Number(document.getElementById('replyUserId').value);
    const summary = document.getElementById('replySummary').value;
    const resolution = document.getElementById('replyResolution').value;
    const attachmentName = document.getElementById('replyAttachment').value.trim();
    const ticket = state.tickets.find(x => x.id === ticketId);
    if (!ticket) return;

    state.comments.unshift({
        id: state.comments.length ? Math.max(...state.comments.map(x => x.id)) + 1 : 1,
        ticketId,
        userId,
        commentText: resolution,
        createdAt: new Date().toLocaleString()
    });

    const reportId = state.reports.length ? Math.max(...state.reports.map(x => x.id)) + 1 : 1;
    const qrCode = `QR-REPORT-${String(reportId).padStart(3, '0')}`;
    state.reports.unshift({
        id: reportId,
        ticketId,
        createdByUserId: userId,
        summary,
        resolutionText: resolution,
        createdAt: new Date().toLocaleString(),
        qrCode
    });

    if (attachmentName) {
        state.attachments.unshift({
            id: state.attachments.length ? Math.max(...state.attachments.map(x => x.id)) + 1 : 1,
            ticketId,
            reportId,
            uploadedByUserId: userId,
            fileName: attachmentName,
            fileType: attachmentName.endsWith('.pdf') ? 'application/pdf' : 'image/png'
        });
    }

    ticket.ticketStatusId = 4;
    e.target.reset();
    populateFormSelects();
    renderAll();
    document.querySelector('[data-view="qrList"]').click();
}


function openQrDetail(reportId) {
    const report = (dashboardVm.reports ?? []).find(x => Number(x.id) === Number(reportId));
    if (!report) {
        showToast('Report not found.', 'error');
        return;
    }

    const grantEntry = qrAccessGrantCache[reportId];
    if (!grantEntry?.grant || isGrantExpired(grantEntry.expiresAtUtc)) {
        showToast('Access requires MAUI QR approval first.', 'info');
        return;
    }

    document.querySelector('[data-view="qrDetail"]').click();
    document.getElementById('qrDetailSelect').value = String(reportId);
    renderQrDetail();
}

function isGrantExpired(expiresAtUtc) {
    if (!expiresAtUtc) return false;
    const dt = new Date(expiresAtUtc);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
}

function qrEscape(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatQrDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('da-DK');
}

function printQrDetail() {
    const printable = document.getElementById('qrDetailPrintable');
    if (!printable) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<html><head><title>QR Detail</title></head><body>${printable.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

function saveQrDetailAsPdf() {
    const report = qrDetailExportState.report;
    const ticket = qrDetailExportState.ticket;
    if (!report) {
        showToast('Ingen rapport data tilgængelig.', 'error');
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;
    overlay.innerHTML = `
        <div style="background:#1e2a3a;border-radius:12px;padding:2rem;width:420px;color:#fff;">
            <h3 style="margin:0 0 1rem;">Vælg sektioner til PDF</h3>
            ${[
            ['sec_header', 'Rapport header', true],
            ['sec_ticketinfo', 'Ticket info', true],
            ['sec_people', 'Involverede personer', true],
            ['sec_summary', 'Executive Summary', true],
            ['sec_thread', 'Ticket Thread', true],
            ['sec_tasks', 'Tasks', true],
            ['sec_attachments', 'Vedhæftede filer', true],
            ['sec_feedback', 'Admin Feedback', true],
        ].map(([id, label, checked]) => `
                <label style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;cursor:pointer;">
                    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width:16px;height:16px;">
                    <span>${label}</span>
                </label>`).join('')}
            <div style="display:flex;gap:1rem;margin-top:1.5rem;justify-content:flex-end;">
                <button onclick="this.closest('div').parentElement.parentElement.remove()"
                    style="background:#243251;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                    Annuller
                </button>
                <button id="confirmQrPdfBtn"
                    style="background:#4a9eff;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">
                    Eksporter PDF
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    document.getElementById('confirmQrPdfBtn').onclick = () => {
        const get = id => document.getElementById(id)?.checked;
        const sections = {
            header: get('sec_header'),
            ticketinfo: get('sec_ticketinfo'),
            people: get('sec_people'),
            summary: get('sec_summary'),
            thread: get('sec_thread'),
            tasks: get('sec_tasks'),
            attachments: get('sec_attachments'),
            feedback: get('sec_feedback') && !!report.adminFeedback,
        };
        overlay.remove();
        setTimeout(() => generateQrPdf(report, ticket, sections), 100);
    };
}

function generateQrPdf(report, ticket, sections) {
    const allComments = (dashboardVm.comments ?? []).filter(c => c.ticketId === report.ticketId);
    const allTasks = (dashboardVm.tasks ?? []).filter(t => t.ticketId === report.ticketId);
    const attachments = extractCommentAttachments(allComments);
    const taskResolveNotes = allComments.filter(c => (c.commentText ?? '').startsWith('[Task:'));

    // People involved
    const involvedIds = new Set();
    if (ticket?.assignedToUserId) involvedIds.add(ticket.assignedToUserId);
    allTasks.forEach(t => { if (t.assignedUserId) involvedIds.add(t.assignedUserId); });
    const involvedUsers = (dashboardVm.users ?? []).filter(u => involvedIds.has(u.id));

    const now = new Date().toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' });
    const isClosed = !!report.closedAt;

    const table = (headers, rows) => `
        <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="empty">Ingen data</td></tr>`}</tbody>
        </table>`;

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>QR Rapport #${report.id}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 2rem; }
        h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
        h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; border-bottom: 2px solid #4a9eff; padding-bottom: 0.25rem; color: #1a1a2e; }
        .meta { color: #555; font-size: 0.85rem; margin-bottom: 0.25rem; }
        .badge { display:inline-block; padding:0.15rem 0.6rem; border-radius:999px; font-size:0.75rem; font-weight:600; margin-left:0.5rem; }
        .badge-open   { background:#27ae6022; color:#27ae60; border:1px solid #27ae60; }
        .badge-closed { background:#c0392b22; color:#c0392b; border:1px solid #c0392b; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin:0.75rem 0; }
        .info-chip { border:1px solid #ddd; border-radius:6px; padding:0.5rem 0.75rem; }
        .info-chip strong { font-size:0.75rem; color:#777; display:block; margin-bottom:2px; }
        table { width:100%; border-collapse:collapse; margin-top:0.5rem; font-size:0.82rem; }
        th { background:#f0f4ff; text-align:left; padding:0.4rem 0.5rem; border:1px solid #ddd; }
        td { padding:0.35rem 0.5rem; border:1px solid #eee; vertical-align:top; }
        tr:nth-child(even) td { background:#fafafa; }
        .empty { color:#aaa; text-align:center; font-style:italic; }
        .task-block { border:1px solid #ddd; border-radius:6px; padding:0.6rem; margin-bottom:0.5rem; }
        .task-title { font-weight:700; margin-bottom:0.25rem; }
        .task-meta { font-size:0.8rem; color:#555; }
        .feedback-box { border:1px solid #c0392b; border-radius:6px; padding:0.75rem; margin-top:0.5rem; background:#fff5f5; }
        .feedback-label { font-weight:700; color:#c0392b; margin-bottom:0.25rem; font-size:0.85rem; }
        .thread-item { padding:0.4rem 0; border-bottom:1px solid #eee; font-size:0.82rem; }
        .thread-item strong { color:#1a1a2e; }
        .thread-time { color:#aaa; font-size:0.75rem; margin-left:0.5rem; }
        .footer { margin-top:2rem; font-size:0.75rem; color:#aaa; text-align:center; border-top:1px solid #eee; padding-top:0.75rem; display:flex; justify-content:space-between; }
        @media print { body { padding: 1rem; } }
    </style></head><body>`;

    // ── Header ──
    if (sections.header) {
        const statusBadge = isClosed
            ? `<span class="badge badge-closed">Lukket</span>`
            : `<span class="badge badge-open">Åben</span>`;
        html += `
        <h1>QR Verified Report #${report.id} ${statusBadge}</h1>
        <div class="meta">Secure dossier — Eksklusiv rapport efter MAUI godkendelse</div>
        <div class="meta" style="margin-top:0.25rem;">Rapport genereret: ${now}</div>
        <div class="info-grid" style="margin-top:1rem;">
            <div class="info-chip"><strong>Report</strong>#${report.id}</div>
            <div class="info-chip"><strong>Ticket</strong>#${report.ticketId} — ${ticket?.title ?? report.ticketTitle ?? '—'}</div>
            <div class="info-chip"><strong>Created By</strong>${report.createdByUserName ?? '—'}</div>
            <div class="info-chip"><strong>Created At</strong>${new Date(report.createdAt).toLocaleString('da-DK')}</div>
        </div>`;
    }

    // ── Ticket Info ──
    if (sections.ticketinfo && ticket) {
        html += `<h2>Ticket Info</h2>
        <table><tbody>
            <tr><td><strong>Assigned to</strong></td><td>${ticket.assignedToName ?? '—'}</td></tr>
            <tr><td><strong>Status</strong></td><td>${ticket.statusName ?? '—'}</td></tr>
            <tr><td><strong>Priority</strong></td><td>${ticket.priorityName ?? '—'}</td></tr>
            <tr><td><strong>Department</strong></td><td>${ticket.departmentName ?? '—'}</td></tr>
            <tr><td><strong>Category</strong></td><td>${ticket.categoryName ?? '—'}</td></tr>
            <tr><td><strong>Due Date</strong></td><td>${ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString('da-DK') : '—'}</td></tr>
            <tr><td><strong>Description</strong></td><td>${ticket.description ?? '—'}</td></tr>
            </tbody></table>`;
    }

    // ── People Involved ──
    if (sections.people) {
        const rows = involvedUsers.map(u => {
            const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName;
            const roleMap = { 1: 'Admin', 2: 'Supporter', 3: 'User' };
            const role = u.roleName ?? roleMap[u.roleId] ?? '—';
            return `<tr><td>${name}</td><td>${role}</td></tr>`;
        });
        html += `<h2>Involverede Personer</h2>${table(['Navn', 'Rolle'], rows)}`;
    }

    // ── Executive Summary ──
    if (sections.summary) {
        html += `<h2>Executive Summary</h2>
        <p style="font-weight:700; margin-bottom:0.25rem;">${report.summary ?? '—'}</p>
        <p>${report.resolutionText ?? '—'}</p>`;
    }

    // ── Ticket Thread ──
    if (sections.thread) {
        html += `<h2>Ticket Thread</h2>`;
        if (allComments.length) {
            html += allComments.map(c => `
                <div class="thread-item">
                    <strong>${c.userName ?? 'Unknown'}</strong>: ${c.commentText ?? ''}
                    <span class="thread-time">${c.createdAt ? new Date(c.createdAt).toLocaleString('da-DK') : ''}</span>
                </div>`).join('');
        } else {
            html += `<p class="empty">Ingen kommentarer.</p>`;
        }
    }

    // ── Tasks ──
    if (sections.tasks) {
        html += `<h2>Tasks</h2>`;
        if (allTasks.length) {
            html += allTasks.map(t => {
                const assignedUser = (dashboardVm.users ?? []).find(u => u.id === t.assignedUserId);
                const assignedName = assignedUser
                    ? `${assignedUser.firstName ?? ''} ${assignedUser.lastName ?? ''}`.trim()
                    : 'Unassigned';
                const status = (dashboardVm.ticketStatuses ?? []).find(s => s.id === t.statusId);
                const resolveNote = taskResolveNotes.find(c => c.commentText?.includes(`[Task: ${t.title}]`));
                const resolveText = resolveNote
                    ? resolveNote.commentText.replace(`[Task: ${t.title}] `, '')
                    : 'Ikke angivet';
                return `
                <div class="task-block">
                    <div class="task-title">📋 ${t.title ?? '—'}</div>
                    <div class="task-meta">${t.description ?? '—'}</div>
                    <div class="task-meta" style="margin-top:4px;"><strong>Status:</strong> ${status?.name ?? '—'}</div>
                    <div class="task-meta"><strong>Assigned:</strong> ${assignedName}</div>
                    <div class="task-meta"><strong>Rapport:</strong> ${resolveText}</div>
                </div>`;
            }).join('');
        } else {
            html += `<p class="empty">Ingen tasks.</p>`;
        }
    }

    // ── Attachments ──
    if (sections.attachments) {
        html += `<h2>Vedhæftede Filer</h2>`;
        if (attachments.length) {
            html += `<table><tbody>${attachments.map(f => `<tr><td>📎 ${f}</td></tr>`).join('')}</tbody></table>`;
        } else {
            html += `<p class="empty">Ingen vedhæftede filer.</p>`;
        }
    }

    // ── Admin Feedback ──
    if (sections.feedback) {
        html += `<h2>Admin Feedback</h2>
        <div class="feedback-box">
            <div class="feedback-label">🔒 Admin Feedback</div>
            <p>${report.adminFeedback ?? 'Ikke angivet'}</p>
            <p style="font-size:0.75rem; color:#aaa; margin-top:0.5rem;">
                Lukket: ${report.closedAt ? new Date(report.closedAt).toLocaleString('da-DK') : '—'}
            </p>
        </div>`;
    }

    const printedByUser = (dashboardVm.users ?? []).find(u => u.id === loggedInUserId);
    const printedByName = printedByUser
        ? `${printedByUser.firstName ?? ''} ${printedByUser.lastName ?? ''}`.trim()
        : 'Ukendt';

    html += `<div class="footer">
    <span>NexDesk — QR Rapport #${report.id} — Ticket #${report.ticketId}</span>
    <span>Udskrevet af: ${printedByName} — ${now}</span>
    </div></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
}