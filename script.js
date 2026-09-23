const config = window.INVITE_CONFIG;

const yesBtn = document.querySelector("#yesBtn");
const noBtn = document.querySelector("#noBtn");
const actions = document.querySelector(".actions");
const celebration = document.querySelector("#celebration");
const successMessage = document.querySelector(".success-message");
const notificationStatus = document.querySelector("#notificationStatus");
const pleadModal = document.querySelector("#pleadModal");
const pleadTitle = document.querySelector("#pleadTitle");
const pleadMessage = document.querySelector("#pleadMessage");
const pleadClose = document.querySelector("#pleadClose");
const dateModal = document.querySelector("#dateModal");
const dateOptions = document.querySelector("#dateOptions");
let runawayCount = 0;
let accepted = false;
let selectedDate = "";
let currentDiscordMessage = config.discordMessageTemplate.replace("{date}", "9/28 或 10/30");
let noButtonDetached = false;
let ignoreNextClick = false;
let lastRunawayAt = 0;
let noButtonDisabled = false;
const shownPleadPopups = new Set();

function applyContent() {
  document.title = config.pageTitle;

  document.querySelectorAll("[data-content]").forEach((element) => {
    const key = element.dataset.content;
    element.textContent = config[key] || "";
  });

  renderDateOptions();
}

function renderDateOptions() {
  dateOptions.innerHTML = "";

  config.dateOptions.forEach((option) => {
    const button = document.createElement("button");
    button.className = "date-option";
    button.type = "button";
    button.textContent = option.label;
    button.addEventListener("click", () => finishAcceptInvite(option.value));
    dateOptions.appendChild(button);
  });
}

function resizeYesButton() {
  const height = Math.min(
    Math.round(window.innerHeight * 0.28),
    60 + runawayCount * 18
  );
  const fontSize = Math.min(1.45, 1.12 + runawayCount * 0.055);

  document.documentElement.style.setProperty("--yes-scale", "1");
  document.documentElement.style.setProperty("--yes-height", `${height}px`);
  document.documentElement.style.setProperty("--yes-font-size", `${fontSize.toFixed(2)}rem`);
}

function showPleadPopup() {
  const popup = config.pleadPopups.milestones[runawayCount];

  if (!popup || shownPleadPopups.has(runawayCount)) {
    return;
  }

  shownPleadPopups.add(runawayCount);
  pleadTitle.textContent = popup.title;
  pleadMessage.textContent = popup.message;
  pleadClose.textContent = config.pleadPopups.closeButtonText;
  pleadModal.classList.add("show");
  pleadModal.setAttribute("aria-hidden", "false");
  pleadClose.focus();

  if (popup.removeNoButton) {
    noButtonDisabled = true;
    noBtn.remove();
  }
}

function closePleadPopup() {
  pleadModal.classList.remove("show");
  pleadModal.setAttribute("aria-hidden", "true");
  yesBtn.focus();
}

function moveNoButton(event) {
  event.preventDefault();

  if (noButtonDisabled) {
    return;
  }

  if (event.type === "pointerenter" && event.pointerType !== "mouse") {
    return;
  }

  if (event.type === "click" && ignoreNextClick) {
    ignoreNextClick = false;
    return;
  }

  const now = Date.now();
  if (now - lastRunawayAt < 280) {
    return;
  }
  lastRunawayAt = now;

  if (event.type === "touchstart") {
    ignoreNextClick = true;
  }

  if (!noButtonDetached) {
    const currentPosition = noBtn.getBoundingClientRect();
    noBtn.classList.add("is-running", "no-transition");
    noBtn.style.left = `${currentPosition.left}px`;
    noBtn.style.top = `${currentPosition.top}px`;

    document.body.appendChild(noBtn);
    actions.classList.add("is-yes-focused");
    noButtonDetached = true;
    noBtn.offsetHeight;
    noBtn.classList.remove("no-transition");
  }

  runawayCount += 1;
  resizeYesButton();
  showPleadPopup();

  if (noButtonDisabled) {
    return;
  }

  const safe = 18;
  const buttonWidth = noBtn.offsetWidth || 118;
  const buttonHeight = noBtn.offsetHeight || 58;
  const maxX = Math.max(safe, window.innerWidth - buttonWidth - safe);
  const maxY = Math.max(safe, window.innerHeight - buttonHeight - safe - 18);
  const x = Math.floor(safe + Math.random() * (maxX - safe));
  const y = Math.floor(safe + Math.random() * (maxY - safe));
  const tilt = `${Math.random() > 0.5 ? "" : "-"}${5 + Math.floor(Math.random() * 10)}deg`;

  noBtn.classList.add("is-running");
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
  noBtn.style.setProperty("--tilt", tilt);
  noBtn.textContent = runawayCount > config.runaway.teaseAfter
    ? config.noButtonTeaseText
    : config.noButtonText;
}

