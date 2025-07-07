import { redirect } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Box
} from '@mui/material';
import { validateRequest } from '@/lib/auth-utils';

export default async function DashboardPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect('/login');
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          Welcome, {user.email}!
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Your adventure begins here
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Today&apos;s Quests
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Your daily tasks will appear here once you&apos;ve created your character.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Character Stats
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Create your character to start tracking your progress.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Journal Entries
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your reflections and insights will be displayed here.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
