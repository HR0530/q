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
let lastSpeedUpTime = Date.now();
let backgroundOffset = 0;
let invincibleTimer = 0;
let shootInterval;
let startTime = 0;

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
  if (Math.random() < 0.004) { // 減らした
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

function startGame() {
  isGameStarted = true;
  isGameOver = false;
  score = 0;
  lives = 3;
  enemies = [];
  bullets = [];
  recoveryItems = [];
  playerSpeed = 5;
  lastSpeedUpTime = Date.now();
  startTime = Date.now();
  shootInterval = setInterval(shoot, 300); // 0.3秒おきに自動発射
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameStarted) {
    drawText("縦スクロールシューティング", canvas.width / 2, 250, 24, 'white', 'center');
    drawText("タップまたはスペースキーでスタート", canvas.width / 2, 300, 16, 'gray', 'center');
    return;
  }

  if (isGameOver) {
    drawText("GAME OVER", canvas.width / 2, 280, 40, 'red', 'center');
    drawText(`SCORE: ${score}`, canvas.width / 2, 330, 20, 'white', 'center');
    drawText("タップまたはスペースキーでリトライ", canvas.width / 2, 380, 18, 'gray', 'center');
    drawImageOnGameOver(); // ← ゲームオーバー時の画像表示（CSSで下に配置）
    return;
  }

  // スピードアップ
  if (Date.now() - lastSpeedUpTime > 30000) {
    lastSpeedUpTime = Date.now();
    playerSpeed += 1;
  }

  // 背景ライン
  ctx.strokeStyle = '#333';
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  backgroundOffset += 2;

  // 弾
  bullets.forEach(b => b.y -= 5);
  bullets = bullets.filter(b => b.y > 0);

  // 敵
  spawnEnemy();
  enemies.forEach(e => {
    e.y += 2 + Math.floor(score / 2000); // スコアごとにスピード変化
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
      if (
        player.x < e.x + e.width &&
        player.x + player.width > e.x &&
        player.y < e.y + e.height &&
        player.y + player.height > e.y
      ) {
        lives -= 1;
        invincibleTimer = 60;
        if (lives <= 0) {
          isGameOver = true;
          clearInterval(shootInterval); // 自動射撃停止
        }
        break;
      }
    }
  } else {
    invincibleTimer--;
  }

  // 回復アイテム
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

  // 描画
  drawRect(player, 'white');
  bullets.forEach(b => drawRect(b, 'cyan'));
  enemies.forEach(e => drawRect(e, 'red'));
  recoveryItems.forEach(item => drawRect(item, 'green'));

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  drawText(`SCORE: ${score}  TIME: ${elapsedTime}s`, 10, 30);
  drawLives();
}

function drawImageOnGameOver() {
  const img = document.getElementById("gameover-img");
  img.style.display = "block";
}

// タップ開始でスタート・リトライ
canvas.addEventListener('touchstart', () => {
  if (!isGameStarted || isGameOver) {
    startGame();
    const img = document.getElementById("gameover.img");
    img.style.display = "none"; // 再スタートで画像非表示
  }
});

// マウスでも同じように開始できるように
canvas.addEventListener('mousedown', () => {
  if (!isGameStarted || isGameOver) {
    startGame();
    const img = document.getElementById("gameover.img");
    img.style.display = "none";
  }
});

// スライド操作
let lastTouchX = null;
canvas.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    if (lastTouchX !== null) {
      const dx = touch.clientX - lastTouchX;
      player.x += dx;
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }
    lastTouchX = touch.clientX;
  }
});

canvas.addEventListener("touchend", () => {
  lastTouchX = null;
});

// キーボードでのリトライ
document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    if (!isGameStarted || isGameOver) {
      startGame();
      const img = document.getElementById("gameover.img");
      img.style.display = "none";
    }
  }
});

// メインループ
function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
