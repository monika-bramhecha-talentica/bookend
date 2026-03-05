import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string | null;
  publishedYear?: number | null;
  averageRating: number;
  _count?: {
    reviews?: number;
  };
}

interface BooksResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const BookCatalogPage = () => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '9',
          sortBy: 'title',
          order: 'asc',
        });

        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }

        const response = await fetch(`/api/books?${params.toString()}`);
        const data: BooksResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as unknown as { error?: string })?.error || 'Failed to load books');
        }

        setBooks(data.books || []);
        setTotalPages(Math.max(data.pagination?.pages || 1, 1));
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [page, searchTerm]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(query);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Book Catalog</Typography>
        <Button component={RouterLink} to="/dashboard" variant="outlined">
          Back to Dashboard
        </Button>
      </Stack>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" variant="contained">
          Search
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Alert severity="info">No books found for this search.</Alert>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {book.author}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Genre: {book.genre || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Year: {book.publishedYear || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Rating: {book.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body2">
                    Reviews: {book._count?.reviews || 0}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={`/books/${book.id}`}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    View details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          color="primary"
          onChange={(_, value) => setPage(value)}
          disabled={isLoading}
        />
      </Box>
    </Container>
  );
};

export default BookCatalogPage;
