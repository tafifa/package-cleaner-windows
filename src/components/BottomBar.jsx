function BottomBar({
  selectedCount,
  isBusy,
  terminalOutput,
  onClearOutput,
  onDeleteSelected,
  onReinstallSelected
}) {
  return (
    <footer className="bottom-bar">
      <div className="bottom-actions">
        <span>{selectedCount} selected</span>
        <button type="button" className="btn-muted" disabled={selectedCount === 0 || isBusy} onClick={onDeleteSelected}>
          Delete Selected
        </button>
        <button
          type="button"
          className="btn-muted"
          disabled={selectedCount === 0 || isBusy}
          onClick={onReinstallSelected}
        >
          Reinstall
        </button>
      </div>

      <div className="terminal-box">
        <div className="terminal-head">
          <span>Terminal Output</span>
          <button type="button" className="btn-clear" onClick={onClearOutput}>
            Clear
          </button>
        </div>
        <pre>{terminalOutput.length ? terminalOutput.join("") : "No output yet."}</pre>
      </div>
    </footer>
  );
}

export default BottomBar;
