import { useEffect, useRef } from 'react';

export default function Starfield() {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    const cx = cv.getContext('2d');
    let stars = [], embers = [], animId;

    function resize() { cv.width = innerWidth; cv.height = innerHeight; }

    function mkStars() {
      stars = [];
      for (let i = 0; i < 220; i++) stars.push({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        r: Math.random() * 1.4 + 0.2, op: Math.random() * 0.6 + 0.15,
        tw: Math.random() * 0.018 + 0.004, td: Math.random() > .5 ? 1 : -1,
        dx: (Math.random() - .5) * 0.08
      });
      embers = [];
      for (let i = 0; i < 18; i++) embers.push(mkEmber());
    }

    function mkEmber() {
      return {
        x: Math.random() * cv.width, y: cv.height + 10,
        vx: (Math.random() - .5) * 0.35, vy: -Math.random() * 0.45 - 0.12,
        r: Math.random() * 2.2 + 0.8, life: 0, max: Math.random() * 0.6 + 0.4
      };
    }

    function draw() {
      cx.clearRect(0, 0, cv.width, cv.height);
      stars.forEach(s => {
        s.op += s.tw * s.td; if (s.op > 0.8 || s.op < 0.1) s.td *= -1;
        s.x += s.dx; if (s.x < 0) s.x = cv.width; if (s.x > cv.width) s.x = 0;
        cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        cx.fillStyle = `rgba(255,220,210,${s.op})`; cx.fill();
      });
      embers.forEach((e, i) => {
        e.x += e.vx; e.y += e.vy; e.life += 0.006;
        if (e.life > e.max || e.y < -10) { embers[i] = mkEmber(); return; }
        const a = Math.sin(e.life / e.max * Math.PI) * 0.55;
        cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        cx.fillStyle = `rgba(220,20,60,${a})`;
        cx.shadowBlur = 8; cx.shadowColor = '#dc143c'; cx.fill(); cx.shadowBlur = 0;
      });
      animId = requestAnimationFrame(draw);
    }

    resize(); mkStars(); draw();
    window.addEventListener('resize', () => { resize(); mkStars(); });
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={cvRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
