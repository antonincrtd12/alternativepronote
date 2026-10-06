# Ajoute Git au PATH pour npm (dépendance github: dans package.json)
$gitCmd = "C:\Program Files\Git\cmd"
if (Test-Path $gitCmd) {
  $env:Path = "$gitCmd;$env:Path"
} else {
  Write-Warning "Git introuvable. Installe https://git-scm.com/download/win"
  exit 1
}

Set-Location $PSScriptRoot\..
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "OK — lance: npm start"
