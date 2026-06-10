export default function FloorEditorStatusBar({ cursorCoords }) {
  return (
    <footer className="fe__statusbar">
      <span className="fe__statusbar-coords">
        {cursorCoords
          ? `X: ${cursorCoords.x.toFixed(1)}  Y: ${cursorCoords.y.toFixed(1)}`
          : 'X: —  Y: —'}
      </span>
    </footer>
  )
}
