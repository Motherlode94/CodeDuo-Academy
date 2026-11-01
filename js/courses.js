window.CODEDUO_COURSES = [
  {
    "id": 1,
    "title": "Découvrir l'ordinateur",
    "category": "informatique",
    "level": "Débutant",
    "summary": "Comprendre le processeur, la mémoire vive, le stockage et le système d'exploitation.",
    "content": "Le CPU exécute les instructions. La RAM conserve temporairement les données utilisées. Le SSD conserve durablement les fichiers. Le système d'exploitation coordonne le matériel et les applications.",
    "example": "CPU : calculs et instructions\\nRAM : travail temporaire\\nSSD : conservation des fichiers\\nOS : Windows, Linux, macOS",
    "question": "Quel composant stocke durablement les fichiers ?",
    "options": [
      "La RAM",
      "Le SSD",
      "Le CPU"
    ],
    "correct": 1,
    "challenge": "Explique à ton partenaire ce qu'il se passe quand tu ouvres une application."
  },
  {
    "id": 2,
    "title": "Fichiers et dossiers",
    "category": "informatique",
    "level": "Débutant",
    "summary": "Organiser des documents, comprendre les extensions et les chemins.",
    "content": "Un fichier contient des données ; un dossier permet de les organiser. Les extensions comme .txt, .png, .html donnent une indication de format. Un chemin désigne l'emplacement d'un fichier.",
    "example": "projet/\\n  index.html\\n  css/style.css\\n  js/app.js",
    "question": "Quel fichier décrit la structure HTML ?",
    "options": [
      "style.css",
      "index.html",
      "app.js"
    ],
    "correct": 1,
    "challenge": "Crée sur ton ordinateur un dossier projet contenant les trois fichiers de l'exemple."
  },
  {
    "id": 3,
    "title": "Internet et sécurité",
    "category": "informatique",
    "level": "Débutant",
    "summary": "Comprendre navigateur, serveur, URL et bonnes pratiques.",
    "content": "Un navigateur demande des documents à un serveur via HTTP(S). HTTPS protège le transport des données mais n'atteste pas de la fiabilité du site. Utilise des mots de passe distincts et la double authentification.",
    "example": "Navigateur → demande HTTPS → Serveur\\nServeur → HTML / CSS / JS → Navigateur",
    "question": "HTTPS garantit-il qu'un site est honnête ?",
    "options": [
      "Oui",
      "Non",
      "Seulement sur mobile"
    ],
    "correct": 1,
    "challenge": "Présente la différence entre URL, nom de domaine et adresse IP."
  },
  {
    "id": 4,
    "title": "Algorithmes et logique",
    "category": "logique",
    "level": "Débutant",
    "summary": "Découper un problème en étapes avant d'écrire du code.",
    "content": "Un algorithme décrit les opérations à effectuer. Une condition effectue un choix et une boucle répète une action. Commence par définir les entrées, les étapes et le résultat attendu.",
    "example": "SI age >= 18\\n  afficher « majeur »\\nSINON\\n  afficher « mineur »",
    "question": "À quoi sert une condition ?",
    "options": [
      "Répéter sans fin",
      "Choisir selon un test",
      "Changer la police"
    ],
    "correct": 1,
    "challenge": "Écris en français les étapes d'un distributeur de billets."
  },
  {
    "id": 5,
    "title": "HTML : ma première page",
    "category": "web",
    "level": "Débutant",
    "summary": "Construire une page avec titres, paragraphes et boutons.",
    "content": "HTML représente la structure du document. Utilise les titres dans l'ordre logique, des paragraphes pour le texte et des boutons pour les actions. CSS gère l'apparence et JavaScript les interactions.",
    "example": "<h1>Bonjour !</h1>\\n<p>Je découvre le développement web.</p>\\n<button>Commencer</button>",
    "question": "Quelle balise représente le titre principal ?",
    "options": [
      "<h1>",
      "<p>",
      "<script>"
    ],
    "correct": 0,
    "challenge": "Crée une page présentant ton binôme avec un titre et deux paragraphes."
  },
  {
    "id": 6,
    "title": "CSS : couleurs et disposition",
    "category": "web",
    "level": "Débutant",
    "summary": "Personnaliser l'apparence et créer une grille responsive.",
    "content": "CSS applique des règles aux éléments HTML. Une règle comporte un sélecteur et des déclarations. Flexbox permet d'aligner et Grid de composer des colonnes. Les media queries adaptent l'écran.",
    "example": "body { background: #101827; color: white; }\\nh1 { font-size: 32px; }\\n.container { display: grid; gap: 16px; }",
    "question": "Quelle propriété change la couleur du texte ?",
    "options": [
      "background",
      "color",
      "margin"
    ],
    "correct": 1,
    "challenge": "Crée une carte avec une couleur de fond, une bordure et un espace intérieur."
  },
  {
    "id": 7,
    "title": "JavaScript : premières actions",
    "category": "web",
    "level": "Débutant",
    "summary": "Ajouter des interactions au navigateur.",
    "content": "JavaScript manipule des valeurs et peut réagir à un événement. console.log aide à inspecter un résultat et addEventListener relie un événement à une fonction.",
    "example": "const bouton = document.querySelector('button');\\nbouton.addEventListener('click', () => {\\n  console.log('Bravo !');\\n});",
    "question": "Quelle méthode écoute un clic ?",
    "options": [
      "addEventListener",
      "queryColor",
      "fontSize"
    ],
    "correct": 0,
    "challenge": "Dans l'atelier, écris console.log('Bonjour ' + tonPrenom)."
  },
  {
    "id": 8,
    "title": "Variables et types",
    "category": "javascript",
    "level": "Débutant",
    "summary": "Stocker des nombres, du texte et des booléens.",
    "content": "let crée une variable réaffectable, const une liaison qui ne peut pas être réaffectée. Les types courants comprennent number, string et boolean. Nomme les variables selon leur rôle.",
    "example": "let points = 10;\\nconst prenom = 'Alex';\\nlet termine = false;\\nconsole.log(prenom, points, termine);",
    "question": "Quelle déclaration autorise la réaffectation ?",
    "options": [
      "const",
      "let",
      "import"
    ],
    "correct": 1,
    "challenge": "Écris trois variables, puis affiche-les avec console.log."
  },
  {
    "id": 9,
    "title": "Conditions et boucles",
    "category": "javascript",
    "level": "Intermédiaire",
    "summary": "Prendre des décisions et répéter des instructions.",
    "content": "if teste une expression ; else gère l'autre cas. Une boucle for répète une action jusqu'à ce que sa condition soit fausse. Attention aux boucles sans fin.",
    "example": "for (let i = 1; i <= 5; i++) {\\n  console.log(i);\\n}\\nif (5 > 3) console.log('ok');",
    "question": "Combien de fois la boucle affiche-t-elle un nombre ?",
    "options": [
      "4",
      "5",
      "6"
    ],
    "correct": 1,
    "challenge": "Affiche les nombres pairs de 2 à 20."
  },
  {
    "id": 10,
    "title": "Fonctions et débogage",
    "category": "javascript",
    "level": "Intermédiaire",
    "summary": "Réutiliser du code et comprendre les erreurs.",
    "content": "Une fonction reçoit éventuellement des paramètres et peut renvoyer une valeur grâce à return. Quand un programme échoue, reproduis l'erreur et inspecte ses messages avant de corriger.",
    "example": "function doubler(nombre) {\\n  return nombre * 2;\\n}\\nconsole.log(doubler(7));",
    "question": "Que renvoie doubler(7) ?",
    "options": [
      "7",
      "14",
      "undefined"
    ],
    "correct": 1,
    "challenge": "Crée une fonction addition(a,b) et teste-la."
  },
  {
    "id": 11,
    "title": "Découvrir Python",
    "category": "python",
    "level": "Débutant",
    "summary": "Comprendre les scripts, print et l'indentation.",
    "content": "Python sert notamment aux automatisations, aux scripts et à l'analyse de données. L'indentation délimite les blocs. L'exécution de Python requiert un environnement Python, non présent dans cet atelier.",
    "example": "prenom = 'Alex'\\nfor i in range(3):\\n    print('Bonjour', prenom)",
    "question": "Quelle instruction affiche un message en Python ?",
    "options": [
      "console.log",
      "print",
      "echoHTML"
    ],
    "correct": 1,
    "challenge": "Écris un script Python affichant trois fois ton prénom dans un environnement Python."
  },
  {
    "id": 12,
    "title": "Découvrir C#",
    "category": "csharp",
    "level": "Débutant",
    "summary": "Apprendre les types, les méthodes et les classes.",
    "content": "C# est un langage typé souvent utilisé pour .NET et Unity. Une classe organise des données et des méthodes. L'éditeur CodeDuo colore le C#, mais ne le compile pas encore.",
    "example": "using System;\\nclass Programme {\\n  static void Main() {\\n    Console.WriteLine(\"Bonjour !\");\\n  }\\n}",
    "question": "Quelle instruction affiche du texte dans cet exemple ?",
    "options": [
      "Console.WriteLine",
      "document.write",
      "print"
    ],
    "correct": 0,
    "challenge": "Écris une méthode C# qui additionne deux entiers et explique ses paramètres."
  },
  {
    "id": 13,
    "title": "Git et travail en équipe",
    "category": "collaboration",
    "level": "Débutant",
    "summary": "Comprendre commits, branches et pull requests.",
    "content": "Git conserve un historique des versions. Une branche permet de développer une fonction séparément. Une pull request propose des changements à relire avant leur fusion.",
    "example": "main\\n ├─ feature/accueil\\n └─ feature/exercice\\nPull Request → revue → fusion",
    "question": "À quoi sert une pull request ?",
    "options": [
      "Proposer du code à relire",
      "Supprimer Git",
      "Installer un logiciel"
    ],
    "correct": 0,
    "challenge": "Travaillez sur deux branches et échangez une revue constructive."
  },
  {
    "id": 14,
    "title": "Mini-projet final",
    "category": "projet",
    "level": "Intermédiaire",
    "summary": "Réaliser une petite application de bout en bout.",
    "content": "Planifie un mini-site de présentation ou un calculateur simple. Définis les fonctionnalités, crée les fichiers HTML/CSS/JS, teste sur mobile, puis explique tes choix. Utilise l'atelier HTML ou JavaScript pour prototyper.",
    "example": "Objectif → Plan → Code → Test → Correction → Présentation",
    "question": "Quelle étape suit normalement l'écriture du code ?",
    "options": [
      "Ignorer les erreurs",
      "Tester et corriger",
      "Tout supprimer"
    ],
    "correct": 1,
    "challenge": "À deux : construisez une page avec un bouton interactif et présentez-la."
  }
];
