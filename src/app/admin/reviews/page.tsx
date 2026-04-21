"use client";

import { useState, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageSquare,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/admin/ConfirmationModal";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved: !currentStatus }),
      });
      if (res.ok) {
        toast.success(
          !currentStatus ? "Review approved!" : "Review unapproved.",
        );
        fetchReviews();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Review deleted.");
        fetchReviews();
      } else {
        toast.error("Failed to delete review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-serif font-black text-primary-dark text-balance leading-tight">
            Product Reviews
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm">
            Manage customer reviews and ratings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-grow sm:flex-grow-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation ${
                filter === f
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.map((review, i) => (
          <motion.div
            key={review._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border-2 transition-all flex flex-col ${
              review.isApproved ? "border-green-50/50" : "border-orange-50/50"
            }`}
          >
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-base sm:text-lg shrink-0">
                  {review.user?.name?.[0] || "A"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-primary-dark text-sm sm:text-base truncate">
                    {review.user?.name || "Anonymous"}
                  </h3>
                  <div className="flex text-yellow-500 mt-0.5">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={12}
                        className={
                          index < review.rating ? "fill-current" : "opacity-20"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 shrink-0">
              <p className="text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 leading-none">
                Product
              </p>
              <div className="font-black text-primary text-xs sm:text-sm truncate">
                {review.product?.name || "Unknown Product"}
              </div>
            </div>

            <p className="text-gray-500 text-[13px] sm:text-sm mb-6 leading-relaxed italic relative font-medium line-clamp-4 flex-grow">
              <MessageSquare
                size={20}
                className="absolute -top-2 -left-3 text-gray-100 -z-10 opacity-50"
              />
              "{review.comment}"
            </p>

            <div className="flex gap-2 sm:gap-3 pt-6 border-t border-gray-50 shrink-0 mt-auto">
              <button
                onClick={() => toggleApproval(review._id, review.isApproved)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] ${
                  review.isApproved
                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {review.isApproved ? (
                  <>
                    <XCircle size={14} className="sm:w-4 sm:h-4" /> Reject
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Approve
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setDeleteId(review._id);
                  setIsModalOpen(true);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center active:scale-[0.98] shrink-0"
              >
                <Trash2 size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-gray-100">
            <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              No reviews found.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        type="danger"
        confirmText="Delete Review"
      />
    </div>
  );
}
