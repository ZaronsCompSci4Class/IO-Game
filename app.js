"use strict";


const express = require(`express`);
const app = express();
const serv = require(`http`).Server(app);
const Events = new require(`events`).EventEmitter();

app.get(`/`, function(req, res) {
    res.sendFile(`${__dirname}/client/index.html`);
});
app.use(`/client`, express.static(`${__dirname}/client`));

serv.listen(process.env.PORT || 2000);
console.log(`Server started.`);

// gets collision map and reads it into collisionText String
const fs = require(`fs`);
const collisionText = fs.readFileSync(`${__dirname}/bin/collisionMap.txt`, `utf-8`);

let SOCKET_LIST = {};
// Player img width and height
const PimgW = 9 / 2;
const PimgH = 11 / 2;
const mapWidth = 1024;
const mapHeight = 1024;
const pixelsPerCU = 8;
let newEntities = false;
const framerate = 25;

function Entity(param) {
    // lets the setInterval function know it will have to send a new initPack because a new Entity has been created
    newEntities = true;
    // assigns all properties of param to this
    Object.assign(this, param);

    this.updatePosition = function() {
        this.x += this.spdX;
        this.y += this.spdY;
    };
    this.getDistance = function(entity) {
        try{
        return Math.sqrt(Math.pow(this.x - entity.x, 2) + Math.pow(this.y - entity.y, 2));
        }catch(){
            throw new Error(entity);
        }
    };

    // method that checks for all collisions, returns boolean
    this.checkForCollision = function(x, y) {
        // checks for collisions with map borders
        if (x < 0 || x + PimgW > mapWidth || y < 0 || y + PimgH > mapHeight) {
            return true;
        }
        // checks within map array at each of the four corners
        // checks right side
        if (this.getCollisionWithMap(x - PimgW, y + PimgH, `1`) || this.getCollisionWithMap(x - PimgW, y + PimgH * 2, `1`)) {
            return true;
        } else if (this.getCollisionWithMap(x + PimgW, y + PimgH, `1`) || this.getCollisionWithMap(x + PimgW, y + PimgH * 2, `1`)) {
            return true;
        } else if (this.getCollisionWithMap(x, y + PimgH, `1`) || this.getCollisionWithMap(x, y + PimgH * 2, `1`)) {
            return true;
        }

        // checks for collisions against other players
        for (let i in Player.list) {
            const p = Player.list[i];
            if (x - PimgW < p.x + PimgW && x + PimgW > p.x - PimgW && y - PimgH < p.y + PimgH && y + PimgH > p.y - PimgH && Player.list[this.id] !== Player.list[i]) {
                if (p.isZombie || this.isZombie) {
                    p.isZombie = true;
                    this.isZombie = true;
                }
                return true;
            }
        }
        return false;
    };

    this.getCollisionWithMap = function(x, y, str) {
        // gets collision index with map collisionText
        let xCU = Math.floor(x / pixelsPerCU);
        let yCU = Math.floor(y / pixelsPerCU);
        let index = yCU * 128 + xCU;
        if (collisionText.charAt(index) === str)
            return true;
        else {
            return false;
        }
    };

    this.isAboveWall = function() {
        if (this.getCollisionWithMap(this.x - PimgW, this.y - PimgH - 5, `2`) || this.getCollisionWithMap(this.x + PimgW, this.y - PimgH - 5, `2`) || this.getCollisionWithMap(this.x - PimgW, this.y, `2`) || this.getCollisionWithMap(this.x + PimgW, this.y, `2`) || this.getCollisionWithMap(this.x, this.y - PimgH - 5, `2`)) {
            return true;
        } else {
            return false;
        }
    };

    this.isInWater = function() {
        if (this.getCollisionWithMap(this.x - PimgW, this.y - PimgH - 5, `3`) || this.getCollisionWithMap(this.x + PimgW, this.y - PimgH - 5, `3`) || this.getCollisionWithMap(this.x - PimgW, this.y, `3`) || this.getCollisionWithMap(this.x + PimgW, this.y, `3`) || this.getCollisionWithMap(this.x, this.y - PimgH - 5, `3`)) {
            return true;
        } else {
            return false;
        }
    }
    return this;
}


