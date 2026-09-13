/* localized-render */
import { t, useLocale, localeTag, matchesLocalized } from "../utils/locale";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Barcode,
  Camera,
  X,
  Search,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
  Flame,
  Zap,
  Info,
  ShieldCheck,
  UploadCloud,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { useFitness } from '../context/FitnessContext';
import { MealType, FoodItem } from '../types';
import { lookupBarcode } from '../utils/barcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  targetMeal?: MealType;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenAIScanner?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  defaultMealType,
  targetMeal = 'lunch',
  onOpenAIScanner
}) => {
  useLocale();
  const effectiveMeal = defaultMealType || targetMeal || 'lunch';
  const { logFood, addCustomFood, customFoods } = useFitness();

  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<FoodItem | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Logging parameters
  const [selectedMeal, setSelectedMeal] = useState<MealType>(effectiveMeal);
  const [servingsCount, setServingsCount] = useState<number>(1);
  const lookupBusy = useRef(false);
  const openRef = useRef(isOpen);
  openRef.current = isOpen;
  const requestId = useRef(0);
  const lookupHandler = useRef<(code: string) => Promise<void>>(async () => {});

  useEffect(() => {
    requestId.current += 1;
    lookupBusy.current = false;
    setIsSearching(false);
    setScannedProduct(null);
    setErrorMessage(null);
    setManualCode('');
    setScanMode('camera');
    setTorchOn(false);
    setTorchSupported(true);
    return () => { requestId.current += 1; };
  }, [isOpen]);

  // Camera scanner reference
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScannerRunningRef = useRef<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(true);

  // Sync meal type if prop changes
  useEffect(() => {
    setSelectedMeal(effectiveMeal);
  }, [effectiveMeal, isOpen]);

  // Start / stop camera scanner
  useEffect(() => {
    if (!isOpen || scanMode !== 'camera' || scannedProduct) {
      stopCamera();
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        const elementId = 'barcode-reader-viewport';
        const readerElement = document.getElementById(elementId);
        if (!readerElement) return;

        if (scannerRef.current) {
          try {
            if (isScannerRunningRef.current) {
              await scannerRef.current.stop();
              isScannerRunningRef.current = false;
            }
          } catch (e) {
            console.warn('Stopping previous scanner instance:', e);
          }
        }

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Found barcode!
            void lookupHandler.current(decodedText);
          },
          () => {
            // Scanning in progress
          }
        );

        if (cancelled) {
          if (html5QrCode.isScanning) await html5QrCode.stop();
          html5QrCode.clear();
          return;
        }
        isScannerRunningRef.current = true;
        setCameraActive(true);
      } catch (err: any) {
        if (cancelled) return;
        console.warn('Camera barcode start error:', err);
        setCameraActive(false);
        setErrorMessage('Camera access unavailable or blocked. You can upload a photo of the barcode or enter the number below.');
      }
    };

    timeoutId = setTimeout(startScanner, 150);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [isOpen, scanMode, scannedProduct]);

  const stopCamera = async () => {
    if (scannerRef.current && isScannerRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isScannerRunningRef.current = false;
        setCameraActive(false);
        setTorchOn(false);
      }
    }
  };

  // Low light is the single biggest real-world cause of failed barcode reads on
  // phone cameras, and html5-qrcode does not turn the flash on by itself.
  // Not every device/browser exposes a torch control, so this fails silently
  // and hides the button rather than showing an error for an optional feature.
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScannerRunningRef.current) return;
    const next = !torchOn;
    try {
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: next }],
      });
      setTorchOn(next);
    } catch (err) {
      console.warn('Torch not supported on this device:', err);
      setTorchSupported(false);
    }
  };

  const handleBarcodeFound = async (barcode: string) => {
    // Camera callbacks can fire several times before React re-renders.
    if (lookupBusy.current || !openRef.current) return;
    lookupBusy.current = true;
    const id = ++requestId.current;
    setIsSearching(true);
    setErrorMessage(null);
    await stopCamera();
    try {
      const food = await lookupBarcode(barcode, customFoods);
      if (id !== requestId.current) return;
      const saved = addCustomFood(food);
      setScannedProduct(saved);
      setServingsCount(1);
      navigator.vibrate?.([40, 60, 40]);
    } catch (error) {
      if (id !== requestId.current) return;
      setErrorMessage(error instanceof Error ? error.message : 'Could not look up this barcode. Please try again.');
      setManualCode(barcode);
      setScanMode('manual');
    } finally {
      if (id === requestId.current) {
        lookupBusy.current = false;
        setIsSearching(false);
      }
    }
  };
  lookupHandler.current = handleBarcodeFound;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeFound(manualCode.trim());
  };

  // Image Upload / Photo Scan
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      // Use Html5Qrcode to scan barcode from uploaded image file
      const html5QrCode = new Html5Qrcode('barcode-file-decoder-temp');
      const scanResult = await html5QrCode.scanFileV2(file, true);

      if (scanResult && scanResult.decodedText) {
        await handleBarcodeFound(scanResult.decodedText);
      } else {
        setErrorMessage('No barcode recognized in the image. Please ensure the barcode is sharp, well-lit, and unblurred.');
      }
    } catch (err: any) {
      console.warn('Barcode image decode failed:', err);
      setErrorMessage('Could not decode barcode from image. Please try taking a closer photo or enter the barcode number manually.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleLogScannedProduct = () => {
    if (!scannedProduct) return;

    logFood(selectedMeal, scannedProduct, servingsCount);

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden container for image decoding */}
      <div id="barcode-file-decoder-temp" className="hidden" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{t("Barcode Scanner")}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3" />{t("Open Food Facts")}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t("Scan package barcode, upload photo, or enter UPC number")}</p>
            </div>
          </div>
          <button aria-label={t("Close")}
            id="close-barcode-scanner"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mode Switcher */}
          {t(!scannedProduct && (
            <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              <button
                id="btn-scan-mode-camera"
                type="button"
                onClick={() => {
                  setScanMode('camera');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'camera'
                    ? 'bg-white text-teal-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t("Live Camera")}</span>
              </button>

              <button
                id="btn-scan-mode-upload"
                type="button"
                onClick={() => {
                  setScanMode('upload');
                  stopCamera();
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'upload'
                    ? 'bg-white text-teal-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t("Photo Upload")}</span>
              </button>

              <button
                id="btn-scan-mode-manual"
                type="button"
                onClick={() => {
                  setScanMode('manual');
                  stopCamera();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  scanMode === 'manual'
                    ? 'bg-white text-teal-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t("Enter UPC")}</span>
              </button>
            </div>
          ))}

          {/* 1. Camera Viewport */}
          {t(!scannedProduct && scanMode === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square max-h-[280px] flex items-center justify-center">
              <div id="barcode-reader-viewport" className="w-full h-full object-cover" />

              {cameraActive && torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  aria-label={t('Toggle flashlight')}
                  className={`absolute top-2 end-2 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                    torchOn
                      ? 'bg-amber-400 border-amber-300 text-slate-900'
                      : 'bg-slate-900/70 border-slate-700 text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" strokeWidth={2} />
                </button>
              )}

              {/* Viewfinder Overlays & Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-56 h-36 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                  {/* Laser Scan Line */}
                  <motion.div
                    animate={{ y: [0, 130, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_10px_#f43f5e]"
                  />
                  {/* Corner notches */}
                  <div className="absolute top-1 start-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-1 end-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-1 start-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-1 end-1 w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>
              </div>

              {t(isSearching && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-semibold">{t("Consulting Open Food Facts database...")}</span>
                </div>
              ))}
            </div>
          ))}

          {/* 2. Photo Upload Barcode Scan */}
          {t(!scannedProduct && scanMode === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="input-barcode-file"
                className="border-2 border-dashed border-teal-300/80 hover:border-teal-500 rounded-3xl p-6 text-center cursor-pointer bg-teal-50/40 hover:bg-teal-50/70 transition-all flex flex-col items-center justify-center gap-3 block"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100/80 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                  {t(isUploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />)}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {t(isUploadingImage ? 'Analyzing Barcode Photo...' : 'Upload or Snap Barcode Photo')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-1">{t(" Take a photo with your phone camera or select from image gallery ")}</span>
                </div>
                <input
                  id="input-barcode-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  disabled={isUploadingImage || isSearching}
                  className="hidden"
                />
              </label>
            </div>
          ))}

          {/* 3. Manual Barcode Entry */}
          {t(!scannedProduct && (scanMode === 'manual' || scanMode === 'upload') && (
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t(" Enter Barcode (UPC / EAN Number) ")}</label>
                <div className="relative">
                  <Barcode className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="input-barcode-manual"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder={t("e.g. 748927028669 or 011110850027")}
                    className="w-full ps-11 pe-24 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-mono shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim() || isSearching || isUploadingImage}
                    className="absolute end-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {t(isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search')}
                  </button>
                </div>
              </div>

              {/* Instant Test Presets */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />{t(" One-Tap Barcode Samples: ")}</span>
                <div className="flex flex-wrap gap-2">
                  {t([
                    { code: '748927028669', name: 'Gold Standard Whey' },
                    { code: '011110850027', name: 'Large Eggs' },
                    { code: '602652171050', name: 'KIND Almond Bar' },
                    { code: '049000042566', name: 'Coke Zero Sugar' },
                    { code: '052159000000', name: 'Greek Yogurt 0%' }
                  ].map((sample) => (
                    <button
                      key={sample.code}
                      type="button"
                      onClick={() => {
                        setManualCode(sample.code);
                        handleBarcodeFound(sample.code);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[11px] font-semibold rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span className="font-mono text-teal-700 font-bold">{t(sample.code)}</span>
                      <span className="text-slate-500 font-medium">({t(sample.name)})</span>
                    </button>
                  )))}
                </div>
              </div>
            </form>
          ))}

          {/* Error Message */}
          {t(errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex flex-col gap-2 font-medium">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{t(errorMessage)}</span>
              </div>
              {/* Open Food Facts is a global, crowd-sourced database and has very
                  little coverage of local/regional products (common for
                  Kurdistan/Iraq packaged goods). Rather than dead-ending on
                  "not found", offer the AI photo estimator as a real next step. */}
              {onOpenAIScanner && errorMessage.includes('not found in Open Food Facts') && (
                <button
                  type="button"
                  onClick={() => { onOpenAIScanner(); onClose(); }}
                  className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('Not in the database — estimate it from a photo instead')}</span>
                </button>
              )}
            </div>
          ))}

          {/* 4. Scanned Product Result Inspector */}
          {t(scannedProduct && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p role="status" className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{t("Saved on this phone. Find it anytime by name, brand, or barcode in Food Search.")}</span>
              </p>
              {/* Product Header Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex gap-4 shadow-2xs">
                {scannedProduct.imageUrl ? (
                  <img
                    src={scannedProduct.imageUrl}
                    alt={t(scannedProduct.name)}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-contain bg-white p-1 border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Barcode className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t(scannedProduct.brand && (
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                        {t(scannedProduct.brand)}
                      </span>
                    ))}
                    {t(scannedProduct.nutriScore && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white ${
                          scannedProduct.nutriScore === 'A'
                            ? 'bg-emerald-600'
                            : scannedProduct.nutriScore === 'B'
                            ? 'bg-lime-600'
                            : scannedProduct.nutriScore === 'C'
                            ? 'bg-amber-600'
                            : 'bg-rose-600'
                        }`}
                      >{t(" NUTRI-SCORE ")}{t(scannedProduct.nutriScore)}
                      </span>
                    ))}
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {t(scannedProduct.source === 'open_food_facts' ? 'Ref: Open Food Facts' : 'Saved food')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">{t(scannedProduct.name)}</h3>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <span>{t("Serving: ")}{t(scannedProduct.servingSize)}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">#{t(scannedProduct.barcode)}</span>
                  </div>
                </div>
              </div>

              {/* Calculated Nutrients based on Servings Count */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-center shadow-2xs">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">{t("Calories")}</span>
                  <span className="text-base font-extrabold text-emerald-950 mt-0.5 block font-mono">
                    {t(Math.round(scannedProduct.calories * servingsCount))}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">{t("kcal")}</span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-center shadow-2xs">
                  <span className="text-[10px] text-rose-700 uppercase font-bold block">{t("Protein")}</span>
                  <span className="text-base font-extrabold text-rose-950 mt-0.5 block font-mono">
                    {t(Math.round((scannedProduct.protein * servingsCount) * 10) / 10)}{t("g ")}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{t("macros")}</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center shadow-2xs">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">{t("Carbs")}</span>
                  <span className="text-base font-extrabold text-amber-950 mt-0.5 block font-mono">
                    {t(Math.round((scannedProduct.carbs * servingsCount) * 10) / 10)}{t("g ")}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{t("macros")}</span>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-center shadow-2xs">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block">{t("Fat")}</span>
                  <span className="text-base font-extrabold text-blue-950 mt-0.5 block font-mono">
                    {t(Math.round((scannedProduct.fat * servingsCount) * 10) / 10)}{t("g ")}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{t("macros")}</span>
                </div>
              </div>

              {t(scannedProduct.ingredients && <p className="text-xs text-slate-500 leading-relaxed font-medium"><span className="font-bold text-slate-700">{t("Ingredients: ")}</span>{t(scannedProduct.ingredients)}</p>)}
              {/* Servings Adjuster & Meal Selector */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t("Portion / Servings")}</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setServingsCount(Math.max(0.25, servingsCount - 0.25))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center text-sm shadow-2xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      value={servingsCount}
                      onChange={(e) => setServingsCount(parseFloat(e.target.value) || 1)}
                      className="w-full text-center bg-transparent text-slate-900 font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setServingsCount(servingsCount + 0.25)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center text-sm shadow-2xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t("Add to Meal")}</label>
                  <select
                    value={selectedMeal}
                    onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:border-teal-500 shadow-2xs capitalize cursor-pointer"
                  >
                    <option value="breakfast">{t("🍳 Breakfast")}</option>
                    <option value="lunch">{t("🥗 Lunch")}</option>
                    <option value="dinner">{t("🥩 Dinner")}</option>
                    <option value="snack">{t("🍎 Snack")}</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScannedProduct(null);
                    setScanMode('camera');
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
                >{t("Scan Another")}</button>
                <button
                  id="btn-confirm-log-scanned-food"
                  type="button"
                  onClick={handleLogScannedProduct}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("Log to ")}{t(selectedMeal.toUpperCase())}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
