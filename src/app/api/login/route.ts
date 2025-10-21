import { auth } from "@/lib/firebase/server";
import { NextRequest } from "next/server";


export async function POST(req: NextRequest) {
    return auth.handleLogin(req);
}
