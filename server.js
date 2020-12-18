const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const axios = require('axios');

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = {}

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  // Send message that new room was created
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  console.log(req.params)
  // console.log(req.query.name)
  if (rooms[req.params.room] == null) {
    // return res.redirect('/')
    rooms[req.params.room] = { users: {} }
    io.emit('room-created', { roomName: req.params.room, userName: req.query.name })
  }
  res.render('room', { roomName: req.params.room, userName: req.query.name })
})

server.listen(8083)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    console.log(rooms, name)
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
  })
  socket.on('send-chat-message', (room, message, allMessages) => {
    console.log('saving', message)
    console.log(allMessages)
    postMessages(JSON.stringify(allMessages), room)
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })

  })
  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
  socket.on('save-messages', (messages, room) => {
    console.log('saving', messages)
    postMessages(JSON.stringify(messages), room)
  })

  socket.on('get-all-messages', (room) => {
    getMessages(socket, room)
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

function getMessages(socket, room) {
  // history_file = "../server-data/board-" + board.name + ".json";
  // var json = $.getJSON("server-data/board-" + board.name + ".json", function(json) {
  //     console.log(json); // this will show the info it in firebug console
  // });
  // let json = require(history_file);
  // var taskId = board.name;
  // var state = JSON.parse(json);
  console.log(room)
  var url = `http://localhost:8080/taskSessions/` + room + `/tool_state/chat`
  var headers = {
      "Token": 'chat_status'
  };
  axios.get(url, {
          headers: headers
      })
      .then(function (response) {
        console.log("res")
        console.log(response)
        console.log(response.data.status)
        console.log(JSON.parse(response.data.status))
        socket.emit('get-messages', response.data.status)
      })

}

function postMessages(messages, room) {

  var url = `http://localhost:8080/taskSessions/` + room + `/tool_state/chat`
  var data = {
      taskSessionId: room,
      status: messages,
      name: room,
      type: "chat"
  };
  var headers = {
      "Token": 'chat_status'
  };
  axios.post(url, data, {
          headers: headers
      })
      .then(function (response) {

      })
}


