
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import useAuthStore from '@/store/authStore';
import { toast } from 'react-toastify';
import { HomeIcon, PlusCircle, LayoutList, CheckCircle, UserIcon, LogOut, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("You have been successfully logged out from ConnectHear.", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    router.push('/');
    setIsMobileOpen(false);
  };

  const navItems = [
    {
      name: 'All Polls',
      href: '/home',
      icon: <HomeIcon className="h-4 w-4" />,
      authRequired: false
    },
    {
      name: 'Create New Poll',
      href: '/create-poll',
      icon: <PlusCircle className="h-4 w-4" />,
      authRequired: true
    },
    {
      name: 'My Polls',
      href: '/my-polls',
      icon: <LayoutList className="h-4 w-4" />,
      authRequired: true
    },
    {
      name: 'My Voted Polls',
      href: '/my-voted-polls',
      icon: <CheckCircle className="h-4 w-4" />,
      authRequired: true
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: <UserIcon className="h-4 w-4" />,
      authRequired: true
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  
  const MobileToggleButton = () => (
    <div className="lg:hidden fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="rounded-full h-14 w-14 p-0 bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
    </div>
  );

  const SidebarContent = () => (
    <>
      <div className="flex items-center space-x-2 p-2 mb-4 bg-blue-50 rounded-lg shadow-sm">
        <UserIcon className="h-7 w-7 text-blue-600 flex-shrink-0" />
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold text-base text-gray-800 truncate">Hello, {user?.username || 'User'}!</span>
          <span className="text-sm text-gray-600 truncate">{user?.email || ''}</span>
        </div>
      </div>

      <Separator className="my-3" />

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} passHref>
            <Button
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={`w-full justify-start text-base px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2
                ${pathname === item.href
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700'
                  : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                }`}
              onClick={() => isMobile && setIsMobileOpen(false)}
            >
              {item.icon}
              <span className="ml-2 font-medium">{item.name}</span>
            </Button>
          </Link>
        ))}
      </nav>

      <Separator className="my-3" />

      <div className="mt-auto p-2">
        <Button
          variant="destructive"
          className="w-full text-base py-2 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-red-500 hover:bg-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col h-screen w-64 bg-gray-50 border-r border-gray-200 shadow-lg p-3 sticky top-0 overflow-y-auto z-20">
        <SidebarContent />
      </aside>


      {isMobile && (
        <>
          <MobileToggleButton />
          {isMobileOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
                onClick={() => setIsMobileOpen(false)}
              />
              <aside className="fixed inset-y-0 left-0 w-64 bg-gray-50 border-r border-gray-200 shadow-xl p-3 z-40 lg:hidden flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
                <SidebarContent />
              </aside>
            </>
          )}
        </>
      )}
    </>
  );
}