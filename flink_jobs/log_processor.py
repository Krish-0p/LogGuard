from pyflink.datastream import StreamExecutionEnvironment, RuntimeExecutionMode
from pyflink.datastream.connectors.kafka import FlinkKafkaConsumer, FlinkKafkaProducer
from pyflink.common import WatermarkStrategy, Time, Duration
from pyflink.common.watermark_strategy import TimestampAssigner
from pyflink.datastream.window import TumblingEventTimeWindows, SlidingEventTimeWindows
from pyflink.common.serialization import SimpleStringSchema
from pyflink.datastream.functions import MapFunction
from pyflink.common.typeinfo import Types  # <-- New Import
from parsers.drain3_parser import LogGuardParser
from feature_engineering.window_builder import HostWindowAggregator
import json
import uuid
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LogGuard-Flink")

class LogTimestampAssigner(TimestampAssigner):
    def extract_timestamp(self, value, record_timestamp):
        return int(value["timestamp"])

class ParseLogFunction(MapFunction):
    def open(self, runtime_context):
        self.parser = LogGuardParser()

    def map(self, event):
        parsed = self.parser.parse(event.get("raw_message", ""))
        event.update(parsed)
        return event

def create_log_processor_job():
    env = StreamExecutionEnvironment.get_execution_environment()
    
    jar_path = f"file://{os.path.abspath('flink-sql-connector-kafka-3.0.2-1.18.jar')}"
    env.add_jars(jar_path)
    
    env.set_runtime_mode(RuntimeExecutionMode.STREAMING)
    env.set_parallelism(1)
    
    kafka_props = {
        "bootstrap.servers": "localhost:9092",
        "group.id": "logguard-flink-processor",
        "auto.offset.reset": "latest",
        "enable.auto.commit": "false"
    }
    
    consumer = FlinkKafkaConsumer(
        topics="raw-logs",
        deserialization_schema=SimpleStringSchema(),
        properties=kafka_props
    )
    consumer.set_start_from_latest()
    
    producer = FlinkKafkaProducer(
        topic="processed-features",
        serialization_schema=SimpleStringSchema(),
        producer_config={
            "bootstrap.servers": "localhost:9092",
            "transaction.timeout.ms": "60000"
        }
    )
    
    raw_stream = env.add_source(consumer)
    
    parsed_stream = (
        raw_stream
        .map(lambda raw: json.loads(raw))
        .map(ParseLogFunction())
        .filter(lambda e: e.get("host") is not None)
        .assign_timestamps_and_watermarks(
            WatermarkStrategy
            .for_bounded_out_of_orderness(Duration.of_seconds(5))
            .with_timestamp_assigner(LogTimestampAssigner())
        )
    )
    
    feature_stream_60s = (
        parsed_stream
        .key_by(lambda e: e["host"])
        .window(TumblingEventTimeWindows.of(Time.seconds(60)))
        .apply(HostWindowAggregator())
    )
    
    feature_stream_300s = (
        parsed_stream
        .key_by(lambda e: e["host"])
        .window(SlidingEventTimeWindows.of(Time.seconds(300), Time.seconds(60)))
        .apply(HostWindowAggregator())
    )
    
    # Union and Sink with the fixed output_type
    feature_stream_60s.union(feature_stream_300s) \
        .map(lambda f: json.dumps(f), output_type=Types.STRING()) \
        .add_sink(producer)
    
    logger.info("Starting LogGuard Flink job...")
    env.execute("LogGuard Log Processor")

if __name__ == "__main__":
    create_log_processor_job()
