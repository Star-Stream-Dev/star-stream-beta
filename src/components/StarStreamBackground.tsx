import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  drift: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/**
 * Animated star-stream background: twinkling drifting stars,
 * occasional shooting stars, over a deep blue nebula gradient.
 */
export function StarStreamBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let stars: Star[] = [];
    let shooting: ShootingStar[] = [];
    let nextShoot = performance.now() + 1500;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 3500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 1.4,
        baseAlpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.4 + Math.random() * 1.6,
        twinkleOffset: Math.random() * Math.PI * 2,
        drift: 2 + Math.random() * 10, // px/s slow stream drift
      }));
    };

    const spawnShootingStar = (now: number) => {
      const fromLeft = Math.random() > 0.5;
      const speed = 350 + Math.random() * 350;
      const angle = (fromLeft ? 1 : -1) * (Math.PI / 6 + Math.random() * (Math.PI / 8));
      shooting.push({
        x: fromLeft ? -50 : width + 50,
        y: Math.random() * height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.abs(Math.sin(angle)) * speed,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.7,
      });
      nextShoot = now + 1800 + Math.random() * 4500;
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      if (now >= nextShoot) spawnShootingStar(now);

      // Twinkling, slowly streaming stars
      for (const s of stars) {
        s.x -= s.drift * dt;
        if (s.x < -4) s.x = width + 4;
        const alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(220, 80%, 85%, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      // Shooting stars with glowing trails
      shooting = shooting.filter((st) => st.life < st.maxLife);
      for (const st of shooting) {
        st.life += dt;
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        const p = st.life / st.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        const tailX = st.x - st.vx * 0.12;
        const tailY = st.y - st.vy * 0.12;
        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        grad.addColorStop(0, `hsla(220, 90%, 80%, ${(0.9 * alpha).toFixed(3)})`);
        grad.addColorStop(1, 'hsla(220, 90%, 60%, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(st.x, st.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(220, 100%, 90%, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Deep blue nebula base */}
      <div className="absolute inset-0 bg-gradient-bg" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 20% 15%, hsl(220 80% 45% / 0.18), transparent 70%), radial-gradient(ellipse 55% 40% at 80% 25%, hsl(260 80% 50% / 0.14), transparent 70%), radial-gradient(ellipse 70% 50% at 50% 90%, hsl(220 90% 40% / 0.12), transparent 70%)',
        }}
      />
      {/* Animated stars */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
