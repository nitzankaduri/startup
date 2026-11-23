/** Shared zero-dependency freeze-frame & resume countdown bus between LiveGameEditor and GameKernel. */
const listeners = new Set();

export const kernelFreezeBus = {
  paused: false,
  countdownText: '',
  invulnDurationMs: 1500,
  shouldGrantInvuln: false,
};

function notify() {
  listeners.forEach((fn) => fn({ ...kernelFreezeBus }));
}

export function subscribeFreezeBus(fn) {
  listeners.add(fn);
  fn({ ...kernelFreezeBus });
  return () => listeners.delete(fn);
}

export function setKernelPaused(paused) {
  kernelFreezeBus.paused = Boolean(paused);
  if (paused) kernelFreezeBus.countdownText = '';
  notify();
}

let timerIds = [];
export function triggerResumeCountdown() {
  timerIds.forEach(clearTimeout);
  timerIds = [];
  kernelFreezeBus.paused = true;
  const steps = [['3', 0], ['2', 450], ['1', 900], ['GO!', 1350]];
  steps.forEach(([label, delay]) => {
    timerIds.push(setTimeout(() => {
      kernelFreezeBus.countdownText = label;
      if (label === 'GO!') {
        kernelFreezeBus.paused = false;
        kernelFreezeBus.shouldGrantInvuln = true;
      }
      notify();
    }, delay));
  });
  timerIds.push(setTimeout(() => {
    kernelFreezeBus.countdownText = '';
    notify();
  }, 1900));
}
