import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { logout } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

interface Book {
  id: string;
  title: string;
  author: string;
  averageRating: number;
  _count?: {
    reviews?: number;
  };
}

interface BooksResponse {
  books: Book[];
}

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth) as {
    user: { fullName?: string; username?: string } | null;
  };
  const { user } = authState;
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopBooks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/books?page=1&limit=6&sortBy=averageRating&order=desc');
        const data: BooksResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as unknown as { error?: string })?.error || 'Failed to load books');
        }

        setBooks(data.books || []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopBooks();
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Welcome {user?.fullName || user?.username || 'Reader'}.
      </Typography>

      <Button component={RouterLink} variant="contained" to="/books" sx={{ mt: 1, mr: 1 }}>
        Browse Books
      </Button>
      <Button component={RouterLink} variant="outlined" to="/profile" sx={{ mt: 1, mr: 1 }}>
        Profile
      </Button>
      <Button variant="outlined" onClick={() => dispatch(logout())} sx={{ mt: 1 }}>
        Logout
      </Button>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Top Books (Seeded Data)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {book.author}
                  </Typography>
                  <Typography variant="body2">
                    Rating: {book.averageRating.toFixed(1)} • Reviews: {book._count?.reviews || 0}
                  </Typography>
                  <Button component={RouterLink} to={`/books/${book.id}`} size="small" sx={{ mt: 1 }}>
                    Open
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </main>
  );
};

export default DashboardPage;
