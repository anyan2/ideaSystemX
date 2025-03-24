import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

const InputWindowContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TitleBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

function InputWindow() {
  const [idea, setIdea] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleIdeaChange = (e) => {
    setIdea(e.target.value);
  };

  const handleTagInputChange = (e) => {
    setCurrentTag(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const saveIdea = () => {
    if (idea.trim()) {
      window.electron.saveIdea({ content: idea, tags });
      setIdea('');
      setTags([]);
      window.electron.hideInputWindow();
    }
  };

  const closeWindow = () => {
    window.electron.hideInputWindow();
  };

  return (
    <InputWindowContainer>
      <TitleBar>
        <h3 style={{ margin: 0 }}>快速记录想法</h3>
        <IconButton onClick={closeWindow} size="small">
          <CloseIcon />
        </IconButton>
      </TitleBar>
      
      <TextField
        autoFocus
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        placeholder="在这里输入您的想法..."
        value={idea}
        onChange={handleIdeaChange}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          size="small"
          placeholder="添加标签..."
          value={currentTag}
          onChange={handleTagInputChange}
          onKeyDown={handleTagInputKeyDown}
          sx={{ mr: 1, flexGrow: 1 }}
        />
        <Button variant="outlined" onClick={addTag}>添加</Button>
      </Box>
      
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => removeTag(tag)}
            size="small"
          />
        ))}
      </Stack>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveIdea}
          disabled={!idea.trim()}
        >
          保存想法
        </Button>
      </Box>
    </InputWindowContainer>
  );
}

export default InputWindow;
