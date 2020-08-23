const { app, BrowserWindow, Tray, Menu, systemPreferences} = require('electron')

const windowStateKeeper = require('electron-window-state');
const { Console } = require('console');
const path = require('path');
const Store = require('electron-store');
const appFolder = path.dirname(process.execPath)
const updateExe = path.resolve(appFolder, '..', 'Update.exe')
const exeName = path.basename(process.execPath)
const homedir = require('os').homedir();

var AutoLaunch = require('auto-launch')

var messagesAutoLauncher = new AutoLaunch({
    name: 'Google Messages Web Abb',
    path: path.join(homedir, '/Appdata/Local/google_web_messages/google_web_messages.app')
})

let win
let tray = null

const store = new Store({
    // We'll call our data file 'user-preferences'
    configName: 'user-preferences',
    defaults: {
      isExit: false,
      runOnStart: false
    }
});

console.log('isExit = ' + store.get('isExit'))
console.log('runOnStart = '+ store.get('runOnStart'))
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

app.on('ready', function(){

    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    })

    win = new BrowserWindow({
        'x' : mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        // icon: ('C:/Users/vince/AppData/Local/google_web_messages/app-1.0.0/resources/app/Resources/message.ico')
        icon: path.join(homedir, '/AppData/Local/google_web_messages/app-1.0.0/resources/app/Resources/message.ico')
    })

    mainWindowState.manage(win);
    win.loadURL('https://messages.google.com/web/conversations');
    win.removeMenu();

    win.once('ready-to-show', () => {
        win.show();
    })

    win.on('close', function (event) {
      event.preventDefault();
      win.hide();
      if(store.get('isExit') == true){
          console.log(store.get('isExit'))
          app.exit()
      } else{
        console.log(store.get('isExit'))
      }
    })
    
    win.on('restore', function (event) {
      win.show();
    })

    tray = createTray()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})

function handleSquirrelEvent(application) {
if (process.argv.length === 1) {
    return false;
}

const ChildProcess = require('child_process');
const path = require('path');

const appFolder = path.resolve(process.execPath, '..');
const rootAtomFolder = path.resolve(appFolder, '..');
const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
const exeName = path.basename(process.execPath);

const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
        spawnedProcess = ChildProcess.spawn(command, args, {
            detached: true
        });
    } catch (error) {}

    return spawnedProcess;
};

const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
};

const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            application.quit();
            return true;
    }
};

function createTray() {
    let appIcon = new Tray(path.join(homedir, '/AppData/Local/google_web_messages/app-1.0.0/resources/app/Resources/message.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                appIcon.destroy();
                app.isQuiting = true;
                app.quit();
                app.exit();
            }
        },
        {   
            label: 'Settings',
            submenu: [
                {
                    label: 'Quit App on close button',
                    type: "checkbox",
                    click: function () {
                        store.set('isExit', !store.get('isExit'))
                        console.log(store.get('isExit'))
                        checked: store.get('isExit');
                    },
                    checked: store.get('isExit')
                },
                {
                    label: 'Run on startup',
                    type: "checkbox",
                    click: function () {
                        store.set('runOnStart', !store.get('runOnStart'))
                        console.log(store.get('runOnStart'))
                        if(store.get('runOnStart') == true){
                            messagesAutoLauncher.enable()
                            console.log("The app will now startup upon Windows login")
                        } else {
                            messagesAutoLauncher.disable()
                            console.log("The app will not startup in Windows")
                        }
                        checked: store.get('runOnStart')
                    },
                    checked: store.get('runOnStart')
                }
            ]
        },

    ]);

    appIcon.on('double-click', function (event) {
        win.show();
    });
    appIcon.setToolTip('Messages Tray');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}