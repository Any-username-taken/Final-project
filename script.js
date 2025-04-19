"use strict";

let fileData = '';

fetch('Levels.txt')
  .then(response => response.text())
  .then(data => {
    fileData = data; // Assign the fetched text to the variable
    useFileData(fileData); // Optionally use it in a function
  })
  .catch(error => {
    console.error('Error loading the file:', error);
  });

function useFileData(data) {
    
    fileData = data.split("|")[1].split("\n")
    fileData.shift()
}


//variables
let player;
let b_ground;
let paused = true
let press_again = true
let stars1;
let mainMusic = new Audio("Audio/Music/0416.MP3")
let projectiles = []
let bGroundObj = []
let containEnemy = []
let spawn = []
let deaths = []
let start_game = false
let level = 0
let lel_spawn = ''
let wait = 2
let levelEnd = false

// 6.3 === full rotation new Component(..., angle)
// 3.25 === Half rotation
// anim var
let playerSprite = "Sprites/Player/basic ship.png";
let bulletSprite = "Sprites/Bullets/costume1.png";
let imagesScale = 0.115;

function startGame() {
    GameArea.start();
}

//Canvas creation

let GameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.context = this.canvas.getContext("2d");
        clearInterval(GameArea.interval);
        this.interval = setInterval(updateGameArea, 20);
        this.canvas.id = "Game-Window";
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
        let element = document.querySelector("div.GameWindow");
        element.appendChild(this.canvas);
    },

    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}


//Sprite class

class Sprite{
    constructor(imgPar, pos, type, angle, health) {
        this.imgPar = imgPar //Needs {width: none, height: none, source: none}

        this.image = new Image();
        this.image.src = imgPar.source; //Remember to make imgPar an obj in all instances

        this.current_img = this.image
        
        this.pos = pos;
        
        this.velX = 0;
        this.velY = 0;

        this.type = type

        this.angle = angle

        this.health = health

        //Tracking keypresses avoids headache
        this.keypress = {
            w: false,
            a: false,
            s: false,
            d: false
        }
    }

    update() {
        //New update function sure to bring joy to the everybody.

        let ctx = GameArea.context;

        ctx.save();

        //rotate player img
        ctx.translate(this.pos.x + this.imgPar.width/2, this.pos.y + this.imgPar.height/2);
        ctx.rotate(this.angle);

        //Images anim
        
        ctx.drawImage(this.current_img, -this.imgPar.width/2, -this.imgPar.height/2, this.imgPar.width, this.imgPar.height);

        ctx.restore();
    }
}

class Background extends Sprite{
    constructor(imgPar, imgbonus, pos, type, angle, speed) {
        super(imgPar, pos, type, angle)

        // type goes as follows - 
        // none: any type of bGround obj that follows basic rules
        // stars: stay forever
        // reverse: follows basic rules except runs opposite direction + kill at x > 1280

        this.imgBonus = new Image()
        this.imgBonus.src = imgbonus

        this.speed = speed

        this.life = true
    }

    refresh() {
        this.change_speed()
        this.update()
        this.case_edge()
    }

    change_speed() {
        this.pos.x += this.speed
    }

    case_edge() {
        if (this.pos.x < -1280 && this.type !== "reverse") {
            if (this.type === "stars") {
                this.pos.x = 1280
            } else {
                this.life = false
            }
        } else {
            if (this.pos.x > 1280 && this.type === "reverse") {
                this.life = false
            }
        }
    }
}

//Player class parent is Sprite

