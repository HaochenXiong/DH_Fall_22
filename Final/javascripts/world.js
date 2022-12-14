(function () {

    //BGM
    const bgm = document.querySelector("#bgm")
    bgm.loop = true
    bgm.load()
    bgm.play()

    //World Initialization
    const world = new World({
        element: document.querySelector(".game-container")
    })
    world.init()

})()

