import { useRef, useState, useEffect } from 'react'
import './App.css'

type Point = { x: number, y: number }
type Line = Point[]

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawings, setDrawings] = useState<{
    id: number,
    drawing_data: string,
    text: string,
    author?: string,
    created_at: string
  }[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line>([]);
  const [showCanvas, setShowCanvas] = useState(true);
  const [page, setPage] = useState(0); // For pagination
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [titleError, setTitleError] = useState('');

  // Fetch previous drawings on mount
  useEffect(() => {
    fetch('http://localhost:4000/api/drawings')
      .then(res => res.json())
      .then(setDrawings)
      .catch(() => setDrawings([]));
  }, []);

  // Chaikin's algorithm for smoothing a line
  function smoothLine(line: { x: number, y: number }[], iterations = 2) {
    let pts = line;
    for (let iter = 0; iter < iterations; iter++) {
      if (pts.length < 3) break;
      const newPts = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        newPts.push({
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        });
        newPts.push({
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        });
      }
      newPts.push(pts[pts.length - 1]);
      pts = newPts;
    }
    return pts;
  }

  // Redraw canvas when lines change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    lines.forEach(line => {
      const smooth = smoothLine(line, 2); // Reduced iterations for less stabilization
      if (smooth.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(smooth[0].x, smooth[0].y);
      for (let i = 1; i < smooth.length; i++) {
        ctx.lineTo(smooth[i].x, smooth[i].y);
      }
      ctx.stroke();
    });
  }, [lines]);

  const getOffset = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true);
    const { x, y } = getOffset(e);
    setCurrentLine([{ x, y }]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return;
    const { x, y } = getOffset(e);
    setCurrentLine(line => [...line, { x, y }]);
  };

  const stopDrawing = () => {
    if (drawing && currentLine.length > 0) {
      setLines(lines => [...lines, currentLine]);
      setCurrentLine([]);
    }
    setDrawing(false);
  };

  // Draw current line as user draws
  useEffect(() => {
    if (!drawing || currentLine.length < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Redraw everything to avoid artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    // Draw previous lines
    lines.forEach(line => {
      const smooth = smoothLine(line, 2);
      if (smooth.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(smooth[0].x, smooth[0].y);
      for (let i = 1; i < smooth.length; i++) {
        ctx.lineTo(smooth[i].x, smooth[i].y);
      }
      ctx.stroke();
    });
    // Draw current line (smoothed)
    const smooth = smoothLine(currentLine, 2); 
    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    for (let i = 1; i < smooth.length; i++) {
      ctx.lineTo(smooth[i].x, smooth[i].y);
    }
    ctx.stroke();
  }, [currentLine, drawing, lines]);

  const clearCanvas = () => {
    setLines([]);
    setCurrentLine([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Send to backend
    await fetch('http://localhost:4000/api/drawings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawingData: dataUrl, text: title, author: author.trim() })
    });
    // Refresh drawings list
    fetch('http://localhost:4000/api/drawings')
      .then(res => res.json())
      .then(setDrawings)
      .catch(() => setDrawings([]));
    // Clear the canvas and fields after saving
    clearCanvas();
    setTitle('');
    setAuthor('');
  };

  const handleUndo = () => {
    setLines(lines => lines.slice(0, -1));
    setCurrentLine([]);
  };

  // Helper to get paginated, reverse chronological drawings
  const drawingsPerPage = 9;
  const sortedDrawings = [...drawings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalPages = Math.ceil(sortedDrawings.length / drawingsPerPage);
  const paginatedDrawings = sortedDrawings.slice(page * drawingsPerPage, (page + 1) * drawingsPerPage);

  // Dropdown state for page selection
  const [showDropdown, setShowDropdown] = useState(false);

  // Helper to render page numbers with ... and dropdown
  function renderPageNumbers() {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => { setPage(i); setShowDropdown(false); }}
          style={{
            fontWeight: page === i ? 'bold' : undefined,
            textDecoration: page === i ? 'underline' : undefined,
            margin: '0 2px'
          }}
        >
          {i + 1}
        </button>
      ));
    }
    // More than 3 pages
    const first = 0;
    const last = totalPages - 1;
    const current = page;
    let buttons = [
      <button
        key={first}
        onClick={() => { setPage(first); setShowDropdown(false); }}
        style={{
          fontWeight: current === first ? 'bold' : undefined,
          textDecoration: current === first ? 'underline' : undefined,
          margin: '0 2px'
        }}
      >{first + 1}</button>
    ];

    // If current page is near the start
    if (current <= 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => { setPage(1); setShowDropdown(false); }}
          style={{
            fontWeight: current === 1 ? 'bold' : undefined,
            textDecoration: current === 1 ? 'underline' : undefined,
            margin: '0 2px'
          }}
        >2</button>
      );
      buttons.push(
        <span key="dots" style={{ margin: '0 2px', cursor: 'pointer', position: 'relative' }}>
          ...
          <span
            style={{ cursor: 'pointer', color: '#646cff', marginLeft: 2 }}
            onClick={() => setShowDropdown(v => !v)}
          >▼</span>
          {showDropdown && (
            <div style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid #ccc',
              zIndex: 10,
              left: 0,
              top: 18,
              minWidth: 40
            }}>
              {Array.from({ length: totalPages - 3 }, (_, i) => (
                <div
                  key={i + 2}
                  style={{
                    padding: '2px 8px',
                    background: page === i + 2 ? '#eee' : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => { setPage(i + 2); setShowDropdown(false); }}
                >
                  {i + 3}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }
    // If current page is near the end
    else if (current >= totalPages - 2) {
      buttons.push(
        <span key="dots" style={{ margin: '0 2px', cursor: 'pointer', position: 'relative' }}>
          ...
          <span
            style={{ cursor: 'pointer', color: '#646cff', marginLeft: 2 }}
            onClick={() => setShowDropdown(v => !v)}
          >▼</span>
          {showDropdown && (
            <div style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid #ccc',
              zIndex: 10,
              left: 0,
              top: 18,
              minWidth: 40
            }}>
              {Array.from({ length: totalPages - 3 }, (_, i) => (
                <div
                  key={i + 1}
                  style={{
                    padding: '2px 8px',
                    background: page === i + 1 ? '#eee' : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => { setPage(i + 1); setShowDropdown(false); }}
                >
                  {i + 2}
                </div>
              ))}
            </div>
          )}
        </span>
      );
      buttons.push(
        <button
          key={last - 1}
          onClick={() => { setPage(last - 1); setShowDropdown(false); }}
          style={{
            fontWeight: current === last - 1 ? 'bold' : undefined,
            textDecoration: current === last - 1 ? 'underline' : undefined,
            margin: '0 2px'
          }}
        >{last}</button>
      );
    }
    // If current page is in the middle
    else {
      buttons.push(
        <span key="dots1" style={{ margin: '0 2px', cursor: 'pointer', position: 'relative' }}>
          ...
          <span
            style={{ cursor: 'pointer', color: '#646cff', marginLeft: 2 }}
            onClick={() => setShowDropdown(v => !v)}
          >▼</span>
          {showDropdown && (
            <div style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid #ccc',
              zIndex: 10,
              left: 0,
              top: 18,
              minWidth: 40
            }}>
              {Array.from({ length: totalPages - 3 }, (_, i) => (
                <div
                  key={i + 1}
                  style={{
                    padding: '2px 8px',
                    background: page === i + 1 ? '#eee' : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => { setPage(i + 1); setShowDropdown(false); }}
                >
                  {i + 2}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }
    buttons.push(
      <button
        key={last}
        onClick={() => { setPage(last); setShowDropdown(false); }}
        style={{
          fontWeight: current === last ? 'bold' : undefined,
          textDecoration: current === last ? 'underline' : undefined,
          margin: '0 2px'
        }}
      >{last + 1}</button>
    );
    return buttons;
  }

  return (
    <div className='container'>
      {showCanvas && (
        <div className='creation-container'>
          <h2>Draw below!</h2>
          <canvas
              ref={canvasRef}
              width={window.innerWidth / 4}
              height={window.innerWidth / 5}
              style={{ border: '1px solid #ccc', background: '#fff', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
          />
          <br />
          <div style={{ margin: '12px 0' }}>
            <input
              type="text"
              placeholder="Title (required)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ width: 200, marginRight: 8 }}
            />
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              style={{ width: 160 }}
            />
          </div>
          {titleError && <div style={{ color: 'red', fontSize: 12 }}>{titleError}</div>}
          <button onClick={handleSave}>Save Drawing</button>
          <button onClick={clearCanvas} style={{ marginLeft: 8 }}>Clear</button>
          <button onClick={handleUndo} style={{ marginLeft: 8 }} disabled={lines.length === 0}>Undo</button>
          <button onClick={() => setShowCanvas(false)}>Photo Display</button>
        </div>
      )}
      {!showCanvas && (
        <div className='display-container'>
          <h3>Previous Drawings</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              gap: 16,
              justifyContent: 'center',
              marginBottom: 20,
              maxWidth: window.innerWidth / 8 * 3 + 32,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            {paginatedDrawings.map(d => (
              <div key={d.id} style={{ border: '1px solid #ccc', padding: 8, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={d.drawing_data}
                  alt={`Drawing ${d.id}`}
                  style={{
                    width: window.innerWidth / 8,
                    height: window.innerWidth / 10,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
                <div style={{ fontWeight: 'bold', marginTop: 4 }}>{d.text || <span style={{ color: '#aaa' }}>Untitled</span>}</div>
                {d.author && d.author.trim() !== '' && (
                  <div style={{ fontSize: 12, color: '#555' }}>by {d.author}</div>
                )}
                <div style={{ fontSize: 10, color: '#888' }}>{new Date(d.created_at).toLocaleString()}</div>
              </div>
            ))}
            {Array.from({ length: drawingsPerPage - paginatedDrawings.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', position: 'relative' }}>
            <button onClick={() => { setPage(p => Math.max(0, p - 1)); setShowDropdown(false); }} disabled={page === 0}>Back</button>
            {renderPageNumbers()}
            <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setShowDropdown(false); }} disabled={page >= totalPages - 1}>Next</button>
          </div>
          <button style={{ marginTop: 16 }} onClick={() => { setShowCanvas(true); setPage(0); setShowDropdown(false); }}>Draw Photos</button>
        </div>
      )}
    </div>
  )
}

export default App;
