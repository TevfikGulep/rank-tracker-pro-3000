
"use client"

import { getKeywordsForProject, getProject, countries } from "@/lib/data"
import { notFound } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ScanLine } from "lucide-react"
import { KeywordTable } from "./keyword-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState, useTransition } from "react"
import type { Project, Keyword } from "@/lib/types"
import { runWeeklyScan } from "@/lib/scanner"
import { useToast } from "@/hooks/use-toast"

function ScanButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleScan = () => {
    startTransition(async () => {
      const result = await runWeeklyScan();
      if (result.success) {
        toast({
          title: "Tarama Başarılı",
          description: `${result.scannedCount} anahtar kelime başarıyla tarandı.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Tarama Başarısız",
          description: "Simüle edilmiş bir hata oluştu. Detaylar için konsolu kontrol edin.",
        });
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleScan}
      disabled={isPending}
    >
      <ScanLine className="mr-2 h-4 w-4" />
      {isPending ? "Taranıyor..." : "Haftalık Taramayı Çalıştır (Test)"}
    </Button>
  )
}

// This is the Server Component entry for the page.
// It correctly destructures projectId from params and passes it to the client component.
export default function ProjectPage({
  params: { projectId },
}: {
  params: { projectId: string }
}) {
  return <ProjectClientPage projectId={projectId} />;
}


function ProjectClientPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const projectData = await getProject(projectId);
      if (!projectData) {
        notFound();
        return;
      }
      const keywordsData = await getKeywordsForProject(projectId);
      setProject(projectData);
      setKeywords(keywordsData);
      setIsLoading(false);
    };

    loadData();
  }, [projectId]);

  if (isLoading || !project) {
    return <div className="flex h-full flex-1 items-center justify-center">Yükleniyor...</div>;
  }
  
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.domain}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
           <Select defaultValue="Türkiye">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ülke Seçin" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Anahtar Kelime Ekle
          </Button>
          <ScanButton />
        </div>
      </div>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Sıralama Takibi</CardTitle>
          <CardDescription>
            Anahtar kelimelerinizin Google sıralama geçmişi ve haftalık değişimi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
           {keywords.length > 0 ? (
            <KeywordTable keywords={keywords} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Bu proje için henüz anahtar kelime eklenmemiş.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
