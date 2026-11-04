
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import "./App.css";

const API = "http://localhost:8000";

const dimensions = [
  { key: "clarity", title: "Clarity", description: "How clearly are the instructions expressed?" },
  { key: "context", title: "Context", description: "How much useful background information is provided?" },
  { key: "specificity", title: "Specificity", description: "How detailed and precise is the prompt?" },
  { key: "task_definition", title: "Task Definition", description: "How clearly is the objective defined?" },
  { key: "output_format", title: "Output Format", description: "How clearly is the expected response format specified?" },
];

function getQualityClass(level) {
  const quality = (level || "").toLowerCase();

  if (quality.includes("excellent")) return "quality-excellent";
  if (quality.includes("good")) return "quality-good";
  if (quality.includes("average")) return "quality-average";

  return "quality-poor";
}

function formatDate(value) {
  if (!value) return "Previous analysis";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN");
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Professional");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // Load history directly from SQLite through FastAPI.
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${API}/history`);

      if (!response.ok) {
        throw new Error("Unable to retrieve prompt history.");
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History loading error:", error);
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Analyze prompt and save it through the backend.
  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Backend request failed.");
      }

      const data = await response.json();

      const analysis = {
        id: data.id,
        original_prompt: data.original_prompt || prompt.trim(),
        mode: data.mode || mode,
        score: Math.max(0, Math.min(100, Number(data.score) || 0)),
        quality_level: data.quality_level || "Unrated",
        score_breakdown: data.score_breakdown || {},
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
        optimized_prompt: data.optimized_prompt || "",
        created_at: data.created_at || null,
      };

      setResult(analysis);
      await loadHistory();
    } catch (error) {
      console.error("Analysis error:", error);
      alert(error.message || "Unable to connect to Prompt Doctor.");
    } finally {
      setLoading(false);
    }
  };

  // Copy optimized prompt.
  const copyPrompt = async () => {
    if (!result?.optimized_prompt) return;

    try {
      await navigator.clipboard.writeText(result.optimized_prompt);
      alert("Optimized prompt copied!");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Unable to copy prompt.");
    }
  };

  // Open a saved database record.
  const openHistory = async (item) => {
    try {
      const response = await fetch(`${API}/history/${item.id}`);

      if (!response.ok) {
        throw new Error("Unable to open this analysis.");
      }

      const data = await response.json();

      setResult(data);
      setPrompt(data.original_prompt || "");
      setMode(data.mode || "Professional");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Open history error:", error);
      alert(error.message);
    }
  };

  // Delete a single database record.
  const deleteHistory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Unable to delete analysis.");
      }

      if (result?.id === id) setResult(null);

      await loadHistory();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
  };

  // Clear all database records.
  const clearHistory = async () => {
    if (!history.length) return;

    if (!window.confirm("Permanently delete all prompt history?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/history`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Unable to clear history.");
      }

      setResult(null);
      await loadHistory();
    } catch (error) {
      console.error("Clear history error:", error);
      alert(error.message);
    }
  };

  // Export diagnosis report as PDF.
  const exportPDF = () => {
    if (!result) {
      alert("Please analyze a prompt first!");
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    const addSection = (heading, content) => {
      if (!content) return;

      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(heading, margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(String(content), contentWidth);

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        doc.text(line, margin, y);
        y += 6;
      });

      y += 8;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PROMPT DOCTOR", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("AI Prompt Diagnosis Report", margin, y);
    y += 15;

    addSection("Original Prompt", result.original_prompt);
    addSection("Optimization Mode", result.mode);
    addSection("Quality Score", `${result.score}/100`);
    addSection("Quality Level", result.quality_level);

    const breakdownText = dimensions
      .map((dimension) => {
        const value = result.score_breakdown?.[dimension.key] ?? "N/A";
        return `${dimension.title}: ${value}/100`;
      })
      .join("\n");

    addSection("Prompt Quality Breakdown", breakdownText);

    addSection(
      "Detected Weaknesses",
      result.weaknesses?.length
        ? result.weaknesses.map((item) => `- ${item}`).join("\n")
        : "No major weaknesses detected."
    );

    addSection(
      "Suggestions",
      result.suggestions?.length
        ? result.suggestions.map((item) => `- ${item}`).join("\n")
        : "No additional suggestions."
    );

    addSection("Optimized Prompt", result.optimized_prompt);

    doc.save("Prompt-Doctor-Report.pdf");
  };

  const safeScore = result
    ? Math.max(0, Math.min(100, Number(result.score) || 0))
    : 0;

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">✳</span>
          <span>
            prompt<span className="brand-accent">doctor</span>
          </span>
        </Link>

        <span className="nav-tag">AI PROMPT INTELLIGENCE</span>

        <div className="nav-actions">
          <Link to="/database" className="database-nav-link">
            <span>▦</span> Database
          </Link>
          <span className="version">BETA 3.0</span>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
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

        {/* Input */}
        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="step-label">01 / INPUT</span>
              <h2>Let's examine your prompt.</h2>
            </div>

            <span className="live-label">
              ● {loading ? "ANALYZING..." : "READY TO ANALYZE"}
            </span>
          </div>

          <label htmlFor="prompt">YOUR ORIGINAL PROMPT</label>

          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setResult(null);
            }}
            placeholder="Example: Explain machine learning to me..."
            maxLength={10000}
          />

          <div className="input-footer">
            <span>{prompt.length} characters</span>
            <span>
              {prompt.trim() ? prompt.trim().split(/\s+/).length : 0} words
            </span>
          </div>

          <div className="controls">
            <div className="mode-control">
              <label htmlFor="mode">OPTIMIZATION MODE</label>

              <select
                id="mode"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
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
              {loading ? "Analyzing..." : "✳ Analyze my prompt"}
              {!loading && <span>→</span>}
            </button>
          </div>
        </section>

        {/* Loading animation */}
        {loading && (
          <section className="analysis-loading">
            <div className="ai-loader">
              <div className="loader-ring"></div>
              <div className="loader-core">✳</div>
            </div>

            <h2>Examining your prompt...</h2>

            <p>
              Gemini is evaluating clarity, context, specificity,
              task definition and output format.
            </p>

            <div className="loading-status">
              <span className="loading-dot"></span>
              AI PROMPT ANALYSIS IN PROGRESS
            </div>

            <div className="loading-progress">
              <div className="loading-progress-fill"></div>
            </div>
          </section>
        )}

        {/* Results */}
        {result && (
          <section className="results">
            <div className="section-heading">
              <div>
                <span className="step-label">02 / DIAGNOSIS</span>
                <h2>Your prompt health report.</h2>
                <span className={`quality-badge ${getQualityClass(result.quality_level)}`}>
                  {result.quality_level}
                </span>
              </div>

              <div className="score-gauge">
                <div
                  className="score-gauge-inner"
                  style={{ "--score": `${safeScore}%` }}
                >
                  <strong>{safeScore}</strong>
                  <span>/100</span>
                </div>
                <small>QUALITY SCORE</small>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="result-card breakdown-card">
              <h3>Prompt quality breakdown</h3>
              <p className="history-description">
                Your prompt is evaluated across five dimensions.
              </p>

              <div className="breakdown-list">
                {dimensions.map((dimension) => {
                  const value = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(result.score_breakdown?.[dimension.key] ?? 0)
                    )
                  );

                  return (
                    <div className="breakdown-item" key={dimension.key}>
                      <div className="breakdown-heading">
                        <strong>{dimension.title}</strong>
                        <span>{value}/100</span>
                      </div>

                      <p>{dimension.description}</p>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <h3>⚠ Detected weaknesses</h3>

                {result.weaknesses?.length > 0 ? (
                  result.weaknesses.map((item, index) => (
                    <p className="weakness" key={index}>⚠ {item}</p>
                  ))
                ) : (
                  <p className="good">✓ No major weaknesses detected.</p>
                )}
              </div>

              <div className="result-card">
                <h3>✳ Improvement suggestions</h3>

                {result.suggestions?.length > 0 ? (
                  result.suggestions.map((item, index) => (
                    <p className="suggestion" key={index}>
                      {index + 1}. {item}
                    </p>
                  ))
                ) : (
                  <p className="good">
                    ✓ Your prompt is already well structured.
                  </p>
                )}
              </div>
            </div>

            {/* Optimized prompt */}
            <div className="result-card optimized">
              <h3>✳ Optimized prompt</h3>
              <pre>{result.optimized_prompt}</pre>

              <div className="result-buttons">
                <button className="copy-button" onClick={copyPrompt}>
                  Copy optimized prompt ↗
                </button>

                <button className="pdf-button" onClick={exportPDF}>
                  Download PDF ↓
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Database history */}
        <section className="history-section">
          <div className="section-heading">
            <div>
              <span className="step-label">03 / YOUR ACTIVITY</span>
              <h2>Prompt history.</h2>
              <p className="history-description">
                Your analyses are saved in the SQLite database.
              </p>
            </div>

            <span className="history-count">
              {history.length} SAVED
            </span>
          </div>

          {historyLoading && (
            <div className="history-empty">
              <p>Loading your prompt history...</p>
            </div>
          )}

          {!historyLoading && historyError && (
            <div className="history-empty">
              <h3>Unable to load history.</h3>
              <p>{historyError}</p>
              <button className="history-open" onClick={loadHistory}>
                Retry
              </button>
            </div>
          )}

          {!historyLoading && !historyError && history.length > 0 && (
            <>
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div className="history-details">
                      <h3>
                        {(item.original_prompt || "Untitled prompt").slice(0, 65)}
                        {(item.original_prompt || "").length > 65 ? "..." : ""}
                      </h3>

                      <div className="history-meta">
                        <span>{item.mode}</span>
                        <span>Score: {item.score}/100</span>
                        <span>{item.quality_level || "Unrated"}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div className="history-actions">
                      <button
                        className="history-open"
                        onClick={() => openHistory(item)}
                      >
                        Open
                      </button>

                      <button
                        className="history-delete"
                        onClick={() => deleteHistory(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="clear-history" onClick={clearHistory}>
                Clear all history
              </button>
            </>
          )}

          {!historyLoading && !historyError && history.length === 0 && (
            <div className="history-empty">
              <div className="history-empty-icon">✳</div>
              <h3>No prompt history yet.</h3>
              <p>Your analyzed prompts will be saved here automatically.</p>
            </div>
          )}
        </section>

        <footer>
          <span>✳ PROMPT DOCTOR</span>
          <span>Built to make AI work smarter.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
