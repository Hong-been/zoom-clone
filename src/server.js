import http from "http";
// import {Server} from "socket.io";
import SocketIO from "socket.io";
import express from "express";
import {instrument} from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);
// const wsServer = new Server(httpServer, {
// 	cors: {
// 		origin: ["https://admin.socket.io"],
// 		credentials: true,
// 	},
// });
// instrument(wsServer, {
//   auth: false,
// });

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName,callback) => {
    socket.join(roomName);
    callback();
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer",(offer,roomName)=>{
    console.log("offer");
    socket.to(roomName).emit("offer",offer);
  })
  socket.on("answer",(answer,roomName)=>{
    console.log("answer")
    socket.to(roomName).emit("answer",answer)
  })
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
