import http from "http";
import express from "express";
import webSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// TODO: use는 왜쓰는거지..
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));

const handleListen = () => {
	console.log("success port 3001");
};

const sockets = [];

const server = http.createServer(app);
const wss = new webSocket.Server({server});

wss.on("connection", (socket) => {
	sockets.push(socket);
	socket["nickname"] = "Anon";

	socket.on("message", (message) => {
		const msg = JSON.parse(message);

		if (msg.type === "new_message") {
			sockets.forEach((aSocket) => {
				aSocket.send(`${socket.nickname}: ${msg.payload}`);
			});
		} else {
			socket["nickname"] = msg.payload;
		}
	});
});

server.listen(3001, handleListen);
