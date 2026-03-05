import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface BookDetails {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher?: string | null;
  publishedYear?: number | null;
  genre?: string | null;
  description?: string | null;
  language?: string | null;
  averageRating: number;
  ratingsCount: number;
  reviews: Review[];
  _count?: {
    reviews?: number;
  };
}

interface ReviewsResponse {
  reviews: Review[];
}

const BookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const authState = useAppSelector((state) => state.auth) as {
    accessToken: string | null;
    user: { id: string } | null;
  };
  const { accessToken, user } = authState;
  const [book, setBook] = useState<BookDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const fetchBook = async (bookId: string) => {
    const response = await fetch(`/api/books/${bookId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load book details');
    }

    setBook(data);
  };

  const fetchReviews = async (bookId: string) => {
    setIsReviewsLoading(true);
    setReviewError(null);

    try {
      const response = await fetch(`/api/books/${bookId}/reviews?page=1&limit=50`);
      const data: ReviewsResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error?: string })?.error || 'Failed to load reviews');
      }

      setReviews(data.reviews || []);
    } catch (fetchError) {
      setReviewError(fetchError instanceof Error ? fetchError.message : 'Failed to load reviews');
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const fetchFavoriteStatus = async (bookId: string) => {
    if (!accessToken) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/favorites', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load favorites');
      }

      const favoriteBooks = (data?.favorites || []) as Array<{ id: string }>;
      setIsFavorite(favoriteBooks.some((favoriteBook) => favoriteBook.id === bookId));
    } catch {
      setIsFavorite(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Book id is missing');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([fetchBook(id), fetchReviews(id), fetchFavoriteStatus(id)]);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load book details');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const myReview = user?.id ? reviews.find((review) => review.user.id === user.id) : null;

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewForm({
      rating: review.rating,
      title: review.title,
      content: review.content,
    });
    setReviewError(null);
    setReviewSuccess(null);
  };

  const resetReviewForm = () => {
    setEditingReviewId(null);
    setReviewForm({ rating: 5, title: '', content: '' });
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      setReviewError('Book id is missing');
      return;
    }

    if (!accessToken) {
      setReviewError('You must be logged in to submit a review');
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      setReviewError('Review title and content are required');
      return;
    }

    setIsReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const targetUrl = editingReviewId ? `/api/reviews/${editingReviewId}` : `/api/books/${id}/reviews`;
      const method = editingReviewId ? 'PUT' : 'POST';

      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          title: reviewForm.title.trim(),
          content: reviewForm.content.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save review');
      }

      setReviewSuccess(editingReviewId ? 'Review updated successfully' : 'Review created successfully');
      resetReviewForm();
      await Promise.all([fetchBook(id), fetchReviews(id)]);
    } catch (submitError) {
      setReviewError(submitError instanceof Error ? submitError.message : 'Failed to save review');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!id) return;

    if (!accessToken) {
      setReviewError('You must be logged in to delete a review');
      return;
    }

    setIsReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete review');
      }

      setReviewSuccess('Review deleted successfully');
      resetReviewForm();
      await Promise.all([fetchBook(id), fetchReviews(id)]);
    } catch (deleteError) {
      setReviewError(deleteError instanceof Error ? deleteError.message : 'Failed to delete review');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) return;

    if (!accessToken) {
      setReviewError('You must be logged in to manage favorites');
      return;
    }

    setIsFavoriteLoading(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const response = await fetch(`/api/users/me/favorites/${id}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update favorites');
      }

      setIsFavorite((prev) => !prev);
      setReviewSuccess(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (favoriteError) {
      setReviewError(favoriteError instanceof Error ? favoriteError.message : 'Failed to update favorites');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/books" variant="outlined">
          Back to Catalog
        </Button>
        <Button component={RouterLink} to="/dashboard" variant="text">
          Dashboard
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !book ? (
        <Alert severity="info">Book not found.</Alert>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {book.title}
              </Typography>
              <Button
                variant={isFavorite ? 'outlined' : 'contained'}
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                sx={{ mb: 2 }}
              >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {book.author}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                ISBN: {book.isbn}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Publisher: {book.publisher || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Published Year: {book.publishedYear || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Genre: {book.genre || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Language: {book.language || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Average Rating: {book.averageRating.toFixed(1)} ({book.ratingsCount} ratings)
              </Typography>
              <Typography variant="body2">
                Total Reviews: {book._count?.reviews ?? book.reviews.length}
              </Typography>
              {book.description && (
                <Typography sx={{ mt: 2 }}>
                  {book.description}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Latest Reviews
            </Typography>
            {reviewError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {reviewError}
              </Alert>
            )}
            {reviewSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {reviewSuccess}
              </Alert>
            )}

            {myReview && !editingReviewId && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    You already reviewed this book.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => startEditReview(myReview)}>
                      Edit My Review
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteReview(myReview.id)}
                      disabled={isReviewSubmitting}
                    >
                      Delete My Review
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {(!myReview || editingReviewId) && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                  </Typography>
                  <Box component="form" onSubmit={handleSubmitReview}>
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="Rating"
                        value={reviewForm.rating}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            rating: Number(event.target.value),
                          }))
                        }
                      >
                        {[1, 2, 3, 4, 5].map((ratingValue) => (
                          <MenuItem key={ratingValue} value={ratingValue}>
                            {ratingValue}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Title"
                        value={reviewForm.title}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                        required
                      />
                      <TextField
                        label="Review"
                        value={reviewForm.content}
                        onChange={(event) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            content: event.target.value,
                          }))
                        }
                        multiline
                        minRows={4}
                        required
                      />
                      <Stack direction="row" spacing={1}>
                        <Button type="submit" variant="contained" disabled={isReviewSubmitting}>
                          {editingReviewId ? 'Update Review' : 'Submit Review'}
                        </Button>
                        {editingReviewId && (
                          <Button variant="text" onClick={resetReviewForm}>
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            )}

            {isReviewsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : reviews.length === 0 ? (
              <Alert severity="info">No reviews yet.</Alert>
            ) : (
              <Stack spacing={2}>
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {review.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        By {review.user.username} • Rating {review.rating}/5
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {review.content}
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.createdAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default BookDetailsPage;
