import type { ReactNode } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppLogo } from "@/components/app-logo"
import ProjectSwitcher from "@/components/project-switcher"
import { UserNav } from "@/components/user-nav"
import { getProjects } from "@/lib/data"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const projects = await getProjects();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="px-2 py-1">
              <AppLogo />
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <div className="p-2">
              <ProjectSwitcher projects={projects} />
            </div>
            <Separator />
            {/* Additional nav items can go here */}
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Breadcrumbs or Title can go here */}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
