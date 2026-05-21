function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(2)} MB`;
}

function StatsRow({ totalProjects, totalSizeBytes, inactiveSizeBytes, lastScanAt }) {
  return (
    <section className="stats-row">
      <article className="stat-card">
        <p className="stat-label">Total Project</p>
        <p className="stat-value">{totalProjects}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Total Size</p>
        <p className="stat-value">{formatBytes(totalSizeBytes)}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Potential Saving</p>
        <p className="stat-value">{formatBytes(inactiveSizeBytes)}</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">Last Scan</p>
        <p className="stat-value">{lastScanAt ? new Date(lastScanAt).toLocaleString() : "-"}</p>
      </article>
    </section>
  );
}

export default StatsRow;
