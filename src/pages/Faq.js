import React, { useState } from "react";
import "./Faq.css";

const faqData = [
  {
    question: "How do I buy a car on RideMart?",
    answer:
      "Browse available listings, select a car you like, and contact the seller directly through the platform to finalize the deal."
  },
  {
    question: "Is listing my car free?",
    answer:
      "Yes! Listing your car on RideMart is completely free. You can upload photos, details, and set your price."
  },
  {
    question: "What documents are required for renting a car?",
    answer:
      "You need a valid driving license, government-issued ID, and sometimes a refundable security deposit."
  },
  {
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click on 'Forgot Password'. Follow the instructions sent to your registered email."
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes, RideMart uses secure and encrypted payment systems to ensure safe transactions."
  }
];

function Faq() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <h1 className="faq-title">Frequently Asked Questions</h1>

        {faqData.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? "active" : ""}`}
          >
            <div
              className="faq-question"
              onClick={() => toggleFaq(index)}
              style={{ color: "#333" }}
            >
              {item.question}
              <span className="faq-icon">
                {activeIndex === index ? "−" : "+"}
              </span>
            </div>

            <div className="faq-answer">
              {item.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Faq;
