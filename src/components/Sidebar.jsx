function Sidebar({ roots, settings, onAddRoot, onRemoveRoot, onSettingsChange }) {
  return (
    <aside className="sidebar">
      <h1 className="app-title">PackClean</h1>
      <p className="app-subtitle">Package Folder Manager</p>
      <button type="button" className="btn-primary" onClick={onAddRoot}>
        + Add Root Folder
      </button>
      <div className="roots-block">
        <h2>Root Folders</h2>
        {roots.length === 0 ? (
          <p className="muted">No root folders yet.</p>
        ) : (
          roots.map((root) => (
            <div className="root-row" key={root}>
              <p className="root-item" title={root}>
                {root}
              </p>
              <button type="button" className="btn-delete-root" onClick={() => onRemoveRoot(root)}>
                x
              </button>
            </div>
          ))
        )}
      </div>
      <div className="settings-block">
        <h2>Settings</h2>
        <label className="setting-line">
          <input
            type="checkbox"
            checked={Boolean(settings.autoScanOnOpen)}
            onChange={(event) => onSettingsChange({ autoScanOnOpen: event.target.checked })}
          />
          <span>Auto scan on open</span>
        </label>
        <label className="setting-line">
          <span>Large size threshold (MB)</span>
          <input
            type="number"
            min="100"
            step="50"
            value={settings.largeSizeThresholdMb ?? 500}
            onChange={(event) => onSettingsChange({ largeSizeThresholdMb: Number(event.target.value) || 500 })}
          />
        </label>
      </div>
    </aside>
  );
}

export default Sidebar;
