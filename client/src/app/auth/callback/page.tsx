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
              const intentUrl = `intent://auth?token=${data.token}&user=${userStr}#Intent;scheme=liquidchat;package=com.liquidchat.app;end`;
              const appUrl = `liquidchat://auth?token=${data.token}&user=${userStr}`;
              setDeepLinkUrl(intentUrl);
              setStatusMessage("Authentication Successful!");
              
              setTimeout(() => {
                try {
                  window.location.href = intentUrl;
                } catch (e) {
                  try {
                    window.location.href = appUrl;
                  } catch (e2) {}
                }
              }, 200);
            } else {
              setStatusMessage("Login successful! Redirecting to chat...");
              if (returnOrigin && returnOrigin !== window.location.origin) {
                window.location.href = `${returnOrigin}/auth/callback?token=${data.token}&user=${userStr}`;
              } else {
                window.location.href = `/?token=${data.token}&user=${userStr}`;
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
          let user: any;
          try {
            user = JSON.parse(decodeURIComponent(userStr));
          } catch {
            user = JSON.parse(userStr);
          }
          localStorage.setItem("liquid_token", token);
          localStorage.setItem("liquid_user", JSON.stringify(user));
          setAuth(user, token);

          const safeUserJson = encodeURIComponent(JSON.stringify(user));

          if (isApp) {
            setIsFromApp(true);
            const intentUrl = `intent://auth?token=${token}&user=${safeUserJson}#Intent;scheme=liquidchat;package=com.liquidchat.app;end`;
            const appUrl = `liquidchat://auth?token=${token}&user=${safeUserJson}`;
            setDeepLinkUrl(intentUrl);
            setStatusMessage("Authentication Successful!");
            setTimeout(() => {
              try {
                window.location.href = intentUrl;
              } catch (e) {
                try {
                  window.location.href = appUrl;
                } catch (e2) {}
              }
            }, 200);
          } else {
            setStatusMessage("Login successful! Redirecting to chat...");
            if (returnOrigin && returnOrigin !== window.location.origin) {
              window.location.href = `${returnOrigin}/auth/callback?token=${token}&user=${safeUserJson}`;
            } else {
              window.location.href = `/?token=${token}&user=${safeUserJson}`;
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
      <div className="w-14 h-14 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_25px_rgba(0,210,255,0.4)]" />
      <h2 className="text-xl font-bold text-foreground mb-2">{statusMessage}</h2>
      
      {isFromApp && deepLinkUrl ? (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-foreground/70 text-sm max-w-sm mb-2">
            Tap the button below to return to your Liquid Chat Android App:
          </p>
          <a
            href={deepLinkUrl}
            onClick={() => {
              // Backup scheme attempt on user click
              setTimeout(() => {
                const fallback = deepLinkUrl.replace('intent://', 'liquidchat://').split('#Intent')[0];
                window.location.href = fallback;
              }, 500);
            }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-extrabold text-base shadow-[0_0_30px_rgba(0,210,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            🚀 Open Liquid Chat App
          </a>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="text-xs text-foreground/50 hover:text-foreground mt-4 underline cursor-pointer"
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
