#!/bin/bash
set -e

KAFKA_BROKER="localhost:9092"

echo "Creating Kafka topics..."

# Raw logs topic - high throughput, 6 partitions
kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic raw-logs \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=86400000 \
  --config compression.type=lz4

# Processed features topic - ML input
kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic processed-features \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=86400000

# Anomaly events topic - alert triggers
kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic anomaly-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

echo "✅ All topics created successfully!"
kafka-topics.sh --list --bootstrap-server $KAFKA_BROKER