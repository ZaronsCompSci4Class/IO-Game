var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

//gets collision map and reads it into collisionText String
var fs = require("fs");
var collisionText = fs.readFileSync(__dirname + '/bin/collisionMap.txt', "utf-8");

var SOCKET_LIST = {};
//Player img width and height
var PimgW = 18 / 2;
var PimgH = 20 / 2;
var mapWidth = 2048;
var mapHeight = 2048;
const pixelsPerCU = 16;

var objectiveSpawnList = [];

init();

function init() {
    var j = 0;
    for(var i = 0; i < collisionText.length; i++){
        if(collisionText.charAt(i) == '2'){
            objectiveSpawnList[j] = [];
            objectiveSpawnList[j][0] = (i % 128) * 16;
            objectiveSpawnList[j][1] = Math.floor(i / 128) * 16;
            j++;
        }
    }
}

function Entity(param) {
    //detects if there is a collision with any player and only spawns when there is no collision
    this.init = function() {
        //declares all the this variables for all entities
        if (param) {
            if (param.x)
                this.x = param.x;
            if (param.y)
                this.y = param.y;
            if (param.map)
                this.map = param.map;
            if (param.id)
                this.id = param.id;
        }
    }

    this.updatePosition = function() {
        this.x += this.spdX;
        this.y += this.spdY;
    }
    this.getDistance = function(pt) {
        return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
    }

    //method that checks for all collisions, returns boolean
    this.checkForCollision = function(x, y) {
        //checks for collisions with map borders
        if (x < 0 || x + PimgW > mapWidth || y < 0 || y + PimgH > mapHeight)
            return true;

        //checks within map array at each of the four corners
        //checks right side
        if (this.getCollisionWithMap(x - PimgW, y + PimgH) || this.getCollisionWithMap(x - PimgW, y + PimgH * 2)) {
            return true;
        } else if (this.getCollisionWithMap(x + PimgW, y + PimgH) || this.getCollisionWithMap(x + PimgW, y + PimgH * 2)) {
            return true;
        } else if (this.getCollisionWithMap(x, y + PimgH) || this.getCollisionWithMap(x, y + PimgH * 2)) {
            return true;
        }

        //checks for collisions against other players
        for (var i in Player.list) {
            var p = Player.list[i];
            if (x - PimgW < p.x + PimgW && x + PimgW > p.x - PimgW && y - PimgH < p.y + PimgH && y + PimgH > p.y - PimgH && Player.list[this.id] != Player.list[i]) {
                if (p.isZombie || this.isZombie) {
                    p.isZombie = true;
                    this.isZombie = true;
                }
                return true;
            }
        }
        return false;
    }

    this.getCollisionWithMap = function(x, y) {
        //gets collision index with map collisionText
        var xCU = Math.floor(x / pixelsPerCU);
        var yCU = Math.floor(y / pixelsPerCU);
        var index = yCU * 128 + xCU;
        if (collisionText.charAt(index) === "1" || collisionText.charAt(index) === "3")
            return true;
        else
            return false;
    }

    this.isAboveWall = function() {
        if (this.getCollisionWithMap(this.x - PimgW, this.y - PimgH - 5, "2") || this.getCollisionWithMap(this.x + PimgW, this.y - PimgH - 5, "2") || this.getCollisionWithMap(this.x - PimgW, this.y, "2") || this.getCollisionWithMap(this.x + PimgW, this.y, "2") || this.getCollisionWithMap(this.x, this.y - PimgH - 5, "2")) {
            return true;
        }
        return false;
    }
    return this;
}

