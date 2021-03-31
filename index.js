const { app, BrowserWindow, Menu } = require('electron');

function createWindow () {
  let settings_file = `${app.getPath("appData")}\\unit-editor\\user-preferences.json`;
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: false,
    darkTheme: true,
    zoomFactor: 0.9,
    webPreferences: {
      nodeIntegration: true,
      additionalArguments: [`--settings_file=${settings_file}`]
    }
  });
  win.maximize();
  win.loadFile('index.html');
  win.webContents.openDevTools();

  var menu = Menu.buildFromTemplate([    
    {
      label: '&File',
      role: 'file',
      submenu: [
        {
          label: '&Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        },
        {
          label: '&Open XMLs',
          accelerator: 'CmdOrCtrl+O',
          click: function() { win.webContents.send('menu-action', 'open-xml'); }
        },
      ]
    },
    {
      label: '&Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
      ]
    },
    {
      label: '&View',
      submenu: [
        {
          label: 'Zoom in',
          accelerator: 'CmdOrCtrl+=',
          role: 'zoomIn'
        },
        {
          label: 'Reset zoom',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom'
        },
        {
          label: 'Zoom out',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut'
        },
      ]
    },
    {
      label: '&Window',
      role: 'window',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          enabled: false,
          accelerator: (function() {
            if (process.platform == 'darwin')
              return 'Alt+Command+I';
            else
              return 'Ctrl+Shift+I';
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.toggleDevTools();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          label: 'Full-screen',
          type: 'checkbox',
          accelerator: 'F11',
          role: 'togglefullscreen'
        },
      ]
    },
    {
      label: '&Preferences',
      submenu: [
        {
          label: '&XML',
          click: function() { win.webContents.send('menu-action', 'preferences-editor'); }
        },
        {
          label: '&Theme',
          click: function() { win.webContents.send('menu-action', 'preferences-theme'); }
        },
      ]
    },
    {
      label: '&Help',
      role: 'help',
      submenu: [
        {
          label: 'Contact creator',
          click: function() { require('electron').shell.openExternal('https://www.moddb.com/members/keremey57') }
        },
      ]
    },
  ]);
  Menu.setApplicationMenu(menu); 
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})
