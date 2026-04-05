import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createOrderClaim,
  createReview,
  getOrderById,
  getOrderMessages,
  postOrderMessage,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getSocket } from "../services/socket";
import OrderTimeline from "../components/orders/OrderTimeline";
import RatingSection from "../components/orders/RatingSection";

const CLAIM_TYPES = ["Damaged Product", "Wrong Item", "Missing Item", "Payment Issue", "Other"];
const TRACKING_STEPS = ["Ordered", "Confirmed", "Shipped", "Delivered"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getImageSource = (value) => {
  if (value?.startsWith("http")) return value;
  if (value) return `http://localhost:5000${value}`;
  return "https://placehold.co/120x120/f1f5f9/64748b?text=Veg";
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.$oid || value.toString?.() || "";
  return String(value);
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimType, setClaimType] = useState("Damaged Product");
  const [claimDescription, setClaimDescription] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const [showChatBox, setShowChatBox] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [toast, setToast] = useState("");
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(true);
  const [showPriceDetails, setShowPriceDetails] = useState(true);

  const cart = JSON.parse(localStorage.getItem("farmfresh_cart") || "[]");
  const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data } = await getOrderById(id);
        setOrder(data.order);
      } catch (error) {
        console.error("Failed to fetch order", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getOrderMessages(id);
        setChatMessages(data.messages || []);
      } catch (error) {
        console.error("Failed to fetch chat messages", error);
      }
    };

    fetchMessages();

    const socket = getSocket();
    socket.emit("chat:join-order", { orderId: id });

    const onMessage = (message) => {
      const messageOrderId = normalizeId(message.orderId);
      if (messageOrderId === id) {
        setChatMessages((prev) => {
          const exists = prev.some((item) => normalizeId(item._id || item.id) === normalizeId(message._id || message.id));
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [id]);

  const isCustomer = user?.role === "customer";
  const isDelivered = order?.orderStatus === "Delivered";

  const progressUpdates = useMemo(() => {
    if (!order) return [];

    if (order.orderStatus === "Cancelled") {
      return [
        {
          title: "Ordered",
          description: "Your order has been placed successfully.",
          done: true,
          timestamp: order.createdAt,
        },
        {
          title: "Cancelled",
          description: "This order has been cancelled.",
          done: true,
          timestamp: order.updatedAt,
        },
      ];
    }

    const currentIndex = TRACKING_STEPS.indexOf(order.orderStatus);

    return TRACKING_STEPS.map((step, index) => {
      const done = index <= currentIndex;
      const isCurrent = index === currentIndex;

      return {
        title: step,
        done,
        timestamp: done ? (index === 0 ? order.createdAt : isCurrent ? order.updatedAt : null) : null,
        description:
          step === "Ordered"
            ? "Your order has been placed successfully."
            : step === "Confirmed"
            ? "Farmer has confirmed and started preparation."
            : step === "Shipped"
            ? "Your order is on the way to your address."
            : "Product delivered successfully.",
      };
    });
  }, [order]);

  const pricing = useMemo(() => {
    const items = order?.products || [];
    const listingPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const specialPrice = Number(order?.totalPrice) || listingPrice;
    const fees = specialPrice > 500 ? 0 : 13;
    const total = specialPrice + fees;

    return {
      listingPrice,
      specialPrice,
      fees,
      total,
    };
  }, [order]);

  const deliveryEta = useMemo(() => {
    if (!order?.createdAt) return "ETA unavailable";
    if (order.orderStatus === "Delivered") {
      return `Delivered on ${new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })}`;
    }

    const etaDate = new Date(order.createdAt);
    etaDate.setDate(etaDate.getDate() + 3);
    return `Estimated delivery by ${etaDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })}`;
  }, [order]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();

    if (!claimDescription.trim()) {
      setClaimError("Please describe your issue before submitting.");
      return;
    }

    try {
      setClaimSubmitting(true);
      setClaimError("");

      const { data } = await createOrderClaim(id, {
        claimType,
        description: claimDescription.trim(),
      });

      setOrder((prev) => ({
        ...prev,
        claims: [...(prev?.claims || []), data.claim],
      }));

      setShowClaimModal(false);
      setClaimDescription("");
      showToast("Claim raised successfully");
    } catch (error) {
      setClaimError(error.response?.data?.message || "Failed to submit claim");
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isDelivered) {
      showToast("Rating opens after delivery");
      return;
    }

    if (!reviewComment.trim()) {
      showToast("Please add a short review comment");
      return;
    }

    if (!order?.products?.length) return;

    try {
      setReviewSubmitting(true);
      await createReview({
        orderId: order._id,
        farmerId: order.products[0].farmerId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewComment("");
      showToast("Rating submitted successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const sendChatMessage = async () => {
    const message = chatInput.trim();
    if (!message) return;

    try {
      setChatSending(true);
      const { data } = await postOrderMessage(id, message);
      const createdMessage = data?.message;

      if (createdMessage) {
        setChatMessages((prev) => {
          const exists = prev.some((item) => normalizeId(item._id || item.id) === normalizeId(createdMessage._id || createdMessage.id));
          if (exists) return prev;
          return [...prev, createdMessage];
        });
      }

      setChatInput("");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order._id);
    showToast("Order ID copied");
  };

  const handleReorder = () => {
    const existingCart = JSON.parse(localStorage.getItem("farmfresh_cart") || "[]");
    const items = order.products || [];

    const merged = [...existingCart];
    items.forEach((item) => {
      const found = merged.find((entry) => entry.productId === item.productId);
      if (found) {
        found.quantity += Number(item.quantity) || 1;
      } else {
        merged.push({
          productId: item.productId,
          name: item.productName,
          price: Number(item.price) || 0,
          image: item.productImage,
          farmerId: item.farmerId,
          quantity: Number(item.quantity) || 1,
        });
      }
    });

    localStorage.setItem("farmfresh_cart", JSON.stringify(merged));
    showToast("Items added to cart");
    navigate("/cart");
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const invoiceWindow = window.open("", "_blank", "width=900,height=700");
    if (!invoiceWindow) return;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice ${order._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            .total { margin-top: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>FarmFresh Invoice</h1>
          <p>Order ID: ${order._id}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              ${(order.products || [])
                .map(
                  (item) =>
                    `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>${formatCurrency(item.price)}</td><td>${formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
          <p class="total">Total Amount: ${formatCurrency(pricing.total)}</p>
          <script>window.print();</script>
        </body>
      </html>
    `;

    invoiceWindow.document.open();
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar cartCount={cartCount} />
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar cartCount={cartCount} />
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Order not found</h2>
            <Link to="/orders" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg pb-12">
      <Navbar cartCount={cartCount} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-5">
            {(order.products || []).map((item, idx) => (
              <article key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-slate-900 text-2xl leading-tight font-semibold">{item.productName}</h2>
                    <p className="text-slate-500 text-sm mt-1">{item.productCategory || "Fresh produce"}</p>
                    <p className="text-slate-500 text-sm mt-2">Seller: {item.farmerName || "FarmFresh Verified"}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(item.price)}</p>
                  </div>

                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                    <img
                      loading="lazy"
                      src={getImageSource(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/120x120/f1f5f9/64748b?text=Veg";
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 p-5 sm:p-6">
                  <OrderTimeline updates={progressUpdates} />
                </div>
              </article>
            ))}

            {isCustomer && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Need help with this order?
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(true)}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Raise Claim
                  </button>
                </div>

                {Array.isArray(order.claims) && order.claims.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-2">Claims</p>
                    <div className="space-y-2">
                      {order.claims.map((claim) => (
                        <Link
                          key={claim._id}
                          to={`/orders/${order._id}/claims/${claim._id}`}
                          className="block border border-slate-200 rounded-xl p-3 hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-800">{claim.claimType}</span>
                            <span className="text-cyan-700 font-semibold">{claim.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{claim.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCustomer && (
              <RatingSection
                disabled={!isDelivered}
                submitting={reviewSubmitting}
                rating={reviewRating}
                comment={reviewComment}
                onRatingChange={setReviewRating}
                onCommentChange={setReviewComment}
                onSubmit={handleReviewSubmit}
                disabledReason={!isDelivered ? "Rating is enabled once the order is delivered." : ""}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShowChatBox(true)}
                className="sm:col-span-2 w-full bg-white border border-slate-200 rounded-xl shadow-sm p-3.5 flex items-center justify-center gap-2 text-slate-800 font-medium hover:bg-slate-50"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat with farmer or buyer</span>
              </button>

              <button
                type="button"
                onClick={handleReorder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-3"
              >
                Reorder
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <span>Order #{order._id.toUpperCase()}</span>
                <button type="button" onClick={handleCopyOrderId} className="text-slate-500 hover:text-slate-700">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-2 text-cyan-700 hover:text-cyan-800 font-semibold"
              >
                <Download className="w-4 h-4" /> Download Invoice (PDF)
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full p-4 border-b bg-slate-50 flex items-center justify-between"
                onClick={() => setShowDeliveryDetails((prev) => !prev)}
              >
                <h2 className="text-slate-800 font-bold text-sm tracking-wide">Delivery details</h2>
                <ChevronDown className={`w-4 h-4 text-slate-500 xl:hidden transition-transform ${showDeliveryDetails ? "rotate-180" : ""}`} />
              </button>

              <div className={`${showDeliveryDetails ? "block" : "hidden"} xl:block p-5 space-y-4`}>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {deliveryEta}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[15px] leading-5 text-slate-900">{order.customerName || "Customer"}</span>
                        <span className="bg-slate-200/70 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Home</span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1 leading-snug">{order.deliveryAddress || "Address not available"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-[15px] text-slate-700 font-medium leading-none">{user?.phone || "Not available"}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full p-4 border-b bg-slate-50 flex items-center justify-between"
                onClick={() => setShowPriceDetails((prev) => !prev)}
              >
                <h2 className="text-slate-800 font-bold text-sm tracking-wide">Price details</h2>
                <ChevronDown className={`w-4 h-4 text-slate-500 xl:hidden transition-transform ${showPriceDetails ? "rotate-180" : ""}`} />
              </button>

              <div className={`${showPriceDetails ? "block" : "hidden"} xl:block p-5 space-y-4`}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Listing price</span>
                  <span className="text-slate-900 font-medium">{formatCurrency(pricing.listingPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    Special price <HelpCircle className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-slate-900 font-medium">{formatCurrency(pricing.specialPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total fees</span>
                  <span className="text-slate-900 font-medium">{formatCurrency(pricing.fees)}</span>
                </div>

                <div className="border-t border-dashed pt-4 flex justify-between">
                  <span className="text-base font-bold text-slate-900">Total amount</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(pricing.total)}</span>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between bg-slate-50 -mx-5 -mb-5 p-5 rounded-b">
                  <span className="text-xs text-slate-500 font-medium uppercase">Payment method</span>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{order.paymentMethod || "Unknown"}</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setShowClaimModal(false)} />

            <motion.form
              onSubmit={handleClaimSubmit}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Raise a Claim</h3>
                <button type="button" onClick={() => setShowClaimModal(false)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Claim Type</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
                  >
                    {CLAIM_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Describe Issue</label>
                  <textarea
                    rows={4}
                    value={claimDescription}
                    onChange={(e) => setClaimDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm"
                    placeholder="Tell us what happened..."
                  />
                </div>

                {claimError ? <p className="text-sm text-rose-600">{claimError}</p> : null}
              </div>

              <div className="px-5 pb-5">
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {claimSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit Claim
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {showChatBox && (
        <div className="fixed right-4 bottom-4 z-50 w-[92vw] max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-cyan-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">Order Chat</p>
                <p className="text-[11px] text-cyan-100">Real-time farmer and buyer chat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChatBox(false)}
              className="p-1 rounded hover:bg-cyan-500"
              aria-label="Close support chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-72 overflow-y-auto bg-slate-50 p-3 space-y-2">
            {chatMessages.map((msg) => (
              <div
                key={msg._id || msg.id}
                className={`flex ${normalizeId(msg.senderId) === normalizeId(user?._id) ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    normalizeId(msg.senderId) === normalizeId(user?._id)
                      ? "bg-cyan-600 text-white rounded-br-md"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <p>{msg.message || msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${normalizeId(msg.senderId) === normalizeId(user?._id) ? "text-cyan-100" : "text-slate-400"}`}
                  >
                    {msg.senderName || "User"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white flex items-center gap-2 border-t border-slate-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Type your message"
              className="flex-1 border border-slate-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              disabled={chatSending}
              className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
