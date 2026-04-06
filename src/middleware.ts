export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/precios/:path*",
    "/central-telefonica/:path*",
    "/guardias/:path*",
    "/respuestas/:path*",
    "/vacaciones/:path*",
    "/admin/:path*",
  ],
};
