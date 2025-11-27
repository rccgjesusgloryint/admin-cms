import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import CreateNewsletterForm from "../forms/CreateNewsletterForm";

type Props = {};

const Newsletter = (props: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold">
          <CardDescription className="text-4xl">
            Create a Newsletter Post
          </CardDescription>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CreateNewsletterForm />
      </CardContent>
    </Card>
  );
};

export default Newsletter;
