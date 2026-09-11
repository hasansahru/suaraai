@echo off
REM Step 2: upload bundle b64 via pipe
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
type C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\bundle_v3.b64 | C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cat > /tmp/bundle_v3.b64"
echo UPLOAD_EXIT=%errorlevel%
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "base64 -d /tmp/bundle_v3.b64 > /tmp/bundle_v3.tar.gz; md5sum /tmp/bundle_v3.tar.gz; wc -c /tmp/bundle_v3.tar.gz"
