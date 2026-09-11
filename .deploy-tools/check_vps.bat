@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "grep -E 'BUILD_DONE|Compiled|Finished TypeScript|Generating static pages|error|Error' /tmp/fe_build_v3.log | tail -n 10"
