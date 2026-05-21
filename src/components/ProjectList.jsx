import ProjectCard from "./ProjectCard";

function ProjectList({
  projects,
  allProjectsCount,
  isScanning,
  selectedIds,
  largeSizeThresholdMb,
  onScan,
  onResetFilters,
  onToggleSelect
}) {
  if (!projects.length) {
    if (isScanning) {
      return <section className="project-list empty-state">Scanning folders, please wait...</section>;
    }

    if (allProjectsCount > 0) {
      return (
        <section className="project-list empty-state">
          <h3>Tidak ada project yang cocok dengan filter</h3>
          <p>Coba reset filter atau gunakan kata kunci pencarian yang berbeda.</p>
          <button type="button" className="btn-muted" onClick={onResetFilters}>
            Reset Filter
          </button>
        </section>
      );
    }

    return (
      <section className="project-list empty-state">
        <h3>Belum ada data project</h3>
        <p>Tambahkan root folder di sidebar lalu jalankan scan pertama.</p>
        <button type="button" className="btn-primary" onClick={onScan}>
          Scan Sekarang
        </button>
      </section>
    );
  }

  const maxSizeBytes = Math.max(...projects.map((project) => project.packageSizeBytes || 0), 0);

  return (
    <section className="project-list">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          maxSizeBytes={maxSizeBytes}
          largeSizeThresholdMb={largeSizeThresholdMb}
          selected={selectedIds.includes(project.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </section>
  );
}

export default ProjectList;
