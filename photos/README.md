# Photos

照片會在對應關卡完成時，以一次一張的方式顯示。

- `square/`: 第一關照片
- `cross/`: 第二關照片
- `heart/`: 第三關照片
- `final/`: 目前尚未使用，保留給最後畫面

要新增、移除或調整照片順序，請編輯 `../content.js` 中對應關卡的 `photos` 清單。`src` 必須填寫相對路徑，例如 `photos/square/1-1.JPG`。

一般建議優先使用 JPG、JPEG、PNG 或 GIF。HEIC 在部分手機瀏覽器可能不支援，因此可在同一筆資料加上 `fallback`，指定可替代顯示的 JPG 或 JPEG。
