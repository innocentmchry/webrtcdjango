const APP_ID = 'bc9073d2d0ec40a080189fa5b36dfad5'
const CHANNEL = 'main'
const TOKEN = '007eJxTYOB+OzE5VX1P8VuRniU/jCdujT+k8KPn6b8Xz9P8FS8kvzVVYEhKtjQwN04xSjFITTYxSDSwMDC0sExLNE0yNktJS0wxNTIwSG0IZGQ48bmYiZEBAkF8FobcxMw8BgYA/OshuA=='



let UID;

// object or interface for providing the local client with basic funcs for voice and video calls such as joining stream and publishing tracks or subscrbing to other users tracks
const client = AgoraRTC.createClient({mode: 'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {} 

let joinAndDisplayLocalStream = async() => {

    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    //uid is null so its returning a uid also it joins the channel or room
    UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    // This will get user audio and video tracks and store them in array. [0] is audio [1] is camera track
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let player = `<div class="video-container" id="user-container-${UID}">
    <div class="username-wrapper"><span class="user-name">My Name</span></div>
    <div class="video-player" id="user-${UID}"></div>
    </div>`
    
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    // looks for id inside dom and plays in our browser
    localTracks[1].play(`user-${UID}`)

    // this gonna publish for other users to see
    await client.publish([localTracks[0], localTracks[1]])
    
}

let handleUserJoined = async (user, mediaType) => {
    //add the user to remote users
    remoteUsers[user.uid] = user

    // local client object subscribes to the existing users
    await client.subscribe(user, mediaType)

    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)

        // if user already exist
        if(player != null){
            player.remove()
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
        <div class="username-wrapper"><span class="user-name">My Name</span></div>
        <div class="video-player" id="user-${user.uid}"></div>
        </div>`
        
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }

    // if(mediaType === 'audio'){
    //     user.audioTrack.play()
    // }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

joinAndDisplayLocalStream()


