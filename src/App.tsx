import { useRef, useState, useEffect } from 'react'
import './App.css'

type Point = { x: number, y: number }
type Line = Point[]

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawings, setDrawings] = useState<{ id: number, drawing_data: string, text: string, created_at: string }[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line>([]);
  const [showCanvas, setShowCanvas] = useState(true);

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
      const smooth = smoothLine(line, 2); // Reduced iterations for less stabilization
      if (smooth.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(smooth[0].x, smooth[0].y);
      for (let i = 1; i < smooth.length; i++) {
        ctx.lineTo(smooth[i].x, smooth[i].y);
      }
      ctx.stroke();
    });
    // Draw current line (smoothed)
    const smooth = smoothLine(currentLine, 2); // Reduced iterations for less stabilization
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Send to backend
    await fetch('http://localhost:4000/api/drawings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawingData: dataUrl, text: '' })
    });

    // alert('Drawing saved!');
    
    // Refresh drawings list
    fetch('http://localhost:4000/api/drawings')
      .then(res => res.json())
      .then(setDrawings)
      .catch(() => setDrawings([]));
    // Clear the canvas after saving
    clearCanvas();
  };

  const handleUndo = () => {
    setLines(lines => lines.slice(0, -1));
    setCurrentLine([]);
  };

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
          <button onClick={handleSave}>Save Drawing</button>
          <button onClick={clearCanvas} style={{ marginLeft: 8 }}>Clear</button>
          <button onClick={handleUndo} style={{ marginLeft: 8 }} disabled={lines.length === 0}>Undo</button>
          <button onClick={() => setShowCanvas(false)}>Photo Display</button>
        </div>
      )}
      {!showCanvas && (
        <div className='display-container'>
          <h3>Previous Drawings</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
            {drawings.map(d => (
              <div key={d.id} style={{ border: '1px solid #ccc', padding: 8, background: '#fff' }}>
                <img src={d.drawing_data} alt={`Drawing ${d.id}`} style={{ width: window.innerWidth / 8, height: window.innerWidth / 10, objectFit: 'contain', display: 'block' }} />
                <div style={{ fontSize: 10, color: '#888' }}>{new Date(d.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowCanvas(true)}>Draw Photos</button>
        </div>
      )}
    </div>
  )
}

export default App;
