# deploy_v3.ps1 — tar.gz frontend (tanpa .next/node_modules) + base64
$src = 'C:\Users\umiro\.antigravity-ide\suaraai\frontend'
$tar = 'C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_v3.tar.gz'
$b64 = 'C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_v3.b64'

if (Test-Path $tar) { Remove-Item $tar -Force }
if (Test-Path $b64) { Remove-Item $b64 -Force }

Push-Location $src
& tar --exclude='.next' --exclude='node_modules' -czf $tar src public package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs next-env.d.ts components.json eslint.config.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "tar gagal: $LASTEXITCODE"; Pop-Location; exit 1 }
Pop-Location

$bytes = [System.IO.File]::ReadAllBytes($tar)
$enc = [Convert]::ToBase64String($bytes)
# SATU BARIS TANPA CRLF — supaya transfer via pipe ssh utuh (Linux base64 sensitif terhadap \r)
[System.IO.File]::WriteAllText($b64, $enc)

Write-Host ("TAR: " + (Get-Item $tar).Length + " bytes")
Write-Host ("B64: " + (Get-Item $b64).Length + " bytes")
Write-Host ("MD5: " + (Get-FileHash $tar -Algorithm MD5).Hash)
