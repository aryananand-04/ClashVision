'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  accept?: string;
}

export default function ImageUpload({
  onImageSelect,
  onRemove,
  maxSizeMB = 5,
  accept = 'image/*',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelect(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
  };

  return (
    <div className="w-full">
      {!preview ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-slate-700 bg-slate-900'
          } ${error ? 'border-red-500' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-800 rounded-full">
                <Upload className="h-8 w-8 text-blue-400" />
              </div>

              <div>
                <p className="text-lg font-medium text-white mb-1">
                  Drop your screenshot here
                </p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-2"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Choose Image
              </Button>

              <p className="text-xs text-gray-500">
                Max file size: {maxSizeMB}MB
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <div className="p-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
              <Button
                onClick={handleRemove}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}