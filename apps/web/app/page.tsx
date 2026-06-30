export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        backgroundColor: '#141413',
        color: '#faf9f5',
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 400,
            letterSpacing: '-1px',
            marginBottom: '1rem',
          }}
        >
          Dart
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: '#a09d96',
            maxWidth: '480px',
            lineHeight: 1.6,
          }}
        >
          Your personal AI assistant that controls your real browser.
          <br />
          Give natural language commands and watch Dart execute them step by step.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              backgroundColor: '#cc785c',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Coming Soon
          </span>
        </div>
      </div>
    </main>
  );
}
