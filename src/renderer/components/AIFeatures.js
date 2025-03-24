import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const ReminderContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
}));

const SummaryContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
}));

function AIFeatures({ ideas }) {
  const [reminders, setReminders] = useState([]);
  const [summaries, setSummaries] = useState([]);
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
    loadReminders();
    loadSummaries();
  }, []);

  const loadReminders = async () => {
    try {
      // 这里将来会从数据库加载提醒
      // 目前使用模拟数据
      setReminders([
        {
          id: 1,
          ideaId: 1,
          message: '查看关于项目计划的想法',
          reminderDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false
        },
        {
          id: 2,
          ideaId: 2,
          message: '复习学习笔记',
          reminderDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false
        }
      ]);
    } catch (error) {
      console.error('加载提醒失败:', error);
      setError('无法加载提醒');
    }
  };

  const loadSummaries = async () => {
    try {
      // 这里将来会从数据库加载摘要
      // 目前使用模拟数据
      setSummaries([
        {
          id: 1,
          title: '项目开发计划',
          content: '包含了关于软件开发、项目管理和团队协作的想法汇总',
          ideaCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: '学习笔记',
          content: '关于编程语言、框架和工具的学习笔记汇总',
          ideaCount: 8,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('加载摘要失败:', error);
      setError('无法加载摘要');
    }
  };

  const handleMarkReminderComplete = async (reminderId) => {
    try {
      // 这里将来会更新数据库中的提醒状态
      setReminders(reminders.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, isCompleted: true } 
          : reminder
      ));
    } catch (error) {
      console.error('更新提醒状态失败:', error);
      setError('无法更新提醒状态');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      // 这里将来会从数据库删除提醒
      setReminders(reminders.filter(reminder => reminder.id !== reminderId));
    } catch (error) {
      console.error('删除提醒失败:', error);
      setError('无法删除提醒');
    }
  };

  const handleGenerateReminders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 这里将来会调用AI服务生成提醒
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟API调用
      
      // 添加一个新的模拟提醒
      const newReminder = {
        id: reminders.length + 1,
        ideaId: 3,
        message: '回顾最近的创意想法',
        reminderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false
      };
      
      setReminders([...reminders, newReminder]);
    } catch (error) {
      console.error('生成提醒失败:', error);
      setError('无法生成提醒: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 这里将来会调用AI服务生成摘要
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟API调用
      
      // 添加一个新的模拟摘要
      const newSummary = {
        id: summaries.length + 1,
        title: '最近的创意想法',
        content: '包含了最近一周记录的创意和灵感的汇总与分析',
        ideaCount: 3,
        createdAt: new Date().toISOString()
      };
      
      setSummaries([...summaries, newSummary]);
    } catch (error) {
      console.error('生成摘要失败:', error);
      setError('无法生成摘要: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        AI 智能功能
      </Typography>
      
      {!aiConfigured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          AI API 尚未配置。请在设置中添加您的 API 密钥以启用全部 AI 功能。
        </Alert>
      )}
      
      <ReminderContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            智能提醒
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReminders}
            disabled={loading || !aiConfigured}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            生成提醒
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {reminders.length > 0 ? (
          <List>
            {reminders.map((reminder) => (
              <ListItem
                key={reminder.id}
                sx={{
                  mb: 1,
                  bgcolor: reminder.isCompleted ? 'action.hover' : 'background.paper',
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  primary={reminder.message}
                  secondary={`提醒日期: ${formatDate(reminder.reminderDate)}`}
                  sx={{
                    textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                  }}
                />
                <ListItemSecondaryAction>
                  {!reminder.isCompleted && (
                    <IconButton
                      edge="end"
                      color="success"
                      onClick={() => handleMarkReminderComplete(reminder.id)}
                      title="标记为已完成"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    title="删除提醒"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" align="center">
            没有待处理的提醒
          </Typography>
        )}
      </ReminderContainer>
      
      <SummaryContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <AutoAwesomeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            智能归纳
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateSummary}
            disabled={loading || !aiConfigured}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            生成归纳
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {summaries.length > 0 ? (
          <List>
            {summaries.map((summary) => (
              <ListItem
                key={summary.id}
                sx={{
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" component="span">
                        {summary.title}
                      </Typography>
                      <Chip
                        label={`${summary.ideaCount} 个想法`}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span" sx={{ display: 'block', mb: 1 }}>
                        {summary.content}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        生成于: {formatDate(summary.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" align="center">
            没有生成的归纳
          </Typography>
        )}
      </SummaryContainer>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default AIFeatures;
