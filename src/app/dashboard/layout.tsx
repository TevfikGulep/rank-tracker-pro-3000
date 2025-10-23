
"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react";
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
import { useFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import type { Project } from "@/lib/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, firestore: db, isUserLoading: authLoading } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading) {
      if (user && db) {
        getProjects(db, user.uid).then(userProjects => {
          setProjects(userProjects);
          // If the user is on the main dashboard page and has projects, redirect to the first one.
          if (pathname === '/dashboard' && userProjects.length > 0) {
            setRedirecting(true);
            router.replace(`/dashboard/${userProjects[0].id}`);
          } else {
             setIsLoading(false);
          }
        });
      } else {
        router.replace("/login");
      }
    }
  }, [user, db, authLoading, router, pathname]);

  useEffect(() => {
    // If we have projects and we are no longer on the root dashboard, stop redirecting state
    if (projects.length > 0 && pathname !== '/dashboard') {
      setIsLoading(false);
      setRedirecting(false);
    }
    // If there are no projects, we are not loading anymore.
    if (projects.length === 0) {
       setIsLoading(false);
    }
  }, [pathname, projects]);


  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
  };

  if (authLoading || isLoading || redirecting) {
    return <div className="flex h-screen w-full items-center justify-center">Yükleniyor...</div>;
  }
  
  if (!user) {
    return null; // Redirecting to login...
  }

  const userProps = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }

  return (
    <SidebarProvider>
      <div className="flex flex-row min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="px-2 py-1">
              <AppLogo />
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <div className="p-2">
              <ProjectSwitcher projects={projects} onProjectCreated={handleProjectCreated} />
            </div>
            <Separator />
            {/* Additional nav items can go here */}
          </SidebarContent>
          <SidebarFooter>
            <UserNav {...userProps} />
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
