import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsRow from "./components/StatsRow";
import ProjectList from "./components/ProjectList";
import BottomBar from "./components/BottomBar";

const MB = 1024 * 1024;

const initialState = {
  projects: [],
  selectedIds: [],
  filter: "all",
  statusFilter: "all",
  sizeFilter: "all",
  search: "",
  isScanning: false,
  scanProgress: null,
  isRunningAction: false,
  rootFolders: [],
  terminalOutput: [],
  lastScanAt: null,
  settings: {
    rootFolders: [],
    autoScanOnOpen: false,
    largeSizeThresholdMb: 500
  }
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        },
        rootFolders: Array.isArray(action.payload.rootFolders)
          ? action.payload.rootFolders
          : state.rootFolders
      };
    case "SET_FILTER":
      return {
        ...state,
        filter: action.payload
      };
    case "SET_STATUS_FILTER":
      return {
        ...state,
        statusFilter: action.payload
      };
    case "SET_SIZE_FILTER":
      return {
        ...state,
        sizeFilter: action.payload
      };
    case "SET_SEARCH":
      return {
        ...state,
        search: action.payload
      };
    case "SET_RUNNING_ACTION":
      return {
        ...state,
        isRunningAction: action.payload
      };
    case "SET_SCANNING":
      return {
        ...state,
        isScanning: action.payload
      };
    case "SET_SCAN_PROGRESS":
      return {
        ...state,
        scanProgress: action.payload
      };
    case "SET_PROJECTS":
      return {
        ...state,
        projects: action.payload,
        selectedIds: [],
        lastScanAt: new Date().toISOString()
      };
    case "TOGGLE_SELECTED":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.payload)
          ? state.selectedIds.filter((id) => id !== action.payload)
          : [...state.selectedIds, action.payload]
      };
    case "CLEAR_SELECTED":
      return {
        ...state,
        selectedIds: []
      };
    case "SET_ROOTS":
      return {
        ...state,
        rootFolders: action.payload,
        settings: {
          ...state.settings,
          rootFolders: action.payload
        }
      };
    case "ADD_OUTPUT":
      return {
        ...state,
        terminalOutput: [...state.terminalOutput, action.payload]
      };
    case "CLEAR_OUTPUT":
      return {
        ...state,
        terminalOutput: []
      };
    default:
      return state;
  }
}