function Player(param) {
    Entity.call(this, param);
    this.number = Math.floor(10 * Math.random());
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;
    this.mouseAngle = 0;
    this.hp = 10;
    this.hpMax = 10;
    this.score = 0;
    this.animCounter = 1; // 1 is the starting frame for this sprite 0 and 2
    this.isZombie = roundStarted;
    this.skins = `reg`;
    this.reloadTimeMax = 5;
    this.timer = 0;
    this.reloading = false;
    this.pwrId = null;
    this.points = 0;

    const MAX_BULLETS = 20;
    this.ammo = {
        MAX_BULLETS: MAX_BULLETS,
        bullets: MAX_BULLETS,
        mags: 1,
    };

    //Creates an array of active powerups
    this.activeMods = {};
    // object for modifiables and powerups
    this.mod = {
        pwrs: {
            bulletFrenzy: null,
            oneHitKill: null,
            speedBurst: null,
        },
        timeBetweenBullets: .25,
        spd: 5,
    };

    this.spawn = function() {
        do {
            this.x = ((mapWidth - 100) - 100 + 1) * Math.random() + 100;
            this.y = ((mapHeight - 100) - 100 + 1) * Math.random() + 100;
        } while (this.checkForCollision(this.x, this.y));
    };

    this.restartRound = function() {
        this.reload(`reset`);
    };


    this.lastShotTime = time;
    this.reloadStartedTime;

    this.reload = function(state) {
        // if already full return immediately and stop reloading
        if (this.ammo.bullets === this.ammo.MAX_BULLETS && this.ammo.mags === 1) {
            this.reloading = false;
            return;
            // if completely empty, start reloading
        } else if (this.ammo.bullets <= 0 && this.reloading === false) {
            state = `start`;
        }

        switch (state) {
            case `reset`:
                this.ammo.bullets = this.ammo.MAX_BULLETS;
                this.ammo.mags = 1;
                this.reloading = false;
                break;
            case `start`:
                this.reloading = true;
                this.reloadStartedTime = time;
                break;
            case `continue`:
                if (this.reloading) {
                    if (this.ammo.bullets >= this.ammo.MAX_BULLETS && this.ammo.mags >= 1) {
                        this.reload(`reset`);
                        return;
                    }
                    this.ammo.bullets += (this.ammo.MAX_BULLETS / this.reloadTimeMax) / framerate;
                }
                break;
            default:
                throw new Error(`Player.reload called with wrong parameter`);
                break;
        }
    }

    this.spawn();

    this.update = function() {
        this.updateSpd();
        this.updatePosition();

        if (!this.isZombie) {

            // if has a magazine and ammo inside, and more than timeBetweenBullets time has passed after the last shot, shoot a new Bullet
            if (this.pressingAttack && time - this.lastShotTime >= this.mod.timeBetweenBullets && this.ammo.mags > 0 && !this.reloading) {
                this.lastShotTime = time;
                this.shootBullet();
                if (roundStarted) {
                    this.ammo.bullets -= 1;
                }
            }
            this.reload(`continue`);
        }
        return this.getUpdatePack();
    };

    this.shootBullet = function(angle) {
        new Bullet({
            parent: this.id,
            angle: this.mouseAngle,
            x: this.x,
            y: this.y,
            oneHitKill: this.mod.pwrs[`oneHitKill`] !== null,
        });
    };

    this.updateSpd = function() {
        if (this.pressingRight && this.pressingLeft) {
            this.spdX = 0;
        } else if (this.pressingRight && !this.checkForCollision(this.x + this.mod.spd, this.y)) {
            this.spdX = this.mod.spd;
        } else if (this.pressingLeft && !this.checkForCollision(this.x - this.mod.spd, this.y)) {
            this.spdX = -this.mod.spd;
        } else {
            this.spdX = 0;
        }

        if (this.pressingUp && this.pressingDown) {
            this.spdY = 0;
        } else if (this.pressingUp && !this.checkForCollision(this.x, this.y - this.mod.spd)) {
            this.spdY = -this.mod.spd;
        } else if (this.pressingDown && !this.checkForCollision(this.x, this.y + this.mod.spd)) {
            this.spdY = this.mod.spd;
        } else {
            this.spdY = 0;
        }

        // counters movement and sets animCounter = to it
        if (this.spdY !== 0 || this.spdX !== 0) {
            this.animCounter += 0.2;
        }
        if (this.animCounter > 3) {
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
            activeMods: this.activeMods,
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
            ammo: this.ammo,
            activeMods: this.activeMods,
            reloading: this.reloading,
        };
    };
    Player.list[this.id] = this;
    initPack.player.push(this.getInitPack());
}

