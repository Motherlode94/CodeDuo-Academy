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

**Sur la branche de développement dédiée**, les cours validés et les brouillons de l'atelier sont associés à l'identifiant étudiant dans D1 après application de la migration. En mode invité, ils restent dans `localStorage`. Les petits exercices de démonstration et projets guidés conservent leurs données locales : leur synchronisation complète reste à faire. La production continue d'utiliser l'ancien comportement jusqu'à la migration et au déploiement de cette PR.

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


## Espace MAO (musique assistée par ordinateur)

- `mao.html` : accueil et présentation du parcours musique.
- `cours-mao.html` : 12 leçons, questions de compréhension et défis, progression locale.
- `studio-mao.html` : séquenceur à 16 pas utilisant Web Audio API (kick, snare, hi-hat, basse), tempo de 60 à 180 BPM, lecture et sauvegarde locale des patterns.
- `css/mao.css` : styles spécifiques ; `js/mao-courses.js`, `js/mao-learning.js`, `js/mao-studio.js` : cours et mécanique audio.

Les comptes CodeDuo existants (étudiant et administrateur) restent les mêmes : **aucun nouvel identifiant ni mot de passe n'est généré pour la MAO**. L'accès à la connexion se fait via `connexion.html`. Les cours et le séquenceur sont pour l'instant accessibles publiquement ; la sauvegarde du pattern et de la progression utilise `localStorage` et non D1. Il ne s'agit pas d'un DAW professionnel, aucun export WAV, aucun VST ni enregistrement microphone. Les mots de passe ne doivent jamais être ajoutés au code public.

## Synchronisation des étudiants (PR — déploiement contrôlé)

Le nouveau schéma `migrations/0002_student_learning.sql` ajoute **deux tables D1** : `student_progress` et `student_drafts`, associées à `users.id`. Il conserve les utilisateurs et mots de passe existants. Aucune donnée ne doit être migrée depuis un navigateur collectif vers un compte sans consentement explicite : les anciennes données `localStorage` restent accessibles uniquement en mode invité, tandis qu'une session authentifiée utilise exclusivement l'API.