class Player extends Sprite{
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed, damage=1, control=false) {
        super(imgPar, pos, type, angle, health)

        this.Hp_bar = new HealthBar(this.health, this.health, this.pos.x + this.imgPar.width/2, -10)

        this.imageDouble = new Image()
        this.imageDouble.src = imgbonus

        this.bulletSound = new Audio("Audio/soundEffects/Pew.mp3")

        this.anim_len = 0

        this.firerate = firerate
        this.cooldown = 0
        this.mSpeed = maxSpeed

        this.mouseX = 0
        this.mouseY = 0

        this.mouseD = false

        this.damage = damage
        
        this.can_control = control
    }

    refresh() {
        this.shoot()
        this.actually_fire()
        this.fire_anim()
        this.reload()
        this.get_input()
        this.get_keydowns()
        this.get_angle()
        this.get_translate()
        this.update_health()
        super.update()
    }

    get_dist() {
        let element = document.querySelector("canvas");
        let elementRect = element.getBoundingClientRect();
        
        let space_left = elementRect.left;
        return space_left
    }

    get_mouse_pos () {
        document.addEventListener("mousemove", (event) => {
            let orig = this.get_dist()
            this.mouseX = event.clientX - orig - 15
            this.mouseY = event.clientY - 90 * 0.70
        })

        document.removeEventListener("mousemove", (event) => {
            let orig = this.get_dist()
            this.mouseX = event.clientX - orig - 15
            this.mouseY = event.clientY - 90
        })
    }
    
    get_angle() {
        if (this.can_control){
        this.get_mouse_pos()
        let dy = this.mouseY - this.pos.y;
        let dx = this.mouseX - this.pos.x;

        this.angle = Math.atan2(dy, dx);
        }
    }

    get_translate() {
        if (this.can_control){
        this.pos.y += this.velY
        this.pos.x += this.velX
        }
        

        //Screen wrap top-bottom

        if (this.pos.y > 720) {
            this.pos.y = -100
        }

        if (this.pos.y < -100) {
            this.pos.y = 720
        }

        //Screen wrap left-right
        
        if (this.pos.x > 1280) {
            this.pos.x = -100
        }

        if (this.pos.x < -100) {
            this.pos.x = 1280
        }

        //Lower velocity if high

        if (this.velX > 0) {
            this.velX -= 0.125
        }

        if (this.velX < 0) {
            this.velX += 0.125
        }

        // for the y velocity now

        if (this.velY > 0) {
            this.velY -= 0.125
        }

        if (this.velY < 0) {
            this.velY += 0.125
        }
    }

    get_keydowns() {
        if (this.can_control){
        if (this.keypress.w) {
            if (this.velY < 0 - this.mSpeed){

                this.velY = 0 - this.mSpeed
            } else {
                this.velY -= 0.5
            }
        } else if (this.keypress.s) {
            if (this.velY > this.mSpeed) {
                this.velY = this.mSpeed
            } else {
            this.velY += 0.5
            }
        }

        if (this.keypress.a) {
            if (this.velX < 0 - this.mSpeed){

                this.velX = 0 - this.mSpeed
            } else {
                this.velX -= 0.5
            }
        } else if (this.keypress.d) {
            if (this.velX > this.mSpeed) {
                this.velX = this.mSpeed
            } else {
            this.velX += 0.5
            }
        }
        }
    }

    get_input() {
        document.addEventListener("keydown", (event) => {
            if (event.key === "w") {
                this.keypress.w = true;
            }

            if (event.key === "a") {
                this.keypress.a = true;
            }

            if (event.key === "s") {
                this.keypress.s = true;
            }

            if (event.key === "d") {
                this.keypress.d = true;
            }
        })

        document.removeEventListener("keydown", (event) => {
            if (event.key === "w") {
                this.keypress.w = true;
            }

            if (event.key === "a") {
                this.keypress.a = true;
            }

            if (event.key === "s") {
                this.keypress.s = true;
            }

            if (event.key === "d") {
                this.keypress.d = true;
            }
        });

        document.addEventListener("keyup", (event) => {
            if (event.key === "w") {
                this.keypress.w = false;
            }

            if (event.key === "a") {
                this.keypress.a = false;
            }

            if (event.key === "s") {
                this.keypress.s = false;
            }

            if (event.key === "d") {
                this.keypress.d = false;
            }
        })

        document.removeEventListener("keyup", (event) => {
            if (event.key === "w") {
                this.keypress.w = false;
            }

            if (event.key === "a") {
                this.keypress.a = false;
            }

            if (event.key === "s") {
                this.keypress.s = false;
            }

            if (event.key === "d") {
                this.keypress.d = false;
            }
        })
    }

    ran_bullet_angle(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        let ran = Math.floor(Math.random() * (max - min + 1)) + min;
        return ran
    }

    shoot() {
        document.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.mouseD = true
            }
        })

        document.removeEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.mouseD = true
            }
        });

        document.addEventListener("mouseup", (event) => {
            if (event.button === 0){
                this.mouseD = false
        }
        })

        document.removeEventListener("mouseup", (event) => {
            if (event.button === 0){
                this.mouseD = false
        }
        });
    }

    actually_fire() {
        if (this.mouseD  && this.cooldown < 0.5) {
            if (this.type === "1" && this.firerate > 0.9) {
                this.firerate -= 0.1
            }
            this.playSound()
            this.anim_len = 0.2
            createBulletPlayer(this.pos.x + this.imgPar.width/8, this.pos.y + this.imgPar.height/4, "P", this.angle + (this.ran_bullet_angle(-2, 2))/10, this.damage, 20, 10)
            this.cooldown = this.firerate
            this.pos.x -= Math.cos(this.angle) * 5;
            this.pos.y -= Math.sin(this.angle) * 5;
        }
    }

    fire_anim() {
        if (this.anim_len > 0) {
            this.current_img = this.imageDouble
            this.anim_len -= 0.1
        } else {
            this.current_img = this.image
        }
    }

    reload() {
        if (this.cooldown > 0.5) {
            this.cooldown -= 0.1
        }

        if (this.type === "1" && this.firerate < 3 && this.mouseD === false) {
            this.firerate += 0.1
        }
    }

    update_health() {
        this.Hp_bar.H = this.health
        this.Hp_bar.x = this.pos.x - this.imgPar.width
        this.Hp_bar.y = this.pos.y - 30
        this.Hp_bar.update()
    }

    hit(damage) {
        deathExpl(-150, 720/2 + 50, "dmg")
        if (this.health - damage < 0.1) {
            this.health = 0
        } else {
            this.health -= damage
        }
    }

    playSound() {
        let variable = this.ran_bullet_angle(1, 3)

        if (variable === 1) {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        } else if (variable === 2) {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew2.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        } else {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew3.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        }
    }

    stopSound() {
        if (this.bulletSound) {
            this.bulletSound.pause()
            this.bulletSound.currentTime = 0
        }
    }
}


