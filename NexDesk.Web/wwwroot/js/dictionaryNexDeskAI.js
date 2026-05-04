// ── NexDesk AI Dictionary ──────────────────────────────────────────────────
// File: dictionaryNexDeskAI.js
// Purpose: All chatbot Q&A responses in 3 languages (da, en, fr)
// Language key matches tooltip.js — uses getCurrentLang() from tooltip.js
// To add more Q&A: just add new keys in all 3 language blocks below
// ──────────────────────────────────────────────────────────────────────────
/*
What's in here:

40+ Q&A entries per language covering every feature in NexDesk
All 3 languages — da, en, fr — same keys, so switching language works instantly
Organized by section with comments so you can easily find and add more entries
To add new Q&A: just add a new key in all 3 language blocks

*/

const nexdeskAIDictionary = {

    da: {
        // ── Greetings ──
        greeting: 'Hej! Jeg er din NexDesk AI assistent. Spørg mig om systemet, tickets eller IT support!',
        hello: 'Hej! Hvordan kan jeg hjælpe dig i dag?',
        how_are_you: 'Jeg fungerer perfekt! Hvad kan jeg hjælpe dig med i NexDesk?',
        thank_you: 'Selv tak! Jeg er her når du har brug for hjælp.',
        goodbye: 'Farvel! Kom tilbage hvis du har flere spørgsmål.',
        default_fallback: 'Jeg forstår ikke helt. Prøv at spørge om tickets, opgaver, brugere eller systemet generelt.',

        // ── Dashboard ──
        dashboard: 'Dashboard er startsiden i NexDesk. Her ser du et overblik over åbne, igangværende og løste sager, seneste tickets og en hurtig oversigt over supporternes arbejdsbelastning.',
        open_tickets: 'Åbne tickets er sager der endnu ikke er tildelt eller påbegyndt. De kræver handling.',
        in_progress: 'Igangværende tickets er sager en supporter aktivt arbejder på.',
        resolved: 'Løste tickets er sager der er markeret som afsluttede af en supporter.',
        total_tickets: 'Det samlede antal tickets viser alle sager i systemet uanset status.',
        overdue: 'Forfaldne tickets er sager der har overskredet deres frist. Tjek opgavelisten for at prioritere.',
        unassigned: 'Ikke-tildelte tickets er sager uden en supporter. En admin bør tildele dem hurtigst muligt.',
        active_assignees: 'Aktive supportere viser hvor mange supportere der aktuelt har sager tildelt.',

        // ── Tickets ──
        what_is_ticket: 'En ticket er en supporthenvendelse. Den indeholder titel, beskrivelse, kategori, prioritet, status, afdeling og tildelt supporter.',
        create_ticket: 'For at oprette en ticket: klik på "Create Ticket" knappen øverst til højre. Udfyld titel, beskrivelse, kategori, prioritet og afdeling. Klik Gem.',
        edit_ticket: 'For at redigere en ticket: find den i Sager-sektionen, klik på "Edit" knappen, foretag ændringer og klik Gem.',
        delete_ticket: 'For at slette en ticket: klik på den røde "Delete" knap i Sager-sektionen. Kun admin kan slette tickets.',
        ticket_status: 'En ticket kan have disse statusser: Open (åben), Waiting for Support (afventer), In Progress (i gang), Resolved (løst), Closed (lukket).',
        ticket_priority: 'Prioriteter er: Low (lav), Medium (mellem), High (høj), Critical (kritisk). De viser hvor hurtigt en sag skal behandles.',
        ticket_category: 'Kategorier bruges til at klassificere tickets — f.eks. Login issues, Network issues, Software issues. Admin administrerer kategorier i Indstillinger.',
        ticket_department: 'Afdelinger bruges til at dirigere tickets til den rette gruppe — f.eks. Infrastructure eller Development.',
        assign_ticket: 'For at tildele en ticket til en supporter: åbn ticketen, vælg supporteren i "Assign To" feltet og gem.',
        search_ticket: 'Du kan søge efter tickets ved at skrive i søgefeltet i Sager-sektionen. Du kan også filtrere efter status og afdeling.',
        ticket_example: 'Eksempel på en god ticket:\n\nTitel: "Kan ikke logge ind på min konto"\n\nBeskrivelse: "Jeg forsøger at logge ind med mit brugernavn og adgangskode, men systemet viser fejlen \'Ugyldigt brugernavn eller adgangskode\'. Problemet startede i dag kl. 09:00. Jeg har prøvet at nulstille adgangskoden uden held."\n\nKategori: Login issues\nPrioritet: High\nAfdeling: Infrastructure',



        // ── Tasks ──
        what_is_task: 'En opgave er et konkret stykke arbejde knyttet til en ticket. Admin opretter opgaver og tildeler dem til supportere.',
        create_task: 'For at oprette en opgave: gå til Opgaver-sektionen, vælg en ticket, vælg en supporter, udfyld titel og beskrivelse, sæt en frist og klik Opret.',
        task_status: 'Opgaver har statusser: Open, In Progress, Resolved, Closed — samme som tickets.',
        task_assign: 'En opgave tildeles en supporter ved at vælge dem i "Assigned To" feltet når opgaven oprettes.',
        task_example: 'Eksempel på en god opgave:\n\nTitel: "Nulstil brugerens adgangskode"\n\nBeskrivelse: "Brugeren kan ikke logge ind. Nulstil adgangskoden manuelt i systemet og verificer at brugeren kan logge ind bagefter."\n\nTilknyttet sag: #1 - Cannot login to account\nTildelt til: Bob Supporter\nStatus: Open\nFrist: I morgen kl. 10:00',


        // ── Notifications ──
        what_is_notification: 'Notifikationer er beskeder om hændelser i systemet — f.eks. tildeling af en sag, opdateringer eller påmindelser.',
        mark_read: 'Du kan markere en notifikation som læst ved at klikke på "Marker som læst" knappen. Brug "Marker alle som læst" for at rydde alle på én gang.',
        notif_badge: 'Det røde tal på Notifications knappen viser antallet af ulæste notifikationer.',

        // ── Comments ──
        what_is_comment: 'Kommentarer er beskeder skrevet på en ticket. De kan være synlige for alle eller interne (kun Admin og Support).',
        internal_comment: 'En intern kommentar er kun synlig for Admin og Support — ikke for den bruger der oprettede sagen.',
        add_comment: 'For at tilføje en kommentar: gå til Ticket Detail, skriv din kommentar i feltet og klik Tilføj.',

        // ── History ──
        what_is_history: 'Historik viser alle ændringer foretaget på tickets — hvem ændrede hvad og hvornår. F.eks. statusskift, tildeling og kommentarer.',

        // ── QR Codes ──
        what_is_qr: 'QR koder genereres automatisk når en supporter bekræfter afslutningen af en sag via Ticket Detail. De bruges til dokumentation.',
        qr_list: 'QR Kode Listen viser alle genererede QR koder fra løste sager. Du kan vælge en for at se detaljer.',

        // ── Settings ──
        what_is_settings: 'Indstillinger giver adgang til adgangskode-nulstilling, brugeradministration, rolleadministration, kategorier og afdelinger.',
        password_reset: 'For at nulstille din adgangskode: gå til Indstillinger → Adgangskode → klik "Send link til nulstilling". Du modtager en email med en 6-cifret kode.',
        what_is_roles: 'Roller definerer hvad en bruger kan gøre i systemet. Admin har fuld adgang, Support kan arbejde på tildelte sager, User kan kun indsende sager via webformularen.',
        manage_users: 'Admin kan administrere brugere under Indstillinger → Brugere. Her kan du oprette, redigere, slette og søge i brugere.',
        manage_roles: 'Admin kan administrere roller under Indstillinger → Roller. Du kan oprette og slette roller.',
        manage_categories: 'Admin kan administrere ticket-kategorier under Indstillinger → Kategorier.',
        manage_departments: 'Admin kan administrere afdelinger under Indstillinger → Afdelinger.',

        // ── User Profile ──
        what_is_profile: 'Brugerprofil viser detaljeret information om en bruger — deres tickets, opgaver, kommentarer, notifikationer, historik og sikkerhedsoplysninger.',
        open_profile: 'For at åbne en brugerprofil: gå til Indstillinger → Brugere, find brugeren og klik på "Profil" knappen.',
        my_profile: 'Du kan åbne din egen profil ved at klikke på "Min Profil" knappen i bunden af navigationsmenuen.',
        deactivate_user: 'Admin kan deaktivere en konto ved at åbne brugerens profil og klikke "Deaktiver konto". Brugeren kan ikke logge ind mens kontoen er deaktiveret.',
        profile_picture: 'Du kan uploade et profilbillede ved at klikke på avatar-billedet i din profil. Hold musen over for at slette billedet.',
        online_indicator: 'Den grønne prik ved en brugers avatar betyder at de har været aktive inden for de sidste 15 minutter.',
        export_pdf: 'Du kan eksportere en brugerprofil som PDF ved at klikke på "Eksporter PDF" knappen. Vælg hvilke sektioner der skal inkluderes.',

        // ── Login ──
        login_admin: 'Admin-login kræver brugernavn, adgangskode OG RFID chip. Dette er for ekstra sikkerhed.',
        login_support: 'Support-login kræver kun brugernavn og adgangskode — ingen RFID.',
        rfid: 'RFID er en fysisk chip der bruges til ekstra sikkerhed ved admin-login. Kun admins har RFID.',

        // ── Lookups ──
        what_is_lookups: 'Opslagsdata viser alle kategorier, afdelinger, prioriteter og statuser der bruges i systemet. De er skrivebeskyttede her — ændr dem i Indstillinger.',

        // ── General IT ──
        what_is_sla: 'SLA (Service Level Agreement) er en aftale om hvor hurtigt en sag skal løses. Forfaldne tickets har overskredet deres SLA-frist.',
        it_support: 'IT support hjælper brugere med tekniske problemer — hardware, software, netværk og login. Opret en ticket for at få hjælp.',
        network_issue: 'Ved netværksproblemer: tjek din kabelforbindelse, genstart routeren og kontakt IT support via en ny ticket.',
        password_issue: 'Har du glemt din adgangskode? Brug "Glemt adgangskode" funktionen på login-siden eller kontakt din administrator.',
        language_switch: 'Du kan skifte sprog med DK/GB/FR knapperne øverst til højre. Alle tooltips og chatbotten tilpasser sig automatisk.',

        // ── Features overview ──
        features: 'NexDesk funktioner inkluderer: Tickets, Opgaver, Notifikationer, Kommentarer, Historik, QR koder, Brugerprofiler, Indstillinger og denne AI assistent!',
        what_can_you_do: 'Jeg kan forklare alle funktioner i NexDesk, guide dig trin-for-trin og svare på generelle IT support spørgsmål. Hvad vil du vide?',
    },

    en: {
        // ── Greetings ──
        greeting: 'Hi! I\'m your NexDesk AI assistant. Ask me anything about the system, tickets or IT support!',
        hello: 'Hello! How can I help you today?',
        how_are_you: 'Running smoothly! What can I help you with in NexDesk?',
        thank_you: 'You\'re welcome! I\'m here whenever you need help.',
        goodbye: 'Goodbye! Come back if you have more questions.',
        default_fallback: 'I\'m not sure I understand. Try asking about tickets, tasks, users or the system in general.',

        // ── Dashboard ──
        dashboard: 'The Dashboard is the home page of NexDesk. It shows an overview of open, in-progress and resolved tickets, recent tickets and a quick snapshot of supporter workload.',
        open_tickets: 'Open tickets are cases not yet assigned or started. They require action.',
        in_progress: 'In-progress tickets are cases a supporter is actively working on.',
        resolved: 'Resolved tickets are cases marked as completed by a supporter.',
        total_tickets: 'Total tickets shows all tickets in the system regardless of status.',
        overdue: 'Overdue tickets have exceeded their due date. Check the task list to prioritize.',
        unassigned: 'Unassigned tickets have no supporter. An admin should assign them as soon as possible.',
        active_assignees: 'Active assignees shows how many supporters currently have tickets assigned to them.',

        // ── Tickets ──
        what_is_ticket: 'A ticket is a support request. It contains title, description, category, priority, status, department and assigned supporter.',
        create_ticket: 'To create a ticket: click the "Create Ticket" button in the top right. Fill in the title, description, category, priority and department. Click Save.',
        edit_ticket: 'To edit a ticket: find it in the Tickets section, click the "Edit" button, make changes and click Save.',
        delete_ticket: 'To delete a ticket: click the red "Delete" button in the Tickets section. Only admins can delete tickets.',
        ticket_status: 'A ticket can have these statuses: Open, Waiting for Support, In Progress, Resolved, Closed.',
        ticket_priority: 'Priorities are: Low, Medium, High, Critical. They indicate how quickly a case needs attention.',
        ticket_category: 'Categories classify tickets — e.g. Login issues, Network issues, Software issues. Admin manages categories in Settings.',
        ticket_department: 'Departments route tickets to the right group — e.g. Infrastructure or Development.',
        assign_ticket: 'To assign a ticket to a supporter: open the ticket, select the supporter in the "Assign To" field and save.',
        search_ticket: 'You can search for tickets by typing in the search field in the Tickets section. You can also filter by status and department.',
        ticket_example: 'Example of a good ticket:\n\nTitle: "Cannot log in to my account"\n\nDescription: "I am trying to log in with my username and password but the system shows the error \'Invalid credentials\'. The problem started today at 09:00. I have tried resetting my password without success."\n\nCategory: Login issues\nPriority: High\nDepartment: Infrastructure',

        // ── Tasks ──
        what_is_task: 'A task is a specific piece of work linked to a ticket. Admins create tasks and assign them to supporters.',
        create_task: 'To create a task: go to the Tasks section, select a ticket, select a supporter, fill in the title and description, set a due date and click Create.',
        task_status: 'Tasks have statuses: Open, In Progress, Resolved, Closed — same as tickets.',
        task_assign: 'A task is assigned to a supporter by selecting them in the "Assigned To" field when creating the task.',
        task_example: 'Example of a good task:\n\nTitle: "Reset user password"\n\nDescription: "The user cannot log in. Manually reset the password in the system and verify the user can log in afterwards."\n\nLinked ticket: #1 - Cannot login to account\nAssigned to: Bob Supporter\nStatus: Open\nDue date: Tomorrow at 10:00',

        // ── Notifications ──
        what_is_notification: 'Notifications are messages about events in the system — e.g. ticket assignment, updates or reminders.',
        mark_read: 'You can mark a notification as read by clicking "Mark as read". Use "Mark all as read" to clear all at once.',
        notif_badge: 'The red number on the Notifications button shows how many unread notifications you have.',

        // ── Comments ──
        what_is_comment: 'Comments are messages written on a ticket. They can be visible to everyone or internal (Admin and Support only).',
        internal_comment: 'An internal comment is only visible to Admin and Support — not to the user who created the ticket.',
        add_comment: 'To add a comment: go to Ticket Detail, write your comment in the field and click Add.',

        // ── History ──
        what_is_history: 'History shows all changes made to tickets — who changed what and when. E.g. status changes, assignments and comments.',

        // ── QR Codes ──
        what_is_qr: 'QR codes are automatically generated when a supporter confirms the completion of a ticket via Ticket Detail. They are used for documentation.',
        qr_list: 'The Reports shows all generated QR codes from resolved tickets. Select one to see details.',

        // ── Settings ──
        what_is_settings: 'Settings provides access to password reset, user management, role management, categories and departments.',
        password_reset: 'To reset your password: go to Settings → Password → click "Send reset link". You will receive an email with a 6-digit code.',
        what_is_roles: 'Roles define what a user can do in the system. Admin has full access, Support can work on assigned tickets, User can only submit tickets via the web form.',
        manage_users: 'Admin can manage users under Settings → Users. You can create, edit, delete and search for users.',
        manage_roles: 'Admin can manage roles under Settings → Roles. You can create and delete roles.',
        manage_categories: 'Admin can manage ticket categories under Settings → Categories.',
        manage_departments: 'Admin can manage departments under Settings → Departments.',

        // ── User Profile ──
        what_is_profile: 'The User Profile shows detailed information about a user — their tickets, tasks, comments, notifications, history and security details.',
        open_profile: 'To open a user profile: go to Settings → Users, find the user and click the "Profile" button.',
        my_profile: 'You can open your own profile by clicking the "My Profile" button at the bottom of the navigation menu.',
        deactivate_user: 'Admin can deactivate an account by opening the user\'s profile and clicking "Deactivate account". The user cannot log in while deactivated.',
        profile_picture: 'You can upload a profile picture by clicking the avatar in your profile. Hover over it to delete the picture.',
        online_indicator: 'The green dot next to a user\'s avatar means they have been active within the last 15 minutes.',
        export_pdf: 'You can export a user profile as PDF by clicking the "Export PDF" button. Choose which sections to include.',

        // ── Login ──
        login_admin: 'Admin login requires username, password AND RFID chip. This is for extra security.',
        login_support: 'Support login only requires username and password — no RFID needed.',
        rfid: 'RFID is a physical chip used for extra security during admin login. Only admins use RFID.',

        // ── Lookups ──
        what_is_lookups: 'Lookups shows all categories, departments, priorities and statuses used in the system. They are read-only here — change them in Settings.',

        // ── General IT ──
        what_is_sla: 'SLA (Service Level Agreement) is an agreement on how quickly a case must be resolved. Overdue tickets have exceeded their SLA deadline.',
        it_support: 'IT support helps users with technical problems — hardware, software, network and login. Create a ticket to get help.',
        network_issue: 'For network issues: check your cable connection, restart the router and contact IT support via a new ticket.',
        password_issue: 'Forgot your password? Use the "Forgot password" function on the login page or contact your administrator.',
        language_switch: 'You can switch language using the DK/GB/FR buttons in the top right. All tooltips and the chatbot adapt automatically.',

        // ── Features overview ──
        features: 'NexDesk features include: Tickets, Tasks, Notifications, Comments, History, QR Codes, User Profiles, Settings and this AI assistant!',
        what_can_you_do: 'I can explain all NexDesk features, guide you step by step and answer general IT support questions. What would you like to know?',
    },

    fr: {
        // ── Greetings ──
        greeting: 'Salut ! Je suis votre assistant IA NexDesk. Posez-moi des questions sur le système, les tickets ou le support IT !',
        hello: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
        how_are_you: 'Je fonctionne parfaitement ! Comment puis-je vous aider dans NexDesk ?',
        thank_you: 'Avec plaisir ! Je suis là quand vous avez besoin d\'aide.',
        goodbye: 'Au revoir ! Revenez si vous avez d\'autres questions.',
        default_fallback: 'Je ne comprends pas tout à fait. Essayez de demander des informations sur les tickets, tâches, utilisateurs ou le système en général.',

        // ── Dashboard ──
        dashboard: 'Le Tableau de bord est la page d\'accueil de NexDesk. Il affiche un aperçu des tickets ouverts, en cours et résolus, les tickets récents et la charge de travail des agents.',
        open_tickets: 'Les tickets ouverts sont des cas non encore assignés ou démarrés. Ils nécessitent une action.',
        in_progress: 'Les tickets en cours sont des cas qu\'un agent traite activement.',
        resolved: 'Les tickets résolus sont des cas marqués comme terminés par un agent.',
        total_tickets: 'Le total des tickets affiche tous les tickets du système quel que soit leur statut.',
        overdue: 'Les tickets en retard ont dépassé leur date d\'échéance. Consultez la liste des tâches pour prioriser.',
        unassigned: 'Les tickets non attribués n\'ont pas d\'agent. Un admin doit les attribuer dès que possible.',
        active_assignees: 'Les agents actifs montre combien d\'agents ont actuellement des tickets assignés.',

        // ── Tickets ──
        what_is_ticket: 'Un ticket est une demande de support. Il contient un titre, une description, une catégorie, une priorité, un statut, un département et un agent assigné.',
        create_ticket: 'Pour créer un ticket : cliquez sur le bouton "Create Ticket" en haut à droite. Remplissez le titre, la description, la catégorie, la priorité et le département. Cliquez sur Enregistrer.',
        edit_ticket: 'Pour modifier un ticket : trouvez-le dans la section Tickets, cliquez sur le bouton "Edit", apportez des modifications et cliquez sur Enregistrer.',
        delete_ticket: 'Pour supprimer un ticket : cliquez sur le bouton rouge "Delete" dans la section Tickets. Seuls les admins peuvent supprimer des tickets.',
        ticket_status: 'Un ticket peut avoir ces statuts : Open, Waiting for Support, In Progress, Resolved, Closed.',
        ticket_priority: 'Les priorités sont : Low, Medium, High, Critical. Elles indiquent la rapidité avec laquelle un cas doit être traité.',
        ticket_category: 'Les catégories classifient les tickets — ex. Login issues, Network issues, Software issues. L\'admin gère les catégories dans Paramètres.',
        ticket_department: 'Les départements dirigent les tickets vers le bon groupe — ex. Infrastructure ou Development.',
        assign_ticket: 'Pour assigner un ticket à un agent : ouvrez le ticket, sélectionnez l\'agent dans le champ "Assign To" et enregistrez.',
        search_ticket: 'Vous pouvez rechercher des tickets en tapant dans le champ de recherche dans la section Tickets. Vous pouvez aussi filtrer par statut et département.',
        ticket_example: 'Exemple d\'un bon ticket :\n\nTitre : "Impossible de me connecter à mon compte"\n\nDescription : "J\'essaie de me connecter avec mon nom d\'utilisateur et mon mot de passe mais le système affiche l\'erreur \'Identifiants invalides\'. Le problème a commencé aujourd\'hui à 09h00. J\'ai essayé de réinitialiser le mot de passe sans succès."\n\nCatégorie : Login issues\nPriorité : High\nDépartement : Infrastructure',

        // ── Tasks ──
        what_is_task: 'Une tâche est un travail spécifique lié à un ticket. Les admins créent des tâches et les assignent aux agents.',
        create_task: 'Pour créer une tâche : allez dans la section Tâches, sélectionnez un ticket, sélectionnez un agent, remplissez le titre et la description, définissez une date limite et cliquez sur Créer.',
        task_status: 'Les tâches ont des statuts : Open, In Progress, Resolved, Closed — comme les tickets.',
        task_assign: 'Une tâche est assignée à un agent en le sélectionnant dans le champ "Assigned To" lors de la création.',
        task_example: 'Exemple d\'une bonne tâche :\n\nTitre : "Réinitialiser le mot de passe de l\'utilisateur"\n\nDescription : "L\'utilisateur ne peut pas se connecter. Réinitialisez manuellement le mot de passe dans le système et vérifiez que l\'utilisateur peut se connecter ensuite."\n\nTicket lié : #1 - Cannot login to account\nAssigné à : Bob Supporter\nStatut : Open\nDate limite : Demain à 10h00',

        // ── Notifications ──
        what_is_notification: 'Les notifications sont des messages sur les événements du système — ex. attribution de ticket, mises à jour ou rappels.',
        mark_read: 'Vous pouvez marquer une notification comme lue en cliquant sur "Marquer comme lu". Utilisez "Tout marquer comme lu" pour tout effacer en une fois.',
        notif_badge: 'Le nombre rouge sur le bouton Notifications indique combien de notifications non lues vous avez.',

        // ── Comments ──
        what_is_comment: 'Les commentaires sont des messages écrits sur un ticket. Ils peuvent être visibles par tous ou internes (Admin et Support uniquement).',
        internal_comment: 'Un commentaire interne n\'est visible que par l\'Admin et le Support — pas par l\'utilisateur qui a créé le ticket.',
        add_comment: 'Pour ajouter un commentaire : allez dans Détail du ticket, écrivez votre commentaire dans le champ et cliquez sur Ajouter.',

        // ── History ──
        what_is_history: 'L\'historique montre toutes les modifications apportées aux tickets — qui a changé quoi et quand. Ex. changements de statut, attributions et commentaires.',

        // ── QR Codes ──
        what_is_qr: 'Les codes QR sont générés automatiquement lorsqu\'un agent confirme l\'achèvement d\'un ticket via Détail du ticket. Ils sont utilisés pour la documentation.',
        qr_list: 'La liste des codes QR montre tous les codes QR générés depuis les tickets résolus. Sélectionnez-en un pour voir les détails.',

        // ── Settings ──
        what_is_settings: 'Les Paramètres donnent accès à la réinitialisation du mot de passe, la gestion des utilisateurs, des rôles, des catégories et des départements.',
        password_reset: 'Pour réinitialiser votre mot de passe : allez dans Paramètres → Mot de passe → cliquez sur "Envoyer le lien". Vous recevrez un email avec un code à 6 chiffres.',
        what_is_roles: 'Les rôles définissent ce qu\'un utilisateur peut faire dans le système. Admin a un accès complet, Support peut travailler sur les tickets assignés, User ne peut soumettre que des tickets.',
        manage_users: 'L\'admin peut gérer les utilisateurs sous Paramètres → Utilisateurs. Vous pouvez créer, modifier, supprimer et rechercher des utilisateurs.',
        manage_roles: 'L\'admin peut gérer les rôles sous Paramètres → Rôles. Vous pouvez créer et supprimer des rôles.',
        manage_categories: 'L\'admin peut gérer les catégories de tickets sous Paramètres → Catégories.',
        manage_departments: 'L\'admin peut gérer les départements sous Paramètres → Départements.',

        // ── User Profile ──
        what_is_profile: 'Le Profil utilisateur affiche des informations détaillées sur un utilisateur — ses tickets, tâches, commentaires, notifications, historique et détails de sécurité.',
        open_profile: 'Pour ouvrir un profil utilisateur : allez dans Paramètres → Utilisateurs, trouvez l\'utilisateur et cliquez sur le bouton "Profil".',
        my_profile: 'Vous pouvez ouvrir votre propre profil en cliquant sur le bouton "Mon Profil" en bas du menu de navigation.',
        deactivate_user: 'L\'admin peut désactiver un compte en ouvrant le profil de l\'utilisateur et en cliquant sur "Désactiver le compte". L\'utilisateur ne peut pas se connecter tant que le compte est désactivé.',
        profile_picture: 'Vous pouvez télécharger une photo de profil en cliquant sur l\'avatar dans votre profil. Survolez-le pour supprimer la photo.',
        online_indicator: 'Le point vert à côté de l\'avatar d\'un utilisateur signifie qu\'il a été actif dans les 15 dernières minutes.',
        export_pdf: 'Vous pouvez exporter un profil utilisateur en PDF en cliquant sur le bouton "Exporter PDF". Choisissez les sections à inclure.',

        // ── Login ──
        login_admin: 'La connexion Admin nécessite un nom d\'utilisateur, un mot de passe ET une puce RFID. C\'est pour une sécurité supplémentaire.',
        login_support: 'La connexion Support ne nécessite qu\'un nom d\'utilisateur et un mot de passe — pas de RFID.',
        rfid: 'Le RFID est une puce physique utilisée pour la sécurité supplémentaire lors de la connexion admin. Seuls les admins utilisent le RFID.',

        // ── Lookups ──
        what_is_lookups: 'Les Données de référence affichent toutes les catégories, départements, priorités et statuts utilisés dans le système. Ils sont en lecture seule ici — modifiez-les dans Paramètres.',

        // ── General IT ──
        what_is_sla: 'Le SLA (Service Level Agreement) est un accord sur la rapidité avec laquelle un cas doit être résolu. Les tickets en retard ont dépassé leur délai SLA.',
        it_support: 'Le support IT aide les utilisateurs avec des problèmes techniques — matériel, logiciel, réseau et connexion. Créez un ticket pour obtenir de l\'aide.',
        network_issue: 'Pour les problèmes réseau : vérifiez votre connexion par câble, redémarrez le routeur et contactez le support IT via un nouveau ticket.',
        password_issue: 'Mot de passe oublié ? Utilisez la fonction "Mot de passe oublié" sur la page de connexion ou contactez votre administrateur.',
        language_switch: 'Vous pouvez changer de langue avec les boutons DK/GB/FR en haut à droite. Tous les tooltips et le chatbot s\'adaptent automatiquement.',

        // ── Features overview ──
        features: 'Les fonctionnalités NexDesk incluent : Tickets, Tâches, Notifications, Commentaires, Historique, Codes QR, Profils utilisateurs, Paramètres et cet assistant IA !',
        what_can_you_do: 'Je peux expliquer toutes les fonctionnalités NexDesk, vous guider étape par étape et répondre aux questions générales de support IT. Que souhaitez-vous savoir ?',
    }
};