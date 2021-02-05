const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const port = process.env.PORT || 3000 /* Port assigned in heroku */
const app = express()
const server = http.createServer(app)
const publicDirectory = path.join(__dirname, '../public')
const io = socketio(server)

app.use(express.static(publicDirectory))

io.on('connection', (socket) => {
    console.log('New websocket connection')
    //socket.broadcast.emit('message', generateMessage('A new user has joined!'))
    socket.on('join', ({username, room}, callbackACK) => {
        const {error, user} = addUser({id:socket.id, username, room})

        if(error) {
            return callbackACK(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome!'))
        socket.broadcast.to(room).emit('message', generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callbackACK()
    })

    socket.on('sendMessage', (message, callbackACK) => {
        const {username, room} = getUser(socket.id)
        io.to(room).emit('message', generateMessage(username, message))
        callbackACK('Delivered!')//acknowledgment
    })
    socket.on('sendLocation' , (coords, callbackACK) => {
        const {username, room} = getUser(socket.id)
        io.to(room).emit('locationMessage', generateLocationMessage(username, coords))
        callbackACK()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }        
    })
})

server.listen(port, () =>{
    console.log('Server is up on port ', port)
})