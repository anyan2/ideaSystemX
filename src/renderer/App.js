import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Sidebar from './components/Sidebar';
import IdeaList from './components/IdeaList';
import IdeaDetail from './components/IdeaDetail';
import AIConsole from './components/AIConsole';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('ideas');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideas, setIdeas] = useState([]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
    },
    shape: {
      borderRadius: 8,
    },
  });

  useEffect(() => {
    // 加载所有想法
    const loadIdeas = async () => {
      try {
        const allIdeas = await window.electron.getAllIdeas();
        setIdeas(allIdeas || []);
      } catch (error) {
        console.error('加载想法失败:', error);
      }
    };

    loadIdeas();
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedIdea(null);
  };

  const handleIdeaSelect = (idea) => {
    setSelectedIdea(idea);
    setCurrentView('ideaDetail');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'ideas':
        return <IdeaList ideas={ideas} onIdeaSelect={handleIdeaSelect} />;
      case 'ideaDetail':
        return selectedIdea ? <IdeaDetail idea={selectedIdea} /> : <IdeaList ideas={ideas} onIdeaSelect={handleIdeaSelect} />;
      case 'aiConsole':
        return <AIConsole ideas={ideas} />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <IdeaList ideas={ideas} onIdeaSelect={handleIdeaSelect} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, ...(open && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              ideaSystemX
            </Typography>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <div>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <Sidebar currentView={currentView} onViewChange={handleViewChange} />
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: `-${240}px`,
            ...(open && {
              transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginLeft: 0,
            }),
          }}
        >
          <Toolbar />
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
