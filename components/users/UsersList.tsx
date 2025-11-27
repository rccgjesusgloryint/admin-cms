"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers } from "@/lib/queries";
import { User } from "next-auth";
import Link from "next/link";

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await getAllUsers() as User[];
      setUsers(res);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }



  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardHeader>
            <CardTitle>{user.name || user.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                {user.email}
              </p>
              <Link href={`/dashboard/users/${user.id}/edit`}>
                <Button size="sm" variant="outline">
                  Edit Role
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}