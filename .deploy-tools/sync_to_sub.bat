@echo off
set SRC=C:\Users\umiro\.antigravity-ide\suaraai
set DST=C:\Users\umiro\.antigravity-ide\suaraai\suaraai
copy /Y "%SRC%\backend\app\main.py" "%DST%\backend\app\main.py"
copy /Y "%SRC%\backend\app\prompts\output_format.md" "%DST%\backend\app\prompts\output_format.md"
copy /Y "%SRC%\backend\app\prompts\system_prompt.md" "%DST%\backend\app\prompts\system_prompt.md"
copy /Y "%SRC%\backend\app\settings\ai_provider_setting.json" "%DST%\backend\app\settings\ai_provider_setting.json"
copy /Y "%SRC%\backend\app\utils\ai_client.py" "%DST%\backend\app\utils\ai_client.py"
copy /Y "%SRC%\backend\app\utils\ffmpeg_analyzer.py" "%DST%\backend\app\utils\ffmpeg_analyzer.py"
copy /Y "%SRC%\backend\app\utils\parser.py" "%DST%\backend\app\utils\parser.py"
copy /Y "%SRC%\frontend\src\app\globals.css" "%DST%\frontend\src\app\globals.css"
copy /Y "%SRC%\frontend\src\app\layout.tsx" "%DST%\frontend\src\app\layout.tsx"
copy /Y "%SRC%\frontend\src\app\page.tsx" "%DST%\frontend\src\app\page.tsx"
copy /Y "%SRC%\frontend\src\components\AnalysisResultPanel.tsx" "%DST%\frontend\src\components\AnalysisResultPanel.tsx"
copy /Y "%SRC%\frontend\src\components\studio\FFmpegPeakAnalyzer.tsx" "%DST%\frontend\src\components\studio\FFmpegPeakAnalyzer.tsx"
copy /Y "%SRC%\frontend\src\components\studio\SidebarNav.tsx" "%DST%\frontend\src\components\studio\SidebarNav.tsx"
copy /Y "%SRC%\setup_9router.js" "%DST%\setup_9router.js"
echo ===COPY_DONE===
