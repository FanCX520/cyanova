export function createEclipse(canvas, container, state) {
  const ctx = canvas?.getContext('2d', { alpha: true });
  if (!ctx) return () => {};
  let width = 0, height = 0, frame = 0, lastFrame = 0, elapsed = 0, previousTime = 0;
  let visible = false, running = false, disposed = false;
  let stars = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const draw = (time = performance.now(), once = false) => {
    if (disposed) return;
    if (!once && (!visible || document.hidden || state.paused)) { running = false; return; }
    if (!once && time - lastFrame < 1000 / (width < 700 ? 30 : 45)) { frame = requestAnimationFrame(draw); return; }
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, .08);
    previousTime = lastFrame = time;
    const t = state.reduced ? 0 : elapsed;
    pointer.x += (pointer.targetX - pointer.x) * .055;
    pointer.y += (pointer.targetY - pointer.y) * .055;
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const x = (star.x + t * star.speed + pointer.x * star.depth + width) % width;
      const y = star.y + pointer.y * star.depth;
      ctx.fillStyle = `rgba(213,238,225,${.14 + .15 * (1 + Math.sin(t * .4 + star.phase))})`;
      ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
    }
    const small = width < 760;
    const r = Math.min(height * .57, width * (small ? .95 : .47)) * (1 + state.scroll * .12);
    const cx = width * (1.22 - .23 * state.reveal) + pointer.x * 13 + width * state.scroll * .08;
    const cy = height * (small ? .41 : .48) + pointer.y * 10 - height * state.scroll * .08;
    const lx = cx - r * .06, ly = cy - r * .018;
    const energy = state.reveal * (.86 + Math.sin(t * .8) * .14);
    const glow = ctx.createRadialGradient(lx, ly, r * .95, lx, ly, r * 1.32);
    glow.addColorStop(0, `rgba(103,229,209,${energy * .12})`);
    glow.addColorStop(.18, `rgba(103,229,209,${energy * .07})`);
    glow.addColorStop(1, 'rgba(103,229,209,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lx, ly, r * 1.32, 0, Math.PI * 2); ctx.fill();
    const corona = ctx.createRadialGradient(lx, ly, r * .975, lx, ly, r * 1.035);
    corona.addColorStop(0, 'rgba(157,231,223,0)');
    corona.addColorStop(.25, `rgba(157,231,223,${energy * .25})`);
    corona.addColorStop(.43, `rgba(243,255,249,${energy * .95})`);
    corona.addColorStop(.6, `rgba(157,231,223,${energy * .45})`);
    corona.addColorStop(1, 'rgba(157,231,223,0)');
    ctx.fillStyle = corona; ctx.beginPath(); ctx.arc(lx, ly, r * 1.035, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#070e0e'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip('evenodd');
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI * .64 + ((t * (.10 + i * .025) + i * .64) % (Math.PI * 1.25));
      ctx.beginPath(); ctx.arc(lx, ly, r * (1 + i * .002), angle, angle + .13 + i * .04);
      ctx.strokeStyle = `rgba(226,255,245,${energy * (.88 - i * .22)})`; ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.shadowColor = '#9de7df'; ctx.shadowBlur = 14; ctx.stroke();
    }
    ctx.restore();
    if (!once) frame = requestAnimationFrame(draw);
  };
  const start = () => {
    if (disposed || running || !visible || document.hidden || state.paused) return;
    running = true; previousTime = 0; frame = requestAnimationFrame(draw);
  };
  const stop = () => { cancelAnimationFrame(frame); running = false; previousTime = 0; };
  const resize = () => {
    width = container.clientWidth; height = container.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.25 : 1.6);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let seed = 2026;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    stars = Array.from({ length: width < 700 ? 65 : 130 }, () => ({ x: random() * width, y: random() * height, size: .3 + random() * .7, speed: .6 + random() * 2, depth: 1 + random() * 6, phase: random() * 6.28 }));
    draw(performance.now(), true);
  };
  const onPointer = (e) => {
    if (state.paused || e.pointerType === 'touch') return;
    const bounds = container.getBoundingClientRect();
    pointer.targetX = (e.clientX - bounds.left) / width - .5;
    pointer.targetY = (e.clientY - bounds.top) / height - .5;
  };
  const onLeave = () => { pointer.targetX = pointer.targetY = 0; };
  const onVisibility = () => document.hidden ? stop() : start();
  const onMotion = () => {
    if (state.paused) { stop(); draw(performance.now(), true); }
    else start();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); });
  const resizeObserver = new ResizeObserver(resize);
  resize(); observer.observe(container); resizeObserver.observe(container);
  container.addEventListener('pointermove', onPointer, { passive: true }); container.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility); window.addEventListener('cyanova:motion', onMotion);
  return () => { disposed = true; stop(); observer.disconnect(); resizeObserver.disconnect(); container.removeEventListener('pointermove', onPointer); container.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('cyanova:motion', onMotion); };
}
