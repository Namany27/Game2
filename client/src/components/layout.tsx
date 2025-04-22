import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/mobile-nav";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {!hideNav && <Sidebar />}
      
      <main className={`flex-1 ${!hideNav ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>
      
      {!hideNav && <MobileNav />}
    </div>
  );
}

export function MainHeader({ title }: { title: string }) {
  return (
    <header className="md:hidden bg-muted border-b border-border py-3 px-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <i className="fas fa-dice text-white text-sm"></i>
          </div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>
      </div>
    </header>
  );
}
