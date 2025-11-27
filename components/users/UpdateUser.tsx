"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import { $Enums, Role, User } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UpdateUserForm from "./forms/UpdateUserForm";
import { useSession } from "next-auth/react";
import { getAuthUserDetails, isUserOwner } from "@/lib/queries";
import Unauthorized from "../unauthorized/AdminOnly";
import { useMemberCheck } from "@/hooks/useMemberCheck";

type Props = {
  allUsers: User[];
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setClose: () => void;
  user: string;
};

const UpdateUser = ({ allUsers, setRefresh, setClose, user }: Props) => {
  const { role, isLoading } = useMemberCheck();

  if (role !== "OWNER") {
    return <Unauthorized />;
  }
  return (
    <section className="min-h-[500px] h-auto sm:p-5">
      <Card className="p-5">
        <CardHeader>
          <CardTitle className="font-bold text-4xl">Edit Users</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-full">
          {allUsers?.map(({ name, member, id }) => (
            <UpdateUserForm
              usersRole={member as Role}
              userId={id}
              setRefresh={setRefresh}
              setClose={setClose}
              user={name!}
              key={id.slice(0, 18)}
            />
          ))}
        </CardContent>
      </Card>
    </section>
  );
};

export default UpdateUser;
