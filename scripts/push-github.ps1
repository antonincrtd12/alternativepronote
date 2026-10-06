# Crée le dépôt GitHub et pousse (après: gh auth login)
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$gitCmd = "C:\Program Files\Git\cmd"
$env:Path = "$gitCmd;$(Split-Path $gh);$env:Path"

Set-Location $PSScriptRoot\..

& $gh auth status
if ($LASTEXITCODE -ne 0) {
  Write-Host "Connecte-toi: gh auth login -h github.com"
  exit 1
}

$repoName = "alternativepronote"

if (-not (git rev-parse HEAD 2>$null)) {
  git add -A
  git commit -m "Initial commit: Papillon + Léa (Vite web + API)"
}

if (-not (git remote get-url origin 2>$null)) {
  & $gh repo create $repoName --public --source=. --remote=origin --description "Fork Papillon + assistant agenda Léa (Vite)" --push
} else {
  git push -u origin main
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Échec push. Lance: gh auth login -h github.com puis relance ce script."
}
