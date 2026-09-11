@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
echo === UPLOAD BACKEND ===
type C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_backend_v3.b64 | C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cat > /tmp/bundle_backend_v3.b64"
echo UPLOAD_BACKEND_EXIT=%errorlevel%
echo === EXTRACT BACKEND ===
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "base64 -d /tmp/bundle_backend_v3.b64 > /tmp/bundle_backend_v3.tar.gz; cd /var/www/suaraai/backend; tar xzf /tmp/bundle_backend_v3.tar.gz; echo BACKEND_FILES:; ls -la app/utils/ai_client.py app/settings/ai_provider_setting.json; grep -c generativelanguage app/utils/ai_client.py"
echo === EXTRACT FRONTEND ===
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cd /var/www/suaraai/frontend; tar xzf /tmp/bundle_v3.tar.gz; echo FRONTEND_FILES:; grep -c generativelanguage src/app/page.tsx; ls -la src/app/page.tsx"