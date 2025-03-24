import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Chip,
  Paper
} from '@mui/material';
import { 
  Label as LabelIcon,
  Bookmark as BookmarkIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const Sidebar = ({ allTags, selectedTags, onTagSelect, darkMode }) => {
  return (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        筛选器
      </Typography>
      
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        快速视图
      </Typography>
      <Paper elevation={0} sx={{ mb: 2, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
        <List dense>
          <ListItem button>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="最近添加" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <BookmarkIcon />
            </ListItemIcon>
            <ListItemText primary="重要想法" />
          </ListItem>
        </List>
      </Paper>
      
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        标签
      </Typography>
      <Paper elevation={0} sx={{ p: 1, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                icon={<LabelIcon />}
                onClick={() => onTagSelect(tag)}
                color={selectedTags.includes(tag) ? "primary" : "default"}
                sx={{ m: 0.5 }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              没有可用的标签
            </Typography>
          )}
        </Box>
      </Paper>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        提示: 使用 Ctrl+Alt+I 快速记录新想法
      </Typography>
    </Box>
  );
};

export default Sidebar;
