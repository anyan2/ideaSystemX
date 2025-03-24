import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const SettingsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

function SettingsPanel() {
  const [settings, setSettings] = useState({
    ai: {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      embeddingModel: 'text-embedding-ada-002',
    },
    app: {
      startWithSystem: true,
      minimizeToTray: true,
      darkMode: false,
    }
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSettingChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSaveSettings = async () => {
    try {
      await window.electron.updateSettings(settings);
      setSnackbar({
        open: true,
        message: '设置已保存',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `保存设置失败: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        系统设置
      </Typography>
      
      <SettingsContainer>
        <Typography variant="h6" gutterBottom>
          AI 配置
        </Typography>
        
        <FormSection>
          <FormControl fullWidth margin="normal">
            <InputLabel id="ai-provider-label">AI 提供商</InputLabel>
            <Select
              labelId="ai-provider-label"
              value={settings.ai.provider}
              label="AI 提供商"
              onChange={(e) => handleSettingChange('ai', 'provider', e.target.value)}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="azure">Azure OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="API 密钥"
            type="password"
            value={settings.ai.apiKey}
            onChange={(e) => handleSettingChange('ai', 'apiKey', e.target.value)}
            helperText="您的API密钥将安全地存储在本地"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="ai-model-label">AI 模型</InputLabel>
            <Select
              labelId="ai-model-label"
              value={settings.ai.model}
              label="AI 模型"
              onChange={(e) => handleSettingChange('ai', 'model', e.target.value)}
            >
              <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
              <MenuItem value="gpt-4">GPT-4</MenuItem>
              <MenuItem value="claude-2">Claude 2</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="embedding-model-label">嵌入模型</InputLabel>
            <Select
              labelId="embedding-model-label"
              value={settings.ai.embeddingModel}
              label="嵌入模型"
              onChange={(e) => handleSettingChange('ai', 'embeddingModel', e.target.value)}
            >
              <MenuItem value="text-embedding-ada-002">Ada 002</MenuItem>
              <MenuItem value="text-embedding-3-small">Embedding 3 Small</MenuItem>
              <MenuItem value="text-embedding-3-large">Embedding 3 Large</MenuItem>
            </Select>
          </FormControl>
        </FormSection>
      </SettingsContainer>
      
      <SettingsContainer>
        <Typography variant="h6" gutterBottom>
          应用设置
        </Typography>
        
        <FormSection>
          <FormControlLabel
            control={
              <Switch
                checked={settings.app.startWithSystem}
                onChange={(e) => handleSettingChange('app', 'startWithSystem', e.target.checked)}
              />
            }
            label="开机自启动"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.app.minimizeToTray}
                onChange={(e) => handleSettingChange('app', 'minimizeToTray', e.target.checked)}
              />
            }
            label="最小化到系统托盘"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.app.darkMode}
                onChange={(e) => handleSettingChange('app', 'darkMode', e.target.checked)}
              />
            }
            label="深色模式"
          />
        </FormSection>
      </SettingsContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          保存设置
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SettingsPanel;
