# 手勢辨識參數調整指南

所有常用參數都集中在 `static/js/app.js` 最上方的 `CONFIG`。修改後重新整理瀏覽器即可測試。

## 建議測試方式

一次只修改一個參數，並分別測試 C 到 B、Major、Minor。每次記錄「誤判次數」和「感覺到的延遲」，才能知道哪個設定真正有效。

## 相機

| 參數 | 目前值 | 說明 |
|---|---:|---|
| `camera.width` | 1280 | 攝影機理想寬度 |
| `camera.height` | 720 | 攝影機理想高度 |

瀏覽器會盡量要求這個解析度，但攝影機驅動仍可能回傳最接近的格式。

## MediaPipe

| 參數 | 建議範圍 | 調高的影響 |
|---|---:|---|
| `modelComplexity` | 0 或 1 | `1` 較準但較慢 |
| `minDetectionConfidence` | 0.50–0.80 | 減少錯誤偵測，但手可能較難第一次被找到 |
| `minTrackingConfidence` | 0.50–0.75 | 追蹤較穩，但失去追蹤後重新偵測可能變慢 |

## 手勢判斷

| 參數 | 建議範圍 | 調高的影響 |
|---|---:|---|
| `fingerClassifier` | `angle` 或 `legacy` | `angle` 使用五指彎曲角度；`legacy` 可切回原本距離法比較 |
| `fingerBendThresholdDeg` | 35–65° | 角度小於此值才算伸直；調低會更嚴格要求四指伸直 |
| `thumbBendThresholdDeg` | 35–65° | 拇指角度小於此值才算伸直，用於區分 F/G 與 ROCK/I Love You |
| `fingerStraightCos` | 0.30–0.65 | 更要求手指筆直，彎曲時較不容易被算成伸出 |
| `fingerDistanceRatio` | 1.02–1.12 | 更要求指尖明顯遠離手腕 |
| `thumbStraightCos` | 0.10–0.55 | 更要求拇指關節筆直 |
| `thumbSpreadRatio` | 0.45–0.80 | 更要求拇指與手掌分開，可用來區分 ROCK 與 I Love You |
| `requirePalmFacing` | `true` / `false` | `true` 時只接受掌心朝鏡頭；可暫時設為 `false` 比較辨識結果 |
| `palmFacingMinScore` | 0.05–0.30 | 越高越嚴格排除手背，但手掌過度側轉時也較容易被拒絕 |
| `palmFacingLeftSign` | `1` 或 `-1` | 左手掌面方向；USB 相機若輸出硬體鏡像可反轉此值 |
| `palmFacingRightSign` | `-1` 或 `1` | 右手掌面方向；通常與左手相反 |
| `directionDeadZone` | 0.03–0.10 | 中央區變大，Major／Minor 較不會跳動，但需要更明顯朝左右 |
| `uprightQuality` | `"major"` / `null` | 手指朝正上方（落在中央區）時的和弦；設為 `null` 則必須明顯朝左右才會發聲 |
| `octaveSplitY` | 0.40–0.60 | 改變右手 High／Low 的分界高度 |

使用 `angle` 模式時，如果三指容易被判成四指，先把 `fingerBendThresholdDeg` 從 `50` 降到 `45`，讓小指必須更筆直才會被視為伸出；如果四指經常只能判成三指，則提高到 `55`。`fingerStraightCos`、`fingerDistanceRatio`、`thumbStraightCos` 與 `thumbSpreadRatio` 只會在 `legacy` 模式生效。

如果 A（ROCK）容易被判成 B（I Love You），可調整 `thumbBendThresholdDeg`：調低會讓拇指更難被視為伸直，調高則會讓 B 比較容易觸發。

掌心正對鏡頭卻經常出現橘紅色骨架時，先把 `palmFacingMinScore` 從 `0.12` 降到 `0.08`；如果手背偶爾仍會觸發，則提高到 `0.18`。左右轉動手指來切換 Major／Minor 時，請盡量維持手掌與鏡頭平行。

如果換成 USB_CAM 後發生「掌心一定是紅色、手背反而能觸發」，代表相機輸出了硬體鏡像畫面。把 `palmFacingLeftSign` 改為 `-1`、`palmFacingRightSign` 改為 `1` 即可。

## 穩定與延遲

| 參數 | 建議範圍 | 調高的影響 |
|---|---:|---|
| `leftStableMs` | 120–350 ms | 更穩定，但觸發更慢 |
| `rightStableMs` | 120–350 ms | 右手控制更穩定，但切換更慢 |
| `historyFrames` | 3–9 | 抗抖動更強，但反應更慢 |
| `majorityVotes` | 超過幀數一半 | 需要更多畫面判斷一致 |
| `handLostMs` | 250–800 ms | 短暫遮擋時不易停音，但手移開後聲音停得較慢 |

`majorityVotes` 不應大於 `historyFrames`。例如保留 7 幀時，可以先試 4 票。

## 音效

| 參數 | 說明 |
|---|---|
| `masterVolume` | 主音量，`1.0` 為 100% |
| `noteGain` | 每個和弦音的音量；太高會讓壓縮器持續作用 |
| `attackSeconds` | 越小起音越快，太小可能出現喀聲 |
| `reverbMix` | 殘響比例，建議 0–0.7 |

## 瀏覽器 Console

設定也會暴露為：

```javascript
window.GESTURE_ORGAN_CONFIG
```

角度模式也會持續提供最近一次辨識到的五指角度：

```javascript
window.GESTURE_ORGAN_DEBUG.leftAngles
window.GESTURE_ORGAN_DEBUG.rightAngles
```

例如 `{thumb: 76.2, index: 13.5, middle: 18.1, ring: 22.8, pinky: 91.4}`，代表食指、中指、無名指伸直，而拇指與小指捲曲，會被判定為三指。

可在開發者工具 Console 查看目前數值。修改需要重新啟動手勢模型的 MediaPipe 選項時，建議直接改檔案後重新整理頁面。
