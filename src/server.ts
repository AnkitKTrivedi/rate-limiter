import app from "./app";
import { connectRedis } from "./config/redis";

const PORT = 6000;

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
