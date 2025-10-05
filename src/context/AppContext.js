import React, { createContext, useState, useContext } from 'react';

// Create a context for sharing state between components
const AppContext = createContext({
  // Provide default values
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  showV2Interpretation: false,
  setShowV2Interpretation: () => {},
  showCustomerCommunications: false,
  setShowCustomerCommunications: () => {},
  hasMappingChanges: false,
  setHasMappingChanges: () => {}
});

// Custom hook to use the app context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider = ({ children }) => {
  const [showV2Interpretation, setShowV2Interpretation] = useState(false);
  const [showCustomerCommunications, setShowCustomerCommunications] = useState(false);
  const [hasMappingChanges, setHasMappingChanges] = useState(false);
  
  // Add theme state
  const [theme, setTheme] = useState('light');

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    showV2Interpretation,
    setShowV2Interpretation,
    showCustomerCommunications,
    setShowCustomerCommunications,
    hasMappingChanges,
    setHasMappingChanges,
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;