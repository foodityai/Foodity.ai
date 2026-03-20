import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ChatDashboard from './pages/ChatDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PrivateRoute = ({ children, user }) => {
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/chat" replace /> : <Signup />} />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute user={user}>
                <ChatDashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
        <Toaster position="top-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;
