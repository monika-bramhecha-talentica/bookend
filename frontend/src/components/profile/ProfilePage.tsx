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
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';

interface ProfileData {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string | null;
  role: string;
  stats: {
    reviewCount: number;
    favoriteCount: number;
  };
}

interface FavoriteBook {
  id: string;
  title: string;
  author: string;
  averageRating: number;
}

const ProfilePage = () => {
  const authState = useAppSelector((state) => state.auth) as {
    accessToken: string | null;
  };

  const { accessToken } = authState;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!accessToken) {
        setError('You must be logged in to view profile');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [profileResponse, favoritesResponse] = await Promise.all([
          fetch('/api/users/me/profile', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          fetch('/api/users/me/favorites', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        const profileData = await profileResponse.json();
        const favoritesData = await favoritesResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData?.error || 'Failed to load profile');
        }

        if (!favoritesResponse.ok) {
          throw new Error(favoritesData?.error || 'Failed to load favorites');
        }

        setProfile(profileData);
        setFavorites(favoritesData?.favorites || []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [accessToken]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/dashboard" variant="outlined">
          Back to Dashboard
        </Button>
        <Button component={RouterLink} to="/books" variant="text">
          Browse Books
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !profile ? (
        <Alert severity="info">No profile data found.</Alert>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {profile.fullName || profile.username}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                @{profile.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Email: {profile.email}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Role: {profile.role}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Reviews Written: {profile.stats.reviewCount}
              </Typography>
              <Typography variant="body2">
                Favorites: {profile.stats.favoriteCount}
              </Typography>
              {profile.bio && (
                <Typography sx={{ mt: 2 }}>{profile.bio}</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Favorite Books
              </Typography>
              {favorites.length === 0 ? (
                <Alert severity="info">You have no favorite books yet.</Alert>
              ) : (
                <List>
                  {favorites.map((book) => (
                    <ListItem
                      key={book.id}
                      secondaryAction={
                        <Button component={RouterLink} to={`/books/${book.id}`} size="small">
                          View
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={book.title}
                        secondary={`${book.author} • Rating ${book.averageRating.toFixed(1)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Container>
  );
};

export default ProfilePage;
