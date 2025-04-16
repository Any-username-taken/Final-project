"use strict";

//variables
let player;
let b_ground;
let stars1;
let projectiles = []
let bGroundObj = []
let containEnemy = []
let spawn = []
let deaths = []

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
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed, damage=1) {
        super(imgPar, pos, type, angle, health)

        this.Hp_bar = new HealthBar(this.health, this.health, this.pos.x + this.imgPar.width/2, -10)

        this.imageDouble = new Image()
        this.imageDouble.src = imgbonus

        this.anim_len = 0

        this.firerate = firerate
        this.cooldown = 0
        this.mSpeed = maxSpeed

        this.mouseX = 0
        this.mouseY = 0

        this.mouseD = false

        this.damage = damage
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
        if (this.health - damage < 0.1) {
            this.health = 0
        } else {
            this.health -= damage
        }
    }
}


class Enemy extends Sprite {
    constructor(imgPar, imgbonus, pos, type, angle, health, firerate, maxSpeed, damage=2) {
        super(imgPar, pos, type, angle, health)

        this.Hp_bar = new HealthBar(this.health, this.health, this.pos.x + this.imgPar.width/2, -10)

        this.imageBonus = new Image()
        this.imageBonus.src = imgbonus

        this.firerate = firerate
        this.cooldown = this.firerate

        this.mSpeed = maxSpeed

        this.turn = false

        this.brightness = 100
        this.decreaseBright = true

        this.damage = damage
}

    refresh() {
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
            this.turn = true
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
        createBulletEnemy(this.pos.x + this.imgPar.width/8, this.pos.y + this.imgPar.height/4, "E", this.angle + (this.ran_bullet_angle(-10, 10))/100, this.damage, 20, 10)
        this.cooldown = this.firerate
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
    constructor(x, y, type, imgPar) {
        this.x = x
        this.y = y

        this.type = type

        this.image = new Image()
        this.image.src = imgPar.src

        this.imgPar = imgPar

        this.opacity = 1.0
    }

    update() {
        this.change_opacity()

        ctx = GameArea.context;

        ctx.save();

        ctx.globalAlpha = this.opacity;

        ctx.drawImage(this.image, -this.imgPar.width/2, -this.imgPar.height/2, this.imgPar.width, this.imgPar.height);

        ctx.globalAlpha = 1;

        ctx.restore()

        
    }

    change_opacity() {
        if (this.opacity > 0.05) {
            this.opacity -= 0.05
        }
    }
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
        height: 360,
        src: "/workspaces/Final-project/Sprites/DeathSplosions/EXPLOSION small.png"
    })

    deaths.push(newExpl)
}

function updateDeaths(context) {
    for (let i = deaths.length - 1; i >= 0; i--) {
        let current = deaths[i];
        current.update()

        if (current.opacity < 0.1) {
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
            console.log("bullet deleted")
        }

        if (projectile.life < 0.1) {
            console.log("bullet deleted")
            projectiles.splice(i, 1);
        }

    }
}

function updateEnemies(context) {
    for (let i = containEnemy.length - 1; i >= 0; i--) {
        let enemy = containEnemy[i];
        enemy.refresh()

        if (enemy.health < 0.1) {
            deathExpl(enemy.pos.x, enemy.pos.y, "small")
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
        //Enemy 1 presets go here
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

createBulletEnemy(-100, 0, "outside", 0, 0, 0, 1)
createBulletPlayer(-100, 0, "outside", 0, 0, 0, 1) //Preloads bullet so img doesn't dissappear
createBackground(0, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
createBackground(1280, -100, 1280, 900, "stars", -0.1, "Backgrounds/Final Bground Final.png")
//getBGroundPreset("large", 250)
//createEnemy(1280, 355, "2", 3.15, 3, 20, 6, "Sprites/Enemies/Enemy2/basic.png", "Sprites/Enemies/Enemy2/basic2.png", 920, 400)

enemyPresets("2", "3")

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
    10, //speed
    0.5 //damage
)

function updateGameArea() {
    GameArea.clear();

    let ctx = GameArea.context;

    spawn_queue()

    updateBGround(ctx)
    updateDeaths(ctx)
    updateEnemies(ctx)

    layer.refresh()
    updateProjectiles(ctx)
}
