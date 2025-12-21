# OCR Implementation Guide

## Overview

CaptureAI now includes Optical Character Recognition (OCR) using Tesseract.js to extract text from captured images. This enhancement **dramatically reduces token usage** by sending extracted text **instead of** images to the AI model for normal captures.

**Key Behavior:**
- **Normal Captures (Answer/Auto-Solve)**: Only OCR text is sent to AI (no image data)
- **Ask Mode**: Both image data AND OCR text are sent for maximum context

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Image Capture Flow                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
              Screenshot → Crop → Compress → OCR Extract
                                                  ↓
                        ┌─────────────────────────┴───────────────────┐
                        │                                             │
                 Normal Capture                              Ask Mode
                 (Answer/Auto-Solve)                     (with attachment)
                        │                                             │
                   OCR Text ONLY                        OCR Text + Image Data
                        │                                             │
                        └─────────────────────────┬─────────────────┘
                                                  ↓
                                    Backend API (Cloudflare Workers)
                                                  ↓
                                    OpenAI API (via AI Gateway)
```

### Components Modified

#### 1. **libs/tesseract/** (NEW)
- `tesseract.min.js` - Core Tesseract.js library
- `worker.min.js` - Web Worker for OCR processing
- `lang-data/eng.traineddata.gz` - English language training data (11MB)

#### 2. **modules/ocr-service.js** (NEW)
Singleton service that manages Tesseract worker:
- `initialize()` - Creates and configures Tesseract worker
- `extractText(imageDataUrl)` - Performs OCR on image, returns text + confidence
- `isValidOCRResult(ocrResult)` - Validates OCR quality (>30% confidence)
- `preprocessImage(imageDataUrl)` - Optional grayscale/contrast enhancement
- `terminate()` - Cleanup worker resources

#### 3. **modules/image-processing.js** (MODIFIED)
Updated `captureAndProcess()` function:
- Added `enableOCR` option (default: true)
- Performs OCR extraction after compression
- Returns `ocrData` object with:
  - `text` - Extracted text string
  - `confidence` - OCR confidence percentage
  - `hasValidText` - Boolean indicating quality
  - `duration` - OCR processing time in ms

#### 4. **background.js** (MODIFIED)
Updated message handlers to pass OCR data:
- `handleCaptureArea()` - Includes `ocrData` in response
- `handleAskQuestion()` - Accepts `ocrData` parameter
- `sendToOpenAI()` - Sends `ocrText` and `ocrConfidence` to backend

#### 5. **modules/ui-components.js** (MODIFIED)
Ask Mode updated to handle OCR:
- `setAttachedImage(imageData, ocrData)` - Stores both image and OCR data
- `handleAskModeQuestion()` - Passes OCR data to backend
- OCR data stored in `this.attachedOCRData`

#### 6. **modules/ui-core.js** (MODIFIED)
- `handleAskQuestion(question, imageData, ocrData)` - Sends OCR data in message

#### 7. **modules/messaging.js** (MODIFIED)
- Updated `setAskModeImage` handler to pass OCR data to UI components

#### 8. **manifest.json** (MODIFIED)
Added to `web_accessible_resources`:
- `modules/ocr-service.js`
- `libs/tesseract/tesseract.min.js`
- `libs/tesseract/worker.min.js`
- `libs/tesseract/lang-data/eng.traineddata.gz`

#### 9. **cloudflare-workers-backend/src/ai.js** (MODIFIED)
Backend now handles OCR data:
- `complete()` - Accepts `ocrText` and `ocrConfidence` parameters
- `buildPayload()` - Enhances prompts with extracted OCR text
- Appends OCR text to prompts: `"Extracted text from image (85% confidence): [text here]"`

### Data Flow

#### Normal Capture Mode (Answer/Auto-Solve)
```javascript
// Frontend (content script)
1. User captures image
2. Image compressed → OCR performed
3. Result: { compressedImageData, ocrData: { text, confidence, hasValidText } }
4. Sent to background.js

// Backend (background.js)
5. aiData = {
     imageData: null,  // ← IMAGE NOT SENT for normal captures
     ocrText: "extracted text",
     ocrConfidence: 85
   }
6. Sent to Cloudflare Workers backend

// Cloudflare Workers
7. Builds text-only prompt: "Reply with answer only.\n\nExtracted text (85%): ..."
8. Sends to OpenAI as TEXT-ONLY request (massive token savings!)
9. Returns answer
```

#### Ask Mode (with Image)
```javascript
// Frontend
1. User clicks "Attach Image"
2. Captures → Compresses → OCR
3. Image + OCR data stored in UIComponents
4. User types question: "What does this say?"
5. Question + imageData + ocrData sent to backend

