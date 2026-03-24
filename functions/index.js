const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

/**
 * Creates a Razorpay Order
 */
exports.createRazorpayOrder = functions.region("asia-south1").https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { amount, currency = "INR" } = req.body;

      if (!amount) {
        return res.status(400).send("Amount is required");
      }

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      
      res.status(200).json(order);
    } catch (error) {
      console.error("Razorpay Error:", error);
      res.status(500).send(error.message || "Internal Server Error");
    }
  });
});

/**
 * Verifies Razorpay Payment Signature (Optional but recommended)
 */
exports.verifyPayment = functions.region("asia-south1").https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", functions.config().razorpay.key_secret);

    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      res.status(200).json({ status: "success" });
    } else {
      res.status(400).json({ status: "failure" });
    }
  });
});