var Player = function(param) {
    var self = new Entity(param);
    self.init();
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;
    self.animCounter = 1; //1 is the starting frame for this sprite//0 and 2
    self.isZombie = roundStarted;
    self.name = NAMES_LIST[counter];
    self.skins = "reg";
    self.bCounter = 20;
    self.reloadTime = 5;
    self.timeBetweenBullets = 25/6.25; //.25 seconds calculated by taking 25 fps / 6.25 = 4 so its 1/4 of a second
    self.partTimer = 0;
    self.timer = 0;
    self.hasMag = true;////////////ammo in a clip
    self.hasAmmo = true;/////////////havent used/ limits total ammo
    //randomly generated spawn.
    do {
        self.x = ((mapWidth - 100) - 100 + 1) * Math.random() + 100;
        self.y = ((mapHeight - 100) - 100 + 1) * Math.random() + 100;
    } while (self.checkForCollision(self.x, self.y));

    self.update = function() {
        self.updateSpd();
        self.updatePosition();

        //shots if mouse if pressed and round has started and reload time //***********remember to add only shoot at the start of the round
        if (self.pressingAttack && !self.isZombie ){
            if(self.partTimer == 0){
                self.partTimer = partTime;
            }
            if(self.hasMag && self.hasAmmo && partTime - self.partTimer >= self.timeBetweenBullets) {
                self.bCounter--;
                self.partTimer = 0;
                self.shootBullet(self.mouseAngle);
                if(self.bCounter == 0){
                    self.hasMag = false;
                    self.timer = time;
                }
            }
        }else if(self.timer != 0 && self.bCounter == 0 &&time - self.timer >= self.reloadTime ){
                self.hasMag = true;
                self.bCounter = 20;
                self.timer = 0;
            }
    }
    self.shootBullet = function(angle) {
        Bullet({
            parent: self.id,
            angle: angle,
            x: self.x,
            y: self.y,
        });
    }

    self.updateSpd = function() {
        if (self.pressingRight && self.pressingLeft)
            self.spdX = 0;
        else if (self.pressingRight && !self.checkForCollision(self.x + self.maxSpd, self.y))
            self.spdX = self.maxSpd;
        else if (self.pressingLeft && !self.checkForCollision(self.x - self.maxSpd, self.y))
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;

        if (self.pressingUp && self.pressingDown)
            self.spdY = 0;
        else if (self.pressingUp && !self.checkForCollision(self.x, self.y - self.maxSpd))
            self.spdY = -self.maxSpd;
        else if (self.pressingDown && !self.checkForCollision(self.x, self.y + self.maxSpd))
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;

        //counters movement and sets animCounter = to it
        if (self.spdY != 0 || self.spdX != 0)
            self.animCounter += 0.2;
        if (self.animCounter > 3)
            self.animCounter = 0;
    }

    self.updateSkins = function(skin) {
        self.skins = skin;
    }

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number,
            hp: self.hp,
            hpMax: self.hpMax,
            score: self.score,
            map: self.map,
            mouseAngle: self.mouseAngle,
            animCounter: self.animCounter,
            isZombie: self.isZombie,
            name: self.name,
            skins: self.skins,
            bCounter: self.bCounter,
        };
    }
    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score,
            /////////sending mouse angle//////////////////////////////////////////////////////////////////////////////////////////////
            mouseAngle: self.mouseAngle,
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            animCounter: self.animCounter,
            isZombie: self.isZombie,
            skins: self.skins,
            underWallLayer: self.isAboveWall(),
            bCounter: self.bCounter,
        }
    }

    Player.list[self.id] = self;

    initPack.player.push(self.getInitPack());
    return self;
}
Player.list = {};
Player.onConnect = function(socket) {
    var player = Player({
        id: socket.id,
    });
    socket.on('keyPress', function(data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
        else if (data.inputId === 'up')
            player.pressingUp = data.state;
        else if (data.inputId === 'down')
            player.pressingDown = data.state;
        else if (data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if (data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.on('boughtHarambe', function(data) {
        player.updateSkins(data);
    });
    socket.on('updateScore', function(data) {
        player.score = data;
    });

    socket.emit('init', {
        selfId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
        obj: Objective.getAllInitPack(),
    })
}
Player.getAllInitPack = function() {
    var players = [];
    for (var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function() {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Bullet = function(param) {
    var self = new Entity(param);
    self.init();
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle / 180 * Math.PI) * 20;
    self.spdY = Math.sin(param.angle / 180 * Math.PI) * 20;
    self.parent = param.parent;

    self.timer = 0;
    self.toRemove = false;

    self.update = function() {
        if (self.timer++ > 100)
            self.toRemove = true;
        self.updatePosition();

        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id && p.isZombie) {
                p.hp -= 1;

                if (p.hp <= 0) {
                    var shooter = Player.list[self.parent];
                    if (shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    //randomly generated respawn and checks for respawn collision
                    do {
                        p.collision = false;
                        p.x = ((mapWidth - 100) - 100 + 1) * Math.random() + 100;
                        p.y = ((mapHeight - 100) - 100 + 1) * Math.random() + 100;
                        p.checkForCollision();
                    } while (p.collision);
                }
                self.toRemove = true;
            }
        }
        if(self.checkForCollision(self.x, self.y)){
            self.toRemove = true;
            console.log("as");
        }
    }

    self.checkForCollision = function(x,y){
        if (x < 0 || x + 10 > mapWidth || y < 0 || y + 10 > mapHeight)
            return true;

        //checks within map array at each of the four corners
        //checks right side
        for (var i in Player.list) {
            var p = Player.list[i];
            if (this.getCollisionWithMap(x - 10, y + 10) || this.getCollisionWithMap(x - 10, y + 10 * 2)) {
                return true;
            } else if (this.getCollisionWithMap(x + 10, y + 10) || this.getCollisionWithMap(x + 10, y + 10 * 2)) {
                return true;
            } else if (this.getCollisionWithMap(x, y + 10) || this.getCollisionWithMap(x, y + 10 * 2)) {
                return true;
            }
        }
    }

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map,
        };
    }
    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
}
Bullet.list = {};

Bullet.update = function() {
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else
            pack.push(bullet.getUpdatePack());
    }
    return pack;
}

Bullet.getAllInitPack = function() {
        var bullets = [];
        for (var i in Bullet.list)
            bullets.push(Bullet.list[i].getInitPack());
        return bullets;
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Objective = function() {
    var self = new Entity();
    self.id = Math.random();
    self.init();
    self.timer = time;
    self.toRemove = false;
    self.w = (75/2);
    self.h = (75/2);

    self.spawn = function() {
        var seed = Math.floor(Math.random() * objectiveSpawnList.length);
        self.x = objectiveSpawnList[seed][0];
        self.y = objectiveSpawnList[seed][1];
    }

    self.spawn();

    self.update = function() {
        if (time - self.timer >= 20)
            self.toRemove = true;

        for (var i in Player.list) {
            var p = Player.list[i];
            if (!p.isZombie) {
                if (self.x - self.w < p.x + PimgW && self.x + self.w > p.x - PimgW && self.y - self.h < p.y + PimgH && self.y + self.h > p.y - PimgH && Player.list[this.id] != Player.list[i]) {
                    console.log("gem detected");
                    p.score +=10;
                    self.toRemove = true;
                }
            }
        }
    }

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map,
        };
    }
    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }

    Objective.list[self.id] = self;
    initPack.obj.push(self.getInitPack());
    return self;
}

