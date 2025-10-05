import React from 'react';
import Home from './components/Home';
import { AppProvider } from './context/AppContext';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Home />
      </div>
    </AppProvider>
  );
}

export default App;
