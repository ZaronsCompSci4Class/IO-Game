var framerate = 1000 / 40;
var selfMouseAngle;

function Entity(initPack, imgParam) {
    for (var i in initPack) {
        this[i] = initPack[i];
    }
    this.width = imgParam.width / 2;
    this.height = imgParam.height / 2;

    this.updatePos = function() {
        this.relativeX = this.x - Player.list[selfId].x + canvasWidth / 2;
        this.relativeY = this.y - Player.list[selfId].y + canvasHeight / 2;
    }
}

function Player(initPack) {
    Entity.call(this, initPack, Img.playerSprite);
    this.partTimer = 0;
    ///powerups
    this.bulletFrenzy = false;
    this.oneHitKill = false;
    this.activePwrs = [];
    this.numOfPwrs = 0;
    ///////////////sprite///////////////////
    this.spriteW = Img.playerSprite.width / 4;
    this.spriteH = Img.playerSprite.height / 4;

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
        else
            var imgPicker = Img.playerSprite;

        ctx.drawImage(imgPicker, moveMod * this.spriteW, directionMod * this.spriteH, this.spriteW, this.spriteH, this.relativeX - this.width / 2, this.relativeY - this.height / 2, this.width, this.height);

    }

    this.drawDot = function() {
        if (this.id == selfId)
            var dotPicker = Img.pDot;
        else if (this.isZombie)
            var dotPicker = Img.eDot;
        else
            var dotPicker = Img.fDot;
        ctxMini.drawImage(dotPicker, 0, 0, dotPicker.width, dotPicker.height, ctxMiniX + this.x / 20.48, ctxMiniY + this.y / 20.48, dotPicker.width, dotPicker.height);
    }

    this.drawAttributes = function() {
        //draw health bar
        var hpWidth = 30 * this.hp / this.hpMax;
        ctx.fillStyle = 'green';
        ctx.fillRect(this.relativeX - hpWidth / 2, this.relativeY - 40, hpWidth, 4);
        if (this.id == selfId) {
            if (this.bCounter != 0) {
                ctx.fillStyle = 'green';
                ctx.fillRect(canvasWidth * .98, canvasHeight * .025 + (20 - this.bCounter) * canvasHeight / 21, canvasWidth * .015, this.bCounter * canvasHeight / 21);
                this.partTimer = partTime;
            } else {
                ctx.fillStyle = 'red';
                if (this.bulletFrenzy)
                    ctx.fillRect(canvasWidth * .98, canvasHeight * .975, canvasWidth * .015, -(canvasHeight / 21) * 4 * ((partTime - this.partTimer) * .04) * 2);
                else
                    ctx.fillRect(canvasWidth * .98, canvasHeight * .975, canvasWidth * .015, -(canvasHeight / 21) * 4 * ((partTime - this.partTimer) * .04));
            }

            ////////drawing powerup
            if (this.bulletFrenzy)
                this.activePwrs[0] = true;
            else
                this.activePwrs[0] = false;
            if (this.oneHitKill)
                this.activePwrs[1] = true;
            else
                this.activePwrs[1] = false;

            this.numOfPwrs = 0;
            for (var i in this.activePwrs) {
                if (this.activePwrs[i])
                    this.numOfPwrs++;
            }

            var pwrXMod;
            var pwrYMod;
            if (this.bulletFrenzy) {
                pwrXMod = 0;
                pwrYMod = 0;
            }
            if (this.oneHitKill) {
                pwrXMod = Img.pwrSprite / 3 * 2;
                pwrYMod = Img.pwrSprite / 2;
            }
            if (this.numOfPwrs >= 1) {
                ctx.drawImage(Img.pwrSprite, pwrXMod, pwrYMod, Img.pwrSprite.width / 3, Img.pwrSprite.height / 2, ctxMiniX - (Img.pwrSprite.width / 3) * this.numOfPwrs, ctxMiniY, Img.pwrSprite.width / 3, Img.pwrSprite.height / 2);
                console.log("x " + ctxMiniX - (Img.pwrSprite.width / 3) * this.numOfPwrs);
            }
        }
    }

    Player.list[this.id] = this;


    return this;
}
Player.list = {};

function Bullet(initPack) {
    Entity.call(this, initPack, Img.bullet);
    //starts shake when bullet spawned
    screenShake.start(this.angle);

    this.draw = function() {
        this.updatePos();
        //rotates context to draw bullet correctly
        ctx.translate(this.relativeX - this.width / 2, this.relativeY - this.height / 2);

        ctx.rotate(-this.angle + Math.PI / 2);
        //draws bullet
        ctx.drawImage(Img.bullet, 0, 0);
        //restores old canvas state
        ctx.rotate(this.angle - Math.PI / 2);
        ctx.translate(-this.relativeX + this.width / 2, -this.relativeY + this.height / 2);
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

        ctx.drawImage(Img.obj, 0, 0, Img.obj.width, Img.obj.height, x - this.width / 2, y - this.height / 2, this.width, this.height);
        ctxMini.drawImage(Img.oDot, 0, 0, Img.oDot.width, Img.oDot.height, ctxMiniX + this.x / 20.48, ctxMiniY + this.y / 20.48, Img.oDot.width, Img.oDot.height);
    }

    Objective.list[this.id] = this;
    return this;
}
Objective.list = {};