Objective.list = {};

Objective.update = function() {
    var pack = [];
    for (var i in Objective.list) {
        var obj = Objective.list[i];
        obj.update();
        if (obj.toRemove) {
            delete Objective.list[i];
            removePack.obj.push(obj.id);
            console.log("obj has been removeed");
        } else
            pack.push(obj.getUpdatePack());
    }
    return pack;
}

Objective.getAllInitPack = function() {
    var objs = [];
    for (var i in Objective.list)
        objs.push(Objective.list[i].getInitPack());
    return objs;
}

var DEBUG = false;
var counter = 0;
var pCounter = 0;
var NAMES_LIST = [];
var DISCONECTED_LIST = [];
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
    socket.id = counter + 1;
    counter++;
    SOCKET_LIST[socket.id] = socket;

    socket.on('signIn', function(data) {
        NAMES_LIST[socket.id] = data;
        Player.onConnect(socket);
        socket.emit('signInResponse', { success: true });

    });

    socket.on('disconnect', function() {
        delete SOCKET_LIST[socket.id];
        delete NAMES_LIST[socket.id];
        DISCONECTED_LIST.push(socket.id);
        pCounter--;
        Player.onDisconnect(socket);
    });
    socket.on('sendMsgToServer', function(data) {
        var playerName = NAMES_LIST[socket.id];
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
        }
    });

    socket.on('evalServer', function(data) {
        if (!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });



});

var initPack = { player: [], bullet: [], obj: [] };
var removePack = { player: [], bullet: [], obj: [] };
///////////////Time
var partTime = 0;
var time = 0;
var running = true;
//////////////Round
var roundStarted = false;
var allZombies = false;
var displayEnd = false;

function gameTimer() {
    partTime++;
    if (partTime % 25 == 0) {
        time++;
        if (time >= 15 && !roundStarted) { ////////////starts the game after 15 sec prep
            resetTime();
            roundStarted = !roundStarted;
            Objective();
            if (pCounter >= 1)
                pickZombie();
        } else if (displayEnd && time >= 10) { ////////////displays after end of round score
            displayEnd = false;
            resetTime();
        } else if (time >= 60 && roundStarted) { ///////////////aftrer 60sec ends round
            displayEnd = true;
            resetTime();
            roundStarted = !roundStarted;
            resetPartTime();
            if (pCounter >= 1)
                resetZombie();
        } else if (roundStarted) { ///////////if all plays are zombies ends round
            allZombies = true;
            for (var i in Player.list) {
                var p = Player.list[i];
                if (!p.isZombie)
                    allZombies = false;
            }
            if (allZombies) {
                displayEnd = true;
                resetZombie();
                resetTime();
                resetPartTime();
                roundStarted = !roundStarted;
            }
        }
    }

}

function resetTime() {
    time = 0;
}

function resetPartTime(){
    partTime = 0;
}

function isPlayerOffline(num) {
    for (var i in DISCONECTED_LIST) {
        if (num == DISCONECTED_LIST[i])
            return true;
    }
    return false;
}

function pickZombie() {
    var zNum;
    do {
        zNum = Math.floor((counter) * Math.random()) + 1;
    } while (isPlayerOffline(zNum));
    console.log(NAMES_LIST[zNum] + " is a zombie");
    Player.list[zNum].isZombie = true;
}

function resetZombie() {
    for (var i in Player.list) {
        var p = Player.list[i];
        p.isZombie = false;
        p.hp = p.hpMax;
    }
    allZombies = false;
}

setInterval(function() {
    gameTimer();

    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        obj: Objective.update(),
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
        socket.emit('roundInfo', { timer: time, roundStarter: roundStarted, displayEnder: displayEnd });
    }
    initPack.player = [];
    initPack.bullet = [];
    initPack.obj = [];
    removePack.player = [];
    removePack.bullet = [];
    removePack.obj = [];


}, 1000 / 25);
