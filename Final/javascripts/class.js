//Grid Movement
const utils = {
    withGrid(n) {
       return n * 16
    },
    asGridCoord(x,y){
        return `${x*16},${y*16}`
    },
    nextPosition(initialX, initialY, direction) {
        let x = initialX
        let y = initialY
        const size = 16
        if (direction === "left") {
            x -= size
        } else if (direction === "right"){
            x += size
        }else if (direction === "up"){
            y -= size
        }else if (direction === "down"){
            y += size
        }
           return {x,y} 
    }
}

//Direction Control
class DirectionInput {
    constructor(){
        this.heldDirections = []
        this.map = {
            "ArrowUp": "up",
            "KeyW": "up",
            "ArrowDown": "down",
            "KeyS": "down",
            "ArrowLeft": "left",
            "KeyA": "left",
            "ArrowRight": "right",
            "KeyD": "right",
        }
        this.isPlayerRight = true
    }

    get direction(){
        return this.heldDirections[0]
    }

    get standingState(){
        return this.isPlayerRight
    }

    init(){
        document.addEventListener("keydown", e => {
            const dir = this.map[e.code]
            if (dir && this.heldDirections.indexOf(dir) === -1) {
                this.heldDirections.unshift(dir)
            }
        })
        document.addEventListener("keyup", e => {
            const dir  = this.map[e.code]
            const index = this.heldDirections.indexOf(dir)
            if (index > -1){
                this.heldDirections.splice(index, 1)
            }
        })
        document.addEventListener("keypress", ({key}) => {
            switch (key) {
                case "d": 
                this.isPlayerRight = true
                break
                case "a":
                this.isPlayerRight = false
                break
                case "ArrowRight":
                this.isPlayerRight = true
                break
                case "ArrowLeft":
                this.isPlayerRight = false
                break
            }
        })
    }
}

//Sprite
class Sprite {
    constructor(config) {
        //Image initialization
        this.image = new Image()
        this.image.src = config.src
        this.image.onload = () => {
            this.isLoaded = true
        }
        //Animation Initialization
        this.animations = config.animations || {
            "stand-right": [ [0,0] ],
            "stand-left": [ [7,0] ],
            "squat" : [ [0,0], [1,0], [2,0], [3,0] ],
            "walk-right" : [ [0,1], [1,1], [2,1], [3,1] ],
            "walk-left" : [ [4,1], [5,1], [6,1], [7,1] ]
        }
        this.currentAnimation = config.currentAnimation || "stand-right"
        this.currentAnimationFrame = 0

        this.animationFrameLimit = config.animationFrameLimit || 16
        this.animationFrameProgress = this.animationFrameLimit

        //Reference the game object
        this.gameObject = config.gameObject
    }

    get frame() {
        return this.animations[this.currentAnimation][this.currentAnimationFrame]
    }

    setAnimation(key) {
        if (this.currentAnimation != key){
            this.currentAnimation = key
            this.currentAnimationFrame = 0
            this.animationFrameProgress = this. animationFrameLimit
        }
    }

    updateAnimationProgress() {
        if(this.animationFrameProgress > 0) {
            this.animationFrameProgress -=1
            return
        }

        this.animationFrameProgress = this.animationFrameLimit
        this.currentAnimationFrame += 1

        if (this.frame === undefined) {
            this.currentAnimationFrame = 0
        }
    }

    draw(c) {
        const x = this.gameObject.x
        const y = this.gameObject.y
        const scale = this.gameObject.scale

        const [frameX, frameY] = this.frame
        this.isLoaded && c.drawImage(
            this.image,
            frameX * 32, frameY * 32,
            32,32,
            x,y,
            scale,scale 
        )
        this.updateAnimationProgress()
    }
}

//Game Object
class GameObject {
    constructor(config) {
        this.isMounted = false
        this.x = config.x
        this.y = config.y
        this.scale = config.scale
        this.directtion = config.direction
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src
        })
    }

    // mount(map) {
    //     this.isMounted = true
    //     map.addWall(this.x, this.y)
    // }

    update(){

    }
}

