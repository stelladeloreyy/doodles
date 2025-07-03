import { useState, useEffect } from 'react'
import './App.css'
import DrawingCanvas from './components/DrawingCanvas'
import DrawingGallery from './components/DrawingGallery'

type Drawing = {
  id: number,
  drawing_data: string,
  text: string,
  author?: string,
  created_at: string
}

function App() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [showCanvas, setShowCanvas] = useState(true)
  const [page, setPage] = useState(0)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [titleError, setTitleError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch previous drawings on mount
  useEffect(() => {
    fetch('http://localhost:4000/api/drawings')
      .then(res => res.json())
      .then(setDrawings)
      .catch(() => setDrawings([]))
  }, [])

  // Save handler for DrawingCanvas
  const handleSave = async (dataUrl: string, title: string, author: string) => {
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }
    setTitleError('')
    await fetch('http://localhost:4000/api/drawings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawingData: dataUrl, text: title, author: author.trim() })
    })
    // Refresh drawings list
    fetch('http://localhost:4000/api/drawings')
      .then(res => res.json())
      .then(setDrawings)
      .catch(() => setDrawings([]))
  }

  // Pagination and sorting
  const drawingsPerPage = 9
  const sortedDrawings = [...drawings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const totalPages = Math.ceil(sortedDrawings.length / drawingsPerPage)
  const paginatedDrawings = sortedDrawings.slice(page * drawingsPerPage, (page + 1) * drawingsPerPage)

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
      ))
    }
    const first = 0
    const last = totalPages - 1
    const current = page
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
    ]
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
      )
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
      )
    } else if (current >= totalPages - 2) {
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
      )
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
      )
    } else {
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
      )
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
    )
    return buttons
  }

  return (
    <div className='container'>
      {showCanvas ? (
        <DrawingCanvas
          onSave={handleSave}
          title={title}
          setTitle={setTitle}
          author={author}
          setAuthor={setAuthor}
          titleError={titleError}
        />
      ) : (
        <DrawingGallery
          paginatedDrawings={paginatedDrawings}
          drawings={drawings}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          renderPageNumbers={renderPageNumbers}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onBackToDraw={() => { setShowCanvas(true); setPage(0); setShowDropdown(false); }}
        />
      )}
      {!showCanvas && null}
      {showCanvas && (
        <button onClick={() => setShowCanvas(false)}>Photo Display</button>
      )}
    </div>
  )
}

export default App
