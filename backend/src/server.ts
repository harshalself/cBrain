import "reflect-metadata";
import { createServer } from "http";
import App from "./app";
import { logger } from "./utils/logger";
import { initializeSocket } from "./utils/socket";
import validateEnv from "./utils/validateEnv";
import ChatRoute from "./features/chat/chat.route";
import UserRoute from "./features/user/user.route";
import DocumentRoute from "./features/documents/document.route";
import AgentRoute from "./features/agent/agent.route";
import BaseSourceRoute from "./features/source/source.route";
import FileSourceRoute from "./features/source/file/file-source.route";
// Removed: TextSourceRoute, WebsiteSourceRoute, DatabaseSourceRoute, QASourceRoute
import VectorRoute from "./features/vector/vector.routes";
import { testDbConnection } from "./utils/testdbConnection";
import { ProviderModelRoute } from "./features/provider_model/provider-model.route";
import { initializeRedisConnection } from "./utils/redis";
import { initializePineconeConnection } from "./utils/pinecone";
import { startTrainingWorker } from "./features/train/training.worker";
import AnalyticsRoute from "./features/analytics/analytics.route";
import NotificationRoute from "./features/notifications/notification.route";
import InvitationRoute from "./features/invitations/invitation.route";
import OnboardingRoute from "./features/onboarding/onboarding.route";
import MessagingRoute from "./features/messaging/messaging.route";
import { gracefulShutdown } from "./utils/gracefulShutdown";

validateEnv();

async function bootstrap() {
  try {
    logger.info("🚀 Starting Siemens Backend...");

    // Check DB connection
    await testDbConnection();

    // Initialize Redis connection (optional in Railway)
    try {
      const redisConnected = await initializeRedisConnection();
      if (!redisConnected) {
        logger.warn("⚠️ Redis connection failed, continuing without Redis...");
      }
    } catch (error) {
      logger.warn("⚠️ Redis not available, continuing without caching...");
    }

    // Initialize Pinecone connection (optional)
    try {
      const pineconeConnected = await initializePineconeConnection();
      if (!pineconeConnected) {
        logger.warn(
          "⚠️ Pinecone connection failed, vector features may be limited..."
        );
      }
    } catch (error) {
      logger.warn("⚠️ Pinecone not available, vector features disabled...");
    }

    // Start training worker for background job processing (optional)
    try {
      startTrainingWorker();
      logger.info("✅ Training worker started successfully");
    } catch (error) {
      logger.warn(
        "⚠️ Training worker failed to start, background jobs disabled..."
      );
    }

    // Start Express app
    const app = new App([
      new UserRoute(),
      new ChatRoute(),
      new DocumentRoute(),
      new NotificationRoute(),
      new InvitationRoute(),
      new OnboardingRoute(),
      new AgentRoute(),
      new BaseSourceRoute(),
      new FileSourceRoute(),
      new ProviderModelRoute(),
      new VectorRoute(),
      new AnalyticsRoute(),
      new MessagingRoute(),
    ]);

    // Create HTTP server for both Express and Socket.IO
    const httpServer = createServer(app.getServer());

    // Initialize Socket.IO with the HTTP server
    initializeSocket(httpServer);

    // Start HTTP server (replaces app.listen())
    const port = Number(process.env.PORT) || 8000;
    httpServer.listen(port, "0.0.0.0", () => {
      logger.info(
        `🚀 Siemens Backend listening on port ${port}. Environment: ${process.env.NODE_ENV || "development"}`
      );
    });
    logger.info("✅ Siemens Backend started successfully!");

    // Initialize graceful shutdown handlers
    gracefulShutdown.initialize();

    // Register cleanup tasks
    gracefulShutdown.registerCleanupTask(async () => {
      logger.info("1️⃣ Stopping new requests...");
      // Note: Express server shutdown is handled automatically
    });

    gracefulShutdown.registerCleanupTask(async () => {
      // Close Redis connection (if active)
      try {
        const { disconnectRedis } = require("./utils/redis");
        await disconnectRedis();
        logger.info("✅ Redis connection closed");
      } catch (error) {
        logger.warn("⚠️ Redis disconnect skipped (not connected)");
      }
    });

    gracefulShutdown.registerCleanupTask(async () => {
      // Close Pinecone connection (if any cleanup needed)
      logger.info("✅ Pinecone connection closed");
    });

    gracefulShutdown.registerCleanupTask(async () => {
      // Close database connections - MOST CRITICAL
      try {
        const knex = require("../database/index.schema").default;
        await knex.destroy();
        logger.info("✅ Database connections closed properly");
      } catch (error) {
        logger.error("❌ Error closing database:", error);
      }
    });
  } catch (error) {
    logger.error(
      "App failed to start: " + (error && error.stack ? error.stack : error)
    );
    console.error("App failed to start:", error);
    process.exit(1); // Stop if critical services fail
  }
}
bootstrap();
