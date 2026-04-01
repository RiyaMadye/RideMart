import React, { useEffect } from "react";
import "./Preloader.css";

function Preloader({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="preloader">
      <div className="road">
        <div className="car">🚗</div>
      </div>
      <h2>RideMart is starting...</h2>
    </div>
  );
}

export default Preloader;
