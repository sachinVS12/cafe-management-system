const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "upi"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    cardDetails: {
      cardType: String,
      lastFourDigits: String,
      cardHolderName: String,
    },
    upiDetails: {
      upiId: String,
      transactionRef: String,
    },
    cashDetails: {
      amountReceived: Number,
      amountReturned: Number,
      receivedBy: String,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
      unique: true,
    },
    notes: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  },
);

// Generate receipt number before saving
paymentSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await this.constructor.countDocuments();
    this.receiptNumber = `RCP-${year}${month}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
