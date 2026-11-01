# CodeDuo Academy

Plateforme indépendante d’initiation à l’informatique et au code pour deux apprenants.

## Inclus
- Accueil minimaliste avec effet de suivi de souris et animation décorative.
- Fenêtre de création de **profil de démonstration local** et tableau de bord étudiant.
- Atelier de code avec Prism.js, export .js/.html/.cs.
- Exécution du JavaScript dans une iframe sandboxée et aperçu HTML isolé.
- Messages de sortie et erreurs JavaScript simples.
- Exemples C# **sans compilateur C#**.

## Limites importantes
La création de profil est locale au navigateur via localStorage : ce n’est pas un système d’inscription sécurisé, il n’y a ni mots de passe, ni comptes serveur, ni synchronisation entre appareils. Pour un vrai espace étudiant individuel avec connexion, rôles et données partagées, il faut un backend d’authentification et une base de données.

L’atelier JavaScript est prévu pour des exercices courts. Les boucles infinies, les API réseau et les scripts hostiles ne doivent pas être utilisés. Une véritable compilation C# nécessite une infrastructure serveur (.NET/Roslyn) avec isolation stricte, quotas et sécurité.

## Lancer
Ouvrir `index.html` via un serveur web statique ou publier sur GitHub Pages. Les fichiers doivent rester ensemble :

```
index.html
css/style.css
js/app.js
README.md
```

## Publication
GitHub Pages peut servir ce site en statique depuis la racine du dépôt, une fois Pages activé dans les paramètres GitHub.

## Prochaines étapes
Authentification réelle, base des élèves, suivi synchronisé, parcours complet, compilation en sandbox de confiance.

## Améliorations du parcours
- Consigne et indice visibles dans l’atelier pour chacun des trois exercices.
- Progression déclarative : l’apprenant marque lui-même un exercice terminé ; aucune correction automatique.
- Brouillons par langage, y compris un brouillon vide, et message si le stockage est indisponible.
- Raccourci Ctrl/Commande + Entrée, focus clavier visible et navigation au clavier dans la fenêtre de profil.
- Barre d’outils adaptée aux petits écrans.

Les brouillons et la progression sont communs aux profils locaux sur un même navigateur. Changer de profil ne les efface pas. Prism et les polices utilisent des services externes ; l’éditeur reste utilisable sans coloration si Prism ne se charge pas.

## Contributions : ajouts et modifications

Chaque contributeur décrit ses changements pour que les autres puissent comprendre ce qui a été ajouté, modifié ou corrigé.

### Proposer un changement

1. Partir de la dernière version de `main`.
2. Créer une branche pour son travail, par exemple `ajout/exercice-html` ou `correction/sauvegarde`. Sans accès en écriture, créer une copie du dépôt avec **Fork**.
3. Faire les changements et vérifier les fonctions concernées.
4. Ouvrir une **Pull Request** vers `main` : c’est une proposition de modification à relire avant intégration.
5. Remplir le modèle ci-dessous et indiquer les tests réellement effectués. Préciser ce qui reste à vérifier.
6. Après relecture, un responsable du dépôt peut fusionner la proposition dans `main`.

### Modèle à copier dans chaque proposition

```text
Contributeur : @pseudo-GitHub
Date : AAAA-MM-JJ
Type : ajout / modification / correction / documentation

Objectif :
Pourquoi ce changement est utile.

Ajouts :
- Nouvelles fonctions ou nouveaux contenus.

Modifications et corrections :
- Ce qui a changé et le comportement obtenu.

Fichiers concernés :
- Chemins des fichiers modifiés.

Vérifications effectuées :
- Test réalisé et résultat.
- Navigateur et appareil si un test visuel a été effectué.

Limites ou points restant à vérifier :
- Indiquer les éléments non testés.

Lien vers la proposition ou le commit :
```

### Vérifications utiles pour ce projet

- Le site s’ouvre sans erreur JavaScript.
- La création du profil et l’accès à l’espace étudiant fonctionnent.
- Les consignes restent visibles dans l’atelier.
- Le JavaScript s’exécute et l’aperçu HTML s’affiche.
- Les brouillons et la progression sont conservés après actualisation.
- Les boutons restent accessibles sur mobile et au clavier.
- Une fonction non testée est signalée comme telle.

Ne jamais ajouter de mot de passe, de clé API ou de donnée personnelle dans le dépôt. Conserver la distinction entre les fonctions disponibles et celles encore prévues.

### Historique des contributions documentées

| Date | Contributeur GitHub | Ajouts et modifications | Référence |
| --- | --- | --- | --- |
| 2026-11-01 | @jokkair91-cmd (avec assistance de ChatGPT) | Consignes et indices dans l’atelier, progression locale déclarative, correction des brouillons vides, gestion du stockage indisponible, raccourci clavier et adaptations mobiles. Syntaxe et six vérifications simulées validées ; rendu dans un navigateur réel restant à vérifier. | [Proposition nº 2](https://github.com/Motherlode94/CodeDuo-Academy/pull/2) |
| 2026-11-01 | @jokkair91-cmd (avec assistance de ChatGPT) | Ajout de ce guide de contribution et du modèle de description des changements dans le README. Modification documentaire uniquement. | Historique Git du README |

Pour les prochaines contributions, ajouter une ligne avec le pseudo réel de l’auteur, la date, un résumé et le lien vers la proposition ou le commit. Cet historique résume les contributions documentées ici ; l’historique Git conserve le détail des commits.


## Authentification Cloudflare — déploiement 2026-11-01

Le site est lié au projet Cloudflare Pages `codeduo-academy` et à une base **D1 dédiée** `codeduo-academy-auth` (binding `DB` en production et aperçu). Les routes `/api/register`, `/api/login`, `/api/me`, `/api/logout`, `/api/password` et `/api/users` sont gérées par Pages Functions dans `functions/api/[[path]].js`.

- Identifiants uniques (3–32 caractères), mots de passe de 12 caractères minimum et dérivation PBKDF2-SHA256 par sel individuel.
- Sessions par cookie `HttpOnly; Secure; SameSite=Lax`, empreintes des jetons en base, révocation après changement de mot de passe.
- Le rôle `student` est attribué aux nouvelles inscriptions publiques. Le rôle `admin` n'est attribué que dans D1 par un administrateur habilité ; aucune inscription publique administrateur.
- Liste des utilisateurs disponible uniquement via un contrôle de rôle côté serveur. Tentatives de connexion limitées par identifiant/IP dans une fenêtre de 15 minutes.
- Les pages HTML restent des ressources statiques : les données privées et les commandes administratives doivent toujours être protégées dans les API.

**Important :** les fonctions Cloudflare doivent être déployées et testées avant de considérer l'authentification comme opérationnelle. Aucun mot de passe initial ni secret ne doit apparaître dans GitHub.

**Courrier :** WarLike Mail est actuellement une messagerie interne, non un service SMTP/IMAP ou de livraison d'e-mails Internet. L'envoi d'e-mails de vérification/réinitialisation n'est donc pas activé ici ; il exige un service d'envoi et des domaines correctement configurés. WarLike Server dépend d'identités signées et de secrets privés, il n'a pas été modifié pour CodeDuo afin d'éviter une régression pour tes autres applications.
