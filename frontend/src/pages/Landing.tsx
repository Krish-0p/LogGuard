import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

export function LandingPage() {
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
    Cipherium
  </div>
  <ul className="nav-links">
    <li><a href="#problem">Problem</a></li>
    <li><a href="#how">How It Works</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#demo">Demo</a></li>
  </ul>
  <a className="nav-cta" href="#demo">Try Demo →</a>
</nav>

      <main>
        <section id="hero">
  <div className="hero-inner">
    <div className="hero-content fade-up">
      <div className="hero-badge">AI-Powered Phishing Detection · India's First</div>
      <h1 className="glitch" data-text="Protecting India From AI-Powered Scams">
        Protecting India From<br />
        <span className="gradient-text">AI-Powered Scams</span>
      </h1>
      <p className="hero-sub">
        Detect phishing messages and scam calls in Hindi, Marathi, Tamil and other Indian languages using advanced AI. Real-time protection for 1.4 billion people.
      </p>
      <div className="hero-btns">
        <button className="btn btn-primary">
          <span></span> Analyze Message
        </button>
        <button className="btn btn-outline">
          <span></span> Upload Scam Audio
        </button>
      </div>
      <div className="hero-stats">
        <div>
          <div className="hero-stat-num">22+</div>
          <div className="hero-stat-label">Languages Supported</div>
        </div>
        <div>
          <div className="hero-stat-num">97%</div>
          <div className="hero-stat-label">Detection Accuracy</div>
        </div>
        <div>
          <div className="hero-stat-num">&lt;2s</div>
          <div className="hero-stat-label">Analysis Time</div>
        </div>
      </div>
    </div>

    {/*  MOCKUP  */}
    <div className="hero-mockup fade-up" style={{transitionDelay: ".15s"}}>
      <div className="mockup-main">
        <div className="mockup-header">
          <span className="mockup-title"> Cipherium Dashboard</span>
          <div className="mockup-dots">
            <div className="mockup-dot mock-red"></div>
            <div className="mockup-dot mock-amber"></div>
            <div className="mockup-dot mock-green"></div>
          </div>
        </div>

        <div className="risk-meter">
          <div className="risk-label">SCAM PROBABILITY SCORE</div>
          <div className="risk-score">92%</div>
          <div className="risk-bar"><div className="risk-fill"></div></div>
          <div className="risk-status"> HIGH RISK DETECTED</div>
        </div>

        <div className="msg-panel">
          "Main <span className="highlight-amber">bank se bol raha hu</span>,
          <span className="highlight-red">OTP batao</span> warna
          <span className="highlight-red">account block</span> ho jayega"
        </div>

        <div className="indicators">
          <span className="ind-chip ind-red"> Fake Authority</span>
          <span className="ind-chip ind-red"> OTP Request</span>
          <span className="ind-chip ind-amber"> Urgency Tactic</span>
          <span className="ind-chip ind-purple"> Bank Impersonation</span>
        </div>

        <div className="audio-panel">
          <div className="audio-title">🎙 Audio Transcription Active</div>
          <div className="audio-wave" id="audioWave">
          </div>
        </div>
      </div>

      <div className="floating-badge">
        <div style={{fontSize: "0.68rem", color: "var(--muted)", marginBottom: "2px"}}>Scams Blocked Today</div>
        <div className="badge-num">4,812</div>
        <div style={{fontSize: "0.65rem", color: "var(--green)", marginTop: "2px"}}> +23% vs yesterday</div>
      </div>
    </div>
  </div>
</section>
        <section id="problem">
  <div className="section-inner">
    <div className="fade-up">
      <div className="section-tag">The Problem</div>
      <h2>Phishing Scams Are<br /><span className="gradient-text-red">Exploding Across India</span></h2>
      <p style={{color: "var(--muted)", marginTop: "16px", maxWidth: "580px", fontSize: "1.05rem"}}>
        Millions of Indians are targeted daily by sophisticated scam networks using regional languages — invisible to traditional English-only security tools.
      </p>
    </div>

    <div className="problem-grid fade-up" style={{transitionDelay: ".1s"}}>
      <div className="stat-card">
        <div className="stat-icon"></div>
        <div className="stat-num"><span className="gradient-text">4.5M+</span></div>
        <div style={{fontSize: "0.75rem", color: "var(--neon)", fontWeight: "600", marginBottom: "6px"}}>Messages Per Day</div>
        <div className="stat-desc">Phishing messages sent every 24 hours targeting Indian users across SMS, WhatsApp, and email</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"></div>
        <div className="stat-num"><span style={{background: "linear-gradient(90deg,var(--purple),#dddddd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>78%</span></div>
        <div style={{fontSize: "0.75rem", color: "var(--purple)", fontWeight: "600", marginBottom: "6px"}}>Regional Language Scams</div>
        <div className="stat-desc">Of all scams target victims in Hindi, Marathi, Tamil, Telugu, Bengali and other vernacular languages</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"></div>
        <div className="stat-num"><span className="gradient-text-red">0</span></div>
        <div style={{fontSize: "0.75rem", color: "var(--red)", fontWeight: "600", marginBottom: "6px"}}>Regional Language Filters</div>
        <div className="stat-desc">Traditional security filters have zero capability to detect scam patterns in Indian languages</div>
      </div>
    </div>

    <div className="scam-example fade-up" style={{transitionDelay: ".2s"}}>
      <div>
        <div style={{fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", fontWeight: "600"}}> Live Scam Example — Hindi SMS</div>
        <div className="scam-msg">
          "Namaskar! Main SBI bank se bol raha hoon.
          Aapka <span className="highlight-red">OTP</span> share karein nahi toh aapka
          <span className="highlight-red">account block</span> ho jayega.
          Ye <span className="highlight-amber">akhri mauka</span> hai."
        </div>
      </div>
      <div className="scam-analysis">
        <div className="scam-analysis-title">AI Detection Output</div>
        <div className="scam-tag stag-red"> OTP Theft Attempt</div>
        <div className="scam-tag stag-red"> Bank Impersonation</div>
        <div className="scam-tag stag-amber"> Urgency Pressure</div>
        <div className="scam-tag stag-purple"> Fear Manipulation</div>
        <div style={{marginTop: "14px", padding: "10px 14px", background: "rgba(180,180,180,0.08)", border: "1px solid rgba(180,180,180,0.25)", borderRadius: "8px", fontSize: "0.75rem", color: "var(--red)", fontWeight: "700"}}>RISK SCORE: 96% — SCAM</div>
      </div>
    </div>
  </div>
</section>
        <section id="how">
  <div className="section-inner">
    <div className="fade-up" style={{textAlign: "center"}}>
      <div className="section-tag" style={{margin: "0 auto 20px"}}>Process</div>
      <h2>How <span className="gradient-text">Cipherium</span> Works</h2>
      <p style={{color: "var(--muted)", marginTop: "16px", fontSize: "1.05rem"}}>Four intelligent steps from input to protection</p>
    </div>

    <div className="steps-row fade-up" style={{transitionDelay: ".1s"}}>
      <div className="step-card">
        <div className="step-num"><span className="step-icon"></span></div>
        <div className="step-title">Upload</div>
        <div className="step-desc">Paste text message or upload call recording in any Indian language</div>
      </div>
      <div className="step-card">
        <div className="step-num"><span className="step-icon"></span></div>
        <div className="step-title">AI Analysis</div>
        <div className="step-desc">Speech-to-text conversion, multilingual NLP processing and semantic understanding</div>
      </div>
      <div className="step-card">
        <div className="step-num"><span className="step-icon"></span></div>
        <div className="step-title">Pattern Detection</div>
        <div className="step-desc">Detects urgency tactics, fake authority, OTP theft attempts and payment manipulation</div>
      </div>
      <div className="step-card">
        <div className="step-num"><span className="step-icon"></span></div>
        <div className="step-title">Risk Dashboard</div>
        <div className="step-desc">Instant risk score, highlighted phrases, scam probability and action recommendations</div>
      </div>
    </div>
  </div>
</section>
        <section id="features">
  <div className="section-inner">
    <div className="fade-up">
      <div className="section-tag">Capabilities</div>
      <h2>AI Features Built for<br /><span className="gradient-text">Bharat's Reality</span></h2>
    </div>

    <div className="features-grid fade-up" style={{transitionDelay: ".1s"}}>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Audio Scam Detection</div>
        <div className="feat-desc">Upload call recordings. AI transcribes, translates, and detects scam intent with 97% accuracy across all major Indian languages.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Multilingual AI</div>
        <div className="feat-desc">Deep support for Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati and 15+ other vernacular languages.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Suspicious Link Detection</div>
        <div className="feat-desc">Detects shortened URLs, fake banking domains, clone websites and phishing redirects embedded in messages.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Manipulation Detection</div>
        <div className="feat-desc">Identifies fear tactics, false urgency, authority impersonation, and emotional pressure patterns used in social engineering attacks.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Scam Risk Score</div>
        <div className="feat-desc">Color-coded risk ratings: Safe , Suspicious , or High Risk . Clear probability percentage with explanation of threat vectors.</div>
      </div>
      <div className="feat-card">
        <div className="feat-icon"></div>
        <div className="feat-title">Highlighted Scam Phrases</div>
        <div className="feat-desc">AI visually highlights every suspicious word and phrase in the original message with color-coded severity indicators.</div>
      </div>
    </div>
  </div>
</section>
        <section id="cta">
  <div className="section-inner">
    <div className="cta-card fade-up">
      <canvas id="ctaCanvas" style={{position: "absolute", inset: "0", width: "100%", height: "100%", borderRadius: "32px", pointerEvents: "none"}}></canvas>
      <div style={{position: "relative", zIndex: "1"}}>
        <div className="section-tag" style={{margin: "0 auto 24px"}}>Get Protected</div>
        <h2>Stay Protected From<br /><span className="gradient-text">Phishing Scams</span></h2>
        <p className="cta-sub">Join thousands of Indians already protected by Cipherium's AI shield</p>
        <div className="cta-btns">
          <button className="btn btn-primary"> Upload Audio</button>
          <button className="btn btn-outline"> Analyze Message</button>
        </div>
        <p style={{marginTop: "24px", fontSize: "0.8rem", color: "var(--muted)"}}>
          Free to use · No data stored · Built for Bharat
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
        Cipherium
      </div>
      <p>AI-powered phishing detection for Indian regional languages. Protecting Bharat from cybercrime, one message at a time.</p>
      <div className="social-row" style={{marginTop: "16px"}}>
        <a className="social-btn" href="#" title="GitHub">⌨</a>
        <a className="social-btn" href="#" title="Twitter">𝕏</a>
        <a className="social-btn" href="#" title="LinkedIn">in</a>
      </div>
    </div>
    <div className="footer-col">
      <h4>Product</h4>
      <ul>
        <li><a href="#">Demo</a></li>
        <li><a href="#">API Access</a></li>
        <li><a href="#">Mobile App</a></li>
        <li><a href="#">Chrome Extension</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h4>Technology</h4>
      <ul>
        <li><a href="#">AI Model</a></li>
        <li><a href="#">Speech-to-Text</a></li>
        <li><a href="#">NLP Engine</a></li>
        <li><a href="#">Security</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h4>Project</h4>
      <ul>
        <li><a href="#">GitHub</a></li>
        <li><a href="#">Team</a></li>
        <li><a href="#">Hackathon</a></li>
        <li><a href="#">Research</a></li>
      </ul>
    </div>
    <div className="footer-col">
      <h4>Languages</h4>
      <ul>
        <li><a href="#">हिंदी</a></li>
        <li><a href="#">मराठी</a></li>
        <li><a href="#">தமிழ்</a></li>
        <li><a href="#">తెలుగు</a></li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <div className="footer-bottom-text">© 2025 Cipherium · Built for India · Hackathon Project</div>
    <div style={{fontSize: "0.75rem", color: "var(--muted)"}}>Made with ❤️ for Bharat's Cybersecurity</div>
  </div>
</footer>
    </div>
  );
}
