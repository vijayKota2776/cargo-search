const html = require('xou');
const vxv = require('vxv');
const alert = require('./alert.js');
const dotify = require('./utils/dotify');

const styles = vxv`
height: calc(100vh - 40px);
overflow: auto;

ul {
  margin: 0;
  padding: 0;
  overflow: hidden;
  max-width: 720px;
  margin: auto;
}

li {
  text-align: left;
  display: block;
  margin: 0px auto;
  border: solid #efefef 1px;
  padding: 10px;
  margin: 10px;
}

.title {
  font-size: 1.3em;
}

.time {
  font-size: .8em;
  color: #757575;
}

.url {
  font-size: .9em;
}

a {
  color: black;
}

a:hover {
  text-decoration: underline;
}
`;

const overlayStyles = vxv`
width: 550px;
height: 38px;
position: fixed;
top: 0px;
margin: 0px auto;
z-index: 100;
background: white;
left: 0px;
right: 0px;
text-align: center;
line-height: 38px;
font-size: .8em;
`;

module.exports = (emitter, state) => {
  state.history = state.history || [];

  let toggle = false;
  let closeOverlay = () => {};

  const titleBarOverlay = html`
    <div id="history-overlay" class="${overlayStyles}">History</div>
  `;

  const element = html`
    <div id="history" class="${styles}">
      <ul class="history"></ul>
    </div>
  `;

  const render = () => {
    const list = element.querySelector('.history');
    list.innerHTML = '';

    state.history
      .slice()
      .reverse()
      .forEach(item => {
        const date = new Date(item.timestamp);

        const li = html`
          <li>
            <span class="title">${dotify(item.title || 'Untitled', 30)}</span>
            <span class="time">${date.toLocaleString()}</span>
            <br>
            <span class="url">
              <a onclick=${() => {
                item.closed = false;
                emitter.emit('tabs-create', item.url);
                closeOverlay();
                toggle = false;
                document.body.removeChild(titleBarOverlay);
              }}>
                ${dotify(item.url, 50)}
              </a>
            </span>
          </li>
        `;

        list.appendChild(li);
      });
  };

  emitter.on('history-toggle', () => {
    if (toggle) {
      closeOverlay();
      document.body.removeChild(titleBarOverlay);
      toggle = false;
      return;
    }

    render();
    closeOverlay = alert({
      text: element,
      position: 'bottom'
    });

    document.body.appendChild(titleBarOverlay);
    toggle = true;
  });

  emitter.on('history-add', ({ url, title }) => {
    state.history.push({
      url,
      title,
      timestamp: Date.now(),
      closed: false
    });
  });
};