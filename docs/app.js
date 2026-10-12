"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const state = { language: "en", sequences: [], current: null, filter: "all", query: "", view: "3d", signal: "acc", yaw: .72, pitch: .52, zoom: 1, time: 0, playing: false, lastTick: 0, overview: "train" };
  const t = (en, zh) => state.language === "zh" ? zh : en;
  const setPressed = (selector, key, value) => document.querySelectorAll(selector).forEach(button => button.setAttribute("aria-pressed", String(button.dataset[key] === value)));
  function overviewCaption() {
    $("overview-caption").textContent = state.overview === "train"
      ? t("All ten training recordings under generally good lighting. These overview figures come from the historical dataset visualization; the interactive explorer uses the versioned, time-corrected reference.", "正常照明下的全部 10 段训练记录。概览图来自历史可视化，交互浏览器使用版本化且已做时间校正的轨迹参考。")
      : t("All ten testing recordings with intermittent light-off conditions. These overview figures come from the historical dataset visualization; the interactive explorer uses the versioned, time-corrected reference.", "含间歇熄灯的全部 10 段测试记录。概览图来自历史可视化，交互浏览器使用版本化且已做时间校正的轨迹参考。");
  }
  function localize() {
    document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-en][data-zh]").forEach(element => { element.innerHTML = element.dataset[state.language]; });
    $("language").textContent = state.language === "en" ? "中文 ↗" : "EN ↗";
    $("language").setAttribute("aria-label", t("Switch to Chinese", "切换为英文"));
    $("sequence-search").placeholder = t("Find a sequence…", "查找序列…");
    $("sequence-search").setAttribute("aria-label", t("Find a sequence", "查找序列"));
    $("trajectory").setAttribute("aria-label", t("Recorded 3D trajectory. Drag or use arrow keys to rotate; scroll or press plus and minus to zoom.", "真实三维轨迹。拖拽或使用方向键旋转，滚动或使用加减键缩放。"));
    overviewCaption();
    if (state.sequences.length) renderList();
    updateDetails();
    drawAll();
  }
  $("language").addEventListener("click", () => {
    state.language = state.language === "en" ? "zh" : "en";
    try { localStorage.setItem("plato-language", state.language); } catch (_) {}
    localize();
  });
  try { if (localStorage.getItem("plato-language") === "zh") state.language = "zh"; } catch (_) {}
  function renderList() {
    const matches = state.sequences.filter(sequence => (state.filter === "all" || sequence.split === state.filter) && sequence.name.toLowerCase().includes(state.query));
    const list = $("sequence-list"); list.replaceChildren();
    if (!matches.length) {
      const message = document.createElement("p"); message.className = "loading-message"; message.textContent = t("No matching recordings.", "没有匹配的序列。"); list.append(message); return;
    }
    for (const sequence of matches) {
      const button = document.createElement("button"); button.className = "sequence-item"; button.type = "button";
      button.setAttribute("aria-pressed", String(sequence === state.current));
      button.setAttribute("aria-label", sequence.name + ", " + sequence.duration.toFixed(1) + t(" seconds", " 秒") + (!sequence.eligible ? t(", calibration flagged", "，标定被标记") : ""));
      const name = document.createElement("span"); name.textContent = sequence.name;
      if (!sequence.eligible) { const flag = document.createElement("small"); flag.title = t("Excluded from default reference evaluation", "不参与默认参考评估"); name.append(flag); }
      const duration = document.createElement("span"); duration.textContent = sequence.duration.toFixed(1) + " s";
      button.append(name, duration); button.addEventListener("click", () => selectSequence(sequence)); list.append(button);
    }
    if (!matches.includes(state.current)) selectSequence(matches[0]);
  }
  $("split-filter").addEventListener("click", event => {
    const button = event.target.closest("[data-filter]"); if (!button) return;
    state.filter = button.dataset.filter; setPressed("[data-filter]", "filter", state.filter); renderList();
  });
  $("sequence-search").addEventListener("input", event => { state.query = event.target.value.toLowerCase().trim(); renderList(); });
  function selectSequence(sequence) {
    pause(); state.current = sequence; state.time = sequence.duration; state.zoom = 1;
    $("time-slider").max = sequence.duration; $("time-slider").value = sequence.duration; $("time-slider").disabled = false; $("play").disabled = false;
    $("sequence-name").textContent = sequence.name;
    updateDetails(); renderList(); drawAll();
  }
  function updateDetails() {
    const sequence = state.current; if (!sequence) return;
    $("duration").textContent = sequence.duration.toFixed(1) + " s";
    $("imu-count").textContent = sequence.imuCount.toLocaleString(state.language === "zh" ? "zh-CN" : "en-US");
    $("off-time").textContent = sequence.offTime.toFixed(2) + " s";
    $("raw-size").textContent = (sequence.rawBytes / 1073741824).toFixed(2) + " GiB";
    $("quality-note").classList.toggle("flagged", !sequence.eligible);
    $("quality-note").textContent = sequence.eligible
      ? t("Mocap-derived reference · quality masks applied · ", "动作捕捉推导参考 · 已应用质量掩码 · ") + (100 * sequence.validRows / sequence.gtRows).toFixed(1) + t("% valid reference rows. The preview uses sampled sensor values.", "% 有效参考行。传感器曲线为采样预览。")
      : t("Calibration flagged: excluded from default reference evaluation. Raw sensors remain available; the trajectory is shown for exploratory inspection.", "标定被标记：不参与默认参考评估。原始传感器数据仍保留，轨迹仅用于探索性查看。");
    updateTime();
  }
  function updateTime() {
    if (!state.current) return;
    $("time-label").textContent = state.time.toFixed(1) + " / " + state.current.duration.toFixed(1) + " s";
    $("play").textContent = state.playing ? "Ⅱ" : "▶";
    $("play").setAttribute("aria-label", state.playing ? t("Pause recording", "暂停播放") : t("Play recording", "播放序列"));
  }
  function pause() { state.playing = false; updateTime(); }
  $("play").addEventListener("click", () => {
    if (!state.current) return;
    if (state.playing) { pause(); return; }
    if (state.time >= state.current.duration - .01) state.time = 0;
    state.playing = true; state.lastTick = performance.now(); updateTime(); requestAnimationFrame(tick);
  });
  function tick(now) {
    if (!state.playing || !state.current) return;
    state.time = Math.min(state.current.duration, state.time + Math.min((now - state.lastTick) / 1000, .15));
    state.lastTick = now; $("time-slider").value = state.time;
    if (state.time >= state.current.duration) pause();
    updateTime(); drawAll();
    if (state.playing) requestAnimationFrame(tick);
  }
  $("time-slider").addEventListener("input", event => { pause(); state.time = Number(event.target.value); updateTime(); drawAll(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { state.view = button.dataset.view; setPressed("[data-view]", "view", state.view); drawTrajectory(); }));
  $("reset-view").addEventListener("click", () => { state.yaw = .72; state.pitch = .52; state.zoom = 1; drawTrajectory(); });
  document.querySelectorAll("[data-signal]").forEach(button => button.addEventListener("click", () => { state.signal = button.dataset.signal; setPressed("[data-signal]", "signal", state.signal); drawCharts(); }));
  let pointer = null;
  const trajectory = $("trajectory");
  trajectory.addEventListener("pointerdown", event => { pointer = { x: event.clientX, y: event.clientY }; trajectory.setPointerCapture(event.pointerId); });
  trajectory.addEventListener("pointermove", event => {
    if (!pointer || state.view !== "3d") return;
    state.yaw += (event.clientX - pointer.x) * .008; state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch + (event.clientY - pointer.y) * .006));
    pointer = { x: event.clientX, y: event.clientY }; drawTrajectory();
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) trajectory.addEventListener(eventName, () => { pointer = null; });
  trajectory.addEventListener("wheel", event => { event.preventDefault(); state.zoom = Math.max(.4, Math.min(3.5, state.zoom * Math.exp(-event.deltaY * .001))); drawTrajectory(); }, { passive: false });
  trajectory.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) event.preventDefault(); else return;
    if (event.key === "ArrowLeft") state.yaw -= .12;
    if (event.key === "ArrowRight") state.yaw += .12;
    if (event.key === "ArrowUp") state.pitch = Math.min(1.4, state.pitch + .1);
    if (event.key === "ArrowDown") state.pitch = Math.max(-1.4, state.pitch - .1);
    if (event.key === "+" || event.key === "=") state.zoom = Math.min(3.5, state.zoom * 1.1);
    if (event.key === "-") state.zoom = Math.max(.4, state.zoom / 1.1);
    drawTrajectory();
  });
  function surface(canvas) {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  }
  function drawTrajectory() {
    const s = surface(trajectory); if (!s || !state.current) return;
    const { ctx, width, height } = s, sequence = state.current;
    const allPoints = sequence.segments.flatMap(segment => segment.points);
    if (!allPoints.length) { ctx.fillStyle = "#718079"; ctx.font = "12px Arial"; ctx.fillText(t("No valid trajectory reference", "没有有效轨迹参考"), 20, height / 2); return; }
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const p of allPoints) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a + 1]); hi[a] = Math.max(hi[a], p[a + 1]); }
    const center = lo.map((v, a) => (v + hi[a]) / 2);
    const extent = Math.max(.1, ...hi.map((v, a) => v - lo[a]));
    const scale = Math.min(width, height) * .63 / extent * state.zoom;
    const project = xyz => {
      const x = xyz[0] - center[0], y = xyz[1] - center[1], z = xyz[2] - center[2];
      let px, py;
      if (state.view === "yz") { px = y; py = z; }
      else if (state.view === "xy") { px = x; py = y; }
      else { px = x * Math.cos(state.yaw) - y * Math.sin(state.yaw); py = (x * Math.sin(state.yaw) + y * Math.cos(state.yaw)) * Math.sin(state.pitch) + z * Math.cos(state.pitch); }
      return [width / 2 + px * scale, height / 2 + 6 - py * scale];
    };
    const line = (a, b, color, lineWidth) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke(); };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const gridAxes = state.view === "yz" ? [1, 2] : [0, 1];
    const gridCenter = center.slice(); if (state.view === "3d") gridCenter[2] = lo[2] - extent * .1;
    for (let k = -3; k <= 3; k++) {
      for (let a = 0; a < 2; a++) {
        const first = gridCenter.slice(), second = gridCenter.slice();
        first[gridAxes[a]] += k * extent / 6; second[gridAxes[a]] += k * extent / 6;
        first[gridAxes[1 - a]] -= extent / 2; second[gridAxes[1 - a]] += extent / 2;
        line(project(first), project(second), "#e0e9df", .7);
      }
    }
    for (const segment of sequence.segments) {
      for (let i = 1; i < segment.points.length; i++) {
        const a = segment.points[i - 1], b = segment.points[i];
        line(project(a.slice(1, 4)), project(b.slice(1, 4)), "#cfddd0", 1.1);
      }
    }
    let marker = null;
    for (const segment of sequence.segments) {
      const points = segment.points;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if (a[0] > state.time) break;
        const fraction = b[0] <= state.time ? 1 : Math.max(0, (state.time - a[0]) / (b[0] - a[0]));
        const xyz = a.slice(1, 4).map((v, axis) => v + fraction * (b[axis + 1] - v));
        line(project(a.slice(1, 4)), project(xyz), b[4] ? "#cd8b46" : "#238f7c", 2.5);
        if (state.time >= a[0] && state.time <= b[0]) marker = project(xyz);
      }
      const last = points.at(-1); if (last && Math.abs(last[0] - state.time) < .015) marker = project(last.slice(1, 4));
    }
    const origin = [lo[0] - extent * .22, lo[1] - extent * .22, lo[2] - extent * .1];
    const axes = state.view === "yz" ? [1, 2] : state.view === "xy" ? [0, 1] : [0, 1, 2];
    const axisColors = ["#8eaaa1", "#7ca0a2", "#a8ac80"];
    ctx.font = "9px Arial";
    for (const axis of axes) { const end = origin.slice(); end[axis] += extent * .2; const p = project(end); line(project(origin), p, axisColors[axis], 1.1); ctx.fillStyle = "#7b8e7d"; ctx.fillText(["x", "y", "z"][axis] + " (m)", p[0] + 4, p[1] - 4); }
    if (marker) { ctx.beginPath(); ctx.arc(marker[0], marker[1], 6, 0, 2 * Math.PI); ctx.fillStyle = "#dcebd9"; ctx.fill(); ctx.beginPath(); ctx.arc(marker[0], marker[1], 3.4, 0, 2 * Math.PI); ctx.fillStyle = "#092e31"; ctx.fill(); }
    else if (state.time < sequence.duration - .1) { ctx.fillStyle = "#8a968c"; ctx.font = "9px Arial"; ctx.fillText(t("No valid reference at this time", "此时没有有效参考轨迹"), 14, 38); }
  }
  function chart(canvas, points, color, label, threshold) {
    const s = surface(canvas); if (!s || !state.current) return;
    const { ctx, width, height } = s, sequence = state.current;
    if (!points.length) return;
    const left = 32, right = 9, top = 10, bottom = 21, w = width - left - right, h = height - top - bottom;
    const minimum = 0, maximum = Math.max(threshold ? 10 : .1, ...points.map(p => p[1])) * 1.1;
    const x = value => left + value / sequence.duration * w;
    const y = value => top + h - (value - minimum) / (maximum - minimum) * h;
    for (const interval of sequence.offIntervals) { ctx.fillStyle = "#f5e7d6"; ctx.fillRect(x(interval[0]), top, x(interval[1]) - x(interval[0]), h); }
    ctx.font = "8px Arial"; ctx.fillStyle = "#869289";
    for (let i = 0; i <= 2; i++) { const value = maximum * i / 2; ctx.beginPath(); ctx.moveTo(left, y(value)); ctx.lineTo(width - right, y(value)); ctx.strokeStyle = "#e1e8df"; ctx.lineWidth = .7; ctx.stroke(); ctx.textAlign = "right"; ctx.fillText(value >= 10 ? value.toFixed(0) : value.toFixed(1), left - 5, y(value) + 3); }
    if (threshold) { ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(left, y(threshold)); ctx.lineTo(width - right, y(threshold)); ctx.strokeStyle = "#d99950"; ctx.stroke(); ctx.setLineDash([]); }
    ctx.save(); ctx.beginPath(); ctx.rect(left, top, w, h); ctx.clip();
    ctx.beginPath(); points.forEach((p, index) => { if (index === 0) ctx.moveTo(x(p[0]), y(p[1])); else ctx.lineTo(x(p[0]), y(p[1])); });
    ctx.strokeStyle = color; ctx.lineWidth = 1.15; ctx.stroke();
    if (state.time < sequence.duration - .01) { ctx.beginPath(); ctx.moveTo(x(state.time), top); ctx.lineTo(x(state.time), top + h); ctx.strokeStyle = "#315a4d"; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore(); ctx.textAlign = "left"; ctx.fillText("0 s", left, height - 5); ctx.textAlign = "right"; ctx.fillText(sequence.duration.toFixed(1) + " s", width - right, height - 5);
    ctx.fillStyle = "#718079"; ctx.fillText(label, width - right, 8);
  }
  function drawCharts() {
    if (!state.current) return;
    chart($("brightness"), state.current.brightness, "#72978a", "", 5);
    chart($("imu-signal"), state.current.imuTrace.map(p => [p[0], p[state.signal === "acc" ? 1 : 2]]), "#238f7c", state.signal === "acc" ? "m/s²" : "rad/s");
    $("imu-signal").setAttribute("aria-label", state.signal === "acc" ? t("Actual sampled acceleration norm over time, in meters per second squared", "真实加速度模长采样，单位米每二次方秒") : t("Actual sampled angular velocity norm over time, in radians per second", "真实角速度模长采样，单位弧度每秒"));
  }
  function drawAll() { drawTrajectory(); drawCharts(); }
  if ("ResizeObserver" in window) { const observer = new ResizeObserver(() => drawAll()); for (const id of ["trajectory", "brightness", "imu-signal"]) observer.observe($(id)); }
  else window.addEventListener("resize", drawAll);
  document.querySelectorAll("[data-overview]").forEach(button => button.addEventListener("click", () => {
    state.overview = button.dataset.overview; setPressed("[data-overview]", "overview", state.overview);
    $("overview-image").src = "assets/" + state.overview + "-overview.webp";
    $("overview-image").alt = t("Overview of all 10 ", "全部 10 段") + (state.overview === "train" ? t("training trajectories", "训练轨迹") : t("testing trajectories with light-off intervals", "含熄灯区间的测试轨迹"));
    overviewCaption();
  }));
  document.querySelectorAll("[data-figure]").forEach(button => button.addEventListener("click", () => {
    const source = $(button.dataset.figure); $("dialog-image").src = source.src; $("dialog-image").alt = source.alt; $("figure-dialog").showModal();
  }));
  $("close-figure").addEventListener("click", () => $("figure-dialog").close());
  $("figure-dialog").addEventListener("click", event => { if (event.target === $("figure-dialog")) { const r = $("figure-dialog").getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $("figure-dialog").close(); } });
  localize();
  fetch("data/sequences.json").then(response => { if (!response.ok) throw new Error("Data unavailable"); return response.json(); }).then(data => {
    if (!Array.isArray(data.sequences) || data.sequences.length !== 20) throw new Error("Incomplete dataset inventory");
    state.sequences = data.sequences;
    $("explorer").setAttribute("aria-busy", "false");
    selectSequence(state.sequences.find(sequence => sequence.name === "Test_001") || state.sequences[0]);
  }).catch(() => {
    $("explorer").setAttribute("aria-busy", "false"); const message = document.createElement("p"); message.className = "error-message"; message.textContent = t("The recording preview could not load. Reload the page or use the dataset download and static figures below.", "序列预览加载失败。请刷新页面，或使用下方的数据下载与静态图。"); $("sequence-list").replaceChildren(message);
  });
})();