var IntroScreen = {
    Img: {
        signin_background: new Image(),
        dark: new Image(),
        trees: new Image(),
    },
};
IntroScreen.Img.signin_background.src = "/client/img/intro_screen/background_layer.png";
IntroScreen.Img.dark.src = "/client/img/intro_screen/dark.png";
IntroScreen.Img.trees.src = "/client/img/intro_screen/trees.png";
ctx.scale(4, 4);

var fallingTimer = 3000;

function setUpIntroSprites() {
    Img.bigReptilianSprite.totalSpriteCycles = 4;
    IntroScreen.reptilian = new Entity({
        spriteCycleDuration: 300,
    }, Img.bigReptilianSprite);

    Img.playerSprite.totalSpriteCycles = 4;
    IntroScreen.zaron = new Entity({
        spriteCycleDuration: 300,
    }, Img.playerSprite);
}

function introAnimation() {
    ctx.clearRect(0, 0, canvasWidth / 4, canvasHeight / 4);

    // will stop introAnimation when Player logs in
    if (selfId) {
        var fallingMatrix = fallingAnimation();
    } else {
        var fallingMatrix = {
            yOffset: 0,
            endAnimation: false,
        };
    }

    // draw animation
    var bg = IntroScreen.Img.signin_background;
    var trees = IntroScreen.Img.trees;
    var dark = IntroScreen.Img.dark;

    var yOffset = fallingMatrix.yOffset;

    // moves image according to time left in animation
    ctx.drawImage(bg, 0, yOffset, bg.width, yOffset + 90, 0, 0, bg.width, canvasHeight / 4);
    drawRep(IntroScreen.reptilian);
    ctx.drawImage(trees, 0, yOffset, bg.width, yOffset + 90, 0, 0, bg.width, canvasHeight / 4);
    drawZaron(IntroScreen.zaron);
    ctx.drawImage(dark, 0, yOffset, bg.width, yOffset + 90, 0, 0, bg.width, canvasHeight / 4);

    return !fallingMatrix.endAnimation;
}

function drawRep(reptilian) {
    var REP_SCALE = 2;
    var repX = canvasWidth / 8 - reptilian.width * REP_SCALE / 2;
    var repY = 20;
    var repCycleMod = reptilian.getCycleMod();
    ctx.drawImage(reptilian.image, repCycleMod, 0, reptilian.width, reptilian.height / 4, repX, repY,
        reptilian.width * REP_SCALE, reptilian.height * REP_SCALE / 4);
}

function drawZaron(zaron) {
    var zaronX = canvasWidth / 8 - zaron.width / 2;
    var zaronY = 55;
    var zaronCycleMod = zaron.getCycleMod();
    ctx.drawImage(zaron.image, zaronCycleMod, 0, zaron.width, zaron.height / 4, zaronX, zaronY,
        zaron.width, zaron.height / 4);
}

function fallingAnimation() {
    var bg = IntroScreen.Img.signin_background;

    var fallingMatrix = {
        yOffset: (bg.height - 90) * (1 - fallingTimer / 3000),
        endAnimation: false,
    };

    // will start game when animation ends
    if (fallingTimer <= 0) {
        (function stopAnimation() {
            ctx.scale(1 / 4, 1 / 4);
            gameDiv.style.visibility = 'visible';
        })();
        fallingMatrix.endAnimation = true;
    }

    // increment timer according to framerate
    fallingTimer = fallingTimer - 1000 / framerate;

    return fallingMatrix;
}
