import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function ProtectedRoute({ children, adminOnly = false }) {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && adminOnly) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && (userDoc.data().role === 'admin' || userDoc.data().isAdmin === true)) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, adminOnly]);

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    alert('Access Denied: Administrative privileges required.');
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;