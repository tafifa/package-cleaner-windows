import { useState } from "react";

function BottomBar({
  selectedCount,
  selectedSizeText,
  isBusy,
  terminalOutput,
  onClearOutput,
  onDeleteSelected,
  onReinstallSelected
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasSelection = selectedCount > 0;

  return (
    <footer className="bottom-bar">
      <div className={`bulk-bar ${hasSelection ? "show" : ""}`}>
        <div className="bulk-summary">
          <strong>{selectedCount}</strong>
          <span>project terpilih</span>
          <span>{selectedSizeText}</span>
        </div>
        <div className="bulk-actions">
          <button type="button" className="btn-muted danger" disabled={!hasSelection || isBusy} onClick={onDeleteSelected}>
            Delete Selected
          </button>
          <button
            type="button"
            className="btn-muted"
            disabled={!hasSelection || isBusy}
            onClick={onReinstallSelected}
          >
            Reinstall Selected
          </button>
        </div>
      </div>

      <div className="terminal-box">
        <div className="terminal-head">
          <span>Terminal Output</span>
          <div className="terminal-head-actions">
            <button type="button" className="btn-clear" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <button type="button" className="btn-clear" onClick={onClearOutput}>
              Clear
            </button>
          </div>
        </div>
        {!collapsed ? <pre>{terminalOutput.length ? terminalOutput.join("") : "No output yet."}</pre> : null}
      </div>
    </footer>
  );
}

export default BottomBar;
