import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import base styles first (Tailwind directives)
import './index.css'
// Import additional styles
import './styles/index.css'

// Import Remix icons
import 'remixicon/fonts/remixicon.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)