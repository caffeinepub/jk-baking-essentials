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

const PIN_AUTH_KEY = "adminAuthenticated";
const PIN_SET_KEY = "adminPinConfigured";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    // Check backend whether PIN has been set
    actor
      .isAdminPinSet()
      .then((set: boolean) => {
        setIsPinSet(set);
        if (set) {
          // Keep local marker in sync
          localStorage.setItem(PIN_SET_KEY, "true");
        }
      })
      .catch(() => {
        // Fallback to local storage
        setIsPinSet(!!localStorage.getItem(PIN_SET_KEY));
      });
  }, [actor]);

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
      const success = await actor.setAdminPin(pin);
      if (!success) {
        toast.error("PIN already set. Please use the login form below.");
        setIsPinSet(true);
        return;
      }
      // Immediately log in after setting PIN
      await actor.adminPinLogin(pin);
      localStorage.setItem(PIN_SET_KEY, "true");
      localStorage.setItem(PIN_AUTH_KEY, "true");
      toast.success("Admin PIN set! Welcome to the dashboard.");
      navigate({ to: "/admin" });
    } catch (err) {
      console.error(err);
      toast.error("Setup failed. Please refresh and try again.");
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
      const success = await actor.adminPinLogin(pin);
      if (!success) {
        toast.error("Incorrect PIN. Please try again.");
        setPin("");
        return;
      }
      localStorage.setItem(PIN_AUTH_KEY, "true");
      toast.success("Welcome, Admin!");
      navigate({ to: "/admin" });
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPin = () => {
    localStorage.removeItem(PIN_SET_KEY);
    localStorage.removeItem(PIN_AUTH_KEY);
    setIsPinSet(false);
    setPin("");
    setConfirmPin("");
    toast.info(
      "PIN reset. You can set a new PIN after re-deploying or contact support.",
    );
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
            {!isPinSet ? (
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
                  onClick={handleResetPin}
                  data-ocid="admin_login.secondary_button"
                >
                  Forgot PIN? Reset
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