function getProjectStatus(project, largeSizeThresholdMb) {
  const sizeMb = (project.packageSizeBytes || 0) / MB;
  if (!project.packageExists || sizeMb <= 0) return "empty";
  if (project.inactive) return "inactive";
  if (sizeMb > largeSizeThresholdMb) return "large";
  if (sizeMb >= 100) return "medium";
  return "small";
}

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(2)} MB`;
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    packagePaths: [],
    previewPaths: [],
    totalSizeBytes: 0
  });

  const runScan = useCallback(async (roots) => {
    dispatch({ type: "SET_SCANNING", payload: true });
    dispatch({ type: "SET_SCAN_PROGRESS", payload: null });
    try {
      const projects = await window.electronAPI.scanFolders(roots);
      dispatch({ type: "SET_PROJECTS", payload: projects });
    } finally {
      dispatch({ type: "SET_SCANNING", payload: false });
      dispatch({ type: "SET_SCAN_PROGRESS", payload: null });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let offInstallOutput = null;
    let offScanProgress = null;

    window.electronAPI?.getSettings().then((settings) => {
      if (!isMounted || !settings) return;
      dispatch({ type: "SET_SETTINGS", payload: settings });
    });

    offInstallOutput = window.electronAPI?.onInstallOutput((line) => {
      dispatch({ type: "ADD_OUTPUT", payload: line });
    });

    offScanProgress = window.electronAPI?.onScanProgress((progress) => {
      dispatch({ type: "SET_SCAN_PROGRESS", payload: progress });
    });

    return () => {
      isMounted = false;
      if (typeof offInstallOutput === "function") offInstallOutput();
      if (typeof offScanProgress === "function") offScanProgress();
    };
  }, []);

  useEffect(() => {
    if (state.settings.autoScanOnOpen && state.rootFolders.length > 0) {
      runScan(state.rootFolders);
    }
  }, [runScan, state.settings.autoScanOnOpen, state.rootFolders]);

  useEffect(() => {
    if (!deleteModal.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDeleteModal((prev) => ({ ...prev, open: false }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteModal.open]);

  const thresholdMb = Number(state.settings.largeSizeThresholdMb) || 500;
  const smallLimitMb = 100;
  const mediumUpperMb = Math.max(thresholdMb, smallLimitMb + 1);

  const filteredProjects = useMemo(() => {
    return state.projects.filter((project) => {
      const searchTerm = state.search.trim().toLowerCase();
      const status = getProjectStatus(project, thresholdMb);
      const sizeMb = (project.packageSizeBytes || 0) / MB;

      if (searchTerm) {
        const byName = project.name.toLowerCase().includes(searchTerm);
        const byPath = (project.projectPath || "").toLowerCase().includes(searchTerm);
        if (!byName && !byPath) return false;
      }

      if (state.filter !== "all" && project.type !== state.filter) return false;
      if (state.statusFilter !== "all" && status !== state.statusFilter) return false;

      if (state.sizeFilter === "lt100" && sizeMb >= smallLimitMb) return false;
      if (state.sizeFilter === "100toThreshold" && (sizeMb < smallLimitMb || sizeMb > mediumUpperMb)) return false;
      if (state.sizeFilter === "gtThreshold" && sizeMb <= mediumUpperMb) return false;

      return true;
    });
  }, [
    state.projects,
    state.filter,
    state.statusFilter,
    state.sizeFilter,
    state.search,
    thresholdMb,
    smallLimitMb,
    mediumUpperMb
  ]);

  const totalSizeBytes = state.projects.reduce((sum, project) => sum + (project.packageSizeBytes || 0), 0);
  const inactiveSizeBytes = state.projects
    .filter((project) => project.inactive)
    .reduce((sum, project) => sum + (project.packageSizeBytes || 0), 0);
  const selectedProjects = state.projects.filter((project) => state.selectedIds.includes(project.id));
  const selectedSizeBytes = selectedProjects.reduce((sum, project) => sum + (project.packageSizeBytes || 0), 0);

  const handleScan = async () => {
    await runScan(state.rootFolders);
  };

  const handleAddRoot = async () => {
    const selected = await window.electronAPI.selectFolder();
    if (!selected) return;

    const nextRoots = [...new Set([...state.rootFolders, selected])];
    dispatch({ type: "SET_ROOTS", payload: nextRoots });
    await window.electronAPI.saveSettings({
      ...state.settings,
      rootFolders: nextRoots
    });
  };

  const handleRemoveRoot = async (targetRoot) => {
    const nextRoots = state.rootFolders.filter((root) => root !== targetRoot);
    dispatch({ type: "SET_ROOTS", payload: nextRoots });
    await window.electronAPI.saveSettings({
      ...state.settings,
      rootFolders: nextRoots
    });
  };

  const handleSettingsChange = async (partialSettings) => {
    const nextSettings = { ...state.settings, ...partialSettings };
    dispatch({ type: "SET_SETTINGS", payload: nextSettings });
    await window.electronAPI.saveSettings(nextSettings);
  };

  const handleResetFilters = () => {
    dispatch({ type: "SET_FILTER", payload: "all" });
    dispatch({ type: "SET_STATUS_FILTER", payload: "all" });
    dispatch({ type: "SET_SIZE_FILTER", payload: "all" });
    dispatch({ type: "SET_SEARCH", payload: "" });
  };

  const handleClearSelected = () => {
    dispatch({ type: "CLEAR_SELECTED" });
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.length === 0) return;

    const packagePaths = [...new Set(selectedProjects.flatMap((project) => project.packagePaths || []))];
    if (packagePaths.length === 0) {
      window.alert("Tidak ada folder packages yang bisa dihapus.");
      return;
    }

    const previewPaths = packagePaths.slice(0, 8);
    setDeleteModal({
      open: true,
      packagePaths,
      previewPaths,
      totalSizeBytes: selectedSizeBytes
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.packagePaths.length) return;

    setDeleteModal((prev) => ({ ...prev, open: false }));
    dispatch({ type: "SET_RUNNING_ACTION", payload: true });
    try {
      const results = await window.electronAPI.deletePackages(deleteModal.packagePaths);
      const failed = results.filter((item) => !item.ok).length;
      dispatch({
        type: "ADD_OUTPUT",
        payload: `Delete completed. Success: ${results.length - failed}, Failed: ${failed}\n`
      });
      await runScan(state.rootFolders);
    } finally {
      dispatch({ type: "SET_RUNNING_ACTION", payload: false });
    }
  };

  const handleReinstallSelected = async () => {
    if (selectedProjects.length === 0) return;

    dispatch({ type: "SET_RUNNING_ACTION", payload: true });
    dispatch({ type: "CLEAR_OUTPUT" });

    try {
      for (const project of selectedProjects) {
        dispatch({
          type: "ADD_OUTPUT",
          payload: `\n> Reinstall ${project.name} (${project.type})\n`
        });
        const result = await window.electronAPI.reinstallPackages(project.projectPath, project.type);
        dispatch({
          type: "ADD_OUTPUT",
          payload: `Exit code: ${result.code}\n`
        });
      }
      await runScan(state.rootFolders);
    } finally {
      dispatch({ type: "SET_RUNNING_ACTION", payload: false });
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        roots={state.rootFolders}
        settings={state.settings}
        onAddRoot={handleAddRoot}
        onRemoveRoot={handleRemoveRoot}
        onSettingsChange={handleSettingsChange}
      />
      <main className="main-panel">
        <TopBar
          isScanning={state.isScanning}
          scanProgress={state.scanProgress}
          onScan={handleScan}
          search={state.search}
          onSearchChange={(value) => dispatch({ type: "SET_SEARCH", payload: value })}
        />
        <StatsRow
          totalProjects={state.projects.length}
          totalSizeBytes={totalSizeBytes}
          inactiveSizeBytes={inactiveSizeBytes}
          lastScanAt={state.lastScanAt}
        />
        <section className="filter-toolbar">
          <div className="filter-group">
            <p className="filter-title">Type</p>
            <div className="filters">
              {["all", "js", "php", "flutter"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`chip ${state.filter === type ? "active" : ""}`}
                  onClick={() => dispatch({ type: "SET_FILTER", payload: type })}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <p className="filter-title">Status</p>
            <div className="filters">
              {[
                { key: "all", label: "Semua" },
                { key: "empty", label: "Kosong" },
                { key: "small", label: "Kecil" },
                { key: "medium", label: "Sedang" },
                { key: "large", label: "Besar" },
                { key: "inactive", label: "Inactive" }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip ${state.statusFilter === item.key ? "active" : ""}`}
                  onClick={() => dispatch({ type: "SET_STATUS_FILTER", payload: item.key })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <p className="filter-title">Size</p>
            <div className="filters">
              {[
                { key: "all", label: "Semua" },
                { key: "lt100", label: "<100MB" },
                { key: "100toThreshold", label: `100-${mediumUpperMb}MB` },
                { key: "gtThreshold", label: `>${mediumUpperMb}MB` }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip ${state.sizeFilter === item.key ? "active" : ""}`}
                  onClick={() => dispatch({ type: "SET_SIZE_FILTER", payload: item.key })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="chip ghost" onClick={handleResetFilters}>
            Reset Filter
          </button>
        </section>
        <section className="list-summary">
          <p>
            Showing {filteredProjects.length} of {state.projects.length} projects
          </p>
          <p>
            {state.selectedIds.length > 0
              ? `${state.selectedIds.length} selected (${formatBytes(selectedSizeBytes)})`
              : "Pilih project untuk aksi massal"}
          </p>
        </section>
        <ProjectList
          projects={filteredProjects}
          allProjectsCount={state.projects.length}
          isScanning={state.isScanning}
          selectedIds={state.selectedIds}
          largeSizeThresholdMb={thresholdMb}
          onScan={handleScan}
          onResetFilters={handleResetFilters}
          onToggleSelect={(id) => dispatch({ type: "TOGGLE_SELECTED", payload: id })}
        />
        <BottomBar
          selectedCount={state.selectedIds.length}
          selectedSizeText={formatBytes(selectedSizeBytes)}
          isBusy={state.isScanning || state.isRunningAction}
          terminalOutput={state.terminalOutput}
          onClearOutput={() => dispatch({ type: "CLEAR_OUTPUT" })}
          onClearSelected={handleClearSelected}
          onDeleteSelected={handleDeleteSelected}
          onReinstallSelected={handleReinstallSelected}
        />
      </main>
      {deleteModal.open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteModal((prev) => ({ ...prev, open: false }))}>
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete packages"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Konfirmasi Hapus Folder Packages</h3>
            <p>
              Anda akan memindahkan <strong>{deleteModal.packagePaths.length}</strong> folder ke Recycle Bin.
            </p>
            <p>
              Total size terpilih: <strong>{formatBytes(deleteModal.totalSizeBytes)}</strong>
            </p>
            <div className="modal-paths">
              {deleteModal.previewPaths.map((item) => (
                <p key={item} title={item}>
                  {item}
                </p>
              ))}
              {deleteModal.packagePaths.length > deleteModal.previewPaths.length ? (
                <p className="muted">+{deleteModal.packagePaths.length - deleteModal.previewPaths.length} path lainnya...</p>
              ) : null}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-muted"
                onClick={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
              >
                Batal
              </button>
              <button type="button" className="btn-muted danger" onClick={handleConfirmDelete}>
                Ya, Hapus
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
