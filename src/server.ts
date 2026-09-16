import "dotenv/config";
import app from "./app";
import { connectDB, prisma } from "./config/db";
import { connectRedis } from "./config/redis";

const PORT = process.env.PORT;

const startServer = async () => {
    await connectDB();
    await connectRedis();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    const shutdown = async () => {
        console.log("\nShutting down gracefully...");
        await prisma.$disconnect();
        server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

startServer();
