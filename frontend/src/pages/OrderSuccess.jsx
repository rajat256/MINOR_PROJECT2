import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, PackageCheck, ArrowRight } from "lucide-react";

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTick, setShowTick] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const paymentMethod = location.state?.paymentMethod || "Cash on Delivery";
  const paymentStatus = location.state?.paymentStatus || "Pending";

  useEffect(() => {
    const revealTimer = setTimeout(() => setShowTick(true), 250);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          navigate(`/orders/${id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(revealTimer);
      clearInterval(countdownTimer);
    };
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="relative max-w-xl w-full bg-white rounded-2xl border border-green-100 shadow-xl p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-green-100 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-100 rounded-full blur-2xl" />

        <div className="relative z-10 text-center">
          <div
            className={`mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center transition-all duration-700 ${
              showTick ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-6">Order Placed Successfully</h1>
          <p className="text-gray-600 mt-3">
            Your order is confirmed and being prepared by the farmer.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
              <p className="text-sm font-semibold text-gray-900 break-all">{id}</p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
              <p className="text-sm font-semibold text-gray-900">{paymentMethod}</p>
              <p className={`text-xs mt-1 ${paymentStatus === "Completed" ? "text-green-600" : "text-amber-600"}`}>
                {paymentStatus}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 text-sm">
            <PackageCheck className="w-4 h-4" />
            Redirecting to order tracking in {countdown}s
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              Track Order
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/products"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 border text-gray-700 px-5 py-2.5 rounded-lg font-medium text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
