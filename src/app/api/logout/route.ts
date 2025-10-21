import { auth } from "@/lib/firebase/server";

export async function POST() {
    return auth.handleLogout();
}
