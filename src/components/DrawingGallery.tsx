import React from 'react'

interface Drawing {
  id: number
  drawing_data: string
  text: string
  author?: string
  created_at: string
}

interface DrawingGalleryProps {
  drawings: Drawing[]
  page: number
  setPage: (p: number) => void
  totalPages: number
  paginatedDrawings: Drawing[]
  renderPageNumbers: () => React.ReactNode
  showDropdown: boolean
  setShowDropdown: (v: boolean) => void
  onBackToDraw: () => void
}

export default function DrawingGallery({
  paginatedDrawings,
  drawings,
  page,
  setPage,
  totalPages,
  renderPageNumbers,
  showDropdown,
  setShowDropdown,
  onBackToDraw,
}: DrawingGalleryProps) {
  const drawingsPerPage = 9

  return (
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
        <button onClick={() => { setPage(Math.max(0, page - 1)); setShowDropdown(false); }} disabled={page === 0}>Back</button>
        {renderPageNumbers()}
        <button onClick={() => { setPage(Math.min(totalPages - 1, page + 1)); setShowDropdown(false); }} disabled={page >= totalPages - 1}>Next</button>
      </div>
      <button style={{ marginTop: 16 }} onClick={onBackToDraw}>Draw Photos</button>
    </div>
  )
}
