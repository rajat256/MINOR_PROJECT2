import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { placeOrder, createRazorpayOrder, verifyRazorpayPayment } from "../services/api";
import { 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  Navigation, 
  Check
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("farmfresh_cart") || "[]"));
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("Cash on Delivery");
  
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    pincode: "",
    locality: "",
    fullAddress: "",
    city: "",
    state: "",
    landmark: "",
    type: "Home"
  });
  const [addressErrors, setAddressErrors] = useState({});

  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    // If cart is empty, redirect back to cart page
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const handleSetLocation = () => {
    setGeoLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            
            setAddress(prev => ({
              ...prev,
              fullAddress: data.display_name,
              city: data.address.city || data.address.town || "",
              state: data.address.state || "",
              pincode: data.address.postcode || "",
            }));
          } catch (err) {
            console.error("Geocoding failed", err);
          } finally {
            setGeoLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setGeoLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setGeoLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return {
      price: total,
      discounts: Math.round(total * 0.1), // Placeholder 10% discount
      delivery: total > 500 ? 0 : 40,
      total: total - Math.round(total * 0.1) + (total > 500 ? 0 : 40)
    };
  };

  const paymentOptions = [
    {
      value: "Cash on Delivery",
      title: "Cash on Delivery",
      subtitle: "Pay when you receive the product",
    },
    {
      value: "UPI",
      title: "UPI (PhonePe, GPay, Paytm)",
      subtitle: "Pay instantly using your UPI app",
    },
    {
      value: "Wallet",
      title: "Wallets",
      subtitle: "Use Paytm, Mobikwik and other wallets",
    },
    {
      value: "Credit/Debit Card",
      title: "Credit / Debit / ATM Card",
      subtitle: "Pay securely using cards",
    },
  ];

  const isDigitalPayment = selectedPayment !== "Cash on Delivery";

  const getDeliveryAddress = () => (
    `${address.fullAddress || address.locality}, ${address.city}, ${address.state} - ${address.pincode}`
  );

  const getCompactAddress = () => {
    const parts = [address.locality || address.fullAddress, address.city, address.state].filter(Boolean);
    return parts.length ? parts.join(", ") : "Address not set yet";
  };

  const validateAddress = (values) => {
    const errors = {};
    const requiredFields = ["name", "phone", "pincode", "locality", "fullAddress", "city", "state"];

    requiredFields.forEach((field) => {
      if (!String(values[field] || "").trim()) {
        errors[field] = "This field is required";
      }
    });

    if (!errors.phone && !/^\d{10}$/.test(String(values.phone).trim())) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }

    if (!errors.pincode && !/^\d{6}$/.test(String(values.pincode).trim())) {
      errors.pincode = "Enter a valid 6-digit pincode";
    }

    return errors;
  };

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setAddressErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleContinueFromAddress = () => {
    const errors = validateAddress(address);
    if (Object.keys(errors).length) {
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});
    setStep(2);
  };

  const getOrderPayload = (paymentMethod) => ({
    products: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    deliveryAddress: getDeliveryAddress(),
    paymentMethod,
    totalPrice: calculateTotal().total,
  });

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    const errors = validateAddress(address);
    if (Object.keys(errors).length) {
      setAddressErrors(errors);
      setStep(1);
      alert("Please fill all mandatory delivery address fields before placing the order.");
      return;
    }

    if (selectedPayment === "Cash on Delivery") {
      setPlacingOrder(true);
      try {
        const { data } = await placeOrder(getOrderPayload("Cash on Delivery"));
        localStorage.removeItem("farmfresh_cart");
        navigate(`/order-success/${data._id}`, {
          state: {
            paymentMethod: "Cash on Delivery",
            paymentStatus: "Pending",
          },
        });
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to place order");
      } finally {
        setPlacingOrder(false);
      }
      return;
    }

    const isRazorpayReady = await loadRazorpayScript();
    if (!isRazorpayReady) {
      alert("Unable to load payment gateway. Please try again.");
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      alert("Payment gateway key is missing. Please contact support.");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderPayload = getOrderPayload(selectedPayment);
      const { data } = await createRazorpayOrder(orderPayload);

      const options = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "FarmFresh",
        description: `Payment for ${cart.length} item(s)`,
        order_id: data.razorpayOrder.id,
        prefill: {
          name: address.name || user?.name || "",
          email: user?.email || "",
          contact: address.phone || user?.phone || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyPayload = {
              ...orderPayload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const verifyResponse = await verifyRazorpayPayment(verifyPayload);
            localStorage.removeItem("farmfresh_cart");

            navigate(`/order-success/${verifyResponse.data._id}`, {
              state: {
                paymentMethod: selectedPayment,
                paymentStatus: "Completed",
              },
            });
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setPlacingOrder(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", () => {
        alert("Payment failed. Please try another payment method.");
        setPlacingOrder(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to initiate payment");
      setPlacingOrder(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  const stats = calculateTotal();

  return (
    <div className="page-bg min-h-screen pb-12">
      {/* Header Stepper (Flipkart Style) */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20 py-4">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between relative">
            
            {/* Step 1: Address */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step > 1 ? "bg-blue-100 border-blue-600 text-blue-600" : 
                step === 1 ? "bg-blue-600 border-blue-600 text-white" : 
                "border-gray-300 text-gray-400"
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className={`text-[12px] font-bold mt-2 transition-all duration-300 ${
                step === 1 ? "text-gray-900" : "text-gray-400"
              }`}>Address</span>
            </div>

            {/* Line 1 */}
            <div className="flex-1 h-0.5 -mt-6">
              <div className={`h-full transition-all duration-500 ${step > 1 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            </div>

            {/* Step 2: Order Summary */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step > 2 ? "bg-blue-100 border-blue-600 text-blue-600" : 
                step === 2 ? "bg-blue-600 border-blue-600 text-white" : 
                "border-gray-300 text-gray-400"
              }`}>
                {step > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <span className={`text-[12px] font-bold mt-2 transition-all duration-300 ${
                step === 2 ? "text-gray-900" : "text-gray-400"
              }`}>Order Summary</span>
            </div>

            {/* Line 2 */}
            <div className="flex-1 h-0.5 -mt-6">
              <div className={`h-full transition-all duration-500 ${step > 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            </div>

            {/* Step 3: Payment */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step === 3 ? "bg-blue-600 border-blue-600 text-white" : 
                "border-gray-300 text-gray-400"
              }`}>
                3
              </div>
              <span className={`text-[12px] font-bold mt-2 transition-all duration-300 ${
                step === 3 ? "text-gray-900" : "text-gray-400"
              }`}>Payment</span>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
                  <span className="bg-white text-blue-700 w-5 h-5 flex items-center justify-center rounded-sm text-xs font-bold">1</span>
                  <h2 className="font-semibold uppercase tracking-wider text-sm">Delivery Address</h2>
                </div>
                
                <div className="p-6">
                  {/* Location Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Navigation className="text-blue-600 w-5 h-5" />
                      <div>
                        <p className="text-blue-900 font-medium text-sm">Help us reach you faster</p>
                        <p className="text-blue-700 text-xs mt-0.5">Please set exact location on map</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSetLocation}
                      disabled={geoLoading}
                      className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded text-xs font-bold uppercase shadow-sm hover:shadow active:translate-y-0.5 transition flex items-center gap-2"
                    >
                      {geoLoading ? <Loader2 className="animate-spin w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      Set Location
                    </button>
                  </div>

                  <form className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Name</label>
                        <input 
                          type="text" 
                          value={address.name}
                          onChange={(e) => handleAddressChange("name", e.target.value)}
                          required
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.name ? "border-red-400" : ""}`}
                          placeholder="Name" 
                        />
                        {addressErrors.name && <p className="text-red-600 text-xs mt-1">{addressErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">10-digit mobile number</label>
                        <input 
                          type="text" 
                          value={address.phone}
                          onChange={(e) => handleAddressChange("phone", e.target.value)}
                          required
                          inputMode="numeric"
                          maxLength={10}
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.phone ? "border-red-400" : ""}`}
                          placeholder="Mobile Number" 
                        />
                        {addressErrors.phone && <p className="text-red-600 text-xs mt-1">{addressErrors.phone}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Pincode</label>
                        <input 
                          type="text" 
                          value={address.pincode}
                          onChange={(e) => handleAddressChange("pincode", e.target.value)}
                          required
                          inputMode="numeric"
                          maxLength={6}
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.pincode ? "border-red-400" : ""}`}
                          placeholder="Pincode" 
                        />
                        {addressErrors.pincode && <p className="text-red-600 text-xs mt-1">{addressErrors.pincode}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Locality</label>
                        <input 
                          type="text" 
                          value={address.locality}
                          onChange={(e) => handleAddressChange("locality", e.target.value)}
                          required
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.locality ? "border-red-400" : ""}`}
                          placeholder="Locality" 
                        />
                        {addressErrors.locality && <p className="text-red-600 text-xs mt-1">{addressErrors.locality}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Address (Area and Street)</label>
                      <textarea 
                        rows="3"
                        value={address.fullAddress}
                        onChange={(e) => handleAddressChange("fullAddress", e.target.value)}
                        required
                          className={`w-full border p-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm resize-none ${addressErrors.fullAddress ? "border-red-400" : ""}`}
                        placeholder="Address"
                      ></textarea>
                      {addressErrors.fullAddress && <p className="text-red-600 text-xs mt-1">{addressErrors.fullAddress}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">City/District/Town</label>
                        <input 
                          type="text" 
                          value={address.city}
                          onChange={(e) => handleAddressChange("city", e.target.value)}
                          required
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.city ? "border-red-400" : ""}`}
                          placeholder="City/District/Town" 
                        />
                        {addressErrors.city && <p className="text-red-600 text-xs mt-1">{addressErrors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">State</label>
                        <input 
                          type="text" 
                          value={address.state}
                          onChange={(e) => handleAddressChange("state", e.target.value)}
                          required
                          className={`w-full border p-3 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${addressErrors.state ? "border-red-400" : ""}`}
                          placeholder="State" 
                        />
                        {addressErrors.state && <p className="text-red-600 text-xs mt-1">{addressErrors.state}</p>}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={handleContinueFromAddress}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-10 py-3 rounded-xl shadow font-bold text-sm uppercase tracking-wide transition active:translate-y-0.5"
                      >
                        Save and Deliver Here
                      </button>
                      <button 
                        type="button"
                        className="text-gray-600 font-medium text-sm hover:text-blue-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Step 2: Order Summary */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
                  <span className="bg-white text-blue-700 w-5 h-5 flex items-center justify-center rounded-sm text-xs font-bold">2</span>
                  <h2 className="font-semibold uppercase tracking-wider text-sm">Order Summary</h2>
                </div>
                
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.productId} className="p-6 flex gap-6">
                      <div className="w-24 h-24 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 border border-slate-200">
                        <img 
                          src={item.image?.startsWith('http') ? item.image : item.image ? `http://localhost:5000${item.image}` : 'https://placehold.co/120x120/f1f5f9/64748b?text=Veg'} 
                          alt={item.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-800 font-medium line-clamp-2">{item.name}</h3>
                        <p className="text-gray-500 text-xs mt-1">Farmer: {item.farmerName || "Organic Farmer"}</p>
                        <p className="text-gray-500 text-xs mt-1 italic">Organic Certified</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <button className="border rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition">-</button>
                            <span className="px-3 border rounded text-xs font-bold py-1">{item.quantity}</span>
                            <button className="border rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition">+</button>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-extrabold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                            <span className="text-gray-400 text-xs line-through">{formatCurrency(Math.round(item.price * item.quantity * 1.2))}</span>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">20% off</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        Delivery by {new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-white flex items-center justify-between border-t shadow-[0_-4px_10px_-4px_rgba(15,23,42,0.1)] sticky bottom-0">
                  <p className="text-xs text-gray-600">Order confirmation email will be sent to <b>{user?.email}</b></p>
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-10 py-3 rounded-xl shadow font-bold text-sm uppercase tracking-wide transition active:translate-y-0.5"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
                  <span className="bg-white text-blue-700 w-5 h-5 flex items-center justify-center rounded-sm text-xs font-bold">3</span>
                  <h2 className="font-semibold uppercase tracking-wider text-sm">Payment Options</h2>
                </div>
                
                <div className="p-0">
                  <div className="divide-y">
                    {paymentOptions.map((option) => {
                      const isActive = selectedPayment === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedPayment(option.value)}
                          className={`w-full p-6 text-left flex items-center gap-4 transition ${
                            isActive ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isActive ? "border-blue-600" : "border-gray-300"
                            }`}
                          >
                            {isActive ? <div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <CreditCard className="text-gray-400 w-5 h-5" />
                            <div>
                              <p className="text-gray-800 font-bold text-sm">{option.title}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{option.subtitle}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-6 bg-white border-t">
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={placingOrder}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white w-64 py-3 rounded-xl shadow font-bold text-sm uppercase tracking-wide transition active:translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      {placingOrder ? <Loader2 className="animate-spin w-5 h-5" /> : isDigitalPayment ? "Pay Now" : "Confirm Order"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Inactive steps markers */}
            {step !== 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-blue-600 w-5 h-5" />
                  <span className="uppercase text-gray-500 font-bold text-xs tracking-wider">Delivery Address</span>
                  <span className="text-gray-900 text-sm font-medium ml-4 truncate max-w-sm">{address.name || "Customer"}, {getCompactAddress()}</span>
                </div>
                <button onClick={() => setStep(1)} className="text-blue-600 font-bold text-xs uppercase border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition">Change</button>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-blue-600 w-5 h-5" />
                  <span className="uppercase text-gray-500 font-bold text-xs tracking-wider">Order Summary</span>
                  <span className="text-gray-900 text-sm font-medium ml-4">{cart.length} Item(s)</span>
                </div>
                <button onClick={() => setStep(2)} className="text-blue-600 font-bold text-xs uppercase border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition">Change</button>
              </div>
            )}

          </div>

          {/* Sidebar: Price Details */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
                <h2 className="text-slate-600 font-bold uppercase text-sm tracking-wider">Price Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800">Price ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(stats.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800">Special Price</span>
                  <span className="text-green-600 font-medium">-{formatCurrency(stats.discounts)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800">Delivery Charges</span>
                  <span className={stats.delivery === 0 ? "text-green-600 font-medium" : "text-gray-900 font-medium"}>
                    {stats.delivery === 0 ? "FREE" : formatCurrency(stats.delivery)}
                  </span>
                </div>
                
                <div className="border-t border-dashed pt-4 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-lg font-extrabold text-gray-900">{formatCurrency(stats.total)}</span>
                </div>
                
                <div className="pt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-emerald-700 font-bold text-sm">You will save {formatCurrency(stats.discounts)} on this order</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t rounded-b flex items-center gap-2">
                <ShieldCheck className="text-slate-400 w-8 h-8" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Safe and secure payments. Easy returns. 100% authentic products.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default Checkout;