class Enemy extends Sprite {
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed, damage=2) {
        super(imgPar, pos, type, angle, health)

        this.Hp_bar = new HealthBar(this.health, this.health, this.pos.x + this.imgPar.width/2, -10)

        this.imageBonus = new Image()
        this.imageBonus.src = imgbonus

        this.bulletSound = new Audio("Audio/soundEffects/Pew.mp3")

        this.firerate = firerate
        this.cooldown = this.firerate

        this.mSpeed = maxSpeed

        this.turn = false

        this.brightness = 100
        this.decreaseBright = true

        this.damage = damage

        this.isDead = false

        this.enter = false
        this.loop = 0
}

    refresh() {
        this.rotate()
        this.checkDeath()
        this.update_health()
        this.move_behavior()
        this.reload()
        this.type_shoot()
        this.anim()
        this.brightness_anim()
        this.update()
    }

    brightness_anim() {
        let ctx = GameArea.context

        ctx.filter = `brightness(${this.brightness}%)`
        if (this.decreaseBright && this.brightness > 100) {
            this.brightness -= 1
        } else if(this.decreaseBright = false && this.brightness < 200) {
            this.brightness += 1
        } else {
            this.decreaseBright = true
        }
    }

    anim() {
        if (this.anim_len > 0) {
            this.current_img = this.imageBonus
            this.anim_len -= 0.1
        } else {
            this.current_img = this.image
        }
    }

    move_behavior() {
        if (this.type === "1") {
            if (this.pos.x > 1080 && this.enter === false) {
                this.pos.x -= this.mSpeed
            } else if (this.enter === false) {
                this.enter = 1
                this.turn = true
                this.loop = 30
                this.mSpeed = 1
            } else if (this.enter === 1 && this.loop > 0) {
                this.pos.x -= this.mSpeed
                this.loop -= 1
            } else if (this.enter === 1) {
                this.enter = 2
                this.loop = 50
            } else if (this.enter === 2 && this.loop > 0) {
                this.mSpeed += 0.1
                this.pos.x -= this.mSpeed
                this.loop -= 1
            } else if (this.enter === 2) {
                this.enter = 3
                this.loop = 100
            } else if (this.enter === 3 && this.loop > 0) {
                this.pos.x -= this.mSpeed
                this.loop -= 1
            } else if (this.enter === 3) {
                this.enter = 4
                this.loop = 50
            } else if (this.enter === 4 && this.loop > 0) {
                this.mSpeed -= 0.1
                this.pos.x -= this.mSpeed
                this.loop -= 1
            } else if (this.enter === 4) {
                this.enter = 5
                this.loop = 20
            } else if (this.enter === 5 && this.loop > 0) {
                this.loop -= 1
            } else if (this.enter === 5) {
                this.enter = 6
                this.mSpeed = 1
                this.loop = 30
            } else if (this.enter === 6 && this.loop > 0) {
                this.pos.x += 1
                this.loop -= 1
            } else if (this.enter === 6) {
                this.enter = 7
                this.loop = 50
            } else if (this.enter === 7 && this.loop > 0) {
                this.mSpeed += 0.1
                this.pos.x += this.mSpeed
                this.loop -= 1
            } else if (this.enter === 7) {
                this.enter = 8
                this.loop = 100
            } else if (this.enter === 8 && this.loop > 0) {
                this.pos.x += this.mSpeed
                this.loop -= 1
            } else if (this.enter === 8) {
                this.enter = 9
                this.loop = 50
            } else if (this.enter === 9 && this.loop > 0) {
                this.mSpeed -= 0.1
                this.pos.x += this.mSpeed
                this.loop -= 1
            } else if (this.enter === 9) {
                this.enter = 10
                this.loop = 20
            } else if (this.enter === 10 && this.loop > 0) {
                this.loop -= 1
            } else if (this.enter === 10) {
                this.enter = 1
                this.loop = 30
                this.mSpeed = 1
            }
        }

        if (this.type === "2") {
            if (this.pos.x < -100) {
                this.pos.x = 1280
            }
            this.pos.x -= this.mSpeed
        }
    }

    reload() {
        if (this.cooldown > 0.1) {
            this.cooldown -= 0.1
        }
    }

    type_shoot() {
        if (this.type === "1" && this.cooldown < 0.1) {
            this.spawn_bullet()
        }
        if (this.type === "2" && this.cooldown < 0.1) {
            this.spawn_bullet()
        }
    }

    spawn_bullet() {
        this.anim_len = 0.2
        createBulletEnemy(this.pos.x + this.imgPar.width/8, this.pos.y + this.imgPar.height/4, "E", this.angle + (this.ran_bullet_angle(-10, 10))/100, this.damage, 20, 10)
        this.cooldown = this.firerate
        this.playSound()
        this.pos.x -= Math.cos(this.angle) * 5;
        this.pos.y -= Math.sin(this.angle) * 5;
    }

    ran_bullet_angle(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        let ran = Math.floor(Math.random() * (max - min + 1)) + min;
        return ran
    }

    update_health() {
        this.Hp_bar.H = this.health
        this.Hp_bar.x = this.pos.x
        this.Hp_bar.y = this.pos.y - 30
        this.Hp_bar.update()
    }

    rotate() {
        if (this.turn){
            let dy = layer.pos.y - this.pos.y;
            let dx = layer.pos.x - this.pos.x;

            this.angle = Math.atan2(dy, dx);
        }
    }

    hit(damage) {
        if ((this.H - damage) < 0.1) {
            this.health = 0
        } else {
            this.decreaseBright = false
            this.health -= damage
        }
    }

    checkDeath() {
        if (this.health < 0.1) {
            deathExpl(this.pos.x, this.pos.y, "small")
            this.isDead = true
        }
    }

    playSound() {
        let variable = this.ran_bullet_angle(1, 3)

        if (variable === 1) {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        } else if (variable === 2) {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew2.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        } else {
            this.stopSound()
            this.bulletSound = new Audio("Audio/soundEffects/Pew3.mp3")
            this.bulletSound.volume = 0.2
            this.bulletSound.play()
        }
    }

    stopSound() {
        if (this.bulletSound) {
            this.bulletSound.pause()
            this.bulletSound.currentTime = 0
        }
    }

} 


