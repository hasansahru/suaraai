@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cd /var/www/suaraai/frontend; nohup bash -c 'rm -rf .next && npm run build > /tmp/fe_build_v3.log 2>&1; echo BUILD_DONE rc=$? >> /tmp/fe_build_v3.log' > /dev/null 2>&1 & echo BUILD_STARTED_BG"