const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const gravity = 0.5;
const jumpPower = -9;
const pipeSpeed = 2.5;
const pipeWidth = 60;
const pipeGap = 150;
const pipeInterval = 120;

let bird = { x: 80, y: H / 2, r: 18, vy: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let best = 0;
let spawnCount = 0;
let powerActive = false;
let powerTimer = 0;
let bossActive = false;
let bossDefeated = false;
let bossThrows = [];
let bossThrowTimer = 0;
let bossThrowInterval = 70;
let bossDodged = 0;
const bossTargetDodges = 5;
let gameOver = true;

function reset() {
  bird = { x: 80, y: H / 2, r: 18, vy: 0 };
  pipes = [];
  frame = 0;
  score = 0;
  spawnCount = 0;
  powerActive = false;
  powerTimer = 0;
  bossActive = false;
  bossDefeated = false;
  bossThrows = [];
  bossThrowTimer = 0;
  bossDodged = 0;
  gameOver = false;
}

function spawnPipe() {
  const topHeight = 80 + Math.random() * (H - pipeGap - 180);
  const hasPower = (spawnCount + 1) % 8 === 0;
  pipes.push({
    x: W,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false,
    powerUp: hasPower,
    powerTaken: false
  });
  spawnCount += 1;
}

function startBossFight() {
  bossActive = true;
  bossThrows = [];
  bossThrowTimer = 0;
  bossDodged = 0;
  pipes = [];
}

function spawnBossThrow() {
  const bossX = W - 100;
  const bossY = 120;
  const angle = Math.atan2(bird.y - bossY, bird.x - bossX);
  bossThrows.push({ x: bossX, y: bossY, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, r: 10 });
}

function drawBoss() {
  const bossX = W - 120;
  const bossY = 120;
  ctx.fillStyle = '#d64f4f';
  ctx.fillRect(bossX - 50, bossY - 40, 100, 80);

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(bossX - 46, bossY - 30, 92, 20);
  ctx.fillStyle = '#000';
  ctx.font = '16px Arial';
  ctx.fillText('TRUMP', bossX - 30, bossY - 16);

  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(bossX, bossY + 20, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(bossX - 9, bossY + 12, 4, 0, Math.PI * 2);
  ctx.arc(bossX + 9, bossY + 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(bossX, bossY + 28, 10, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
}

function drawBossProjectile(projectile) {
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, projectile.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8b400';
  ctx.fillRect(projectile.x - 4, projectile.y - 14, 8, 12);
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawBird(x, y, r) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.2, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.2, -r * 0.2, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.35, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  if (powerActive) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.85)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCloud(x, y, scale = 1) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 42 * scale, y, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y + 8 * scale, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawCityBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, H);
  skyGradient.addColorStop(0, '#70c5ce');
  skyGradient.addColorStop(0.5, '#88d9e6');
  skyGradient.addColorStop(1, '#c4e7f1');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, W, H);

  drawCloud(70, 90, 1.1);
  drawCloud(240, 70, 0.85);
  drawCloud(320, 130, 0.8);

  const buildings = [
    { x: 0, width: 70, height: 140, color: '#4a5568' },
    { x: 80, width: 50, height: 180, color: '#334155' },
    { x: 140, width: 60, height: 120, color: '#475569' },
    { x: 210, width: 80, height: 220, color: '#2f4858' },
    { x: 305, width: 55, height: 160, color: '#384a5b' },
    { x: 370, width: 50, height: 200, color: '#2c3a47' }
  ];

  buildings.forEach(building => {
    const top = H - 80 - building.height;
    drawRect(building.x, top, building.width, building.height, building.color);

    ctx.fillStyle = 'rgba(255, 235, 179, 0.8)';
    for (let y = top + 20; y < H - 90; y += 28) {
      for (let x = building.x + 10; x < building.x + building.width - 10; x += 20) {
        ctx.fillRect(x, y, 10, 14);
      }
    }
  });

  drawRect(0, H - 80, W, 80, '#3e515f');
  drawRect(0, H - 80, W, 12, '#1f2937');
}

function drawBuildingPipe(x, top, bottom) {
  const buildingBase = '#3c4b5a';
  const buildingShade = '#2a3744';
  const windowOn = '#f9e66c';
  const windowOff = '#111923';

  drawRect(x, 0, pipeWidth, top, buildingBase);
  drawRect(x, 0, pipeWidth, Math.min(18, top), buildingShade);
  for (let yy = 20; yy < top - 20; yy += 28) {
    for (let xx = x + 10; xx < x + pipeWidth - 10; xx += 18) {
      drawRect(xx, yy, 12, 16, Math.random() > 0.4 ? windowOn : windowOff);
    }
  }

  drawRect(x, top - 6, pipeWidth, 6, '#f6bd60');
  drawRect(x, bottom, pipeWidth, 6, '#f6bd60');

  drawRect(x, bottom + 6, pipeWidth, H - 80 - bottom - 6, buildingBase);
  drawRect(x, bottom + 6, pipeWidth, Math.min(18, H - 80 - bottom - 6), buildingShade);
  for (let yy = bottom + 28; yy < H - 90; yy += 28) {
    for (let xx = x + 10; xx < x + pipeWidth - 10; xx += 18) {
      drawRect(xx, yy, 12, 16, Math.random() > 0.4 ? windowOn : windowOff);
    }
  }
}

function drawPowerUp(pipe) {
  const cx = pipe.x + pipeWidth / 2;
  const cy = pipe.top + pipeGap / 2;
  const size = 12;
  ctx.fillStyle = '#f8b400';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = i * (Math.PI * 2 / 5) - Math.PI / 2;
    const outerX = cx + Math.cos(angle) * size;
    const outerY = cy + Math.sin(angle) * size;
    const innerAngle = angle + Math.PI / 5;
    const innerX = cx + Math.cos(innerAngle) * (size * 0.45);
    const innerY = cy + Math.sin(innerAngle) * (size * 0.45);
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawText(text, x, y, size = '24px', color = '#fff') {
  ctx.fillStyle = color;
  ctx.font = `${size} Arial`;
  ctx.fillText(text, x, y);
}

function collides(pipe) {
  const insideX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipeWidth;
  const hitsTop = bird.y - bird.r < pipe.top;
  const hitsBottom = bird.y + bird.r > pipe.bottom;
  return insideX && (hitsTop || hitsBottom);
}

function update() {
  if (gameOver) {
    return;
  }

  bird.vy += gravity;
  bird.y += bird.vy;

  if (bird.y + bird.r > H - 80) {
    bird.y = H - 80 - bird.r;
    gameOver = true;
  }

  if (bird.y - bird.r < 0) {
    bird.y = bird.r;
    bird.vy = 0;
  }

  if (!bossActive && score >= 10 && !bossDefeated) {
    startBossFight();
  }

  if (!bossActive) {
    if (frame % pipeInterval === 0) {
      spawnPipe();
    }
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    if (pipe.powerUp && !pipe.powerTaken) {
      const powerX = pipe.x + pipeWidth / 2;
      const powerY = pipe.top + pipeGap / 2;
      const dx = bird.x - powerX;
      const dy = bird.y - powerY;
      if (Math.sqrt(dx * dx + dy * dy) < bird.r + 14) {
        pipe.powerTaken = true;
        powerActive = true;
        powerTimer = 180;
      }
    }

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      score += 1;
      if (score > best) {
        best = score;
      }
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  if (powerActive) {
    powerTimer -= 1;
    if (powerTimer <= 0) {
      powerActive = false;
    }
  }

  if (bossActive) {
    bossThrowTimer -= 1;
    if (bossThrowTimer <= 0) {
      spawnBossThrow();
      bossThrowTimer = bossThrowInterval;
    }

    bossThrows.forEach(projectile => {
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;
      const dx = bird.x - projectile.x;
      const dy = bird.y - projectile.y;
      if (Math.sqrt(dx * dx + dy * dy) < bird.r + projectile.r) {
        gameOver = true;
      }
    });

    const activeThrows = [];
    bossThrows.forEach(projectile => {
      if (projectile.x < -20 || projectile.y < -20 || projectile.y > H + 20) {
        bossDodged += 1;
      } else {
        activeThrows.push(projectile);
      }
    });
    bossThrows = activeThrows;

    if (bossDodged >= bossTargetDodges) {
      bossActive = false;
      bossDefeated = true;
      bossThrows = [];
    }
  } else if (!powerActive && pipes.some(collides)) {
    gameOver = true;
  }
}

function render() {
  drawCityBackground();
  drawBird(bird.x, bird.y, bird.r);

  pipes.forEach(pipe => {
    drawBuildingPipe(pipe.x, pipe.top, pipe.bottom);
    if (pipe.powerUp && !pipe.powerTaken) {
      drawPowerUp(pipe);
    }
  });

  if (bossActive) {
    drawBoss();
    bossThrows.forEach(drawBossProjectile);
    drawText(`Dodge: ${bossDodged}/${bossTargetDodges}`, 20, 100, '18px', '#ffec99');
    drawText('TRUMP FIGHT!', 20, 130, '18px', '#ff6666');
  }

  drawText(`Score: ${score}`, 20, 40);
  drawText(`Best: ${best}`, 20, 70, '18px');
  if (powerActive) {
    drawText('Power-up active!', 20, 100, '18px', '#ffec99');
  }

  if (gameOver) {
    drawText('Press Space or Click to play', 20, H / 2 - 20, '20px', '#000');
    drawText('Tap and avoid pipes!', 20, H / 2 + 15, '18px', '#000');
  }
}

function loop() {
  update();
  render();
  frame += 1;
  requestAnimationFrame(loop);
}

function jump() {
  if (gameOver) {
    reset();
  }
  bird.vy = jumpPower;
}

window.addEventListener('keydown', event => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
  }
});

canvas.addEventListener('mousedown', jump);
canvas.addEventListener('touchstart', event => {
  event.preventDefault();
  jump();
}, { passive: false });

loop();
