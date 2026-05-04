// ── NexDesk AI Chatbot Logic ───────────────────────────────────────────────
// Depends on: dictionaryNexDeskAI.js (loaded before this file)
//             tooltip.js (provides getCurrentLang())
// No external API — pure keyword matching against nexdeskAIDictionary
// ──────────────────────────────────────────────────────────────────────────

// ── DOM Elements ──────────────────────────────────────────────────────────
const chatWindowDiv = document.getElementById('chatWindow');
const collapsedBtn = document.getElementById('chatCollapsedBtn');
const minimizeBtn = document.getElementById('minimizeChatBtn');
const chatHeaderToggle = document.getElementById('chatHeaderToggle');
const sendBtn = document.getElementById('sendMsgBtn');
const chatInput = document.getElementById('chatInput');
const messagesContainer = document.getElementById('chatMessages');

// ── Get dictionary for current language ───────────────────────────────────
function getDict() {
    const lang = getCurrentLang(); // from tooltip.js
    console.log("🌐 Language changed to:", lang);
    return nexdeskAIDictionary[lang] ?? nexdeskAIDictionary['en'];
}
// ── Keyword matching → dictionary key ─────────────────────────────────────
function matchResponse(msg) {
    const m = msg.toLowerCase();
    const dict = getDict();

    // ── Greetings ──
    if (m.match(/\b(hello|hey|hi|hej|bonjour|salut|god dag)\b/))
        return dict.hello;
    if (m.match(/how are you|hvordan har du|comment (ça va|allez)/))
        return dict.how_are_you;
    if (m.match(/\b(bye|goodbye|farvel|au revoir)\b/))
        return dict.goodbye;
    if (m.match(/\b(thank|thanks|tak|merci)\b/))
        return dict.thank_you;
    if (m.match(/what can you|hvad kan du|que peux.tu|que pouvez/))
        return dict.what_can_you_do;
    if (m.match(/\b(feature|funktioner|fonctionnalit)\b/))
        return dict.features;

    // ── Dashboard ──
    if (m.match(/\b(dashboard|startsid|tableau de bord|tableau\b)/))
        return dict.dashboard;
    if (m.match(/open ticket|åbne sag|tickets? ouverts?/))
        return dict.open_tickets;
    if (m.match(/in.?progress|igangværende|en cours/))
        return dict.in_progress;
    if (m.match(/\b(resolv|løste|résolus?)\b/))
        return dict.resolved;
    if (m.match(/total ticket|samlet antal/))
        return dict.total_tickets;
    if (m.match(/\b(overdue|forfaldne|retard|overskredet)\b/))
        return dict.overdue;
    if (m.match(/unassign|ikke.?tildelt|non attribu/))
        return dict.unassigned;
    if (m.match(/active assign|aktive support|agents? actifs?/))
        return dict.active_assignees;

    // ── Admin vs Support difference ──
    if (m.match(/differ|forskel|différence|admin.*support|support.*admin|roller.*forskel/))
        return dict.what_is_roles;

    // ── Tickets ──
    if (m.match(/what is (a )?ticket|hvad er en (sag|ticket)|qu.est.ce qu.un ticket/))
        return dict.what_is_ticket;
    if (m.match(/(create|opret|new|ny|créer|nouveau|oprette).*(ticket|sag)|(ticket|sag).*(create|opret|new|ny|créer|oprette)/))
        return dict.create_ticket;
    if (m.match(/(edit|rediger|modifier).*(ticket|sag)|(ticket|sag).*(edit|rediger|modifier)/))
        return dict.edit_ticket;
    if (m.match(/(delete|slet|supprimer).*(ticket|sag)|(ticket|sag).*(delete|slet|supprimer)/))
        return dict.delete_ticket;
    if (m.match(/\b(status|statusser|statuts?)\b/))
        return dict.ticket_status;
    if (m.match(/\bpriorit/))
        return dict.ticket_priority;
    if (m.match(/\b(categor|kategori|catégorie)\b/))
        return dict.ticket_category;
    if (m.match(/\b(department|afdeling|département)\b/))
        return dict.ticket_department;
    if (m.match(/\b(assign|tildel|assigner|tildele)\b/))
        return dict.assign_ticket;
    if (m.match(/\b(search|søg|chercher|filtr)\b/))
        return dict.search_ticket;
    // single word "tickets" or "sager" or "ticket" alone
    if (m.match(/\b(tickets?|sager|sag)\b/))
        return dict.what_is_ticket;
    if (m.match(/give me.*(ticket|sag)|lav.*ticket|make.*ticket|créer.*ticket|example.*ticket|ticket.*example|eksempel.*ticket|exemple.*ticket|suggest|forslag/))
        return dict.ticket_example;

    // ── Tasks ──
    if (m.match(/what is (a )?task|hvad er en opgave|qu.est.ce qu.une tâche/))
        return dict.what_is_task;
    if (m.match(/(create|opret|new|ny|créer).*(task|opgave)|(task|opgave).*(create|opret)/))
        return dict.create_task;
    if (m.match(/\b(task|opgave|tâche|tâches)\b/))
        return dict.what_is_task;
    if (m.match(/(tildel|assign).*(opgave|task|tâche)|(opgave|task|tâche).*(tildel|assign)/))
        return dict.task_assign;
    if (m.match(/give me.*(task|opgave|tâche)|lav.*opgave|make.*task|créer.*tâche|example.*task|task.*example|eksempel.*opgave|exemple.*tâche/))
        return dict.task_example;
    // ── Notifications ──
    if (m.match(/mark.*(read|læst|lu)|læs.*notif/))
        return dict.mark_read;
    if (m.match(/\bnotif/))
        return dict.what_is_notification;

    // ── Comments ──
    if (m.match(/internal comment|intern kommentar|commentaire interne/))
        return dict.internal_comment;
    if (m.match(/(add|tilføj|ajouter).*(comment|kommentar)/))
        return dict.add_comment;
    if (m.match(/\b(comment|kommentar|commentaire)\b/))
        return dict.what_is_comment;

    // ── History ──
    if (m.match(/\b(histor|historik|historique)\b/))
        return dict.what_is_history;

    // ── QR ──
    if (m.match(/\bqr\b/))
        return dict.what_is_qr;

    // ── Reports ──
    if (m.match(/\b(rapport|report)\b/))
        return dict.what_is_qr;

    // ── Password — must come BEFORE general settings ──
    if (m.match(/(nulstil|reset|réinitial|glemt|forgot|oublié).*(password|adgangskode|mot de passe)|(password|adgangskode|mot de passe).*(nulstil|reset|réinitial)/))
        return dict.password_reset;
    if (m.match(/\b(password|adgangskode|mot de passe)\b/))
        return dict.password_issue;

    // ── Settings ──
    if (m.match(/\b(role|roller|rôle|rôles)\b/))
        return dict.what_is_roles;
    if (m.match(/manage user|administrer bruger|gérer.*utilisateur/))
        return dict.manage_users;
    if (m.match(/manage role|administrer roller|gérer.*rôle/))
        return dict.manage_roles;
    if (m.match(/manage categor|administrer kategori|gérer.*catégorie/))
        return dict.manage_categories;
    if (m.match(/manage department|administrer afdeling|gérer.*département/))
        return dict.manage_departments;
    if (m.match(/\b(setting|indstilling|paramètre|paramètres)\b/))
        return dict.what_is_settings;

    // ── User Profile ──
    if (m.match(/open.*profile|åbn.*profil|ouvrir.*profil/))
        return dict.open_profile;
    if (m.match(/my profile|min profil|mon profil/))
        return dict.my_profile;
    if (m.match(/\b(deactivat|deaktiver|désactiver)\b/))
        return dict.deactivate_user;
    if (m.match(/profile.*(picture|billede|photo)|upload.*(picture|billede|photo)/))
        return dict.profile_picture;
    if (m.match(/green dot|grøn.*(prik|punkt)|point vert|online/))
        return dict.online_indicator;
    if (m.match(/export.*pdf|pdf.*export/))
        return dict.export_pdf;
    if (m.match(/\b(profil|profile|brugerprofil)\b/))
        return dict.what_is_profile;

    // ── Login ──
    if (m.match(/admin.*login|login.*admin/))
        return dict.login_admin;
    if (m.match(/support.*login|login.*support/))
        return dict.login_support;
    if (m.match(/\brfid\b/))
        return dict.rfid;

    // ── Lookups ──
    if (m.match(/\b(lookup|opslagsdata|données de référence)\b/))
        return dict.what_is_lookups;

    // ── General IT ──
    if (m.match(/\bsla\b/))
        return dict.what_is_sla;
    if (m.match(/network.*(issue|problem|fejl)|netværk|réseau/))
        return dict.network_issue;
    if (m.match(/\b(language|sprog|langue)\b/))
        return dict.language_switch;
    if (m.match(/\b(help|hjælp|aide)\b/))
        return dict.what_can_you_do;

    // ── Fallback ──
    return dict.default_fallback;
}
// ── Add message bubble ─────────────────────────────────────────────────────
function addMessage(type, content) {
    const wrap = document.createElement('div');
    wrap.className = `message ${type === 'user' ? 'user-message' : 'bot-message'}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerText = content;

    const timeSpan = document.createElement('div');
    timeSpan.className = 'msg-time';
    const now = new Date();
    timeSpan.innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    wrap.appendChild(bubble);
    wrap.appendChild(timeSpan);
    messagesContainer.appendChild(wrap);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── Typing indicator ───────────────────────────────────────────────────────
function showTyping() {
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'typing-indicator';
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// ── Send message ───────────────────────────────────────────────────────────
function sendUserMessage() {
    const raw = chatInput.value.trim();
    if (!raw) return;
    addMessage('user', raw);
    chatInput.value = '';
    showTyping();
    setTimeout(() => {
        hideTyping();
        addMessage('bot', matchResponse(raw));
    }, 450);
}

// ── Collapse / Expand ──────────────────────────────────────────────────────
function collapseChat() {
    chatWindowDiv.classList.add('collapsed');
    collapsedBtn.style.display = 'flex';
}

// --------  Hint  Complet -------------------
function getSuggestions() {
    const lang = getCurrentLang();
    const allKeys = Object.keys(nexdeskAIDictionary[lang]).filter(k =>
        !['greeting', 'hello', 'how_are_you', 'goodbye',
            'thank_you', 'default_fallback', 'language_switch'].includes(k)
    );
    // Pick 5 random keys and use their response as the chip label
    const labels = {
        da: { dashboard: 'Dashboard', create_ticket: 'Opret ticket', what_is_task: 'Hvad er en opgave?', password_reset: 'Nulstil adgangskode', my_profile: 'Min profil', what_is_qr: 'QR koder', overdue: 'Forfaldne sager', assign_ticket: 'Tildel ticket', what_is_roles: 'Roller', export_pdf: 'Eksporter PDF', what_is_history: 'Historik', notif_badge: 'Notifikationer', rfid: 'RFID', what_is_sla: 'SLA', deactivate_user: 'Deaktiver konto' },
        en: { dashboard: 'Dashboard', create_ticket: 'Create ticket', what_is_task: 'What is a task?', password_reset: 'Reset password', my_profile: 'My profile', what_is_qr: 'QR codes', overdue: 'Overdue tickets', assign_ticket: 'Assign ticket', what_is_roles: 'Roles', export_pdf: 'Export PDF', what_is_history: 'History', notif_badge: 'Notifications', rfid: 'RFID', what_is_sla: 'SLA', deactivate_user: 'Deactivate account' },
        fr: { dashboard: 'Tableau de bord', create_ticket: 'Créer un ticket', what_is_task: 'Qu\'est-ce qu\'une tâche?', password_reset: 'Réinitialiser mot de passe', my_profile: 'Mon profil', what_is_qr: 'Codes QR', overdue: 'Tickets en retard', assign_ticket: 'Assigner ticket', what_is_roles: 'Rôles', export_pdf: 'Exporter PDF', what_is_history: 'Historique', notif_badge: 'Notifications', rfid: 'RFID', what_is_sla: 'SLA', deactivate_user: 'Désactiver compte' }
    };
    const langLabels = labels[lang] ?? labels['en'];
    // Shuffle and pick 5
    const keys = Object.keys(langLabels).sort(() => Math.random() - 0.5).slice(0, 5);
    return keys.map(k => ({ label: langLabels[k], query: langLabels[k] }));
}
function renderSuggestions() {
    const existing = document.getElementById('chatSuggestions');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'chatSuggestions';
    container.className = 'chat-suggestions';

    getSuggestions().forEach(({ label, query }) => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = label;
        chip.onclick = () => {
            chatInput.value = query;
            sendUserMessage();
            renderSuggestions(); // refresh with new random 5
        };
        container.appendChild(chip);
    });

    chatWindowDiv.querySelector('.chat-messages').before(container);
}
function expandChat() {
    chatWindowDiv.classList.remove('collapsed');
    collapsedBtn.style.display = 'none';
    setTimeout(() => chatInput.focus(), 120);
}

// ── Init greeting ──────────────────────────────────────────────────────────
function initChat() {
    messagesContainer.innerHTML = '';
    addMessage('bot', `👋 ${getDict().greeting}`);
    renderSuggestions();
}

// ── Language change — update greeting when lang switches ───────────────────
// Hooks into tooltip.js setLang — wrap it to also update chat greeting
const _originalSetLang = setLang;
window.setLang = function (lang) {
    _originalSetLang(lang);
    renderSuggestions();

    // Highlight active language button
    document.querySelectorAll('.chat-lang-switcher button').forEach(btn => {
        btn.classList.remove('active-lang');
        btn.style.opacity = '0.5';
        btn.style.fontWeight = 'normal';
    });
    const activeBtn = document.querySelector(`.chat-lang-switcher button[onclick="setLang('${lang}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active-lang');
        activeBtn.style.opacity = '1';
        activeBtn.style.fontWeight = 'bold';
    }

    // Update greeting or add language change notice
    const msgs = messagesContainer.querySelectorAll('.message');
    if (msgs.length === 1) {
        const bubble = msgs[0].querySelector('.msg-bubble');
        if (bubble) bubble.innerText = `👋 ${getDict().greeting}`;
    } else {
        addMessage('bot', `🌐 ${getDict().language_switch}`);
    }
};

// ── Event Listeners ────────────────────────────────────────────────────────
collapsedBtn.addEventListener('click', expandChat);
minimizeBtn.addEventListener('click', collapseChat);
chatHeaderToggle.addEventListener('click', (e) => {
    if (e.target === chatHeaderToggle) collapseChat();
});
sendBtn.addEventListener('click', sendUserMessage);
chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendUserMessage();
});

// ── Start ──────────────────────────────────────────────────────────────────
collapsedBtn.style.display = 'flex';
chatWindowDiv.classList.add('collapsed');
initChat();