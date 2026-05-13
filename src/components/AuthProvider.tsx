'use client';
import { useState, useEffect } from 'react';
import { isAuthed, logout } from '@/lib/auth';
import { LoginScreen } from './LoginScreen';
import { Navbar } from './Navbar';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  // Prevent flash while checking localStorage
  if (authed === null) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a1f35] via-[#0d2d4a] to-[#153B5C]" />;
  }

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
