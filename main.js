const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

const gameOverImage = document.getElementById("gameOverImage");

const player = { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50 };
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let lives = 3;
let enemies = [];
let bullets = [];
let recoveryItems = [];
let playerSpeed = 5;
let lastSpeedUpTime = Date.now();
let backgroundOffset = 0;
let invincibleTimer = 0;

let touchStartX = null;

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
  if (Math.random() < 0.002) { // 回復出現率を低く
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

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameStarted) {
    drawText("縦スクロールシューティング", canvas.width / 2, 250, 24, 'white', 'center');
    drawText("画面をタップしてスタート", canvas.width / 2, 300, 16, 'gray', 'center');
    return;
  }

  if (isGameOver) {
    drawText("GAME OVER", canvas.width / 2, 230, 40, 'red', 'center');
    drawText(`SCORE: ${score}`, canvas.width / 2, 280, 20, 'white', 'center');
    drawText("タップでリトライ", canvas.width / 2, 330, 18, 'gray', 'center');
    gameOverImage.style.display = "block";
    return;
  }

  // スピードアップ処理
  if (Date.now() - lastSpeedUpTime > 30000) {
    lastSpeedUpTime = Date.now();
    playerSpeed += 1;
  }

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

  // 弾処理
  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

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
        if (lives <= 0) {
          isGameOver = true;
        }
        break;
      }
    }
  } else {
    invincibleTimer--;
  }

  // 回復処理
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

// タップでスタート・リトライ・発射
canvas.addEventListener("touchstart", (e) => {
  if (!isGameStarted || isGameOver) {
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    recoveryItems = [];
    playerSpeed = 5;
    gameOverImage.style.display = "none";
  } else {
    shoot(); // タップ時に弾発射
  }
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  if (touchStartX === null) return;
  const deltaX = e.touches[0].clientX - touchStartX;
  player.x += deltaX * 0.5; // モーションを速く
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  touchStartX = e.touches[0].clientX;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
