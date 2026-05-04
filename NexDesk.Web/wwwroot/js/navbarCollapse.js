// ============================================================
// COLLAPSIBLE SIDEBAR LOGIC
// Stores user preference in localStorage
// ============================================================
(function () {
    const SIDEBAR_STATE_KEY = 'nexdesk_sidebar_collapsed';
    const bodyEl = document.body;
    const toggleBtn = document.getElementById('collapseArrowBtn');

    // Function to apply collapsed state
    function setSidebarCollapsed(collapsed) {
        if (collapsed) {
            bodyEl.classList.add('collapsed');
            localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-chevron-right';
            }
        } else {
            bodyEl.classList.remove('collapsed');
            localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-chevron-left';
            }
        }
        window.dispatchEvent(new Event('resize'));
    }

    // Read initial state from localStorage
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState === 'true') {
        setSidebarCollapsed(true);
    } else if (savedState === 'false') {
        setSidebarCollapsed(false);
    } else {
        setSidebarCollapsed(false);
    }

    // Attach toggle event
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const isCollapsed = bodyEl.classList.contains('collapsed');
            setSidebarCollapsed(!isCollapsed);
        });
    }
})();

// ============================================================
// TOOLTIP HANDLER FOR COLLAPSED MODE
// Shows link names on hover when sidebar is collapsed
// ============================================================
(function () {
    // Add data-tooltip attributes to all nav buttons if missing
    document.querySelectorAll('.nav button').forEach(btn => {
        const textSpan = btn.querySelector('.nav-text');
        const text = textSpan ? textSpan.innerText.trim() : '';
        if (text && !btn.getAttribute('data-tooltip')) {
            btn.setAttribute('data-tooltip', text);
        }
    });

    // Add tooltip to profile button if missing
    const profileBtn = document.querySelector('.profile-mini-btn');
    if (profileBtn && !profileBtn.getAttribute('data-tooltip')) {
        profileBtn.setAttribute('data-tooltip', 'Min Profil');
    }

    // Add tooltip to logout button if missing
    const logoutBtn = document.querySelector('.logout-btn, .sidebar-footer .btn');
    if (logoutBtn && !logoutBtn.getAttribute('data-tooltip')) {
        logoutBtn.setAttribute('data-tooltip', 'Logout');
    }
})();