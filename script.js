"use strict";

//variables
let player;
let b_ground;
let stars1;
let projectiles = []
let bGroundObj = []

// 6.3 === full rotation new Component(..., angle)
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
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed) {
        super(imgPar, pos, type, angle, health)

        this.imageDouble = new Image()
        this.imageDouble.src = imgbonus

        this.anim_len = 0

        this.firerate = firerate
        this.cooldown = 0
        this.mSpeed = maxSpeed

        this.mouseX = 0
        this.mouseY = 0

        this.mouseD = false
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
            this.mouseY = event.clientY - 90
        })

        document.removeEventListener("mousemove", (event) => {
            let orig = this.get_dist()
            this.mouseX = event.clientX - orig - 15
            this.mouseY = event.clientY - 90
        })
    }
    
    get_angle() {
        this.get_mouse_pos()
        let dy = this.mouseY - this.pos.y;
        let dx = this.mouseX - this.pos.x;

        this.angle = Math.atan2(dy, dx);
    }

    get_translate() {
        this.pos.y += this.velY
        this.pos.x += this.velX
        
        

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
            this.anim_len = 0.2
            createBulletPlayer(this.pos.x + this.imgPar.width/8, this.pos.y + this.imgPar.height/4, "P", this.angle + (this.ran_bullet_angle(-2, 2))/10, 1, 20, 10)
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
}


class Enemy extends Sprite {
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed) {
        super(imgPar, pos, type, angle, health)

        this.imageBonus = new Image()
        this.imageBonus.src = imgbonus

        this.firerate = firerate
        this.cooldown = this.firerate

        this.mSpeed = maxSpeed
}

    refresh() {
        this.move_behavior()
        this.update()
    }

    move_behavior() {
        if (this.type === "1") {
            // Enemy Type 1 actions
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
        if (this.type === "2" && this.cooldown < 0.1) {
            this.spawn_bullet()
        }
    }

    spawn_bullet() {
        this.anim_len = 0.2
        createBulletPlayer(this.pos.x + this.imgPar.width/8, this.pos.y + this.imgPar.height/4, "P", this.angle + (this.ran_bullet_angle(-2, 2))/10, 1, 20, 10)
        this.cooldown = this.firerate
        this.pos.x -= Math.cos(this.angle) * 5;
        this.pos.y -= Math.sin(this.angle) * 5;
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
            console.log("bullet deleted")
        }

        if (projectile.life < 0.1) {
            console.log("bullet deleted")
            projectiles.splice(i, 1);
        }
    }
}

createBulletEnemy(-100, 0, "outside", 0, 0, 0, -1)
createBulletPlayer(-100, 0, "outside", 0, 0, 0, -1) //Preloads bullet so img doesn't dissappear
createBackground(0, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
createBackground(1280, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
createBackground(1280, 500, 590*1.5, 350*1.5, "none", -0.8, "Backgrounds/Xtra/Planet 1.png")

let layer = new Player({
    width: 313*imagesScale, 
    height: 207*imagesScale, 
    source: playerSprite
    }, //imgParamaters
    "Sprites/Player/basic ship2.png", // 2nd img
    {x: 0, y: 0},//pos
    "1", //type represents the player's ship (basic actions etc.)
    1.5, //angle
    20, //health
    1.5, //firerate
    10 //speed
)

function updateGameArea() {
    GameArea.clear();

    let ctx = GameArea.context;

    updateBGround(ctx)

    layer.refresh()
    updateProjectiles(ctx)
}
