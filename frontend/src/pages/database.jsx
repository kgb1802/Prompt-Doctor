
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API = "http://localhost:8000";

function Database() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    average_score: 0,
    highest_score: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Load database records and statistics.
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`${API}/history`),
        fetch(`${API}/database/stats`),
      ]);

      if (!historyResponse.ok || !statsResponse.ok) {
        throw new Error("Unable to load database records.");
      }

      const historyData = await historyResponse.json();
      const statsData = await statsResponse.json();

      setRecords(Array.isArray(historyData) ? historyData : []);
      setStats(statsData);
    } catch (err) {
      console.error("Database loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Available modes.
  const modes = useMemo(
    () => [
      "All",
      ...new Set(records.map((record) => record.mode).filter(Boolean)),
    ],
    [records]
  );

  // Search, filter and sort records.
  const filteredRecords = useMemo(() => {
    let data = records.filter((record) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (record.original_prompt || "").toLowerCase().includes(searchText) ||
        String(record.id).includes(searchText) ||
        (record.optimized_prompt || "").toLowerCase().includes(searchText);

      const matchesMode =
        modeFilter === "All" || record.mode === modeFilter;

      return matchesSearch && matchesMode;
    });

    if (sortBy === "newest") {
      data.sort((a, b) => b.id - a.id);
    } else if (sortBy === "oldest") {
      data.sort((a, b) => a.id - b.id);
    } else if (sortBy === "highest") {
      data.sort((a, b) => b.score - a.score);
    } else if (sortBy === "lowest") {
      data.sort((a, b) => a.score - b.score);
    }

    return data;
  }, [records, search, modeFilter, sortBy]);

  // Download the actual Excel workbook from FastAPI.
  const downloadExcel = async () => {
    setExporting(true);

    try {
      const response = await fetch(`${API}/export/excel`);

      if (!response.ok) {
        throw new Error("Excel export failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Prompt_Doctor_Database.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export error:", err);
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("en-IN");
  };

  const qualityClass = (quality) => {
    if (quality === "Excellent") return "db-quality excellent";
    if (quality === "Good") return "db-quality good";
    if (quality === "Needs Improvement") return "db-quality average";
    return "db-quality poor";
  };

  return (
    <div className="database-page">

      {/* Navigation */}
      <header className="db-navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">✳</span>
          <span>
            prompt<span className="brand-accent">doctor</span>
          </span>
        </Link>

        <div className="db-nav-actions">
          <span className="db-nav-label">DATABASE MANAGEMENT</span>

          <Link to="/" className="db-back-button">
            ← Main Page
          </Link>
        </div>
      </header>

      <main className="db-main">

        {/* Dashboard heading */}
        <div className="db-heading">
          <div>
            <span className="step-label">DATABASE MANAGEMENT</span>
            <h1>Analysis Records.</h1>
            <p>
              Your complete prompt analysis database, organized
              like a spreadsheet.
            </p>
          </div>

          <button
            className="db-export-button"
            onClick={downloadExcel}
            disabled={exporting}
          >
            {exporting ? "Preparing Excel..." : "↓ Export Excel"}
          </button>
        </div>

        {/* Statistics */}
        <section className="db-stats">

          <div className="db-stat-card">
            <span>TOTAL RECORDS</span>
            <strong>{stats.total_records}</strong>
            <small>Saved analyses</small>
          </div>

          <div className="db-stat-card">
            <span>AVERAGE SCORE</span>
            <strong>{stats.average_score}</strong>
            <small>Out of 100</small>
          </div>

          <div className="db-stat-card">
            <span>HIGHEST SCORE</span>
            <strong>{stats.highest_score}</strong>
            <small>Best prompt score</small>
          </div>

        </section>

        {/* Search and filters */}
        <section className="db-toolbar">

          <input
            type="search"
            placeholder="Search prompts or record ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value)}
          >
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode === "All" ? "All modes" : mode}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest score</option>
            <option value="lowest">Lowest score</option>
          </select>

          <button
            className="db-refresh-button"
            onClick={loadRecords}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </section>

        {/* Database table */}
        <section className="db-table-card">

          <div className="db-table-heading">
            <div>
              <h2>All analysis records</h2>
              <p>{filteredRecords.length} records displayed</p>
            </div>

            <span className="db-live-indicator">
              ● LIVE DATABASE
            </span>
          </div>

          {loading ? (
            <div className="db-empty">
              Loading database records...
            </div>
          ) : error ? (
            <div className="db-empty">
              <h3>Database connection error</h3>
              <p>{error}</p>
              <button onClick={loadRecords}>Try again</button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="db-empty">
              <h3>No records found</h3>
              <p>Try another search or create a new analysis.</p>
            </div>
          ) : (
            <div className="db-table-wrapper">
              <table className="db-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Original Prompt</th>
                    <th>Mode</th>
                    <th>Score</th>
                    <th>Quality</th>
                    <th>Clarity</th>
                    <th>Context</th>
                    <th>Specificity</th>
                    <th>Task Definition</th>
                    <th>Output Format</th>
                    <th>Created At</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>#{record.id}</td>

                      <td className="db-prompt-cell">
                        {record.original_prompt}
                      </td>

                      <td>{record.mode}</td>

                      <td>
                        <strong>{record.score}/100</strong>
                      </td>

                      <td>
                        <span className={qualityClass(record.quality_level)}>
                          {record.quality_level}
                        </span>
                      </td>

                      <td>{record.score_breakdown?.clarity ?? "—"}</td>
                      <td>{record.score_breakdown?.context ?? "—"}</td>
                      <td>{record.score_breakdown?.specificity ?? "—"}</td>
                      <td>{record.score_breakdown?.task_definition ?? "—"}</td>
                      <td>{record.score_breakdown?.output_format ?? "—"}</td>

                      <td>{formatDate(record.created_at)}</td>

                      <td>
                        <button
                          className="db-view-button"
                          onClick={() => setSelected(record)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

        <p className="db-note">
          Data is retrieved directly from your Prompt Doctor SQLite database.
          Excel export includes all database records.
        </p>

      </main>

      {/* Record details modal */}
      {selected && (
        <div
          className="db-modal-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="db-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="db-modal-heading">
              <div>
                <span className="step-label">
                  RECORD #{selected.id}
                </span>
                <h2>Analysis Details</h2>
              </div>

              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="db-detail-meta">
              <span>Mode: {selected.mode}</span>
              <span>Score: {selected.score}/100</span>
              <span>{selected.quality_level}</span>
              <span>{formatDate(selected.created_at)}</span>
            </div>

            <h3>Original Prompt</h3>
            <pre>{selected.original_prompt}</pre>

            <h3>Optimized Prompt</h3>
            <pre>{selected.optimized_prompt}</pre>

            <h3>Score Breakdown</h3>
            <div className="db-detail-scores">
              {Object.entries(selected.score_breakdown || {}).map(
                ([key, value]) => (
                  <div key={key}>
                    <span>{key.replaceAll("_", " ")}</span>
                    <strong>{value}/100</strong>
                  </div>
                )
              )}
            </div>

            <h3>Weaknesses</h3>
            {selected.weaknesses?.length ? (
              <ul>
                {selected.weaknesses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No major weaknesses.</p>
            )}

            <h3>Improvement Suggestions</h3>
            {selected.suggestions?.length ? (
              <ul>
                {selected.suggestions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No additional suggestions.</p>
            )}

            <button
              className="db-export-button"
              onClick={() => setSelected(null)}
            >
              Close Details
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Database;
