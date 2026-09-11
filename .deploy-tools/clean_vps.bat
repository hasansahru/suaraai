@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "rm -f /tmp/bundle_v3.b64 /tmp/bundle_v3.tar.gz /tmp/bundle_backend_v3.b64 /tmp/bundle_backend_v3.tar.gz; echo VPS_TMP_CLEANED"