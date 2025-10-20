import { getProjects } from "@/lib/data"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const projects = await getProjects();
  if (projects && projects.length > 0) {
    redirect(`/dashboard/${projects[0].id}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Henüz projeniz yok
        </h3>
        <p className="text-sm text-muted-foreground">
          Başlamak için bir proje seçin veya yeni bir tane oluşturun.
        </p>
      </div>
    </div>
  )
}