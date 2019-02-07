const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow

function createWindow () {
    mainWindow = new BrowserWindow({width: 1024, height: 768, webPreferences: {nodeIntegration: false}})
        mainWindow.loadURL('http://localhost:8000/main.html');
    mainWindow.setMenu(null);
    mainWindow.webContents.clearHistory();
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})
