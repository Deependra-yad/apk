"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [isFromApp, setIsFromApp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Logging in...");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      let isApp = false;
      let returnOrigin = "";

      const checkState = (raw: string | null) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(decodeURIComponent(raw));
          if (parsed.isApp) isApp = true;
          if (parsed.origin) returnOrigin = parsed.origin;
        } catch (e) {
          if (raw === "from_app" || raw.includes("app")) isApp = true;
        }
      };

      if (typeof window !== "undefined") {
        if ((window as any).Android) isApp = true;
      }

      // 1. Check for Google OAuth Implicit Flow callback in URL hash
      if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        checkState(hashParams.get("state"));

        if (accessToken) {
          try {
            setStatusMessage("Verifying Google account...");
            const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const googleProfile = await googleRes.json();

            const authRes = await fetch("/api/auth/google-implicit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(googleProfile)
            });

            if (!authRes.ok) {
              const errData = await authRes.json().catch(() => ({}));
              throw new Error(errData.error || "Backend auth failed");
            }

            const data = await authRes.json();
            localStorage.setItem("liquid_token", data.token);
            localStorage.setItem("liquid_user", JSON.stringify(data.user));
            setAuth(data.user, data.token);

            const userStr = encodeURIComponent(JSON.stringify(data.user));

            if (isApp) {
              setIsFromApp(true);
              const appUrl = `liquidchat://auth?token=${data.token}&user=${userStr}`;
              setDeepLinkUrl(appUrl);
              setStatusMessage("Returning to Liquid Chat App...");
              
              setTimeout(() => {
                try {
                  window.location.href = appUrl;
                } catch (e) {}
              }, 300);
            } else {
              setStatusMessage("Login successful! Redirecting to chat...");
              if (returnOrigin && returnOrigin !== window.location.origin) {
                window.location.href = `${returnOrigin}/auth/callback?token=${data.token}&user=${userStr}`;
              } else {
                window.location.href = "/";
              }
            }
            return;
          } catch (err: any) {
            console.error("Google Auth error:", err);
            router.push(`/auth?error=${encodeURIComponent(err.message || "GoogleAuthFailed")}`);
            return;
          }
        }
      }

      // 2. Normal callback from backend redirect or query parameters
      const token = searchParams.get("token");
      const userStr = searchParams.get("user");
      const error = searchParams.get("error");
      checkState(searchParams.get("state"));

      if (error) {
        router.push(`/auth?error=${encodeURIComponent(error)}`);
        return;
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem("liquid_token", token);
          localStorage.setItem("liquid_user", JSON.stringify(user));
          setAuth(user, token);

          if (isApp) {
            setIsFromApp(true);
            const appUrl = `liquidchat://auth?token=${token}&user=${encodeURIComponent(userStr)}`;
            setDeepLinkUrl(appUrl);
            setStatusMessage("Returning to Liquid Chat App...");
            setTimeout(() => {
              try {
                window.location.href = appUrl;
              } catch (e) {}
            }, 300);
          } else {
            setStatusMessage("Login successful! Redirecting to chat...");
            if (returnOrigin && returnOrigin !== window.location.origin) {
              window.location.href = `${returnOrigin}/auth/callback?token=${token}&user=${encodeURIComponent(userStr)}`;
            } else {
              window.location.href = "/";
            }
          }
        } catch (err) {
          console.error("Failed to parse user data:", err);
          router.push("/auth?error=ParseError");
        }
      } else if (!window.location.hash.includes("access_token=")) {
        router.push("/auth?error=MissingData");
      }
    };

    handleGoogleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-liquid-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin mb-6" />
      <h2 className="text-xl font-bold text-foreground mb-2">{statusMessage}</h2>
      
      {isFromApp && deepLinkUrl ? (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-foreground/70 text-sm max-w-sm mb-2">
            If the app did not open automatically, please tap the button below:
          </p>
          <a
            href={deepLinkUrl}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold text-sm shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all"
          >
            Open Liquid Chat App
          </a>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="text-xs text-foreground/50 hover:text-foreground mt-3 underline cursor-pointer"
          >
            Or continue in browser
          </button>
        </div>
      ) : (
        <p className="text-foreground/60 text-sm">Please wait while we set up your secure session...</p>
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
