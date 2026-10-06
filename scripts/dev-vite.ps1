$gitCmd = "C:\Program Files\Git\cmd"
if (Test-Path $gitCmd) { $env:Path = "$gitCmd;$env:Path" }
$root = Split-Path $PSScriptRoot -Parent

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev"
Start-Sleep -Seconds 2
Set-Location "$root\web"
npm run dev
