import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/navigation/AppHeader";
import { BottomNavigation } from "@/components/navigation/MobileNavigation";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 px-2 py-2 pb-20 sm:px-4 sm:py-4 lg:px-5 lg:py-5 lg:pb-5">
        <div className="mx-auto w-full max-w-[96rem]">
          <Outlet />
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
