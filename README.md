# alternativepronote (Papillon + Léa web)

- **App mobile** : [Papillon v8](https://github.com/PapillonApp/Papillon) (Expo) — PRONOTE, École Directe, Skolengo…
- **Web Vite** : interface légère + API Node (`server/`) — assistant **Léa** (agenda / devoirs).

## Démarrage rapide (Vite, sans Expo)

Git doit être dans le PATH pour l’app mobile Papillon ; **pas nécessaire** pour web + server seuls.

```powershell
cd server
npm install
npm run dev
```

Autre terminal :

```powershell
cd web
npm install
npm run dev
```

→ http://localhost:5173 (proxy API vers `:3001`)

Ou : `.\scripts\dev-vite.ps1`

Mode **démo** sur l’écran de connexion = aucun identifiant.

## App Papillon (mobile)

```powershell
$env:Path = "C:\Program Files\Git\cmd;" + $env:Path
npm install
npm start
```

## GitHub

```powershell
$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path
gh auth login
.\scripts\push-github.ps1
```

## Licence

Code Papillon : **GPL-3.0**. Voir `LICENSE`.
