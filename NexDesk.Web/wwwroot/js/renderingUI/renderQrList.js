function renderQrList() {
    const host = document.getElementById('qrListBox');
    if (!host) return;

    const items = Array.isArray(dashboardVm?.reports) ? dashboardVm.reports : [];

    host.innerHTML = items.length
        ? items.map(r => {
            const ticket = (dashboardVm.tickets ?? []).find(t => t.id === r.ticketId);
            const isClosed = !!r.closedAt;
            const emailSent = !!r.customerEmailSentAt;
            const closedBadge = isClosed
                ? `<span style="background:#c0392b;color:#fff;padding:2px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;margin-left:0.5rem;">Lukket</span>`
                : `<span style="background:#27ae60;color:#fff;padding:2px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;margin-left:0.5rem;">Åben</span>`;
            const emailSentLabel = emailSent
                ? `<span style="font-size:0.75rem;color:#9fb0d0;">📧 Email sendt: ${formatQrDate(r.customerEmailSentAt)}</span>`
                : '';
            return `
          <div class="list-item">
            <h4>Report #${r.id} ${closedBadge}</h4>
            <div class="meta">
              <span>Ticket #${r.ticketId} — ${r.summary ?? ''}</span>
            </div>
            ${emailSentLabel}
            <div class="actions" style="margin-top:0.5rem;">
              <button class="btn" onclick="openQrScanFlow(${r.id})">Open QR Page</button>
              <button class="btn" style="background:#e67e22;color:#fff;" onclick="sendEmailToCustomerFromList(${r.id})">📧 Send til Kunde</button>
            </div>
          </div>`;
        }).join('')
        : `<div class="list-item"><div class="tiny">No reports found.</div></div>`;
}
async function sendEmailToCustomerFromList(reportId) {
    const report = (dashboardVm.reports ?? []).find(r => r.id === reportId);
    const ticket = (dashboardVm.tickets ?? []).find(t => t.id === report?.ticketId);
    const creator = (dashboardVm.users ?? []).find(u => u.id === ticket?.createdByUserId);
    const defaultEmail = creator?.email ?? '';
    const emailAlreadySent = !!report?.customerEmailSentAt;

    if (emailAlreadySent) {
        const confirmed = await new Promise(resolve => {
            showConfirm(
                `Email blev allerede sendt ${formatQrDate(report.customerEmailSentAt)}. Vil du sende igen?`,
                () => resolve(true)
            );
            document.querySelector('#genericConfirmOverlay .btn').onclick = () => {
                document.getElementById('genericConfirmOverlay').style.display = 'none';
                resolve(false);
            };
        });
        if (!confirmed) return;
    }

    const existing = document.getElementById('customerEmailOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customerEmailOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML = `
        <div style="background:#111a2e;border:1px solid #2a3f5f;border-radius:14px;padding:1.5rem;width:min(92vw,480px);box-shadow:0 16px 40px rgba(0,0,0,0.45);">
            <h3 style="color:#e6eefc;margin:0 0 0.5rem;">📧 Send Email til Kunde</h3>
            <p style="color:#9fb0d0;font-size:0.9rem;margin-bottom:1rem;">Bekræft eller ændr kundens email-adresse.</p>
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
let qrScanPollTimer = null;

async function openQrScanFlow(reportId) {
    try {
        const res = await fetch(`${apiBase}/api/reports/${reportId}/start-scan`, { method: 'POST' });
        if (!res.ok) {
            const errorText = await res.text();
            showToast(`Failed to start QR scan. ${errorText || ''}`.trim(), 'error');
            return;
        }

        const payload = await res.json();
        showQrScanModal(payload.reportId, payload.qrToken, payload.expiresAtUtc);
        startQrApprovalPolling(payload.reportId);
    } catch (error) {
        console.error('Error opening QR scan flow:', error);
        showToast('Network error when starting QR scan. Please try again.', 'error');
    }
}

function showQrScanModal(reportId, qrToken, expiresAtUtc) {
    closeQrScanModal();

    const overlay = document.createElement('div');
    overlay.id = 'qrScanOverlay';
    overlay.dataset.startTime = Date.now().toString(); // Track modal start time
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.65)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const box = document.createElement('div');
    box.style.background = '#111a2e';
    box.style.border = '1px solid #2a3f5f';
    box.style.borderRadius = '14px';
    box.style.padding = '1.1rem';
    box.style.width = 'min(92vw, 460px)';
    box.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
    box.style.textAlign = 'center';

    const title = document.createElement('h3');
    title.textContent = `Scan QR for Report #${reportId}`;
    title.style.margin = '0 0 0.5rem';
    title.style.color = '#e6eefc';

    const hint = document.createElement('div');
    hint.id = 'qrScanHint';
    hint.textContent = 'Scan this QR with MAUI app. Waiting for approval...';
    hint.style.color = '#9fb0d0';
    hint.style.fontSize = '0.9rem';
    hint.style.marginBottom = '0.7rem';

    const qrImage = document.createElement('img');
    qrImage.alt = 'QR Scan Code';
    qrImage.width = 340;
    qrImage.height = 340;
    qrImage.style.borderRadius = '10px';
    qrImage.style.background = '#fff';
    qrImage.style.padding = '10px';
    qrImage.style.maxWidth = '100%';
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(qrToken)}`;

    const expires = document.createElement('div');
    expires.style.color = '#9fb0d0';
    expires.style.fontSize = '0.82rem';
    expires.style.marginTop = '0.55rem';
    expires.textContent = `Expires: ${new Date(expiresAtUtc).toLocaleString()}`;

    const actions = document.createElement('div');
    actions.style.marginTop = '0.85rem';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = closeQrScanModal;

    actions.appendChild(closeBtn);

    box.appendChild(title);
    box.appendChild(hint);
    box.appendChild(qrImage);
    box.appendChild(expires);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function closeQrScanModal() {
    if (qrScanPollTimer) {
        clearInterval(qrScanPollTimer);
        qrScanPollTimer = null;
    }

    const overlay = document.getElementById('qrScanOverlay');
    if (overlay) overlay.remove();
}

function startQrApprovalPolling(reportId) {
    if (qrScanPollTimer) clearInterval(qrScanPollTimer);

    let consecutiveErrors = 0;
    const maxErrorRetries = 3;

    qrScanPollTimer = setInterval(async () => {
        try {
            const res = await fetch(`${apiBase}/api/reports/${reportId}/scan-status`);

            if (!res.ok) {
                consecutiveErrors++;
                const hint = document.getElementById('qrScanHint');
                if (consecutiveErrors >= maxErrorRetries) {
                    if (hint) hint.textContent = `Network error. Please close and retry. (${res.status})`;
                    clearInterval(qrScanPollTimer);
                    qrScanPollTimer = null;
                    return;
                }
                console.warn(`Polling error: ${res.status}. Attempt ${consecutiveErrors}/${maxErrorRetries}`);
                return;
            }

            consecutiveErrors = 0;
            const status = await res.json();
            const hint = document.getElementById('qrScanHint');

            // If not approved and session ended for other reasons (revoked, used without approval, expired)
            if (!status.isApproved && (status.isRevoked || status.isUsed || status.isExpired)) {
                if (hint) hint.textContent = 'QR session ended. Please reopen to generate a new QR code.';
                clearInterval(qrScanPollTimer);
                qrScanPollTimer = null;
                return;
            }

            if (!status.isApproved) {
                if (hint && hint.textContent.includes('error')) {
                    hint.textContent = 'Scan this QR with MAUI app. Waiting for approval...';
                }
                return;
            }

            const grantRes = await fetch(`${apiBase}/api/reports/${reportId}/issue-grant`, { method: 'POST' });
            if (!grantRes.ok) {
                const errorText = await grantRes.text();
                if (hint) hint.textContent = errorText || 'Approval detected, but grant could not be issued.';
                return;
            }

            const grantPayload = await grantRes.json();
            if (typeof cacheQrAccessGrant === 'function') {
                cacheQrAccessGrant(grantPayload.reportId, grantPayload.accessGrant, grantPayload.accessGrantExpiresAtUtc);
            }

            clearInterval(qrScanPollTimer);
            qrScanPollTimer = null;
            closeQrScanModal();
            showToast('QR scan approved. Opening report detail.');
            openQrDetail(reportId);
        } catch (error) {
            consecutiveErrors++;
            console.error('QR polling exception:', error);
            const hint = document.getElementById('qrScanHint');
            if (consecutiveErrors >= maxErrorRetries) {
                if (hint) hint.textContent = `Connection error. Please close and retry.`;
                clearInterval(qrScanPollTimer);
                qrScanPollTimer = null;
            }
        }
    }, 2000);
}