class Bullet extends Sprite{
    constructor(imgPar, pos, type, angle, dmg, speed, lifetime) {
        super(imgPar, pos, type, angle) //type is targeter of bullet

        this.dmg = dmg //amount dmg
        this.speed = speed // speed of projectile
        this.life = lifetime

        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
    }

    refresh() {
        this.move()
        this.take_life()
        this.check_colide()
        this.update()
    }

    take_life() {
        if (this.type !== "outside") {
            this.life -= 0.1
        }
    }

    move() {
        this.pos.x += this.velocityX
        this.pos.y += this.velocityY
    }

    check_colide() {
        if (this.type === "P") {
        for (let i = containEnemy.length - 1; i >= 0; i--) {
            let target = containEnemy[i]

            if (this.pos.x < target.pos.x + target.imgPar.width &&
                this.pos.x + this.imgPar.width > target.pos.x &&
                this.pos.y < target.pos.y + target.imgPar.height &&
                this.pos.y + this.imgPar.height > target.pos.y) {
                    target.hit(this.dmg)
                    this.life = 0
                }
        }} else if (this.type === "E") {
                let target = layer
    
                if (this.pos.x < target.pos.x + target.imgPar.width &&
                    this.pos.x + this.imgPar.width > target.pos.x &&
                    this.pos.y < target.pos.y + target.imgPar.height &&
                    this.pos.y + this.imgPar.height > target.pos.y) {
                        target.hit(this.dmg)
                        this.life = 0}
    
}}}

