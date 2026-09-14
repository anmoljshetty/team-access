import "dotenv/config";
import app from "./app";
import { connectDB, prisma } from "./config/db";

const PORT = process.env.PORT;

const startServer = async () => {
    await connectDB();

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
