document.addEventListener('DOMContentLoaded', () => {
  // Connect to websocket
  var socket = io.connect(
    location.protocol + '//' + document.domain + ':' + location.port
  );

  // When connected, configure buttons
  socket.on('connect', () => {
    var messages = [];
    var channel = '';
    const ul = document.getElementById('messages');
    const ulc = document.getElementById('channels');
    //Menu variables
    const menu = document.querySelector('.menu');
    var menuVisible = false;
    const deleted =
      '<i style="color: #888"><i class="fas fa-ban"></i> This message was deleted</i>';

    socket.emit('connected');

    socket.on('connection', (params) => {
      localStorage.setItem('user_id', params[0]);
      const username = params[2];
      document.getElementById('username').innerHTML = `Hello, ${username}.`;
      messages = params[1];
      ulc.innerHTML = '';
      Object.keys(messages).forEach((channel) => {
        const li = document.createElement('li');
        li.innerHTML = `<button class="cname" data-channel="${channel}">${channel}</button>`;
        ulc.appendChild(li);
      });
      if (localStorage.getItem('channel') === null) {
        localStorage.setItem('channel', Object.keys(messages)[0]);
      }
      channel = localStorage.getItem('channel');
      document
        .querySelectorAll(`[data-channel="${channel}"]`)[0]
        .classList.add('active');
      document.getElementById('msg').disabled = true;
      document.getElementById('focuser').disabled = true;
      if (channel !== 'Welcome') {
        document.getElementById('msg').disabled = false;
        document.getElementById('focuser').disabled = false;
      }
      messageDisplayerAll();
      channelsHandler();
    });

    function channelsHandler() {
      const buttons = Array.from(document.getElementsByClassName('cname'));
      buttons.forEach((cbutton) => {
        cbutton.onclick = () => {
          socket.emit('leaving', channel);
          document
            .querySelectorAll(`[data-channel="${channel}"]`)[0]
            .classList.remove('active');
          channel = cbutton.dataset.channel;
          socket.emit('joining', channel);
          document.getElementById('msg').disabled = true;
          document.getElementById('focuser').disabled = true;
          if (channel !== 'Welcome') {
            document.getElementById('msg').disabled = false;
            document.getElementById('focuser').disabled = false;
          }
          document
            .querySelectorAll(`[data-channel="${channel}"]`)[0]
            .classList.add('active');
          localStorage.setItem('channel', channel);
          messageDisplayerAll();
        };
      });
    }

    function messageDisplayerAll() {
      ul.innerHTML = '';
      messages[channel].forEach((element) => {
        const p = document.createElement('p');
        if (channel === 'Welcome' && element['class'] === 'system') {
          p.setAttribute('class', 'system');
          p.innerHTML = element['msg'];
          ul.appendChild(p);
        } else {
          p.setAttribute('data-index', element['index']);
          if (element['deleted'] !== undefined) {
            p.classList.add('deleted');
          }
          const span_username = document.createElement('span');
          span_username.setAttribute('class', 'username');
          const span_timestamp = document.createElement('span');
          span_timestamp.setAttribute('class', 'timestamp');
          const br = document.createElement('br');
          if (element['user_id'] === localStorage.getItem('user_id')) {
            p.classList.add('my-message');
            span_username.setAttribute('class', 'my-username');
          }
          span_username.innerText = element['username'];
          span_timestamp.innerText = element['time'];
          p.innerHTML +=
            span_username.outerHTML +
            br.outerHTML +
            element['msg'] +
            br.outerHTML +
            span_timestamp.outerHTML;
          p.setAttribute('data-index', element['index']);
          ul.appendChild(p);
        }
      });
      document.getElementById('focuser').focus();
      document.getElementById('msg').focus();
    }

    socket.on('new user', (name) => {
      messages['Welcome'].push({ msg: `${name} is here!!!!`, class: 'system' });
      if (channel === 'Welcome') {
        messageDisplayerAll();
      }
    });

    socket.on('left', (params) => {
      if (channel === params[1] && channel !== 'Welcome') {
        const p = document.createElement('p');
        p.setAttribute('class', 'system');
        p.innerHTML = `${params[0]} left this channel`;
        ul.appendChild(p);
        setTimeout(() => {
          ul.removeChild(p);
        }, 3000);
      }
    });

    socket.on('joined', (params) => {
      if (channel === params[1] && channel !== 'Welcome') {
        const p = document.createElement('p');
        p.setAttribute('class', 'system');
        p.innerHTML = `${params[0]} joined this channel`;
        ul.appendChild(p);
        setTimeout(() => {
          ul.removeChild(p);
        }, 3000);
      }
    });

    document.getElementById('msg').addEventListener('keydown', (e) => {
      if (e.keyCode == 13) {
        e.preventDefault();
        document.getElementById('send').click();
      }
    });

    document.getElementById('new').addEventListener('keydown', (e) => {
      if (e.keyCode == 13) {
        e.preventDefault();
        document.getElementById('create').click();
      }
    });

    document.getElementById('send').onclick = () => {
      document.getElementById('send').disabled = true;
      if (document.getElementById('msg').value === '') {
        return false;
      }
      const message = document.getElementById('msg').value;
      document.getElementById('msg').value = '';
      const day = new Date();
      const time = day
        .toLocaleString('en-IN', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })
        .toUpperCase();
      document.getElementById('msg').focus();
      socket.emit('msg sent', {
        message: message,
        time: time,
        channel: channel,
      });
    };

    socket.on('msg', (params) => {
      const message = params[0];
      messages[params[1]].push(message);
      if (params[2] === 0) {
        messages[params[1]].shift();
      }
      messageDisplayerAll();
    });

    socket.on('channel created', (name) => {
      messages[name] = [];
      const li = document.createElement('li');
      li.innerHTML = `<button class="cname" data-channel="${name}">${name}</button>`;
      ulc.appendChild(li);
      channelsHandler();
    });

    document.getElementById('send').disabled = true;
    document.getElementById('msg').addEventListener('keyup', (e) => {
      if (e.target.value === '') {
        document.getElementById('send').disabled = true;
      } else {
        document.getElementById('send').disabled = false;
      }
    });

    document.getElementById('create').disabled = true;
    document.getElementById('new').addEventListener('keyup', (e) => {
      if (e.target.value === '') {
        document.getElementById('create').disabled = true;
      } else {
        document.getElementById('create').disabled = false;
      }
    });

    document.getElementById('create').onclick = () => {
      document.getElementById('create').disabled = true;
      let name = document.getElementById('new').value;
      Array.from(Object.keys(messages)).forEach((n) => {
        if (name === n) {
          document.getElementById('channel-error').style.display = 'block';
          document.getElementById('new').value = '';
          name = '';
          setTimeout(() => {
            document.getElementById('channel-error').style.display = 'none';
          }, 3000);
        }
      });
      if (name === '') {
        return false;
      }
      document.getElementById('new').value = '';
      socket.emit('new channel', name);
    };

    const toggleMenu = (command) => {
      menu.style.display = command === 'show' ? 'block' : 'none';
      menuVisible = !menuVisible;
    };

    const setPosition = ({ top, left }) => {
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      toggleMenu('show');
    };

    window.addEventListener('click', (e) => {
      if (menuVisible) toggleMenu('hide');
    });

    window.addEventListener('contextmenu', (e) => {
      let classes = Array.from(e.target.classList);
      if (classes.includes('my-message') && !classes.includes('deleted')) {
        e.preventDefault();
        const origin = {
          left: e.pageX,
          top: e.pageY,
        };
        document
          .getElementById('delete')
          .setAttribute('data-index', e.target.dataset.index);
        setPosition(origin);
        return false;
      }
      classes = Array.from(e.target.parentElement.classList);
      if (classes.includes('my-message') && !classes.includes('deleted')) {
        e.preventDefault();
        const origin = {
          left: e.pageX,
          top: e.pageY,
        };
        document
          .getElementById('delete')
          .setAttribute('data-index', e.target.parentElement.dataset.index);
        setPosition(origin);
        return false;
      }
    });

    document.getElementById('delete').addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      messages[channel].forEach((object) => {
        if (object['index'] == index) {
          let ind = messages[channel].indexOf(object);
          socket.emit('delete', [channel, ind]);
        }
      });
    });

    socket.on('deleted', (params) => {
      messages[params[0]][params[1]]['msg'] = deleted;
      messages[params[0]][params[1]]['deleted'] = 0;
      messageDisplayerAll();
    });
  });
});
