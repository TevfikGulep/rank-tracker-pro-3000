
"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useParams, useRouter, notFound } from "next/navigation"
import { useFirebase } from "@/firebase"
import { getProject, updateProject, daysOfWeek } from "@/lib/data"
import type { Project } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader } from "lucide-react"
import Link from "next/link"

const projectSchema = z.object({
  name: z.string().min(3, "Proje adı en az 3 karakter olmalıdır."),
  domain: z.string().min(3, "Domain en az 3 karakter olmalıdır."),
  scanDay: z.string(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { user, firestore: db, isUserLoading: authLoading } = useFirebase()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      domain: "",
      scanDay: "Pazartesi",
    },
  })

  useEffect(() => {
    if (!user || !db || !projectId) return

    async function loadProject() {
      setIsLoading(true)
      try {
        const projectData = await getProject(db, user.uid, projectId)
        if (!projectData) {
          notFound()
          return
        }
        form.reset({
          name: projectData.name,
          domain: projectData.domain,
          scanDay: projectData.scanDay || "Pazartesi",
        })
      } catch (error) {
        console.error("Proje yüklenirken hata oluştu:", error)
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Proje bilgileri yüklenemedi.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId, user, db, form, toast])

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user || !db) return
    setIsSaving(true)
    try {
      await updateProject(db, user.uid, projectId, data)
      toast({ title: "Başarılı", description: "Proje ayarları güncellendi." })
      router.push(`/dashboard/${projectId}`)
    } catch (error) {
      console.error("Proje güncellenirken hata oluştu:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Proje ayarları güncellenirken bir hata oluştu.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <div className="flex h-full flex-1 items-center justify-center">Ayarlar Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/${projectId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Panoya Geri Dön</span>
            </Link>
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Proje Ayarları</h1>
            <p className="text-muted-foreground">Projenizin adını, domainini ve haftalık tarama gününü düzenleyin.</p>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Proje Bilgileri</CardTitle>
            <CardDescription>
              Bu projenin temel ayarları.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Proje Adı</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" {...form.register("domain")} />
              {form.formState.errors.domain && (
                <p className="text-sm text-destructive">{form.formState.errors.domain.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scanDay">Haftalık Tarama Günü</Label>
               <Controller
                control={form.control}
                name="scanDay"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="scanDay">
                        <SelectValue placeholder="Bir gün seçin" />
                        </SelectTrigger>
                        <SelectContent>
                        {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                            {day.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                )}
                />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Ayarları Kaydet
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
