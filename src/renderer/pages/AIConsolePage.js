import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Send as SendIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AIConsolePage = () => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const navigate = useNavigate();

  // 检查AI是否已配置
  useEffect(() => {
    const checkAIConfiguration = async () => {
      try {
        const settings = await window.electron.getSettings();
        setAiConfigured(
          settings && 
          settings.ai && 
          settings.ai.provider && 
          settings.ai.apiKey && 
          settings.ai.model
        );
      } catch (error) {
        console.error('检查AI配置失败:', error);
      }
    };

    checkAIConfiguration();
  }, []);

  // 发送查询到AI
  const handleSendQuery = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      
      // 添加用户查询到对话
      const userMessage = { role: 'user', content: query };
      setConversation(prev => [...prev, userMessage]);
      
      // 发送查询到主进程
      const response = await window.electron.answerQuery(query);
      
      // 添加AI回复到对话
      const aiMessage = { role: 'assistant', content: response };
      setConversation(prev => [...prev, aiMessage]);
      
      // 清空输入框
      setQuery('');
    } catch (error) {
      console.error('发送查询失败:', error);
      
      // 添加错误消息到对话
      const errorMessage = { 
        role: 'system', 
        content: `处理查询时出错: ${error.message || '未知错误'}` 
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  // 返回主页
  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          AI 控制台
        </Typography>
      </Box>
      
      {!aiConfigured ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              AI 未配置
            </Typography>
            <Typography variant="body1" paragraph>
              您需要在设置中配置AI服务才能使用此功能。
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/settings')}
            >
              前往设置
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Paper 
            elevation={3} 
            sx={{ 
              flexGrow: 1, 
              mb: 2, 
              p: 2, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {conversation.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  AI 控制台
                </Typography>
                <Typography variant="body1" align="center" sx={{ maxWidth: 500 }}>
                  在这里，您可以向AI询问有关您存储的想法的问题。AI将分析您的想法库并提供见解和建议。
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  示例问题:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="我最近关于项目管理的想法有哪些？" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="帮我总结所有与健康相关的想法" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="我的想法中有哪些共同的主题？" />
                  </ListItem>
                </List>
              </Box>
            ) : (
              conversation.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      bgcolor: 
                        message.role === 'user' 
                          ? 'primary.light' 
                          : message.role === 'system' 
                            ? 'error.light'
                            : 'background.paper',
                      color: 
                        message.role === 'user' || message.role === 'system'
                          ? 'white' 
                          : 'text.primary'
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
          </Paper>
          
          <Paper 
            component="form" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="输入您的问题..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <IconButton 
                        color="primary" 
                        onClick={handleSendQuery}
                        disabled={!query.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AIConsolePage;
