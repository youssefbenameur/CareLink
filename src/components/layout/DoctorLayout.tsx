
import React from 'react';
import DoctorSidebar from './DoctorSidebar';

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block w-64 shrink-0 h-screen">
        <DoctorSidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
