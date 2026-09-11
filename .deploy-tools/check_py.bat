@echo off
set HK=SHA256:qf42YtV5FjJzCBwc35KhFYNkRgGX45Y6tLNr/H1QKY8
C:\Users\umiro\.antigravity-ide\suaraai\.deploy-tools\plink.exe -batch -hostkey %HK% -pw Hasan#235 root@116.212.72.44 "cd /var/www/suaraai/backend && ./venv/bin/python -m py_compile app/utils/ai_client.py && echo PY_SYNTAX_OK || echo PY_SYNTAX_FAIL"