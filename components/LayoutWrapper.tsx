'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { Sidebar } from './Sidebar';

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPublicRoute = ['/login', '/signup'].includes(pathname);

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        {!isPublicRoute && <Sidebar />}
        <main className={`flex-1 overflow-y-auto ${!isPublicRoute ? 'p-8 lg:p-12' : ''}`}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
};
