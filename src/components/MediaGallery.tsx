import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaGalleryProps {
  mediaUrls: string[];
}

export default function MediaGallery({ mediaUrls }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (mediaUrls.length === 0) {
    return null;
  }

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|mov)(\?|$)/i);
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {mediaUrls.map((url, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group cursor-pointer"
            onClick={() => setSelectedIndex(index)}
          >
            {isVideo(url) ? (
              <div className="relative w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <video
                  src={url}
                  className="w-full h-48 object-cover rounded-lg"
                  crossOrigin="anonymous"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onError={(e) => {
                    console.error('Failed to load image:', url);
                    // Show a placeholder with error icon
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-48 flex flex-col items-center justify-center bg-gray-200 rounded-lg">
                          <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="text-sm text-gray-500">Image unavailable</span>
                        </div>
                      `;
                    }
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s' }}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-4xl max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(mediaUrls[selectedIndex]) ? (
                <video
                  src={mediaUrls[selectedIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] rounded-lg"
                  crossOrigin="anonymous"
                />
              ) : (
                <img
                  src={mediaUrls[selectedIndex]}
                  alt={`Attachment ${selectedIndex + 1}`}
                  className="max-w-full max-h-[90vh] rounded-lg"
                  crossOrigin="anonymous"
                />
              )}
              
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                ×
              </button>

              {/* Navigation */}
              {mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex((selectedIndex - 1 + mediaUrls.length) % mediaUrls.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex((selectedIndex + 1) % mediaUrls.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    →
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