class HealthBar{
    constructor(intiHealth, initMax, X, Y) {
        this.img = new Image()
        this.img.src = "Sprites/HealthBar/0.png"

        this.H = intiHealth
        this.MH = initMax

        this.len = 0
        this.color = "red"

        this.x = X
        this.y = Y
    }

    update() {
        this.len = (this.H / this.MH) * 100

        this.change_color()
        let ctx = GameArea.context;

        ctx.save();

        //rotate player img
        ctx.translate(this.x + 100/2, this.y + 10/2);

        //Images anim
        
        ctx.drawImage(this.img, -100/2, -10/2, 100, 10);

        ctx.restore();

        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.len, 10);
    }

    change_color() {
        let percentage = (this.H - 0) / (this.MH - 0);
        let green = Math.round(percentage * 255);
        let red = Math.round((1 - percentage) * 255);
        let blue = 0;
        this.color = `rgb(${red}, ${green}, ${blue})`;
    }

    
}

class Death{
    constructor(x, y, type, imgPar, source) {
        this.x = x
        this.y = y

        this.type = type

        this.image = new Image()

        if (this.type === "dmg") {
            this.image.src = ("Sprites/DeathSplosions/Dmg.png")
        } else {
        this.image.src = source
        }
        if (this.type === "dmg") {
            this.imgPar = {
                width: 1800,
                height: 1300
            }
        } else {
        this.imgPar = imgPar
        }
        this.opacity = 1
    }

    update() {
        this.change_opacity()

        let ctx = GameArea.context;

        ctx.save();

        ctx.globalAlpha = this.opacity;
        
        ctx.translate(this.x + this.imgPar.width/2 - 30, this.y);

        ctx.drawImage(this.image, -this.imgPar.width/2, -this.imgPar.height/2, this.imgPar.width, this.imgPar.height);

        ctx.globalAlpha = 1.0;

        ctx.restore()

        
    }

