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

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface ProjectSwitcherProps extends PopoverTriggerProps {
  projects: Project[]
}

export default function ProjectSwitcher({ className, projects = [] }: ProjectSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()

  const selectedProject = projects.find((project) => project.id === params.projectId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
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
                    setOpen(false)
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
                  // In a real app, this would open a dialog or a new page
                  alert("Yeni proje oluşturma özelliği yakında eklenecektir.");
                  setOpen(false)
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
  )
}
