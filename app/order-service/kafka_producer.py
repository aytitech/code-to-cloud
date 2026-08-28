import json
import logging
from aiokafka import AIOKafkaProducer

from config import settings

logger = logging.getLogger(__name__)
_producer: AIOKafkaProducer | None = None


async def start_producer():
    global _producer
    _producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_brokers)
    await _producer.start()


async def stop_producer():
    if _producer:
        await _producer.stop()


async def publish(topic: str, payload: dict):
    if not _producer:
        logger.warning("Kafka producer not started, skipping publish")
        return
    try:
        await _producer.send_and_wait(topic, json.dumps(payload).encode())
    except Exception as exc:
        logger.error("Failed to publish to %s: %s", topic, exc)
