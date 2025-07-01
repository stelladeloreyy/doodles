import { useRef, useState } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
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
    alert('Drawing saved!');
  };

  return (
    <>
      <h2>Draw below!</h2>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{ border: '1px solid #ccc', background: '#fff', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <br />
      <button onClick={handleSave}>Save Drawing</button>
    </>
  )
}

export default App
