const socket = new WebSocket('ws://localhost:3003');
const messagesSection = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
let currentRoom = 'general'; // Default room is General

// Initialize message history arrays for each room
const messageHistories = {
  general: [],
  room1: [],
  room2: []
};

function switchRoom(roomName) {
  document.querySelectorAll('.room').forEach(room => {
    room.classList.remove('active');
  });
  document.getElementById(roomName).classList.add('active');
  currentRoom = roomName;
  messagesSection.innerHTML = '';
  messageHistories[currentRoom].forEach(message => {
    handleMessage(message);
  });
  messagesSection.scrollTop = messagesSection.scrollHeight;
  if (socket.readyState === WebSocket.OPEN) {
    updateOnlineStatus(true);
  } else {
    console.warn('WebSocket connection is not open yet.');
  }
}

function updateOnlineStatus(online) {
  const username = sessionStorage.getItem('user');
  if (username) {
    socket.send(JSON.stringify({ online: online, username: username, room: currentRoom }));
  }
}

socket.onmessage = function(event) {
  console.log('Message received:', event.data);
  if (event.data instanceof Blob) {
    const reader = new FileReader();
    reader.onload = function() {
      try {
        const jsonData = JSON.parse(reader.result);
        handleMessageAndHistory(jsonData);
      } catch (error) {
        console.error('Error parsing Blob data as JSON:', error);
      }
    };
    reader.readAsText(event.data);
    return;
  }
  try {
    const message = JSON.parse(event.data);
    handleMessageAndHistory(message);
  } catch (error) {
    console.error('Error parsing JSON message:', error);
  }
};

socket.onopen = function() {
  updateOnlineStatus(true);
};

function handleMessageAndHistory(message) {
  if (!messageHistories[message.room]) {
    messageHistories[message.room] = [];
  }
  const onlineStatus = sessionStorage.getItem('onlineStatus');
  let userOnlineStatus = {};
  if (onlineStatus) {
    userOnlineStatus = JSON.parse(onlineStatus);
  }
  userOnlineStatus[message.username] = message.online;
  sessionStorage.setItem('onlineStatus', JSON.stringify(userOnlineStatus));
  messageHistories[message.room].push(message);
  if (message.room === currentRoom) {
    handleMessage(message);
  }
  if (message.online !== undefined) {
    updateUserOnlineStatus(message.username, message.online);
  }
}

function updateUserOnlineStatus(username, online) {
  const messages = document.querySelectorAll('p');
  messages.forEach(message => {
    const messageUsername = message.querySelector('strong').textContent.replace(':', '').trim();
    if (messageUsername === username) {
      const presenceElement = message.querySelector('div');
      if (presenceElement) {
        presenceElement.style.color = online ? "#2ecc71" : "#95a5a6";
      }
    }
  });
}

document.getElementById('sendButton').addEventListener('click', () => {
  const message = messageInput.value.trim();
  const username = sessionStorage.getItem('user');
  const online = navigator.onLine;
  if (message !== '' && username) {
    socket.send(JSON.stringify({ text: message, room: currentRoom, username: username, online: online }));
    messageInput.value = '';
  } else {
    console.error('Username not found in sessionStorage');
    alert("Log in to send messages.");
  }
});

window.onload = function() {
  switchRoom('general');
  const login = document.getElementById('login');
  const username = sessionStorage.getItem('user');
  if (username) {
    login.innerText = 'Log Out';
  } else {
    login.innerText = 'Login';
  }
};

function handleMessage(message) {
  const online = message.online;
  const filterInput = document.getElementById('filterInput');
  const filterValue = filterInput.value.toLowerCase();
  if (message.text && message.text.toLowerCase().includes(filterValue)) {
    const messageElement = document.createElement('p');
    const usernameElement = document.createElement('strong');
    const timestampElement = document.createElement('span');
    const timestamp = new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const presenceElement = document.createElement('div');
    presenceElement.textContent = " \u25CF";
    presenceElement.style.color = message.online ? "#2ecc71" : "#95a5a6";
    messageElement.appendChild(presenceElement);

    usernameElement.textContent = message.username + ": ";
    messageElement.appendChild(usernameElement);

    const textNode = document.createTextNode(message.text);
    messageElement.appendChild(textNode);

    timestampElement.textContent = ' [' + timestamp + ']';
    messageElement.appendChild(timestampElement);

    messagesSection.appendChild(messageElement);

    messagesSection.scrollTop = messagesSection.scrollHeight;
    console.log(online, textNode);
  }
}

document.getElementById('filterInput').addEventListener('input', () => {
  messagesSection.innerHTML = '';
  messageHistories[currentRoom].forEach(message => {
    handleMessage(message);
  });
});

function redirectToLoginPage() {
  const login = document.getElementById('login');
  const username = sessionStorage.getItem('user');
  if (username) {
    sessionStorage.removeItem('user');
    window.location.href = '/';
  } else {
    window.location.href = "login";
  }
}

window.addEventListener('beforeunload', function() {
  updateOnlineStatus(false);
});

function handleOfflineNotification(username, online, room) {
  const messages = document.querySelectorAll('p');
  messages.forEach(message => {
    const messageUsername = message.querySelector('strong').textContent.replace(':', '').trim();
    if (messageUsername === username && message.dataset.room === room) {
      const dot = message.querySelector('div');
      if (dot) {
        dot.style.color = online ? "#2ecc71" : "#95a5a6";
      }
    }
  });
}
