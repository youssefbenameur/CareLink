
import React from 'react';
import PatientSidebar from './PatientSidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="md:block w-64 shrink-0 h-screen hidden">
        <PatientSidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="md:hidden">
            <PatientSidebar />
          </div>
          <div className="container py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
