import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// TODO: use는 왜쓰는거지..
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));

const handleListen = ()=>{
  console.log("success port 3000")
}
app.listen(3000,handleListen);