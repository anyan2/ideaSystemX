import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Paper,
  InputBase,
  Tabs,
  Tab,
  Chip,
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Search as SearchIcon,
  Lightbulb as LightbulbIcon,
  Settings as SettingsIcon,
  SmartToy as SmartToyIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IdeaList from '../components/IdeaList';
import Sidebar from '../components/Sidebar';

const drawerWidth = 240;

const MainPage = ({ darkMode }) => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // 加载想法数据
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setLoading(true);
        const data = await window.electron.getAllIdeas();
        setIdeas(data);
        
        // 提取所有标签
        const tags = new Set();
        data.forEach(idea => {
          if (idea.tags && Array.isArray(idea.tags)) {
            idea.tags.forEach(tag => tags.add(tag));
          }
        });
        setAllTags(Array.from(tags));
        
        setLoading(false);
      } catch (err) {
        console.error('加载想法失败:', err);
        setError('加载想法失败，请重试');
        setLoading(false);
      }
    };

    loadIdeas();
    
    // 设置IPC监听器，当新想法保存时更新列表
    const handleIdeaSaved = (newIdea) => {
      setIdeas(prevIdeas => [newIdea, ...prevIdeas]);
    };
    
    window.electron.onIdeaSaved(handleIdeaSaved);
    
    return () => {
      // 清理监听器
      // 注意：在实际应用中，需要提供一种方式来移除监听器
    };
  }, []);

  // 过滤和排序想法
  const filteredIdeas = ideas
    .filter(idea => {
      // 搜索过滤
      if (searchQuery && !idea.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 标签过滤
      if (selectedTags.length > 0) {
        if (!idea.tags) return false;
        return selectedTags.every(tag => idea.tags.includes(tag));
      }
      
      return true;
    })
    .sort((a, b) => {
      // 排序
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'updated') {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      return 0;
    });

  // 处理搜索
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // 处理排序方式变更
  const handleSortChange = (event, newValue) => {
    setSortBy(newValue);
  };

  // 处理标签选择
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 处理抽屉开关
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 导航到设置页面
  const navigateToSettings = () => {
    navigate('/settings');
  };

  // 导航到AI控制台
  const navigateToAIConsole = () => {
    navigate('/ai-console');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 3
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ideaSystemX
          </Typography>
          <Paper
            component="form"
            sx={{ 
              p: '2px 4px', 
              display: 'flex', 
              alignItems: 'center', 
              width: 400,
              mr: 2,
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)'
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, color: 'inherit' }}
              placeholder="搜索想法..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <IconButton type="button" sx={{ p: '10px', color: 'inherit' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
          <IconButton color="inherit" onClick={navigateToAIConsole}>
            <SmartToyIcon />
          </IconButton>
          <IconButton color="inherit" onClick={navigateToSettings}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
      >
        <Sidebar 
          allTags={allTags} 
          selectedTags={selectedTags} 
          onTagSelect={handleTagSelect}
          darkMode={darkMode}
        />
      </Drawer>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          marginLeft: drawerOpen ? `${drawerWidth}px` : 0,
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: '64px',
          height: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', alignItems: 'center' }}>
          <SortIcon sx={{ mr: 1 }} />
          <Typography variant="body1" sx={{ mr: 2 }}>排序方式:</Typography>
          <Tabs value={sortBy} onChange={handleSortChange} aria-label="sort options">
            <Tab label="创建时间" value="date" />
            <Tab label="更新时间" value="updated" />
          </Tabs>
        </Box>
        
        {selectedTags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>已选标签:</Typography>
            <Box>
              {selectedTags.map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  onDelete={() => handleTagSelect(tag)} 
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        ) : filteredIdeas.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <LightbulbIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6">没有找到想法</Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || selectedTags.length > 0 
                ? '尝试更改搜索条件或清除标签过滤器' 
                : '使用快捷键 Ctrl+Alt+I 开始记录您的第一个想法'}
            </Typography>
          </Paper>
        ) : (
          <IdeaList ideas={filteredIdeas} />
        )}
      </Box>
    </Box>
  );
};

export default MainPage;
