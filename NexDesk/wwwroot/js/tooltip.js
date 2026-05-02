// ── NexDesk Tooltip System — Multi-language ────────────────────────────────
// Supported languages: da (Danish), en (English), fr (French)
// Language persisted in localStorage under key: nexdesk-lang

const nexdeskTooltipDictionary = {
    da: {
        'nav-dashboard': 'Gå til Dashboard — overblik over åbne, igangværende og løste sager.', 'nav-tickets': 'Gå til Sager — se, søg og administrer alle supporthenvendelser.', 'nav-tasks': 'Gå til Opgaver — opret og tildel arbejdsopgaver til supportere.', 'nav-ticketDetail': 'Gå til Sag Detaljer — se fuld information om en valgt sag.', 'nav-qrList': 'Gå til QR Kode Liste — gennemse alle genererede QR koder fra løste sager.', 'nav-qrDetail': 'Gå til QR Detaljer — se rapport og dokumentation efter scan og bekræftelse.', 'nav-notifications': 'Gå til Notifikationer — se tildeling, opdateringer og påmindelser.', 'nav-lookup': 'Gå til Opslagsdata — administrer kategorier, afdelinger, prioriteter og statuser.', 'nav-comment': 'Gå til Kommentarer — se alle kommentarer på tværs af sager.', 'nav-history': 'Gå til Historik — se alle ændringer og aktiviteter på sager over tid.', 'nav-settings': 'Gå til Indstillinger — administrer adgangskode, brugere, roller og opslagsdata.', 'nav-minProfil': 'Åbn din egen brugerprofil — se dine sager, opgaver, aktivitet og kontodetaljer.',
        'btn-refresh': 'Genindlæs siden for at hente de nyeste data fra systemet.', 'btn-createTicket': 'Opret en ny supporthenvendelse — udfyld titel, beskrivelse, kategori og prioritet.',
        'stat-open': 'Antal sager med status Open — afventer behandling.', 'stat-progress': 'Antal sager der aktuelt er under behandling af en supporter.', 'stat-resolved': 'Antal sager der er markeret som løste.', 'stat-total': 'Det samlede antal sager i systemet.', 'card-recentTickets': 'De seneste supporthenvendelser — viser titel, kategori, afdeling og status.', 'card-quickOverview': 'Hurtig oversigt — aktive supportere, ikke-tildelte sager og overskredet deadline.', 'overview-assignees': 'Antal supportere der aktuelt har mindst én sag tildelt.', 'overview-unassigned': 'Antal sager uden tildelt supporter — kræver handling.', 'overview-overdue': 'Antal sager der har overskredet deres frist.',
        'ticket-search': 'Søg i sager efter titel eller beskrivelse.', 'ticket-filter-status': 'Filtrer sager efter status.', 'ticket-filter-department': 'Filtrer sager efter afdeling.', 'btn-newTicket': 'Opret en ny supporthenvendelse.', 'btn-viewTicket': 'Åbn detaljeret visning af denne sag.', 'btn-editTicket': 'Rediger sagens oplysninger.', 'btn-deleteTicket': 'Slet denne sag permanent. Kan ikke fortrydes. (Kun Admin)',
        'modal-title': 'Titel på sagen — kort og beskrivende.', 'modal-desc': 'Beskrivelse af problemet — så detaljeret som muligt.', 'modal-category': 'Vælg den kategori der passer bedst til sagen.', 'modal-priority': 'Vælg prioritet — hvor hurtigt skal sagen behandles?', 'modal-status': 'Sagens nuværende status i arbejdsprocessen.', 'modal-department': 'Hvilken afdeling skal håndtere sagen?', 'modal-assign': 'Tildel sagen til en specifik supporter.', 'modal-dueDate': 'Frist for hvornår sagen skal være løst.', 'btn-saveTicket': 'Gem sagen — opretter ny eller opdaterer eksisterende.', 'btn-cancelModal': 'Luk formularen uden at gemme ændringer.',
        'task-ticketId': 'Vælg hvilken sag opgaven tilhører.', 'task-assignedUser': 'Vælg hvilken supporter opgaven tildeles.', 'task-title': 'Kort titel for opgaven.', 'task-status': 'Opgavens nuværende status.', 'task-description': 'Detaljeret beskrivelse af hvad opgaven indebærer.', 'task-dueDate': 'Frist for opgavens afslutning.', 'btn-createTask': 'Opret opgaven og tildel den til den valgte supporter.',
        'ticketDetail-select': 'Vælg hvilken sag du vil se detaljer for.', 'reply-summary': 'Kort opsummering af det udførte arbejde.', 'reply-resolution': 'Detaljeret beskrivelse af løsningen — synlig for admin.', 'reply-attachment': 'Navn på vedhæftet fil.', 'btn-confirmReply': 'Bekræft arbejdet og generer rapport + QR kode for sagen.',
        'btn-markAllRead': 'Marker alle notifikationer som læste på én gang.', 'btn-markRead': 'Marker denne notifikation som læst.', 'notif-badge': 'Antal ulæste notifikationer.',
        'comment-internal': 'Intern kommentar er kun synlig for Admin og Support.', 'btn-deleteComment': 'Slet denne kommentar permanent.',
        'lookup-categories': 'Oversigt over alle ticket-kategorier.', 'lookup-departments': 'Oversigt over alle afdelinger.', 'lookup-priorities': 'Oversigt over alle prioriteter.', 'lookup-statuses': 'Oversigt over alle statuser.',
        'settings-password': 'Send et nulstillingslink til din email for at ændre din adgangskode.', 'settings-roles': 'Administrer roller i systemet. (Kun Admin)', 'settings-users': 'Administrer brugere. (Kun Admin)', 'settings-categories': 'Administrer ticket-kategorier. (Kun Admin)', 'settings-departments': 'Administrer afdelinger. (Kun Admin)', 'btn-sendResetLink': 'Send et link med en 6-cifret kode til din email — udløber efter 10 minutter.', 'btn-newRole': 'Opret en ny rolle.', 'btn-newUser': 'Opret en ny bruger.', 'btn-newCategory': 'Opret en ny kategori.', 'btn-newDepartment': 'Opret en ny afdeling.', 'btn-editRole': 'Rediger denne rolle.', 'btn-deleteRole': 'Slet denne rolle permanent.', 'btn-editUser': 'Rediger brugerens oplysninger.', 'btn-deleteUser': 'Slet denne bruger permanent.', 'btn-userProfile': 'Åbn detaljeret brugerprofil for denne bruger.', 'btn-editCategory': 'Rediger denne kategori.', 'btn-deleteCategory': 'Slet denne kategori permanent.', 'btn-editDepartment': 'Rediger denne afdeling.', 'btn-deleteDepartment': 'Slet denne afdeling permanent.', 'input-search-user': 'Søg efter brugere på navn, brugernavn eller email.', 'filter-role': 'Filtrer brugerlisten efter rolle.',
        'profile-avatar': 'Klik for at uploade eller skifte profilbillede. Hold musen over for at slette.', 'profile-online': 'Grøn prik = brugeren har været aktiv inden for de sidste 15 minutter.', 'profile-offline': 'Grå prik = brugeren har ikke været aktiv for nylig.', 'profile-deactivated': 'Denne konto er deaktiveret — brugeren kan ikke logge ind.', 'btn-deactivate': 'Deaktiver denne konto — brugeren kan ikke logge ind før genaktivering.', 'btn-activate': 'Aktiver denne konto igen.', 'btn-exportPdf': 'Eksporter brugerprofilen som PDF — vælg hvilke sektioner der skal inkluderes.', 'btn-tilbage': 'Gå tilbage til den forrige sektion.', 'profile-workload': 'Fordeling af tildelte sager efter status — viser arbejdsbelastning.', 'profile-security': 'Sikkerhedsoplysninger — kun synlig for administratorer.', 'btn-clearTokens': 'Ryd alle aktive reset tokens og OTP koder for denne bruger.',
        'btn-logout': 'Log ud af systemet — du vil blive sendt til login-siden.',
        'lang-switcher': 'Skift sprog for tooltips — Dansk, Engelsk eller Fransk.',
    },

    en: {
        'nav-dashboard': 'Go to Dashboard — overview of open, in-progress and resolved tickets.', 'nav-tickets': 'Go to Tickets — view, search and manage all support requests.', 'nav-tasks': 'Go to Tasks — create and assign work tasks to supporters.', 'nav-ticketDetail': 'Go to Ticket Detail — view full information about a selected ticket.', 'nav-qrList': 'Go to Reports — browse all generated QR codes from resolved tickets.', 'nav-qrDetail': 'Go to QR Detail — view report and documentation after scan.', 'nav-notifications': 'Go to Notifications — view assignments, updates and reminders.', 'nav-lookup': 'Go to Lookups — manage categories, departments, priorities and statuses.', 'nav-comment': 'Go to Comments — view all comments across tickets.', 'nav-history': 'Go to History — view all changes and activities on tickets over time.', 'nav-settings': 'Go to Settings — manage password, users, roles and lookup data.', 'nav-minProfil': 'Open your own user profile — view your tickets, tasks, activity and account details.',
        'btn-refresh': 'Reload the page to fetch the latest data from the system.', 'btn-createTicket': 'Create a new support request — fill in title, description, category and priority.',
        'stat-open': 'Number of tickets with status Open — awaiting processing.', 'stat-progress': 'Number of tickets currently being handled by a supporter.', 'stat-resolved': 'Number of tickets marked as resolved.', 'stat-total': 'Total number of tickets in the system.', 'card-recentTickets': 'Latest support requests — shows title, category, department and status.', 'card-quickOverview': 'Quick overview — active supporters, unassigned tickets and overdue deadlines.', 'overview-assignees': 'Number of supporters currently assigned to at least one ticket.', 'overview-unassigned': 'Number of tickets without an assigned supporter — requires action.', 'overview-overdue': 'Number of tickets that have exceeded their due date.',
        'ticket-search': 'Search tickets by title or description.', 'ticket-filter-status': 'Filter tickets by status.', 'ticket-filter-department': 'Filter tickets by department.', 'btn-newTicket': 'Create a new support request.', 'btn-viewTicket': 'Open detailed view of this ticket.', 'btn-editTicket': 'Edit ticket details.', 'btn-deleteTicket': 'Permanently delete this ticket. Cannot be undone. (Admin only)',
        'modal-title': 'Title of the ticket — short and descriptive.', 'modal-desc': 'Description of the problem — as detailed as possible.', 'modal-category': 'Select the category that best fits the ticket.', 'modal-priority': 'Select priority — how quickly should the ticket be handled?', 'modal-status': 'Current status of the ticket in the workflow.', 'modal-department': 'Which department should handle the ticket?', 'modal-assign': 'Assign the ticket to a specific supporter.', 'modal-dueDate': 'Deadline for when the ticket should be resolved.', 'btn-saveTicket': 'Save the ticket — creates new or updates existing.', 'btn-cancelModal': 'Close the form without saving changes.',
        'task-ticketId': 'Select which ticket the task belongs to.', 'task-assignedUser': 'Select which supporter the task is assigned to.', 'task-title': 'Short title for the task.', 'task-status': 'Current status of the task.', 'task-description': 'Detailed description of what the task involves.', 'task-dueDate': 'Deadline for completing the task.', 'btn-createTask': 'Create the task and assign it to the selected supporter.',
        'ticketDetail-select': 'Select which ticket you want to view details for.', 'reply-summary': 'Short summary of the work completed.', 'reply-resolution': 'Detailed description of the solution — visible to admin.', 'reply-attachment': 'Name of attached file.', 'btn-confirmReply': 'Confirm the work and generate report + QR code for the ticket.',
        'btn-markAllRead': 'Mark all notifications as read at once.', 'btn-markRead': 'Mark this notification as read.', 'notif-badge': 'Number of unread notifications.',
        'comment-internal': 'Internal comment is only visible to Admin and Support.', 'btn-deleteComment': 'Permanently delete this comment.',
        'lookup-categories': 'Overview of all ticket categories.', 'lookup-departments': 'Overview of all departments.', 'lookup-priorities': 'Overview of all priorities.', 'lookup-statuses': 'Overview of all statuses.',
        'settings-password': 'Send a reset link to your email to change your password.', 'settings-roles': 'Manage roles in the system. (Admin only)', 'settings-users': 'Manage users. (Admin only)', 'settings-categories': 'Manage ticket categories. (Admin only)', 'settings-departments': 'Manage departments. (Admin only)', 'btn-sendResetLink': 'Send a link with a 6-digit code to your email — expires after 10 minutes.', 'btn-newRole': 'Create a new role.', 'btn-newUser': 'Create a new user.', 'btn-newCategory': 'Create a new category.', 'btn-newDepartment': 'Create a new department.', 'btn-editRole': 'Edit this role.', 'btn-deleteRole': 'Permanently delete this role.', 'btn-editUser': 'Edit the user details.', 'btn-deleteUser': 'Permanently delete this user.', 'btn-userProfile': 'Open detailed user profile for this user.', 'btn-editCategory': 'Edit this category.', 'btn-deleteCategory': 'Permanently delete this category.', 'btn-editDepartment': 'Edit this department.', 'btn-deleteDepartment': 'Permanently delete this department.', 'input-search-user': 'Search for users by name, username or email.', 'filter-role': 'Filter the user list by role.',
        'profile-avatar': 'Click to upload or change profile picture. Hover to delete.', 'profile-online': 'Green dot = user has been active within the last 15 minutes.', 'profile-offline': 'Grey dot = user has not been active recently.', 'profile-deactivated': 'This account is deactivated — the user cannot log in.', 'btn-deactivate': 'Deactivate this account — the user cannot log in until reactivated.', 'btn-activate': 'Reactivate this account.', 'btn-exportPdf': 'Export the user profile as PDF — choose which sections to include.', 'btn-tilbage': 'Go back to the previous section.', 'profile-workload': 'Distribution of assigned tickets by status — shows workload.', 'profile-security': 'Security information — only visible to administrators.', 'btn-clearTokens': 'Clear all active reset tokens and OTP codes for this user.',
        'btn-logout': 'Log out of the system — you will be redirected to the login page.',
        'lang-switcher': 'Switch tooltip language — Danish, English or French.',
    },

    fr: {
        'nav-dashboard': 'Aller au Tableau de bord — aperçu des tickets ouverts, en cours et résolus.', 'nav-tickets': 'Aller aux Tickets — voir, rechercher et gérer toutes les demandes de support.', 'nav-tasks': 'Aller aux Tâches — créer et attribuer des tâches aux agents.', 'nav-ticketDetail': 'Aller aux Détails du ticket — voir toutes les informations sur un ticket.', 'nav-qrList': 'Aller à la Liste QR — parcourir tous les codes QR générés.', 'nav-qrDetail': 'Aller aux Détails QR — voir le rapport après scan.', 'nav-notifications': 'Aller aux Notifications — voir les attributions, mises à jour et rappels.', 'nav-lookup': 'Aller aux Données de référence — gérer catégories, départements, priorités et statuts.', 'nav-comment': 'Aller aux Commentaires — voir tous les commentaires sur tous les tickets.', 'nav-history': 'Aller à l\'Historique — voir toutes les modifications et activités.', 'nav-settings': 'Aller aux Paramètres — gérer mot de passe, utilisateurs et rôles.', 'nav-minProfil': 'Ouvrir votre profil utilisateur — voir vos tickets, tâches et activité.',
        'btn-refresh': 'Recharger la page pour obtenir les dernières données.', 'btn-createTicket': 'Créer une nouvelle demande de support.',
        'stat-open': 'Nombre de tickets avec le statut Open — en attente.', 'stat-progress': 'Nombre de tickets en cours de traitement.', 'stat-resolved': 'Nombre de tickets marqués comme résolus.', 'stat-total': 'Nombre total de tickets dans le système.', 'card-recentTickets': 'Dernières demandes de support.', 'card-quickOverview': 'Aperçu rapide — agents actifs, tickets non attribués et délais dépassés.', 'overview-assignees': 'Nombre d\'agents assignés à au moins un ticket.', 'overview-unassigned': 'Nombre de tickets sans agent assigné — action requise.', 'overview-overdue': 'Nombre de tickets ayant dépassé leur date d\'échéance.',
        'ticket-search': 'Rechercher des tickets par titre ou description.', 'ticket-filter-status': 'Filtrer les tickets par statut.', 'ticket-filter-department': 'Filtrer les tickets par département.', 'btn-newTicket': 'Créer une nouvelle demande de support.', 'btn-viewTicket': 'Ouvrir la vue détaillée de ce ticket.', 'btn-editTicket': 'Modifier les informations du ticket.', 'btn-deleteTicket': 'Supprimer définitivement ce ticket. Irréversible. (Admin uniquement)',
        'modal-title': 'Titre du ticket — court et descriptif.', 'modal-desc': 'Description du problème — aussi détaillée que possible.', 'modal-category': 'Sélectionner la catégorie appropriée.', 'modal-priority': 'Sélectionner la priorité de traitement.', 'modal-status': 'Statut actuel du ticket.', 'modal-department': 'Département responsable du ticket.', 'modal-assign': 'Attribuer le ticket à un agent.', 'modal-dueDate': 'Date limite de résolution.', 'btn-saveTicket': 'Enregistrer le ticket.', 'btn-cancelModal': 'Fermer sans enregistrer.',
        'task-ticketId': 'Sélectionner le ticket associé à la tâche.', 'task-assignedUser': 'Sélectionner l\'agent assigné.', 'task-title': 'Titre court de la tâche.', 'task-status': 'Statut actuel de la tâche.', 'task-description': 'Description détaillée de la tâche.', 'task-dueDate': 'Date limite de la tâche.', 'btn-createTask': 'Créer et assigner la tâche.',
        'ticketDetail-select': 'Sélectionner le ticket à afficher.', 'reply-summary': 'Résumé du travail effectué.', 'reply-resolution': 'Description détaillée de la solution.', 'reply-attachment': 'Nom du fichier joint.', 'btn-confirmReply': 'Confirmer et générer rapport + code QR.',
        'btn-markAllRead': 'Marquer toutes les notifications comme lues.', 'btn-markRead': 'Marquer cette notification comme lue.', 'notif-badge': 'Nombre de notifications non lues.',
        'comment-internal': 'Commentaire interne visible uniquement par Admin et Support.', 'btn-deleteComment': 'Supprimer définitivement ce commentaire.',
        'lookup-categories': 'Aperçu de toutes les catégories.', 'lookup-departments': 'Aperçu de tous les départements.', 'lookup-priorities': 'Aperçu de toutes les priorités.', 'lookup-statuses': 'Aperçu de tous les statuts.',
        'settings-password': 'Envoyer un lien de réinitialisation à votre email.', 'settings-roles': 'Gérer les rôles. (Admin uniquement)', 'settings-users': 'Gérer les utilisateurs. (Admin uniquement)', 'settings-categories': 'Gérer les catégories. (Admin uniquement)', 'settings-departments': 'Gérer les départements. (Admin uniquement)', 'btn-sendResetLink': 'Envoyer un lien avec un code à 6 chiffres — expire après 10 minutes.', 'btn-newRole': 'Créer un nouveau rôle.', 'btn-newUser': 'Créer un nouvel utilisateur.', 'btn-newCategory': 'Créer une nouvelle catégorie.', 'btn-newDepartment': 'Créer un nouveau département.', 'btn-editRole': 'Modifier ce rôle.', 'btn-deleteRole': 'Supprimer ce rôle.', 'btn-editUser': 'Modifier les informations.', 'btn-deleteUser': 'Supprimer cet utilisateur.', 'btn-userProfile': 'Ouvrir le profil de cet utilisateur.', 'btn-editCategory': 'Modifier cette catégorie.', 'btn-deleteCategory': 'Supprimer cette catégorie.', 'btn-editDepartment': 'Modifier ce département.', 'btn-deleteDepartment': 'Supprimer ce département.', 'input-search-user': 'Rechercher par nom, identifiant ou email.', 'filter-role': 'Filtrer par rôle.',
        'profile-avatar': 'Cliquer pour changer la photo. Survoler pour supprimer.', 'profile-online': 'Point vert = actif dans les 15 dernières minutes.', 'profile-offline': 'Point gris = inactif récemment.', 'profile-deactivated': 'Compte désactivé — connexion impossible.', 'btn-deactivate': 'Désactiver ce compte.', 'btn-activate': 'Réactiver ce compte.', 'btn-exportPdf': 'Exporter le profil en PDF.', 'btn-tilbage': 'Retourner à la section précédente.', 'profile-workload': 'Répartition des tickets assignés par statut.', 'profile-security': 'Informations de sécurité — administrateurs uniquement.', 'btn-clearTokens': 'Effacer les tokens et codes OTP actifs.',
        'btn-logout': 'Se déconnecter — redirection vers la page de connexion.',
        'lang-switcher': 'Changer la langue — Danois, Anglais ou Français.',
    }
};

