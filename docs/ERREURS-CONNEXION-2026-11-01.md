# Journal des erreurs — Connexion CodeDuo Academy

**Date de constat :** 1er novembre 2026  
**Source :** capture de la console Microsoft Edge communiquée par l'utilisateur.  
**Page :** `https://codeduo-academy.pages.dev/connexion.html`

## Erreur 1 — Validation HTML du champ identifiant

```text
Pattern attribute value [A-Za-z0-9_-]{3,32} is not a valid regular expression:
Uncaught SyntaxError: Invalid regular expression: /[A-Za-z0-9_-]{3,32}/v:
Invalid character in character class
```

**Impact :** le navigateur Edge signale un motif HTML invalide à cause du tiret dans la classe de caractères avec le mode RegExp `v`.  
**Piste de correction :** échapper le tiret (`\\-`) ou employer une classe de caractères compatible, puis contrôler le **HTML réellement servi** et le cache navigateur.  
**État :** toujours visible sur la capture du 01/11/2026 malgré une correction précédemment commitée. Vérifier l'URL déployée et la version du fichier.

## Erreur 2 — Échec de l'authentification

```text
POST https://codeduo-academy.pages.dev/api/login 401 (Unauthorized)
auth.js:38
Identifiants incorrects. (HTTP 401)
```

**Impact :** l'utilisateur `chayah94_2026` n'arrive pas à ouvrir sa session. Ne pas enregistrer le mot de passe dans ce journal.  
**Observation :** le formulaire affiche aussi « Serveur et base de données accessibles. », donc `/api/health` répond correctement. Le code serveur renvoie `401` lorsque l'utilisateur est absent ou que l'empreinte du mot de passe ne correspond pas.

**Cause probable à confirmer :** les empreintes initiales stockées dans D1 ne correspondent pas à l'algorithme PBKDF2 actuellement déployé après le changement de nombre d'itérations. Un nouvel enregistrement/une réinitialisation avec l'algorithme courant est nécessaire, sans exposer le mot de passe.

## Suivi

- [ ] Vérifier la réponse HTML de `connexion.html` servie par Cloudflare et éliminer définitivement le `pattern` invalide.
- [ ] Vérifier le calcul des empreintes du compte concerné et réinitialiser son mot de passe via une procédure autorisée.
- [ ] Tester `POST /api/login` : réponse attendue `200` et session active via `GET /api/me`.
- [ ] Tester avec Edge et vérifier qu'aucune erreur rouge ne réapparaît.
- [ ] Confirmer le résultat avant de fermer cet incident.

**Note :** les messages de suggestion Copilot de Microsoft Edge ne sont pas des erreurs applicatives.
