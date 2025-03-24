import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const InputPage = () => {
  const [idea, setIdea] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter 保存想法
      if (e.ctrlKey && e.key === 'Enter') {
        handleSaveIdea();
      }
      // Escape 关闭窗口
      if (e.key === 'Escape') {
        handleCloseWindow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [idea]);

  // 保存想法
  const handleSaveIdea = async () => {
    if (!idea.trim()) {
      setError('请输入想法内容');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // 发送到主进程保存
      window.electron.saveIdea({ content: idea.trim() });

      // 监听保存结果
      window.electron.onIdeaSaved(() => {
        // 清空输入并关闭窗口
        setIdea('');
        handleCloseWindow();
      });

      window.electron.onIdeaSaveError((errorMsg) => {
        setError(`保存失败: ${errorMsg}`);
        setSaving(false);
      });
    } catch (err) {
      setError(`保存失败: ${err.message}`);
      setSaving(false);
    }
  };

  // 关闭窗口
  const handleCloseWindow = () => {
    window.electron.hideInputWindow();
  };

  return (
    <Box
      className="input-window"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          bgcolor: 'primary.main',
          color: 'white',
          cursor: 'move',
        }}
        className="draggable-header"
      >
        <Typography variant="subtitle1" component="div">
          快速记录想法
        </Typography>
        <IconButton size="small" color="inherit" onClick={handleCloseWindow}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TextField
          autoFocus
          multiline
          fullWidth
          variant="outlined"
          placeholder="在这里输入您的想法..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          sx={{ flexGrow: 1, mb: 2 }}
          InputProps={{
            sx: { height: '100%' },
          }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            按 Ctrl+Enter 保存，Esc 取消
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveIdea}
            disabled={saving || !idea.trim()}
          >
            {saving ? '保存中...' : '保存想法'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InputPage;
