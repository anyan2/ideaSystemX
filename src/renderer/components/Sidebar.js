import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';

function Sidebar({ currentView, onViewChange }) {
  const menuItems = [
    { id: 'ideas', label: '想法列表', icon: <FormatListBulletedIcon /> },
    { id: 'aiConsole', label: 'AI 控制台', icon: <SmartToyIcon /> },
    { id: 'settings', label: '设置', icon: <SettingsIcon /> },
  ];

  return (
    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          key={item.id}
          selected={currentView === item.id}
          onClick={() => onViewChange(item.id)}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
      <Divider sx={{ my: 2 }} />
    </List>
  );
}

export default Sidebar;
