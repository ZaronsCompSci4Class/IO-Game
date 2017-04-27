var selfMouseAngle;
var mouseX;
var mouseY;

function Entity(initPack, imgParam) {

    this.setImage = function(imgParam) {
        this.image = imgParam;
        if (this.image.hasOwnProperty("totalSpriteCycles")) {
            this.width = imgParam.width / this.image.totalSpriteCycles;
            this.spriteCycle = 0;
        } else {
            this.width = imgParam.width;
        }
        this.height = imgParam.height;
    }

    this.updatePos = function() {
        this.relativeX = this.x - Player.list[selfId].x + canvasWidth / 2;
        this.relativeY = this.y - Player.list[selfId].y + canvasHeight / 2;
    }

    this.drawDot = function(color) {
        ctxUi.fillStyle = this.getDotColor();
        ctxUi.fillRect(ctxUi.miniX + this.x * ctxUi.miniSize / mapSize, ctxUi.miniY + this.y * ctxUi.miniSize / mapSize,
            ctxUi.dotSize, ctxUi.dotSize);
    }

    this.getCycleMod = function() {
        this.spriteCycle += 1000 / (framerate *  this.spriteCycleDuration);
        if (this.spriteCycle >= this.image.totalSpriteCycles) {
            this.spriteCycle = 0;
        } else {
        }
        return Math.floor(this.spriteCycle) * this.width;
    }

    for (var i in initPack) {
        this[i] = initPack[i];
    }

    this.setImage(imgParam);
}

function Player(initPack) {
    Entity.call(this, initPack, Img.playerSprite);
    this.reload = false;
    this.width = (Img.playerSprite.width / 4);
    this.height = (Img.playerSprite.height / 4);

    this.drawSelf = function() {
        //sets directionMod depending on angle
        var directionMod = 0; //down
        if (this.mouseAngle >= 3 * Math.PI / 4 && this.mouseAngle < 5 * Math.PI / 4) //left
            directionMod = 1;
        else if (this.mouseAngle >= Math.PI / 4 && this.mouseAngle < 3 * Math.PI / 4) //up
            directionMod = 3;
        else if (this.mouseAngle >= 7 * Math.PI / 4 || this.mouseAngle < Math.PI / 4) //right
            directionMod = 2;
        ///sets moveMod depending on how long moving
        var moveMod = Math.floor(this.animCounter) % 4;
        //picks the sprite from sheet based on directionMod and moveMod
        if (this.isZombie)
            var imgPicker = Img.playerSprite2;
        else if (!this.isZombie && this.skins == "reg")
            var imgPicker = Img.playerSprite;
        else if (!this.isZombie && this.skins == "boughtHarambe")
            var imgPicker = Img.harambeSprite;
        else if (!this.isZombie && this.skins == "boughtSkin2")
            var imgPicker = Img.wizSprite;
        else if (!this.isZombie && this.skins == "boughtSkin3")
            var imgPicker = Img.solamancerSprite;
        else if (!this.isZombie && this.skins == "boughtSkin4")
            var imgPicker = Img.germanSprite;
        else if (!this.isZombie && this.skins == "boughtSkin5")
            var imgPicker = Img.barrelSprite;
        else
            var imgPicker = Img.playerSprite;

        ctx.drawImage(imgPicker, moveMod * this.width, directionMod * this.height, this.width, this.height, this.relativeX - this.width / 2, this.relativeY - this.height / 2, this.width, this.height);
        if(this.inWater){
            this.drawWaterEffects(moveMod, directionMod);
        }
    }

    this.drawWaterEffects = function(moveMod, directionMod){
        if(this.isZombie){
            var img = Img.playerSprite2.water;
            ctx.drawImage(img, moveMod * img.width, directionMod * img.height, img.width, img.height,  this.relativeX, this.relativeX, img.width, img.height);
        }else{
            var img = Img.playerSprite.water;
            console.log(img+" "+img.width + " " + img.height + " " + this.relativeX + " " + this.relativeY + " " + directionMod * img.height + " " + moveMod * img.height);
            ctx.drawImage(img, moveMod * img.width, directionMod * img.height, img.width, img.height,  this.relativeX, this.relativeX, img.width, img.height);
        }
    }

    this.getDotColor = function() {
        if (this.id == selfId) {
            var dotColor = "yellow";
        } else if (this.isZombie) {
            var dotColor = "red";
        } else {
            var dotColor = "green";
        }
        return dotColor;
    }

    this.drawName = function() {
        ctxSmooth.fillText(this.name, this.relativeX, this.relativeY - this.height * .75);
        ctxSmooth.fillStyle = "green";
    }

    this.drawAttributes = function() {
        // draw health bar
        var hpWidth = 30 * this.hp / this.hpMax;
        ctx.fillStyle = 'green';
        ctx.fillRect(this.relativeX - hpWidth / 2, this.relativeY - 40, hpWidth, 4);

        this.drawName();

        if (this.id === selfId && !this.isZombie) {
            

            ////////drawing powerup
            this.pwrCounter = 0;
            this.pwrXMod;
            this.pwrYMod;
            for(var i in this.activeMods){
                this.pwrCounter++;
                if(this.activeMods[i] === "bulletFrenzy"){
                    this.pwrXMod = 0;
                    this.pwrYMod = 0;
                }else if(this.activeMods[i] === "oneHitKill"){
                    this.pwrXMod = Img.pwrSprite / 3 * 2;
                    this.pwrYMod = Img.pwrSprite / 2;
                }else if(this.activeMods[i] === "speedBurst"){
                    this.pwrXMod = Img.pwrSprite / 3;
                    this.pwrYMod = Img.pwrSprite / 2;
                }else{
                    console.log("no active mods");
                }
            }
            ///Isn't going wthorugh rin
            while (this.pwrCounter >= 1) {
                ctx.fillRect(this.relativeX - hpWidth / 2-(this.pwrCounter*5), this.relativeY - 60, 4, 4);
                //ctx.drawImage(Img.pwrSprite, this.pwrXMod, this.pwrYMod, 210 / 3, 190 / 2, ctxUi.miniX - (210 / 3) * this.pwrCounter, ctxUi.miniY, 210 / 3, 190 / 2);
                console.log("belly");
                //console.log("x " + ctxMiniX - (Img.pwrSprite.width / 3) * this.numOfPwrs);
            this.pwrCounter--;
            }
        }
    }

    Player.list[this.id] = this;

    return this;
}
Player.list = {};

