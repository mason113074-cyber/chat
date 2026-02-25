@echo off
REM 將 CustomerAIPro SaaS 教科書 Markdown 轉成 Word (.docx)
REM 需要先安裝 Pandoc: https://pandoc.org/installing.html
REM 若已用 winget: winget install --id JohnMacFarlane.Pandoc -e

set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR%..
set MD="%ROOT%\docs\CustomerAIPro_SaaS_教科書.md"
set OUT="%ROOT%\docs\CustomerAIPro_SaaS_教科書.docx"

where pandoc >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Pandoc 未安裝。請從 https://pandoc.org/installing.html 安裝後再執行。
  exit /b 1
)

echo 正在轉換: %MD%
pandoc %MD% -o %OUT% --from markdown --to docx
if %ERRORLEVEL% equ 0 (
  echo 已產出: %OUT%
  echo 請用 Microsoft Word 開啟，並在「參考資料」中插入「自動目錄」以對應標題。
) else (
  echo 轉換失敗。
  exit /b 1
)
