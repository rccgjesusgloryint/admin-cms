// hooks/useNavbarAuth.ts
import { useEffect, useState } from "react";
import { getAuthUserDetails } from "@/lib/queries";
import { $Enums } from "@prisma/client";

export function useMemberCheck() {
  const [role, setRole] = useState<$Enums.Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    const userCheck = async () => {
      const authedUser = await getAuthUserDetails();
      if (!authedUser) return null;
      setRole(authedUser.member);
      setIsLoading(false);
    };
    userCheck();
  }, []);

  return { role, isLoading };
}
