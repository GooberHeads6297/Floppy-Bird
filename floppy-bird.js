const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to fill the entire window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
// Load images for animation and game elements
const birdImgs = [new Image(), new Image(), new Image()];
birdImgs[0].src = 'images/bird1.png';
birdImgs[1].src = 'images/bird2.png';
birdImgs[2].src = 'images/bird3.png';

const pipeImg = new Image();
pipeImg.src = 'images/pipe.png';

const backgroundImg = new Image();
backgroundImg.src = 'images/background.png';

const groundImg = new Image();
groundImg.src = 'images/ground.png';

// Load the new icon and button images
const iconImg = new Image();
iconImg.src = 'images/icon1.png';

const buttonUnpressedImg = new Image();
buttonUnpressedImg.src = 'images/ButtonUnpressed.png';

const buttonPressedImg = new Image();
buttonPressedImg.src = 'images/ButtonPressed.png';

// Load menu logo
const menuLogoImg = new Image();
menuLogoImg.src = 'images/MenuLogo.png';

// Track if images are loaded
let imagesLoaded = 0;
const totalImages = 8;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop(); // Start game loop only when all images are loaded
    }
}

// Set image loading events for all sprites
birdImgs.forEach(img => img.onload = checkAllImagesLoaded);
pipeImg.onload = checkAllImagesLoaded;
backgroundImg.onload = checkAllImagesLoaded;
groundImg.onload = checkAllImagesLoaded;
iconImg.onload = checkAllImagesLoaded;
buttonUnpressedImg.onload = checkAllImagesLoaded;
buttonPressedImg.onload = checkAllImagesLoaded;
menuLogoImg.onload = checkAllImagesLoaded;

// Bird properties
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    gravity: 0.25,
    lift: -5,
    velocity: 0,
    animationIndex: 0,
    animationSpeed: 10,
    frameCount: 0
};

// Pipe properties
const pipes = [];
const pipeWidth = 70;
const pipeGap = 150;
const pipeSpeed = 1.5;
const pipeSpawnInterval = 3000;
let lastPipeSpawn = Date.now();
const initialPipeOffset = 150;
const horizontalPipeGap = 400;
let previousPipeHeight = canvas.height / 2;

// Ground properties
const ground = {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50,
    speed: 1,
};

// Background properties
let backgroundOffset = 0;
const backgroundSpeed = 0.2;

// Game state
let gameStarted = false;
let canJump = true;
const jumpCooldown = 100;

// Draw functions
function drawBird() {
    bird.frameCount++;
    if (bird.frameCount >= bird.animationSpeed) {
        bird.animationIndex = (bird.animationIndex + 1) % birdImgs.length;
        bird.frameCount = 0;
    }
    const currentBirdImg = birdImgs[bird.animationIndex];
    ctx.drawImage(currentBirdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.save();
        ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
        ctx.restore();

        ctx.drawImage(pipeImg, pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height - pipe.topHeight - pipeGap);
    });
}

function drawBackground() {
    ctx.drawImage(backgroundImg, -backgroundOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, canvas.width - backgroundOffset, 0, canvas.width, canvas.height);
}

function drawGround() {
    ctx.drawImage(groundImg, ground.x, ground.y, ground.width, ground.height);
    ctx.drawImage(groundImg, ground.x + ground.width, ground.y, ground.width, ground.height);
}

// Draw the new icon and button
function drawIcon() {
    if (!gameStarted) {
        const iconX = bird.x + bird.width + 20;
        const iconY = bird.y + (bird.height - 40) / 2;
        ctx.drawImage(iconImg, iconX, iconY, 40, 40);

        const buttonX = iconX;
        const buttonY = iconY + 50;
        const currentButtonImg = Math.floor(Date.now() / 500) % 2 === 0 ? buttonUnpressedImg : buttonPressedImg;
        ctx.drawImage(currentButtonImg, buttonX, buttonY, 60, 30);
    }
}

// Draw the menu logo
function drawMenuLogo() {
    if (!gameStarted) {
        const logoX = (canvas.width - 200) / 2;
        const logoY = 30;
        ctx.drawImage(menuLogoImg, logoX, logoY, 200, 100);
    }
}

// Update functions
function updateBird() {
    if (gameStarted) {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        if (bird.y + bird.height > ground.y) {
            bird.y = ground.y - bird.height;
            bird.velocity = 0;
        } else if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
    }
}

function updatePipes() {
    if (gameStarted) {
        pipes.forEach(pipe => {
            pipe.x -= pipeSpeed;
        });

        if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
            pipes.shift();
        }

        if (Date.now() - lastPipeSpawn > pipeSpawnInterval) {
            const maxChange = 90;
            const newTopHeight = previousPipeHeight + (Math.random() * maxChange * 2 - maxChange);
            const clampedHeight = Math.max(50, Math.min(newTopHeight, canvas.height - pipeGap - 100));

            // Spawn pipes farther back
            pipes.push({ x: canvas.width + initialPipeOffset + canvas.width * 0.5, topHeight: clampedHeight });
            previousPipeHeight = clampedHeight;

            lastPipeSpawn = Date.now();
        }

        if (pipes.length > 1) {
            pipes[pipes.length - 1].x = pipes[pipes.length - 2].x + horizontalPipeGap;
        }
    }
}

function updateGround() {
    ground.x -= ground.speed;

    if (ground.x <= -ground.width) {
        ground.x = 0;
    }
}

function updateBackground() {
    backgroundOffset += backgroundSpeed;
    if (backgroundOffset >= canvas.width) {
        backgroundOffset = 0;
    }
}

function detectCollisions() {
    if (gameStarted) {
        pipes.forEach(pipe => {
            if (
                bird.x < pipe.x + pipeWidth &&
                bird.x + bird.width > pipe.x &&
                (bird.y < pipe.topHeight || bird.y + bird.height > pipe.topHeight + pipeGap)
            ) {
                resetGame();
            }
        });

        if (bird.y + bird.height >= ground.y) {
            resetGame();
        }
    }
}

// Function to reset the game state
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    lastPipeSpawn = Date.now();
    previousPipeHeight = canvas.height / 2;
    gameStarted = false;
}

//game loop
let lastTime = 0;
const targetFrameTime = 1000 / 60; // Lock to 60 FPS


function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / targetFrameTime; // Normalize deltaTime to 1 at 60 FPS
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPipes();
    drawGround();
    drawBird();
    drawIcon();
    drawMenuLogo();
    
    updateBird(deltaTime);
    updatePipes(deltaTime);
    updateGround(deltaTime);
    updateBackground(deltaTime);
    detectCollisions();

    requestAnimationFrame(gameLoop);
}


// Jump control for both keyboard and touch events
function jump() {
    if (!gameStarted) {
        gameStarted = true;
    }
    bird.velocity = bird.lift;
    canJump = false;
    setTimeout(() => canJump = true, jumpCooldown);
}

// Add keyboard event listener for jump (Space key)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && canJump) {
        jump();
    }
});

// Add touch event listener for mobile (touch anywhere on the screen to jump)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Prevents scrolling and zooming on mobile
    if (canJump) {
        jump();
    }
});

// Initialize and start game loop
resizeCanvas();
requestAnimationFrame(gameLoop);
