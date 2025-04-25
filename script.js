const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const player = { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50 };
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let lives = 3;
let enemies = [];
let bullets = [];
let recoveryItems = [];
let playerSpeed = 5;
let backgroundOffset = 0;
let invincibleTimer = 0;
let lastShootTime = 0;
let startX = null;
let enemySpeed = 2;

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function drawText(text, x, y, size = 20, color = 'white', align = 'left') {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? '♥' : '♡', canvas.width - 80 + i * 20, 30, 24, 'pink', 'left');
  }
}

function spawnEnemy() {
  if (Math.random() < 0.02) {
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40,
      height: 40,
      dx: Math.random() > 0.5 ? 2 : -2
    });
  }
}

function spawnRecoveryItem() {
  if (Math.random() < 0.01) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10
  });
}

function autoShoot() {
  if (Date.now() - lastShootTime > 500) {
    shoot();
    lastShootTime = Date.now();
  }
}

function updateEnemySpeed() {
  enemySpeed = 2 + Math.floor(score / 2000);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameStarted) {
    drawText("縦スクロールシューティング", canvas.width / 2, 250, 24, 'white', 'center');
    drawText("画面タップでスタート", canvas.width / 2, 300, 16, 'gray', 'center');
    return;
  }

  if (isGameOver) {
    drawText("GAME OVER", canvas.width / 2, 280, 40, 'red', 'center');
    drawText(`SCORE: ${score}`, canvas.width / 2, 330, 20, 'white', 'center');
    drawText("画面タップでリトライ", canvas.width / 2, 380, 18, 'gray', 'center');
    return;
  }

  updateEnemySpeed();
  autoShoot();

  // 背景スクロール線
  ctx.strokeStyle = '#333';
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  backgroundOffset += 2;

  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

  spawnEnemy();
  enemies.forEach(e => {
    e.y += enemySpeed;
    e.x += e.dx;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 100;
        break;
      }
    }
  }

  if (invincibleTimer <= 0) {
    for (let e of enemies) {
      if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
        lives -= 1;
        invincibleTimer = 60;
        if (lives <= 0) isGameOver = true;
        break;
      }
    }
  } else {
    invincibleTimer--;
  }

  spawnRecoveryItem();
  for (let i = recoveryItems.length - 1; i >= 0; i--) {
    const item = recoveryItems[i];
    item.y += item.speed;
    if (
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y
    ) {
      if (lives < 3) lives++;
      recoveryItems.splice(i, 1);
    }
  }

  drawRect(player, 'white');
  bullets.forEach(b => drawRect(b, 'cyan'));
  enemies.forEach(e => drawRect(e, 'red'));
  recoveryItems.forEach(item => drawRect(item, 'green'));
  drawText(`SCORE: ${score}`, 10, 30);
  drawLives();
}

// タッチでスライド移動
canvas.addEventListener('touchstart', (e) => {
  if (!isGameStarted || isGameOver) {
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    return;
  }
  startX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
  if (startX !== null) {
    let moveX = e.touches[0].clientX;
    let delta = moveX - startX;
    player.x += delta * 0.2;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    startX = moveX;
  }
});

canvas.addEventListener('touchend', () => {
  startX = null;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