// Backend Enhancement
6. aiData = {
     imageData: "data:image/jpeg;base64,...",  // ← IMAGE IS SENT in Ask Mode
     ocrText: "Hello World",
     ocrConfidence: 92
   }
7. Prompt becomes: "What does this say?\n\nExtracted text (92%): Hello World"
8. AI receives BOTH visual AND text context (image + OCR)
9. Better accuracy, visual confirmation available
```

### Benefits

1. **Massive Token Reduction**: OCR text is ~99% smaller than base64 image data
   - Example: 800x600 image = ~500KB base64 → 200 character OCR text = ~200 bytes
   - Normal captures now use TEXT-ONLY API calls (much cheaper!)
2. **Cost Savings**: Text-only requests cost significantly less than vision API calls
3. **Faster Processing**: Text-based inference is faster than image processing
4. **Smart Mode Selection**:
   - Normal captures = OCR only (maximum efficiency)
   - Ask Mode = Image + OCR (maximum accuracy when user needs it)
5. **Offline OCR**: Tesseract runs client-side, no external API calls for text extraction

### Performance

- **OCR Speed**: ~200-800ms depending on image size/complexity
- **File Size Impact**: +11MB for language data (one-time download)
- **Memory Usage**: Worker initialized once, reused for all OCR operations
- **Accuracy**: 30%+ confidence threshold ensures quality

### Configuration Options

#### Disable OCR for Specific Capture
```javascript
// In image-processing.js
const result = await ImageProcessing.captureAndProcess(imageUri, coordinates, {
  enableOCR: false  // Skip OCR extraction
});
```

#### Adjust Confidence Threshold
```javascript
// In ocr-service.js
isValidOCRResult(ocrResult) {
  const hasConfidence = ocrResult.confidence >= 30;  // Change threshold here
  return hasText && hasConfidence;
}
```

### Troubleshooting

#### OCR Not Working
1. Check console for initialization errors
2. Verify Tesseract files are accessible via `chrome.runtime.getURL()`
3. Ensure manifest.json includes all Tesseract resources
4. Check browser console for worker errors

#### Low Accuracy
1. Consider using `preprocessImage()` for better contrast
2. Ensure image quality is sufficient (not too compressed)
3. Check OCR confidence score in console logs
4. Some fonts/handwriting may not be recognized well

#### Performance Issues
1. OCR runs in web worker (non-blocking)
2. Worker is initialized once and reused
3. Consider disabling OCR for very large images
4. Language data is cached after first load

### Future Enhancements

Potential improvements:
- [ ] Add option to use OCR-only mode (skip image sending entirely)
- [ ] Support multiple languages
- [ ] Implement image preprocessing UI toggle
- [ ] Add OCR confidence indicator in UI
- [ ] Cache OCR results to avoid re-processing
- [ ] Allow manual OCR text editing before submission

## Testing

### Manual Testing Steps

1. **Load extension** in Chrome
2. **Capture text-heavy screenshot** (e.g., article, question)
3. **Check console** for OCR logs:
   ```
   OCR Progress: 100%
   OCR completed in 450ms
   Extracted text (234 chars): [preview]
   Confidence: 87.3%
   ```
4. **Verify backend receives OCR data** in network tab
5. **Compare answer quality** with/without OCR

### Test Cases

- [ ] Text-only image (high confidence expected)
- [ ] Mixed text/image content
- [ ] Low quality/blurry text
- [ ] Non-English characters
- [ ] Ask mode with image attachment
- [ ] Normal capture mode (answer/auto-solve)

## Migration Notes

### Upgrading from Previous Version

1. **Extension size increases** by ~11MB (language data)
2. **First load slower** as Tesseract initializes
3. **Subsequent requests faster** due to worker reuse
4. **Backward compatible** - OCR is optional, images still work
5. **No breaking changes** to existing functionality

### Backend Compatibility

The backend gracefully handles both:
- Old requests (no OCR data)
- New requests (with OCR data)

OCR data is optional in all API endpoints.

## Conclusion

The OCR implementation enhances CaptureAI by:
- Reducing API costs (fewer image tokens)
- Improving answer accuracy (dual context)
- Enabling text-only processing when sufficient
- Maintaining full backward compatibility

All changes are non-breaking and the feature degrades gracefully if OCR fails.
