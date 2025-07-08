'use client';

import { Container, Box, Typography, Button, Card, CardContent, Stack, Paper } from "@mui/material";
import { ArrowForward, EmojiEvents, Psychology, FamilyRestroom } from "@mui/icons-material";
import Link from "next/link";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
        {/* Main Content - 2 columns */}
        <Box>
          <Box sx={{ mb: 6 }}>
            <Typography
              component="h1"
              variant="h2"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Level Up Your Life
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Transform your personal development into an exciting RPG adventure.
              Complete quests, gain XP, and become the hero of your own life story.
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 4 }}
            >
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                href="/login"
                endIcon={<ArrowForward />}
              >
                Start Your Journey
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                href="/about"
              >
                Learn More
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4 }}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <EmojiEvents fontSize="large" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
                  Track Your Progress
                </Typography>
                <Typography>
                  Level up various stats like Strength, Wisdom, and more as you complete tasks.
                  Watch yourself grow in real-time.
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Psychology fontSize="large" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
                  Daily Challenges
                </Typography>
                <Typography>
                  Receive personalized daily tasks from your AI Dungeon Master to help you
                  grow and improve.
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <FamilyRestroom fontSize="large" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
                  Family Connection
                </Typography>
                <Typography>
                  Strengthen family bonds with quests designed specifically 
                  to create meaningful moments with your loved ones.
                </Typography>
              </CardContent>
            </Card>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Psychology fontSize="large" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
                  Reflective Journal
                </Typography>
                <Typography>
                  Process your day through an AI-assisted journal that helps you 
                  gain insights and awards XP for your reflections.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Right Sidebar - 1 column */}
        <Box>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" component="h3" gutterBottom color="primary" fontWeight="bold">
              Latest Updates
            </Typography>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Character Creation Live!
            </Typography>
            <Typography paragraph variant="body2">
              Create your RPG character, select a class, and write your backstory to begin your journey.
            </Typography>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Daily Quests Coming Soon
            </Typography>
            <Typography paragraph variant="body2">
              The AI Dungeon Master is training to provide you with personalized daily challenges.
            </Typography>
            <Button 
              size="small" 
              color="primary" 
              sx={{ mt: 1 }}
              component={Link}
              href="/updates"
            >
              View all updates
            </Button>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h3" gutterBottom color="primary" fontWeight="bold">
              Get Started
            </Typography>
            <Typography paragraph>
              Follow these simple steps to begin your adventure:
            </Typography>
            <Box component="ol" sx={{ pl: 2 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography>Create an account</Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography>Build your character</Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography>Define your stats and goals</Typography>
              </Box>
              <Box component="li">
                <Typography>Complete your first quest</Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              sx={{ mt: 2 }}
              component={Link}
              href="/register"
            >
              Register Now
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
