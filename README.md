# 生日手勢管風琴 Birthday Gesture Organ

一份可愛的本地端生日驚喜：Flask + Bootstrap 5 + MediaPipe Hands + Web Audio API。

## 啟動

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

接著開啟 <http://127.0.0.1:5000>。

網站目前以小情書為主頁，音樂遊戲是其中一個附加驚喜：

- `/`：可以拆開的信封、小情書、三張依序解鎖的刮刮樂提示，全部刮完後前往音樂驚喜
- `/music`：精簡的手勢音樂驚喜
- `/letter`：舊網址，會自動回到首頁

## 發佈到 GitHub Pages

網站網址：<https://bohui702.github.io/letsgo/>

GitHub Pages 只能放靜態檔案，所以 `docs/` 是由 Flask 頁面輸出的靜態版本。修改內容後執行：

```powershell
python freeze.py
git add -A
git commit -m "更新網站"
git push
```

## 自訂壽星名字

啟動前設定環境變數（未設定時顯示「親愛的妳」）：

```powershell
$env:BIRTHDAY_NAME="小美"
python app.py
```

## 操作

- 食指、勝利手勢、三指、四指、張掌、ROCK、I Love You：依序演奏 C、D、E、F、G、A、B 和弦
- 手指朝上或朝畫面右側：Major 大和弦；朝畫面左側：Minor 小和弦
- 左右手都需掌心朝向鏡頭；手背朝前時會顯示橘紅骨架並暫停該手控制
- 鏡頭畫面下方會即時提示目前狀態（沒看到手、看到右手、掌心方向不對、手勢不清楚）
- 右手控制預設關閉，可從鏡頭右上角切換開關；關閉時只辨識必要的左手和弦
- 開啟後，右手伸出 1、2、3、4 指：切換 Root、第一轉位、Maj7、Dom7
- 開啟後，右手移到畫面上半部／下半部：切換 High／Low 八度
- 點擊「全螢幕演奏」可進入沉浸式演奏畫面；按 `Esc` 或再次點擊按鈕離開
- 握拳：停止聲音
- 左上角選單可切換 Key 與音色
- 鍵盤：`A S D F G H J`（按住 `Shift` 彈小和弦）
- 沒有鏡頭時，也可直接用畫面下方的和弦鍵（左邊的 Major／Minor 按鈕可切換大小和弦）
- 切換到其他分頁時會自動停音
- 第一次允許鏡頭後，可從畫面左側「攝影機」選單切換內建鏡頭或 USB_CAM

## 修改情書與禮物提示

開啟 `app.py`，修改檔案最上方的 `BIRTHDAY_CONTENT`：

- `letter_paragraphs`：情書段落
- `gift_hints`：三個刮刮樂提示，每個是 `("emoji", "提示文字")`
- `signature`：署名

刮刮樂的筆刷大小與揭曉門檻集中在 `static/js/letter.js` 最上方的 `SCRATCH_CONFIG`。

要先點開信封，下面的信和刮刮樂才會出現。刮刮樂不會記住進度，每次打開都是全新封好的。

第一次啟用手勢功能時，需要允許瀏覽器使用攝影機。手部追蹤模型由 CDN 載入，因此首次使用需連線網路；攝影機影像只在瀏覽器內處理，不會傳送到 Flask 伺服器。

手勢、相機、穩定時間與音效參數都集中在 `static/js/app.js` 最上方的 `CONFIG`。詳細測試方式請參考 `TUNING.md`。
