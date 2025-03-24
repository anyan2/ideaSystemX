import React from 'react';
import { Box, Paper, Typography, Card, CardContent, CardActions, Button, Chip, IconButton, Grid } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Label as LabelIcon } from '@mui/icons-material';

const IdeaList = ({ ideas }) => {
  // 处理删除想法
  const handleDeleteIdea = async (id) => {
    if (window.confirm('确定要删除这个想法吗？此操作不可撤销。')) {
      try {
        await window.electron.deleteIdea(id);
        // 删除成功后会通过主进程通知更新列表，所以这里不需要手动更新状态
      } catch (error) {
        console.error('删除想法失败:', error);
        alert('删除想法失败，请重试');
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Grid container spacing={2}>
      {ideas.map((idea) => (
        <Grid item xs={12} key={idea.id}>
          <Card className="idea-card slide-in" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {idea.content}
              </Typography>
              
              {idea.summary && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {idea.summary}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
                {idea.tags && idea.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    size="small"
                    label={tag}
                    icon={<LabelIcon />}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                创建于: {formatDate(idea.created_at)}
                {idea.updated_at !== idea.created_at && ` | 更新于: ${formatDate(idea.updated_at)}`}
              </Typography>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {/* 编辑功能将在后续实现 */}}
              >
                编辑
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteIdea(idea.id)}
              >
                删除
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default IdeaList;
