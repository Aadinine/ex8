import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// Render-ready API configuration
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [days, setDays] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    loadBookings();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error("Error loading rooms:", error);
      setMessage("Error loading rooms. Please check if server is running.");
    }
  };

  const loadBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/bookings`);
      setBookings(response.data);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setMessage("Error loading bookings.");
    }
  };

  const bookRoom = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/book`, {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        roomNumber: selectedRoom,
        days: parseInt(days)
      });

      setMessage(response.data.message);
      setGuestName("");
      setGuestPhone("");
      setSelectedRoom("");
      setDays(1);
      
      await loadRooms();
      await loadBookings();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error creating booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id, roomNumber) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/cancel`, { id, roomNumber });
      setMessage(response.data.message);
      await loadRooms();
      await loadBookings();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error cancelling booking.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    const room = rooms.find(r => r.roomNumber === selectedRoom);
    return room ? room.price * days : 0;
  };

  return (
    <div className="container-center">
      <div className="text-center mb-4 w-100">
        <h1 className="text-primary mb-2">🏨 Hotel Booking System</h1>
        <p className="text-muted">Manage your hotel room bookings</p>
      </div>

      {message && (
        <div className="alert alert-info text-center w-100 mb-4" style={{maxWidth: '600px'}}>
          {message}
        </div>
      )}

      {loading && <div className="loading-spinner"></div>}

      <div className="row w-100 justify-content-center">
        <div className="col-lg-5 col-md-6 mb-4">
          <div className="card card-center h-100">
            <div className="card-header bg-primary text-white text-center py-3">
              <h4 className="mb-0">📝 Book a Room</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={bookRoom}>
                <div className="mb-3">
                  <input type="text" placeholder="Guest Name" className="form-control form-center" value={guestName} onChange={(e) => setGuestName(e.target.value)} required disabled={loading} />
                </div>
                <div className="mb-3">
                  <input type="tel" placeholder="Phone Number" className="form-control form-center" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required disabled={loading} />
                </div>
                <div className="mb-3">
                  <select className="form-control form-center" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required disabled={loading}>
                    <option value="">Select a Room</option>
                    {rooms.filter(room => room.available).map(room => (
                      <option key={room.roomNumber} value={room.roomNumber}>Room {room.roomNumber} - {room.roomType} (₹{room.price}/night)</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <input type="number" placeholder="Number of Days" className="form-control form-center" value={days} onChange={(e) => setDays(e.target.value)} min="1" required disabled={loading} />
                </div>
                
                {selectedRoom && (
                  <div className="mb-3 p-3 bg-light rounded text-center">
                    <strong>Total Amount: ₹{calculateTotal()}</strong>
                  </div>
                )}
                
                <div className="text-center">
                  <button type="submit" className="btn btn-primary btn-lg w-100 py-3" disabled={loading}>
                    {loading ? "Booking..." : "🏨 Book Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5 col-md-6 mb-4">
          <div className="card card-center h-100">
            <div className="card-header bg-success text-white text-center py-3">
              <h4 className="mb-0">🛏️ Available Rooms</h4>
            </div>
            <div className="card-body p-4">
              {rooms.filter(room => room.available).length === 0 ? (
                <div className="text-center text-muted py-4">
                  <h5>No rooms available</h5>
                  <p>All rooms are currently booked</p>
                </div>
              ) : (
                <div className="row">
                  {rooms.filter(room => room.available).map(room => (
                    <div key={room.roomNumber} className="col-12 mb-3">
                      <div className="border rounded p-3 text-center bg-light">
                        <h5 className="text-success mb-2">Room {room.roomNumber}</h5>
                        <p className="mb-1"><strong>Type:</strong> {room.roomType}</p>
                        <p className="mb-1"><strong>Price:</strong> ₹{room.price}/night</p>
                        <span className="badge bg-success">Available</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-100 text-center mt-4">
        <div className="card card-center">
          <div className="card-header bg-warning text-dark text-center py-3">
            <h4 className="mb-0">📋 Current Bookings</h4>
          </div>
          <div className="card-body p-4">
            {bookings.length === 0 ? (
              <div className="text-center text-muted py-4">
                <h5>No bookings yet</h5>
                <p>Be the first to book a room!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-center">
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">Guest Name</th>
                      <th className="text-center">Phone</th>
                      <th className="text-center">Room No.</th>
                      <th className="text-center">Days</th>
                      <th className="text-center">Total Amount</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking, index) => (
                      <tr key={booking._id}>
                        <td className="text-center">{index + 1}</td>
                        <td className="text-center">{booking.guestName}</td>
                        <td className="text-center">{booking.guestPhone}</td>
                        <td className="text-center">{booking.roomNumber}</td>
                        <td className="text-center">{booking.days}</td>
                        <td className="text-center">₹{booking.totalAmount}</td>
                        <td className="text-center">
                          <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(booking._id, booking.roomNumber)} disabled={loading}>
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

export default App;