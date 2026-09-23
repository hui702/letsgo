window.INVITE_CONFIG = {
  pageTitle: "被你破梗了拉!!",
  badgeText: "💌 想要邀請你跟我出去玩",
  mainTitle: "欸！我正在做的時候，你就傳 IG 給我了😤",
  inviteMessage: `既然都被妳破梗了，我還是要做一個給你～
9/28 或是 10/30 可以留點時間給我嗎？
想跟妳一起出去走走、散散心 因為你接下來要上班了 壓力一定很大吧!`,
  sceneText: "行程準備中：舒服、坐在咖啡廳放鬆也很可以",
  yesButtonText: "沒問題！❤️",
  noButtonText: "不要 😜",
  noButtonTeaseText: "真的不要？😗",
  successTitle: "耶！約定好了喔！",
  successMessage: "我來規畫一下行程，到時候見 🥰",
  discordMessageTemplate: "有人答應你的約會啦！她選：{date} 🥰",
  notificationPendingText: "正在把回覆送到 Discord...",
  notificationSuccessText: "已經把回覆送到 Discord 了 💌",
  notificationFailText: "通知可能沒有送成功，你可以先截圖留著給我看 🥺",
  dateModalTitle: "那妳想選哪一天呢？",
  dateModalMessage: "選一個時間，我就開始安排舒服的小行程。",
  dateOptions: [
    { label: "9/28", value: "9/28" },
    { label: "10/30", value: "10/30" },
    { label: "兩天都可以", value: "9/28 和 10/30 都可以" }
  ],
  celebrationIcons: ["❤️", "💕", "✨", "💗", "🌸", "🥰"],
  runaway: {
    yesScaleStep: 0.26,
    yesMaxScale: 3.6,
    teaseAfter: 4
  },
  pleadPopups: {
    closeButtonText: "好啦我再想一下",
    milestones: {
      5: {
        title: "等一下～",
        message: "都按到第五次了，真的不考慮一下嗎？🥺"
      },
      10: {
        title: "拜託啦～",
        message: "真的不考慮一下嗎？拜託啦，就給我一點點時間嘛🥲"
      },
      12: {
        title: "不給按了！",
        message: "你按太多次了，不給你按了 😤\n現在只剩下一個選項可以選了😍",
        removeNoButton: true
      }
    }
  },
  notification: {
    discordWebhookUrl: "https://discord.com/api/webhooks/1552325017016991975/2Wr1hUSc008aBKOEWDQPQmDAFLXglAAyDfdkCjkkgkuHBFnMEc8hzxuZT1Mg_JdEm-MD",
    formspreeEndpoint: "",
    emailJs: {
      enabled: false,
      serviceId: "",
      templateId: "",
      publicKey: ""
    }
  }
};