//Person
class Person extends GameObject{
    constructor(config) {
        super(config)
        this.movingProgressRemaining = 0    

        this.isPlayerControlled = config.isPlayerControlled || false

        this.directionUpdate = {
            "up": ["y", -1],
            "down": ["y", 1],
            "left": ["x", -1],
            "right": ["x", 1]
        } 
    }

    update(state) {
        if (this.movingProgressRemaining > 0) {
            this.updatePosition()
        } else {
            if (this.isPlayerControlled && state.arrow){
                this.startBehavior(state, {
                    type: "walk",
                    direction: state.arrow
                })
            }
            this.updateSprite(state)

        }
    }

    startBehavior(state, behavior) {
        //Set direction
        this.direction = behavior.direction
        if (behavior.type === "walk") {

            //Stop
            if (state.map.isSpaceTaken(this.x + 8, this.y + 16, this.direction)) {
                return
            }

            //Move
            // state.map.moveWall(this.x + 8, this.y + 16, this.direction)
            this.movingProgressRemaining = 16
        }
    }

    updatePosition() {
            const [property, change] = this.directionUpdate[this.direction]
            this[property] += change
            this.movingProgressRemaining -=1
    }

    updateSprite(state) {
        if (this.movingProgressRemaining > 0 && state.standingState){
            this.sprite.setAnimation("walk-right")
            return
        }
        if (this.movingProgressRemaining > 0 && !state.standingState){
            this.sprite.setAnimation("walk-left")
            return
        }
        if (state.standingState) {
            this.sprite.setAnimation("stand-right")
        }
        if (!state.standingState) {
            this.sprite.setAnimation("stand-left")
        }

    }
}

//Map
class Map {
    constructor(config) {
        this.gameObjects = config.gameObjects
        this.walls = config.walls || {}

        this.lowerImage = new Image()
        this.lowerImage.src = config.lowerSrc

        this.upperImage = new Image()
        this.upperImage.src = config.upperSrc
    }

    drawLowerImage(c){
        c.drawImage(this.lowerImage, 0, 0)
    }

    drawUpperImage(c){
        c.drawImage(this.upperImage, 0, 0)
    }

    isSpaceTaken(currentX, currentY, direction){
        const {x,y} = utils.nextPosition(currentX, currentY, direction)
        return this.walls[`${x},${y}`] || false
    }

    // mountObjects() {
    //     Object.values(this.gameObjects).forEach(o => {
    //         o.mount(this)
    //     })
    // }

    // addWall(x,y) {
    //     this.walls[`${x},${y}`] = true
    // }
    // removeWall(x,y) {
    //     delete this.walls[`${x},${y}`] 
    // }
    // moveWall(wasX, wasY, direction) {
    //     this.removeWall(wasX, wasY)
    //     const {x,y} = utils.nextPosition(wasX, wasY, direction)
    //     this.addWall(x,y)
    // }
}

