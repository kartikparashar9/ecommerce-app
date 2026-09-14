require("dotenv").config();

// =====================================================
// APP
// =====================================================

const app =
    require("./src/app");

// =====================================================
// DATABASE
// =====================================================

const connectDB =
    require("./src/database/connection");


// =====================================================
// PORT
// =====================================================

const PORT =
    process.env.PORT || 5000;

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
    try {
        // -------------------------------------------------
        // CONNECT DATABASE
        // -------------------------------------------------

        await connectDB();

        // -------------------------------------------------
        // START SERVER
        // -------------------------------------------------

        const server =
            app.listen(
                PORT,
                () => {
                    console.log(
                        `Server is running on http://localhost:${PORT}`
                    );
                }
            );

        // =================================================
        // GRACEFUL SHUTDOWN
        // =================================================

        const shutdown =
            async (signal) => {
                console.log(
                    `${signal} received. Shutting down server...`
                );

                server.close(
                    async () => {
                        try {
                            await disconnectRedis();

                            console.log(
                                "Server closed successfully"
                            );

                            process.exit(0);
                        } catch (error) {
                            console.error(
                                "Shutdown error:",
                                error.message
                            );

                            process.exit(1);
                        }
                    }
                );
            };

        // -------------------------------------------------
        // PROCESS SIGNALS
        // -------------------------------------------------

        process.on(
            "SIGINT",
            () =>
                shutdown("SIGINT")
        );

        process.on(
            "SIGTERM",
            () =>
                shutdown("SIGTERM")
        );

    } catch (error) {
        console.error(
            "Server startup failed:",
            error
        );

        process.exit(1);
    }
};

// =====================================================
// START APPLICATION
// =====================================================

startServer();