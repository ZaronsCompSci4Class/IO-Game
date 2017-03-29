Img.introScreen = {
    signin_background: new Image(),
    dark: new Image(),
};
Img.introScreen.signin_background.src = "/client/img/intro_screen/background_layer.png";
Img.introScreen.dark.src = "/client/img/intro_screen/dark.png";
ctx.scale(4, 4);

var fallingTimer = 3000;

function introAnimation() {
    ctx.clearRect(0, 0, canvasWidth / 4, canvasHeight / 4);

    // will stop introAnimation when Player logs in
    if (selfId) {
        return fallingAnimation();
    } else {
        var bg = Img.introScreen.signin_background;
        ctx.drawImage(bg, 0, 0, bg.width, 90, 0, 0, bg.width, canvasHeight / 4);
        return true;
    }
}

function fallingAnimation() {
    // will start game when animation ends
    if (fallingTimer <= 0) {
        (function stopAnimation() {
            ctx.scale(1 / 4, 1 / 4);
            gameDiv.style.visibility = 'visible';
        })();
        return false
    }

    // draw animation
    var bg = Img.introScreen.signin_background;
    var dark = Img.introScreen.dark;
    // moves image according to time left in animation
    var yOffset = (bg.height - 90) * (1 - fallingTimer / 3000);
    ctx.drawImage(bg, 0, yOffset, bg.width, yOffset + 90, 0, 0, bg.width, canvasHeight / 4);
    ctx.drawImage(dark, 0, yOffset, bg.width, yOffset + 90, 0, 0, bg.width, canvasHeight / 4);

    // increment timer according to framerate
    fallingTimer = fallingTimer - 1000 / framerate;
    return true;
}
