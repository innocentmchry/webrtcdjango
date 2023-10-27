const APP_ID = '67cfc50c50834b7293ed8598993d29bd'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))

let NAME = sessionStorage.getItem('name')
let EMAIL = sessionStorage.getItem('email')

// object or interface for providing the local client with basic funcs for voice and video calls such as joining stream and publishing tracks or subscrbing to other users tracks
const client = AgoraRTC.createClient({mode: 'rtc', codec:'vp8'})

let videoTrack = []
let audioTrack = []
let remoteUsers = {}
let ADMIN = false

let joinAndDisplayLocalStream = async() => {
    document.getElementById('room-name').innerText = CHANNEL

    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try {
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    } catch(e) {
        console.error(e)
        window.open('/', '_self')
    }

    //Custom Video Track

    var constraints = window.constraints = { audio: true, video: true};    
    await navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            // Get all the available video tracks.
            var videoTracks = stream.getVideoTracks();
            console.log('Using video device: ' + videoTracks[0].label);

           
            videoTrack = AgoraRTC.createCustomVideoTrack({
                mediaStreamTrack: videoTracks[0],
            });

        })
        .catch(function(error) {
        console.log(error);
        });


    // videoTrack = await AgoraRTC.createCameraVideoTrack()

    audioTrack = await AgoraRTC.createMicrophoneAudioTrack()

    let member = await createMember()

    let player = `<div class="video-container" id="user-container-${UID}">
    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
    <video class="video-player" id="user-${UID}" autoplay ></video>
    </div>`
    
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
 
    console.log("member role: ", member.role)

    if (member.role == "admin"){
        ADMIN = true
        loadModels(`user-${UID}`, `user-container-${UID}`)
    }
    else {
        videoTrack.play(`user-${UID}`, {fit : "cover"})
    }

    // this gonna publish for other users to see
    await client.publish([audioTrack, videoTrack])  
}

let loadModels = (userId, containerId) => {
    Promise.all([
        console.log("loading models"),
        faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/static/models'),
        console.log("loaded models")
    ]).then(() => {

        videoTrack.play(userId, {fit : "cover"})
        imageProcessing(userId, containerId)
    })
}


let imageProcessing = async (userId, containerId) => {
    const video = document.getElementById(userId)
    
    const container = document.getElementById(containerId)
    const canvas = faceapi.createCanvas(video)
    container.appendChild(canvas)
    
    // Set the position of the canvas to absolute
    canvas.style.position = 'absolute';
           
    // Adjust the top and left properties to overlay the canvas on top of the video
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    let dynamicVideoWidth, dynamicVideoHeight, dynamicDisplaySize

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
        dynamicVideoWidth = video.clientWidth;
        dynamicVideoHeight = video.clientHeight;
        canvas.width = dynamicVideoWidth;
        canvas.height = dynamicVideoHeight;
        dynamicDisplaySize = { width: dynamicVideoWidth, height: dynamicVideoHeight}
        faceapi.matchDimensions(canvas, dynamicDisplaySize)
        //const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const resizedDetections = faceapi.resizeResults(detections, dynamicDisplaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        //faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    }, 500)
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

        let member = await getMember(user)

        player = `<div class="video-container" id="user-container-${user.uid}">
        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
        <video class="video-player" id="user-${user.uid}" autoplay></video>
        </div>`
        
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)

        if (ADMIN){
            imageProcessing(`user-${user.uid}`,`user-container-${user.uid}`)
        }

    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    audioTrack.stop()
    audioTrack.close()
    videoTrack.stop()
    videoTrack.close()

    await client.leave()

    deleteMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) => {
    if(videoTrack.muted){
        await videoTrack.setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else {
        await videoTrack.setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let toggleMic = async (e) => {
    if(audioTrack.muted){
        await audioTrack.setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else {
        await audioTrack.setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

// its a post request
let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID': UID, 'email': EMAIL})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID': UID})
    })
    //let member = await response.json()

}



joinAndDisplayLocalStream()

// if member closes instead of leave button
window.addEventListener('beforeunload', deleteMember)

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)