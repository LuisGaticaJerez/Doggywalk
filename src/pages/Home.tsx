function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
        🐾 Doggywalk
      </h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>
        Pet Services Platform
      </p>
      <p style={{ marginTop: '2rem', opacity: 0.8 }}>
        Your database is ready. Start building your pet services application!
      </p>
    </div>
  )
}

export default Home
