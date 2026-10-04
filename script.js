"use strict";

    const canvas = document.getElementById("game");
    const context = canvas.getContext("2d");
    const arena = document.getElementById("arena");
    const scoreEl = document.getElementById("score");
    const startLayer = document.getElementById("startLayer");
    const targets = Object.fromEntries(
      Object.entries(GAME_CONTENT.stages).map(([type, stage]) => [type, stage.target])
    );
    const collected = { heart: 0, cross: 0, square: 0 };
    const stageTypes = ["square", "cross", "heart"];
    const counterIds = { heart: "hearts", cross: "crosses", square: "squares" };
    const colors = { heart: "#e95086", cross: "#8f563e", square: "#5aaee9", hazard: "#7865b4" };
    let width = 0, height = 0, lastTime = 0, spawnTimer = 0, score = 0;
    let playing = false, frozenUntil = 0, shake = 0, stageIndex = 0;
    let items = [], particles = [], confetti = [];
    const player = { x: .5, y: .88, width: .16 };
    const pressed = new Set();
    let dragState = null;
    const galleries = {
      stage: {
        photos: [],
        index: 0,
        dragStartX: null,
        galleryId: "stageGallery",
        frameSelector: ".stage-photo-frame",
        photoId: "stagePhoto",
        countId: "photoCount",
        previousId: "previousPhoto",
        nextId: "nextPhoto"
      },
      final: {
        photos: [],
        index: 0,
        dragStartX: null,
        galleryId: "finalGallery",
        frameSelector: "#finalPhotoFrame",
        photoId: "finalPhoto",
        countId: "finalPhotoCount",
        previousId: "previousFinalPhoto",
        nextId: "nextFinalPhoto"
      }
    };

    function applyContent() {
      const ui = GAME_CONTENT.ui;
      document.title = ui.pageTitle;
      document.getElementById("eyebrow").textContent = ui.eyebrow;
      document.getElementById("scoreLabel").textContent = ui.scoreLabel;
      document.getElementById("startButton").textContent = ui.startButton;
        document.getElementById("continueButton").textContent = ui.continueButton;
        document.getElementById("restartButton").textContent = ui.restartButton;
        document.getElementById("introTitle").textContent = GAME_CONTENT.intro.title;
        document.getElementById("introCopy").innerHTML = GAME_CONTENT.intro.lines
          .map(text => "<p>" + text + "</p>")
          .join("");
        document.getElementById("introButton").textContent = GAME_CONTENT.intro.button;
      document.getElementById("victoryTitle").textContent = ui.victoryTitle;
    }

    function resize() {
      const rect = arena.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      width = rect.width;
      height = rect.height;
    }

    function drawPixelHeart(x, y, size, color) {
      const s = size / 5;
      context.fillStyle = color;
      [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [2, 4]].forEach(([px, py]) => context.fillRect(x + px * s, y + py * s, s, s));
    }

    function drawCross(x, y, size) {
      const arm = size * .32;
      context.fillStyle = colors.cross;
      context.fillRect(x + arm, y, size - arm * 2, size);
      context.fillRect(x, y + arm, size, size - arm * 2);
      context.fillStyle = "#f3d4b3";
      context.fillRect(x + arm + size * .08, y + arm + size * .08, size * .14, size * .14);
    }

    function drawSquare(x, y, size) {
      context.fillStyle = colors.square;
      context.fillRect(x, y, size, size);
      context.fillStyle = "#d9f4ff";
      context.fillRect(x + size * .2, y + size * .2, size * .24, size * .24);
    }

    function drawHazard(x, y, size) {
      context.fillStyle = colors.hazard;
      context.fillRect(x + size * .25, y, size * .5, size * .16);
      context.fillRect(x + size * .15, y + size * .16, size * .7, size * .7);
      context.fillStyle = "#f5dcff";
      context.fillRect(x + size * .28, y + size * .42, size * .44, size * .2);
      context.fillStyle = "#202450";
      context.fillRect(x + size * .44, y + size * .22, size * .12, size * .12);
    }

      function drawBasket() {
        const basketWidth = player.width * width;
        const basketHeight = Math.max(30, height * .09);
        const x = player.x * width - basketWidth / 2;
        const y = player.y * height;
        if (performance.now() < frozenUntil) {
          context.fillStyle = "rgba(120, 101, 180, .45)";
          context.fillRect(x - 7, y - 7, basketWidth + 14, basketHeight + 14);
          context.fillStyle = "#f5dcff";
          context.fillRect(x - 4, y - 4, basketWidth + 8, 4);
        }
        context.fillStyle = "#b86d4b";
      context.fillRect(x, y + basketHeight * .25, basketWidth, basketHeight * .68);
      context.fillStyle = "#ffd768";
      context.fillRect(x + basketWidth * .13, y + basketHeight * .39, basketWidth * .74, basketHeight * .12);
      context.fillStyle = "#fff9eb";
      context.fillRect(x + basketWidth * .18, y, basketWidth * .1, basketHeight * .25);
      context.fillRect(x + basketWidth * .72, y, basketWidth * .1, basketHeight * .25);
    }

    function drawBackground(time) {
      context.fillStyle = "#d5f0ff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#a8e5d0";
      context.fillRect(0, height * .79, width, height * .21);
      for (let i = 0; i < 11; i++) {
        const x = ((i * 97 + time * .006) % (width + 35)) - 18;
        const y = 30 + ((i * 63) % (height * .65));
        drawPixelHeart(x, y, 10, "rgba(255, 158, 190, .55)");
      }
      context.fillStyle = "#fff9eb";
      for (let i = 0; i < 6; i++) {
        const x = (i * 151 + 35) % width;
        const y = 58 + (i % 3) * 87;
        context.fillRect(x, y, 34, 6);
        context.fillRect(x + 7, y - 6, 20, 6);
      }
    }

    function spawnItem() {
      const roll = Math.random();
      const type = roll < GAME_CONTENT.gameplay.goalItemRate ? stageTypes[stageIndex] : "hazard";
      items.push({
        type,
        x: .08 + Math.random() * .84,
        y: -.08,
        speed: GAME_CONTENT.gameplay.fallingSpeed.minimum + Math.random() * GAME_CONTENT.gameplay.fallingSpeed.randomRange,
        size: Math.max(21, Math.min(32, width * .045)),
        drift: (Math.random() - .5) * .09
      });
    }

    function burst(x, y, color, amount = 10) {
      for (let i = 0; i < amount; i++) {
        particles.push({ x, y, vx: (Math.random() - .5) * 150, vy: (Math.random() - .7) * 170, life: .45 + Math.random() * .3, color });
      }
    }

    function catchItem(item) {
      const x = item.x * width, y = item.y * height;
        if (item.type === "hazard") {
          frozenUntil = performance.now() + GAME_CONTENT.gameplay.hazardFreezeMs;
        score = Math.max(0, score - 15);
        shake = 13;
        burst(x, y, colors.hazard, 16);
      } else {
        collected[item.type]++;
        score += 10;
        burst(x, y, colors[item.type]);
          document.getElementById(counterIds[item.type]).textContent = collected[item.type] + "/" + targets[item.type];
        if (collected[item.type] === targets[item.type]) {
          items = [];
          showMilestone(item.type);
        }
      }
      scoreEl.textContent = String(score).padStart(3, "0");
    }

    function renderGallery(galleryName) {
      const gallery = galleries[galleryName];
      const photo = gallery.photos[gallery.index];
      const image = document.getElementById(gallery.photoId);

      document.getElementById(gallery.countId).textContent = (gallery.index + 1) + " / " + gallery.photos.length;
      image.alt = photo.alt;
      image.dataset.photoPath = photo.src;
      image.onerror = () => {
        if (photo.fallback && image.dataset.photoPath !== photo.fallback) {
          image.dataset.photoPath = photo.fallback;
          image.src = photo.fallback;
          return;
        }
        image.removeAttribute("src");
      };
      image.src = photo.src;
    }

    function showGallery(galleryName, photos) {
      const gallery = galleries[galleryName];
      gallery.photos = Array.isArray(photos) ? photos : [];
      gallery.index = 0;
      document.getElementById(gallery.galleryId).hidden = gallery.photos.length === 0;

      if (gallery.photos.length > 0) renderGallery(galleryName);
    }

    function changeGalleryPhoto(galleryName, direction) {
      const gallery = galleries[galleryName];
      if (gallery.photos.length < 2) return;
      gallery.index = (gallery.index + direction + gallery.photos.length) % gallery.photos.length;
      renderGallery(galleryName);
    }

    function bindGalleryControls(galleryName) {
      const gallery = galleries[galleryName];
      const frame = document.querySelector(gallery.frameSelector);

      document.getElementById(gallery.previousId).addEventListener("click", () => changeGalleryPhoto(galleryName, -1));
      document.getElementById(gallery.nextId).addEventListener("click", () => changeGalleryPhoto(galleryName, 1));
      frame.addEventListener("pointerdown", event => {
        gallery.dragStartX = event.clientX;
      });
      frame.addEventListener("pointerup", event => {
        if (gallery.dragStartX === null) return;
        const distance = event.clientX - gallery.dragStartX;
        gallery.dragStartX = null;
        if (Math.abs(distance) > 35) changeGalleryPhoto(galleryName, distance > 0 ? -1 : 1);
      });
      frame.addEventListener("pointercancel", () => {
        gallery.dragStartX = null;
      });
    }

    function showMilestone(type) {
      playing = false;
      updateStageUI();
      const data = GAME_CONTENT.stages[type];
      const isFinalStage = stageIndex === stageTypes.length - 1;
      const continueButton = document.getElementById("continueButton");
      const avoidButton = document.getElementById("avoidButton");

      document.getElementById("milestoneTitle").textContent = data.title;
      showGallery("stage", data.photos);
      document.getElementById("milestoneNote").textContent = data.message;
      continueButton.textContent = isFinalStage
        ? GAME_CONTENT.ui.heartConfirmButton
        : GAME_CONTENT.ui.continueButton;
      avoidButton.textContent = GAME_CONTENT.ui.heartAvoidButton;
      avoidButton.hidden = !isFinalStage;
      avoidButton.classList.remove("is-escaping");
      avoidButton.style.removeProperty("left");
      avoidButton.style.removeProperty("top");
      document.getElementById("milestoneBackdrop").hidden = false;
    }

    function moveAvoidButton() {
      const avoidButton = document.getElementById("avoidButton");
      const modal = avoidButton.closest(".modal");
      const padding = 18;

      avoidButton.classList.add("is-escaping");
      const maxLeft = Math.max(padding, modal.clientWidth - avoidButton.offsetWidth - padding);
      const maxTop = Math.max(padding, modal.clientHeight - avoidButton.offsetHeight - padding);
      avoidButton.style.left = Math.round(padding + Math.random() * (maxLeft - padding)) + "px";
      avoidButton.style.top = Math.round(padding + Math.random() * (maxTop - padding)) + "px";
    }

    function updateStageUI() {
      stageTypes.forEach((type, index) => {
        const goal = document.querySelector('[data-goal="' + type + '"]');
        goal.classList.toggle("is-active", index === stageIndex && collected[type] < targets[type]);
        goal.classList.toggle("is-complete", collected[type] >= targets[type]);
        goal.classList.toggle("is-locked", index > stageIndex);
      });
      document.getElementById("eyebrow").textContent = GAME_CONTENT.ui.stageLabels[stageIndex];
    }

    function win() {
      playing = false;
      for (let i = 0; i < 120; i++) {
        confetti.push({ x: Math.random() * width, y: -Math.random() * height, vy: 40 + Math.random() * 120, size: 4 + Math.random() * 8, color: [colors.heart, colors.cross, colors.square, colors.hazard][i % 4] });
      }
      setTimeout(() => {
        document.getElementById("letter").innerHTML = GAME_CONTENT.letter.map(text => "<p>" + text + "</p>").join("");
        showGallery("final", GAME_CONTENT.finalPhotos);
        document.getElementById("victoryBackdrop").hidden = false;
      }, 650);
    }

    function update(delta, now) {
      const speed = (pressed.has("ArrowLeft") || pressed.has("a") || pressed.has("A") ? -1 : 0) + (pressed.has("ArrowRight") || pressed.has("d") || pressed.has("D") ? 1 : 0);
      if (now >= frozenUntil) player.x = Math.max(.08, Math.min(.92, player.x + speed * delta * .65));
      items.forEach(item => { item.y += item.speed * delta; item.x += item.drift * delta; });
      const basketY = player.y * height;
      const basketHalf = player.width * width * .52;
      items = items.filter(item => {
        const x = item.x * width, y = item.y * height;
        if (y > basketY - 16 && y < basketY + 45 && Math.abs(x - player.x * width) < basketHalf) {
          catchItem(item);
          return false;
        }
        return y < height + 50;
      });
      particles.forEach(p => { p.x += p.vx * delta; p.y += p.vy * delta; p.vy += 350 * delta; p.life -= delta; });
      particles = particles.filter(p => p.life > 0);
    }

    function render(time) {
      context.save();
      if (shake > 0) {
        context.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
        shake *= .82;
      }
      drawBackground(time);
      items.forEach(item => {
        const x = item.x * width - item.size / 2, y = item.y * height - item.size / 2;
        if (item.type === "heart") drawPixelHeart(x, y, item.size, colors.heart);
        if (item.type === "cross") drawCross(x, y, item.size);
        if (item.type === "square") drawSquare(x, y, item.size);
        if (item.type === "hazard") drawHazard(x, y, item.size);
      });
      particles.forEach(p => { context.globalAlpha = Math.max(0, p.life * 1.5); context.fillStyle = p.color; context.fillRect(p.x, p.y, 5, 5); });
      context.globalAlpha = 1;
      confetti.forEach(piece => { context.fillStyle = piece.color; context.fillRect(piece.x, piece.y, piece.size, piece.size); piece.y += piece.vy / 60; });
      drawBasket();
      context.restore();
    }

    function loop(time) {
      const delta = Math.min((time - lastTime) / 1000 || 0, .05);
      lastTime = time;
      if (playing) {
        spawnTimer += delta;
        if (spawnTimer > .55) { spawnItem(); spawnTimer = 0; }
        update(delta, time);
      }
      render(time);
      requestAnimationFrame(loop);
    }

    function begin() {
      playing = true;
      startLayer.hidden = true;
    }

    function reset() {
      Object.keys(collected).forEach(type => {
        collected[type] = 0;
          document.getElementById(counterIds[type]).textContent = "0/" + targets[type];
      });
      items = []; particles = []; confetti = []; score = 0; stageIndex = 0; player.x = .5;
      scoreEl.textContent = "000";
      updateStageUI();
      document.getElementById("victoryBackdrop").hidden = true;
      begin();
    }

      document.getElementById("startButton").addEventListener("click", begin);
      document.getElementById("introButton").addEventListener("click", () => {
        document.getElementById("introBackdrop").hidden = true;
      });
    document.getElementById("continueButton").addEventListener("click", () => {
      document.getElementById("milestoneBackdrop").hidden = true;
      if (stageIndex === stageTypes.length - 1) {
        win();
        return;
      }
      items = [];
      stageIndex++;
      updateStageUI();
      playing = true;
    });
    document.getElementById("avoidButton").addEventListener("click", moveAvoidButton);
    document.getElementById("restartButton").addEventListener("click", reset);
    bindGalleryControls("stage");
    bindGalleryControls("final");
    window.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        event.preventDefault();
        pressed.add(event.key);
      }
    });
    window.addEventListener("keyup", event => pressed.delete(event.key));
      function startDrag(event) {
        if (performance.now() < frozenUntil) return;
        const rect = arena.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          startX: event.clientX,
          playerX: player.x,
          arenaWidth: rect.width
        };
        arena.setPointerCapture(event.pointerId);
      }

      function movePlayerWithDrag(event) {
        if (!dragState || event.pointerId !== dragState.pointerId || performance.now() < frozenUntil) return;
        const distance = (event.clientX - dragState.startX) / dragState.arenaWidth;
        player.x = Math.max(.08, Math.min(.92, dragState.playerX + distance));
      }

      function endDrag(event) {
        if (dragState && event.pointerId === dragState.pointerId) dragState = null;
      }

    arena.addEventListener("pointerdown", startDrag);
    arena.addEventListener("pointermove", movePlayerWithDrag);
    arena.addEventListener("pointerup", endDrag);
    arena.addEventListener("pointercancel", endDrag);
    arena.addEventListener("lostpointercapture", endDrag);
    window.addEventListener("resize", resize);

    resize();
    applyContent();
    updateStageUI();
    requestAnimationFrame(loop);