function Bullet(initPack) {

    Entity.call(this, initPack, Img.bulletSprite);

    this.spriteCycleDuration = 300;

    if (this.parent === selfId) {
        // starts shake when bullet spawned if self shot it
        screenShake.start(this.angle);

        // handle bulletSound triggering
        if(bulletSound.playing){
            bulletSound.snapToStart();
        }else{
            bulletSound.play();
        }
    }

    this.draw = function() {
        this.updatePos();
        //rotates context to draw bullet correctly
        ctx.translate(this.relativeX, this.relativeY);
        ctx.rotate(-this.angle + Math.PI / 2);

        var cycleMod = this.getCycleMod();
        ctx.drawImage(this.image, cycleMod, 0, this.width, this.height, -this.width / 2, -this.height / 2, this.width, this.height);

        //restores old canvas state
        ctx.rotate(this.angle - Math.PI / 2);
        ctx.translate(-this.relativeX, -this.relativeY);
    }

    Bullet.list[this.id] = this;
    return this;
}
Bullet.list = {};
////////////////////////////////////////////////////////////////////////////////
function Objective(initPack) {
    Entity.call(this, initPack, Img.obj);
    this.drawSelf = function() {

        var x = this.x - Player.list[selfId].x + canvasWidth / 2;
        var y = this.y - Player.list[selfId].y + canvasHeight / 2;

        ctx.drawImage(this.image, 0, 0, this.width, this.height, x - this.width / 2, y - this.height / 2, this.width, this.height);
    }

    this.getDotColor = function() {
        return "blue";
    }

    Objective.list[this.id] = this;
    return this;
}
Objective.list = {};

