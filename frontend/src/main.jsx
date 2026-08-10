// Cloth-Shop/frontend/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import { store } from  './redux/store.js'
import { setStore } from './api/api.js'

// Give the API interceptor a reference to the store so it can dispatch
// clearAuth() when a token refresh fails (avoids circular import issues).
setStore(store);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
