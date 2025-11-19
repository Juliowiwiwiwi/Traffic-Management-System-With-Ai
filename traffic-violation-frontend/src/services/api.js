import axios from "axios";

const API_URL = "http://127.0.0.1:5000"; // Flask Backend URL

// Set up axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getVehicles = async () => {
  return await api.get("/get-vehicles");
};

export const getViolations = async (licensePlate) => {
  return await api.get(`/get-violations/${licensePlate}`);
};

export const getViolationDetails = async (violationID) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/get-violation/${violationID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch violation details');
  }
  
  return response.json();
};
export const payFine = async (violationID, paymentMethod, paymentDetails = null) => {
  const payload = {
    PaymentMethod: paymentMethod,
  };

  // Include payment details if provided (for credit card payments)
  if (paymentMethod === "Credit Card" && paymentDetails) {
    payload.PaymentDetails = {
      card_number: paymentDetails.cardNumber.replace(/\s/g, ''),
      card_holder: paymentDetails.cardName,
      expiry_date: paymentDetails.expiryDate,
      cvv: paymentDetails.cvv
    };
  }

  return await api.put(`/pay-fine/${violationID}`, payload);
};



export const registerVehicle = async (vehicleData) => {
  return await api.post("/register-vehicle", vehicleData);
};

export const addViolation = async (violationData) => {
  return await api.post("/add-violation", violationData);
};

export const login = async (username, password) => {
  return await api.post("/login", { username, password });
};

export const register = async (username, password) => {
  return await api.post("/register", { username, password });
};

// Add more API calls as needed