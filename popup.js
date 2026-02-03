const toggle = document.getElementById("navigatorToggle")

chrome.storage.sync.get({ showNavigator: false }, (data) => {
    toggle.checked = data.showNavigator
})

toggle.addEventListener("change", () => {
    chrome.storage.sync.set({
        showNavigator: toggle.checked,
    })
})