function celebrate() {
  for (let index = 0; index < 46; index += 1) {
    const particle = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 230;
    particle.className = "particle";
    particle.textContent = config.celebrationIcons[Math.floor(Math.random() * config.celebrationIcons.length)];
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--rot", `${Math.floor(Math.random() * 520 - 260)}deg`);
    particle.style.setProperty("--size", `${18 + Math.floor(Math.random() * 20)}px`);
    document.body.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
}

async function sendBackgroundNotification() {
  if (config.notification.discordWebhookUrl) {
    const payload = {
      content: currentDiscordMessage,
      embeds: [
        {
          title: "約會邀請回覆",
          color: 16744576,
          fields: [
            { name: "選擇日期", value: selectedDate, inline: true },
            { name: "回覆時間", value: new Date().toLocaleString("zh-TW"), inline: true }
          ]
        }
      ]
    };
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify(payload));

    await fetch(config.notification.discordWebhookUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData
    });
  }

  if (config.notification.formspreeEndpoint) {
    await fetch(config.notification.formspreeEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: "accepted",
        selectedDate,
        message: currentDiscordMessage,
        date: new Date().toISOString()
      })
    });
  }

  /*
    EmailJS 預留區：
    1. 在 home.html 引入 EmailJS SDK。
    2. 把 config.js 裡 notification.emailJs 的資料填好。
    3. 取消下面註解。

    if (config.notification.emailJs.enabled && window.emailjs) {
      emailjs.init({ publicKey: config.notification.emailJs.publicKey });
      await emailjs.send(
        config.notification.emailJs.serviceId,
        config.notification.emailJs.templateId,
        { message: currentDiscordMessage, selectedDate, reply: "accepted" }
      );
    }
  */
}

function acceptInvite() {
  if (accepted) return;
  dateModal.classList.add("show");
  dateModal.setAttribute("aria-hidden", "false");
  dateOptions.querySelector("button")?.focus();
}

function finishAcceptInvite(dateValue) {
  if (accepted) return;

  accepted = true;
  selectedDate = dateValue;
  currentDiscordMessage = config.discordMessageTemplate.replace("{date}", selectedDate);
  successMessage.textContent = `${config.successMessage}\n你選的是：${selectedDate}`;
  notificationStatus.textContent = config.notificationPendingText;
  dateModal.classList.remove("show");
  dateModal.setAttribute("aria-hidden", "true");

  celebration.classList.add("show");
  celebration.setAttribute("aria-hidden", "false");
  celebrate();
  sendBackgroundNotification()
    .then(() => {
      notificationStatus.textContent = config.notificationSuccessText;
    })
    .catch(() => {
      notificationStatus.textContent = config.notificationFailText;
    });
}

applyContent();
pleadClose.addEventListener("click", closePleadPopup);
pleadModal.addEventListener("click", (event) => {
  if (event.target === pleadModal) {
    closePleadPopup();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && pleadModal.classList.contains("show")) {
    closePleadPopup();
  }
});
yesBtn.addEventListener("click", acceptInvite);
noBtn.addEventListener("click", moveNoButton);
noBtn.addEventListener("touchstart", moveNoButton, { passive: false });
noBtn.addEventListener("pointerenter", moveNoButton);
