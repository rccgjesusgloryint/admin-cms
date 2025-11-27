import { UsersList } from "@/components/users/UsersList";
export default function UsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <UsersList />
    </div>
  );
}