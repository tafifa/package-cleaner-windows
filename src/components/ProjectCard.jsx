const TYPE_STYLE = {
  js: { bg: "#FDF3C8", color: "#7A5C00", label: "JS" },
  php: { bg: "#E8EAF6", color: "#303F9F", label: "PHP" },
  flutter: { bg: "#E3F2FD", color: "#0D47A1", label: "Flutter" }
};

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(2)} MB`;
}

function ProjectCard({ project, maxSizeBytes, largeSizeThresholdMb, selected, onToggleSelect }) {
  const style = TYPE_STYLE[project.type] || TYPE_STYLE.js;
  const sizeMb = (project.packageSizeBytes || 0) / 1024 ** 2;
  const percentage = maxSizeBytes > 0 ? Math.round(((project.packageSizeBytes || 0) / maxSizeBytes) * 100) : 0;

  let statusText = "KECIL";
  let statusColor = "#22c55e";
  let barColor = "#22c55e";

  if (!project.packageExists || sizeMb <= 0) {
    statusText = "KOSONG";
    statusColor = "#ef4444";
    barColor = "#ef4444";
  } else if (project.inactive) {
    statusText = "INACTIVE";
    statusColor = "#a16207";
    barColor = "#a16207";
  } else if (sizeMb > largeSizeThresholdMb) {
    statusText = "BESAR";
    statusColor = "#dc2626";
    barColor = "#dc2626";
  } else if (sizeMb >= 100) {
    statusText = "SEDANG";
    statusColor = "#f59e0b";
    barColor = "#f59e0b";
  } else {
    statusText = "KECIL";
    statusColor = "#22c55e";
    barColor = "#22c55e";
  }

  return (
    <article className={`project-card ${selected ? "selected" : ""}`} onClick={() => onToggleSelect(project.id)}>
      <div className="project-header">
        <h3>{project.name}</h3>
        <span className="type-badge" style={{ backgroundColor: style.bg, color: style.color }}>
          {style.label}
        </span>
      </div>
      <p className="project-path" title={project.packagePath || project.projectPath}>
        {project.packagePath || project.projectPath}
      </p>
      <div className="project-meta">
        <span className="status-line">
          <span className="status-dot" style={{ backgroundColor: statusColor }} />
          <span style={{ color: statusColor }}>{statusText}</span>
        </span>
        <span>{formatBytes(project.packageSizeBytes || 0)}</span>
      </div>
      <div className="progress-outer">
        <div className="progress-inner" style={{ width: `${percentage}%`, backgroundColor: barColor }} />
      </div>
    </article>
  );
}

export default ProjectCard;
