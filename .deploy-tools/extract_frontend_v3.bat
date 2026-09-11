@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cd /var/www/suaraai/frontend; tar xzf /tmp/bundle_v3.tar.gz; echo FRONTEND_OK; grep -c generativelanguage src/app/page.tsx; ls -la src/app/page.tsx"