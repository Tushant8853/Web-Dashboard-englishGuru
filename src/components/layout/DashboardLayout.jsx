import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen min-h-screen overflow-hidden">
      <Sidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-8">
        <Outlet />
      </main>
    </div>
  );
}