function Powerup(initPack) {
    Entity.call(this, initPack, Img.pwrChestSprite);

    this.spriteCycleDuration = 300;

    this.drawSelf = function() {
        this.updatePos();
        var cycleMod = this.getCycleMod();
        if(!this.pickedUp)
            ctx.drawImage(this.image, cycleMod, 0, this.width, this.height, this.relativeX - this.width / 2, this.relativeY - this.height / 2, this.width, this.height);

    }

    this.getDotColor = function() {
        return "rgb(113, 250, 231)";
    }

    Powerup.list[this.id] = this;
    return this;
}
Powerup.list = {};



var selfId = null;

socket.on('init', function(data) {
    if (data.selfId) {
        selfId = data.selfId;
    }
    if (data.player) {
        for (var i = 0; i < data.player.length; i++) {
            new Player(data.player[i]);
        }
    }
    if (data.bullet) {
        for (var i = 0; i < data.bullet.length; i++) {
            new Bullet(data.bullet[i]);
        }
    }
    if (data.obj) {
        for (var i = 0; i < data.obj.length; i++) {
            new Objective(data.obj[i]);
        }
    }
    if (data.pwr) {
        for (var i = 0; i < data.pwr.length; i++) {
            new Powerup(data.pwr[i]);
        }
    }
});

socket.on('update', function(data) {
    //receives update events from server and updates all client-side entities
    for (var i in data.player) {
        if (Player.list.hasOwnProperty(i)) {
            for (var j in data.player[i]) {
                //this if statement guards against update arriving before init
                Player.list[i][j] = data.player[i][j];
            }
        }
    }
    for (var i in data.bullet) {
        if (Bullet.list.hasOwnProperty(i)) {
            for (var j in data.bullet[i]) {
                Bullet.list[i][j] = data.bullet[i][j];
            }
        }
    }
    for (var i in data.obj) {
        if (Objective.list.hasOwnProperty(i)) {
            for (var j in data.obj[i]) {
                Objective.list[i][j] = data.obj[i][j];
            }
        }
    }
    for (var i in data.pwr) {
        if (Powerup.list.hasOwnProperty(i)) {
            for (var j in data.pwr[i]) {
                Powerup.list[i][j] = data.pwr[i][j];
            }
        }
    }
});

socket.on('remove', function(data) {
    //{player:[12323],bullet:[12323,123123]}
    for (var i = 0; i < data.player.length; i++) {
        delete Player.list[data.player[i]];
    }
    for (var i = 0; i < data.bullet.length; i++) {
        delete Bullet.list[data.bullet[i]];
    }
    for (var i = 0; i < data.obj.length; i++) {
        delete Objective.list[data.obj[i]];
    }
    for (var i = 0; i < data.pwr.length; i++) {
        delete Powerup.list[data.pwr[i]];
    }
});

/////////////////////////listens for time and round data from server
var time = 0;
var partTime = 0;
var roundState;
var sectionDuration = 0;
var sectionTime = 0;
var roundStarted = false;
var screenShake = {
    active: false,
    dx: 0,
    dy: 0,
    speed: 2, //constant speed of shake
    duration: .07 * framerate, //coefficient = number of seconds
    time: this.duration,
    dFromOriginX: 0,
    dFromOriginY: 0, //keeps track of distance from origin
    start: function(theta) {
        this.active = true;
        this.angle = theta;
        this.time = -this.duration;
        this.reset();
    },
    draw: function() {
        if (screenShake.active) {
            if (this.time <= this.duration) {
                this.dx = this.speed * Math.sign(this.time) * Math.cos(this.angle);
                this.dy = this.speed * -Math.sign(this.time) * Math.sin(this.angle);
                ctx.translate(this.dx, this.dy);
                this.dFromOriginX += this.dx;
                this.dFromOriginY += this.dy;
                this.time++;
            } else {
                this.reset();
                this.active = false;

            }

        }
    },
    reset: function() {
        if (this.dFromOriginX !== 0 || this.dFromOriginY !== 0) {
            translateAll(-this.dFromOriginX, -this.dFromOriginY); //eliminates discrepancy
            this.dFromOriginX = 0, this.dFromOriginY = 0;
        }
    }
};
// causes screen to oppose mouse movement
var screenOpposeMouse = {
    lastTotalDisplacementX: 0,
    lastTotalDisplacementY: 0,
    modifier: .1,
    draw: function() {
        var newTotalDisplacementX = this.modifier * mouseX;
        var newTotalDisplacementY = this.modifier * mouseY;
        var dx = this.lastTotalDisplacementX - newTotalDisplacementX;
        var dy = this.lastTotalDisplacementY - newTotalDisplacementY;
        this.lastTotalDisplacementX = newTotalDisplacementX;
        this.lastTotalDisplacementY = newTotalDisplacementY;
        translateAll(dx, dy);
    },
};

