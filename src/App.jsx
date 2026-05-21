import { useCallback, useEffect, useMemo, useReducer } from "react";
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

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

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

  const selectedProjects = state.projects.filter((project) => state.selectedIds.includes(project.id));

  const handleDeleteSelected = async () => {
    if (selectedProjects.length === 0) return;

    const packagePaths = [...new Set(selectedProjects.flatMap((project) => project.packagePaths || []))];
    if (packagePaths.length === 0) {
      window.alert("Tidak ada folder packages yang bisa dihapus.");
      return;
    }

    if (!window.confirm(`Hapus ${packagePaths.length} folder ke Recycle Bin?`)) return;

    dispatch({ type: "SET_RUNNING_ACTION", payload: true });
    try {
      const results = await window.electronAPI.deletePackages(packagePaths);
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
        <div className="filters">
          {[
            { key: "all", label: "All Status" },
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
          {[
            { key: "all", label: "All Size" },
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
        <ProjectList
          projects={filteredProjects}
          selectedIds={state.selectedIds}
          largeSizeThresholdMb={thresholdMb}
          onToggleSelect={(id) => dispatch({ type: "TOGGLE_SELECTED", payload: id })}
        />
        <BottomBar
          selectedCount={state.selectedIds.length}
          isBusy={state.isScanning || state.isRunningAction}
          terminalOutput={state.terminalOutput}
          onClearOutput={() => dispatch({ type: "CLEAR_OUTPUT" })}
          onDeleteSelected={handleDeleteSelected}
          onReinstallSelected={handleReinstallSelected}
        />
      </main>
    </div>
  );
}

export default App;
