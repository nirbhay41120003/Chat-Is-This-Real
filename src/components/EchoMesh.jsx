import { useEffect, useRef } from 'react';

const LABELS = ['Flam', 'mind', 'focus', 'review', 'ideas', 'learn', 'memory', 'quiz', 'study', 'topic'];

/** Full-window ambient node network. It sits behind the study UI and never intercepts input. */
export default function EchoMesh() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let pulses = [];
    let rings = [];
    let frame = 0;
    let mouse = { x: -10000, y: -10000 };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const linkDistance = () => (width < 860 ? 120 : 160);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, width < 860 ? 1.5 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.min(110, Math.round((width * height) / (width < 860 ? 16000 : 17000))));
      const labels = LABELS.slice().sort(() => Math.random() - 0.5);
      points = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        radius: 1.2 + Math.random() * 1.3,
        lit: index < (width < 860 ? 6 : 9),
        label: index < (width < 860 ? 6 : 9) ? labels[index] : '',
        phase: Math.random() * Math.PI * 2,
      }));
      pulses = [];
    }

    function sendLight(start, end) {
      const path = [start];
      const seen = new Set(path);
      let current = start;
      for (let hop = 0; hop < 14 && current !== end; hop += 1) {
        let best = null;
        let bestDistance = Math.hypot(current.x - end.x, current.y - end.y);
        for (const candidate of points) {
          if (seen.has(candidate) || (candidate !== end && !candidate.lit)) continue;
          const distance = Math.hypot(current.x - candidate.x, current.y - candidate.y);
          if (distance > linkDistance() * 1.3) continue;
          const toEnd = Math.hypot(candidate.x - end.x, candidate.y - end.y);
          if (toEnd < bestDistance) { bestDistance = toEnd; best = candidate; }
        }
        if (!best) break;
        path.push(best); seen.add(best); current = best;
      }
      if (path.length > 1) pulses.push({ path, index: 0, t: 0 });
    }

    function onPointerDown(event) {
      if (event.target.closest('a, button, input, textarea, select, [role="button"]')) return;
      const point = { x: event.clientX, y: event.clientY, vx: 0, vy: 0, radius: 2.2, lit: true, label: 'Hire Me!', phase: 0 };
      points.push(point);
      rings.push({ x: point.x, y: point.y, t: 0 });
      const nearby = points.filter((item) => item.lit && item !== point)
        .sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y)).slice(0, 2);
      nearby.forEach((item, index) => window.setTimeout(() => sendLight(item, point), 250 + index * 350));
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      const darkMode = document.documentElement.dataset.theme === 'dark';
      const accent = darkMode ? '#72dfc7' : '#2b4eff';
      const quietInk = darkMode ? '#9ab0a4' : '#16171c';
      if (!reduceMotion) {
        for (const point of points) {
          point.x += point.vx; point.y += point.vy;
          if (point.x < -20) point.x = width + 20;
          if (point.x > width + 20) point.x = -20;
          if (point.y < -20) point.y = height + 20;
          if (point.y > height + 20) point.y = -20;
        }
        if (Math.random() < 0.025 && pulses.length < (width < 860 ? 3 : 6)) {
          const lit = points.filter((point) => point.lit);
          if (lit.length > 1) sendLight(lit[Math.floor(Math.random() * lit.length)], lit[Math.floor(Math.random() * lit.length)]);
        }
        for (let i = rings.length - 1; i >= 0; i -= 1) { rings[i].t += 0.018; if (rings[i].t >= 1) rings.splice(i, 1); }
        for (let i = pulses.length - 1; i >= 0; i -= 1) {
          const pulse = pulses[i];
          const a = pulse.path[pulse.index], b = pulse.path[pulse.index + 1];
          pulse.t += 2.6 / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
          if (pulse.t >= 1) { pulse.t = 0; pulse.index += 1; if (pulse.index >= pulse.path.length - 1) pulses.splice(i, 1); }
        }
      }

      const grid = width < 860 ? 27 : 19;
      const offsetX = -(((mouse.x - width / 2) * 0.016) % grid);
      const offsetY = -(((mouse.y - height / 2) * 0.016) % grid);
      ctx.fillStyle = quietInk;
      for (let x = offsetX - grid; x < width + grid; x += grid) for (let y = offsetY - grid; y < height + grid; y += grid) {
        const dx = x - mouse.x, dy = y - mouse.y, distance = Math.hypot(dx, dy);
        let px = x, py = y, alpha = darkMode ? 0.19 : 0.12, radius = 0.8;
        if (distance < 200 && distance > 0.1) { const force = 1 - distance / 200; px += (dx / distance) * force * force * 18; py += (dy / distance) * force * force * 18; alpha += force * 0.18; radius += force * 0.5; }
        ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const reach = linkDistance();
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j += 1) {
          const b = points[j], distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > reach) continue;
          ctx.strokeStyle = a.lit && b.lit ? accent : quietInk;
          ctx.globalAlpha = (1 - distance / reach) * (a.lit && b.lit ? (darkMode ? 0.36 : 0.2) : (darkMode ? 0.2 : 0.08));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        const mouseDistance = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (mouseDistance < reach * 1.1) { ctx.strokeStyle = accent; ctx.globalAlpha = (1 - mouseDistance / (reach * 1.1)) * (darkMode ? 0.48 : 0.3); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      for (const pulse of pulses) {
        const a = pulse.path[pulse.index], b = pulse.path[pulse.index + 1];
        const x = a.x + (b.x - a.x) * pulse.t, y = a.y + (b.y - a.y) * pulse.t;
        ctx.strokeStyle = accent; ctx.globalAlpha = darkMode ? 0.8 : 0.45; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = darkMode ? 0.28 : 0.14; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      for (const ring of rings) { ctx.strokeStyle = accent; ctx.globalAlpha = (1 - ring.t) * (darkMode ? 0.8 : 0.55); ctx.beginPath(); ctx.arc(ring.x, ring.y, 6 + ring.t * 70, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      for (const point of points) {
        const glow = 0.55 + 0.45 * Math.sin(time / 900 + point.phase);
        ctx.fillStyle = point.lit ? accent : quietInk;
        ctx.globalAlpha = point.lit ? (darkMode ? 0.78 + 0.2 * glow : 0.55 + 0.4 * glow) : (darkMode ? 0.48 : 0.22);
        ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2); ctx.fill();
        if (point.lit && point.label) { ctx.fillStyle = darkMode ? '#c0d3ca' : '#77766f'; ctx.globalAlpha = darkMode ? 0.82 : 0.6; ctx.font = '10px SFMono-Regular, Consolas, monospace'; ctx.fillText(point.label, point.x + 8, point.y + 4); }
      }
      ctx.globalAlpha = 1;
      if (!reduceMotion) frame = window.requestAnimationFrame(draw);
    }

    function onMove(event) { mouse = { x: event.clientX, y: event.clientY }; }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="study-background" aria-hidden="true" />;
}
