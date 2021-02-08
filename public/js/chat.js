const socket = io()
//Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")//We render the templates here
const $sidebar = document.querySelector("#sidebar")

//Templates to render in $messages (Mustache library)
const messageTemplate= document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options (qs library)
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})
const formatTime = (time) => {
    return moment(time).format("ddd, MMM Do YYYY h:mm a")
}

const autoScroll = () => {
    //New message
    const $newMessage = $messages.lastElementChild

    //Height if the new message
    //const newMessageStyles = getComputedStyle($newMessage)
    //const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    //const newMessageHeight = $newMessage.offsetHeight = newMessageMargin

    //Visible height
    //const visibleHeight = $messages.offsetHeight

    //Height of messages container
    //const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    //const scrollOffset = $messages.scrollTop + visibleHeight

    //if(containerHeight - newMessageHeight <= scrollOffset){
        //$messages.scrollTop = $messages.scrollHeight
        $newMessage.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
    //}
}
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: formatTime(message.createdAt)
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: formatTime(locationMessage.createdAt)
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //prevent reload after submission

    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', e.target.elements.message.value, (ackMes) => {//target is the chatForm.

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('The message was delivered!', ackMes)
    }) 
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {lat: position.coords.latitude, long: position.coords.longitude}, () => {
            console.log('Location shared')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})