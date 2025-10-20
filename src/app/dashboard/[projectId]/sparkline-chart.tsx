"use client"

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RankHistory } from "@/lib/types"

interface SparklineChartProps {
  data: RankHistory[]
}

export function SparklineChart({ data }: SparklineChartProps) {
  const chartData = data.map(item => ({
    ...item,
    // Invert rank for visual representation (lower rank is better, so higher on chart)
    displayRank: item.rank ? 101 - item.rank : null 
  }));

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value, name, props) => [props.payload.rank ?? 'N/A', 'Rank']}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line
          type="monotone"
          dataKey="displayRank"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
