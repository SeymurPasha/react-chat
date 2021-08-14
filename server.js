const app = require('express')();
const express = require('express');

const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const path = require('path');

var cors = require('cors')

const io = require("socket.io")(http, {
  cors: {
    /* origin with  "*" sign allows client connection from all urls. Please specify based on your requirements, e.g., origin: "http://example.com/"  */
    origin: "*",  
    methods: ["GET", "POST"]
  }
});

let roomList = []

app.use(cors())


/* Run npm start and open http://localhost:3000/ in your browser */
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


/* Opens new socket connection for each connected customer  */
io.on('connection', (socket) => {
  

  /* On customer join event join room with unique roomID  */
  socket.on('join', roomID => {
    if(roomID.length > 0) {
      socket.join(roomID)
      roomList = [...roomList, roomID]
      
      /* Emit new customer event to agent dashboard with unique roomID */
      io.emit('new customer', roomID)
    }
  }); 

  /* On agent join event agent joins room and emits agent available event. This will cause indicator to turn green from red.  */
  socket.on('agent join', data => {
    socket.join(data.toRoom)
    io.in(data.toRoom).emit('agent available', data);
  })

  /* On chat message event send messages to room */
  socket.on('chat message', msg => {
    io.in(msg.toRoom).emit('chat message', msg);
    }); 
  
  /* On typing socket event , set typing state to true or false */
  socket.on('typing', (data) => {
    /* Socket to room will send it to all room participants, except sender. 
    Please refer toEmit cheatsheet for more info : https://socket.io/docs/v3/emit-cheatsheet/index.html */
    socket.to(data.id).emit('typing', data)
  })

  /* On socket disconnect event notify and  console log number of clients left connected */
  socket.on("disconnect", () => {
  console.log('socket disconnection', io.engine.clientsCount);
  });

});


http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
