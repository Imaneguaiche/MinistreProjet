# Rapport de Stage : Plateforme HelpDesk pour le Ministère de la Transition Énergétique et du Développement Durable

---

## 1. Page de garde

**Titre :** Conception et Développement d'une Plateforme HelpDesk Intelligente
**Nom et prénom du stagiaire :** [Votre Nom et Prénom]
**Filière :** Développeur Web Full Stack
**Nom de l’établissement de formation :** [Nom de votre établissement, ex: OFPPT / CFHN]
**Nom de l’entreprise d’accueil :** Ministère de la Transition Énergétique et du Développement Durable
**Période du stage :** [Date de début] – [Date de fin]
**Nom du tuteur en entreprise :** [Nom du tuteur]
**Nom de l’encadrant pédagogique :** [Nom de l'encadrant]
**Année de formation :** 2025/2026

*(Note: Insérer ici le logo de l'établissement et le logo du Ministère)*

---

## 2. Remerciements

Je tiens tout d'abord à exprimer ma profonde gratitude à Monsieur/Madame **[Nom du tuteur]**, mon tuteur de stage au sein du Ministère de la Transition Énergétique, pour son accueil, sa disponibilité et ses précieux conseils tout au long de cette période. 

Mes remerciements s'adressent également à l'ensemble de l'équipe informatique et technique du Ministère pour leur soutien constant, leur encadrement technique et la confiance qu'ils m'ont accordée en m'intégrant rapidement dans leurs processus de travail.

Enfin, je remercie mes formateurs et l'équipe pédagogique de **[Nom de l'établissement]** pour la qualité de l'enseignement qui m’a permis d'acquérir les compétences nécessaires à la réalisation de ce projet ambitieux.

---

## 3. Résumé (Abstract)

**Français :**
Ce rapport détaille le travail réalisé lors de mon stage de fin de formation au sein du Ministère de la Transition Énergétique et du Développement Durable. L'objectif principal de ce stage était la conception et le développement d'une plateforme "HelpDesk" complète permettant la gestion numérisée des tickets d'incidents techniques, l'affectation intelligente aux techniciens spécialisés, le suivi des pannes matérielles, et la génération de statistiques analytiques complexes. Réalisée avec les technologies modernes React.js (Frontend) et Laravel (Backend API), la plateforme vise à remplacer les processus manuels et à fluidifier considérablement les interventions techniques au sein des divers départements du Ministère.

**English :**
This report details the work carried out during my end-of-training internship at the Ministry of Energy Transition and Sustainable Development. The main objective was the design and development of a comprehensive "HelpDesk" platform for digital management of technical incident tickets, intelligent assignment to specialized technicians, hardware failure tracking, and the generation of complex analytical statistics. Built using modern technologies such as React.js (Frontend) and Laravel (Backend API), the platform aims to replace manual processes and significantly streamline technical interventions within the various departments of the Ministry.

---

## 4. Table des matières

1. Page de garde
2. Remerciements
3. Résumé (Abstract)
4. Table des matières
5. Introduction
6. Présentation de l’entreprise
7. Présentation du projet
8. Analyse des besoins
9. Conception du système
10. Réalisation (Développement)
11. Tests et validation
12. Résultats obtenus
13. Conclusion générale
14. Bibliographie

---

## 5. Introduction

Avec la transformation numérique accélérée des administrations publiques, la gestion efficace et traçable du parc informatique et des incidents techniques est devenue un enjeu prioritaire. 

Ce stage s'inscrit dans cette volonté de modernisation. L'objectif principal assigné durant ce stage était la conception de A à Z d'un système **HelpDesk multi-rôles** (Personnel, Technicien, HelpDesk, Administrateur) permettant de numériser entièrement la chaîne de support technique du Ministère : depuis la réclamation par un employé jusqu'à la clôture par un technicien et l'analyse managériale.

Ce rapport retrace la méthodologie adoptée, de l'étude conceptuelle jusqu'au déploiement de la solution technique, tout en mettant en exergue l'apport professionnel et technique de ce projet dans mon parcours de Développeur Web Full Stack.

---

## 6. Présentation de l’entreprise

**Nom de l’entreprise d'accueil :** Ministère de la Transition Énergétique et du Développement Durable (Maroc)
**Secteur d’activité :** Secteur Public / Administration gouvernementale

Le Ministère est l'institution gouvernementale chargée de concevoir et de mettre en œuvre la politique nationale dans les domaines de la transition énergétique, de l'environnement et du développement durable. 

Dans un tel environnement gouvernemental, la disponibilité du matériel informatique et des services réseaux est cruciale pour la continuité du service public. Le besoin d'une entité IT forte et structurée est permanent. Les infrastructures actuelles englobent un large parc incluant des centaines de postes informatiques répartis sur plusieurs départements nécessitant une maintenance préventive et corrective rigoureuse.

---

## 7. Présentation du projet

**Contexte du projet :** 
La gestion des demandes d'interventions techniques (pannes ordinateurs, problèmes réseaux, logiciels) se faisait via des canaux non centralisés (appels téléphoniques, emails informels), causant des retards de traitement, une perte d'information, et empêchant l'évaluation de la performance du service IT.

**Problématique :** 
Comment centraliser, suivre et optimiser l'affectation des requêtes de support technique tout en offrant une visibilité en temps réel sur l'état du parc matériel informatique ?

**Objectifs du projet :**
- Digitaliser 100% des demandes de dépannage informatique.
- Router intelligemment les tickets vers le bon technicien selon sa spécialité et sa disponibilité.
- Suivre les états du matériel et générer des rapports statistiques.
- Permettre aux demandeurs de signaler les "retards de traitement".

**Utilisateurs ciblés :**
1. **Personnel** : Soumet les demandes, consulte l'état d'avancement.
2. **Agent HelpDesk** : Qualifie, affecte les tâches aux techniciens.
3. **Technicien** : Intervient, résout la panne, rédige le rapport d'intervention.
4. **Administrateur** : Supervise globalement la plateforme, gère les rôles, visualise les statistiques et génère les rapports PDF/Excel.

---

## 8. Analyse des besoins

### Besoins fonctionnels
Le système HelpDesk doit assumer les fonctionnalités suivantes :
- **Authentification & Sécurité :** Connexion sécurisée avec redirection automatique basée sur le rôle.
- **Gestion des demandes :** Création, modification, annulation et signalement de retards sur les demandes.
- **Affectation de tâches :** Le HelpDesk peut assigner une demande à un technicien disponible selon sa spécialité (Software, Hardware, Réseau).
- **Gestion d'intervention :** Les techniciens peuvent marquer les tâches "En Cours", "Ouvrir", ou "Résolues" avec saisie obligatoire d'un rapport de clôture.
- **Gestion de Matériel :** Ajouter, modifier, classer ou retirer le matériel IT.
- **Statistiques & Reporting :** Tableaux de bord poussés (KPIs mensuels, Top équipements en panne, performance des techniciens), avec export PDF, Excel, et Impression.

### Besoins non fonctionnels
- **Sécurité :** Protection complète des API REST (Tokens d'authentification Laravel Sanctum, middlewares de permission stricts).
- **Performance :** Affilage instantané des données (requêtes Eager-loading, architecture SPA sans rechargement).
- **Ergonomie (UI/UX) :** L'interface doit être professionnelle, épurée, et responsive (technologie CSS Vanilla, conception "Glassmorphism" et "Dark mode").
- **Fiabilité :** Traçabilité absolue ; aucune suppression physique accidentelle des archives (Audit Log et Soft-Deletes).

*(Note pour le rendu WORD : Ajoutez ici des diagrammes de Cas d'Utilisation UML montrant les interactions entre les 4 acteurs, et un diagramme de séquence pour l'affectation d'un ticket).*

---

## 9. Conception du système

L'application repose sur une **architecture client-serveur (API REST)**. L’utilisation de cette architecture permet de séparer totalement la logique métier des interfaces, garantissant évolutivité et maintenabilité.

**Architecture de l'application :**
- **Frontend (Client)** : Single Page Application (SPA) bâtie sur React.js. Elle gère le routage côté client, l'état global et les appels asynchrones (Axios).
- **Backend (Serveur)** : API robuste bâtie sur Laravel 11. Implémente le pattern **MVC** (Modèle-Vue-Contrôleur) avec une forte adhérence aux FormRequests et aux API Resources.

**Conception de la base de données :**
Base de données relationnelle articulée autour de tables principales :
- `users` (employés, administrateurs, helpdesk)
- `demandes` (tickets créés par le personnel)
- `techniciens` (profils spécialisés, liés à `users`)
- `interventions` (jointure riche entre techniciens et demandes avec tracking chronologique)
- `rapport_interventions` (livrable du technicien en fin de travail)
- `materiels` et `categories_pannes` (hiérarchisation du parc).
- `reclamation_retards` (système d'escalade d'incidents).

*(Note pour le rendu WORD : Insérez ici votre Diagramme de Classes ou Diagramme Entité-Relation et votre architecture réseau générale).*

---

## 10. Réalisation (Développement)

### Technologies utilisées
L'écosystème technique choisi est ce qui se fait de plus moderne dans l'industrie pour une application robuste "Full Stack" :
- **Frontend :**
  - **React.js** (Vite.js) : Pour la création de la SPA ultra-rapide.
  - **Lucide-React** : Bibliothèque d'icônes SVG optimisées.
  - **Recharts** : Création de tableaux de bord et graphiques analytiques.
  - **ExcelJS / jspdf / html2canvas** : Modules permettant de compiler et exporter des rapports professionnels complexes côté client.
  - **CSS3 Vanilla** : Pour avoir une flexibilité maximale et aboutir au design ultra-premium exigé.
  
- **Backend :**
  - **Laravel (PHP 8+)** : Le framework backend pour l'API.
  - **MySQL** : SGBD relationnel.
  - **Laravel Sanctum** : Authentification via tokens.
  
- **Outils de développement :**
  - **Visual Studio Code** 
  - **Antigravity (Google Deepmind AI)** : Pair-programming et assistance algorithmique de pointe.
  - **Insomnia / Postman** : Pour tester les points finaux de l'API REST.

### Fonctionnalités développées
Pendant le stage, j'ai implémenté de bout en bout :
1. **La Page de Connexion Dynamique :** Interface premium "SaaS-like", intégrant le blason du Ministère, avec des alertes d'erreurs en temps réel.
2. **Dashboard HelpDesk Multi-recherches :** Des algorithmes de recherche instantanée (useMemo) capables d'effectuer des requêtes multicritères complexes directement sur l'interface fluide du frontal.
3. **Moteur Analytique (Statistiques) :** Développement de requêtes SQL optimisées (`DB::raw`, `groupBy`, Join) au niveau du contrôleur `StatsController` pour détecter le "Top des équipements en panne" ou les "Départements les plus touchés", et les afficher via des graphiques interactifs ou sous forme de bilans PDF Excel officiels.
4. **Système de "Réclamation de Retard" :** Module qui permet au personnel de relancer une demande d'un seul clic et avertit l'accueil HelpDesk visuellement d'un retard critique.

### Difficultés rencontrées et solutions
- *Difficulté* : Coordonner correctement les filtres multicritères sur les formulaires de recherche de la page HelpDesk sans surcharger l'API.
  *Solution* : Déplacer le filtrage rapide en local via des "useMemo" réactifs côté React, permettant un confort "Live Search" instantané pour l'utilisateur.
- *Difficulté* : Avoir un rendu PDF parfait des statistiques qui respecte une charte graphique gouvernementale (en-têtes, entités mathématiques HTML).
  *Solution* : Utilisation coordonnée d'éléments DOM masqués (`html2canvas`) pour concevoir une maquette imprimable de rapport dissociée de ce que l'utilisateur voit sur son écran classique.

---

## 11. Tests et validation

La garantie de qualité de la plateforme a impliqué plusieurs phases de tests :
- **Tests fonctionnels Unitaires :** Simulation des différents postes (connexion en tant que helpdesk, puis assignation à un compte technicien fictif, ouverture du compte technicien pour constater le changement d'état).
- **Sécurisation des routes :** Tentatives d'accès forcé aux routes `PATCH /demande/{id}` en modifiant le Payload. Les Middlewares et FormRequests du backend Laravel ont parfaitement rejeté les requêtes non autorisées.
- **Validation d'intégration UX :** S'assurer que chaque bouton possède les retours visuels (Toast notifications "Enregistrement réussi", changements de curseurs, chargements spinners). 
- **Validation avec l'équipe :** Démonstrations menées avec le tuteur pour adapter le langage métier (Ex: remplacement de "Gérer le matériel" par des libellés administratifs exacts).

---

## 12. Résultats obtenus

**Livrable :** Le résultat final est la plateforme opérationnelle, ergonomique et responsive "HelpDesk".
Les processus d'enregistrement et d'escalade d'incidents, autrefois dépendants d'un tableur Excel manuel, sont aujourd'hui numérisés, tracés, et infaillibles. 
La direction dispose d'une visibilité instantanée sur les pannes récurrentes, la charge des techniciens et le délai moyen de résolution. 

*(Note pour le rendu WORD : Ajoutez ici 3 ou 4 grandes Captures d’écran : Page d'accueil/Login, Dashboard Stats Admin, Page Reception HelpDesk, et Tableau du Personnel)*.

---

## 13. Conclusion générale

Ce stage a été une transition décisive entre ma formation académique et le milieu professionnel. Le développement "from-scratch" de cette plateforme HelpDesk a exigé une grande rigueur, qu'il s'agisse de respecter les règles d'UX/UI modernes pour un ministère, ou de manipuler des modèles de bases de données relationnelles complexes sous Laravel.

**Compétences techniques acquises :**
- Architecture de composants React avancée (Custom Hooks, gestion des statuts persistants).
- Sécurisation et optimisation de l'API Laravel RESTful.
- Génération programmatique de rapports d'entreprises (PDF et tableurs ExcelJS).

**Perspective :** 
Le système développé fournit une assise robuste. Les perspectives d'amélioration pourraient consister à implémenter un chat en temps réel (via WebSockets / Laravel Reverb) entre le personnel distant et le technicien, ou d'y intégrer la technologie de scan via QR Code pour la détection automatique du matériel défectueux.

---

## 14. Bibliographie / Webographie

- **Documentation officielle Laravel :** https://laravel.com/docs/11.x
- **Documentation officielle React :** https://react.dev/
- **Documentation Recharts (Graphiques) :** https://recharts.org/
- **Articles & Tutoriels complémentaires :** StackOverflow, Laracasts, et Developer Mozilla Org (MDN).
