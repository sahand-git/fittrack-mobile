/**
 * Phone Pedometer & Motion Sensor Step Detector
 * Uses accelerometer peak detection filter with low-pass threshold, iOS/Android compatibility, and simulated walking mode
 */

export class PhonePedometer {
  private isListening: boolean = false;
  private isSimulating: boolean = false;
  private simInterval: any = null;
  private lastMagnitude: number = 0;
  private stepThreshold: number = 11.2; // Dynamic peak threshold in m/s^2 (gravity = 9.8)
  private minStepIntervalMs: number = 280; // Human step cadences rarely exceed ~3.5 steps/sec
  private lastStepTimestamp: number = 0;
  private onStepCallback: ((stepsAdded: number) => void) | null = null;
  private onMotionTelemetry: ((magnitude: number, raw: { x: number; y: number; z: number }) => void) | null = null;
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null;

  constructor(
    onStep?: (stepsAdded: number) => void,
    onTelemetry?: (magnitude: number, raw: { x: number; y: number; z: number }) => void
  ) {
    if (onStep) this.onStepCallback = onStep;
    if (onTelemetry) this.onMotionTelemetry = onTelemetry;
  }

  public setCallback(cb: (stepsAdded: number) => void) {
    this.onStepCallback = cb;
  }

  public setTelemetryCallback(cb: (magnitude: number, raw: { x: number; y: number; z: number }) => void) {
    this.onMotionTelemetry = cb;
  }

  public setSensitivity(threshold: number) {
    this.stepThreshold = Math.max(9.9, Math.min(18.0, threshold));
  }

  public async requestSensorPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.isSecureContext || typeof window.DeviceMotionEvent === 'undefined') return false;

    // iOS 13+ permission request
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === 'granted';
      } catch (err) {
        console.warn('DeviceMotionEvent permission error:', err);
        return false;
      }
    }

    // Android / Standard Browsers support DeviceMotionEvent directly
    return 'DeviceMotionEvent' in window;
  }

  public start(): boolean {
    if (this.isListening || typeof window === 'undefined') return false;

    this.motionHandler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      // 3D vector magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (this.onMotionTelemetry) {
        this.onMotionTelemetry(Math.round(magnitude * 10) / 10, { x, y, z });
      }

      // Peak detection with hysteresis
      if (
        magnitude > this.stepThreshold &&
        this.lastMagnitude <= this.stepThreshold &&
        now - this.lastStepTimestamp > this.minStepIntervalMs
      ) {
        this.lastStepTimestamp = now;
        if (this.onStepCallback) {
          this.onStepCallback(1);
        }
      }

      this.lastMagnitude = magnitude;
    };

    try {
      window.addEventListener('devicemotion', this.motionHandler, { passive: true });
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('Could not attach devicemotion listener', e);
      return false;
    }
  }

  public startWalkingSimulation(stepsPerMin: number = 105) {
    this.stop();
    this.isSimulating = true;
    const intervalMs = Math.round((60 / stepsPerMin) * 1000);

    let phase = 0;
    this.simInterval = setInterval(() => {
      phase++;
      const mag = 9.8 + Math.sin(phase) * 3.5 + (Math.random() * 0.8 - 0.4);
      if (this.onMotionTelemetry) {
        this.onMotionTelemetry(Math.round(mag * 10) / 10, {
          x: Math.sin(phase) * 1.5,
          y: Math.cos(phase) * 2.8,
          z: 9.8 + Math.sin(phase * 2) * 1.2
        });
      }
      if (this.onStepCallback) {
        this.onStepCallback(1);
      }
    }, intervalMs);
  }

  public stopWalkingSimulation() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.isSimulating = false;
  }

  public stop() {
    this.stopWalkingSimulation();
    if (this.isListening && this.motionHandler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening || this.isSimulating;
  }

  public getIsSimulating(): boolean {
    return this.isSimulating;
  }
}
