"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/auth?error=${error}`);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuth(user, token);
        
        // If we are in an external mobile browser, jump back to the native app
        if (typeof window !== 'undefined' && !(window as any).Android) {
            window.location.href = `liquidchat://auth?token=${token}&user=${encodeURIComponent(userStr)}`;
            
            // Fallback for PC web users
            setTimeout(() => {
                router.push("/");
            }, 800);
        } else {
            router.push("/");
        }
      } catch (err) {
        console.error("Failed to parse user data:", err);
        router.push("/auth?error=ParseError");
      }
    } else {
      router.push("/auth?error=MissingData");
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-foreground/70 font-medium">Completing login...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <CallbackLogic />
    </Suspense>
  );
}
