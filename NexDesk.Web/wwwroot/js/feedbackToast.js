
// ── Reusable Feedback Toast --------------------------------- FOR ALL CRUD OPERATIONS ────────────────────────────────────────────────
function showToast(message, type = 'success', duration =6000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `fx-toast ${type}`;
    toast.innerHTML = `
        <span class="fx-toast-icon">${icons[type] ?? 'ℹ️'}</span>
        <span class="fx-toast-msg">${message}</span>
        <button class="fx-toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 600);
    }, duration);
}

//document.addEventListener('DOMContentLoaded', () => showToast('Toast is working! 🎉')); // Remove this line when done testing

// ── Logout Confirmation ───────────────────────────────────────────────────────────────────────────────────────────────
//function confirmLogout() {
//    showToast('Logging out...', 'info');
//    setTimeout(() => document.getElementById('logoutForm').submit(), 1500);
//}


function doLogout() {
    document.getElementById('confirmOverlay').style.display = 'none';
    showToast('Logger ud...', 'info');
    setTimeout(() => document.getElementById('logoutForm').submit(), 1500);
}


// ── Generic Confirm Dialog ──────────────────────────────
function showConfirm(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('genericConfirmOverlay').style.display = 'block';
    document.getElementById('confirmYesBtn').onclick = () => {
        document.getElementById('genericConfirmOverlay').style.display = 'none';
        onConfirm();
    };
}
// ── Logout Confirmation  ──────────────────────────────────────
function confirmLogout() {
    showConfirm('Er du sikker på, at du vil logge ud?', () => {
        showToast('Logger ud...', 'info');
        setTimeout(() => document.getElementById('logoutForm').submit(), 1500);
    });
}