const html = require('xou');
const vxv = require('vxv');
const dotify = require('./utils/dotify');

const styles = vxv`
top: 41px;
left: 0;
right: 0;
position: fixed;
background: white;
border-bottom: solid #E0E0E0 1px;
display: none;
opacity: 0;
transition: opacity .3s;

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  white-space: nowrap;
}

li {
  display: inline-block;
  width: 180px;
  padding: 10px 16px;
  border-right: solid #E0E0E0 1px;
  font-size: 12px;
  position: relative;
  cursor: pointer;
}

li.active {
  border-bottom: solid black 1px;
}

.close {
  position: absolute;
  right: 7px;
  top: 9px;
  opacity: 0;
  cursor: pointer;
}

li:hover .close {
  opacity: 1;
}
`;

let hidden = false;

module.exports = (emitter, state) => {
  state.views = state.views || [];
  state.activeView = state.activeView || 0;
  state.closedTabs = state.closedTabs || [];

  const render = () => {
    const el = html`
      <div id="tabs" class="${styles}">
        <ul>
          ${state.views.map((view, id) => {
            const webview = document.querySelector(`#${view.id}`);
            const active = id === state.activeView;

            let title = 'Loading';
            try {
              title = dotify(webview.getTitle());
            } catch {}

            if (!title) {
              try {
                title = dotify(webview.getURL());
              } catch {}
            }

            return html`
              <li class="${active ? 'active' : ''}" onclick=${() => {
                state.activeView = id;
                emitter.emit('webview-change', id);
                emitter.emit('tabs-render');
              }}>
                ${title}
                <span class="close" onclick=${e => {
                  e.stopPropagation();
                  emitter.emit('tabs-close', id);
                }}>×</span>
              </li>
            `;
          })}
        </ul>
      </div>
    `;

    el.style.display = hidden ? 'none' : 'block';
    el.style.opacity = hidden ? '0' : '1';
    return el;
  };

  const element = render();
  document.body.appendChild(element);

  emitter.on('tabs-render', () => {
    html.update(element, render());
  });

  emitter.on('tabs-toggle', () => {
    hidden = !hidden;
    emitter.emit('tabs-render');
  });

  emitter.on('tabs-create', url => {
    emitter.emit('webview-create', url);
    state.activeView = state.views.length - 1;
    emitter.emit('tabs-render');
  });

  emitter.on('tabs-close', index => {
    const view = state.views[index];
    if (!view) return;

    const webview = document.querySelector(`#${view.id}`);
    if (webview) {
      state.closedTabs.push({
        url: webview.getURL(),
        title: webview.getTitle()
      });
    }

    emitter.emit('webview-remove', index);
    state.views.splice(index, 1);

    if (state.activeView >= state.views.length) {
      state.activeView = state.views.length - 1;
    }

    emitter.emit('tabs-render');
  });

  emitter.on('tabs-remove-current', () => {
    if (state.activeView < 0) return;
    emitter.emit('tabs-close', state.activeView);
  });

  emitter.on('tabs-reopen', () => {
    if (!state.closedTabs.length) return;
    const tab = state.closedTabs.pop();
    emitter.emit('tabs-create', tab.url);
  });
};