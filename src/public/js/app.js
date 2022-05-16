const socket = io();

const myFace = document.getElementById("myFace");
const peerFace = document.getElementById("peerFace");

const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const title = document.getElementById("title");

call.hidden = true;

let myStream;
let myPeerConnection;
let muted = false;
let cameraOff = false;
let roomName;

async function getCameras() {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const cameras = devices.filter((device) => device.kind === "videoinput");
		const currentCamera = myStream.getVideoTracks()[0];
		cameras.forEach((camera) => {
			const option = document.createElement("option");
			option.value = camera.deviceId;
			option.innerText = camera.label;
			if (currentCamera.label === camera.label) {
				option.selected = true;
			}
			camerasSelect.appendChild(option);
		});
	} catch (e) {
		console.log(e);
	}
}

async function getMedia(deviceId) {
	const initialConstrains = {
		audio: true,
		video: {facingMode: "user"},
	};
	const cameraConstraints = {
		audio: true,
		video: {deviceId: {exact: deviceId}},
	};
	try {
		myStream = await navigator.mediaDevices.getUserMedia(
			deviceId ? cameraConstraints : initialConstrains
		);
		myFace.srcObject = myStream;
		if (!deviceId) {
			await getCameras();
		}
	} catch (e) {
		console.log(e);
	}
}

function handleMuteClick() {
	myStream
		.getAudioTracks()
		.forEach((track) => (track.enabled = !track.enabled));
	if (!muted) {
		muteBtn.innerText = "🔈";
		muted = true;
	} else {
		muteBtn.innerText = "🔇";
		muted = false;
	}
}
function handleCameraClick() {
	myStream
		.getVideoTracks()
		.forEach((track) => (track.enabled = !track.enabled));
	if (cameraOff) {
		cameraBtn.innerText = "🎥 ❌";
		cameraOff = false;
	} else {
		cameraBtn.innerText = "🎥 ✅";
		cameraOff = true;
	}
}

async function handleCameraChange() {
	await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
	welcome.hidden = true;
	call.hidden = false;
	await getMedia();
	makeConnection();
}

async function handleWelcomeSubmit(event) {
	event.preventDefault();
	const input = welcomeForm.querySelector("input");
	roomName = input.value;
	input.value = "";
	await initCall();
	// SEQ: first1, second1
	socket.emit("join_room", roomName, () => {
		// alert(`${roomName}방으로 환영합니다.`);
		title.innerText = `ROOM ${roomName}`;
	});
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

// SEQ: first2(누가 들어왔다는 신호를 받으면)
socket.on("welcome", async () => {
	console.log("someone joined");
	const offer = await myPeerConnection.createOffer();
	myPeerConnection.setLocalDescription(offer);
	socket.emit("offer", offer, roomName); // SEQ: first3
});

// SEQ: second2
socket.on("offer", async (offer) => {
	console.log("offer??");
	myPeerConnection.setRemoteDescription(offer);
	const answer = await myPeerConnection.createAnswer();
	myPeerConnection.setLocalDescription(answer);
	socket.emit("answer", answer, roomName);
	console.log("sent the answer");
});

// SEQ: first4
socket.on("answer", (answer) => {
	console.log("received the answer");
	myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
	console.log("아이스 받았당");
	myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
	myPeerConnection = new RTCPeerConnection();
	myPeerConnection.addEventListener("icecandidate", handleIce);
	myPeerConnection.addEventListener("addstream", handleAddStream);
	myStream
		.getTracks()
		.forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
	socket.emit("ice", data.candidate, roomName);
	console.log("아이스 주기");
}

function handleAddStream(data) {
	console.log("애드 스트림~~~");
	const peerStream = data.stream;
	console.log(myStream, peerStream);
	peerFace.srcObject = peerStream;
}
