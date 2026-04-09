/** 纯函数：每秒倒计时步进（便于单测状态机）。 */
export function nextCooldownTick(secondsLeft: number): number {
  if (secondsLeft <= 1) return 0;
  return secondsLeft - 1;
}
