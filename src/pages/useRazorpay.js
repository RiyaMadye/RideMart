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
        if (success) {
          setIsLoaded(true);
        } else {
          console.error("Razorpay SDK could not be loaded. This might be due to an ad-blocker or poor connection.");
        }
      });
    }
  }, [isLoaded]);

  const displayRazorpay = (options) => {
    if (!window.Razorpay) {
      console.error("Razorpay instance not found during payment attempt.");
      alert('Razorpay is still loading or failed to load. Please refresh the page and try again.');
      return;
    }

    if (!options.key) {
      console.error("Razorpay Key ID is missing in options.");
      alert("Configuration Error: Razorpay Key ID is missing. Please check your environment variables.");
      return;
    }

    try {
      console.log("Opening Razorpay with Key:", options.key.substring(0, 8) + "...");
      const paymentObject = new window.Razorpay(options);
      
      // Add event listener for failed payment (pre-checkout)
      paymentObject.on('payment.error', function(resp) {
        console.error("Razorpay Payment Error Object:", resp.error);
        alert(`Payment Error: ${resp.error.description}`);
      });

      paymentObject.open();
    } catch (error) {
      console.error("Critical Razorpay Open Error:", error);
      alert("Failed to initiate payment. " + error.message);
    }
  };

  return displayRazorpay;
};

export default useRazorpay;