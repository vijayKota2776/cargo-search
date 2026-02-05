const { Menu, MenuItem, dialog } = require('@electron/remote');

module.exports = (emitter, state) => {
  const menu = new Menu();

  if (process.platform === 'darwin') {
    menu.append(new MenuItem({ role: 'appMenu' }));
  }

  const submenuTemplate = [
    {
      label: 'New Tab',
      accelerator: 'CommandOrControl+T',
      click: () => emitter.emit('tabs-create')
    },
    {
      label: 'Reopen Closed Tab',
      accelerator: 'CommandOrControl+Shift+T',
      click: () => emitter.emit('tabs-reopen')
    },
    {
      label: 'Close Tab',
      accelerator: 'CommandOrControl+W',
      click: () => emitter.emit('tabs-remove-current')
    },
    { type: 'separator' },
    {
      label: 'Back',
      accelerator: 'Alt+Left',
      click: () => emitter.emit('webview-back')
    },
    {
      label: 'Forward',
      accelerator: 'Alt+Right',
      click: () => emitter.emit('webview-forward')
    },
    { type: 'separator' },
    {
      label: 'Reload',
      accelerator: 'CommandOrControl+R',
      role: 'reload'
    },
    {
      label: 'Force Reload',
      accelerator: 'F5',
      role: 'forceReload'
    },
    { type: 'separator' },
    {
      label: 'Last Tab',
      accelerator: 'CommandOrControl+0',
      click: () => emitter.emit('tabs-last')
    },
    {
      label: 'Previous Tab',
      accelerator: 'CommandOrControl+Shift+Left',
      click: () => emitter.emit('tabs-prev')
    },
    {
      label: 'Next Tab',
      accelerator: 'CommandOrControl+Shift+Right',
      click: () => emitter.emit('tabs-next')
    },
    { type: 'separator' },
    {
      label: 'Open DevTools',
      accelerator: 'CommandOrControl+Shift+D',
      click: () => emitter.emit('open-devtools')
    },
    {
      label: 'Open Home',
      accelerator: 'CommandOrControl+Shift+H',
      click: () => emitter.emit('webview-home')
    },
    {
      label: 'Open History',
      accelerator: 'CommandOrControl+Y',
      click: () => emitter.emit('webview-history')
    }
  ];

  for (let i = 1; i <= 9; i++) {
    submenuTemplate.push({
      label: `Tab ${i}`,
      accelerator: `CommandOrControl+${i}`,
      click: () => emitter.emit('tabs-go-to', i - 1)
    });
  }

  const submenu = Menu.buildFromTemplate(submenuTemplate);

  menu.append(new MenuItem({ label: 'File', submenu }));

  Menu.setApplicationMenu(menu);
};