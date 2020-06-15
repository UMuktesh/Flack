document.addEventListener('DOMContentLoaded', () => {
  // Connect to websocket
  var socket = io.connect(
    location.protocol + '//' + document.domain + ':' + location.port
  );

  // When connected, configure buttons
  socket.on('connect', () => {
    var messages = [];
    var channel = '';

    socket.emit('connected');

    socket.on('connection', (params) => {
      localStorage.setItem('user_id', params[0]);
      messages = params[1];
      const ul = document.getElementById('channels');
      ul.innerHTML = '';
      Object.keys(messages).forEach((channel) => {
        const li = document.createElement('li');
        li.innerHTML =
          '<button class="cname" data-channel="' +
          channel +
          '">' +
          channel +
          '</button>';
        ul.appendChild(li);
      });
      if (localStorage.getItem('channel') === null) {
        localStorage.setItem('channel', Object.keys(messages)[0]);
      }
      channel = localStorage.getItem('channel');
      const ulm = document.getElementById('messages');
      ulm.innerHTML = '';
      messages[channel].forEach((element) => {
        const li = document.createElement('li');
        if (element['user_id'] === localStorage.getItem('user_id')) {
          li.setAttribute('class', 'my-message');
        }
        li.innerHTML =
          element['msg'] +
          '---' +
          element['username'] +
          '---' +
          element['time'];
        ulm.appendChild(li);
      });
    });

    const buttons = Array.from(document.getElementsByClassName('cname'));
    Array.from(buttons).forEach((cbutton) => {
      cbutton.onclick = () => {
        channel = cbutton.dataset.channel;
        alert(channel);
        const ul = document.getElementById('messages');
        ul.innerHTML = '';
        messages[channel].forEach((element) => {
          const li = document.createElement('li');
          if (element['user_id'] === localStorage.getItem('user_id')) {
            li.setAttribute('class', 'my-message');
          }
          li.innerHTML =
            element['msg'] +
            '---' +
            element['username'] +
            '---' +
            element['time'];
          ul.appendChild(li);
        });
      };
    });

    document.getElementById('send').onclick = () => {
      document.getElementById('send').disabled = true;
      if (document.getElementById('msg').value === '') {
        return false;
      }
      const message = document.getElementById('msg').value;
      document.getElementById('msg').value = '';
      const day = new Date();
      const time =
        ('0' + day.getHours()).slice(-2) +
        ':' +
        ('0' + day.getMinutes()).slice(-2);
      socket.emit('msg sent', { message: message, time: time });
    };

    socket.on('msg', (message) => {
      const ul = document.getElementById('messages');
      const li = document.createElement('li');
      if (message['user_id'] === localStorage.getItem('user_id')) {
        li.setAttribute('class', 'my-message');
      }
      li.innerHTML =
        message['msg'] + '---' + message['username'] + '---' + message['time'];
      ul.appendChild(li);
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
      if (document.getElementById('new').value === '') {
        return false;
      }
      const channel = document.getElementById('new').value;
      document.getElementById('new').value = '';
      socket.emit('new channel', channel);
    };
  });
});
