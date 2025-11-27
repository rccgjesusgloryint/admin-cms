import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  systemStatus: {
    database: string;
    uptime: number;
  };
}

export function SystemStatus({ systemStatus }: Props) {
  const isDatabaseHealthy = systemStatus.database === "healthy";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Server Uptime</span>
            <span className="font-medium">{systemStatus.uptime}%</span>
          </div>
          <Progress value={systemStatus.uptime} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Database Status</span>
            <span className={`font-medium ${isDatabaseHealthy ? "text-green-500" : "text-red-500"}`}>
              {isDatabaseHealthy ? "Healthy" : "Error"}
            </span>
          </div>
          <Progress 
            value={isDatabaseHealthy ? 100 : 0} 
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Memory Usage</span>
            <span className="font-medium">62%</span>
          </div>
          <Progress value={62} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