Routes ajoutées : `GET /api/progress`, `PUT /api/progress` (validation d'une leçon `code` 1–14 ou `mao` 1–12), `GET /api/drafts` et `PUT /api/drafts` (JavaScript, HTML, C#, 20 000 caractères maximum). Toutes exigent une session valide et chaque requête SQL est limitée à l'identifiant de la session. Une progression n'est pas effacée par la synchronisation.

**Procédure avant fusion/déploiement** :
1. Sauvegarder la base D1 et identifier son ID depuis le compte Cloudflare.
2. Exécuter la migration dans une **base D1 de test** et vérifier ses quatre requêtes avec deux comptes séparés.
3. Exécuter `node --test tests/*.test.mjs` et vérifier l'inscription/connexion/session/logout dans un environnement Pages de test avec binding `DB`.
4. Appliquer ensuite la migration à la base D1 de production **avant de publier le front-end/API mis à jour**, en utilisant les outils de migration Cloudflare autorisés. Ne pas confondre le binding `DB` et le nom physique de la base.
5. Contrôler sur le domaine publié la progression et le brouillon de deux étudiants distincts, sans réutiliser leurs données locales.

**Limites** : la compilation C# reste non disponible ; les exercices et les projets personnels ne disposent pas encore d'une correction serveur ni d'un espace collaboratif. La récupération d'accès nécessite toujours une procédure administrateur ou un futur fournisseur d'e-mails transactionnels. Ne pas créer de comptes d'essai dans la base réelle sans autorisation.

## Atelier multi-fichiers HTML / CSS / JavaScript (développement)

La page `atelier-projet.html` contient un véritable éditeur à trois fichiers (`index.html`, `style.css`, `main.js`) avec export individuel, prévisualisation et trois exercices contrôlés par des **tests DOM et de clics**. L'aperçu utilise une iframe à origine opaque (`sandbox="allow-scripts"`) et une CSP bloquant les requêtes réseau ; cela réduit les risques, mais ne constitue pas un environnement sécurisé pour des programmes arbitraires hostiles.

Le projet est sauvegardé dans la table D1 `student_projects` pour les comptes connectés et uniquement dans le navigateur pour les invités. L'API `GET/PUT /api/project` applique une limite de **16 000 caractères par fichier**, un budget maximal de corps de requête et l'identifiant issu de la session, jamais de la requête du client. Le module `js/project-checks.js` vérifie effectivement des éléments du DOM et la réaction des boutons. Il s'agit d'évaluations formatives, pas de certifications.

**Avant le déploiement** : appliquer `migrations/0003_student_projects.sql` sur une base D1 de test, vérifier le fonctionnement dans un déploiement Pages de prévisualisation, puis déployer la migration en production avant de fusionner la branche. Pas de compilation C#/Python, de projets synchronisés en temps réel ou de tests résistants au code malveillant pour cette version.

## C# natif et collaboration binôme (PR de développement)

### Compilation C# réelle — Roslyn /.NET 8
Le bouton **Exécuter** de l'atelier existant fait désormais appel à `POST /api/csharp/compile` pour les comptes connectés. Cette route peut appeler un **service .NET SDK 8 externe**, dont le code et le Dockerfile sont dans `services/csharp-compiler/`. Le service lance la **compilation réelle** d'un fichier `Program.cs` et renvoie les diagnostics du compilateur (jusqu'à 30 messages). **Il n'exécute jamais l'assembly compilé**. Il contrôle la taille du code et applique un délai de compilation ainsi qu'une limite de requêtes concurrentes.

**Conditions de fonctionnement** : déployer le service dans un environnement conteneurisé spécifiquement isolé, restreindre l'accès réseau au service, configurer le secret `CODEDUO_COMPILER_TOKEN` (32+ caractères), puis sur **Cloudflare Pages** configurer `CSHARP_COMPILER_URL` (URL HTTPS exacte vers `/compile`) et `CSHARP_COMPILER_TOKEN` (même secret). Ne pas mettre de secret dans GitHub, le front-end, ni les variables publiques. Sur un projet exposé à des étudiants inconnus, utiliser une politique d'isolation renforcée, un contrôle d'egress, des quotas CPU/mémoire, une limite de processus et des logs d'abus avant d'activer le service. Le conteneur d'exemple n'est **pas** un sandbox multi-tenant certifié. En absence de service, l'API répond clairement **503** : ne pas prétendre qu'une analyse C# locale est une compilation.

### Travail en binôme en temps réel
Les migrations `migrations/0004_pair_rooms.sql` ajoutent des salons à **deux comptes** et des codes d'invitation aléatoires dont **seul le hachage SHA-256 est conservé** dans D1. L'invitation expire après sept jours. L'atelier `atelier-projet.html` offre créer / rejoindre / quitter un salon et voir la présence du partenaire. La route Pages authentifiée `GET /api/pair/socket?room=...` vérifie la session et l'appartenance, puis transmet une autorisation HMAC de courte durée au Worker privé de collaboration.

Un Worker dédié `services/pair-realtime/`, utilisant **Cloudflare Durable Objects et les WebSockets hibernables**, sauvegarde les versions du projet de salon et diffuse les changements. Chaque modification est associée à un numéro de révision ; un changement concurrent renvoie **conflict**, ce qui laisse à l'étudiant la possibilité de conserver ses fichiers locaux ou de charger explicitement la version distante. Il ne s'agit pas encore d'un éditeur CRDT ou OT qui fusionne les caractères simultanément.

**Conditions de mise en service** :
1. Tester les migrations `0002`, `0003` et `0004` dans une base D1 indépendante. Les déployer dans l'ordre en production **avant la fusion** des endpoints.
2. Déployer le Worker avec `services/pair-realtime/wrangler.jsonc`, par exemple avec Wrangler depuis ce sous-dossier, après revue de sécurité. Configurer son secret serveur `PAIR_SECRET` (valeur secrète de 32 caractères minimum).
3. Ajouter une **Service binding Cloudflare Pages** nommée `PAIR_REALTIME`, pointant vers ce Worker, et configurer exactement le même `PAIR_SECRET` dans l'environnement Pages (server-side only).
4. Redéployer Pages, créer deux **comptes de test distincts**, vérifier création / invitation / WebSockets / édition bidirectionnelle / gestion de conflits / reconnexion, puis vérifier qu'un troisième compte est refusé.
5. Tester en conditions mobiles et sur navigateur Edge. **Ne pas ouvrir le salon en production avant ces vérifications.**

Le mode de collaboration ne permet actuellement ni fusion automatique des éditions concurrentes, ni historique restaurable par version ni chat vocal ou vidéo.

## Test de deux étudiants connectés dans de vrais navigateurs

Le test Playwright `tests/pair-two-browsers.e2e.mjs` utilise **deux contextes Chromium indépendants**, chacun avec son propre cookie de session, et vérifie en conditions réelles : connexion des deux étudiants, création d'un salon, invitation, échange HTML A→B, échange CSS B→A, reconnexion du second étudiant et rejet des visiteurs non authentifiés. Il ne crée aucun compte et ne supprime aucune donnée.

**Préparation** : créer **deux comptes de test dédiés et autorisés**, différents des comptes pédagogiques existants, puis ajouter quatre secrets GitHub Actions au dépôt : `CODEDUO_E2E_USER_A`, `CODEDUO_E2E_PASSWORD_A`, `CODEDUO_E2E_USER_B` et `CODEDUO_E2E_PASSWORD_B`. Ne jamais placer leurs mots de passe dans Git, les logs ou un ticket public.

**Exécution** : GitHub → Actions → « CodeDuo two-browser production collaboration test » → Run workflow, en indiquant l'URL souhaitée (préproduction recommandée). Le workflow est **manuel** afin d'éviter d'écrire des projets de test en production à chaque push. Les comptes de test peuvent conserver le salon et les fichiers de cet essai ; utiliser une base et des comptes de test réservés au QA si l'on souhaite une remise à zéro.

**Interprétation** : les tests Node du Durable Object et les vérifications 401 ne suffisent pas à déclarer la collaboration validée. Seul un **run Playwright réussi sur la cible choisie** valide l'interaction à deux navigateurs. Ne pas marquer cette validation comme réussie tant que les quatre secrets ne sont pas configurés et que le run n'a pas réussi.
