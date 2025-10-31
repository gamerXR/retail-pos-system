import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function DualScreenModal({ isOpen, onClose, cartItems }: DualScreenModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSlideshow, setShowSlideshow] = useState(true);

  const slideshowImages = [
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  ];

  useEffect(() => {
    if (!isOpen || !showSlideshow || cartItems.length > 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, showSlideshow, cartItems.length, slideshowImages.length]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const hasItems = cartItems.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + slideshowImages.length) % slideshowImages.length);
  };

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
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-4xl">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={slideshowImages[currentImageIndex]}
                    alt={`Slide ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
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
                    {slideshowImages.map((_, index) => (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
