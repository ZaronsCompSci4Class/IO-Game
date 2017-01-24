"use strict";

const express = require(`express`);
const app = express();
const serv = require(`http`).Server(app);

app.get(`/`, function(req, res) {
    res.sendFile(`${__dirname}/client/index.html`);
});
app.use(`/client`, express.static(`${__dirname}/client`));

serv.listen(process.env.PORT || 2000);
console.log(`Server started.`);

//gets collision map and reads it into collisionText String
const fs = require(`fs`);
const collisionText = fs.readFileSync(`${__dirname}/bin/collisionMap.txt`, `utf-8`);

let SOCKET_LIST = {};
//Player img width and height
const PimgW = 18 / 2;
const PimgH = 20 / 2;
const mapWidth = 2048;
const mapHeight = 2048;
const pixelsPerCU = 16;
let newEntities = false;

function Entity(param) {
    //lets the setInterval function know it will have to send a new initPack because a new Entity has been created
    newEntities = true;
    //assigns all properties of param to this
    Object.assign(this, param);

    this.updatePosition = function() {
        this.x += this.spdX;
        this.y += this.spdY;
    };
    this.getDistance = function(pt) {
        return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
    };

    //method that checks for all collisions, returns boolean
    this.checkForCollision = function(x, y) {
        //checks for collisions with map borders
        if (x < 0 || x + PimgW > mapWidth || y < 0 || y + PimgH > mapHeight){
            return true;
        }
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
        for (let i in Player.list) {
            let p = Player.list[i];
            if (x - PimgW < p.x + PimgW && x + PimgW > p.x - PimgW && y - PimgH < p.y + PimgH && y + PimgH > p.y - PimgH && Player.list[this.id] != Player.list[i]) {
                if (p.isZombie || this.isZombie) {
                    p.isZombie = true;
                    this.isZombie = true;
                }
                return true;
            }
        }
        return false;
    };

    this.getCollisionWithMap = function(x, y) {
        //gets collision index with map collisionText
        let xCU = Math.floor(x / pixelsPerCU);
        let yCU = Math.floor(y / pixelsPerCU);
        let index = yCU * 128 + xCU;
        if (collisionText.charAt(index) === `1`)
            return true;
        else
            return false;
    };

    this.isAboveWall = function() {
        if (this.getCollisionWithMap(this.x - PimgW, this.y - PimgH - 5, `2`) || this.getCollisionWithMap(this.x + PimgW, this.y - PimgH - 5, `2`) || this.getCollisionWithMap(this.x - PimgW, this.y, `2`) || this.getCollisionWithMap(this.x + PimgW, this.y, `2`) || this.getCollisionWithMap(this.x, this.y - PimgH - 5, `2`)) {
            return true;
        }
        return false;
    };
    return this;
}


