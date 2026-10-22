import { Outlet } from 'react-router-dom';

export default function RootAuth() {
  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#06152B] font-sans">
      <Outlet />
    </div>
  );
}
