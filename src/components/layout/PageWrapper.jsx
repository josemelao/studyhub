import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col font-sans">
      <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 w-full flex flex-col relative md:pl-64">
          <div className="max-w-7xl w-full mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
