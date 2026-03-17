import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

const ADMIN_EMAIL = "kishooore1@gmail.com";
const PIN_STORAGE_KEY = "adminPinHash";
const PIN_AUTH_KEY = "adminAuthenticated";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}jkbaking_salt_2024`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    setIsPinSet(!!stored);
  }, []);

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter a 4-digit PIN.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please refresh and try again.");
      return;
    }
    setIsLoading(true);
    try {
      // Store PIN hash locally
      const hashed = await hashPin(pin);
      localStorage.setItem(PIN_STORAGE_KEY, hashed);
      // Also register PIN on backend so admin backend operations work
      await actor.setAdminPin(pin);
      localStorage.setItem(PIN_AUTH_KEY, "true");
      toast.success("Admin PIN set! Welcome to the dashboard.");
      navigate({ to: "/admin" });
    } catch {
      toast.error("Setup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN.");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please refresh and try again.");
      return;
    }
    setIsLoading(true);
    try {
      // Verify PIN locally first
      const hashed = await hashPin(pin);
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (hashed !== stored) {
        toast.error("Incorrect PIN. Please try again.");
        setPin("");
        return;
      }
      // Grant backend admin access for this session
      await actor.adminPinLogin(pin);
      localStorage.setItem(PIN_AUTH_KEY, "true");
      toast.success("Welcome, Admin!");
      navigate({ to: "/admin" });
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPinSet === null || isFetching) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          data-ocid="admin_login.loading_state"
        />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">
              Admin Portal
            </CardTitle>
            <CardDescription>
              JK Baking Essentials — Secure Access
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Admin email badge */}
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">
                Admin account
              </p>
              <p className="text-sm font-medium">{ADMIN_EMAIL}</p>
            </div>

            {!isPinSet ? (
              /* First time — set PIN */
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  First-time setup — create a 4-digit PIN to secure the admin
                  panel.
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-center text-foreground/70">
                    Choose your PIN
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={setPin}
                      inputMode="numeric"
                      data-ocid="admin_login.input"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-center text-foreground/70">
                    Confirm your PIN
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={confirmPin}
                      onChange={setConfirmPin}
                      inputMode="numeric"
                      data-ocid="admin_login.textarea"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSetPin}
                  disabled={
                    pin.length < 4 || confirmPin.length < 4 || isLoading
                  }
                  data-ocid="admin_login.submit_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting
                      up...
                    </>
                  ) : (
                    "Set PIN & Enter Dashboard"
                  )}
                </Button>
              </div>
            ) : (
              /* PIN login */
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your 4-digit admin PIN.
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={setPin}
                    inputMode="numeric"
                    data-ocid="admin_login.input"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleLogin}
                  disabled={pin.length < 4 || isLoading}
                  data-ocid="admin_login.primary_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Verifying...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                  onClick={() => {
                    localStorage.removeItem(PIN_STORAGE_KEY);
                    setIsPinSet(false);
                    setPin("");
                  }}
                  data-ocid="admin_login.secondary_button"
                >
                  Reset PIN
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Admin access is restricted to authorized accounts only.
        </p>
      </div>
    </main>
  );
}
