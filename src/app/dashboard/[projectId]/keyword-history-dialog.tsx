
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Keyword } from "@/lib/types"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface KeywordHistoryDialogProps {
  keyword: Keyword | null
  open: boolean
  onClose: () => void
}

export function KeywordHistoryDialog({ keyword, open, onClose }: KeywordHistoryDialogProps) {
  if (!keyword) return null

  const chartData = keyword.history.map(item => ({
    date: format(new Date(item.date), "dd MMM"),
    rank: item.rank,
    // Invert rank for visual representation (lower rank is better, so higher on chart)
    displayRank: item.rank ? 101 - item.rank : null 
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>"{keyword.name}"</span> 
            <Badge variant="secondary">{keyword.country}</Badge>
          </DialogTitle>
          <DialogDescription>
            Anahtar kelimesi için tüm geçmiş sıralama verileri.
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-64 w-full pr-4 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                yAxisId="left" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                domain={[1, 100]}
                reversed={true}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
                formatter={(value, name, props) => [props.payload.rank ?? 'N/A', 'Sıra']}
              />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="rank" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                name="Sıra"
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                connectNulls 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Sıra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...keyword.history].reverse().map((record) => (
                <TableRow key={record.date}>
                  <TableCell>{format(new Date(record.date), "dd MMMM yyyy")}</TableCell>
                  <TableCell className="text-right font-medium">{record.rank ?? "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </DialogContent>
    </Dialog>
  )
}
