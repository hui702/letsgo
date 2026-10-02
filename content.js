"use strict";

// 這是唯一需要修改文字、照片路徑與收集數量的設定檔。
const GAME_CONTENT = {
  // 開啟網頁時顯示的說明視窗。
  intro: {
    title: "給你的小遊戲！",
    lines: [
      "這是一個為妳準備的加油小遊戲，希望在上班前，能替妳帶來一點輕鬆和好心情。",
      "第一關試玩，玩法很簡單：在手機上左右拖曳籃子，接住每一關指定的物品。",
      "碰到毒藥會停止移動 1 秒。完成三個關卡後，最後有個精美小禮物!!"
    ],
    button: "可以開始囉"
  },

  // 按鈕、標題與介面文字。
  ui: {
    pageTitle: "放鬆小遊戲",
    eyebrow: "第一關",
    scoreLabel: "分數",
    startButton: "點擊開始",
    continueButton: "下一關",
    finishButton: "查看祝福",
    restartButton: "再玩一次",
    stageLabels: ["第一關：方塊", "第二關：十字架", "第三關：愛心"],
    victoryTitle: "冒險完成！",
    missingPhoto: "請將照片放到："
  },

  // 關卡依照遊戲順序排列。target 是該關需要收集的數量。
  stages: {
    square: {
      target: 3,
      title: "方塊關卡完成！",
      caption: "小試身手",
      message: "恭喜你完成第一關囉!這樣會玩了齁還有兩關喔 加油加油。",
      photos: [
        { src: "photos/square/1-1.JPG", caption: "方塊回憶 01" },
        { src: "photos/square/1-2.GIF", caption: "方塊回憶 02" },
        { src: "photos/square/1-2.JPG", caption: "方塊回憶 03" },
        { src: "photos/square/1-3.HEIC", fallback: "photos/square/1-5.jpeg", caption: "方塊回憶 04" },
        { src: "photos/square/1-4.HEIC", fallback: "photos/square/1-6.jpeg", caption: "方塊回憶 05" },
        { src: "photos/square/1-5.jpeg", caption: "方塊回憶 06" },
        { src: "photos/square/1-6.jpeg", caption: "方塊回憶 07" },
        { src: "photos/square/1-7.jpeg", caption: "方塊回憶 08" },
        { src: "photos/square/1-8.JPG", caption: "方塊回憶 09" },
        { src: "photos/square/1-10.PNG", caption: "方塊回憶 10" }
      ]
    },
    cross: {
      target: 4,
      title: "十字架關卡完成！",
      caption: "勇氣補給",
      message: "遇到不熟悉的事情也別怕，先深呼吸，一步一步來；妳一定能找到自己的節奏。",
      photos: [
        { src: "photos/cross/2-1.JPG", caption: "十字回憶 01" },
        { src: "photos/cross/2-2.JPG", caption: "十字回憶 02" },
        { src: "photos/cross/2-3.JPG", caption: "十字回憶 03" },
        { src: "photos/cross/2-4.JPG", caption: "十字回憶 04" },
        { src: "photos/cross/2-5.JPG", caption: "十字回憶 05" },
        { src: "photos/cross/2-6.JPG", caption: "十字回憶 06" },
        { src: "photos/cross/2-7.JPG", caption: "十字回憶 07" },
        { src: "photos/cross/2-8.jpeg", caption: "十字回憶 08" },
        { src: "photos/cross/2-9.JPG", caption: "十字回憶 09" }
      ]
    },
    heart: {
      target: 5,
      title: "愛心關卡完成！",
      caption: "給努力的妳",
      message: "三個關卡都完成了！不管今天順不順利，回頭看看，妳已經很認真地走過來了。",
      photos: [
        { src: "photos/love/3-1.jpg", caption: "愛心回憶 01" },
        { src: "photos/love/3-2.jpg", caption: "愛心回憶 02" },
        { src: "photos/love/3-3.JPG", caption: "愛心回憶 03" },
        { src: "photos/love/3-4.HEIC", fallback: "photos/love/3-1.jpg", caption: "愛心回憶 04" },
        { src: "photos/love/3-5.HEIC", fallback: "photos/love/3-2.jpg", caption: "愛心回憶 05" },
        { src: "photos/love/3-6.HEIC", fallback: "photos/love/3-3.JPG", caption: "愛心回憶 06" }
      ]
    }
  },

  // 最後祝福頁的照片牆。可放最多 10 張，不需要剛好填滿。
  // HEIC 在部分瀏覽器無法顯示；這種照片請保留 fallback，指向 JPG、JPEG、PNG 或 GIF。
  photos: {
    gallery: []
  },

  // 最後祝福頁的段落，每一個字串會顯示成一段文字。
  letter: [
    "新的工作，從今天開始。",
    "不需要急著做到完美；把眼前的一步走好，就已經很了不起。",
    "願妳在忙碌的日子裡，依然保有自己的步調，也別忘了：妳真的很棒！"
  ]
};
