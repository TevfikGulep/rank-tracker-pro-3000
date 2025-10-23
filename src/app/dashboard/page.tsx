
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { getProjects } from "@/lib/data";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { user, firestore: db, isUserLoading: authLoading } = useFirebase();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && db) {
      getProjects(db, user.uid).then(userProjects => {
        setProjects(userProjects);
        if (userProjects.length > 0) {
          router.replace(`/dashboard/${userProjects[0].id}`);
        } else {
          setIsLoading(false);
        }
      });
    } else if (!authLoading) {
      // Not logged in
      setIsLoading(false);
    }
  }, [user, db, authLoading, router]);

  // If projects exist, we'll be redirecting, so show a loading state.
  if (isLoading || (projects && projects.length > 0)) {
     return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Proje Yükleniyor...
          </h3>
          <p className="text-sm text-muted-foreground">
            Lütfen bekleyin, verileriniz getiriliyor.
          </p>
        </div>
      </div>
    );
  }

  // If loading is finished and there are no projects.
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Henüz projeniz yok
        </h3>
        <p className="text-sm text-muted-foreground">
          Başlamak için bir proje oluşturun.
        </p>
        {/* The button to create a project is in the sidebar, we can add one here if needed */}
        {/* <Button className="mt-4">Proje Oluştur</Button> */}
      </div>
    </div>
  )
}
