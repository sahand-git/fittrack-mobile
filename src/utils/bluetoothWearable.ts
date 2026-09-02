/**
 * Web Bluetooth API Integration for Smart Wearables
 * Connects to standard Bluetooth Low Energy (BLE) GATT Fitness & Health Services:
 * - Running Speed and Cadence (RSC) 0x1814
 * - Heart Rate Service (HRS) 0x180D
 * - Cycling Speed and Cadence (CSC) 0x1816
 */

export interface WearableDeviceState {
  connected: boolean;
  deviceName: string | null;
  heartRate: number | null;
  cadenceRpm: number | null;
  totalSteps: number;
  lastUpdated: string | null;
}

export class BluetoothWearableManager {
  private device: any = null;
  private server: any = null;
  private onStateChange: ((state: WearableDeviceState) => void) | null = null;
  private state: WearableDeviceState = {
    connected: false,
    deviceName: null,
    heartRate: null,
    cadenceRpm: null,
    totalSteps: 0,
    lastUpdated: null
  };

  constructor(callback?: (state: WearableDeviceState) => void) {
    if (callback) this.onStateChange = callback;
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getState(): WearableDeviceState {
    return { ...this.state };
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public async connect(): Promise<{ success: boolean; message: string }> {
    if (!this.isBluetoothSupported()) {
      return {
        success: false,
        message: 'Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or an Android browser with Bluetooth enabled.'
      };
    }

    try {
      // Request Bluetooth device with standard fitness & health GATT services
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['running_speed_and_cadence'] },
          { services: ['cycling_speed_and_cadence'] },
          { services: [0x180d] },
          { services: [0x1814] }
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      this.device = device;
      this.state.deviceName = device.name || 'Bluetooth Wearable';

      device.addEventListener('gattserverdisconnected', () => {
        this.state.connected = false;
        this.state.heartRate = null;
        this.state.cadenceRpm = null;
        this.notify();
      });

      const server = await device.gatt.connect();
      this.server = server;
      this.state.connected = true;

      // Subscribe to Heart Rate if available
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (e: any) => {
          const value = e.target.value;
          const flags = value.getUint8(0);
          let hr = 0;
          if (flags & 0x01) {
            hr = value.getUint16(1, true); // 16-bit
          } else {
            hr = value.getUint8(1); // 8-bit
          }
          this.state.heartRate = hr;
          this.state.lastUpdated = new Date().toLocaleTimeString();
          this.notify();
        });
      } catch (hrErr) {
        console.warn('Heart rate GATT not available on this device:', hrErr);
      }

      // Subscribe to Running Speed and Cadence if available
      try {
        const rscService = await server.getPrimaryService('running_speed_and_cadence');
        const rscChar = await rscService.getCharacteristic('rsc_measurement');
        await rscChar.startNotifications();
        rscChar.addEventListener('characteristicvaluechanged', (e: any) => {
          const value = e.target.value;
          // Cadence is at byte offset 3
          if (value.byteLength >= 4) {
            const cadence = value.getUint8(3); // Strides/steps per minute
            this.state.cadenceRpm = cadence;
            // Accumulate steps incrementally
            this.state.totalSteps += Math.max(1, Math.round(cadence / 60));
            this.state.lastUpdated = new Date().toLocaleTimeString();
            this.notify();
          }
        });
      } catch (rscErr) {
        console.warn('RSC GATT not available:', rscErr);
      }

      this.notify();
      return { success: true, message: `Connected to ${this.state.deviceName} successfully!` };
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      return {
        success: false,
        message: err.name === 'NotFoundError' ? 'User cancelled device pairing.' : `Bluetooth error: ${err.message || err}`
      };
    }
  }

  public disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.state.connected = false;
    this.state.heartRate = null;
    this.state.cadenceRpm = null;
    this.notify();
  }
}
