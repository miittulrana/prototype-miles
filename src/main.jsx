// src/main.jsx - Updated with storage access configuration
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import base styles first (Tailwind directives)
import './index.css'
// Import additional styles
import './styles/index.css'

// Import Remix icons
import 'remixicon/fonts/remixicon.css'

// Import storage access configuration
import { configureStorageAccess } from './utils/storageAccess.js'

// Create a wrapper component to configure storage access on app startup
const AppWithStorageConfig = () => {
  useEffect(() => {
    // Configure storage access when app starts
    const initStorage = async () => {
      const result = await configureStorageAccess();
      if (!result.success) {
        console.warn('Storage configuration issue. Some features may not work correctly.');
      }
    };
    
    initStorage();
  }, []);

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithStorageConfig />
  </React.StrictMode>,
)