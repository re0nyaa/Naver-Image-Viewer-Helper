;(() => {
    const img = document.getElementById("viewer")
    if (!img) return

    img.removeAttribute("onmousedown")

    let scale = 1
    let tx = 0,
        ty = 0
    let isSpace = false
    let dragging = false
    let sx = 0,
        sy = 0

    const MIN = 0.2
    const MAX = 5

    img.style.transformOrigin = "center center"

    let hud = null
    let miniImg, viewBox, slider

    function apply() {
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
        if (hud) updateMiniMap()
        if (slider) slider.value = scale * 100
    }
    function resetView() {
        scale = 1
        tx = 0
        ty = 0
        apply()
    }

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            isSpace = true
            document.body.style.cursor = "grab"
            img.style.cursor = "grab"
            e.preventDefault()
        } else if (e.code === "Escape") {
            resetView()
            e.preventDefault()
        }
    })

    window.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
            isSpace = false
            dragging = false
            document.body.style.cursor = "pointer"
            img.style.cursor = "pointer"
        }
    })

    document.addEventListener(
        "mousedown",
        (e) => {
            if (isSpace) {
                dragging = true
                sx = e.clientX - tx
                sy = e.clientY - ty
                document.body.style.cursor = "grabbing"
                img.style.cursor = "grabbing"
                e.preventDefault()
                e.stopPropagation()
            } else {
                window.close()
            }
        },
        true,
    )

    window.addEventListener("mousemove", (e) => {
        if (!dragging) return
        tx = e.clientX - sx
        ty = e.clientY - sy
        apply()
    })

    window.addEventListener("mouseup", () => {
        dragging = false
        if (isSpace) {
            document.body.style.cursor = "grab"
            img.style.cursor = "grab"
        }
    })

    window.addEventListener(
        "wheel",
        (e) => {
            if (!e.altKey) return
            e.preventDefault()
            scale += e.deltaY < 0 ? 0.1 : -0.1
            scale = Math.min(MAX, Math.max(MIN, scale))
            apply()
        },
        { passive: false },
    )

    function createNavigator() {
        if (hud) return

        hud = document.createElement("div")
        hud.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 280px;
      padding: 14px;
      background: rgba(25,25,25,0.75);
      backdrop-filter: blur(6px);
      border-radius: 6px;
      z-index: 9999;
      color: white;
      font-family: system-ui;
    `

        const mapSize = 80

        const map = document.createElement("div")
        map.style.cssText = `
      width: ${mapSize}px;
      height: ${mapSize}px;
      overflow: hidden;
      background: #111;
      position: relative;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.2);
    `

        miniImg = document.createElement("img")
        miniImg.src = img.src
        miniImg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform-origin: center center;
      pointer-events: none;
      opacity: 0.9;
    `

        viewBox = document.createElement("div")
        viewBox.style.cssText = `
      position: absolute;
      border: 2px solid #4da3ff;
      border-radius: 6px;
      pointer-events: none;
    `

        map.append(miniImg, viewBox)

        slider = document.createElement("input")
        slider.type = "range"
        slider.min = MIN * 100
        slider.max = MAX * 100
        slider.value = scale * 100
        slider.style.width = "100%"

        slider.oninput = () => {
            scale = slider.value / 100
            apply()
        }

        const btns = document.createElement("div")
        btns.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    `

        function mkBtn(txt, fn) {
            const b = document.createElement("button")
            b.textContent = txt
            b.style.cssText = `
        background: #fff;
        border: none;
        border-radius: 10px;
        padding: 6px 12px;
        cursor: pointer;
      `
            b.onclick = fn
            return b
        }

        btns.append(
            mkBtn("🔍 −", () => {
                scale = Math.max(MIN, scale - 0.1)
                apply()
            }),
            mkBtn("🔍 +", () => {
                scale = Math.min(MAX, scale + 0.1)
                apply()
            }),
        )

        hud.append(map, slider, btns)
        document.body.appendChild(hud)

        updateMiniMap()
    }

    function removeNavigator() {
        if (!hud) return
        hud.remove()
        hud = null
    }

    function updateMiniMap() {
        if (!img.naturalWidth || !miniImg) return

        const mapSize = 80

        const baseScale = Math.min(
            mapSize / img.naturalWidth,
            mapSize / img.naturalHeight,
        )

        miniImg.style.transform = `translate(-50%, -50%) scale(${baseScale})`

        const vw = window.innerWidth / (img.naturalWidth * scale)
        const vh = window.innerHeight / (img.naturalHeight * scale)

        const boxW = Math.min(1, vw) * mapSize
        const boxH = Math.min(1, vh) * mapSize

        viewBox.style.width = `${boxW}px`
        viewBox.style.height = `${boxH}px`

        const maxX = (img.naturalWidth * scale - window.innerWidth) / 2
        const maxY = (img.naturalHeight * scale - window.innerHeight) / 2

        const nx = maxX ? tx / maxX : 0
        const ny = maxY ? ty / maxY : 0

        viewBox.style.left = `${mapSize / 2 - boxW / 2 - nx * (mapSize / 2)}px`
        viewBox.style.top = `${mapSize / 2 - boxH / 2 - ny * (mapSize / 2)}px`
    }

    chrome.storage.sync.get({ showNavigator: true }, (data) => {
        if (data.showNavigator) createNavigator()
    })

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return
        if (!changes.showNavigator) return

        if (changes.showNavigator.newValue) {
            createNavigator()
        } else {
            removeNavigator()
        }
    })

    if (img.complete) apply()
    else img.onload = apply
})()
