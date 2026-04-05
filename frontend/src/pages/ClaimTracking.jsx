import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { getClaimById, updateClaimStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CLAIM_STATUSES = ["Submitted", "Under Review", "Resolved", "Rejected"];

const statusIcon = {
  Submitted: Clock3,
  "Under Review": AlertTriangle,
  Resolved: CheckCircle2,
  Rejected: XCircle,
};

const ClaimTracking = () => {
  const { id, claimId } = useParams();
  const { user } = useAuth();

  const [claim, setClaim] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextStatus, setNextStatus] = useState("Under Review");
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const { data } = await getClaimById(id, claimId);
        setClaim(data.claim);
        setOrder(data.order);
        setNextStatus(data.claim.status === "Submitted" ? "Under Review" : data.claim.status);
        setResolutionNote(data.claim.resolutionNote || "");
      } catch (error) {
        console.error("Failed to fetch claim", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id, claimId]);

  const canUpdate = user?.role === "farmer";

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await updateClaimStatus(id, claimId, {
        status: nextStatus,
        resolutionNote,
      });
      setClaim(data.claim);
      alert("Claim status updated");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update claim");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Claim not found</p>
          <Link to={`/orders/${id}`} className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Order
          </Link>
        </div>
      </div>
    );
  }

  const CurrentIcon = statusIcon[claim.status] || MessageSquareWarning;
  const activeIndex = CLAIM_STATUSES.indexOf(claim.status);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold">Claim ID</p>
              <p className="font-mono text-sm text-gray-800">{claim._id}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {claim.status}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs uppercase text-gray-500 font-semibold">Issue Type</p>
            <p className="text-gray-900 font-semibold">{claim.claimType}</p>
            <p className="text-sm text-gray-600 mt-2">{claim.description}</p>
          </div>
        </div>

        <div className="bg-white rounded border p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Claim Progress</p>
          <div className="space-y-4">
            {CLAIM_STATUSES.map((status, index) => {
              const done = index <= activeIndex;
              const Icon = statusIcon[status] || Clock3;
              return (
                <div key={status} className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${done ? "text-green-600" : "text-gray-300"}`} />
                  <span className={`text-sm ${done ? "text-gray-900 font-medium" : "text-gray-400"}`}>{status}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 bg-gray-50 rounded border">
            <div className="flex items-start gap-2">
              <CurrentIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Current status: {claim.status}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(claim.updatedAt).toLocaleString("en-IN")}
                </p>
                {claim.resolutionNote ? (
                  <p className="text-sm text-gray-700 mt-2">Resolution note: {claim.resolutionNote}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {canUpdate ? (
          <form onSubmit={handleUpdateStatus} className="bg-white rounded border p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Update Claim Status</p>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              >
                {CLAIM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Resolution Note</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                placeholder="Add details for customer"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Claim Status
            </button>
          </form>
        ) : null}

        <div className="text-sm">
          <Link to={`/orders/${id}`} className="text-blue-600 hover:underline">
            Back to Order Tracking
          </Link>
          {order?._id ? <span className="text-gray-400 ml-2">Order #{order._id.toUpperCase()}</span> : null}
        </div>
      </div>
    </div>
  );
};

export default ClaimTracking;
