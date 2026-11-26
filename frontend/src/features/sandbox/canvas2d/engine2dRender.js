function drawParallaxBg(ctx, st, t) {
  const { w, h, pal, camX } = st;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, pal.sky || '#E2E8F0');
  grad.addColorStop(1, st.isSpace || st.isTopDown ? (pal.track || '#0F172A') : '#FAF9F6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (st.isSpace) {
    ctx.fillStyle = 'rgba(241,245,249,0.55)';
    for (let i = 0; i < 65; i += 1) {
      const sx = (i * 197) % w; const sy = ((i * 113 + t * (28 + (i % 4) * 14)) % h);
      ctx.fillRect(sx, sy, 2 + (i % 2), 2 + (i % 2));
    }
  } else if (st.isTopDown) {
    ctx.strokeStyle = 'rgba(241,245,249,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  } else {
    ctx.fillStyle = 'rgba(24,23,21,0.09)';
    const off1 = (camX * 0.2) % 160;
    for (let i = -1; i < Math.ceil(w / 160) + 2; i += 1) {
      const bx = i * 160 - off1; const bh = 110 + ((i * 53) % 120);
      ctx.fillRect(bx, st.groundY - bh, 120, bh);
    }
    ctx.fillStyle = pal.ground || '#334155';
    ctx.fillRect(0, st.groundY, w, h - st.groundY);
    ctx.fillStyle = pal.primary || '#D96B27';
    ctx.fillRect(0, st.groundY, w, 5);
  }
}

export function render2dWorld(ctx, st, t) {
  ctx.save();
  if (st.shake > 0.2) ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
  drawParallaxBg(ctx, st, t);

  ctx.save();
  if (st.isSide) ctx.translate(-st.camX, 0);

  st.platforms.forEach((p) => {
    ctx.fillStyle = st.pal.track || '#475569';
    ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 6); ctx.fill();
    ctx.fillStyle = st.pal.primary || '#D96B27';
    ctx.fillRect(p.x + 3, p.y, p.w - 6, 4);
  });

  st.obstacles.forEach((o) => {
    ctx.fillStyle = o.tall ? '#475569' : (st.pal.accent || '#1E293B');
    ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 5); ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(o.x + 4, o.y + 5, o.w - 8, 5);
  });

  st.coins.forEach((c) => {
    if (!c.alive) return;
    const rx = Math.max(3, Math.abs(Math.cos(t * 4 + c.x * 0.02)) * c.r);
    ctx.fillStyle = st.pal.secondary || '#FBBF24';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, c.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#78350F'; ctx.lineWidth = 2; ctx.stroke();
  });

  st.powerups.forEach((pw) => {
    if (!pw.alive) return;
    ctx.fillStyle = '#D96B27';
    ctx.beginPath(); ctx.arc(pw.x, pw.y + Math.sin(t * 4) * 5, pw.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FAF9F6'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pw.kind === 'shield' ? 'S' : pw.kind === 'triple_shot' ? '3X' : 'M', pw.x, pw.y + Math.sin(t * 4) * 5 + 4);
  });

  st.enemies.forEach((e) => {
    if (!e.alive) return;
    ctx.fillStyle = e.flash > 0 ? '#FFFFFF' : (st.pal.accent || '#E11D48');
    ctx.beginPath();
    if (st.isSpace) {
      ctx.moveTo(e.x, e.y + e.r); ctx.lineTo(e.x - e.r, e.y - e.r * 0.7); ctx.lineTo(e.x + e.r, e.y - e.r * 0.7); ctx.closePath();
    } else {
      ctx.roundRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, 8);
    }
    ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(e.x - 8, e.y - 6, 5, 5); ctx.fillRect(e.x + 3, e.y - 6, 5, 5);
  });

  if (st.boss.alive) {
    ctx.fillStyle = st.boss.flash > 0 ? '#FFFFFF' : '#B91C1C';
    ctx.beginPath(); ctx.roundRect(st.boss.x - st.boss.r, st.boss.y - st.boss.r, st.boss.r * 2, st.boss.r * 2, 12); ctx.fill();
    ctx.fillStyle = '#F59E0B'; ctx.fillRect(st.boss.x - 18, st.boss.y - st.boss.r - 10, 36 * Math.max(0, st.boss.hp / st.boss.maxHp), 5);
  }

  ctx.save();
  ctx.translate(st.px, st.py);
  if (st.activePow === 'shield') {
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = st.pal.primary || '#10B981';
  if (st.isSpace) {
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-18, 16); ctx.lineTo(18, 16); ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.roundRect(-16, -20, 32, 40, 10); ctx.fill();
    ctx.fillStyle = '#FAF9F6'; ctx.fillRect(st.facing > 0 ? 4 : -10, -10, 6, 6);
  }
  ctx.restore();

  ctx.fillStyle = st.pal.secondary || '#F59E0B';
  st.shots.forEach((s) => { if (s.alive) { ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill(); } });
  ctx.fillStyle = '#EF4444';
  st.eShots.forEach((es) => { if (es.alive) { ctx.beginPath(); ctx.arc(es.x, es.y, 5.5, 0, Math.PI * 2); ctx.fill(); } });

  st.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
  st.popups.forEach((p) => { ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y); });

  ctx.restore();
  ctx.restore();
}
