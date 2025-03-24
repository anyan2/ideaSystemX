import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const ListContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const IdeaListItem = styled(ListItem)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

function IdeaList({ ideas, onIdeaSelect }) {
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    let result = [...ideas];
    
    // 应用搜索过滤
    if (searchQuery) {
      result = result.filter(idea => 
        idea.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    // 应用排序
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'title-asc':
        result.sort((a, b) => a.content.localeCompare(b.content));
        break;
      case 'title-desc':
        result.sort((a, b) => b.content.localeCompare(a.content));
        break;
      default:
        break;
    }
    
    setFilteredIdeas(result);
  }, [ideas, searchQuery, sortBy]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <ListContainer>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          placeholder="搜索想法或标签..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="sort-select-label">排序方式</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortBy}
            onChange={handleSortChange}
            label="排序方式"
            startAdornment={
              <InputAdornment position="start">
                <SortIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="date-desc">最新优先</MenuItem>
            <MenuItem value="date-asc">最早优先</MenuItem>
            <MenuItem value="title-asc">标题升序</MenuItem>
            <MenuItem value="title-desc">标题降序</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        想法列表 ({filteredIdeas.length})
      </Typography>
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map((idea) => (
            <IdeaListItem
              key={idea.id}
              button
              onClick={() => onIdeaSelect(idea)}
              component={Paper}
              elevation={1}
            >
              <ListItemText
                primary={truncateContent(idea.content)}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      {formatDate(idea.created_at)}
                    </Typography>
                    {idea.tags && idea.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {idea.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
            </IdeaListItem>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary" align="center">
            {searchQuery ? '没有找到匹配的想法' : '还没有记录任何想法'}
          </Typography>
        )}
      </List>
    </ListContainer>
  );
}

export default IdeaList;
