const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 50 };
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let lives = 3;
let enemies = [];
let recoveryItems = [];
let playerSpeed = 10;
let lastSpeedUpScore = 0;
let backgroundOffset = 0;
let invincibleTimer = 0;
let lastShotTime = 0;
let startTime = null;
const gameoverImg = document.getElementById('gameover-img');

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
  if (Math.random() < 0.003) { // 減らしました
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

function shootAuto() {
  const now = Date.now();
  if (now - lastShotTime > 300) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    lastShotTime = now;
  }
}

let bullets = [];

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameStarted) {
    drawText("縦スクロールシューティング", canvas.width / 2, 250, 24, 'white', 'center');
    drawText("タップでスタート", canvas.width / 2, 300, 16, 'gray', 'center');
    return;
  }

  if (isGameOver) {
    drawText("GAME OVER", canvas.width / 2, 280, 40, 'red', 'center');
    drawText(`SCORE: ${score}`, canvas.width / 2, 330, 20, 'white', 'center');
    gameoverImg.style.display = 'block';
    return;
  }

  // 経過時間
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  // 背景スクロール
  ctx.strokeStyle = '#333';
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  backgroundOffset += 2;

  // スピードアップ
  if (score - lastSpeedUpScore >= 2000) {
    playerSpeed += 1;
    lastSpeedUpScore = score;
  }

  // 弾
function shootAuto() {
  const now = Date.now();
  if (now - lastShotTime > 500) {  // 弾の発射間隔を長く
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    lastShotTime = now;
  }
}

  // 敵処理
  spawnEnemy();
  enemies.forEach(e => {
    e.y += 2;
    e.x += e.dx;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  // 弾と敵の当たり判定
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

  // 敵とプレイヤーの衝突
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

  // 回復アイテム処理
function spawnRecoveryItem() {
  if (Math.random() < 0.001) { // 出現確率をさらに減少
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20,
      height: 20,
      speed: 2
    });
  }
}

  // 描画
  drawRect(player, 'white');
  bullets.forEach(b => drawRect(b, 'cyan'));
  enemies.forEach(e => drawRect(e, 'red'));
  recoveryItems.forEach(item => drawRect(item, 'green'));
  drawText(`SCORE: ${score}`, 10, 30);
  drawText(`TIME: ${elapsedTime}s`, 10, 60);
  drawLives();
}

canvas.addEventListener('touchstart', e => {
  if (!isGameStarted || isGameOver) {
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    player.x = canvas.width / 2 - 25;
    gameoverImg.style.display = 'none';
    startTime = Date.now();
  }
});

let lastTouchX = null;
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  if (lastTouchX !== null) {
    const dx = touch.clientX - lastTouchX;
    player.x += dx * 1.5;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  }
  lastTouchX = touch.clientX;
});

canvas.addEventListener('touchend', () => {
  lastTouchX = null;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
