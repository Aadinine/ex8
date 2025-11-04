const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Replace the MongoDB connection line with:
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hotel_simple";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));


// Schemas
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  price: { type: Number, required: true },
  available: { type: Boolean, default: true }
});

const bookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestPhone: { type: String, required: true },
  roomNumber: { type: String, required: true },
  days: { type: Number, required: true },
  totalAmount: { type: Number, required: true }
}, { timestamps: true });

// Models
const Room = mongoose.model("Room", roomSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// Initialize sample data
const initializeData = async () => {
  try {
    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      await Room.insertMany([
        { roomNumber: "101", roomType: "Single", price: 1000, available: true },
        { roomNumber: "102", roomType: "Double", price: 1500, available: true },
        { roomNumber: "103", roomType: "Deluxe", price: 2000, available: true }
      ]);
      console.log("✅ Sample room data initialized");
    }
  } catch (error) {
    console.log("❌ Error initializing data:", error);
  }
};

// API Routes

// Get all rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error: error.message });
  }
});

// Get all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
});

// Create new booking
app.post("/api/book", async (req, res) => {
  try {
    const { guestName, guestPhone, roomNumber, days } = req.body;

    if (!guestName || !guestPhone || !roomNumber || !days) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const room = await Room.findOne({ roomNumber });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.available) {
      return res.status(400).json({ message: "Room is not available" });
    }

    const totalAmount = room.price * parseInt(days);

    const newBooking = new Booking({
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      roomNumber,
      days: parseInt(days),
      totalAmount
    });

    await newBooking.save();
    room.available = false;
    await room.save();

    res.status(201).json({ 
      message: "Booking Successful!", 
      booking: newBooking 
    });

  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
});

// Cancel booking
app.post("/api/cancel", async (req, res) => {
  try {
    const { id, roomNumber } = req.body;

    if (!id || !roomNumber) {
      return res.status(400).json({ message: "Booking ID and room number are required" });
    }

    const deletedBooking = await Booking.findByIdAndDelete(id);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await Room.findOneAndUpdate(
      { roomNumber },
      { available: true }
    );

    res.json({ message: "Booking Cancelled Successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running", 
    timestamp: new Date().toISOString() 
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Hotel Booking API Server", 
    endpoints: {
      rooms: "GET /api/rooms",
      bookings: "GET /api/bookings",
      book: "POST /api/book",
      cancel: "POST /api/cancel",
      health: "GET /health"
    }
  });
});

// Initialize data
initializeData();

// Update port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
