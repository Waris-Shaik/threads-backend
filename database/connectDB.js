import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "threads-clone",
    });
    console.log(
      `database connected successfully.. ${connectionInstance.connection.host}🔥`
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
