import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Check,
  Sparkles,
  ImageIcon,
  Box,
  Truck,
  Layers,
  Wand2,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { CartItem } from '../types';

interface CustomPrintQuoteProps {
  onAddCustomToCart: (item: CartItem) => void;
}

type UploadType = 'image' | 'stl';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const CustomPrintQuote: React.FC<CustomPrintQuoteProps> = ({
  onAddCustomToCart,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload type: 'image' or 'stl'
  const [uploadType, setUploadType] = useState<UploadType>('image');

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Notes state
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const validateAndSetFile = (file: File, type: UploadType) => {
    setValidationError(null);

    if (type === 'image') {
      const isImage =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp)$/i.test(file.name);

      if (!isImage) {
        setFileError('Please upload a valid image file (JPG, PNG or WEBP).');
        return;
      }

      setFileError(null);
      setUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setFilePreview(objectUrl);
    } else {
      const isStl = /\.stl$/i.test(file.name);

      if (!isStl) {
        setFileError('Please upload a valid STL file (.stl).');
        return;
      }

      setFileError(null);
      setUploadedFile(file);
      setFilePreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file, uploadType);
    }
    // reset input value so re-uploading the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file, uploadType);
    }
  };

  const handleSwitchType = (newType: UploadType) => {
    if (newType === uploadType) return;
    setUploadType(newType);
    setFileError(null);
    setValidationError(null);

    // If existing uploaded file does not match new type, clear it
    if (uploadedFile) {
      const matchesNewType =
        newType === 'image'
          ? uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(uploadedFile.name)
          : /\.stl$/i.test(uploadedFile.name);

      if (!matchesNewType) {
        setUploadedFile(null);
        setFilePreview(null);
      }
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setFileError(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddToCart = () => {
    if (!uploadedFile) {
      setValidationError('Please upload your image or STL file first.');
      const el = document.getElementById('custom-upload-box');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const itemTitle =
      uploadType === 'image'
        ? `Custom 3D Print Quote (${uploadedFile.name.replace(/\.[^/.]+$/, '')})`
        : `Custom STL 3D Print Quote (${uploadedFile.name.replace(/\.[^/.]+$/, '')})`;

    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: itemTitle,
      category: 'custom-prints',
      price: 0,
      quantity: 1,
      finish: 'Custom (Specified in Notes)',
      scale: uploadType === 'image' ? 'Pending Review' : 'STL Native Dimensions',
      isCustomJob: true,
      rawFile: uploadedFile,
      src: filePreview || undefined,
      customDetails: {
        fileName: uploadedFile.name,
        tech:
          uploadType === 'image'
            ? 'Image-to-3D Conversion & Print'
            : 'Direct STL 3D Print',
        infill: 35,
        material: 'Solid PolyPrint Resin',
        dimensions:
          uploadType === 'image'
            ? 'Custom quote based on design'
            : 'Custom dimensions as per STL',
        customEngraving: specialNotes.trim() || undefined,
      },
    };

    onAddCustomToCart(customItem);
  };

  return (
    <section
      id="custom-service"
      data-section-id="custom-prints"
      className="relative py-20 px-4 sm:px-8 bg-[#fafafa] text-gray-950 border-t border-gray-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-black bg-gray-100 border border-gray-200 mb-3 shadow-2xs">
            <Sparkles size={13} className="text-amber-500" />
            <span>Custom 3D Printing Service</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-black"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            CUSTOM 3D PRINT
          </h2>

          {/* Core Reassurance */}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-emerald-700">
            <Wand2 size={16} />
            <span>Don&apos;t have a 3D file? No problem. Send us an image and we&apos;ll handle the 3D conversion.</span>
          </div>
        </div>

        {/* 4-Step Simple Customer Flow */}
        <div className="mb-12 p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">
            How It Works — Simple 4-Step Process
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  Upload Image or STL
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Send a photo, sketch, or your ready-to-print 3D .STL file.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  We Convert & Prepare
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Our studio converts flat images to 3D models or slices your STL file.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  Specify Your Preferences
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Note your preferred colour, scale, or custom engraving.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  We Print & Deliver
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Crafted in our studio and safely delivered to your doorstep.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Selling Point Banner */}
        <div className="mb-8 p-6 sm:p-8 bg-black text-white rounded-2xl shadow-sm text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Layers size={180} />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-2">
            <span className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 bg-white/10 rounded-full text-emerald-400">
              Studio Image-to-3D Service
            </span>
            <h3
              className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              YOU SEND THE IMAGE. WE TURN IT INTO 3D. WE PRINT IT FOR YOU.
            </h3>
            <p className="text-sm sm:text-base text-gray-300 font-normal">
              No 3D model required. Upload an image and we&apos;ll convert it into a printable 3D model for you.
            </p>
          </div>
        </div>

        {/* Unified Custom 3D Print Configuration Card */}
        <div
          id="custom-config-card"
          className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8"
        >
          {/* Card Title Header */}
          <div className="border-b border-gray-100 pb-5">
            <h3
              className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              CUSTOM 3D PRINT
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Configure your custom 3D print and request a personalized studio quote.
            </p>
          </div>

          {/* 1. SELECT UPLOAD TYPE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                SELECT UPLOAD TYPE
              </h4>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  uploadType === 'image'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                {uploadType === 'image' ? 'Image to 3D' : 'Direct STL Print'}
              </span>
            </div>

            {/* Upload Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-xl max-w-sm">
              <button
                type="button"
                onClick={() => handleSwitchType('image')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  uploadType === 'image'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
              >
                <ImageIcon size={14} />
                <span>IMAGE</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('stl')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  uploadType === 'stl'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
              >
                <Box size={14} />
                <span>STL FILE</span>
              </button>
            </div>

            {/* Explanation based on active selection */}
            <p className="text-xs text-gray-600 leading-relaxed">
              {uploadType === 'image'
                ? "Upload an image and we'll convert it into a printable 3D model for you."
                : "Already have a 3D model? Upload your STL file and we'll print it for you."}
            </p>
          </div>

          <div className="border-t border-gray-100" />

          {/* 2. UPLOAD YOUR FILE */}
          <div id="custom-upload-box" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                UPLOAD YOUR FILE
              </h4>
              <span className="text-xs text-gray-500">
                {uploadType === 'image' ? 'JPG, PNG or WEBP' : 'STL files only'}
              </span>
            </div>

            {/* Error notifications */}
            {fileError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{fileError}</span>
              </div>
            )}

            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 animate-pulse">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Upload Box / File Preview */}
            {!uploadedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                  validationError
                    ? 'border-red-400 bg-red-50/20'
                    : isDragging
                    ? 'border-black bg-gray-100'
                    : 'border-gray-300 bg-gray-50/50 hover:border-black hover:bg-gray-50 shadow-xs'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    uploadType === 'image'
                      ? 'image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp'
                      : '.stl,model/stl,application/sla'
                  }
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black mb-3 shadow-2xs">
                  {uploadType === 'image' ? (
                    <UploadCloud size={26} />
                  ) : (
                    <Box size={26} />
                  )}
                </div>

                <h5 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black">
                  {uploadType === 'image' ? 'UPLOAD YOUR IMAGE' : 'UPLOAD YOUR STL FILE'}
                </h5>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  {uploadType === 'image'
                    ? 'JPG, PNG or WEBP (Drag & Drop or Click)'
                    : 'STL files only (Drag & Drop or Click)'}
                </p>

                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
                >
                  {uploadType === 'image' ? 'Browse Image' : 'Browse STL File'}
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-4">
                {uploadType === 'image' && filePreview ? (
                  <div className="relative max-h-[300px] w-full rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center p-2">
                    <img
                      src={filePreview}
                      alt="Uploaded customer reference"
                      className="max-h-[280px] w-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="py-8 px-4 w-full rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-3 shadow-2xs">
                      <Box size={28} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      3D Model (.STL) Loaded
                    </span>
                    <span className="text-[11px] text-gray-500 mt-0.5">
                      Ready for precision 3D print slicing
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {uploadType === 'image' ? (
                      <ImageIcon size={22} className="text-emerald-600 shrink-0" />
                    ) : (
                      <FileText size={22} className="text-sky-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-black truncate max-w-[220px] sm:max-w-md">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatFileSize(uploadedFile.size)} •{' '}
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                          <Check size={11} />{' '}
                          {uploadType === 'image'
                            ? 'Ready for 3D conversion'
                            : 'Ready for 3D printing'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick helper tip */}
            <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <HelpCircle size={15} className="text-gray-500 shrink-0 mt-0.5" />
              <span>
                {uploadType === 'image' ? (
                  <>
                    <strong>What makes a good photo?</strong> Clear lighting and front or 3/4 angle views help our 3D designers capture the finest details.
                  </>
                ) : (
                  <>
                    <strong>STL format tip:</strong> Uploading watertight, solid .STL models ensures instant slicing and the fastest delivery timeline.
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* SPECIAL REQUESTS OR NOTES (OPTIONAL) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
              SPECIAL REQUESTS OR NOTES (OPTIONAL)
            </h4>
            <textarea
              rows={3}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Preferred colour (e.g. Black, White, Grey, Red), target height (15cm), specific pose details, or any text to carve on base..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* WHAT'S INCLUDED IN YOUR ORDER */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
              WHAT&apos;S INCLUDED IN YOUR ORDER
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600">
              <li className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>
                  {uploadType === 'image'
                    ? 'Custom 3D model sculpting from your uploaded image'
                    : 'Precision 3D slicing & print preparation from your STL file'}
                </span>
              </li>
              <li className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>High-precision solid 3D print in your preferred colour</span>
              </li>
              <li className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Pre-print preview sent to your phone/email for approval</span>
              </li>
              <li className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Truck size={14} className="text-emerald-600 shrink-0" />
                <span>Shockproof packaged pan-India delivery</span>
              </li>
            </ul>
          </div>

          {/* Quote Request & Submit Area */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold uppercase tracking-wider text-black">
                GET YOUR CUSTOM QUOTE
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Final price depends on your design, size and print requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm bg-black text-white hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>REQUEST A QUOTE →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
