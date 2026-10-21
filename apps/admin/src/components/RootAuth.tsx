import { Outlet } from 'react-router-dom';

export default function RootAuth() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#12111A] font-sans">
      <Outlet />
    </div>
  );
}
