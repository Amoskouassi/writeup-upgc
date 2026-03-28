import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  componentDidCatch(error) {
    this.setState({ error: error.message })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24,
          fontFamily: 'sans-serif',
          background: '#fff3f3',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{color:'#c62828'}}>⚠️ App Error</h2>
          <pre style={{
            background:'#fff',
            padding:16,
            borderRadius:8,
            fontSize:13,
            maxWidth:400,
            wordBreak:'break-word',
            whiteSpace:'pre-wrap',
            border:'1px solid #ffcdd2'
          }}>{this.state.error}</pre>
          <p style={{color:'#888',fontSize:13}}>
            Please screenshot this and send it to the developer.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
