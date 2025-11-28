"use client";

import { getAllReports } from "@/lib/queries";
import { Feedback } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Mail, User, Tag, MessageSquare, MapPin } from "lucide-react";

type Props = {};

const ReportList = (props: Props) => {
  const [reportList, setReportList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await getAllReports();
        // Sort by newest first
        const sorted = response.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log(sorted);
        setReportList(sorted);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  if (loading) {
    return (
      <section className="w-full p-6">
        <p className="text-muted-foreground">Loading reports...</p>
      </section>
    );
  }

  if (reportList.length === 0) {
    return (
      <section className="w-full p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No feedback reports yet.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full p-6">
      <div className="grid gap-4">
        {reportList.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {report.category && (
                      <Badge variant="secondary" className="mb-2">
                        <Tag className="h-3 w-3 mr-1" />
                        {report.category}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1 text-sm">
                    {report.name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.name}
                      </span>
                    )}
                    {report.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.email}
                      </span>
                    )}
                    {report.feedbackFrom && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        From: {report.feedbackFrom}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <p className="text-sm leading-relaxed">{report.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ReportList;
