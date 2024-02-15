import Redis from "ioredis";
import dotenv from "dotenv";
const { Server } = require('socket.io')
dotenv.config()

const PORT = 9002;


const redisUri = process.env.REDIS_URI!;
const subscriber = new Redis(redisUri);

const io = new Server({ cors: "*" });

io.on("connection", (socket: any) => {
  socket.on("subscribe", (channel: any) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});


async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    const channelName = channel.split(':')[1]
    io.to(channelName).emit("message", message);
    
  });
}

io.listen(PORT, ()=>console.log("Logs service running at Port: ", PORT));
initRedisSubscribe();