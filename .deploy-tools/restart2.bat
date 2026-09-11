@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "pm2 restart suaraai-backend suaraai-frontend 2>&1 | grep -E 'status|name' ; sleep 4 ; pm2 list | grep -E 'suaraai' ; systemctl reload nginx 2>&1 ; echo NGINX_RELOAD_RC=%? "