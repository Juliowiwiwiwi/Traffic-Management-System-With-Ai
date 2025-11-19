import { useState, useEffect } from "react";
import { payFine, getViolationDetails } from "../services/api";
import upiQRCode from '../images/upi-qr.jpeg';
import './Payments.css';

function Payments() {
  const [violationID, setViolationID] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [showQR, setShowQR] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [fineAmount, setFineAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: ""
  });

  useEffect(() => {
    const fetchFineAmount = async () => {
      if (violationID) {
        try {
          setIsLoading(true);
          setError(null);
          const violation = await getViolationDetails(violationID);
          setFineAmount(violation.FineAmount);
        } catch (error) {
          console.error("Error fetching violation details:", error);
          setError("Failed to fetch violation details");
          setFineAmount(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchFineAmount, 500);
    return () => clearTimeout(debounceTimer);
  }, [violationID]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setShowQR(false);
    setShowCreditCardForm(false);
  };

  const handlePayment = async () => {
    if (!fineAmount) {
      setError("Please enter a valid Violation ID");
      return;
    }

    try {
      if (paymentMethod === "UPI") {
        setShowQR(true);
        return;
      } else if (paymentMethod === "Credit Card") {
        setShowCreditCardForm(true);
        return;
      }
      
      await payFine(violationID, paymentMethod);
      alert("Payment successful!");
    } catch (error) {
      setError("Payment failed. Please try again.");
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "cardNumber") {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    if (name === "expiryDate" && value.length === 2 && !value.includes('/')) {
      setCardDetails(prev => ({ ...prev, [name]: value + '/' }));
      return;
    }
    
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCardPayment = async () => {
    if (!cardDetails.cardNumber || !cardDetails.cardName || 
        !cardDetails.expiryDate || !cardDetails.cvv) {
      setError("Please fill all card details");
      return;
    }

    try {
      await payFine(violationID, "Credit Card", cardDetails);
      alert("Credit card payment successful!");
      setShowCreditCardForm(false);
      setCardDetails({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: ""
      });
    } catch (error) {
      setError("Credit card payment failed. Please try again.");
    }
  };

  const handleQRPaymentComplete = async () => {
    try {
      await payFine(violationID, "UPI");
      alert("UPI payment successful!");
      setShowQR(false);
    } catch (error) {
      setError("UPI payment verification failed");
    }
  };

  return (
    <div className="payments-container">
      <h2 className="payments-title">Pay Traffic Fine</h2>
      
      {showQR ? (
        <div className="qr-payment-container">
          <h3>Scan QR Code to Pay</h3>
          <img src={upiQRCode} alt="UPI QR Code" className="qr-code" />
          <div className="payment-details">
            <p className="upi-id">UPI ID: csdevanarayan@oksbi</p>
            <p className="upi-instruction">Scan to pay with any UPI app</p>
            <p className="payment-amount">Amount: ₹{fineAmount}</p>
          </div>
          <div className="payment-actions">
            <button onClick={handleQRPaymentComplete} className="confirm-btn">
              I've Paid
            </button>
            <button onClick={() => setShowQR(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      ) : showCreditCardForm ? (
        <div className="card-payment-container">
          <h3>Credit Card Payment</h3>
          <p className="payment-amount">Amount: ₹{fineAmount}</p>
          
          <div className="card-form">
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={handleCardInputChange}
                maxLength="19"
              />
            </div>
            
            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                type="text"
                name="cardName"
                placeholder="Devanarayan"
                value={cardDetails.cardName}
                onChange={handleCardInputChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={handleCardInputChange}
                  maxLength="5"
                />
              </div>
              
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="password"
                  name="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={handleCardInputChange}
                  maxLength="4"
                />
              </div>
            </div>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <div className="payment-actions">
            <button onClick={() => setShowCreditCardForm(false)} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleCardPayment} className="pay-btn">
              Pay ₹{fineAmount}
            </button>
          </div>
        </div>
      ) : (
        <div className="payment-form-container">
          <div className="form-group">
            <label>Violation ID</label>
            <input
              type="text"
              placeholder="Enter Violation ID"
              onChange={(e) => setViolationID(e.target.value)}
              value={violationID}
            />
          </div>
          
          {isLoading ? (
            <div className="loading-state">Loading violation details...</div>
          ) : (
            fineAmount && (
              <div className="amount-display">
                <p>Fine Amount: ₹{fineAmount}</p>
              </div>
            )
          )}
          
          <div className="form-group">
            <label>Payment Method</label>
            <select
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              value={paymentMethod}
            >
              <option>Credit Card</option>
              <option>UPI</option>
              <option>Net Banking</option>
            </select>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button
            onClick={handlePayment}
            className={`payment-button ${!fineAmount ? 'disabled' : ''}`}
            disabled={!fineAmount}
          >
            {paymentMethod === "Credit Card" ? "Enter Card Details" : 
             paymentMethod === "UPI" ? "Show UPI QR Code" : "Proceed to Payment"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Payments;