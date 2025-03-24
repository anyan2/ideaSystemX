import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SettingsPage = ({ settings, onUpdateSettings }) => {
  const [formValues, setFormValues] = useState({
    theme: 'light',
    startWithSystem: true,
    minimizeToTray: true,
    ai: {
      provider: '',
      apiKey: '',
      model: '',
      embeddingModel: '',
      endpoint: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // 从配置文件加载AI提供商列表
  const [aiProviders, setAiProviders] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [requiresEndpoint, setRequiresEndpoint] = useState(false);

  useEffect(() => {
    // 加载配置
    const loadConfig = async () => {
      try {
        // 在实际应用中，这里会从主进程获取配置
        const config = await import('../common/config');
        setAiProviders(config.aiProviders);
      } catch (err) {
        console.error('加载配置失败:', err);
        setError('加载配置失败');
      }
    };

    loadConfig();
  }, []);

  // 当settings prop变化时更新表单
  useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);

  // 当AI提供商变化时更新模型列表
  useEffect(() => {
    const provider = aiProviders.find(p => p.id === formValues.ai.provider);
    if (provider) {
      setAiModels(provider.models);
      setEmbeddingModels(provider.embeddingModels);
      setRequiresEndpoint(provider.requiresEndpoint);
    } else {
      setAiModels([]);
      setEmbeddingModels([]);
      setRequiresEndpoint(false);
    }
  }, [formValues.ai.provider, aiProviders]);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name.startsWith('ai.')) {
      const aiField = name.split('.')[1];
      setFormValues({
        ...formValues,
        ai: {
          ...formValues.ai,
          [aiField]: value
        }
      });
    } else if (name === 'theme' || name === 'startWithSystem' || name === 'minimizeToTray') {
      setFormValues({
        ...formValues,
        [name]: e.target.type === 'checkbox' ? checked : value
      });
    }
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      
      // 验证AI设置
      if (formValues.ai.provider && !formValues.ai.apiKey) {
        setError('请输入API密钥');
        setSaving(false);
        return;
      }
      
      if (formValues.ai.provider && !formValues.ai.model) {
        setError('请选择AI模型');
        setSaving(false);
        return;
      }
      
      if (requiresEndpoint && !formValues.ai.endpoint) {
        setError('请输入API端点');
        setSaving(false);
        return;
      }
      
      // 更新设置
      await onUpdateSettings(formValues);
      
      setSuccess(true);
      setSaving(false);
      
      // 3秒后隐藏成功消息
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('保存设置失败:', err);
      setError('保存设置失败: ' + err.message);
      setSaving(false);
    }
  };

  // 返回主页
  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        设置
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          设置已保存
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="应用设置" />
            <CardContent>
              <FormControl fullWidth margin="normal">
                <InputLabel id="theme-label">主题</InputLabel>
                <Select
                  labelId="theme-label"
                  name="theme"
                  value={formValues.theme}
                  onChange={handleChange}
                  label="主题"
                >
                  <MenuItem value="light">浅色</MenuItem>
                  <MenuItem value="dark">深色</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.startWithSystem}
                    onChange={handleChange}
                    name="startWithSystem"
                  />
                }
                label="随系统启动"
                sx={{ mt: 2, display: 'block' }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.minimizeToTray}
                    onChange={handleChange}
                    name="minimizeToTray"
                  />
                }
                label="关闭窗口时最小化到系统托盘"
                sx={{ mt: 1, display: 'block' }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="AI设置" 
              action={
                <IconButton aria-label="info">
                  <InfoIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                配置AI服务以启用智能分析、关联和提醒功能。即使不配置AI，基本的记录和查询功能仍然可用。
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="ai-provider-label">AI提供商</InputLabel>
                <Select
                  labelId="ai-provider-label"
                  name="ai.provider"
                  value={formValues.ai.provider}
                  onChange={handleChange}
                  label="AI提供商"
                >
                  <MenuItem value="">无（不使用AI功能）</MenuItem>
                  {aiProviders.map(provider => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {formValues.ai.provider && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="API密钥"
                    name="ai.apiKey"
                    type="password"
                    value={formValues.ai.apiKey}
                    onChange={handleChange}
                  />
                  
                  {requiresEndpoint && (
                    <TextField
                      fullWidth
                      margin="normal"
                      label="API端点"
                      name="ai.endpoint"
                      value={formValues.ai.endpoint}
                      onChange={handleChange}
                      placeholder="https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name"
                    />
                  )}
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="ai-model-label">AI模型</InputLabel>
                    <Select
                      labelId="ai-model-label"
                      name="ai.model"
                      value={formValues.ai.model}
                      onChange={handleChange}
                      label="AI模型"
                    >
                      {aiModels.map(model => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {embeddingModels.length > 0 && (
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="embedding-model-label">嵌入模型</InputLabel>
                      <Select
                        labelId="embedding-model-label"
                        name="ai.embeddingModel"
                        value={formValues.ai.embeddingModel}
                        onChange={handleChange}
                        label="嵌入模型"
                      >
                        {embeddingModels.map(model => (
                          <MenuItem key={model.id} value={model.id}>
                            {model.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handleBack}>
          返回
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage;
