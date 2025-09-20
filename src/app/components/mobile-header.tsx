"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Wifi, WifiOff, User, LogOut } from "lucide-react";
import Link from "next/link";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold">AMS</h1>
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-300" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-300" />
            )}
          </div>
        </div>

        {/* User Info and Menu */}
        <div className="flex items-center space-x-3">
          {session && (
            <div className="text-sm">
              <span className="block font-medium">{session.user.full_name}</span>
              <span className="text-blue-200 text-xs capitalize">{session.user.role}</span>
            </div>
          )}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="bg-blue-700 border-t border-blue-500">
          <nav className="px-4 py-2 space-y-1">
            {session ? (
              <>
                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                
                {session.user.role === 'manager' && (
                  <Link
                    href="/manager"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Manager Dashboard</span>
                  </Link>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-2 text-sm">
          <WifiOff className="w-4 h-4 inline mr-2" />
          You are currently offline
        </div>
      )}
    </header>
  );
} 