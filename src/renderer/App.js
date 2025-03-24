import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// 导入页面组件
import MainPage from './pages/MainPage';
import InputPage from './pages/InputPage';
import SettingsPage from './pages/SettingsPage';
import AIConsolePage from './pages/AIConsolePage';

function App() {
  const [settings, setSettings] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await window.electron.getSettings();
        setSettings(loadedSettings);
        setDarkMode(loadedSettings.theme === 'dark');
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    };

    loadSettings();
  }, []);

  // 更新设置
  const handleUpdateSettings = async (newSettings) => {
    try {
      await window.electron.updateSettings(newSettings);
      setSettings(newSettings);
      setDarkMode(newSettings.theme === 'dark');
    } catch (error) {
      console.error('更新设置失败:', error);
    }
  };

  // 创建主题
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
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: darkMode ? '#333' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: darkMode ? '#888' : '#ccc',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: darkMode ? '#555' : '#999',
            },
          },
        },
      },
    },
  });

  // 根据路由路径渲染不同的布局
  const renderLayout = () => {
    // 输入页面使用特殊布局（无边框）
    if (location.pathname === '/input' || location.hash === '#/input') {
      return (
        <Box sx={{ height: '100vh', overflow: 'hidden' }}>
          <Routes>
            <Route path="/input" element={<InputPage />} />
            <Route path="*" element={<InputPage />} />
          </Routes>
        </Box>
      );
    }

    // 主应用布局
    return (
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Routes>
          <Route path="/" element={<MainPage darkMode={darkMode} />} />
          <Route path="/settings" element={<SettingsPage settings={settings} onUpdateSettings={handleUpdateSettings} />} />
          <Route path="/ai-console" element={<AIConsolePage />} />
          <Route path="*" element={<MainPage darkMode={darkMode} />} />
        </Routes>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderLayout()}
    </ThemeProvider>
  );
}

export default App;
