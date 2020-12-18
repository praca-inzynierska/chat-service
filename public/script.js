const socket = io()
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

var allMessages = []

if (messageForm != null) {
  // const name = prompt('What is your name?')

  // appendMessage('dołączył: ' + userName)
  socket.emit('new-user', roomName, userName)
  socket.emit('get-all-messages', roomName)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`${userName}: ${message}`)
    // allMessages.append(`${userName}: ${data.message}`)
    allMessages.push(`${userName}: ${message}`)
    socket.emit('send-chat-message', roomName, message, allMessages)
    messageInput.value = ''
  })
}

socket.on('room-created', room => {
  // appendMessage(`You: ${room.roomName}`)
  const roomElement = document.createElement('div')
  roomElement.innerText = room.roomName
  const roomLink = document.createElement('a')
  roomLink.href = `/${room.roomName}?name=${room.userName}`
  roomLink.innerText = 'join'
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
  allMessages.append(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
  // clearMessages()
  socket.emit('get-all-messages', roomName)
  // appendMessage(`dołączył ${name}`)
})

socket.on('get-messages', messages => {
  allMessages = JSON.parse(messages)
  clearMessages()
  for(let msg of allMessages) {
    appendMessage(msg)
  }
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} rozłączył się`)
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}

function clearMessages() {
  messageContainer.innerHTML = ""
}
