@echo off
chcp 65001 >nul
set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR%..
set MD="%ROOT%\docs\CustomerAIPro_SaaS_教科書.md"
set PDF="%ROOT%\docs\CustomerAIPro_SaaS_教科書.pdf"
set HTML="%ROOT%\docs\CustomerAIPro_SaaS_教科書.html"

where pandoc >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [錯誤] 未安裝 Pandoc。請先執行: winget install --id JohnMacFarlane.Pandoc -e
  echo 詳見 docs\教科書轉Word說明.md
  exit /b 1
)

echo 正在轉換: %MD%

REM 嘗試用 xelatex 直接產出 PDF（需已安裝 MiKTeX/TeX Live）
where xelatex >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo 使用 xelatex 產出 PDF...
  pandoc %MD% -o %PDF% --pdf-engine=xelatex -V CJKmainfont="Microsoft JhengHei" -V geometry:margin=2.5cm 2>nul
  if %ERRORLEVEL% equ 0 (
    echo 已產出: %PDF%
    exit /b 0
  )
)

REM 若沒有 xelatex 或產出失敗，改產 HTML，由使用者用瀏覽器列印為 PDF
echo 未偵測到 xelatex 或 PDF 產出失敗，改產 HTML（可用瀏覽器列印為 PDF）。
pandoc %MD% -o %HTML% --standalone --metadata title="CustomerAIPro SaaS 教科書" --from markdown --to html
if %ERRORLEVEL% neq 0 (
  echo [錯誤] HTML 轉換失敗。
  exit /b 1
)

echo.
echo 已產出: %HTML%
echo.
echo 請用瀏覽器開啟上述 HTML 檔，按 Ctrl+P（列印），
echo 目的地選擇「另存為 PDF」後儲存即可得到 PDF。
echo.
start "" %HTML%
exit /b 0
