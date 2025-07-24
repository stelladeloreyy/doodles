import { useRef, useState, useEffect } from 'react'

type Point = { x: number, y: number }
type Line = Point[]

interface DrawingCanvasProps {
  onSave: (dataUrl: string, title: string, author: string) => Promise<void>
  title: string
  setTitle: (t: string) => void
  author: string
  setAuthor: (a: string) => void
  titleError: string
}

export default function DrawingCanvas({
  onSave,
  title,
  setTitle,
  author,
  setAuthor,
  titleError,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line>([])
  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null)

  // Chaikin's algorithm for smoothing a line
  function smoothLine(line: { x: number, y: number }[], iterations = 2) {
    let pts = line
    for (let iter = 0; iter < iterations; iter++) {
      if (pts.length < 3) break
      const newPts = [pts[0]]
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]
        const p1 = pts[i + 1]
        newPts.push({
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        })
        newPts.push({
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        })
      }
      newPts.push(pts[pts.length - 1])
      pts = newPts
    }
    return pts
  }

  // Redraw canvas when lines change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#9c4d95'
    ctx.lineWidth = 2
    lines.forEach(line => {
      if (line.length === 1) {
        // Draw a dot for single-point lines, radius = lineWidth
        ctx.fillStyle = '#9c4d95'
        ctx.beginPath()
        ctx.arc(line[0].x, line[0].y, ctx.lineWidth, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        const smooth = smoothLine(line, 2)
        if (smooth.length === 0) return
        ctx.beginPath()
        ctx.moveTo(smooth[0].x, smooth[0].y)
        for (let i = 1; i < smooth.length; i++) {
          ctx.lineTo(smooth[i].x, smooth[i].y)
        }
        ctx.stroke()
      }
    })
  }, [lines])

  const getOffset = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent) => {
    const { x, y } = getOffset(e)
    setDrawing(true)
    setMouseDownPos({ x, y })
    setCurrentLine([{ x, y }])
  }

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return
    const { x, y } = getOffset(e)
    setCurrentLine(line => [...line, { x, y }])
  }

  const stopDrawing = (e: React.MouseEvent) => {
    if (!drawing) return
    setDrawing(false)
    const { x, y } = getOffset(e)
    if (
      mouseDownPos &&
      Math.abs(mouseDownPos.x - x) < 2 &&
      Math.abs(mouseDownPos.y - y) < 2
    ) {
      // Treat as a dot (single-point line)
      setLines(lines => [...lines, [{ x: mouseDownPos.x, y: mouseDownPos.y }]])
    } else if (currentLine.length > 1) {
      setLines(lines => [...lines, currentLine])
    }
    setCurrentLine([])
    setMouseDownPos(null)
  }

  // Draw current line as user draws
  useEffect(() => {
    if (!drawing || currentLine.length < 2) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#9c4d95'
    ctx.lineWidth = 2
    lines.forEach(line => {
      if (line.length === 1) {
        ctx.fillStyle = '#9c4d95'
        ctx.beginPath()
        ctx.arc(line[0].x, line[0].y, ctx.lineWidth, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        const smooth = smoothLine(line, 2)
        if (smooth.length === 0) return
        ctx.beginPath()
        ctx.moveTo(smooth[0].x, smooth[0].y)
        for (let i = 1; i < smooth.length; i++) {
          ctx.lineTo(smooth[i].x, smooth[i].y)
        }
        ctx.stroke()
      }
    })
    const smooth = smoothLine(currentLine, 2)
    ctx.beginPath()
    ctx.moveTo(smooth[0].x, smooth[0].y)
    for (let i = 1; i < smooth.length; i++) {
      ctx.lineTo(smooth[i].x, smooth[i].y)
    }
    ctx.stroke()
  }, [currentLine, drawing, lines])

  const clearCanvas = () => {
    setLines([])
    setCurrentLine([])
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    await onSave(dataUrl, title, author)
    clearCanvas()
    setTitle('')
    setAuthor('')
  }

  const handleUndo = () => {
    setLines(lines => lines.slice(0, -1))
    setCurrentLine([])
  }

  return (
    <div className='creation-container'>
      <h2>Draw below!</h2>
      <canvas
        ref={canvasRef}
        width={'250px'}
        height={'300px'}
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
    </div>
  )
}
