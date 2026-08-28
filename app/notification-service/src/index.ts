import { startConsumer, stopConsumer } from "./consumer";

async function main() {
  console.log("notification-service starting...");
  await startConsumer();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await stopConsumer();
  process.exit(0);
});
