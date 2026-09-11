"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Check for Google OAuth Implicit Flow callback in hash
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          try {
            // Fetch user profile from Google
            const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const googleProfile = await googleRes.json();
            
            // Login/register on our backend
            const authRes = await fetch('/api/auth/google-implicit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(googleProfile)
            });
            
            if (!authRes.ok) throw new Error('Backend auth failed');
            
            const data = await authRes.json();
            setAuth(data.user, data.token);
            
            const userStr = encodeURIComponent(JSON.stringify(data.user));
            const appUrl = `liquidchat://auth?token=${data.token}&user=${userStr}`;
            setDeepLinkUrl(appUrl);
            
            if (!(window as any).Android) {
              window.location.href = appUrl;
              setTimeout(() => {
                // If app didn't take over, allow navigation
              }, 1200);
            } else {
              router.push("/");
            }
          } catch (err) {
            console.error(err);
            router.push("/auth?error=GoogleAuthFailed");
          }
          return;
        }
      }

      // Normal callback from backend redirect or deep link
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
          
          const appUrl = `liquidchat://auth?token=${token}&user=${encodeURIComponent(userStr)}`;
          setDeepLinkUrl(appUrl);

          if (typeof window !== 'undefined' && !(window as any).Android) {
            window.location.href = appUrl;
          } else {
            router.push("/");
          }
        } catch (err) {
          console.error("Failed to parse user data:", err);
          router.push("/auth?error=ParseError");
        }
      } else if (!window.location.hash.includes('access_token=')) {
        router.push("/auth?error=MissingData");
      }
    };

    handleGoogleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-liquid-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin mb-6" />
      <h2 className="text-xl font-bold text-foreground mb-2">Login Successful!</h2>
      <p className="text-foreground/70 text-sm max-w-sm mb-6">
        Redirecting you back to the Liquid Chat app...
      </p>

      {deepLinkUrl && (
        <div className="flex flex-col items-center gap-3">
          <a
            href={deepLinkUrl}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold text-sm shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all"
          >
            Open Liquid Chat App
          </a>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-foreground/50 hover:text-foreground mt-2 underline"
          >
            Or continue in browser
          </button>
        </div>
      )}
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
