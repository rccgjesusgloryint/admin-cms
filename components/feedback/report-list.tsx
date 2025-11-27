"use client";

import { getAllReports } from "@/lib/queries";
import { Feedback } from "@prisma/client";
import React, { useEffect, useState } from "react";

type Props = {};

const ReportList = (props: Props) => {
  const [reportList, setReportList] = useState<Feedback[]>();

  useEffect(() => {
    const getData = async () => {
      const response = await getAllReports();
      setReportList(response);
    };
    getData();
  }, []);
  return (
    <section className="h-screen w-full">
      <div className="flex h-full">
        {reportList?.map((item) => (
          <span className="text-white" key={item.id}>
            {JSON.stringify({ item })}
          </span>
        ))}
      </div>
    </section>
  );
};

export default ReportList;
