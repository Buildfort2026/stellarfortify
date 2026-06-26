import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { TRPCProvider } from './providers/trpc'
import './index.css'
import { DataProvider } from "@/providers/data-provider"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <TRPCProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </TRPCProvider>
    </HashRouter>
  </StrictMode>,
)