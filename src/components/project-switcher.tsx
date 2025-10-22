
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Project } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { addProject as addProjectToDb } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useFirebase } from "@/lib/firebase/provider"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ProjectSwitcherProps extends PopoverTriggerProps {
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
}

function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onProjectCreated: (project: Project) => void }) {
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, db } = useFirebase();

  const handleCreateProject = async () => {
    if (!name || !domain) {
      toast({ variant: "destructive", title: "Eksik Bilgi", description: "Proje adı ve domain gereklidir." });
      return;
    }
    if (!user || !db) {
        toast({ variant: "destructive", title: "Hata", description: "Proje oluşturmak için giriş yapmalısınız." });
        return;
    }
    setIsCreating(true);
    try {
      const newProject = await addProjectToDb(db, user.uid, { name, domain });
      toast({ title: "Proje Oluşturuldu", description: `"${newProject.name}" başarıyla oluşturuldu.` });
      onOpenChange(false);
      onProjectCreated(newProject);
      router.push(`/dashboard/${newProject.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: "Proje oluşturulurken bir hata oluştu." });
    } finally {
      setIsCreating(false);
      setName("");
      setDomain("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Proje Oluştur</DialogTitle>
          <DialogDescription>
            İzlemek için yeni bir proje ekleyin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Proje Adı</Label>
            <Input id="project-name" placeholder="E-ticaret Sitem" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-domain">Domain</Label>
            <Input id="project-domain" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleCreateProject} disabled={isCreating}>{isCreating ? "Oluşturuluyor..." : "Oluştur"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ProjectSwitcher({ className, projects = [], setProjects }: ProjectSwitcherProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()

  const selectedProject = projects.find((project) => project.id === params.projectId)

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  }

  return (
    <>
      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onProjectCreated={handleProjectCreated} />
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={popoverOpen}
            aria-label="Select a project"
            className={cn("w-full justify-between text-base px-2", className)}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{selectedProject?.name ?? "Proje Seç"}</span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Proje ara..." />
              <CommandEmpty>Proje bulunamadı.</CommandEmpty>
              <CommandGroup heading="Projeler">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      router.push(`/dashboard/${project.id}`)
                      setPopoverOpen(false)
                    }}
                    className="text-sm"
                  >
                    {project.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedProject?.id === project.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setPopoverOpen(false)
                    setDialogOpen(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Yeni Proje Oluştur
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
