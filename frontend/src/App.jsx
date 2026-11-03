
import { useState } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Professional");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Connect React frontend to FastAPI backend
  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:8000/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            mode: mode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      setResult({
        score: data.score,
        weaknesses: data.weaknesses,
        improved: data.optimized_prompt,
      });

    } catch (error) {
      console.error("Analysis error:", error);
      alert("Unable to connect to Prompt Doctor backend.");
    } finally {
      setLoading(false);
    }
  };

  // Copy optimized prompt
  const copyPrompt = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.improved);
        alert("Optimized prompt copied!");
      } catch (error) {
        console.error("Copy failed:", error);
        alert("Unable to copy prompt.");
      }
    }
  };

  return (
    <div className="app">

      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">✳</span>
          <span>
            prompt<span className="brand-accent">doctor</span>
          </span>
        </a>

        <span className="nav-tag">
          AI PROMPT INTELLIGENCE
        </span>

        <span className="version">
          BETA 1.0
        </span>
      </header>

      <main className="main">

        {/* Hero Section */}
        <section className="hero">

          <div className="eyebrow">
            <span className="status-dot"></span>
            YOUR PERSONAL PROMPT ENGINEER
          </div>

          <h1>
            Get better answers.
            <br />
            <span>Write better prompts.</span>
          </h1>

          <p className="subtitle">
            Diagnose weak prompts, uncover what's missing, and
            transform ordinary instructions into powerful AI prompts.
          </p>

        </section>

        {/* Prompt Input Section */}
        <section className="workspace">

          <div className="section-heading">
            <div>
              <span className="step-label">
                01 / INPUT
              </span>

              <h2>Let's examine your prompt.</h2>
            </div>

            <span className="live-label">
              ● READY TO ANALYZE
            </span>
          </div>

          <label htmlFor="prompt">
            YOUR ORIGINAL PROMPT
          </label>

          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setResult(null);
            }}
            placeholder="Example: Explain machine learning to me..."
          />

          <div className="input-footer">
            <span>{prompt.length} characters</span>

            <span>
              {prompt.trim()
                ? prompt.trim().split(/\s+/).length
                : 0} words
            </span>
          </div>

          {/* Optimization Controls */}
          <div className="controls">

            <div className="mode-control">

              <label htmlFor="mode">
                OPTIMIZATION MODE
              </label>

              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option>Professional</option>
                <option>Academic</option>
                <option>Technical</option>
                <option>Creative</option>
                <option>Beginner</option>
              </select>

            </div>

            <button
              className="analyze-button"
              onClick={analyzePrompt}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "✳ Analyze my prompt"}

              {!loading && <span>→</span>}
            </button>

          </div>
        </section>

        {/* Analysis Results */}
        {result && (

          <section className="results">

            <div className="section-heading">

              <div>
                <span className="step-label">
                  02 / DIAGNOSIS
                </span>

                <h2>Your prompt health report.</h2>
              </div>

              <span className="score">
                {result.score}/100
              </span>

            </div>

            <div className="result-grid">

              {/* Weakness Detection */}
              <div className="result-card">

                <h3>Detected weaknesses</h3>

                {result.weaknesses.length > 0 ? (

                  result.weaknesses.map((item, index) => (
                    <p className="weakness" key={index}>
                      ⚠ {item}
                    </p>
                  ))

                ) : (

                  <p className="good">
                    ✓ No major weaknesses detected.
                  </p>

                )}

              </div>

              {/* Optimized Prompt */}
              <div className="result-card optimized">

                <h3>✳ Optimized prompt</h3>

                <pre>{result.improved}</pre>

                <button
                  className="copy-button"
                  onClick={copyPrompt}
                >
                  Copy optimized prompt ↗
                </button>

              </div>

            </div>

          </section>

        )}

        {/* Footer */}
        <footer>
          <span>✳ PROMPT DOCTOR</span>

          <span>
            Built to make AI work smarter.
          </span>
        </footer>

      </main>
    </div>
  );
}

export default App;
