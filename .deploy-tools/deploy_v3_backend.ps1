# deploy_v3_backend.ps1 — tar.gz backend files + base64 (satu baris)
$src = 'C:\Users\umiro\.antigravity-ide\suaraai\backend'
$tar = 'C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_backend_v3.tar.gz'
$b64 = 'C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_backend_v3.b64'

if (Test-Path $tar) { Remove-Item $tar -Force }
if (Test-Path $b64) { Remove-Item $b64 -Force }

Push-Location $src
& tar -czf $tar app/utils/ai_client.py app/settings/ai_provider_setting.json
if ($LASTEXITCODE -ne 0) { Write-Error "tar gagal: $LASTEXITCODE"; Pop-Location; exit 1 }
Pop-Location

$bytes = [System.IO.File]::ReadAllBytes($tar)
$enc = [Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText($b64, $enc)

Write-Host ("TAR: " + (Get-Item $tar).Length + " bytes")
Write-Host ("B64: " + (Get-Item $b64).Length + " bytes")
Write-Host ("MD5: " + (Get-FileHash $tar -Algorithm MD5).Hash)
