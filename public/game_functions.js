var canvas, ctx, 
width = 1880, height = 910, 
right = false, left = false, up = false, down = false, 
player, player_x = 100, player_y = 100, player_w = 50, player_h = 50, 
obstacle_x = 300, obstacle_y = 300, obstacle_w = 100, obstacle_h = 100, 
bulletTotal = 5, bullets = [];

function init(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    setInterval(gameLoop, 20);
   
    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
}

function gameLoop(){
    clearCanvas();
    moveBullet();
    drawObstacle();
    drawPlayer();
    drawBullet();
}

function clearCanvas(){
    ctx.clearRect(0,0,width,height);
}

function drawPlayer(){
    if(right){
        if(!collisionDetect()){
            player_x += 10;
        }
        if(collisionDetect()){
            player_x -= 10;
        }
    }
    else if(left){
        if(!collisionDetect()){
            player_x -= 10;
        }
        if(collisionDetect()){
            player_x += 10;
        }
    }
    if(up){
        if(!collisionDetect()){
            player_y -= 10;
        }
        if(collisionDetect()){
            player_y += 10;
        }
    }
    else if(down){
        if(!collisionDetect()){
            player_y += 10;
        }
        if(collisionDetect()){
            player_y -=10;
        }
    }

    if(player_x <= 0){
        player_x = 0;
    }
    if(player_y <= 0){
        player_y = 0;
    }
    if((player_x + player_w) >= width){
        player_x = width - player_w;
    }
    if((player_y + player_h) >= height){
        player_y = height - player_h;
    }

    var playerSprite = new Image();
    playerSprite.src = "sprites/testBlue.png";
    ctx.drawImage(playerSprite, player_x, player_y, player_w, player_h);
}

function drawBullet(){
    if(bullets.length){
        for(var i = 0; i < bullets.length; i++){
            var bulletSprite = new Image();
            if(bullets[i].speedX < 0){
                bulletSprite.src = "sprites/testBulletLeft.png";
            }
            if(bullets[i].speedX > 0){
                bulletSprite.src = "sprites/testBulletRight.png";
            }
            if(bullets[i].speedY < 0){
                bulletSprite.src = "sprites/testBulletUp.png";
            }
            if(bullets[i].speedY > 0){
                bulletSprite.src = "sprites/testBulletDown.png";
            }
            ctx.drawImage(bulletSprite, bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
        }
    }
}

function moveBullet(){
    for(var i = 0; i < bullets.length; i++){
        bullets[i].x += bullets[i].speedX;
        bullets[i].y += bullets[i].speedY;
        if(bullets[i].x < 0 || bullets[i].x > width || bullets[i].y < 0 || bullets[i].y > height){
            bullets.splice(i, 1);
        }
    }
}

function drawObstacle(){
    ctx.fillStyle = 'purple';
    ctx.fillRect(obstacle_x, obstacle_y, obstacle_w, obstacle_h);
    ctx.fillStyle = 'black';
    ctx.font = "bold 16px Times New Roman";
    ctx.fillText("Test Obstacle", obstacle_x + 5, obstacle_y + obstacle_h/2);
}

function collisionDetect(){
    var crash = true;
    if((player_y > (obstacle_y + obstacle_h)) || ((player_y + player_h) < obstacle_y) || ((player_x + player_w) < obstacle_x) || (player_x > (obstacle_x + obstacle_w))){
        crash = false;
    }
    return crash;
}


function keyDown(evt){
    if(evt.keyCode == 39) {right = true;}
    else if(evt.keyCode == 37) {left = true;}
    if(evt.keyCode == 38) {up = true;}
    else if(evt.keyCode == 40) {down = true;}

    if((evt.keyCode == 32) && bullets.length <= bulletTotal){

        var b = {
            x: player_x + player_w/2,
            y: player_y + player_h/2,
            speedX: 0,
            speedY: 0,
            width: 30,
            height: 30
        };
        
        if(up){
            b.speedY -= 20;
            b.width = 10;
        }
        else if(down){
            b.speedY += 20;
            b.width = 10;
        }
        else if(left) {
            b.speedX -= 20;
            b.height = 10;
        }
        else if(right || (b.speedX === 0 && b.speedY === 0)){
            b.speedX += 20;
            b.height = 10;
        }
        bullets.push(b);
    }
}

function keyUp(evt){
    if(evt.keyCode == 39) {right = false;}
    else if(evt.keyCode == 37) {left = false;}
    if(evt.keyCode == 38) {up = false;}
    else if(evt.keyCode == 40) {down = false;}
}

init();