
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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("demo@ranktracker.pro");
  const [password, setPassword] = useState("demopassword");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { auth, user, isUserLoading: isAuthLoading } = useFirebase();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
        toast({ variant: "destructive", title: "Hata", description: "Kimlik doğrulama hizmeti mevcut değil." });
        return;
    }
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Giriş Başarılı", description: "Yönlendiriliyorsunuz..." });
      // Redirect is handled by the useEffect above
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(newUserCredential.user, { displayName: "Demo User" });
          toast({ title: "Hesap Oluşturuldu", description: "Giriş yapılıyor ve yönlendiriliyorsunuz..." });
        } catch (createError: any) {
          toast({ variant: "destructive", title: "Hesap Oluşturma Hatası", description: createError.message });
          setIsSubmitting(false);
        }
      } else {
        toast({ variant: "destructive", title: "Giriş Hatası", description: error.message });
        setIsSubmitting(false);
      }
    } 
    // Do not set isSubmitting to false on success, as redirection will occur.
  };

  if (isAuthLoading || user) {
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
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
