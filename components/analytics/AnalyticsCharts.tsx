"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function AnalyticsCharts({ userGrowthData, contentDistribution }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
          <CardDescription>Daily new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>Content Distribution</CardTitle>
          <CardDescription>Breakdown by content type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {contentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
