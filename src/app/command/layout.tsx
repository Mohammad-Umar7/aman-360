import type { Metadata } from "next";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { SimulationBar } from "@/components/shell/SimulationBar";
import { StatusBar } from "@/components/shell/StatusBar";
import { SimulationProvider } from "@/components/shell/SimulationProvider";

export const metadata: Metadata = { title: "Command centre" };

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimulationProvider>
      <div className="h-dvh w-full flex overflow-hidden bg-bg-0">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <SimulationBar />
          <main className="flex-1 min-h-0 overflow-auto">{children}</main>
          <StatusBar />
        </div>
      </div>
    </SimulationProvider>
  );
}
