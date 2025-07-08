'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Login,
  AppRegistration,
  Dashboard,
  Article,
} from '@mui/icons-material';

import ThemeToggle from './ThemeToggle';

const pages = [
  { name: 'Dashboard', href: '/' },
  { name: 'Journal', href: '/journal' },
  { name: 'Stats', href: '/stats' },
];

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  return (
    <AppBar position="static" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => toggleDrawer(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component={Link}
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LIFE RPG
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.href}
                sx={{
                  my: 2,
                  color: 'white',
                  display: 'block',
                  fontWeight: pathname === page.href ? 700 : 400,
                  borderBottom: pathname === page.href ? 2 : 0,
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />

            {session ? (
              <>
                <Typography
                  variant="body1"
                  sx={{ ml: 2, mr: 1, display: { xs: 'none', sm: 'block' } }}
                >
                  Hello, {session.user?.name || session.user?.email}
                </Typography>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={session.user?.name || 'User'}
                    src={session.user?.image || undefined}
                  />
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={handleCloseUserMenu}
                  >
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex' }}>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  color="inherit"
                  startIcon={<Login />}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="outlined"
                  color="inherit"
                  startIcon={<AppRegistration />}
                  sx={{ ml: 1 }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => toggleDrawer(false)}
        >
          <List>
            <ListItem>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                LIFE RPG
              </Typography>
            </ListItem>
            <Divider />
            {pages.map((page) => (
              <ListItem key={page.name} disablePadding>
                <ListItemButton
                  component={Link}
                  href={page.href}
                  selected={pathname === page.href}
                >
                  <ListItemIcon>
                    {page.name === 'Dashboard' ? (
                      <Dashboard />
                    ) : page.name === 'Journal' ? (
                      <Article />
                    ) : (
                      <Article />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={page.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
