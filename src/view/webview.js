const html = require('xou');
const vxv = require('vxv');
const { parse } = require('tldjs');
const normalizeUrl = require('normalize-url');
const url = require('url');
const path = require('path');
const remote = require('@electron/remote');

const pages = require('./utils/pages');
const uuid = require('./utils/uuid');

module.exports = (emitter, state) => {
  let focusedView = -1;
  const closedTabs = [];

  const didStartLoading = () => emitter.emit('progress-start');

  const didStopLoading = () => {
    const webview = document.querySelector(`#${state.views[focusedView].id}`);
    if (webview) webview.style.background = 'white';
    emitter.emit('progress-stop');
  };

  const pageTitleUpdated = () => {
    const webview = document.querySelector(`#${state.views[focusedView].id}`);
    try {
      state.title = webview.getTitle();
      state.url = webview.getURL();
    } catch {
      state.title = 'Loading';
      state.url = '';
    }

    emitter.emit('titlebar-title-updated');
    emitter.emit('tabs-render');
  };

  const didNavigate = () => {
    const webview = document.querySelector(`#${state.views[focusedView].id}`);
    state.url = webview.getURL();

    emitter.emit('titlebar-url-updated');
    emitter.emit('history-add', {
      url: state.url,
      title: webview.getTitle()
    });
  };

  const loadingError = () => {
    const webview = document.querySelector(`#${state.views[focusedView].id}`);
    webview.setAttribute('src', './pages/error.html');
  };

  const create = src => {
    const id = '_wv_' + uuid();

    const startURL = src
      ? src
      : `file://${path.join(__dirname, '../pages/home.html')}#${state.theme}`;

    const viewElement = html`
      <div style="display:none">
        <webview
          id="${id}"
          src="${startURL}"
          style="width:100%; height: calc(100vh - 40px);"
          allowpopups
        ></webview>
      </div>
    `;

    document.body.appendChild(viewElement);

    state.views.push({ element: viewElement, id });
    changeView(state.views.length - 1);

    const webview = document.querySelector(`#${id}`);

    webview.addEventListener('did-start-loading', didStartLoading);
    webview.addEventListener('did-stop-loading', didStopLoading);
    webview.addEventListener('page-title-updated', pageTitleUpdated);
    webview.addEventListener('did-navigate', didNavigate);
    webview.addEventListener('did-navigate-in-page', didNavigate);
    webview.addEventListener('did-fail-load', loadingError);

    webview.addEventListener('before-input-event', event => {
      const i = event.input;
      const isMac = process.platform === 'darwin';
      const key = i.key.toLowerCase();

      if (
        (isMac && i.meta && i.shift && key === 'd') ||
        (!isMac && i.control && i.shift && key === 'd')
      ) {
        event.preventDefault();
        emitter.emit('open-devtools');
        return;
      }

      if (
        (isMac && i.meta && !i.shift && key === 'h') ||
        (!isMac && i.control && !i.shift && key === 'h')
      ) {
        event.preventDefault();
        emitter.emit('webview-history');
        return;
      }

      if (
        (isMac && i.meta && i.shift && i.key === 'ArrowLeft') ||
        (!isMac && i.control && i.shift && i.key === 'ArrowLeft')
      ) {
        event.preventDefault();
        emitter.emit('tabs-prev');
        return;
      }

      if (
        (isMac && i.meta && i.shift && i.key === 'ArrowRight') ||
        (!isMac && i.control && i.shift && i.key === 'ArrowRight')
      ) {
        event.preventDefault();
        emitter.emit('tabs-next');
        return;
      }

      if (
        (isMac && i.meta && key === '0') ||
        (!isMac && i.control && key === '0')
      ) {
        event.preventDefault();
        emitter.emit('tabs-last');
        return;
      }

      if (
        ((isMac && i.meta) || (!isMac && i.control)) &&
        key >= '1' &&
        key <= '9'
      ) {
        event.preventDefault();
        emitter.emit('tabs-go-to', Number(key) - 1);
        return;
      }

      if (
        (isMac && i.meta && !i.shift && key === 'w') ||
        (!isMac && i.control && !i.shift && key === 'w')
      ) {
        event.preventDefault();
        emitter.emit('tabs-remove-current');
        return;
      }
    });

    return state.views.length - 1;
  };

  const changeView = id => {
    if (focusedView >= 0 && state.views[focusedView]) {
      state.views[focusedView].element.style.display = 'none';
    }

    state.views[id].element.style.display = 'block';
    focusedView = id;

    pageTitleUpdated();
    emitter.emit('tabs-render');
  };

  const remove = id => {
    const el = state.views[id];
    if (!el) return;

    const webview = document.querySelector(`#${el.id}`);
    if (webview) {
      closedTabs.push(webview.getURL());
    }

    el.element.remove();
    state.views.splice(id, 1);

    if (state.views.length === 0) {
      emitter.emit('webview-create');
      return;
    }

    changeView(Math.max(0, id - 1));
  };

  emitter.on('webview-create', create);
  emitter.on('webview-remove', remove);
  emitter.on('webview-change', changeView);

  emitter.on('tabs-reopen', () => {
    const url = closedTabs.pop();
    if (!url) return;
    emitter.emit('webview-create', url);
  });

  emitter.on('open-devtools', () => {
    const win = remote.getCurrentWindow();
    win.webContents.openDevTools({ mode: 'bottom' });
  });

  emitter.on('webview-history', () => {
    const webview = document.querySelector(`#${state.views[focusedView].id}`);
    webview.loadURL(`file://${path.join(__dirname, '../pages/history.html')}`);
  });

  emitter.on('tabs-next', () => {
    if (focusedView + 1 < state.views.length) changeView(focusedView + 1);
  });

  emitter.on('tabs-prev', () => {
    if (focusedView > 0) changeView(focusedView - 1);
  });

  emitter.on('tabs-go-to', id => {
    if (id >= 0 && id < state.views.length) changeView(id);
  });

  emitter.on('tabs-last', () => {
    changeView(state.views.length - 1);
  });
};