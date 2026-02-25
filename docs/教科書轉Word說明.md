# 教科書轉成 Word / PDF 說明

## 用 Cursor / VS Code 市集擴充匯出 PDF（不需 Pandoc）

若你已安裝 **Markdown PDF**（yzane）或類似擴充：

1. 在 Cursor 左側開啟 **`docs/CustomerAIPro_SaaS_教科書.md`**（點開該檔案）。
2. 按 **Ctrl+Shift+P**（命令選擇區），輸入 **`Markdown PDF`**。
3. 選擇 **「Markdown PDF: Export (pdf)」**（或「Export (pdf)」）。
4. PDF 會產在**與 .md 同一資料夾**，檔名為 `CustomerAIPro_SaaS_教科書.pdf`（即 `docs/CustomerAIPro_SaaS_教科書.pdf`）。

若擴充有 **Export (html)**，可先匯出 HTML，再用瀏覽器開啟 → **Ctrl+P** → 另存為 PDF。

---

## 問題：出現「無法辨識 pandoc」

代表 **Pandoc 尚未安裝**（或終端機尚未重新開啟）。請先安裝再執行轉換。

---

## 1. 安裝 Pandoc（任選一種）

### 用 winget（推薦）

在 **PowerShell** 或 **命令提示字元** 執行：

```powershell
winget install --id JohnMacFarlane.Pandoc -e
```

安裝完成後**關閉並重新開啟終端機**。

### 手動下載

1. 開啟 https://pandoc.org/installing.html  
2. 在 **Windows** 區下載 `.msi` 安裝程式並執行  
3. 安裝完成後**重新開啟終端機**  
4. 確認：輸入 `pandoc --version`，有顯示版本即成功  

---

## 2. 轉換成 Word

在專案根目錄 `C:\dev\saas\chat` 執行（檔名是 **SaaS**，大寫 A）：

```powershell
pandoc "docs/CustomerAIPro_SaaS_教科書.md" -o "docs/CustomerAIPro_SaaS_教科書.docx" --from markdown --to docx
```

成功後會產生：`docs/CustomerAIPro_SaaS_教科書.docx`  
用 Microsoft Word 開啟即可。

---

## 3. 轉成 PDF（三種方式任選）

### 方式 A：一鍵腳本（推薦）

在專案根目錄執行（CMD 或 PowerShell 皆可）：

```cmd
scripts\export-textbook-to-pdf.bat
```

腳本會依序嘗試：
1. 若已安裝 **MiKTeX** 或 **TeX Live**：直接產出 `docs/CustomerAIPro_SaaS_教科書.pdf`
2. 若沒有 LaTeX：產出 `docs/CustomerAIPro_SaaS_教科書.html`，請用**瀏覽器**開啟該檔 → **Ctrl+P**（列印）→ 目的地選 **另存為 PDF** → 儲存

### 方式 B：用 Word 另存 PDF（最簡單）

若你已有 Word 與 .docx：
1. 先依上面「2. 轉換成 Word」產出 .docx  
2. 用 Word 開啟 `docs/CustomerAIPro_SaaS_教科書.docx`  
3. **檔案 → 另存新檔** → 檔案類型選 **PDF (\*.pdf)** → 儲存  

不需再裝其他軟體。

### 方式 C：Pandoc 直接產 PDF（需安裝 LaTeX）

若要由 Pandoc 直接產生 PDF（支援中文需 LaTeX）：

1. 安裝 **MiKTeX**：https://miktex.org/download  
   - 或用 winget：`winget install --id MiKTeX.MiKTeX -e`
2. 安裝後**重新開啟終端機**，在專案根目錄執行：

```powershell
pandoc "docs/CustomerAIPro_SaaS_教科書.md" -o "docs/CustomerAIPro_SaaS_教科書.pdf" --pdf-engine=xelatex -V CJKmainfont="Microsoft JhengHei" -V geometry:margin=2.5cm
```

成功後會產生：`docs/CustomerAIPro_SaaS_教科書.pdf`

---

## 4. 不裝 Pandoc 的替代方式（Word / PDF）

- 用 **Word 2019 或更新版**：檔案 → 開啟 → 選 `docs/CustomerAIPro_SaaS_教科書.md`，Word 可匯入 Markdown，再**另存新檔 → PDF** 即可。
- 或用線上服務搜尋「markdown to pdf」，上傳 `CustomerAIPro_SaaS_教科書.md` 後下載 PDF。

---

## 5. 檔名提醒

- 正確：`CustomerAIPro_**SaaS**_教科書.md`（SaaS，大寫 A）  
- 錯誤：`CustomerAIPro_Saas_教科書.md`（Saas 會找不到檔案）