function Player(param) {
    Entity.call(this, param);
    this.number = `` + Math.floor(10 * Math.random());
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;
    this.mouseAngle = 0;
    this.hp = 10;
    this.hpMax = 10;
    this.score = 0;
    this.animCounter = 1; //1 is the starting frame for this sprite//0 and 2
    this.isZombie = roundStarted;
    this.name = NAMES_LIST[this.id];
    this.skins = `reg`;
    this.reloadTime = 5;
    this.timer = 0;
    this.roundState = roundStarted;

    this.ammo = {
        bullets: 20,
        mags: 1,
    };

    //object for modifiables and powerups
    this.mod = {
        pwrs: {},
        timeBetweenBullets: 4,
        spd: 10
    };

    this.spawn = function() {
        do {
            this.x = ((mapWidth - 100) - 100 + 1) * Math.random() + 100;
            this.y = ((mapHeight - 100) - 100 + 1) * Math.random() + 100;
        } while (this.checkForCollision(this.x, this.y));
    };
    this.spawn();

    let lastShotTime = partTime;

    this.update = function() {
        this.updateSpd();
        this.updatePosition();
        if (roundStarted != this.roundState) {
            this.roundState = roundStarted;
            this.timer = 0;
            this.ammo.bullets = 20;
            this.ammo.mags = 1;
        }

        if (this.pressingAttack && !this.isZombie) {
            //if has a magazine and ammo inside, and more than timeBetweenBullets time has passed after the last shot, shoot a new Bullet
            if (partTime - lastShotTime >= this.mod.timeBetweenBullets && this.ammo.mags > 0) {
                lastShotTime = partTime;
                this.shootBullet();
                if (roundStarted) {
                    this.ammo.bullets--;
                    if (this.ammo.bullets == 0) {
                        this.ammo.mags--;
                        this.timer = time;
                    }
                }
            }
        } else if (!roundStarted || (this.timer != 0 && this.ammo.bullets == 0)) {
            if ((this.bulletFrenzy && time - this.timer >= this.reloadTime / 2) || time - this.timer >= this.reloadTime) {
                this.ammo.mags = 1;
                this.ammo.bullets = 20;
                this.timer = 0;
            }
        }
        return this.getUpdatePack();
    };

    this.shootBullet = function(angle) {
        Bullet({
            parent: this.id,
            angle: this.mouseAngle,
            x: this.x,
            y: this.y,
            oneHitKill: this.mod.pwrs.hasOwnProperty(`1HitKill`),
        });
    };

    this.updateSpd = function() {
        if (this.pressingRight && this.pressingLeft){
            this.spdX = 0;
        }
        else if (this.pressingRight && !this.checkForCollision(this.x + this.mod.spd, this.y)){
            this.spdX = this.mod.spd;
        }
        else if (this.pressingLeft && !this.checkForCollision(this.x - this.mod.spd, this.y)){
            this.spdX = -this.mod.spd;
        }
        else{
            this.spdX = 0;
        }

        if (this.pressingUp && this.pressingDown){
            this.spdY = 0;
        }
        else if (this.pressingUp && !this.checkForCollision(this.x, this.y - this.mod.spd)){
            this.spdY = -this.mod.spd;
        }
        else if (this.pressingDown && !this.checkForCollision(this.x, this.y + this.mod.spd)){
            this.spdY = this.mod.spd;
        }
        else{
            this.spdY = 0;
        }

        //counters movement and sets animCounter = to it
        if (this.spdY != 0 || this.spdX != 0){
            this.animCounter += 0.2;
        }
        if (this.animCounter > 3){
            this.animCounter = 0;
        }
    };

    this.updateSkins = function(skin) {
        this.skins = skin;
    };

    this.getInitPack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            number: this.number,
            hp: this.hp,
            hpMax: this.hpMax,
            score: this.score,
            map: this.map,
            mouseAngle: this.mouseAngle,
            animCounter: this.animCounter,
            isZombie: this.isZombie,
            name: this.name,
            skins: this.skins,
            bCounter: this.ammo.bullets,
            bulletFrenzy: this.bulletFrenzy,
            oneHitKill: this.oneHitKill,
        };
    };
    this.getUpdatePack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            hp: this.hp,
            score: this.score,
            mouseAngle: this.mouseAngle,
            animCounter: this.animCounter,
            isZombie: this.isZombie,
            skins: this.skins,
            underWallLayer: this.isAboveWall(),
            bCounter: this.ammo.bullets,
            bulletFrenzy: this.bulletFrenzy,
            oneHitKill: this.oneHitKill,
        };
    };
    Player.list[this.id] = this;
    initPack.player.push(this.getInitPack());
    return this;
}