Player.list = {};
Player.onConnect = function(socket, name) {
    const player = new Player({
        id: socket.id,
        name,
    });
    socket.on(`keyPress`, (data) => {
        if (data.inputId === `reload`) {
            player.reload(`start`);
        } else if (data.inputId === `left`)
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

    socket.on('queue', function() {
        console.log(player.pwrId);
        if (player.pwrId != null) {
            PlayerPowerups[player.pwrId].applyPwr();
        }
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
    for (let i of Object.keys(Player.list)) {
        players.push(Player.list[i].getInitPack());
    }
    return players;
}

Player.onDisconnect = function(socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function() {
    const pack = {};
    for (let i of Object.keys(Player.list)) {
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
        self.timer += 1;
        if (self.timer > 100)
            self.toRemove = true;
        self.updatePosition();

        for (let i in Player.list) {
            const p = Player.list[i];
            if (self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id && p.isZombie) {
                if (self.oneHitKill) {
                    p.hp -= 20;
                } else {
                    p.hp -= 1;
                }
                if (p.hp <= 0) {
                    let shooter = Player.list[self.parent];
                    if (shooter) {
                        shooter.score += 1;
                    }
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
        if (x < 0 || x + 10 > mapWidth || y < 0 || y + 10 > mapHeight) {
            return true;
        }
        // checks within map array at each of the four corners
        // checks right side
        for (let i in Player.list) {
            const p = Player.list[i];
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
    const pack = {};
    for (let i in Bullet.list) {
        const bullet = Bullet.list[i];
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
    const bullets = [];
    for (let i in Bullet.list) {
        bullets.push(Bullet.list[i].getInitPack());
    }
    return bullets;
};

let Objective = function(param) {
    let self = new Entity(param);
    self.id = Math.random();
    self.x = 554;
    self.y = 324;
    self.timer = time;
    self.toRemove = false;
    self.w = (75 / 2);
    self.h = (75 / 2);

    self.update = function() {
        if (time - self.timer >= 20)
            self.toRemove = true;

        for (let i in Player.list) {
            const p = Player.list[i];
            if (!p.isZombie) {
                if (self.x - self.w < p.x + PimgW && self.x + self.w > p.x - PimgW && self.y - self.h < p.y + PimgH && self.y + self.h > p.y - PimgH && Player.list[this.id] !== Player.list[i]) {
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
    const pack = {};
    for (let i in Objective.list) {
        const obj = Objective.list[i];
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
    const objs = [];
    for (let i in Objective.list)
        objs.push(Objective.list[i].getInitPack());
    return objs;
};


function Powerup(param) {
    Entity.call(this, param);
    this.id = Math.random();
    this.x = 264;
    this.y = 24;
    this.timer = time;
    this.toRemove = false;
    this.pickedUp = false;
    this.w = (75 / 2);
    this.h = (75 / 2);
    this.pickedUp = false;

    // assigns random powerup type
    switch (Math.floor(Math.random() * 3)) {
        case 0:
            this.type = `bulletFrenzy`;
            break;
        case 1:
            this.type = `oneHitKill`;
            break;
        case 2:
            this.type = `speedBurst`;
            break;
        default:
            throw new Error(`assigned nonexistent powerup`);
            break;
    }
    // based on the type of powerup, assigns duration or maxUses
    if (this.type === `bulletFrenzy` || this.type === `oneHitKill` || this.type === `speedBurst`) {
        this.duration = 20;
        this.maxUses = 0;
        this.uses = this.maxUses;
    }

    // same method to access Powerup updates if on player or if still on map
    this.update = function() {
        if (this.pickedUp) {
            this.updateAsPlayerAttribute();
        } else {
            this.updateAsMapObject();
        }
    };

    this.updateAsMapObject = function() {
        // if has existed longer than 20 seconds, removes this
        if (time - this.timer >= 20) {
            this.remove();
        }
        // checks for collisions with players
        for (let i in Player.list) {
            const p = Player.list[i];
            if (!p.isZombie) {
                // if collided, pass this to player
                if (this.x - this.w < p.x + PimgW && this.x + this.w > p.x - PimgW && this.y - this.h < p.y + PimgH && this.y + this.h > p.y - PimgH && Player.list[this.id] !== Player.list[i]) {
                    this.parent = p;
                    this.addPowerupToPlayer();
                }
            }
        }
    };

    this.updateAsPlayerAttribute = function() {
        // if has been active on player for more than duration, will remove effects, then delete this from their pwrs
        if (time - this.timer >= this.duration && this.uses === 0) {
            this.remove();
            console.log(`time is up`);
        }
    };

    this.addPowerupToPlayer = function() {
        // adds powerup to player and handles modifications
        this.parent.score += 2;
        this.pickedUp = true;
        this.parent.pwrId = this.id;
        console.log(`value: ` + this.parent.pwrId);
        console.log(this.type);
        //marks itthis for removal from Powerup.list
        this.toRemove = true;
    };

    this.applyPwr = function() {
        console.log(`q works`);
        this.parent.activeMods[this.pwrId] = (this.type);
        this.parent.mod.pwrs[this.type] = this;
        this.timer = time;
        // modifies player based on type of poweru
        // in the oneHitKill, logic is one-line simple and handled in Player.shootBullet
        if (this.type === `bulletFrenzy`) {
            this.parent.mod.timeBetweenBullets /= 2;
        } else if (this.type === `speedBurst`) {
            this.parent.mod.spd *= 2;
        }
        this.parent.pwrId = null;
    }

    this.remove = function() {
        if (this.pickedUp) {
            this.parent.pwrId = null;
            console.log(`pene`);
            //loops to find the pwr than removes it out
            delete this.parent.activeMods[this.id];
            // undoes modifications on player based on type of powerup
            // some kinds of powerups don`t need remove logic (like oneHitKill)
            if (this.type === `bulletFrenzy`) {
                this.parent.mod.timeBetweenBullets *= 2;
            } else if (this.type === `speedBurst`) {
                this.parent.mod.spd /= 2;
                this.parent.mod.pwrs[this.type] = null;
            }
            //removes from PlayerPowerups
            delete PlayerPowerups[this.id];
            this.toRemove = true;
        } else {
            this.toRemove = true;
        }
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
    PlayerPowerups[this.id] = this;
}

Powerup.list = {};
var PlayerPowerups = {};

Powerup.update = function() {
    const pack = {};
    for (let i in Powerup.list) {
        const pwr = Powerup.list[i];
        pwr.update();
        if (pwr.toRemove) {
            delete Powerup.list[i];
            removePack.pwr.push(pwr.id);
        } else {
            pack[i] = pwr.getUpdatePack();
        }
    }
    for (let i in PlayerPowerups) {
        const pwr2 = PlayerPowerups[i];
        pwr2.update();
    }
    return pack;
};

Powerup.getAllInitPack = function() {
    const pwrs = [];
    for (let i in Powerup.list) {
        pwrs.push(Powerup.list[i].getInitPack());
    }
    return pwrs;
};


const DEBUG = false;
let counter = 0;
let pCounter = 0;
const DISCONNECTED_LIST = [];
const io = require(`socket.io`)(serv, {});
io.sockets.on(`connection`, (socket) => {
    socket.id = counter + 1;
    SOCKET_LIST[socket.id] = socket;
    counter += 1;

    socket.on(`signIn`, (name) => {
        Player.onConnect(socket, name);
        pCounter += 1;
        socket.emit(`signInResponse`, {
            success: true,
        });
    });

    socket.on(`disconnect`, () => {
        delete SOCKET_LIST[socket.id];
        DISCONNECTED_LIST.push(socket.id);
        pCounter -= 1;
        Player.onDisconnect(socket);
    });
    socket.on(`sendMsgToServer`, (message) => {
        const playerName = Player.list[socket.id].name;
        io.emit(`addToChat`, {
            playerName,
            message
        });
    });

    socket.on(`evalServer`, (data) => {
        if (!DEBUG) {
            return;
        }
        const res = eval(data);
        socket.emit(`evalAnswer`, res);
    });
});

let initPack = {
    player: [],
    bullet: [],
    obj: [],
    pwr: [],
};
let removePack = {
    player: [],
    bullet: [],
    obj: [],
    pwr: [],
};

let time = 0;
let ticks = 0;
let sectionTime = 0;
let roundStarted = false;
let allZombies = false;
// has states: displayingScores, preparing, started
let roundState = `preparing`;
const sectionDuration = {
    displayingScores: 10,
    preparing: 10,
    started: 60,
};

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

function startRound() {
    sectionTime = 0;
    roundStarted = true;
    new Objective();
    new Powerup();
    if (pCounter >= 1) {
        pickZombie();
    }
}

function endRound() {
    roundState = `displayingScores`;
    sectionTime = 0;

    for (let i of Object.keys(Player.list)) {
        Player.list[i].restartRound();
    }
    for (var i in Objective.list) {
        Objective.list[i].toRemove = true;
    }
    for (var i in Powerup.list) {
        Powerup.list[i].remove();
    }
    roundStarted = false;
    if (pCounter >= 1) {
        resetZombie();
    }
}

function gameTimer() {
    // increment game timer
    time += 1 / framerate;
    ticks += 1;
    // only runs once per second
    if (ticks % 25 === 0) {
        sectionTime += 1;
        if (roundStarted) {
            // checks if all players are zombies
            roundState = `started`;
            allZombies = true;
            for (let i in Player.list) {
                if (!Player.list[i].isZombie) {
                    allZombies = false;
                }
            }
            // end round after 60 seconds or if all players are zombies
            if (sectionTime >= sectionDuration.started || allZombies) {
                endRound();
            }
            // spawn new obj and pwr every 15 seconds while game is started
            if (sectionTime % 15 === 0) {
                new Objective();
                new Powerup();
            }
        } else {
            // moves to next roundState when time goes over sectionDuration
            if (sectionTime >= sectionDuration[roundState]) {
                sectionTime = 0;
                if (roundState === `displayingScores`) {
                    roundState = `preparing`;
                } else if (roundState === `preparing`) {
                    startRound();
                }

            }
        }
    }
}

setInterval(() => {
    gameTimer();

    const pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        obj: Objective.update(),
        pwr: Powerup.update(),
    };

    //only sends initPack if new entity has been spawned
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
        roundState,
        sectionDuration: sectionDuration[roundState],
        sectionTime,
        roundStarter: roundStarted,
    });

    removePack.player = [];
    removePack.bullet = [];
    removePack.obj = [];
    removePack.pwr = [];
}, 1000 / framerate);
