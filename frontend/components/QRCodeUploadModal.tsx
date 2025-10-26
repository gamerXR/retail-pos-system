import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, QrCode, X } from "lucide-react";
import backend from "~backend/client";

interface QRCodeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  onSuccess: () => void;
}

export default function QRCodeUploadModal({ isOpen, onClose, clientId, clientName, onSuccess }: QRCodeUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;

    setIsUploading(true);
    try {
      await backend.auth.uploadQRCode({
        id: clientId,
        qrCodeImage: preview,
      });

      toast({
        title: "QR Code Uploaded",
        description: "QR code has been uploaded successfully",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error uploading QR code:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload QR code",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Upload QR Payment Code for {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Upload a QR code image for payment. This will be displayed when processing Ding! payments.
          </div>

          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <label htmlFor="qr-upload" className="cursor-pointer">
                <span className="text-blue-500 hover:text-blue-600 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
              </label>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative border border-gray-300 rounded-lg p-4">
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={preview}
                alt="QR Code Preview"
                className="w-full h-auto max-h-64 object-contain mx-auto"
              />
              <div className="mt-2 text-sm text-gray-600 text-center">
                {selectedFile?.name}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!preview || isUploading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload QR Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
