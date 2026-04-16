import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col font-sans">
      <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 w-full flex flex-col relative md:pl-64">
          <div className="w-full max-w-[1600px] mx-auto px-4 py-4 md:px-8 md:py-8 xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