Player.list = {};
Player.onConnect = function(socket) {
    let player = new Player({
        id: socket.id,
    });
    socket.on(`keyPress`, function(data) {
        if (data.inputId === `left`)
            player.pressingLeft = data.state;
        else if (data.inputId === `right`)
            player.pressingRight = data.state;
        else if (data.inputId === `up`)
            player.pressingUp = data.state;
        else if (data.inputId === `down`)
            player.pressingDown = data.state;
        else if (data.inputId === `attack`)
            player.pressingAttack = data.state;
        else if (data.inputId === `mouseAngle`)
            player.mouseAngle = data.state;
    });

    socket.on(`boughtHarambe`, function(data) {
        player.updateSkins(data);
    });
    socket.on(`updateScore`, function(data) {
        player.score = data;
    });

    socket.emit(`init`, {
        selfId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
        obj: Objective.getAllInitPack(),
        pwr: Powerup.getAllInitPack(),
    });
}
Player.getAllInitPack = function() {
    let players = [];
    for (let i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function() {
    let pack = {};
    for (let i in Player.list) {
        pack[i] = Player.list[i].update();
    }
    return pack;
}

let Bullet = function(param) {
    let self = new Entity(param);
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(self.angle) * 20;
    self.spdY = -Math.sin(self.angle) * 20;
    self.parent = param.parent;
    self.oneHitKill = param.oneHitKill;

    self.timer = 0;
    self.toRemove = false;

    self.update = function() {
        if (self.timer++ > 100)
            self.toRemove = true;
        self.updatePosition();

        for (let i in Player.list) {
            let p = Player.list[i];
            if (self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id && p.isZombie) {
                if (self.oneHitKill)
                    p.hp -= 20;
                else
                    p.hp -= 1;

                if (p.hp <= 0) {
                    let shooter = Player.list[self.parent];
                    if (shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.spawn();
                }
                self.toRemove = true;
            }
        }
        if (self.checkForCollision(self.x, self.y)) {
            self.toRemove = true;
        }
    }

    self.checkForCollision = function(x, y) {
        if (x < 0 || x + 10 > mapWidth || y < 0 || y + 10 > mapHeight)
            return true;

        //checks within map array at each of the four corners
        //checks right side
        for (let i in Player.list) {
            let p = Player.list[i];
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
            angle: self.angle,
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
};
Bullet.list = {};

Bullet.update = function() {
    let pack = {};
    for (let i in Bullet.list) {
        let bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else
            pack[i] = bullet.getUpdatePack();
    }
    return pack;
};

Bullet.getAllInitPack = function() {
        let bullets = [];
        for (let i in Bullet.list)
            bullets.push(Bullet.list[i].getInitPack());
        return bullets;
    };

let Objective = function(param) {
    let self = new Entity(param);
    self.id = Math.random();
    self.x = 1064;
    self.y = 1024;
    self.timer = time;
    self.toRemove = false;
    self.w = (75 / 2);
    self.h = (75 / 2);

    self.update = function() {
        if (time - self.timer >= 20)
            self.toRemove = true;

        if (displayEnd)
            self.toRemove = true;

        for (let i in Player.list) {
            let p = Player.list[i];
            if (!p.isZombie) {
                if (self.x - self.w < p.x + PimgW && self.x + self.w > p.x - PimgW && self.y - self.h < p.y + PimgH && self.y + self.h > p.y - PimgH && Player.list[this.id] != Player.list[i]) {
                    console.log(`gem detected`);
                    p.score += 10;
                    self.toRemove = true;
                }
            }
        }
    };

    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map,
        };
    };
    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    };

    Objective.list[self.id] = self;
    initPack.obj.push(self.getInitPack());
    return self;
};

Objective.list = {};

Objective.update = function() {
    let pack = {};
    for (let i in Objective.list) {
        let obj = Objective.list[i];
        obj.update();
        if (obj.toRemove) {
            delete Objective.list[i];
            removePack.obj.push(obj.id);
            console.log(`obj has been removeed`);
        } else
            pack[i] = obj.getUpdatePack();
    }
    return pack;
};

Objective.getAllInitPack = function() {
    let objs = [];
    for (let i in Objective.list)
        objs.push(Objective.list[i].getInitPack());
    return objs;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Powerup(param) {
    Entity.call(this, param);
    this.id = Math.random();
    this.x = 1264;
    this.y = 1024;
    this.timer = time;
    this.toRemove = false;
    this.pickedUp = false;
    this.w = (75 / 2);
    this.h = (75 / 2);

    //assigns random powerup type
    switch (Math.floor(Math.random() * 3)) {
        case 0:
            this.type = `bulletFrenzy`;
            break;
        case 1:
            this.type = `1HitKill`;
            break;
        case 2:
            this.type = `speedBurst`;
            break;
    }
    //based on the type of powerup, assigns duration or maxUses
    if (this.type === `bulletFrenzy` || this.type === `1HitKill` || this.type === `speedBurst`) {
        this.duration = 20;
        this.maxUses = 0;
        this.uses = this.maxUses;
    }

    //same method to access Powerup updates if on player or if still on map
    this.update = function() {
        if (this.pickedUp) {
            this.updateAsPlayerAttribute();
        } else {
            this.updateAsMapObject();
        }
    };

    this.updateAsMapObject = function() {
        //if has existed longer than 20 seconds, removes this
        if (time - this.timer >= 20)
            this.toRemove = true;

        //checks for collisions with players
        for (let i in Player.list) {
            let p = Player.list[i];
            if (!p.isZombie) {
                //if collided, pass itthis to player
                if (this.x - this.w < p.x + PimgW && this.x + this.w > p.x - PimgW && this.y - this.h < p.y + PimgH && this.y + this.h > p.y - PimgH && Player.list[this.id] != Player.list[i]) {
                    this.parent = p;
                    this.addPowerupToPlayer();
                }
            }
        }
    };

    this.updateAsPlayerAttribute = function() {
        //if has been active on player for more than duration, will remove effects, then delete itthis from their pwrs
        if (time - this.timer >= this.duration && this.uses === 0) {
            this.removePowerupFromPlayer();
        }
    };

    this.addPowerupToPlayer = function() {
        //adds powerup to player and handles modifications, marks itthis for removal from Powerup.list
        this.parent.score += 2;
        this.pickedUp = true;
        this.timer = time;
        this.toRemove = true;

        //if powerup already on, removes old and attaches new
        if (this.parent.mod.pwrs.hasOwnProperty(this.type)) {
            this.parent.mod.pwrs[this.type].removePowerupFromPlayer();
        }
        this.parent.mod.pwrs[this.type] = this;

        //modifies player based on type of poweru
        //in the 1HitKill, logic is one-line simple and handled in Player.shooTBullet
        if (this.type === `bulletFrenzy`)
            this.parent.mod.timeBetweenBullets /= 2;
        if (this.type === `speedBurst`)
            this.parent.mod.spd *= 2;
    };

    this.removePowerupFromPlayer = function() {
        //undoes modifications on player based on type of powerup
        //some kinds of powerups don`t need remove logic (like 1HitKill)
        if (this.type === `bulletFrenzy`)
            this.parent.mod.timeBetweenBullets *= 2;
        if (this.type === `speedBurst`)
            this.parent.mod.spd /= 2;
        delete this.parent.mod.pwrs[this.type];
    };

    this.getInitPack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            map: this.map,
        };
    };
    this.getUpdatePack = function() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
        };
    };


    initPack.pwr.push(this.getInitPack());
    Powerup.list[this.id] = this;
}

