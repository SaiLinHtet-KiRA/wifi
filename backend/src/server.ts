// import { connectDB } from "./config/DB/mongoose";
import { express } from "./server/index";

async function start() {
  // await connectDB();
  express.startServer();
}

start();
