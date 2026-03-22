import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- IMPORT THIS
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ClerkProvider publishableKey={publishableKey}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
