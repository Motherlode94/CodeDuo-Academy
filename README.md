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
