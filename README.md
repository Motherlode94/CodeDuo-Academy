# CodeDuo Academy

**CodeDuo Academy** est une plateforme francophone d'initiation à l'informatique et à la programmation, destinée aux débutants et au travail en binôme.

- **Site :** https://codeduo-academy.pages.dev/
- **Code source :** https://github.com/Motherlode94/CodeDuo-Academy
- **Propriétaire du dépôt :** [@Motherlode94](https://github.com/Motherlode94)
- **Hébergement :** Cloudflare Pages, déploiements déclenchés par la branche `main`.

> **État : en développement.** Le dépôt contient une interface pédagogique, un éditeur et des fonctions d'authentification. Leur présence dans le code ne garantit pas qu'elles aient toutes été validées en production. Ne pas considérer le site comme un environnement d'exécution de code non fiable à sécurité garantie.

## Fonctionnalités présentes

| Domaine | Fonctionnalité | État et limites |
| --- | --- | --- |
| Accueil | Présentation minimaliste, animation et effet de souris, liens de navigation | Implémenté ; rendu navigateur à vérifier selon les appareils |
| Cours | **14 chapitres** sur l'informatique, la logique, le Web, JavaScript, Python, C# et Git | Quiz interactifs ; validation locale, pas d'examen certifiant |
| Projets | **6 défis guidés** pour débutants et binômes | Consignes disponibles ; pas de remise ni de correction serveur |
| Atelier | Éditeur avec coloration Prism.js et export `.js`, `.html`, `.cs` | Brouillons sauvegardés dans le navigateur, non synchronisés |
| Exécution | JavaScript et aperçu HTML dans des iframes isolées | Exercices courts uniquement ; ce n'est pas un compilateur universel |
| C# et Python | Exemples et enseignement | **Pas de compilation/exécution native** dans l'atelier |
| Comptes | Inscription étudiante, connexion et sessions via Cloudflare Pages Functions + D1 | Authentification à valider de bout en bout après chaque déploiement |
| Rôles | `student` et `admin` | Inscription publique limitée à `student`; rôle admin attribué hors formulaire |
| Administration | Contrôle serveur du rôle et liste des utilisateurs | Interface initiale, pas de suite complète de gestion des comptes |
| Messagerie | Aucun e-mail externe de vérification ou de récupération | À intégrer avec un fournisseur de courrier transactionnel |

## Pages du site

| Chemin | Utilité |
| --- | --- |
| `index.html` | Accueil, présentation et laboratoire de code |
| `cours.html` | Catalogue des 14 chapitres, quiz et progression locale |
| `projets.html` | Six projets et défis de programmation en binôme |
| `connexion.html` | Inscription et connexion avec identifiant/mot de passe |
| `etudiant.html` | Tableau de bord étudiant et changement de mot de passe |
| `admin.html` | Espace administrateur soumis à vérification du rôle serveur |

## Structure du dépôt

```text
CodeDuo-Academy/
├── index.html
├── cours.html
├── projets.html
├── connexion.html
├── etudiant.html
├── admin.html
├── css/
│   ├── style.css
│   ├── learning.css
│   └── auth.css
├── js/
│   ├── app.js
│   ├── courses.js
│   ├── learning.js
│   ├── dashboard.js
│   ├── auth.js
│   └── admin.js
├── functions/
│   └── api/
│       └── [[path]].js
└── README.md
```

**Organisation :** les pages HTML contiennent la structure et chargent des fichiers CSS et JS externes. Les traitements d'authentification sont exécutés côté Cloudflare, dans `functions/`. Ne jamais déplacer ces traitements ou secrets dans le JavaScript du navigateur.

## Démarrage et publication

### Partie statique

Ouvrir le projet via un **serveur HTTP local** pour parcourir les pages et utiliser l'atelier. Il est possible d'afficher les fichiers HTML statiquement, mais les routes `/api/*` exigent un environnement compatible Cloudflare Pages Functions.

### Environnement Cloudflare

Le projet Cloudflare Pages `codeduo-academy` est associé au dépôt GitHub et à sa branche `main`. La base D1 dédiée s'appelle `codeduo-academy-auth`, avec le binding nommé `DB`.

Pour une installation sur un autre compte, créer une base D1 et lui appliquer une migration compatible avec les tables suivantes :

- `users` : identifiant, pseudonyme unique, rôle, sel, empreinte de mot de passe, date de création ;
- `sessions` : empreinte du jeton de session, utilisateur et expiration ;
- `login_attempts` : compteur et fenêtre temporelle de limitation des tentatives.

Configurer le binding `DB` pour les déploiements concernés, puis déployer les fichiers. **Ne pas copier une base de production ni des mots de passe dans le dépôt.** Tester les routes depuis le domaine réellement publié avant d'ouvrir les inscriptions au public.

### API d'authentification

| Méthode | Route | Usage |
| --- | --- | --- |
| `POST` | `/api/register` | Créer un compte étudiant |
| `POST` | `/api/login` | Se connecter |
| `GET` | `/api/me` | Consulter la session |
| `POST` | `/api/logout` | Fermer la session |
| `POST` | `/api/password` | Changer son mot de passe et révoquer les sessions |
| `GET` | `/api/users` | Liste des utilisateurs, réservée au rôle administrateur |

Le backend utilise notamment PBKDF2-SHA256 avec sel individuel, des cookies `HttpOnly; Secure; SameSite=Lax`, des empreintes de jetons côté base et une limitation applicative des tentatives. Ces mécanismes ne remplacent pas un audit de sécurité et des tests d'intrusion. Les pages HTML sont publiques ; toute donnée privée ou action administrative doit être protégée **sur l'API**, pas seulement masquée dans l'interface.

**Gestion des mots de passe :** ne jamais publier d'identifiants initiaux, mots de passe, clés ou jetons dans les commits, les exemples ou les issues. La réinitialisation par e-mail n'est pas implémentée.

## Stockage et progression

Les **cours validés**, brouillons de l'éditeur et certaines données d'exercices sont encore enregistrés par `localStorage`. Ils ne sont **pas encore associés au compte D1 connecté**. Plusieurs profils utilisant le même navigateur peuvent donc voir les mêmes brouillons ou résultats. Une future migration devra enregistrer le travail de chaque étudiant par son ID serveur et vérifier les autorisations à chaque lecture/écriture.

## WarLike Server et WarLike Mail

Les projets **WarLike Server** et **WarLike Mail** existent séparément sur Cloudflare. Leur code et leurs comptes ne sont pas automatiquement mutualisés avec CodeDuo. WarLike Mail est une **messagerie interne**, sans SMTP/IMAP Internet ; il ne fournit donc pas, à lui seul, l'envoi de courriers de validation et de réinitialisation pour les étudiants.

Toute future intégration entre services nécessitera une API documentée, une identité de confiance entre serveurs, des autorisations explicites et des secrets gérés côté serveur.

## Limitations et chantiers prioritaires

1. Vérifier sur le domaine publié l'inscription, la connexion, la déconnexion, le changement de mot de passe et le refus de l'accès administrateur pour un étudiant.
2. Renforcer l'exécution de code non fiable et les protections contre les abus avant une ouverture publique large.
3. Rattacher brouillons, progression et remises aux identifiants utilisateurs en base D1.
4. Ajouter une vraie correction des exercices, des tests et des parcours adaptés aux niveaux.
5. Intégrer un service de messagerie transactionnelle et des procédures de récupération de compte.
6. Étudier un environnement d'exécution C#/Python isolé avec quotas, plutôt que prétendre que le navigateur compile ces langages.

## Contribuer au projet

Les contributions pédagogiques, corrections et améliorations de l'accessibilité sont bienvenues.

1. Partir de la dernière version de `main` et créer une branche descriptive (par exemple `ajout/quiz-css`).
2. Effectuer les changements nécessaires dans les fichiers HTML/CSS/JS ou Functions concernés.
3. Vérifier les fonctionnalités touchées et **indiquer explicitement ce qui n'a pas été testé**.
4. Ouvrir une Pull Request décrivant le problème, la solution, les fichiers modifiés et les vérifications.
5. Faire relire puis fusionner la contribution selon les permissions du dépôt.

### Modèle de description d'une Pull Request

```text
Objectif :
Changements apportés :
Fichiers concernés :
Tests effectués et résultats :
Limites / vérifications restantes :
```

### Historique des contributions

L'**historique officiel et exhaustif** est tenu par GitHub : **[commits de `main`](https://github.com/Motherlode94/CodeDuo-Academy/commits/main/)** et **[Pull Requests](https://github.com/Motherlode94/CodeDuo-Academy/pulls?q=is%3Apr)**.

Contribution vérifiée : [**PR nº 2 — Améliorer les exercices guidés, les brouillons et l'accès clavier**](https://github.com/Motherlode94/CodeDuo-Academy/pull/2), proposée par [@jokkair91-cmd](https://github.com/jokkair91-cmd) avec assistance de ChatGPT et fusionnée dans `main`. Elle comprend notamment l'affichage des consignes et indices, la gestion des brouillons, le raccourci d'exécution et des adaptations pour mobile et clavier. Les tests mentionnés dans la PR étaient des simulations ; le rendu navigateur réel restait à vérifier lors de cette contribution.

Les informations de cette section créditent un contributeur **sans lui attribuer la propriété du dépôt**. Les modifications plus récentes se consultent directement dans l'historique Git plutôt que dans une liste manuelle susceptible de devenir obsolète.

## Licence

Aucune licence d'utilisation ou de redistribution n'est précisée dans ce README. Consulter le dépôt pour déterminer si un fichier de licence a été ajouté avant de réutiliser le code hors du projet.