    change_opacity() {
        if (this.opacity > 0.1 && this.type !== "test") {
            this.opacity -= 0.1
        }
    }
}

class StartScreen {
    constructor(active) {
        this.active = active

        this.image = new Image()
        this.image.src = "Backgrounds/Play screen.png"
    }

    update() {
        this.check()

        let ctx = GameArea.context

        ctx.save();
        
        ctx.translate(1280/2, 720/2);

        ctx.drawImage(this.image, -1280/2, -720/2, 1280, 720);

        ctx.restore()

    }
    
    check() {
        document.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.active = false
            }
        })
    }
}

function preloadImg(source) {
    let newBullet = new Bullet({
        width: 100,
        height: 100,
        source: source
    },
    {x: -100, y: -100},
    "outside",
    0,
    0,
    0,
    1

)
    projectiles.push(newBullet)
}

function createEnemy(Xp, Yp, type, angle, speed, health, firerate, source, secondary, w, h) {

    let newEnemy = new Enemy({
        width: w*imagesScale,
        height: h*imagesScale,
        source: source
    }, 
    secondary,
    {x: Xp, y: Yp},
    type, 
    angle,
    health,
    firerate,
    speed
    )

    containEnemy.push(newEnemy)
}

function createBulletPlayer(Xp, Yp, type, angle, dmg, speed, lifetime) {

    let newBullet = new Bullet({
        width: 200*imagesScale,
        height: 75*imagesScale,
        source: bulletSprite
    },
    {x: Xp, y: Yp},
    type,
    angle,
    dmg,
    speed,
    lifetime
    )

    projectiles.push(newBullet)
}

function createBulletEnemy(Xp, Yp, type, angle, dmg, speed, lifetime) {

    let newBullet = new Bullet({
        width: 200*imagesScale,
        height: 75*imagesScale,
        source: "Sprites/Bullets/enemyBullet.png"
    },
    {x: Xp, y: Yp},
    type,
    angle,
    dmg,
    speed,
    lifetime
    )

    projectiles.push(newBullet)
}

function createBackground(Xp, Yp, scaleX, scaleY, type, speed, src) {
    let newBground = new Background({
        width: scaleX,
        height: scaleY,
        source: src
    }, 
    src,
    {x: Xp, y: Yp},
    type,
    0,
    speed
    )

    bGroundObj.unshift(newBground)
}

function deathExpl(Xp, Yp, type) {
    let newExpl = new Death(Xp, Yp, type, {
        width: 360,
        height: 230,
    }, "Sprites/DeathSplosions/explosion1.png")

    deaths.push(newExpl)
}

function updateStart() {
    if (start) {
        start.update()

        if (start.active) {
            // Nothing I guess
        } else {
            mainMusic.play()
            layer.can_control = true
            start_game = true
            start = null
        }
    } else {
        if (mainMusic) {
            mainMusic.addEventListener('ended', function() {
                mainMusic.currentTime = 0
                mainMusic.play()
            })
            
            mainMusic.removeEventListener('ended', function() {
                mainMusic.currentTime = 0
                mainMusic.play()
            })
        } else {
            console.log("play again?")
            mainMusic.play()
        }
    }
}

function updateDeaths(context) {
    for (let i = deaths.length - 1; i >= 0; i--) {
        let current = deaths[i];
        current.update()

        if (current.opacity < 0.1 && current.type !== "test") {
            deaths.splice(i, 1)
        }
    }
}

function updateBGround(contex) {
    for (let i = bGroundObj.length - 1; i >= 0; i --) {
        let current = bGroundObj[i];
        current.refresh()

        if (current.life) {
            let pass = {}
        } else {
            console.log("background item deleted")
            bGroundObj.splice(i, 1)
        }
    }
}

