import { memo, useState } from "react";
import { Star } from "lucide-react";

const RatingSection = ({
    disabled,
    submitting,
    rating,
    comment,
    onRatingChange,
    onCommentChange,
    onSubmit,
    disabledReason,
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const visibleRating = hoverRating || rating;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-slate-900">Rate Your Farmer</h3>

            {disabledReason ? <p className="text-sm text-slate-500 mt-1">{disabledReason}</p> : null}

            <form onSubmit={onSubmit} className="mt-3 space-y-3">
                <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            onMouseEnter={() => setHoverRating(value)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => onRatingChange(value)}
                            className="p-1 rounded-md transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        >
                            <Star
                                className={`w-6 h-6 transition-colors ${value <= visibleRating ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    disabled={disabled}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="Share your experience with this farmer"
                />

                <button
                    disabled={disabled || submitting}
                    type="submit"
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? "Submitting..." : "Submit Rating"}
                </button>
            </form>
        </div>
    );
};

export default memo(RatingSection);
