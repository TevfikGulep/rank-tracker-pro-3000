
"use client"

import { getKeywordsForProject, getProject, addKeyword as addKeywordToDb, deleteKeyword as deleteKeywordFromDb, updateKeyword as updateKeywordInDb } from "@/lib/data"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader, Settings } from "lucide-react"
import { KeywordTable } from "./keyword-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState, useCallback, useTransition } from "react"
import type { Project, Keyword } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { KeywordDialog } from "./add-keyword-dialog"
import { countries } from "@/lib/data"
import { useFirebase } from "@/firebase"
import { runScanAction } from "@/lib/actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type KeywordFormData = Omit<Keyword, 'id' | 'history' | 'projectId'>;

interface ScanButtonProps {
  onScanComplete: () => void;
  keywords: Keyword[];
}

function getMostRecentScanDate(keywords: Keyword[]): Date | null {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  let mostRecent: Date | null = null;

  keywords.forEach(keyword => {
    if (keyword.history && keyword.history.length > 0) {
      const lastScanDate = new Date(keyword.history[keyword.history.length - 1].date);
      if (!mostRecent || lastScanDate > mostRecent) {
        mostRecent = lastScanDate;
      }
    }
  });

  return mostRecent;
}


function ScanButton({ onScanComplete }: ScanButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleScan = () => {
    startTransition(async () => {
      toast({ title: "Tarama Başlatıldı", description: "Sıralamalar kontrol ediliyor..." });
      try {
        const result = await runScanAction();
        if (result.success) {
          toast({ title: "Tarama Başarılı", description: `${result.scannedKeywords} anahtar kelime güncellendi.` });
          onScanComplete(); // Trigger data reload
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error("Tarama eylemi hatası:", error);
        toast({
          variant: "destructive",
          title: "Tarama Başarısız",
          description: error.message || "Bilinmeyen bir hata oluştu.",
        });
      }
    });
  };

  return (
    <Button onClick={handleScan} disabled={isPending} variant="outline" className="w-full sm:w-auto">
      {isPending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Taranıyor...
        </>
      ) : (
        "Şimdi Tara"
      )}
    </Button>
  );
}


export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, firestore: db, isUserLoading: authLoading } = useFirebase();
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keywordToEdit, setKeywordToEdit] = useState<Keyword | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!user || !db || !projectId) {
      return;
    }
    
    try {
      const projectData = await getProject(db, user.uid, projectId);
      if (!projectData) {
        notFound();
        return;
      }
      const keywordsData = await getKeywordsForProject(db, user.uid, projectId);
      setProject(projectData);
      setKeywords(keywordsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ variant: "destructive", title: "Veri Yüklenemedi", description: "Veri yüklenirken bir hata oluştu." });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user, db, toast]);


  useEffect(() => {
    if (user && db && projectId) {
      setIsLoading(true);
      loadData();
    }
  }, [user, db, projectId, loadData]);


  const handleDialogSubmit = async (formData: KeywordFormData) => {
    if (!user || !db) return;

    const isDuplicate = keywords.some(
      kw => 
        kw.name.toLowerCase() === formData.name.toLowerCase() && 
        kw.country === formData.country &&
        kw.id !== keywordToEdit?.id // Exclude the keyword being edited from the check
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Yinelenen Anahtar Kelime",
        description: "Bu anahtar kelime ve ülke kombinasyonu zaten projede mevcut.",
      });
      return;
    }


    try {
      if (keywordToEdit) {
        // Update existing keyword
        const updatedKeyword = await updateKeywordInDb(db, user.uid, projectId, keywordToEdit.id, formData);
        setKeywords(prev => prev.map(kw => kw.id === updatedKeyword.id ? updatedKeyword : kw));
        toast({ title: "Anahtar Kelime Güncellendi" });
      } else {
        // Add new keyword
        const newKeyword = await addKeywordToDb(db, user.uid, projectId, formData);
        setKeywords(prev => [...prev, newKeyword]);
        toast({ title: "Anahtar Kelime Eklendi" });
      }
    } catch (error) {
      console.error("Error saving keyword: ", error);
      toast({ variant: "destructive", title: "Hata", description: "İşlem sırasında bir hata oluştu." });
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!user || !db) return;
    try {
        await deleteKeywordFromDb(db, user.uid, projectId, keywordId);
        setKeywords(prev => prev.filter(kw => kw.id !== keywordId));
        toast({ title: "Anahtar Kelime Silindi" });
    } catch (error) {
        console.error("Error deleting keyword: ", error);
        toast({ variant: "destructive", title: "Hata", description: "Anahtar kelime silinirken bir hata oluştu." });
    }
  };
  
  const openAddDialog = () => {
    if (keywords.length >= 60) {
      toast({
        variant: "destructive",
        title: "Limit Aşıldı",
        description: "Bir projeye en fazla 60 anahtar kelime ekleyebilirsiniz.",
      });
      return;
    }
    setKeywordToEdit(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (keyword: Keyword) => {
    setKeywordToEdit(keyword);
    setIsDialogOpen(true);
  };

  if (isLoading || authLoading) {
    return <div className="flex h-full flex-1 items-center justify-center">Yükleniyor...</div>;
  }
  
  if (!project || !user) {
    return <div className="flex h-full flex-1 items-center justify-center">Proje yüklenemedi veya bulunamadı. Lütfen giriş yaptığınızdan ve projenin mevcut olduğundan emin olun.</div>;
  }
  
  return (
    <>
      <KeywordDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        keywordToEdit={keywordToEdit}
      />
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
             <div>
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground">{project.domain}</p>
            </div>
             <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/${projectId}/settings`}>
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Proje Ayarları</span>
                </Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <ScanButton onScanComplete={loadData} keywords={keywords} />
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
            <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Anahtar Kelime Ekle
            </Button>
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
              <KeywordTable 
                keywords={keywords}
                onDelete={handleDeleteKeyword}
                onEdit={openEditDialog}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Bu proje için henüz anahtar kelime eklenmemiş.</p>
                <Button variant="link" onClick={openAddDialog} className="mt-2">Hemen bir tane ekleyin</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
