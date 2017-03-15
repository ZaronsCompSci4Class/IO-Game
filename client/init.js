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
var signDivPlay = document.getElementById('signDiv-signIn');
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

sb1.onclick = function() {
    if (Player.list[selfId].score >= 0) {
        socket.emit('updateScore', Player.list[selfId].score - 0);
        socket.emit('boughtHarambe', "boughtHarambe");
    }
}

socket.on('signInResponse', function(data) {
    if (data.success) {
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
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
});
chatText.scrollTop = chatText.scrollHeight;
chatInput.blur();

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
}

// images
var Img = {};
Img.playerSprite = new Image();
Img.playerSprite.src = '/client/img/human_sheet.png';
Img.playerSprite2 = new Image();
Img.playerSprite2.src = '/client/img/reptilian_sheet.png';
Img.harambeSprite = new Image();
Img.harambeSprite.src = '/client/img/harambe_sheet.png';
Img.bulletSprite = new Image();
Img.bulletSprite.src = '/client/img/bullet_sheet.png';
Img.bulletSprite.totalSpriteCycles = 6;
Img.obj = new Image();
Img.obj.src = '/client/img/obj.png';
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
var mapSize = Img.map.floor.width;

// sounds
var bulletSound = new beepbox.Synth("5s0kbl00e00t5a7g0fj7i0r1w1111f0000d1111c0000h0000v0000o3210b4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4h4p1b0000Fy07100");
// used to end sound after 1 bar
bulletSound.customDuration = 1;
var deathSound = new beepbox.Synth("5s0kbl00e00t6a2g00j3i0r1w1111f0000d1111c0000h0000v0000o3210b99p1900Gou9YA0");

var UI = {
    miniMap: {},
};
