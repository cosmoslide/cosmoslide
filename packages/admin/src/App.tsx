function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Hello World from Admin
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Cosmoslide Admin Panel
      </p>
      <p style={{ fontSize: '1rem', opacity: 0.9 }}>
        🚀 Powered by Vite + React
      </p>
    </div>
  )
}

export default App
