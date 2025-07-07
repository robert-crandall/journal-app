'use client';

import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Logout,
  Person
} from '@mui/icons-material';
import { useState } from 'react';
import { api } from '@/trpc/react';
import { ThemeToggle } from './theme-toggle';

interface NavBarProps {
  user?: {
    id: string;
    email: string;
  } | null;
}

export function NavBar({ user }: NavBarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const logoutMutation = api.auth.logout.useMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      const { logoutAction } = await import('@/lib/auth-actions');
      await logoutAction();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          Gamified Life RPG
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle />
          
          {user ? (
            <>
              <Button
                onClick={handleMenuClick}
                startIcon={<Avatar sx={{ width: 24, height: 24 }}>{user.email[0].toUpperCase()}</Avatar>}
                sx={{ ml: 1 }}
              >
                {user.email}
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                  </ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" href="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
