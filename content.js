"use strict";

// Edit visible text, game targets, and gameplay pacing in this file.
const GAME_CONTENT = {
  // Opening dialog.
  intro: {
    title: "給你的小遊戲！",
    lines: [
      "知道你壓力很大，想要給你一個小驚喜，希望在上班前，能替妳帶來一點輕鬆和好心情。",
      "第一關試玩，玩法很簡單：在手機上左右拖曳籃子，接住每一關指定的物品。",
      "碰到毒藥會停止移動 1 秒。完成三個關卡後，最後有個精美小禮物!!"
    ],
    button: "可以開始囉"
  },

  // Buttons, headings, and interface text.
  ui: {
    pageTitle: "放鬆小遊戲",
    eyebrow: "第一關",
    scoreLabel: "分數",
    startButton: "點擊開始",
    continueButton: "下一關",
    finishButton: "恭喜過關",
    heartConfirmButton: "好我知道",
    heartAvoidButton: "我才不要跟你說",
    restartButton: "再玩一次",
    stageLabels: ["第一關", "第二關", "第三關"],
    victoryTitle: "冒險完成！",
  },

  // Gameplay pacing.
  gameplay: {
    goalItemRate: 0.4,
    fallingSpeed: {
      minimum: 0.32,
      randomRange: 0.20
    },
    hazardFreezeMs: 1000
  },

  // Stages are listed in gameplay order. target is the collection goal.
  stages: {
    square: {
      target: 3,
      title: "關卡完成！",
      message: "很開心可以在這邊遇到你，從教堂、營隊都看到了不一樣的你。\n\n從領訓跟小天使我也從你身上學到了很多，看照片也發現我們一起經歷了好多次的活動，真的很喜歡有你在的每個時間。",
      photos: [
        { src: "photos/square/1-1.JPG", alt: "Stage 1 photo 1" },
        { src: "photos/square/1-10.PNG", alt: "Stage 1 photo 2" },
        { src: "photos/square/1-2.JPG", alt: "Stage 1 photo 4" },
        { src: "photos/square/1-3.HEIC", fallback: "photos/square/1-5.jpeg", alt: "Stage 1 photo 5" },
        { src: "photos/square/1-4.HEIC", fallback: "photos/square/1-6.jpg", alt: "Stage 1 photo 6" },
        { src: "photos/square/1-5.jpeg", alt: "Stage 1 photo 7" },
        { src: "photos/square/1-6.jpg", alt: "Stage 1 photo 8" },
        { src: "photos/square/1-7.jpeg", alt: "Stage 1 photo 9" },
        { src: "photos/square/1-8.JPG", alt: "Stage 1 photo 10" },
        { src: "photos/square/1-9.jpg", alt: "Stage 1 photo 11" }
      ]
    },
    cross: {
      target: 4,
      title: "關卡完成！",
      message: "很多時候，你都一個人默默承受\n\n大學的時間裡，也給了自己很多壓力；在服務中，也希望可以好好的把這裡的好傳承給\n底下的弟弟妹妹們。\n\n就算畢業、即將踏入職場，你心裡也想要成為他們的支柱\n\n說出了：\n「希望這裡不只是你的家　\n　也能成為他們的家。」",
      photos: [
        { src: "photos/cross/2-1.JPG", alt: "Stage 2 photo 1" },
        { src: "photos/cross/2-2.HEIC", fallback: "photos/cross/2-3.JPG", alt: "Stage 2 photo 2" },
        { src: "photos/cross/2-3.JPG", alt: "Stage 2 photo 3" },
        { src: "photos/cross/2-4.JPG", alt: "Stage 2 photo 4" },
        { src: "photos/cross/2-5.JPG", alt: "Stage 2 photo 5" },
        { src: "photos/cross/2-6.JPG", alt: "Stage 2 photo 6" },
        { src: "photos/cross/2-7.JPG", alt: "Stage 2 photo 7" },
        { src: "photos/cross/2-8.jpeg", alt: "Stage 2 photo 8" },
        { src: "photos/cross/2-9.JPG", alt: "Stage 2 photo 9" }
      ]
    },
    heart: {
      target: 5,
      title: "關卡完成！",
      message: "明天是你的第一天上班，我相信你心裡一定壓力很大、不想去上班。\n但真的很多人都有跟我說妳真得很棒喔、你很優秀。\n\n希望小遊戲可以讓你好好放鬆、好好休息，帶著充足的\n勇氣迎接新的挑戰。\n\n也要記得，你已經不是一個人了!不開心、不順利、覺得委屈的時候，想講的話可以跟我說，\n讓我陪你一起面對、一起走過這些不愉快，好嗎?",
      photos: [
        { src: "photos/heart/3-1.jpg", alt: "Stage 3 photo 1" },
        { src: "photos/heart/3-2.jpg", alt: "Stage 3 photo 2" },
        { src: "photos/heart/3-3.JPG", alt: "Stage 3 photo 3" },
        { src: "photos/heart/3-7.jpg", alt: "Stage 3 photo 4" },
        { src: "photos/heart/3-8.jpg", alt: "Stage 3 photo 5" },
        { src: "photos/heart/3-9.jpg", alt: "Stage 3 photo 6" }
      ]
    }
  },

  // Photos shown above the final letter.
  finalPhotos: [
    { src: "photos/final/4-1.HEIC", fallback: "photos/final/4-2.JPG", alt: "Final photo 1" },
    { src: "photos/final/4-2.JPG", alt: "Final photo 2" },
    { src: "photos/final/4-3.HEIC", fallback: "photos/final/4-4.JPG", alt: "Final photo 3" },
    { src: "photos/final/4-4.JPG", alt: "Final photo 4" },
    { src: "photos/final/4-5.JPG", alt: "Final photo 5" }
  ],

  // Gift coupon dialog shown before the restart button.
  coupons: {
    title: "禮物兌換券-要截圖喔",
    button: "收下禮物",
    items: [
      { title: "晚餐兌換券", detail: "可兌換一頓好吃的晚餐" },
      { title: "禮物兌換券", detail: "可兌換一份小禮物\n(但禮物還沒到可以換再跟你說)" }
    ]
  },

  // Each item becomes a paragraph on the final message screen.
  letter: [
    "最後想跟你說：",
    "到了新環境有壓力或被唸是難免的，但誰又不是從中得到經驗值得哩",
    "所以願妳在忙碌的日子裡，依然保有純真、可愛的自己，也要記住了：妳真的很棒了！"
  ]
};
