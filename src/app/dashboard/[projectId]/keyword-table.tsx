"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Keyword } from "@/lib/types"
import { ArrowDown, ArrowUp, Minus, TrendingUp } from "lucide-react"
import { SparklineChart } from "./sparkline-chart"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { KeywordHistoryDialog } from "./keyword-history-dialog"

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

const RankDisplay = ({ rank }: { rank: number | null }) => {
    return <span className="font-bold text-lg">{rank ?? "N/A"}</span>
}

export function KeywordTable({ keywords }: KeywordTableProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);

  const handleRowClick = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
  };

  const handleDialogClose = () => {
    setSelectedKeyword(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Anahtar Kelime</TableHead>
            <TableHead>Ülke</TableHead>
            <TableHead className="text-center">İlk Sıra</TableHead>
            <TableHead className="text-center">Önceki Sıra</TableHead>
            <TableHead className="text-center">Son Sıra</TableHead>
            <TableHead className="text-center">Değişim</TableHead>
            <TableHead className="w-[15%] text-center">Trend (7 Gün)</TableHead>
            <TableHead className="text-right">Son Kontrol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((keyword) => {
            const history = keyword.history;
            const firstScan = history.length > 0 ? history[0] : null;
            const lastScan = history.length > 0 ? history[history.length - 1] : null;
            const previousScan = history.length > 1 ? history[history.length - 2] : null;
            const rankChange = getRankChange(history);

            return (
              <TableRow key={keyword.id} onClick={() => handleRowClick(keyword)} className="cursor-pointer">
                <TableCell className="font-medium flex items-center gap-2">
                   <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  {keyword.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{keyword.country}</Badge>
                </TableCell>
                <TableCell className="text-center">
                    <RankDisplay rank={firstScan?.rank ?? null} />
                </TableCell>
                <TableCell className="text-center">
                    <RankDisplay rank={previousScan?.rank ?? null} />
                </TableCell>
                <TableCell className="text-center">
                    <RankDisplay rank={lastScan?.rank ?? null} />
                </TableCell>
                <TableCell className="text-center">
                  <RankChange {...rankChange} />
                </TableCell>
                <TableCell>
                  <SparklineChart data={keyword.history} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {lastScan ? format(new Date(lastScan.date), "dd MMM, yyyy") : 'N/A'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {selectedKeyword && (
        <KeywordHistoryDialog
          keyword={selectedKeyword}
          open={!!selectedKeyword}
          onClose={handleDialogClose}
        />
      )}
    </>
  )
}
