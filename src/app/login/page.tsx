"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from '@/components/app-logo';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("demo@ranktracker.pro");
  const [password, setPassword] = useState("demopassword");
  const [isLoading, setIsLoading] = useState(true); // Başlangıçta auth durumunu kontrol etmek için true

  // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setIsLoading(false); // Kullanıcı yoksa formu göster
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Giriş Başarılı", description: "Yönlendiriliyorsunuz..." });
      // Yönlendirme useEffect içinde onAuthStateChanged tarafından yapılacak
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Kullanıcı yoksa, yeni bir hesap oluştur
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          // Yeni kullanıcıya bir görünen ad ekleyelim
          await updateProfile(newUserCredential.user, { displayName: "Demo User" });

          toast({ title: "Hesap Oluşturuldu", description: "Giriş yapılıyor ve yönlendiriliyorsunuz..." });
          // Yönlendirme yine onAuthStateChanged tarafından yapılacak
        } catch (createError: any) {
          toast({ variant: "destructive", title: "Hesap Oluşturma Hatası", description: createError.message });
        }
      } else {
        toast({ variant: "destructive", title: "Giriş Hatası", description: error.message });
      }
    } finally {
      // onAuthStateChanged'in yönlendirme yapması için isLoading'i false yapmıyoruz.
      // Sadece hata durumunda false'a çekebiliriz.
      if (!auth.currentUser) {
          setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AppLogo />
          <CardTitle className="text-2xl pt-4">Hoş Geldiniz</CardTitle>
          <CardDescription>
            Devam etmek için bilgilerinizi girin. Demo hesabı otomatik olarak oluşturulacaktır.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@mail.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
