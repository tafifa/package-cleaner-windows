function TopBar({ isScanning, scanProgress, onScan, search, onSearchChange }) {
  const progressText =
    isScanning && scanProgress
      ? `Scanning ${scanProgress.percent}% (${scanProgress.processed}/${scanProgress.total})`
      : isScanning
      ? "Scanning..."
      : "";

  return (
    <header className="topbar">
      <input
        type="search"
        className="search-input"
        placeholder="Search project name or path..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <button type="button" className="btn-primary" onClick={onScan} disabled={isScanning}>
        {isScanning ? "Scanning..." : "Scan Ulang"}
      </button>
      {progressText ? <span className="scan-progress">{progressText}</span> : null}
    </header>
  );
}

export default TopBar;
