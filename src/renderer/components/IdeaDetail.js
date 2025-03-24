import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const DetailContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

const ContentSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  flexGrow: 1,
  overflow: 'auto',
}));

const TagsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
}));

const RelatedSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

function IdeaDetail({ idea }) {
  const [editing, setEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState({ ...idea });
  const [currentTag, setCurrentTag] = useState('');
  const [relatedIdeas, setRelatedIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 重置编辑状态
    setEditing(false);
    setEditedIdea({ ...idea });
    
    // 加载相关想法
    loadRelatedIdeas();
  }, [idea]);

  const loadRelatedIdeas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const related = await window.electron.findRelatedIdeas(idea.content);
      setRelatedIdeas(related || []);
    } catch (error) {
      console.error('加载相关想法失败:', error);
      setError('无法加载相关想法');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // 取消编辑，恢复原始数据
      setEditedIdea({ ...idea });
    }
    setEditing(!editing);
  };

  const handleContentChange = (e) => {
    setEditedIdea({
      ...editedIdea,
      content: e.target.value
    });
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
    if (currentTag.trim() && !editedIdea.tags.includes(currentTag.trim())) {
      setEditedIdea({
        ...editedIdea,
        tags: [...editedIdea.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedIdea({
      ...editedIdea,
      tags: editedIdea.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = async () => {
    try {
      await window.electron.updateIdea(editedIdea.id, editedIdea);
      setEditing(false);
      // 理想情况下，这里应该通知父组件更新idea
    } catch (error) {
      console.error('保存想法失败:', error);
      setError('保存想法失败: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个想法吗？此操作不可撤销。')) {
      try {
        await window.electron.deleteIdea(idea.id);
        // 理想情况下，这里应该通知父组件删除idea并返回列表视图
      } catch (error) {
        console.error('删除想法失败:', error);
        setError('删除想法失败: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <DetailContainer>
      <HeaderSection>
        <Typography variant="h6">
          想法详情
        </Typography>
        <Box>
          {editing ? (
            <>
              <IconButton color="primary" onClick={handleSave} title="保存">
                <SaveIcon />
              </IconButton>
              <IconButton color="default" onClick={handleEditToggle} title="取消">
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton color="primary" onClick={handleEditToggle} title="编辑">
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={handleDelete} title="删除">
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </HeaderSection>
      
      <Typography variant="caption" color="textSecondary">
        创建于: {formatDate(idea.created_at)}
        {idea.updated_at !== idea.created_at && ` | 更新于: ${formatDate(idea.updated_at)}`}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <ContentSection>
        {editing ? (
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={editedIdea.content}
            onChange={handleContentChange}
          />
        ) : (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {idea.content}
          </Typography>
        )}
      </ContentSection>
      
      <Typography variant="subtitle2" gutterBottom>
        标签
      </Typography>
      
      <TagsSection>
        {editing ? (
          <>
            <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
              <TextField
                size="small"
                placeholder="添加标签..."
                value={currentTag}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                sx={{ mr: 1, flexGrow: 1 }}
              />
              <Button variant="outlined" size="small" onClick={addTag}>添加</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {editedIdea.tags && editedIdea.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </>
        ) : (
          <>
            {idea.tags && idea.tags.length > 0 ? (
              idea.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                没有标签
              </Typography>
            )}
          </>
        )}
      </TagsSection>
      
      {!editing && (
        <RelatedSection>
          <Typography variant="subtitle2" gutterBottom>
            相关想法
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : relatedIdeas.length > 0 ? (
            <List dense>
              {relatedIdeas.map((relatedIdea) => (
                <ListItem key={relatedIdea.id} button>
                  <ListItemAvatar>
                    <Avatar>
                      <LightbulbIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={relatedIdea.content.substring(0, 50) + (relatedIdea.content.length > 50 ? '...' : '')}
                    secondary={formatDate(relatedIdea.created_at)}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              没有找到相关想法
            </Typography>
          )}
        </RelatedSection>
      )}
      
      {error && !loading && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </DetailContainer>
  );
}

export default IdeaDetail;
