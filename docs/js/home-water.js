(() => {
  const cover = document.getElementById("top");
  const canvas = document.getElementById("home-water-canvas");
  if (!cover || !canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const simulationSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uState;
    uniform vec2 uTexel;
    uniform vec2 uImpulse;
    uniform float uImpulseRadius;
    uniform float uImpulseStrength;

    float decodeState(float value) {
      return value * 2.0 - 1.0039215686;
    }

    float encodeState(float value) {
      return value * 0.5 + 0.5019607843;
    }

    float heightAt(vec2 uv) {
      return decodeState(texture2D(uState, uv).r);
    }

    void main() {
      vec4 state = texture2D(uState, vUv);
      float height = decodeState(state.r);
      float velocity = decodeState(state.g);
      float average = (
        heightAt(vUv + vec2(uTexel.x, 0.0)) +
        heightAt(vUv - vec2(uTexel.x, 0.0)) +
        heightAt(vUv + vec2(0.0, uTexel.y)) +
        heightAt(vUv - vec2(0.0, uTexel.y))
      ) * 0.25;

      velocity += (average - height) * 0.34;
      velocity *= 0.975;
      height += velocity;

      float distanceToImpulse = distance(vUv, uImpulse);
      float safeRadius = max(uImpulseRadius, 0.0001);
      float impulse = 1.0 - smoothstep(0.0, safeRadius, distanceToImpulse);
      height += impulse * uImpulseStrength;
      height *= 0.997;

      gl_FragColor = vec4(
        clamp(encodeState(height), 0.0, 1.0),
        clamp(encodeState(velocity), 0.0, 1.0),
        0.5,
        1.0
      );
    }
  `;

  const renderSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform sampler2D uState;
    uniform vec2 uTexel;
    uniform vec2 uPointer;
    uniform float uCanvasAspect;
    uniform float uImageAspect;
    uniform float uTime;
    uniform vec4 uRipples[32];

    float heightAt(vec2 uv) {
      return texture2D(uState, uv).r * 2.0 - 1.0039215686;
    }

    vec2 coverUv(vec2 uv) {
      if (uCanvasAspect > uImageAspect) {
        uv.y = (uv.y - 0.5) * (uImageAspect / uCanvasAspect) + 0.5;
      } else {
        uv.x = (uv.x - 0.5) * (uCanvasAspect / uImageAspect) + 0.5;
      }
      return uv;
    }

    void main() {
      float left = heightAt(vUv - vec2(uTexel.x, 0.0));
      float right = heightAt(vUv + vec2(uTexel.x, 0.0));
      float down = heightAt(vUv - vec2(0.0, uTexel.y));
      float up = heightAt(vUv + vec2(0.0, uTexel.y));
      vec2 rippleGradient = vec2(left - right, down - up);

      vec2 interactiveGradient = vec2(0.0);
      for (int index = 0; index < 32; index++) {
        vec4 ripple = uRipples[index];
        float age = uTime - ripple.z;
        if (age > 0.0 && age < 9.0) {
          float rangeScale = mod(ripple.w, 32.0) / 20.0;
          float strength = floor(ripple.w / 32.0) / 20.0;
          vec2 delta = vUv - ripple.xy;
          delta.x *= uCanvasAspect;
          float distanceToCenter = length(delta);
          float radius = age * 0.116 * rangeScale;
          float packet = exp(-pow(distanceToCenter - radius, 2.0) * 210.0);
          float wave = cos((distanceToCenter - radius) * 95.0) * packet;
          float fade = exp(-age * 0.4) * (1.0 - smoothstep(3.0, 9.0, age));
          vec2 direction = delta / max(distanceToCenter, 0.001);
          interactiveGradient += direction * wave * fade * strength;
        }
      }

      vec2 waveA = vec2(
        sin(vUv.y * 42.0 + uTime * 0.36) + sin((vUv.x + vUv.y) * 25.0 - uTime * 0.22),
        cos(vUv.x * 38.0 - uTime * 0.31) + sin((vUv.x - vUv.y) * 31.0 + uTime * 0.18)
      );
      vec2 waveB = vec2(
        sin(vUv.y * 89.0 - uTime * 0.17),
        cos(vUv.x * 83.0 + uTime * 0.14)
      );

      vec2 distortion =
        rippleGradient * 0.018 +
        interactiveGradient * 0.012 +
        waveA * 0.00055 +
        waveB * 0.00018;
      vec2 uv = coverUv(vUv);
      uv += distortion;
      uv += uPointer * vec2(0.0045, 0.003);

      vec3 color = texture2D(uImage, clamp(uv, 0.001, 0.999)).rgb;
      float highlight = clamp(
        length(rippleGradient) * 0.34 + length(interactiveGradient) * 0.12,
        0.0,
        0.14
      );
      color += vec3(0.18, 0.38, 0.31) * highlight;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const createProgram = (fragmentSource) => {
    const vertex = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  };

  const simulationProgram = createProgram(simulationSource);
  const renderProgram = createProgram(renderSource);
  if (!simulationProgram || !renderProgram) return;

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const bindQuad = (program) => {
    const location = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  };

  const simulationWidth = window.matchMedia("(max-width: 700px)").matches ? 160 : 256;
  const simulationHeight = Math.round(simulationWidth * 9 / 16);
  const stateData = new Uint8Array(simulationWidth * simulationHeight * 4);
  for (let index = 0; index < stateData.length; index += 4) {
    stateData[index] = 128;
    stateData[index + 1] = 128;
    stateData[index + 2] = 128;
    stateData[index + 3] = 255;
  }

  const createStateTarget = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      simulationWidth,
      simulationHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      stateData
    );
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    return { texture, framebuffer };
  };

  let stateA = createStateTarget();
  let stateB = createStateTarget();

  const imageTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let imageAspect = 16 / 9;
  let imageReady = false;
  let coverVisible = true;
  let pointerTarget = [0, 0];
  let pointerCurrent = [0, 0];
  let pendingImpulse = null;
  let lastMovePointer = null;
  let lastMoveTime = 0;
  let moveRipplesPaused = false;
  const rippleLifetime = 9.0;
  const rippleUniformData = new Float32Array(32 * 4);
  const ripples = Array.from({ length: 32 }, () => ({
    x: -10,
    y: -10,
    startedAt: -100,
    strength: 0,
    rangeScale: 1
  }));

  const isDark = () => document.body.dataset.mdColorScheme !== "default";
  const shouldRun = () => imageReady && isDark() && coverVisible && !document.hidden;

  const resize = () => {
    const rect = cover.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const setTexture = (unit, texture, uniform, program) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, uniform), unit);
  };

  const simulate = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, stateB.framebuffer);
    gl.viewport(0, 0, simulationWidth, simulationHeight);
    gl.useProgram(simulationProgram);
    bindQuad(simulationProgram);
    setTexture(0, stateA.texture, "uState", simulationProgram);
    gl.uniform2f(
      gl.getUniformLocation(simulationProgram, "uTexel"),
      1 / simulationWidth,
      1 / simulationHeight
    );
    const impulse = pendingImpulse;
    gl.uniform2f(
      gl.getUniformLocation(simulationProgram, "uImpulse"),
      impulse ? impulse.x : -10,
      impulse ? impulse.y : -10
    );
    gl.uniform1f(
      gl.getUniformLocation(simulationProgram, "uImpulseRadius"),
      impulse ? impulse.radius : 0
    );
    gl.uniform1f(
      gl.getUniformLocation(simulationProgram, "uImpulseStrength"),
      impulse ? impulse.strength : 0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    pendingImpulse = null;
    [stateA, stateB] = [stateB, stateA];
  };

  const render = (time) => {
    resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(renderProgram);
    bindQuad(renderProgram);
    setTexture(0, imageTexture, "uImage", renderProgram);
    setTexture(1, stateA.texture, "uState", renderProgram);
    gl.uniform2f(
      gl.getUniformLocation(renderProgram, "uTexel"),
      1 / simulationWidth,
      1 / simulationHeight
    );
    gl.uniform2f(
      gl.getUniformLocation(renderProgram, "uPointer"),
      pointerCurrent[0],
      pointerCurrent[1]
    );
    gl.uniform1f(
      gl.getUniformLocation(renderProgram, "uCanvasAspect"),
      canvas.width / canvas.height
    );
    gl.uniform1f(gl.getUniformLocation(renderProgram, "uImageAspect"), imageAspect);
    gl.uniform1f(gl.getUniformLocation(renderProgram, "uTime"), time * 0.001);
    rippleUniformData.fill(0);
    const now = time * 0.001;
    const activeRipples = ripples
      .filter((ripple) => now - ripple.startedAt > 0 && now - ripple.startedAt < rippleLifetime)
      .slice(-32);
    activeRipples.forEach((ripple, index) => {
      const offset = index * 4;
      rippleUniformData[offset] = ripple.x;
      rippleUniformData[offset + 1] = ripple.y;
      rippleUniformData[offset + 2] = ripple.startedAt;
      const rangeStep = Math.round(ripple.rangeScale * 20);
      const strengthStep = Math.round(ripple.strength * 20);
      rippleUniformData[offset + 3] = rangeStep + strengthStep * 32;
    });
    gl.uniform4fv(
      gl.getUniformLocation(renderProgram, "uRipples[0]"),
      rippleUniformData
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const frame = (time) => {
    pointerCurrent[0] += (pointerTarget[0] - pointerCurrent[0]) * 0.08;
    pointerCurrent[1] += (pointerTarget[1] - pointerCurrent[1]) * 0.08;
    if (shouldRun()) {
      simulate();
      render(time);
      canvas.classList.add("is-ready");
      cover.classList.add("water-active");
    } else {
      canvas.classList.remove("is-ready");
      cover.classList.remove("water-active");
    }
    window.requestAnimationFrame(frame);
  };

  const addImpulse = (event, strength = 0.075, radius = 0.035) => {
    if (!isDark()) return;
    const rect = cover.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    pendingImpulse = {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      strength,
      radius
    };
  };

  const setRipplePosition = (ripple, event, strength, rangeScale = 1) => {
    const rect = cover.getBoundingClientRect();
    ripple.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    ripple.y = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
    ripple.startedAt = performance.now() * 0.001;
    ripple.strength = strength;
    ripple.rangeScale = rangeScale;
  };

  const emitRipple = (event, strength = 1) => {
    if (!isDark()) return;
    const now = performance.now() * 0.001;
    const ripple = ripples
      .slice(0, 8)
      .find((candidate) => now - candidate.startedAt >= rippleLifetime);
    if (!ripple) return;
    setRipplePosition(ripple, event, strength);
  };

  const activeMoveRippleCount = (now) => ripples
    .slice(8)
    .filter((ripple) => now - ripple.startedAt < rippleLifetime)
    .length;

  const emitMoveRipple = (event, strength = 1, rangeScale = 1) => {
    if (!isDark()) return false;
    const now = performance.now() * 0.001;
    const ripple = ripples
      .slice(8)
      .find((candidate) => now - candidate.startedAt >= rippleLifetime);
    if (!ripple) {
      moveRipplesPaused = true;
      return false;
    }
    setRipplePosition(ripple, event, strength, rangeScale);
    return true;
  };

  cover.addEventListener("pointermove", (event) => {
    const rect = cover.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    pointerTarget = [(x - 0.5) * 2, (0.5 - y) * 2];

    const now = performance.now();
    if (moveRipplesPaused) {
      if (activeMoveRippleCount(now * 0.001) > 8) return;
      moveRipplesPaused = false;
      lastMovePointer = null;
    }

    if (!lastMovePointer) {
      emitMoveRipple(event, 1, 0.72);
      lastMovePointer = { x: event.clientX, y: event.clientY };
      lastMoveTime = now;
      return;
    }

    const distance = Math.hypot(
      event.clientX - lastMovePointer.x,
      event.clientY - lastMovePointer.y
    );
    const elapsed = now - lastMoveTime;
    if (distance >= 24 || elapsed >= 140) {
      const speed = distance / Math.max(elapsed, 1);
      const rangeScale = Math.min(1.2, Math.max(0.72, 0.72 + speed * 0.48));
      emitMoveRipple(
        event,
        Math.min(1.15, 0.92 + distance * 0.004),
        rangeScale
      );
      lastMovePointer = { x: event.clientX, y: event.clientY };
      lastMoveTime = now;
    }
  });

  cover.addEventListener("pointerdown", (event) => {
    emitRipple(event, 1.35);
    addImpulse(event, 0.12, 0.045);
  });
  cover.addEventListener("pointerleave", () => {
    pointerTarget = [0, 0];
    lastMovePointer = null;
    lastMoveTime = 0;
  });

  new IntersectionObserver(
    ([entry]) => {
      coverVisible = entry.isIntersecting;
    },
    { threshold: 0.08 }
  ).observe(cover);

  const syncTheme = () => {
    const disabled = !isDark();
    canvas.classList.toggle("is-disabled", disabled);
    if (disabled) cover.classList.remove("water-active");
  };

  new MutationObserver(() => {
    syncTheme();
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-md-color-scheme"]
  });

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    imageAspect = image.naturalWidth / image.naturalHeight;
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    imageReady = true;
    syncTheme();
    window.requestAnimationFrame(frame);
  };
  image.onerror = () => {
    const fallback = canvas.dataset.fallbackSrc;
    if (fallback && image.src !== fallback) image.src = fallback;
  };
  image.src = canvas.dataset.src;
})();