function translateAll(dx, dy) {
    ctx.translate(dx, dy);
    ctxSmooth.translate(dx, dy);
}

UI.miniMap.draw = function() {
    ctxUi.drawImage(Img.miniMap, ctxUi.miniX, ctxUi.miniY, ctxUi.miniSize, ctxUi.miniSize);
}

UI.drawTime = function() {
    switch (roundState) {
        case 'displayingScores':
            roundInfo = 'Review Scores! ' + (sectionDuration - sectionTime);
            partTime = 0;
            break;
        case 'preparing':
            roundInfo = 'Round starts in ' + (sectionDuration - sectionTime);
            break;
        case 'started':
            roundInfo = 'Round ends in ' + (sectionDuration - sectionTime);
            break;
        default:
            roundInfo = null;
            break;
    }

    if (roundState !== 'displayingScores') {
        if (ctxDiv.style.display == 'block') {
            ctxDiv.style.display = 'none';
        }
    } else {
        if (ctxDiv.style.display == 'none') {
            var scoresAndNames = "Scores: " + '<br>';
            for (var i in Player.list) {
                scoresAndNames += Player.list[i].name + ': ' + Player.list[i].score + '<br>';
                //ctxDiv.innerHTML += '<br>';
            }
            ctxDiv.innerHTML = '<span style="font-size:40px; text-align:center;">' + scoresAndNames + '</span>';
            ctxDiv.style.display = 'block';
        }
    }
    ctxUi.font = '20px Arial';
    ctxUi.fillStyle = 'green';
    ctxUi.fillText(roundInfo, 200, 30);
}

UI.draw = function() {
    var player = Player.list[selfId];
    // draw reload bar
    if (player.reloading) {
        ctxUi.fillStyle = 'red';
    } else {
        ctxUi.fillStyle = 'green';
    }
    ctxUi.fillRect(canvasWidth * .98, canvasHeight * .025 + (player.ammo.MAX_BULLETS - player.ammo.bullets) * canvasHeight / 21, canvasWidth * .015, player.ammo.bullets / player.ammo.MAX_BULLETS * canvasHeight * .95);

    UI.miniMap.draw();
    UI.drawTime();
}

socket.on('roundInfo', function(data) {
    time = data.timer;
    sectionDuration = data.sectionDuration;
    roundState = data.roundState;
    roundStarted = data.roundStarter;
    sectionTime = data.sectionTime;
});

var drawingObjects = [];

function drawingObjectsCompare(a, b) {
    // draw functions in order of y then x
    if (a.y === b.y) {
        return b.x - a.x;
    } else {
        return b.y - a.y;
    }
}

function drawingObjectsFilter(entity) {
    var distanceX = Math.abs(Player.list[selfId].x - entity.x);
    var distanceY = Math.abs(Player.list[selfId].y - entity.y);
    if (distanceX > canvasWidth || distanceY > canvasHeight) {
        return false;
    } else {
        return true;
    }
}

function update() {
    for (var i in Player.list) {
        Player.list[i].updatePos();
    }
    var entityArr = [];
    for (var i in Player.list) {
        entityArr.push(Player.list[i]);
    }
    drawingObjects = entityArr.filter(drawingObjectsFilter);
    drawingObjects.sort(drawingObjectsCompare);
}

