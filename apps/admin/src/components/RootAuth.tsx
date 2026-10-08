import { Outlet } from 'react-router-dom';

export default function RootAuth() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#12111A] font-sans">
      <Outlet />
    </div>
  );
}
