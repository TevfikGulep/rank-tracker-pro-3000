import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Keyword } from "@/lib/types"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { SparklineChart } from "./sparkline-chart"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"

interface KeywordTableProps {
  keywords: Keyword[]
}

function getRankChange(history: Keyword["history"]) {
  if (history.length < 2) return { change: 0, direction: "neutral" as const }
  const latestRank = history[history.length - 1].rank
  const previousRank = history[history.length - 2].rank

  if (latestRank === null || previousRank === null) return { change: 0, direction: "neutral" as const }

  const change = previousRank - latestRank;
  if (change > 0) return { change, direction: "up" as const }
  if (change < 0) return { change: Math.abs(change), direction: "down" as const }
  return { change: 0, direction: "neutral" as const }
}

const RankChange = ({ change, direction }: { change: number; direction: "up" | "down" | "neutral" }) => {
  if (direction === "neutral") {
    return <span className="flex items-center text-muted-foreground"><Minus className="h-4 w-4 mr-1" /> 0</span>
  }
  if (direction === "up") {
    return <span className="flex items-center text-green-600"><ArrowUp className="h-4 w-4 mr-1" /> {change}</span>
  }
  return <span className="flex items-center text-red-600"><ArrowDown className="h-4 w-4 mr-1" /> {change}</span>
}

export function KeywordTable({ keywords }: KeywordTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Anahtar Kelime</TableHead>
          <TableHead>Ülke</TableHead>
          <TableHead className="text-center">Sıra</TableHead>
          <TableHead className="text-center">Değişim (Haftalık)</TableHead>
          <TableHead className="w-[15%] text-center">Trend</TableHead>
          <TableHead className="text-right">Son Kontrol</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keywords.map((keyword) => {
          const latestHistory = keyword.history[keyword.history.length - 1];
          const rankChange = getRankChange(keyword.history);
          return (
            <TableRow key={keyword.id}>
              <TableCell className="font-medium">{keyword.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{keyword.country}</Badge>
              </TableCell>
              <TableCell className="text-center font-bold text-lg">{latestHistory.rank ?? "N/A"}</TableCell>
              <TableCell className="text-center">
                <RankChange {...rankChange} />
              </TableCell>
              <TableCell>
                <SparklineChart data={keyword.history} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(latestHistory.date), "dd MMM, yyyy")}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
