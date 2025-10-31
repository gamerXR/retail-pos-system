import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Upload, Trash2, Image as ImageIcon, Video } from "lucide-react";
import type { Product } from "~backend/pos/products";

interface CartItem {
  product: Product;
  quantity: number;
}

interface DualScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

const DEFAULT_IMAGES: MediaItem[] = [
  { id: "default-1", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80", type: "image" },
  { id: "default-2", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", type: "image" },
  { id: "default-3", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80", type: "image" },
  { id: "default-4", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", type: "image" },
];

export default function DualScreenModal({ isOpen, onClose, cartItems }: DualScreenModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [customMedia, setCustomMedia] = useState<MediaItem[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dualScreenMedia");
    if (saved) {
      try {
        setCustomMedia(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load saved media:", error);
      }
    }
  }, []);

  const allMedia = [...customMedia, ...DEFAULT_IMAGES];

  useEffect(() => {
    if (!isOpen || cartItems.length > 0 || allMedia.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allMedia.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, cartItems.length, allMedia.length]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasItems = cartItems.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newMedia: MediaItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const mediaItem: MediaItem = {
          id: `custom-${Date.now()}-${i}`,
          url,
          type: isImage ? "image" : "video",
        };
        
        setCustomMedia((prev) => {
          const updated = [...prev, mediaItem];
          localStorage.setItem("dualScreenMedia", JSON.stringify(updated));
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }

    event.target.value = "";
  };

  const handleDeleteMedia = (id: string) => {
    setCustomMedia((prev) => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem("dualScreenMedia", JSON.stringify(updated));
      
      if (currentImageIndex >= updated.length + DEFAULT_IMAGES.length) {
        setCurrentImageIndex(0);
      }
      
      return updated;
    });
  };

  const currentMedia = allMedia[currentImageIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-screen h-screen w-screen p-0 bg-gradient-to-br from-blue-50 to-purple-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white"
        >
          <X className="w-5 h-5" />
        </Button>

        {!hasItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="absolute top-4 left-4 z-50 bg-white/80 hover:bg-white gap-2"
          >
            <Upload className="w-5 h-5" />
            Manage Media
          </Button>
        )}

        <div className="h-full flex flex-col p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-2">Welcome!</h1>
            <p className="text-2xl text-gray-600">Thank you for shopping with us</p>
          </div>

          {hasItems ? (
            <div className="flex-1 flex flex-col">
              <div className="bg-white rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <div className="grid grid-cols-12 gap-4 text-lg font-semibold">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {cartItems.map((item, index) => {
                      const itemTotal = item.product.price * item.quantity;
                      return (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md border border-gray-200"
                        >
                          <div className="col-span-6">
                            <div className="text-2xl font-semibold text-gray-800">
                              {item.product.name}
                            </div>
                            {item.product.secondName && (
                              <div className="text-xl text-gray-500 mt-1">
                                {item.product.secondName}
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 text-center text-3xl font-bold text-blue-600">
                            {item.quantity}
                          </div>
                          <div className="col-span-2 text-right text-2xl font-semibold text-gray-700">
                            ${item.product.price.toFixed(2)}
                          </div>
                          <div className="col-span-2 text-right text-3xl font-bold text-purple-600">
                            ${itemTotal.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">SUBTOTAL</span>
                    <span className="text-5xl font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex gap-4">
              {showUploadPanel && (
                <div className="w-80 bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Media Library</h3>
                  
                  <div className="mb-4">
                    <input
                      type="file"
                      id="media-upload"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="media-upload"
                      className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-medium">Upload Images/Videos</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    {customMedia.map((media) => (
                      <div
                        key={media.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                      >
                        {media.type === "image" ? (
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">
                            {media.type === "image" ? "Image" : "Video"}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedia(media.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {customMedia.length === 0 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      No custom media uploaded yet
                    </p>
                  )}
                </div>
              )}

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-4xl">
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black">
                    {currentMedia?.type === "video" ? (
                      <video
                        key={currentMedia.url}
                        src={currentMedia.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                      />
                    ) : (
                      <img
                        src={currentMedia?.url}
                        alt={`Slide ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allMedia.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white w-8"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <p className="text-3xl text-gray-700 font-semibold">
                      Start adding items to your cart
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
