var socket = io();

var canvasWidth = 568;
// set canvas height to preserve screen aspect ratio
var canvasHeight = Math.round(canvasWidth * (window.innerHeight / window.innerWidth));
var screenScaleFactor = canvasWidth / window.innerWidth;

var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
ctx.canvas.width = canvasWidth;
ctx.canvas.height = canvasHeight;
ctx.imageSmoothingEnabled = false;

// canvas ui elements
var canvasUi = document.getElementById("ctx-ui");
var ctxUi = canvasUi.getContext("2d");
ctxUi.canvas.width = canvasWidth;
ctxUi.canvas.height = canvasHeight;
ctxUi.imageSmoothingEnabled = false;

var ctxSmooth = document.getElementById("autorendered-canvas").getContext("2d");
ctxSmooth.canvas.width = window.innerWidth;
ctxSmooth.canvas.height = window.innerHeight;
ctxSmooth.scale(1 / screenScaleFactor, 1 / screenScaleFactor);

// for the mini map
ctxUi.miniX = canvasWidth * .85;
ctxUi.miniY = canvasHeight * .05;
ctxUi.miniSize = canvasWidth * .1;
ctxUi.dotSize = ctxUi.miniSize * .05;


//sign
var signDiv = document.getElementById('signDiv');
var signDivUsername = document.getElementById('signDiv-username');
var signDivPlay = document.getElementById('signDiv-button');
//scoreboard
var ctxDiv = document.getElementById("ctx-div");
//shop
var storeButton = document.getElementById("shop-button");
var storeMenu = document.getElementById("shop-div-menu");
var sb1 = document.getElementById("shop-button1");
var sb2 = document.getElementById("shop-button2");
var sb3 = document.getElementById("shop-button3");
var sb4 = document.getElementById("shop-button4");
var sb5 = document.getElementById("shop-button5");

// ui
var scoreText = document.createTextNode("0");
document.getElementById("score").appendChild(scoreText);

//Sign-in
signDivUsername.focus();
var signIn = function() {
    socket.emit('signIn', signDivUsername.value);
}

//Store Button
storeButton.onclick = function() {
    if (storeMenu.style.display != 'block') {
        storeMenu.style.display = 'block';
    } else {
        storeMenu.style.display = 'none';
    }
}
/////////////////skin buttons
sb1.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtHarambe', "boughtHarambe");
    }
}

sb2.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtSkin2', "boughtSkin2");
    }
}

sb3.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtSkin3', "boughtSkin3");
    }
}

sb4.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtSkin4', "boughtSkin4");
    }
}

sb5.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtSkin5', "boughtSkin5");
    }
}

socket.on('signInResponse', function(data) {
    if (data.success) {
        signDiv.style.display = 'none';
    } else {
        alert("Sign in unsuccessul.");
    }
});

//chat
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');

socket.on('addToChat', function(data) {
    chatText.innerHTML += '<div>' + data.playerName + ': ' + data.message + '</div>';
    chatText.scrollTop = chatText.scrollHeight;
});

socket.on('evalAnswer', function(data) {
    console.log(data);
});


chatForm.onsubmit = function(e) {
    e.preventDefault();
    if (chatInput.value[0] === '/')
        socket.emit('evalServer', chatInput.value.slice(1));
    else
        socket.emit('sendMsgToServer', chatInput.value);
    chatInput.value = '';
    chatInput.blur();
}

// images
var Img = {};
Img.playerSprite = new Image();
Img.playerSprite.src = '/client/img/human_sheet.png';

Img.playerSprite.water = new Image();
Img.playerSprite.water.src = '/client/img/human_water_sheet.png';

Img.playerSprite2 = new Image();
Img.playerSprite2.src = '/client/img/reptilian_sheet.png';
Img.playerSprite2.water = new Image();
Img.playerSprite2.water.src = '/client/img/reptilian_water_sheet.png';
Img.bigReptilianSprite = new Image();
Img.bigReptilianSprite.src = "/client/img/big_reptilian_sheet.png";

Img.harambeSprite = new Image();
Img.harambeSprite.src = '/client/img/harambe_sheet.png';
Img.wizSprite = new Image();
Img.wizSprite.src = '/client/img/wiz_sheet.png';
Img.solamancerSprite = new Image();
Img.solamancerSprite.src = '/client/img/Solamancer_sheet.png';
Img.germanSprite = new Image();
Img.germanSprite.src = '/client/img/german_sheet.png';
Img.barrelSprite = new Image();
Img.barrelSprite.src = '/client/img/barrel_boy_sheet.png';

Img.bulletSprite = new Image();
Img.bulletSprite.src = '/client/img/bullet_sheet.png';
Img.bulletSprite.totalSpriteCycles = 6;
Img.obj = new Image();
Img.obj.src = '/client/img/obj.png';
Img.pwrIconSprite = new Image();
Img.pwrIconSprite.src = '/client/img/Powerups.png';
Img.pwrChestSprite = new Image();
Img.pwrChestSprite.src = '/client/img/powerup_chest_sheet.png';
Img.pwrChestSprite.totalSpriteCycles = 20;
Img.miniMap = new Image();
Img.miniMap.src = '/client/img/mini_map.png';
Img.map = {};
Img.map.floor = new Image();
Img.map.floor.src = '/client/img/floor.png';
Img.map.walls = new Image();
Img.map.walls.src = '/client/img/walls.png';
Img.map.darkness = new Image();
Img.map.darkness.src = '/client/img/darkness.png';
var mapSize = Img.map.floor.width;

// sounds
var bulletSound = new beepbox.Synth("5s0kbl00e00t5a7g0fj7i0r1w1111f0000d1111c0000h0000v0000o3210b4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4p1b0000Fy07100");
// used to end sound after 1 bar
bulletSound.customDuration = 1;
var deathSound = new beepbox.Synth("5s0kbl00e00t6a2g00j3i0r1w1111f0000d1111c0000h0000v0000o3210b99p1900Gou9YA0");

var UI = {
    miniMap: {},
};

var framerate = 1000 / 40;