window.Maps = {
    communityRoom: {
        lowerSrc: "../images/lowerMap.png",
        upperSrc: "../images/upperMap.png",
        gameObjects: {
            hero: new Person({
                isPlayerControlled: true,
                x: utils.withGrid(0) + 8,
                y: utils.withGrid(6),
                scale: 32,
                src: "../images/hero.png"
            })
        },
        walls: {
            //Left side
            [utils.asGridCoord(0,5)] : true,
            [utils.asGridCoord(1,5)] : true,
            [utils.asGridCoord(0,8)] : true,
            [utils.asGridCoord(1,8)] : true,
            [utils.asGridCoord(1,4)] : true,
            [utils.asGridCoord(1,11)] : true,
            [utils.asGridCoord(1,10)] : true,
            [utils.asGridCoord(1,9)] : true,

            //Up side
            [utils.asGridCoord(2,3)] : true,
            [utils.asGridCoord(3,3)] : true,
            [utils.asGridCoord(4,3)] : true,
            [utils.asGridCoord(5,3)] : true,
            [utils.asGridCoord(6,3)] : true,
            [utils.asGridCoord(7,2)] : true,
            [utils.asGridCoord(7,3)] : true,
            [utils.asGridCoord(8,1)] : true,
            [utils.asGridCoord(9,2)] : true,
            [utils.asGridCoord(10,2)] : true,
            [utils.asGridCoord(11,2)] : true,
            [utils.asGridCoord(12,2)] : true,
            [utils.asGridCoord(13,1)] : true,
            [utils.asGridCoord(14,2)] : true,
            [utils.asGridCoord(15,2)] : true,
            [utils.asGridCoord(16,2)] : true,
            [utils.asGridCoord(17,2)] : true,
            [utils.asGridCoord(18,2)] : true,
            [utils.asGridCoord(19,2)] : true,
            [utils.asGridCoord(20,1)] : true,

            //Right side
            [utils.asGridCoord(21,2)] : true,
            [utils.asGridCoord(21,3)] : true,
            [utils.asGridCoord(21,4)] : true,
            [utils.asGridCoord(21,5)] : true,
            [utils.asGridCoord(21,6)] : true,
            [utils.asGridCoord(21,7)] : true,
            [utils.asGridCoord(21,8)] : true,
            [utils.asGridCoord(21,9)] : true,
            [utils.asGridCoord(21,10)] : true,
            [utils.asGridCoord(21,11)] : true,

            //Down side
            [utils.asGridCoord(20,12)] : true,
            [utils.asGridCoord(19,12)] : true,
            [utils.asGridCoord(18,12)] : true,
            [utils.asGridCoord(17,12)] : true,
            [utils.asGridCoord(16,12)] : true,
            [utils.asGridCoord(15,12)] : true,
            [utils.asGridCoord(14,12)] : true,
            [utils.asGridCoord(13,12)] : true,
            [utils.asGridCoord(12,12)] : true,
            [utils.asGridCoord(11,12)] : true,
            [utils.asGridCoord(10,12)] : true,
            [utils.asGridCoord(9,12)] : true,
            [utils.asGridCoord(8,12)] : true,
            [utils.asGridCoord(7,12)] : true,
            [utils.asGridCoord(6,12)] : true,
            [utils.asGridCoord(5,12)] : true,
            [utils.asGridCoord(4,12)] : true,
            [utils.asGridCoord(3,12)] : true,
            [utils.asGridCoord(2,12)] : true,

            //keys
            [utils.asGridCoord(4,8)] : true,
            [utils.asGridCoord(3,9)] : true,
            [utils.asGridCoord(4,9)] : true,
            [utils.asGridCoord(5,9)] : true,

            [utils.asGridCoord(8,8)] : true,
            [utils.asGridCoord(7,9)] : true,
            [utils.asGridCoord(8,9)] : true,
            [utils.asGridCoord(9,9)] : true,

            //Table

            [utils.asGridCoord(13,9)] : true,
            [utils.asGridCoord(14,9)] : true,

            [utils.asGridCoord(16,9)] : true,
            [utils.asGridCoord(17,9)] : true,

            [utils.asGridCoord(19,9)] : true,
            [utils.asGridCoord(20,9)] : true,

            //Character
            [utils.asGridCoord(9,3)] : true,
            [utils.asGridCoord(11,3)] : true
        }
    }
}


//World
class World {
    constructor(config){
        this.element = config.element
        this.canvas = this.element.querySelector(".game-canvas")
        this.c = this.canvas.getContext("2d")
        this.isEmailed = config.isEmailed || false
    }

    startGameLoop() {
        const step = () => {

            //Clear Canvas
            this.c.clearRect(0, 0, this.canvas.width, this.canvas.height)

            //Lower Layer
            this.map.drawLowerImage(this.c)

            //Game Object
            Object.values(this.map.gameObjects).forEach(object => {
                object.update({
                    standingState: this.directionInput.standingState,
                    arrow: this.directionInput.direction,
                    map: this.map
                })
                object.sprite.draw(this.c)
            })

            //Upper Layer
            this.map.drawUpperImage(this.c)

            requestAnimationFrame(() => {
                step()
            }) 
        }
        step()
    }

    init() {
        this.map = new Map(window.Maps.communityRoom)
        // this.map.mountObjects()
        this.directionInput = new DirectionInput()
        this.directionInput.init()
        this.startGameLoop()
    }
}