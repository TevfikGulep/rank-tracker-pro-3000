
"use client"

import { getKeywordsForProject, getProject, addKeyword as addKeywordToDb, deleteKeyword as deleteKeywordFromDb, updateKeyword as updateKeywordInDb } from "@/lib/data"
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
import { useEffect, useState, useTransition, useCallback } from "react"
import type { Project, Keyword } from "@/lib/types"
import { runWeeklyScan } from "@/lib/scanner"
import { useToast } from "@/hooks/use-toast"
import { KeywordDialog } from "./add-keyword-dialog"
import { countries } from "@/lib/data"
import { useFirebase } from "@/firebase"
import type { Firestore } from "firebase/firestore"
import type { User } from "firebase/auth"

type KeywordFormData = Omit<Keyword, 'id' | 'history' | 'projectId'>;

function ScanButton({ db, user, onScanComplete }: { db: Firestore, user: User, onScanComplete: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleScan = () => {
    startTransition(async () => {
      const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
      if (!apiKey) {
        toast({
          variant: "destructive",
          title: "API Key Missing",
          description: "SerpApi API Key is required to run a scan. Please set NEXT_PUBLIC_SERPAPI_KEY in your .env.local file.",
        });
        return;
      }
      
      const result = await runWeeklyScan(db, user.uid, apiKey);
      if (result.success) {
        toast({
          title: "Tarama Başarılı",
          description: `${result.scannedCount} anahtar kelime başarıyla tarandı.`,
        });
        onScanComplete();
      } else {
        toast({
          variant: "destructive",
          title: "Tarama Başarısız",
          description: result.error || "Bilinmeyen bir hata oluştu.",
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
      {isPending ? "Taranıyor..." : "Haftalık Taramayı Çalıştır"}
    </Button>
  )
}

export default function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const { projectId } = params;
  const { user, firestore: db, isUserLoading: authLoading } = useFirebase();
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keywordToEdit, setKeywordToEdit] = useState<Keyword | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!authLoading && user && db) {
      setIsLoading(true);
      const projectData = await getProject(db, user.uid, projectId);
      if (!projectData) {
        notFound();
        return;
      }
      const keywordsData = await getKeywordsForProject(db, user.uid, projectId);
      setProject(projectData);
      setKeywords(keywordsData);
      setIsLoading(false);
    }
  }, [projectId, authLoading, user, db]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDialogSubmit = async (formData: KeywordFormData) => {
    if (!user || !db) return;

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
    setKeywordToEdit(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (keyword: Keyword) => {
    setKeywordToEdit(keyword);
    setIsDialogOpen(true);
  };

  if (isLoading || !project || !user || !db) {
    return <div className="flex h-full flex-1 items-center justify-center">Yükleniyor...</div>;
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
            <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Anahtar Kelime Ekle
            </Button>
            <ScanButton db={db} user={user} onScanComplete={loadData} />
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
