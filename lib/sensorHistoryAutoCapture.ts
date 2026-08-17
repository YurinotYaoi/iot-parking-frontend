export const AUTO_CAPTURE_MS = 5 * 60 * 1000;
const STORAGE_KEY = "sensor-history-auto-capture";

type AutoCaptureState = {
  enabled: boolean;
  layoutId: string | null;
  nextCaptureAt: number | null;
};

let timerId: number | null = null;
function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

export const DEFAULT_STATE: AutoCaptureState = {
  enabled: false,
  layoutId: null,
  nextCaptureAt: null,
};

const isBrowser = (): boolean => typeof window !== "undefined";
const isServer =(): boolean => typeof window === "undefined";


const readStorage = (): AutoCaptureState => {
  if (isServer()) {
    return DEFAULT_STATE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(stored) as Partial<AutoCaptureState>;

    const normalizedState = { 
      enabled: !!parsed.enabled, 
      layoutId: typeof parsed.layoutId === "string" ? parsed.layoutId : null, 
      nextCaptureAt: typeof parsed.nextCaptureAt === "number" ? parsed.nextCaptureAt : null 
    };
    return normalizedState;
  } catch {
    return DEFAULT_STATE;
  }
};

const writeStorage = (state: AutoCaptureState) => {
  if (isServer()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getAutoCaptureState = () => readStorage();

export const setAutoCaptureState = (state: AutoCaptureState) => {
  writeStorage(state);
};

export const stopAutoCapture = () => {
  if (isBrowser()) {
    clearTimer();
  }

  setAutoCaptureState(DEFAULT_STATE);
};

function handleAutoCaptureTick(onCapture: () => Promise<void> | void) {
  const state = getAutoCaptureState();
  if (!state.enabled || !state.layoutId) {
    stopAutoCapture();
    return;
  }
  const freshNextCaptureAt = Date.now() + AUTO_CAPTURE_MS;
  setAutoCaptureState({
    enabled: true,
    layoutId: state.layoutId,
    nextCaptureAt: freshNextCaptureAt,
  });

  void onCapture();
}

function scheduleAutoCapture(onCapture: () => Promise<void> | void) {
  timerId = window.setInterval(() => { handleAutoCaptureTick(onCapture); }, AUTO_CAPTURE_MS);
}

export const startAutoCapture = (
  layoutId: string,
  onCapture: () => Promise<void> | void,
) => {
  if (isServer()) return;

  clearTimer();

  const nextCaptureAt = Date.now() + AUTO_CAPTURE_MS;
  setAutoCaptureState({ enabled: true, layoutId, nextCaptureAt });

  scheduleAutoCapture(onCapture);
};

export const getSecondsUntilNextCapture = () => {
  const state = getAutoCaptureState();
  if (!state.enabled || !state.nextCaptureAt) {
    return 0;
  }
  const seconds= Math.max(0, Math.ceil((state.nextCaptureAt - Date.now()) / 1000));
  return seconds;
};
