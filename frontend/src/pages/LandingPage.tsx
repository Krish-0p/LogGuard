import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

export function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root custom-scrollbar">
      {/* BACKGROUND EFFECTS */}
      <video
        autoPlay
        loop
        muted
        playsInline
        id="bg-video"
      >
        <source src="/back.mp4" type="video/mp4" />
      </video>

      <nav>
  <div className="nav-logo">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L3 8v8c0 5.5 4.7 10.7 11 12 6.3-1.3 11-6.5 11-12V8L14 2z" fill="url(#shieldGrad)" opacity=".9"/>
      <path d="M10 14l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs><linearGradient id="shieldGrad" x1="3" y1="2" x2="25" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff"/><stop offset="1" stopColor="#cccccc"/>
      </linearGradient></defs>
    </svg>
    Ai0ps
  </div>
  <ul className="nav-links">
    <li><a href="#problem">Problem</a></li>
    <li><a href="#how">How It Works</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="/login">Demo</a></li>
  </ul>
  <a className="nav-cta" href="/login">Analyze Logs →</a>
</nav>

      <main>
        <section id="hero">
  <div className="hero-inner">
    <div className="hero-content fade-up">
      <div className="hero-badge">Next-Generation ML Engine Active</div>
      <h1 className="glitch" data-text="Intelligent Telemetry & Anomaly Detection">Intelligent Telemetry &<br /><span className="gradient-text">Anomaly Detection</span></h1>
      <p className="hero-sub">Secure your infrastructure with our hybrid AI engine. Ai0ps combines LSTM neural networks and Isolation Forests to detect critical system failures in real-time, providing deep insights before issues escalate.</p>
      <div className="hero-stats">
        <div>
          <div className="hero-stat-num">Real</div>
          <div className="hero-stat-label">Time Ingestion</div>
        </div>
        <div>
          <div className="hero-stat-num">99.5%</div>
          <div className="hero-stat-label">Inference Accuracy</div>
        </div>
        <div>
          <div className="hero-stat-num">&lt; 1s</div>
          <div className="hero-stat-label">Analytics Latency</div>
        </div>
      </div>
    </div>

    {/*  MOCKUP  */}
    <div className="hero-mockup fade-up" style={{transitionDelay: ".15s"}}>
      <div className="mockup-main">
        <div className="mockup-header">
          <span className="mockup-title"> Ai0ps Dashboard</span>
          <div className="mockup-dots">
            <div className="mockup-dot mock-red"></div>
            <div className="mockup-dot mock-amber"></div>
            <div className="mockup-dot mock-green"></div>
          </div>
        </div>

        <div className="risk-meter">
          <div className="risk-label">ANOMALY SEVERITY SCORE</div>
          <div className="risk-score">92%</div>
          <div className="risk-bar"><div className="risk-fill"></div></div>
          <div className="risk-status"> CRITICAL ANOMALY</div>
        </div>

        <div className="msg-panel">
          "Oct 14 10:25:31 host-024 <span className="highlight-amber">sshd[2913]: Connection reset by peer</span>,
          <span className="highlight-red">rsyslogd: malloc failed</span> 
          <span className="highlight-red">kernel: Out of memory: Kill process 1923</span>"
        </div>

        <div className="indicators">
          <span className="ind-chip ind-red"> Memory Leak</span>
          <span className="ind-chip ind-red"> Network Drop</span>
          <span className="ind-chip ind-amber"> Crash Loop</span>
          <span className="ind-chip ind-purple"> System Overflow</span>
        </div>

        <div className="audio-panel">
          <div className="audio-title">Live Flow Analysis Active</div>
          <div className="audio-wave" id="audioWave">
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
        
        
        <section id="features">
  <div className="section-inner">
    <div className="fade-up">
      <div className="section-tag">Capabilities</div>
      <h2>Intelligent Features Built for<br /><span className="gradient-text">Scale & Precision</span></h2>
    </div>

    
    <div className="features-grid fade-up" style={{transitionDelay: ".1s"}}>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>dashboard</span></div>
        <div className="feat-title">Realtime log dashboard</div>
        <div className="feat-desc">Monitor your entire fleet of hosts continuously with up-to-the-second metrics processing. Global fleet health across dynamically visualized geographical grids.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>radar</span></div>
        <div className="feat-title">Anomaly detection</div>
        <div className="feat-desc">Combine LSTM neural networks and Isolation Forests to detect critical system failures in real-time, providing deep insights before issues escalate.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>hub</span></div>
        <div className="feat-title">RCA analysis</div>
        <div className="feat-desc">Correlate incidents and track failures back to their root cause using incident maps. Generate LLM-powered context summaries for every anomalous event.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>summarize</span></div>
        <div className="feat-title">Summary of logs</div>
        <div className="feat-desc">Automatically generates human-readable root cause summaries via LLMs for rapid triaging and actionable debugging steps without manual log digging.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>upload_file</span></div>
        <div className="feat-title">Log upload for detection</div>
        <div className="feat-desc">Upload raw CSV data offline across standard formats (BGL, HDFS, OpenStack, Thunderbird) to run quick on-demand feature extraction and mapping.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"><span className="material-symbols-outlined" style={{fontSize: "inherit"}}>schema</span></div>
        <div className="feat-title">Pipeline Automation</div>
        <div className="feat-desc">Complete orchestration with Apache Airflow for active model retraining and MLflow for registry and performance versioning over time.</div>
      </div>
    </div>
  </div>
</section>
        <section id="cta">
  <div className="section-inner">
    <div className="cta-card fade-up">
      <canvas id="ctaCanvas" style={{position: "absolute", inset: "0", width: "100%", height: "100%", borderRadius: "32px", pointerEvents: "none"}}></canvas>
      <div style={{position: "relative", zIndex: "1"}}>
        <div className="section-tag" style={{margin: "0 auto 24px"}}>Get Started</div>
        <h2>Achieve Relentless<br /><span className="gradient-text">System Stability</span></h2>
        <p className="cta-sub">Deploy our anomaly detection engine and eradicate unexpected downtime.</p>
        <div className="cta-btns">
          <Link to="/login" className="btn btn-primary">Launch Dashboard</Link>
          <Link to="/log-analytics" className="btn btn-outline">Analyze Logs Offline</Link>
        </div>
        <p style={{marginTop: "24px", fontSize: "0.8rem", color: "var(--muted)"}}>
          Free to use · No data stored · Built for Global Scale
        </p>
      </div>
    </div>
  </div>
</section>
      </main>

      <footer>
  
  <div className="footer-grid">
    <div className="footer-brand">
      <div className="nav-logo" style={{fontSize: "1.1rem"}}>
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <path d="M14 2L3 8v8c0 5.5 4.7 10.7 11 12 6.3-1.3 11-6.5 11-12V8L14 2z" fill="url(#sg3)"/>
          <path d="M10 14l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <defs><linearGradient id="sg3" x1="3" y1="2" x2="25" y2="26"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#cccccc"/></linearGradient></defs>
        </svg>
        Ai0ps
      </div>
      <p>Ai0ps is a robust hybrid learning observability pipeline so modern engineering teams can fix what matters, faster.</p>
    </div>
    <div className="footer-col">
      <h4>Platform</h4>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/rca">Deep RCA</Link></li>
        <li><Link to="/log-analytics">Log Analytics</Link></li>
      </ul>
    </div>
    <div className="footer-col">
      <h4>Technology</h4>
      <ul>
        <li><a href="#">LSTM Autoencoders</a></li>
        <li><a href="#">Isolation Forests</a></li>
        <li><a href="#">Apache Flink</a></li>
        <li><a href="#">TimescaleDB</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h4>Integrations</h4>
      <ul>
        <li><a href="#">FluentBit</a></li>
        <li><a href="#">Kafka</a></li>
        <li><a href="#">Airflow</a></li>
        <li><a href="#">Redis</a></li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <div className="footer-bottom-text">© 2026 Ai0ps Intelligence. All Systems Operational.</div>
  </div>
</footer>

    </div>
  );
}
