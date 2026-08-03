import { Suspense, lazy, useMemo } from "react";
import { LuSettings2, LuX } from "react-icons/lu";
import { MONO, mark, seedFor } from "../core/styles";
import { tileStyle } from "../core/tileStyle";
import { useRefresh } from "../sdk/useRefresh";
import { getWidget, typeOf } from "../widgets/registry";
import ErrorBoundary from "./ErrorBoundary";

// One lazy component per widget type, memoized so remounting a tile does not
// re-trigger the dynamic import.
const lazyCache = new Map();
function lazyFor(manifest) {
  if (!lazyCache.has(manifest.id)) {
    lazyCache.set(
      manifest.id,
      lazy(async () => {
        const mod = await manifest.load();
        return { default: mod.default || mod };
      })
    );
  }
  return lazyCache.get(manifest.id);
}

function TileButton({ label, onClick, children, style }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "12px",
        padding: "5px 9px",
        borderRadius: "999px",
        cursor: "pointer",
        background: "var(--panel2)",
        border: "1px solid var(--line)",
        color: "var(--fg)",
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accentSoft)";
        e.currentTarget.style.borderColor = "var(--accentLine)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--panel2)";
        e.currentTarget.style.borderColor = "var(--line)";
      }}
    >
      {children}
    </button>
  );
}

function Tile({
  instanceId,
  appearance,
  columns,
  size,
  options,
  config,
  editing,
  zoomed,
  focused,
  zoomMode,
  panelOpen,
  menuTarget,
  dragging = false,
  rate,
  manualRefresh = 0,
  tileRef,
  onOpen,
  onMenu,
  onSettings,
  onClose,
  onResize,
  onRemove,
  onPointerDown,
  setConfig,
  setOptions,
  toast,
}) {
  const manifest = getWidget(instanceId);
  // Each tile polls on its own configured rate; `manualRefresh` lets the
  // context menu's "Refresh now" force one immediately.
  const tick = useRefresh(rate);
  const refreshKey = tick + manualRefresh;
  const style = useMemo(
    () =>
      tileStyle({
        theme: appearance.theme,
        radius: appearance.radius,
        alpha: appearance.alpha,
        size,
        columns,
        editing,
        menuTarget,
        zoomed,
        focused,
        zoomMode,
        panelOpen,
      }),
    [appearance, size, columns, editing, menuTarget, zoomed, focused, zoomMode, panelOpen]
  );

  if (!manifest) return null;
  const Widget = lazyFor(manifest);

  return (
    <div
      ref={tileRef}
      // FLIP identifies tiles by this across reorders and resizes.
      data-flip-id={instanceId}
      style={{
        ...style,
        // Held tiles lift off the board and stop animating their own box, so
        // the pointer transform is the only thing moving them.
        ...(dragging
          ? {
              boxShadow: "0 26px 60px rgba(0,0,0,.42)",
              cursor: "grabbing",
              opacity: 0.97,
            }
          : null),
      }}
      onPointerDown={onPointerDown}
      onClick={onOpen}
      onContextMenu={onMenu}
      // Focusable so keyboard users can reach a tile and open it with Enter,
      // and so the ContextMenu key targets the tile rather than the page.
      // The guard keeps Enter inside a widget's own inputs from zooming.
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      role="group"
      aria-label={manifest.name}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "8px",
          flex: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={mark(seedFor(typeOf(instanceId)), 14)} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--faint)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {manifest.name}
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px", flex: "none" }}>
          {focused ? (
            <>
              <TileButton
                label="Widget settings"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings?.();
                }}
              >
                <LuSettings2 size={12} />
                <span>Settings</span>
              </TileButton>
              <TileButton
                label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                style={{ padding: "5px 7px" }}
              >
                <LuX size={13} />
              </TileButton>
            </>
          ) : null}
          {editing ? (
            <>
              <TileButton
                label="Resize"
                onClick={(e) => {
                  e.stopPropagation();
                  onResize?.();
                }}
                style={{ fontFamily: MONO, fontSize: "10px", padding: "3px 7px" }}
              >
                {size.join("×")}
              </TileButton>
              <TileButton
                label={`Remove ${manifest.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                style={{ padding: "4px 6px" }}
              >
                <LuX size={12} />
              </TileButton>
            </>
          ) : null}
        </div>
      </div>

      {/* A crashing widget shows a retry inside its own tile rather than
          taking down the board. */}
      <ErrorBoundary compact label={manifest.name}>
        <Suspense fallback={<div style={{ flex: 1 }} />}>
          <Widget
            id={instanceId}
            size={size}
            columns={columns}
            options={options}
            config={config}
            focused={focused}
            editing={editing}
            refreshKey={refreshKey}
            setConfig={setConfig}
            setOptions={setOptions}
            toast={toast}
            openSettings={onSettings}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default Tile;