function Powerup(initPack) {
    Entity.call(this, initPack, Img.pwrSprite);
    this.drawSelf = function() {

        var x = this.x - Player.list[selfId].x + canvasWidth / 2;
        var y = this.y - Player.list[selfId].y + canvasHeight / 2;

        var pwrXMod = 0;
        var pwrYMod = 0;
        if (this.bulletFrenzy) {
            pwrXMod = 0;
            pwrYMod = 0;
        }
        if (this.oneHitKill) {
            pwrXMod = Img.pwrSprite / 3 * 2;
            pwrYMod = Img.pwrSprite / 2;
        }
        ctx.drawImage(Img.pwrSprite, pwrXMod, pwrYMod, this.width / 3, this.height / 2, x - this.width / 3 / 2, y - this.height / 2 / 2, this.width / 3, this.height / 2);

        ctxMini.drawImage(Img.oDot, 0, 0, Img.oDot.width, Img.oDot.height, ctxMiniX + this.x / 20.48, ctxMiniY + this.y / 20.48, Img.oDot.width, Img.oDot.height);
    }

    Powerup.list[this.id] = this;
    return this;
}
Powerup.list = {};



var selfId = null;

socket.on('init', function(data) {
    if (data.selfId)
        selfId = data.selfId;
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
    duration: .1 * framerate, //coefficient = number of seconds
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
    },
    reset: function() {
        if (this.dFromOriginX !== 0 || this.dFromOriginY !== 0) {
            ctx.translate(-this.dFromOriginX, -this.dFromOriginY); //eliminates discrepancy
            this.dFromOriginX = 0, this.dFromOriginY = 0;
        }
    }
}
socket.on('roundInfo', function(data) {
    time = data.timer;
    sectionDuration = data.sectionDuration;
    roundState = data.roundState;
    roundStarted = data.roundStarter;
    sectionTime = data.sectionTime;
});

setInterval(function() {
    if (!selfId)
        return;
    update();
    draw();
    partTime++;
}, 40);

function update() {
    for (var i in Player.list)
        Player.list[i].updatePos();
}

function draw() {
    screenShake.draw();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawMap('floor');
    for (var i in Player.list) {
        if (!Player.list[i].underWallLayer) {
            Player.list[i].drawSelf();
        }
    }
    drawMap('walls');
    drawMiniMap();
    drawScore();
    drawTime();
    for (var i in Player.list) {
        if (Player.list[i].underWallLayer) {
            Player.list[i].drawSelf();
        }
    }
    for (var i in Player.list) {
        Player.list[i].drawDot();
        Player.list[i].drawAttributes();
    }
    for (var i in Objective.list)
        Objective.list[i].drawSelf();
    for (var i in Powerup.list)
        Powerup.list[i].drawSelf();
    for (var i in Bullet.list)
        Bullet.list[i].draw();
}

var drawTime = function() {
    switch (roundState) {
        case 'displayingScores':
            roundInfo = 'Review Scores! ' + (sectionDuration - sectionTime);
            partTime = 0;
            break;
        case 'preparing':
            roundInfo = 'Round starts in ' + (sectionDuration - sectionTime);
            break;
        case 'starting':
            roundInfo = 'Round starting!';
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
    ctx.font = '20px Arial';
    ctx.fillStyle = 'green';
    ctx.fillText(roundInfo, 200, 30);
}

var drawMap = function(part) {
    var player = Player.list[selfId];
    var x = canvasWidth / 2 - player.x;
    var y = canvasHeight / 2 - player.y;
    var map = Img.map[part];
    ctx.drawImage(map, 0, 0, map.width, map.height, x, y, map.width, map.height);
}

var drawMiniMap = function() {
    var map = Img.miniMap;
    ctxMini.drawImage(map, 0, 0, map.width, map.height, ctxMiniX, ctxMiniY, 100, 100);
}

var drawScore = function() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'green';
    ctx.fillText(Player.list[selfId].score, 0, 30);
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
    var x = event.clientX - canvasWidth / 2;
    var y = event.clientY - canvasHeight / 2;
    selfMouseAngle = -Math.atan2(y, x);
    if (selfMouseAngle < 0)
        selfMouseAngle = 2 * Math.PI + selfMouseAngle;
    socket.emit('keyPress', {
        inputId: 'mouseAngle',
        state: selfMouseAngle
    });
}
