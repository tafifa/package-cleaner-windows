import ProjectCard from "./ProjectCard";

function ProjectList({ projects, selectedIds, largeSizeThresholdMb, onToggleSelect }) {
  if (!projects.length) {
    return <section className="project-list empty">Belum ada project. Tambahkan root folder lalu scan.</section>;
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
