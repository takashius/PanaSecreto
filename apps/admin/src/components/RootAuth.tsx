import { Outlet } from 'react-router-dom';

export default function RootAuth() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <Outlet />
    </div>
  );
}
