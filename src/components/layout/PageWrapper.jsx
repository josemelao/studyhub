import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
      <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 w-full flex flex-col relative md:pl-64">
          <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
