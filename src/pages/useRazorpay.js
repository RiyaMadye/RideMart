import { useEffect, useState } from 'react';

// Single promise to track global script loading state
let scriptLoadingPromise = null;

const loadRazorpayScript = () => {
  const src = 'https://checkout.razorpay.com/v1/checkout.js';
  
  // 1. If already loaded, return true
  if (window.Razorpay) return Promise.resolve(true);
  
  // 2. If currently loading, return the existing promise
  if (scriptLoadingPromise) return scriptLoadingPromise;
  
  // 3. Start a new load
  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      scriptLoadingPromise = null; // Reset let it retry if failed
      resolve(false);
    };
    document.body.appendChild(script);
  });
  
  return scriptLoadingPromise;
};

const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(!!window.Razorpay);

  useEffect(() => {
    if (!isLoaded) {
      loadRazorpayScript().then(success => {
        if (success) setIsLoaded(true);
      });
    }
  }, [isLoaded]);

  const displayRazorpay = (options) => {
    if (!window.Razorpay) {
      alert('Razorpay SDK is not loaded yet. Please wait a moment or check your connection.');
      return;
    }

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Razorpay Open Error:", error);
      alert("Failed to open payment gateway. Please try again.");
    }
  };

  return displayRazorpay;
};

export default useRazorpay;