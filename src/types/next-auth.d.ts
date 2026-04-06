import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    teamId?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      teamId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    teamId?: string;
  }
}
