@echo off
REM Approve & simpan hostkey server ke registry plink (sekali saja)
echo y | C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -pw Hasan#235 root@116.212.72.44 "echo PING_OK"
echo EXITCODE=%errorlevel%
