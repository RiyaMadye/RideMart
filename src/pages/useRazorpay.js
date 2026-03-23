import { useEffect, useState } from 'react';

// Helper function to load an external script
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Custom hook to handle Razorpay payment integration.
 * It loads the Razorpay SDK and provides a function to display the payment modal.
 */
const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const displayRazorpay = (options) => {
    if (!isLoaded) {
      alert('Razorpay SDK is not loaded yet.');
      return;
    }

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return displayRazorpay;
};

export default useRazorpay;