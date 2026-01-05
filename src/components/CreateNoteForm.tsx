import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserTimezone } from '../utils/helpers';
import { validateMessage, validateFile, validateUnlockTime } from '../utils/validation';
import type { UploadedFile } from '../types';
import { getFileType } from '../utils/validation';

interface CreateNoteFormProps {
  onSubmit: (data: {
    message: string;
    unlockTime: Date;
    files: File[];
    timezone: string;
  }) => void;
  loading: boolean;
}

export default function CreateNoteForm({ onSubmit, loading }: CreateNoteFormProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [unlockMode, setUnlockMode] = useState<'countdown' | 'datetime'>('countdown');
  const [countdownDays, setCountdownDays] = useState(0);
  const [countdownHours, setCountdownHours] = useState(1);
  const [unlockDateTime, setUnlockDateTime] = useState('');
  const [error, setError] = useState('');
  const timezone = getUserTimezone();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: UploadedFile[] = [];
    
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        continue;
      }
      
      const preview = URL.createObjectURL(file);
      const type = getFileType(file);
      
      if (type !== 'unknown') {
        validFiles.push({ file, preview, type });
      }
    }
    
    setFiles(prev => [...prev, ...validFiles]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate message
    const messageValidation = validateMessage(message);
    if (!messageValidation.isValid) {
      setError(messageValidation.error || 'Invalid message');
      return;
    }

    // Calculate unlock time
    let unlockTime: Date;
    if (unlockMode === 'countdown') {
      const totalHours = countdownDays * 24 + countdownHours;
      unlockTime = new Date(Date.now() + totalHours * 60 * 60 * 1000);
    } else {
      if (!unlockDateTime) {
        setError('Please select an unlock date and time');
        return;
      }
      unlockTime = new Date(unlockDateTime);
    }

    // Validate unlock time
    const timeValidation = validateUnlockTime(unlockTime);
    if (!timeValidation.isValid) {
      setError(timeValidation.error || 'Invalid unlock time');
      return;
    }

    onSubmit({
      message,
      unlockTime,
      files: files.map(f => f.file),
      timezone,
    });
  };

  const charCount = message.length;
  const maxChars = 5000;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Message Input */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
          Your Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your time-locked message here..."
          className="input-field min-h-[200px] resize-y"
          disabled={loading}
          maxLength={maxChars}
        />
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-gray-500">
            {charCount} / {maxChars} characters
          </span>
          {charCount > maxChars * 0.9 && (
            <span className="text-orange-500 font-medium">
              {maxChars - charCount} characters remaining
            </span>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Attachments (Optional)
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-gray-600">
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="font-medium">Drag & drop images or videos</p>
                <p className="text-sm mt-1">or click to browse</p>
                <p className="text-xs mt-2 text-gray-500">Max 10MB per file</p>
              </>
            )}
          </div>
        </div>

        {/* File Previews */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"
            >
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative group"
                >
                  {file.type === 'image' ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={file.preview}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {file.file.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unlock Time Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          When should this note unlock?
        </label>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setUnlockMode('countdown')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              unlockMode === 'countdown'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Countdown
          </button>
          <button
            type="button"
            onClick={() => setUnlockMode('datetime')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              unlockMode === 'datetime'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Specific Date/Time
          </button>
        </div>

        {unlockMode === 'countdown' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="days" className="block text-sm text-gray-600 mb-1">
                Days
              </label>
              <input
                id="days"
                type="number"
                min="0"
                max="365"
                value={countdownDays}
                onChange={(e) => setCountdownDays(parseInt(e.target.value) || 0)}
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="hours" className="block text-sm text-gray-600 mb-1">
                Hours
              </label>
              <input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={countdownHours}
                onChange={(e) => setCountdownHours(parseInt(e.target.value) || 0)}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div>
            <input
              type="datetime-local"
              value={unlockDateTime}
              onChange={(e) => setUnlockDateTime(e.target.value)}
              className="input-field"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Your timezone: {timezone}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Note...
          </span>
        ) : (
          'Create Note'
        )}
      </button>
    </motion.form>
  );
}