function updateProjectiles(context) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];
        projectile.refresh()

        // Remove if off-screen
        if (projectile.x < -100 || projectile.x > context.canvas.width + 100 || projectile.y < -100 || projectile.y > context.canvas.height + 100 && projectile.type !== "outside") {
            projectiles.splice(i, 1);
        }

        if (projectile.life < 0.1) {
            projectiles.splice(i, 1);
        }

    }
}

function updateEnemies(context) {
    for (let i = containEnemy.length - 1; i >= 0; i--) {
        let enemy = containEnemy[i];
        enemy.refresh()

        if (enemy.isDead) {
            console.log("enemy died")
            containEnemy.splice(i, 1)
        }
    }
}

function getBGroundPreset(preset, Y) {
    if (preset === "small1") {
        createBackground(1280, Y, 590*1.5, 350*1.5, "none", -0.4, "Backgrounds/Xtra/Planet 1.png")
    }

    if (preset === "small2") {
        createBackground(1280, Y, 590*1.5, 350*1.5, "none", -0.4, "Backgrounds/Xtra/Planet 2.png")
    }

    if (preset === "large") {
        createBackground(1280, 200, 590*2.5, 550*2.5, "none", -0.1, "Backgrounds/Xtra/Planet BIG.png")
    }
}

function checkCollision(projectile, target) {
    return (
      projectile.pos.x < target.pos.x + target.imgPar.width &&
      projectile.pos.x + projectile.imgPar.width > target.pos.x &&
      projectile.pos.y < target.pos.y + target.imgPar.height &&
      projectile.pos.y + projectile.imgPar.height > target.pos.y
    )
  }

function spawn_controller() { //USE THIS ONE IN MAIN LOOP
    if (fileData) {
        if (lel_spawn) {
            if (lel_spawn[5] === "false") {
                enemyPresets(lel_spawn[0], lel_spawn[1])
                lel_spawn[5] = "true"
            } else {
                if (lel_spawn[4] === "Continue") {
                    if (lel_spawn[3] < 0) {
                        if (lel_spawn[2] < 0.1) {
                            level += 1
                            console.log("wave ended")
                            lel_spawn = null
                        } else {
                            lel_spawn[2] -= 0.01
                        }
                    } else {
                        if (containEnemy.length <= lel_spawn[3] || lel_spawn[2] < 0.1) {
                            level += 1
                            console.log("wave ended")
                            lel_spawn = null
                        } else {
                            lel_spawn[2] -= 0.01
                        }
                    }
                } else {
                    if (lel_spawn[3] < 0) {
                        if (lel_spawn[2] < 0.1) {
                            level += 1
                            console.log("level ended")
                            levelEnd = true
                            lel_spawn = null
                            wait = 3
                        } else {
                            lel_spawn[2] -= 0.01
                        }
                    } else {
                        if (containEnemy.length <= lel_spawn[3] || lel_spawn[2] < 0.1) {
                            level += 1
                            console.log("level ended")
                            levelEnd = true
                            lel_spawn = null
                            wait = 3
                        } else {
                            lel_spawn[2] -= 0.01
                        }
                    }
                }
            }
        } else if (wait < 0.1) {
            if (level < fileData.length && levelEnd && containEnemy.length === 0){
                console.log("new level")
                lel_spawn = fileData[level].split("~")
                console.log(lel_spawn)
                lel_spawn[2] = parseInt(lel_spawn[2])
                lel_spawn[3] = parseInt(lel_spawn[3])
                levelEnd = false
            } else if (level < fileData.length && levelEnd === false) {
                console.log("new wave")
                lel_spawn = fileData[level].split("~")
                console.log(lel_spawn)
                lel_spawn[2] = parseInt(lel_spawn[2])
                lel_spawn[3] = parseInt(lel_spawn[3])
            }
        } else {
            if (levelEnd && containEnemy.length === 0) {
            wait -= 0.01
            } else if (levelEnd === false) {
                wait -= 0.01
            }
        }
    }
}

