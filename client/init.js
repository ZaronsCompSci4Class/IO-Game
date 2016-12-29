var socket = io();

//connecting page elements
var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var canvasWidth = ctx.canvas.width;
var canvasHeight = ctx.canvas.height;
///mini map
var canvasMini = document.getElementById("miniMap");
var ctxMini = canvas.getContext("2d");
var ctxMiniX = canvasWidth*.9;
var ctxMiniY = canvasHeight*.025;
var miniMapHolder = document.getElementById("miniMapHolder");
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
//chat
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');

//event handlers
//Play Button
signDivPlay.onclick = function() {
    socket.emit('signIn', signDivUsername.value);
}
//Store Button
storeButton.onclick = function(){
		if(storeMenu.style.display != 'block'){
			storeMenu.style.display = 'block';
		}else{
			storeMenu.style.display = 'none';
		}
	}
sb1.onclick = function(){
	if(Player.list[selfId].score >= 0){
		socket.emit('updateScore', Player.list[selfId].score-0);
		socket.emit('boughtHarambe', "boughtHarambe");
	}
}
socket.on('signInResponse', function(data) {
    if (data.success) {
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
    } else
        alert("Sign in unsuccessul.");
});
socket.on('signUpResponse', function(data) {
    if (data.success) {
        alert("Sign up successul.");
    } else
        alert("Sign up unsuccessul.");
});
socket.on('addToChat', function(data) {
    chatText.innerHTML += '<div>' + data + '</div>';
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
}

//Img preload
var Img = {};
Img.playerSprite = new Image();
Img.playerSprite.src = '/client/img/humanSprite.png';
Img.playerSprite2 = new Image();
Img.playerSprite2.src = '/client/img/zombieSprite.png';
Img.harambeSprite = new Image();
Img.harambeSprite.src = '/client/img/harambeSprite.png';
Img.bullet = new Image();
Img.bullet.src = '/client/img/bullet.png';
Img.obj = new Image();
Img.obj.src = '/client/img/obj.png';
Img.pDot = new Image();
Img.pDot.src = '/client/img/playerDot.png';
Img.oDot = new Image();
Img.oDot.src = '/client/img/objDot.png';
Img.eDot = new Image();
Img.eDot.src = '/client/img/enemyDot.png';
Img.fDot = new Image();
Img.fDot.src = '/client/img/friendDot.png';
Img.miniMap = new Image();
Img.miniMap.src = '/client/img/miniMap.png';
Img.map = {};
Img.map.floor = new Image();
Img.map.floor.src = '/client/img/floor.png';
Img.map.wallsTop = new Image();
Img.map.wallsTop.src = '/client/img/wallsTop.png';
Img.map.wallsBottom = new Image();
Img.map.wallsBottom.src = '/client/img/wallsBottom.png';
Img.statics = {};
Img.statics.treeSprite = new Image();
Img.statics.treeSprite.src = '/client/img/treeSprite.png';