// ── Language Manager ───────────────────────────────────────────────────────
const LANG_KEY = 'nexdesk-lang';
const SUPPORTED_LANGS = ['da', 'en', 'fr'];
const LANG_LABELS = {
    da: '<img src="https://flagcdn.com/16x12/dk.png" alt="DK"> DA',
    en: '<img src="https://flagcdn.com/16x12/gb.png" alt="EN"> EN',
    fr: '<img src="https://flagcdn.com/16x12/fr.png" alt="FR"> FR'
};
function getCurrentLang() {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
    // Debug — log current chatbot language to console
  
}

function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    console.log("🌐 Chatbot language:", lang);
}

function getTooltipText(key) {
    const lang = getCurrentLang();
    return nexdeskTooltipDictionary[lang]?.[key]
        ?? nexdeskTooltipDictionary['da']?.[key]
        ?? key;
}

// ── Tooltip Engine ─────────────────────────────────────────────────────────
(function () {
    let tooltipEl = null;
    let showTimer = null;

    function createTooltipEl() {
        const el = document.createElement('div');
        el.id = 'nexdeskTooltip';
        el.style.cssText = `
            position:fixed;background:#1e2a3a;color:#e2e8f0;
            border:1px solid #4a9eff44;border-radius:8px;
            padding:0.5rem 0.75rem;font-size:0.78rem;max-width:280px;
            line-height:1.4;pointer-events:none;z-index:99999;
            opacity:0;transition:opacity 0.2s;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
        `;
        document.body.appendChild(el);
        return el;
    }

    function showTooltip(text, x, y) {
        if (!tooltipEl) tooltipEl = createTooltipEl();
        tooltipEl.textContent = text;
        tooltipEl.style.opacity = '1';
        positionTooltip(x, y);
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.style.opacity = '0';
        clearTimeout(showTimer);
    }

    function positionTooltip(x, y) {
        if (!tooltipEl) return;
        const margin = 12;
        const tw = tooltipEl.offsetWidth;
        const th = tooltipEl.offsetHeight;
        let left = x + margin;
        let top = y + margin;
        if (left + tw > window.innerWidth - 10) left = x - tw - margin;
        if (top + th > window.innerHeight - 10) top = y - th - margin;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
    }

    document.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-tooltip]');
        if (!el) return;
        const key = el.getAttribute('data-tooltip');
        const text = getTooltipText(key);
        clearTimeout(showTimer);
        showTimer = setTimeout(() => showTooltip(text, e.clientX, e.clientY), 800);
    });

    document.addEventListener('mousemove', e => {
        if (tooltipEl && tooltipEl.style.opacity === '1') positionTooltip(e.clientX, e.clientY);
    });

    document.addEventListener('mouseout', e => {
        if (e.target.closest('[data-tooltip]')) hideTooltip();
    });

         document.addEventListener('click', hideTooltip);
    })();