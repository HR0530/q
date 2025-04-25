const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

const player = { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50 };
let score = 0;
let lives = 3;
let enemies = [];
let bullets = [];
let recoveryItems = [];
let speedMultiplier = 1;
let gameStarted = false;
let gameOver = false;
let invincibleTimer = 0;
let lastShotTime = 0;
let startTime = 0;
let touchStartX = null;

const gameOverImg = document.getElementById("gameoverImage");

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function drawText(text, x, y, size = 20, color = "white", align = "left") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? "♥" : "♡", canvas.width - 80 + i * 20, 30, 24, "pink", "left");
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
  if (Math.random() < 0.001) {
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
  if (now - lastShotTime > 500) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    lastShotTime = now;
  }
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    drawText("縦スクロールシューティング", canvas.width / 2, 250, 24, "white", "center");
    drawText("画面をタップしてスタート", canvas.width / 2, 300, 16, "gray", "center");
    return;
  }

  if (gameOver) {
    drawText("GAME OVER", canvas.width / 2, 280, 40, "red", "center");
    drawText(`SCORE: ${score}`, canvas.width / 2, 330, 20, "white", "center");
    drawText("もう一度タップで再スタート", canvas.width / 2, 380, 18, "gray", "center");
    gameOverImg.style.display = "block";
    return;
  }

  shootAuto();

  // 敵スピード倍率（スコア2000ごと）
  speedMultiplier = 1 + Math.floor(score / 2000);

  // 弾更新
  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

  // 敵生成 & 移動
  spawnEnemy();
  enemies.forEach(e => {
    e.y += 2 * speedMultiplier;
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

  // プレイヤーと敵の当たり判定
  if (invincibleTimer <= 0) {
    for (let e of enemies) {
      if (player.x < e.x + e.width && player.x + player.width > e.x &&
          player.y < e.y + e.height && player.y + player.height > e.y) {
        lives -= 1;
        invincibleTimer = 60;
        if (lives <= 0) {
          gameOver = true;
        }
        break;
      }
    }
  } else {
    invincibleTimer--;
  }

  // 回復アイテム生成 & 移動
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

  // プレイヤー描画
  drawRect(player, "white");

  // 弾・敵・回復描画
  bullets.forEach(b => drawRect(b, "cyan"));
  enemies.forEach(e => drawRect(e, "red"));
  recoveryItems.forEach(item => drawRect(item, "green"));

  // スコアとタイム表示
  drawText(`SCORE: ${score}`, 10, 30);
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  drawText(`TIME: ${elapsed}s`, 10, 60);
  drawLives();
}

function resetGame() {
  score = 0;
  lives = 3;
  enemies = [];
  bullets = [];
  recoveryItems = [];
  invincibleTimer = 0;
  lastShotTime = 0;
  startTime = Date.now();
  gameStarted = true;
  gameOver = false;
  gameOverImg.style.display = "none";
}

canvas.addEventListener("touchstart", e => {
  if (!gameStarted || gameOver) {
    resetGame();
  }
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
  if (e.touches.length > 0 && touchStartX !== null) {
    const deltaX = e.touches[0].clientX - touchStartX;
    player.x += deltaX * 0.2;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    touchStartX = e.touches[0].clientX;
  }
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
