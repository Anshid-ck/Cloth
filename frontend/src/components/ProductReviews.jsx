// frontend/src/components/ProductReviews.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, ThumbsUp, User, Edit2, Trash2, Package, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import API from '../api/api';
import toast from 'react-hot-toast';

export default function ProductReviews({ productId }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      checkCanReview();
    }
  }, [productId, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/reviews/product/${productId}/`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await API.get(`/api/reviews/can-review/${productId}/`);
      setCanReview(response.data.can_review);
      setHasReviewed(response.data.has_reviewed);
      if (response.data.existing_review) {
        setExistingReview(response.data.existing_review);
      }
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
    }
  };

  const handleOpenForm = (editMode = false) => {
    if (editMode && existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title);
      setComment(existingReview.comment || '');
      setIsEditing(true);
    } else {
      setRating(0);
      setTitle('');
      setComment('');
      setIsEditing(false);
    }
    setShowForm(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }

    try {
      setSubmitting(true);
      if (isEditing && existingReview) {
        await API.put(`/api/reviews/update/${existingReview.id}/`, { rating, title, comment });
        toast.success('Review updated!');
      } else {
        await API.post('/api/reviews/create/', { product_id: productId, rating, title, comment });
        toast.success('Review submitted!');
      }
      setTitle(''); setComment(''); setRating(0); setShowForm(false); setIsEditing(false);
      fetchReviews(); checkCanReview();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async () => {
    if (!existingReview || !window.confirm('Delete your review?')) return;
    try {
      await API.delete(`/api/reviews/delete/${existingReview.id}/`);
      toast.success('Review deleted');
      setExistingReview(null); setHasReviewed(false);
      fetchReviews(); checkCanReview();
    } catch (error) { toast.error('Failed to delete review'); }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const displayedReviews = expanded ? reviews : reviews.slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-600" />
          <h3 className="font-bold text-gray-900">Reviews</h3>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800">{avgRating}</span>
            <span className="text-xs text-gray-500">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Write Review Action */}
      {isAuthenticated && !showForm && (
        <div className="mb-4">
          {canReview ? (
            hasReviewed ? (
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200">
                <span className="text-sm text-green-700 font-medium">Your review</span>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenForm(true)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={handleDeleteReview} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => handleOpenForm(false)} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition">
                Write a Review
              </button>
            )
          ) : (
            <div className="text-center py-3 bg-gray-100 rounded-lg border border-gray-200">
              <Package size={18} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Purchase & receive to review</p>
            </div>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="bg-white rounded-xl p-4 mb-4 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">{isEditing ? 'Edit Review' : 'Your Review'}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
          </div>

          {/* Star Rating */}
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)}>
                <Star size={28} className={`transition ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>

          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Title" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Your experience (optional)" rows="2"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? '...' : isEditing ? 'Update' : 'Submit'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setIsEditing(false); }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6">
          <Star size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{(review.user_name || 'A')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 text-sm truncate">{review.user_name || 'Anonymous'}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{review.title}</h4>
                  {review.comment && <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.verified_purchase && (
                      <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reviews.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition flex items-center justify-center gap-1"
            >
              {expanded ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> Show All ({reviews.length})</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}