function spawn_queue() {
    if (spawn.length) {
        if (spawn[0][1] < 0.1) {
            createEnemy(spawn[0][0][0], spawn[0][0][1], spawn[0][0][2], spawn[0][0][3],spawn[0][0][4], spawn[0][0][5], spawn[0][0][6], spawn[0][0][7], spawn[0][0][8], spawn[0][0][9], spawn[0][0][10])
            spawn.shift()
        } else {
            spawn[0][1] -= 0.1
        }
        }
}

function enemyPresets(type, num) {
    // type is the enemy type, and num is the number of preset for that enemy type. This is a replica of a system that I made in scratch.
    if (type === "1") {
        if (num === "1") {
            spawn.push([[1280, 50, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 0])
            spawn.push([[1280, 100, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 4.5])
            spawn.push([[1280, 150, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 4.5])
            spawn.push([[1280, 600, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 10])
            spawn.push([[1280, 550, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 4.5])
            spawn.push([[1280, 500, "1", 3.15, 3, 10, 25, "Sprites/Enemies/Enemy1/common.png", "Sprites/Enemies/Enemy1/common2.png", 290*1.5, 250*1.5, 63], 4.5])
        }
    } else if(type === "2") {
        if (num === "1") {
            spawn.push([[1280, 355, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
            spawn.push([[1280, 255, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 3.5])
            spawn.push([[1280, 455, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
        } else if (num === "2") {
            spawn.push([[1280, 50, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
            spawn.push([[1280, 645, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
        } else if (num === "3") {
            spawn.push([[1280, 150, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
            spawn.push([[1280, 545, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
            spawn.push([[1280, 250, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 3.5])
            spawn.push([[1280, 445, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400], 0])
        }
    }
}

function is_pause() {
    if (press_again) {
        document.addEventListener("keydown", (event) => {
            if (event.key === "p" && press_again) {
                if (paused) {
                    console.log("paused")
                    let pauseimg = new Image()
                    pauseimg.src = "Backgrounds/Paused.png"

                    let ctx = GameArea.context

                    ctx.drawImage(pauseimg, 1280/2 - 145/2, 720/2 - 150/2, 145, 150)

                    paused = false
                } else if (press_again) {
                    console.log("unpaused")
                    paused = true
                }
                press_again = false
            }
        })

        document.removeEventListener("keydown", (event) => {
            if (event.key == "p" && press_again) {
                if (paused) {
                    paused = false
                } else if (press_again) {
                    paused = true
                }
                press_again = false
            }
        })
    } else {
        document.addEventListener("keyup", (event) => {
            if (event.key === "p") {
                press_again = true
            }
        })

        document.removeEventListener("keyup", (event) => {
            if (event.key === "p") {
                press_again = true
            }
        })
    }
}

createBulletEnemy(-100, 0, "outside", 0, 0, 0, 1)
createBulletPlayer(-100, 0, "outside", 0, 0, 0, 1) //Preloads bullet so img doesn't dissappear
preloadImg("Sprites/Enemies/Enemy2/basic.png")
preloadImg("Backgrounds/Paused.png")
preloadImg("Sprites/DeathSplosions/Dmg.png")
preloadImg("Sprites/Enemies/Enemy1/common.png")
deathExpl(-100, -100, "test")
createBackground(0, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
createBackground(1280, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
//getBGroundPreset("large", 250)
//createEnemy(1280, 355, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400)

let start = new StartScreen(true)


let layer = new Player({
    width: 313*imagesScale, 
    height: 207*imagesScale, 
    source: playerSprite
    }, //imgParamaters
    "Sprites/Player/basic ship2.png", // 2nd img
    {x: 1280/2, y: 720/2},//pos
    "1", //type represents the player's ship (basic actions etc.)
    1.5, //angle
    20, //health
    1.5, //firerate
    10, //speed
    0.5 //damage
)

function updateGameArea() {
    if (paused) {
        GameArea.clear();

        let ctx = GameArea.context;

        if (start_game) {
            spawn_controller()
        }

        updateBGround(ctx)
        updateDeaths(ctx)
        updateEnemies(ctx)

        layer.refresh()
        updateProjectiles(ctx)

        updateStart(ctx)
        spawn_queue()
    }

    is_pause()
}
