import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SendIcon from '@mui/icons-material/Send';
import Alert from '@mui/material/Alert';

const ConsoleContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const QueryBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(2),
}));

const ResponseContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  flexGrow: 1,
  overflow: 'auto',
}));

function AIConsole({ ideas }) {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    // 检查AI API是否已配置
    const checkAIConfiguration = async () => {
      try {
        const settings = await window.electron.getSettings();
        setAiConfigured(!!settings?.ai?.apiKey);
      } catch (error) {
        console.error('检查AI配置失败:', error);
        setAiConfigured(false);
      }
    };

    checkAIConfiguration();
  }, []);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 添加用户查询到响应列表
      const userQuery = {
        id: Date.now(),
        type: 'query',
        content: query,
        timestamp: new Date().toISOString(),
      };
      
      setResponses(prev => [...prev, userQuery]);
      
      // 调用AI服务回答查询
      const answer = await window.electron.answerQuery(query);
      
      // 添加AI响应到响应列表
      const aiResponse = {
        id: Date.now() + 1,
        type: 'response',
        content: answer,
        timestamp: new Date().toISOString(),
      };
      
      setResponses(prev => [...prev, aiResponse]);
      setQuery('');
    } catch (error) {
      console.error('AI查询失败:', error);
      setError('AI查询失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuery();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  return (
    <ConsoleContainer>
      <Typography variant="h6" gutterBottom>
        AI 控制台
      </Typography>
      
      {!aiConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          AI API 尚未配置。请在设置中添加您的 API 密钥以启用 AI 功能。
        </Alert>
      )}
      
      <ResponseContainer>
        {responses.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center">
            在这里向您的知识库提问，AI 将基于您的想法提供回答。
          </Typography>
        ) : (
          <List>
            {responses.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        color={item.type === 'query' ? 'primary' : 'secondary'}
                      >
                        {item.type === 'query' ? '您的问题' : 'AI 回答'}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body1"
                          color="textPrimary"
                          sx={{ display: 'block', whiteSpace: 'pre-wrap' }}
                        >
                          {item.content}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="textSecondary"
                        >
                          {formatTimestamp(item.timestamp)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </ResponseContainer>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <QueryBox>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="向您的知识库提问..."
          value={query}
          onChange={handleQueryChange}
          onKeyPress={handleKeyPress}
          disabled={loading || !aiConfigured}
          multiline
          maxRows={3}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSubmitQuery}
          disabled={loading || !query.trim() || !aiConfigured}
        >
          发送
        </Button>
      </QueryBox>
    </ConsoleContainer>
  );
}

export default AIConsole;
