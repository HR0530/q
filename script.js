const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 60,
  width: 30,
  height: 30,
  color: 'white'
};

let bullets = [];
let enemies = [];
let heals = [];
let score = 0;
let lives = 3;
let startTime = Date.now();
let gameOver = false;
let bulletInterval = 0;

const gameoverImage = document.getElementById('gameoverImage');
const gameoverText = document.getElementById('gameoverText');
const finalScoreText = document.getElementById('finalScore');

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
  ctx.fillStyle = 'white';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawEnemies() {
  ctx.fillStyle = 'red';
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

function drawHeals() {
  ctx.fillStyle = 'green';
  heals.forEach(heal => {
    ctx.fillRect(heal.x, heal.y, heal.width, heal.height);
  });
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 30);

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  ctx.fillText(`Time: ${elapsedTime}s`, 10, 60);
}

function drawLives() {
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = 'pink';
    ctx.beginPath();
    ctx.arc(canvas.width - 20 - i * 30, 25, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function moveBullets() {
  bullets.forEach(bullet => bullet.y -= 10);
  bullets = bullets.filter(bullet => bullet.y + bullet.height > 0);
}

function moveEnemies() {
  const speed = 2 + Math.floor(score / 2000);
  enemies.forEach(enemy => enemy.y += speed);
  enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

function moveHeals() {
  heals.forEach(heal => heal.y += 2);
  heals = heals.filter(heal => heal.y < canvas.height);
}

function checkCollisions() {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (isColliding(bullet, enemy)) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        score += 100;
      }
    });
  });

  enemies.forEach((enemy, eIndex) => {
    if (isColliding(enemy, player)) {
      enemies.splice(eIndex, 1);
      lives--;
      if (lives <= 0) endGame();
    }
  });

  heals.forEach((heal, hIndex) => {
    if (isColliding(heal, player)) {
      heals.splice(hIndex, 1);
      lives++;
    }
  });
}

function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 30);
  enemies.push({ x, y: -30, width: 30, height: 30 });
}

function spawnHeal() {
  if (Math.random() < 0.003) {
    const x = Math.random() * (canvas.width - 20);
    heals.push({ x, y: -20, width: 20, height: 20 });
  }
}

function shootBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 20
  });
}

let lastEnemyTime = 0;
function updateGame(timestamp) {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawBullets();
  drawEnemies();
  drawHeals();
  drawScore();
  drawLives();

  moveBullets();
  moveEnemies();
  moveHeals();
  checkCollisions();

  if (timestamp - lastEnemyTime > 1000) {
    spawnEnemy();
    spawnHeal();
    lastEnemyTime = timestamp;
  }

  bulletInterval++;
  if (bulletInterval % 15 === 0) {
    shootBullet();
  }

  requestAnimationFrame(updateGame);
}

function endGame() {
  gameOver = true;
  gameoverImage.style.display = 'block';
  gameoverText.style.display = 'block';
  finalScoreText.textContent = `Final Score: ${score}`;
}

let touchStartX = null;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0 && touchStartX !== null) {
    const dx = (e.touches[0].clientX - touchStartX) * 1.5;
    player.x += dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    touchStartX = e.touches[0].clientX;
  }
});

let isDragging = false;
canvas.addEventListener('mousedown', () => { isDragging = true; });
canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  }
});
canvas.addEventListener('mouseup', () => { isDragging = false; });

requestAnimationFrame(updateGame);
