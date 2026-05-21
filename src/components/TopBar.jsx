function TopBar({ isScanning, scanProgress, onScan, search, onSearchChange }) {
  const currentPath = scanProgress?.currentPath || "";
  const shortPath = currentPath.length > 58 ? `...${currentPath.slice(-58)}` : currentPath;
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
      {progressText ? (
        <div className="scan-progress-wrap">
          <span className="scan-progress">{progressText}</span>
          {shortPath ? <span className="scan-path">{shortPath}</span> : null}
        </div>
      ) : null}
    </header>
  );
}

export default TopBar;
