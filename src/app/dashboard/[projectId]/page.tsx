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
import { PlusCircle } from "lucide-react"
import { KeywordTable } from "./keyword-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const project = await getProject(params.projectId)
  const keywords = await getKeywordsForProject(params.projectId)

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.domain}</p>
        </div>
        <div className="flex items-center gap-2">
           <Select defaultValue="USA">
            <SelectTrigger className="w-[180px]">
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
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Anahtar Kelime Ekle
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sıralama Takibi</CardTitle>
          <CardDescription>
            Anahtar kelimelerinizin Google sıralama geçmişi ve haftalık değişimi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordTable keywords={keywords} />
        </CardContent>
      </Card>
    </div>
  )
}
