const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Helper function to serve static files
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end(`Error loading ${filePath}`);
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    serveStaticFile(res, 'index.html', 'text/html');
  } else if (req.url === '/login') {
    serveStaticFile(res, 'login.html', 'text/html');
  } else if (req.url === '/users.json') {
    serveStaticFile(res, 'users.json', 'application/json');
  } else if (req.url === '/styles.css') {
    serveStaticFile(res, 'styles.css', 'text/css');
  } else if (req.url === '/functions.js') {
    serveStaticFile(res, 'functions.js', 'application/javascript');
  } else {
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