Powerup.list = {};

Powerup.update = function() {
    let pack = {};
    for (let i in Powerup.list) {
        let pwr = Powerup.list[i];
        pwr.update();
        if (pwr.toRemove) {
            delete Powerup.list[i];
            removePack.pwr.push(pwr.id);
        } else
            pack[i] = pwr.getUpdatePack();
    }
    return pack;
};

Powerup.getAllInitPack = function() {
    let pwrs = [];
    for (let i in Powerup.list)
        pwrs.push(Powerup.list[i].getInitPack());
    return pwrs;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const DEBUG = false;
let counter = 0;
let pCounter = 0;
let NAMES_LIST = [];
let DISCONECTED_LIST = [];
const io = require(`socket.io`)(serv, {});
io.sockets.on(`connection`, function(socket) {
    socket.id = counter + 1;
    SOCKET_LIST[socket.id] = socket;
    counter++;

    socket.on(`signIn`, function(data) {
        NAMES_LIST[socket.id] = data;
        Player.onConnect(socket);
        pCounter++;
        socket.emit(`signInResponse`, {
            success: true
        });

    });

    socket.on(`disconnect`, function() {
        delete SOCKET_LIST[socket.id];
        delete NAMES_LIST[socket.id];
        DISCONECTED_LIST.push(socket.id);
        pCounter--;
        Player.onDisconnect(socket);
    });
    socket.on(`sendMsgToServer`, function(data) {
        let playerName = NAMES_LIST[socket.id];
        io.emit(`addToChat`, playerName + `: ` + data);
    });

    socket.on(`evalServer`, function(data) {
        if (!DEBUG)
            return;
        let res = eval(data);
        socket.emit(`evalAnswer`, res);
    });



});

let initPack = {
    player: [],
    bullet: [],
    obj: [],
    pwr: []
};
let removePack = {
    player: [],
    bullet: [],
    obj: [],
    pwr: []
};
///////////////Time
let partTime = 0;
let time = 0;
//////////////Round
let roundStarted = false;
let allZombies = false;
let displayEnd = false;

function resetTime() {
    time = 0;
}

function resetPartTime() {
    partTime = 0;
}

function pickZombie() {
    const playerArr = Object.keys(Player.list);
    const zombieId = playerArr[Math.floor(Math.random() * playerArr.length)];
    Player.list[zombieId].isZombie = true;
}

function resetZombie() {
    for (let i in Player.list) {
        Player.list[i].isZombie = false;
        Player.list[i].hp = Player.list[i].hpMax;
    }
    allZombies = false;
}

function gameTimer() {
    partTime++;
    if (partTime % 25 == 0) {
        time++;
        if (time >= 8 && !roundStarted) { ////////////starts the game after 15 sec prep
            resetTime();
            roundStarted = !roundStarted;
            new Objective();
            new Powerup();
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
            if (pCounter >= 1){
                resetZombie();
            }
        } else if (roundStarted) { ///////////if all plays are zombies ends round
            allZombies = true;
            for (let i in Player.list) {
                if (!Player.list[i].isZombie){
                    allZombies = false;
                }
            }
            if (allZombies) {
                displayEnd = true;
                resetZombie();
                resetTime();
                resetPartTime();
                roundStarted = !roundStarted;
            }
        }
        ///////if round is started and 20 seconds have passed then spawn an obj
        if (roundStarted && !displayEnd && time % 20 === 0) {
            new Objective();
        }
        if (roundStarted && !displayEnd && time % 20 === 0) {
            new Powerup();
        }
    }

}

setInterval(function() {
    gameTimer();

    const pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        obj: Objective.update(),
        pwr: Powerup.update(),
    };

    if (newEntities) {
        io.emit(`init`, initPack);
        for (let i in initPack) {
            initPack[i] = [];
        }
        newEntities = false;
    }

    io.emit(`update`, pack);
    io.emit(`remove`, removePack);
    io.emit(`roundInfo`, {
        timer: time,
        roundStarter: roundStarted,
        displayEnder: displayEnd,
    });

    removePack.player = [];
    removePack.bullet = [];
    removePack.obj = [];
    removePack.pwr = [];
}, 1000 / 25);
