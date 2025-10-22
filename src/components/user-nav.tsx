"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import { auth } from "@/lib/firebase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface UserNavProps {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export function UserNav({ displayName, email, photoURL }: UserNavProps) {
  const router = useRouter()
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: "Çıkış Başarılı", description: "Giriş sayfasına yönlendiriliyorsunuz." });
      // Yönlendirme layout'taki onAuthStateChanged tarafından yapılacak
      // router.push('/login'); 
    } catch (error: any) {
      console.error("Failed to logout", error);
      toast({ variant: "destructive", title: "Çıkış Hatası", description: error.message });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {photoURL && <AvatarImage src={photoURL} alt={displayName ?? ""} />}
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName ?? "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Ayarlar</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Çıkış Yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
