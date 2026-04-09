import { useCallback, useEffect, useState } from "react";

import { nextCooldownTick } from "@/modules/auth/otpCooldownTick";

/**
 * 通用秒级倒计时；用于验证码重发节流倒计时展示。
 */
export function useOtpCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => nextCooldownTick(s));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const start = useCallback((seconds: number) => {
    setSecondsLeft(Math.max(0, Math.floor(seconds)));
  }, []);

  return { secondsLeft, start };
}
