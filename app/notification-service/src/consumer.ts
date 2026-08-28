import { Kafka, logLevel } from "kafkajs";
import { OrderCreatedEvent } from "./types";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");

const kafka = new Kafka({ brokers, logLevel: logLevel.WARN });
const consumer = kafka.consumer({ groupId: "notification-service" });

export async function startConsumer(): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event: OrderCreatedEvent = JSON.parse(message.value.toString());
        await handleOrderCreated(event);
      } catch (err) {
        console.error("Failed to process message:", err);
      }
    },
  });

  console.log("notification-service: consuming order.created events");
}

async function handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
  // In production this would send an email via SES/SendGrid/SMTP.
  // For the course, we log a structured notification so learners can see the event flow.
  console.log("📧 New order notification:");
  console.log(`  Order ID : ${event.order_id}`);
  console.log(`  User ID  : ${event.user_id}`);
  console.log(`  Total    : $${event.total.toFixed(2)}`);
  console.log("  Items:");
  for (const item of event.items) {
    console.log(`    - ${item.product_name} × ${item.quantity}`);
  }
}

export async function stopConsumer(): Promise<void> {
  await consumer.disconnect();
}
