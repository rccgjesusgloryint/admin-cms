import { AnalyticsChartsWrapper } from "@/components/analytics/AnalyticsChartsWrapper";
import { getAnalyticsData } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



export default async function AnalyticsPage() {
  const { userGrowthData, contentDistribution } = await getAnalyticsData();

  // Calculate total content
  const totalContent = contentDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your content and user engagement
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {contentDistribution.map((item, index) => (
          <Card key={item.name}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((item.value / totalContent) * 100).toFixed(1)}% of total content
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsChartsWrapper 
        userGrowthData={userGrowthData}
        contentDistribution={contentDistribution}
      />
    </div>
  );
}
