import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { GlobalActiveTrades } from '../trade/GlobalActiveTrades';
import { GlobalWinModal } from '../trade/GlobalWinModal';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <GlobalActiveTrades />
      <GlobalWinModal />
      <main className="flex-1">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
};
