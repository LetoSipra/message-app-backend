import { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  //console.log("hit");
  const token = req.cookies.get("token")?.value;
  if (!token && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
  if (token && req.nextUrl.pathname === "/login") {
    const newUrl = new URL("/", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
