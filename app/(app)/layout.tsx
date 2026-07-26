import Sidebar from "@/components/Sidebar";
import ZmanimBar from "@/components/ZmanimBar";

// Shell for every signed-in screen. Login lives outside this group, so it no
// longer pays for the sidebar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <ZmanimBar />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
