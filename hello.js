const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Serve HTML file
  if (req.url === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }else if (req.url === '/login') {
    fs.readFile('login.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading login.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }else if(req.url === '/users.json'){
    fs.readFile('users.json', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading users.json');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
  else {
    res.writeHead(404);
    res.end('Page not found');
  }
});

// Create a WebSocket server by passing the HTTP server instance
const wss = new WebSocket.Server({ server });

// Event listener for WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Event listener for messages from clients
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    
    // Broadcast the received message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

// Event listener for closing connections
ws.on('close', () => {
  console.log('Client disconnected');
  const offlineUsername = ws.username; // Get the username of the offline user
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      // Broadcast a message indicating that the user is offline
      client.send(JSON.stringify({ online: false, username: offlineUsername }));
    }
  });
});

});

// Start the HTTP server and WebSocket server
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
