(() => {
  const cover = document.getElementById("top");
  const canvas = document.getElementById("home-petals-canvas");
  const dayCanvas = document.getElementById("home-day-canvas");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!cover || !canvas || !dayCanvas || reducedMotion.matches) return;

  const context = canvas.getContext("2d", { alpha: true });
  const dayContext = dayCanvas.getContext("2d", { alpha: false });
  const treeCanvas = document.createElement("canvas");
  const treeContext = treeCanvas.getContext("2d", { alpha: true });
  if (!context || !dayContext || !treeContext) return;

  const petals = [];
  const dayImage = new Image();
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let dayImageReady = false;
  let coverVisible = true;
  let lastFrame = 0;
  let wind = 0.45;
  let windTarget = 0.45;
  let nextWindChange = 0;
  let nextDensityChange = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const isLight = () => document.body.dataset.mdColorScheme === "default";
  const shouldRun = () => isLight() && coverVisible && !document.hidden;

  const basePetalCount = () => {
    if (window.matchMedia("(max-width: 600px)").matches) return 20;
    if (window.matchMedia("(max-width: 1000px)").matches) return 28;
    return 36;
  };

  const desiredPetalCount = () => {
    const gust = Math.max(0, wind - 0.42);
    const extra = Math.round(gust * (width < 700 ? 12 : 24));
    return basePetalCount() + extra;
  };

  const resetPetal = (petal, initial = false) => {
    const depth = Math.pow(Math.random(), 0.72);
    const entersFromSide = Math.random() < 0.28;
    petal.depth = depth;
    petal.x = entersFromSide ? random(-width * 0.12, 0) : random(-width * 0.06, width * 0.9);
    petal.y = initial ? random(-height * 0.15, height * 0.95) : random(-height * 0.22, -12);
    petal.size = random(4.2, 7.2) * (0.55 + depth * 0.75);
    petal.fallSpeed = random(11, 24) * (0.55 + depth * 0.72);
    petal.windSpeed = random(9, 19) * (0.5 + depth * 0.75);
    petal.sway = random(7, 22) * (0.5 + depth * 0.7);
    petal.swayRate = random(0.65, 1.35);
    petal.phase = random(0, Math.PI * 2);
    petal.rotation = random(0, Math.PI * 2);
    petal.spin = random(-0.75, 0.75);
    petal.flip = random(0, Math.PI * 2);
    petal.flipRate = random(1.1, 2.25);
    petal.alpha = random(0.35, 0.72) * (0.55 + depth * 0.55);
    petal.tint = Math.random();
  };

  const syncPetals = () => {
    const target = desiredPetalCount();
    while (petals.length < target) {
      const petal = {};
      resetPetal(petal, petals.length < basePetalCount());
      petals.push(petal);
    }
    if (petals.length > target) petals.splice(target, 1);
  };

  const resize = () => {
    const rect = cover.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const backingWidth = Math.round(nextWidth * pixelRatio);
    const backingHeight = Math.round(nextHeight * pixelRatio);

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = backingWidth;
      canvas.height = backingHeight;
      dayCanvas.width = backingWidth;
      dayCanvas.height = backingHeight;
      treeCanvas.width = backingWidth;
      treeCanvas.height = backingHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      dayCanvas.style.width = `${width}px`;
      dayCanvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      dayContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      treeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      syncPetals();
    }
  };

  const imagePlacement = () => {
    const imageAspect = dayImage.naturalWidth / dayImage.naturalHeight;
    const canvasAspect = width / height;
    const drawWidth = canvasAspect > imageAspect ? width : height * imageAspect;
    const drawHeight = canvasAspect > imageAspect ? width / imageAspect : height;
    return {
      x: (width - drawWidth) * 0.5,
      y: height - drawHeight,
      width: drawWidth,
      height: drawHeight
    };
  };

  const drawDayScene = (treeResponse) => {
    if (!dayImageReady) return;
    const placement = imagePlacement();
    dayContext.clearRect(0, 0, width, height);
    dayContext.drawImage(
      dayImage,
      placement.x,
      placement.y,
      placement.width,
      placement.height
    );

    treeContext.clearRect(0, 0, width, height);
    const pivotX = width * 0.075;
    const pivotY = height * 0.88;
    treeContext.save();
    treeContext.translate(pivotX, pivotY);
    treeContext.translate(treeResponse * 2.4, Math.abs(treeResponse) * -0.55);
    treeContext.rotate(treeResponse * 0.34 * Math.PI / 180);
    treeContext.translate(-pivotX, -pivotY);
    treeContext.drawImage(
      dayImage,
      placement.x,
      placement.y,
      placement.width,
      placement.height
    );
    treeContext.restore();

    treeContext.globalCompositeOperation = "destination-in";
    const mask = treeContext.createRadialGradient(
      width * 0.075,
      height * 0.52,
      width * 0.08,
      width * 0.075,
      height * 0.52,
      width * 0.39
    );
    mask.addColorStop(0, "rgba(0, 0, 0, 1)");
    mask.addColorStop(0.58, "rgba(0, 0, 0, 0.96)");
    mask.addColorStop(0.82, "rgba(0, 0, 0, 0.28)");
    mask.addColorStop(1, "rgba(0, 0, 0, 0)");
    treeContext.fillStyle = mask;
    treeContext.fillRect(0, height * 0.16, width * 0.48, height * 0.78);
    treeContext.globalCompositeOperation = "source-over";

    dayContext.drawImage(treeCanvas, 0, 0, width, height);
    dayCanvas.classList.add("is-ready");
    cover.classList.add("day-active");
  };

  const drawPetal = (petal, time) => {
    const flip = Math.cos(petal.flip + time * petal.flipRate);
    const scaleX = 0.22 + Math.abs(flip) * 0.78;
    const centerFade =
      petal.x > width * 0.25 &&
      petal.x < width * 0.75 &&
      petal.y > height * 0.12 &&
      petal.y < height * 0.62
        ? 0.48
        : 1;
    const edgeFade = Math.min(1, Math.max(0, (height - petal.y) / (height * 0.16)));
    const alpha = petal.alpha * centerFade * edgeFade;
    if (alpha <= 0.01) return;

    const pale = petal.tint > 0.55;
    context.save();
    context.translate(petal.x, petal.y);
    context.rotate(petal.rotation);
    context.scale(scaleX, 1);
    context.globalAlpha = alpha;

    const gradient = context.createLinearGradient(0, -petal.size, 0, petal.size);
    gradient.addColorStop(0, pale ? "#fff8fb" : "#f9dce6");
    gradient.addColorStop(0.62, pale ? "#f6d8e3" : "#efb9ca");
    gradient.addColorStop(1, "#dfa1b8");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, petal.size * 0.95);
    context.bezierCurveTo(
      -petal.size * 0.92,
      petal.size * 0.28,
      -petal.size * 0.72,
      -petal.size * 0.7,
      0,
      -petal.size
    );
    context.bezierCurveTo(
      petal.size * 0.72,
      -petal.size * 0.7,
      petal.size * 0.92,
      petal.size * 0.28,
      0,
      petal.size * 0.95
    );
    context.fill();

    context.globalAlpha = alpha * 0.34;
    context.strokeStyle = "#c9829d";
    context.lineWidth = Math.max(0.45, petal.size * 0.075);
    context.beginPath();
    context.moveTo(0, petal.size * 0.76);
    context.quadraticCurveTo(-petal.size * 0.06, 0, 0, -petal.size * 0.72);
    context.stroke();
    context.restore();
  };

  const frame = (timestamp) => {
    resize();
    const time = timestamp * 0.001;
    const delta = lastFrame ? Math.min(0.04, (timestamp - lastFrame) * 0.001) : 0;
    lastFrame = timestamp;

    if (shouldRun()) {
      if (time >= nextWindChange) {
        windTarget = random(0.2, 0.86);
        nextWindChange = time + random(5.5, 10);
      }
      wind += (windTarget - wind) * Math.min(1, delta * 0.34);
      if (time >= nextDensityChange) {
        syncPetals();
        nextDensityChange = time + 0.45;
      }

      const treeWave =
        Math.sin(time * 0.62) * 0.58 +
        Math.sin(time * 1.17 + 1.8) * 0.24;
      const treeResponse = (0.32 + wind * 0.68) * treeWave;
      drawDayScene(treeResponse);

      context.clearRect(0, 0, width, height);
      for (const petal of petals) {
        const sway = Math.sin(time * petal.swayRate + petal.phase);
        petal.x += (petal.windSpeed * (0.68 + wind) + sway * petal.sway) * delta;
        petal.y += (petal.fallSpeed + Math.cos(time * 0.72 + petal.phase) * 2.2) * delta;
        petal.rotation += (petal.spin + sway * 0.16) * delta;

        if (
          petal.y > height + petal.size * 3 ||
          petal.x > width + petal.size * 5
        ) {
          resetPetal(petal);
        }
        drawPetal(petal, time);
      }
      canvas.classList.add("is-ready");
    } else {
      canvas.classList.remove("is-ready");
      context.clearRect(0, 0, width, height);
      dayCanvas.classList.remove("is-ready");
      cover.classList.remove("day-active");
    }

    window.requestAnimationFrame(frame);
  };

  new IntersectionObserver(
    ([entry]) => {
      coverVisible = entry.isIntersecting;
    },
    { threshold: 0.08 }
  ).observe(cover);

  new MutationObserver(() => {
    if (!isLight()) canvas.classList.remove("is-ready");
    lastFrame = 0;
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-md-color-scheme"]
  });

  window.addEventListener("resize", syncPetals, { passive: true });
  dayImage.onload = () => {
    dayImageReady = true;
  };
  dayImage.src = dayCanvas.dataset.src;
  resize();
  window.requestAnimationFrame(frame);
})();