function draw() {
    screenOpposeMouse.draw();
    screenShake.draw();

    // Store the current transformation matrix
    ctx.save();
    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Restore the transform
    ctx.restore();

    ctxUi.clearRect(0, 0, canvasWidth, canvasHeight);
    ctxSmooth.clearRect(0, 0, canvasWidth, canvasHeight);

    drawMap('floor');
    for (var i = 0; i < drawingObjects.length; i++) {
        var entity = drawingObjects[i];
        if (entity instanceof Player) {
            if (entity.underWallLayer) {
                entity.drawSelf();
            }
        }
    }
    drawMap('walls');
    UI.draw();
    drawScore();
    for (var i = 0; i < drawingObjects.length; i++) {
        var entity = drawingObjects[i];
        if (entity instanceof Player) {
            if (!entity.underWallLayer) {
                entity.drawSelf();
            }
        }
    }
    for (var i = 0; i < drawingObjects.length; i++) {
        var entity = drawingObjects[i];
        if (entity instanceof Player) {
            entity.drawAttributes();
        }
    }
    for (var i in Player.list) {
        Player.list[i].drawDot();
    }
    for (var i in Objective.list)
        Objective.list[i].drawSelf();
    for (var i in Powerup.list)
        Powerup.list[i].drawSelf();
    for (var i in Bullet.list) {
        Bullet.list[i].draw();
    }

}

var drawMap = function(part) {
    var player = Player.list[selfId];
    var x = canvasWidth / 2 - player.x;
    var y = canvasHeight / 2 - player.y;
    var map = Img.map[part];
    ctx.drawImage(map, x, y);
}

var drawScore = function() {
    ctxUi.font = '30px Arial';
    ctxUi.fillStyle = 'green';
    ctxUi.fillText(Player.list[selfId].score, 0, 30);
}

document.onkeydown = function(event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
        inputId: 'right',
        state: true
    });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
        inputId: 'down',
        state: true
    });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
        inputId: 'left',
        state: true
    });
    else if (event.keyCode === 87) // w
        socket.emit('keyPress', {
        inputId: 'up',
        state: true
    });
    if (event.keyCode === 82) { // reload r
        socket.emit('keyPress', {
            inputId: 'reload',
        });
    }
    if (event.keyCode === 81) { // queue q
        socket.emit('queue');
    }
    if (event.keyCode === 71) { // queue g
        socket.emit('gtest');
    }
    if (event.keyCode === 77) { // m for minimap *DOES NOT WORK YET*
        if (miniMapHolder.style.display != 'none') {
            miniMapHolder.style.display = 'none';
        } else {
            miniMapHolder.style.display = 'block';
        }
    }
}
document.onkeyup = function(event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
        inputId: 'right',
        state: false
    });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
        inputId: 'down',
        state: false
    });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
        inputId: 'left',
        state: false
    });
    else if (event.keyCode === 87) // w
        socket.emit('keyPress', {
        inputId: 'up',
        state: false
    });
    else if (event.keyCode === 77) { // m
        if (miniMapHolder.style.display != 'none') {
            miniMapHolder.style.display = 'none';
        } else {
            miniMapHolder.style.display = 'block';
        }
    }
}

document.onmousedown = function(event) {
    socket.emit('keyPress', {
        inputId: 'attack',
        state: true
    });
}
document.onmouseup = function(event) {
    socket.emit('keyPress', {
        inputId: 'attack',
        state: false
    });
}
document.onmousemove = function(event) {
    mouseX = event.clientX - window.innerWidth / 2;
    mouseY = event.clientY - window.innerHeight / 2;
    selfMouseAngle = -Math.atan2(mouseY, mouseX);
    if (selfMouseAngle < 0) {
        selfMouseAngle = 2 * Math.PI + selfMouseAngle;
    }
    socket.emit('keyPress', {
        inputId: 'mouseAngle',
        state: selfMouseAngle
    });
}

var onIntroScreen = true;
setUpIntroSprites();
function gameFunc() {
    // if connection made, run game loop, otherwise, do introAnimation
    if(onIntroScreen){
        onIntroScreen = introAnimation();
    }else{
        update();
        draw();
        partTime++;
    }
}
var intervalId = setInterval(gameFunc, 1000 / framerate);
