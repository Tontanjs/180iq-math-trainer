'use client';
import { useState, useEffect } from 'react';
import { isAuthed, logout } from '@/lib/auth';
import { LoginScreen } from './LoginScreen';
import { Navbar } from './Navbar';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
