"use client";

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamic import to reduce bundle size - Recharts is heavy (~500KB)
const AnalyticsCharts = dynamic(
  () => import('@/components/analytics/AnalyticsCharts').then(mod => ({ default: mod.AnalyticsCharts })),
  {
    loading: () => (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading chart...
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading chart...
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    ssr: false
  }
);

interface UserGrowthData {
  date: string;
  users: number;
}

interface ContentDistribution {
  name: string;
  value: number;
  [key: string]: any;
}

interface Props {
  userGrowthData: UserGrowthData[];
  contentDistribution: ContentDistribution[];
}

export function AnalyticsChartsWrapper({ userGrowthData, contentDistribution }: Props) {
  return (
    <AnalyticsCharts 
      userGrowthData={userGrowthData}
      contentDistribution={contentDistribution}
    />
  );
}
