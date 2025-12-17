
import React, { useState } from 'react';
import { SystemConfig, QuoteStatus, IdConfig, CommissionRule, QuoteAreaRule } from '../types';
import { Plus, Trash2, Save, Settings as SettingsIcon, DollarSign, Tag, Hash, Eye, Ruler, List, Calculator, FileText, CheckSquare } from 'lucide-react';

interface CauHinhProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

const CauHinh: React.FC<CauHinhProps> = ({ config, onUpdateConfig }) => {
  // Local state to manage form inputs before saving
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [newProjectTypeName, setNewProjectTypeName] = useState('');
  const [newProjectTypeColor, setNewProjectTypeColor] = useState('#3b82f6'); // Default Blue

  // --- Cost Items Handlers ---
  const handleCostChange = (type: 'drawing' | 'newCert', id: string, field: 'name' | 'defaultPrice', value: string | number) => {
    const configKey = type === 'drawing' ? 'drawingCostItems' : 'newCertCostItems';
    const updatedCosts = localConfig[configKey].map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setLocalConfig({ ...localConfig, [configKey]: updatedCosts });
    setHasChanges(true);
  };

  const addCostItem = (type: 'drawing' | 'newCert') => {
    const configKey = type === 'drawing' ? 'drawingCostItems' : 'newCertCostItems';
    const newItem = {
      id: `COST-${Date.now()}`,
      name: 'Chi phí mới',
      defaultPrice: 0
    };
    setLocalConfig({ ...localConfig, [configKey]: [...localConfig[configKey], newItem] });
    setHasChanges(true);
  };

  const removeCostItem = (type: 'drawing' | 'newCert', id: string) => {
    const configKey = type === 'drawing' ? 'drawingCostItems' : 'newCertCostItems';
    const updatedCosts = localConfig[configKey].filter(item => item.id !== id);
    setLocalConfig({ ...localConfig, [configKey]: updatedCosts });
    setHasChanges(true);
  };

  // --- Commission Rules Handlers ---
  const handleCommissionChange = (id: string, field: keyof CommissionRule, value: number) => {
      const updatedRules = localConfig.commissionRules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      );
      setLocalConfig({ ...localConfig, commissionRules: updatedRules });
      setHasChanges(true);
  };

  const addCommissionRule = () => {
      const newRule: CommissionRule = {
          id: `RULE-${Date.now()}`,
          minArea: 0,
          maxArea: 0,
          amount: 0
      };
      setLocalConfig({ ...localConfig, commissionRules: [...localConfig.commissionRules, newRule] });
      setHasChanges(true);
  }

  const removeCommissionRule = (id: string) => {
      const updatedRules = localConfig.commissionRules.filter(rule => rule.id !== id);
      setLocalConfig({ ...localConfig, commissionRules: updatedRules });
      setHasChanges(true);
  }

  // --- Quote Area Rules Handlers ---
  const handleQuoteAreaChange = (id: string, field: keyof QuoteAreaRule, value: number) => {
      const updatedRules = (localConfig.quoteAreaRules || []).map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      );
      setLocalConfig({ ...localConfig, quoteAreaRules: updatedRules });
      setHasChanges(true);
  };

  const addQuoteAreaRule = () => {
      const newRule: QuoteAreaRule = {
          id: `QR-${Date.now()}`,
          minArea: 0,
          maxArea: 0,
          priceUrban: 0,
          priceRural: 0
      };
      setLocalConfig({ ...localConfig, quoteAreaRules: [...(localConfig.quoteAreaRules || []), newRule] });
      setHasChanges(true);
  }

  const removeQuoteAreaRule = (id: string) => {
      const updatedRules = (localConfig.quoteAreaRules || []).filter(rule => rule.id !== id);
      setLocalConfig({ ...localConfig, quoteAreaRules: updatedRules });
      setHasChanges(true);
  }

  // --- Project Types Handlers ---
  const addProjectType = () => {
      if(newProjectTypeName.trim()) {
          setLocalConfig({ 
            ...localConfig, 
            projectTypes: [
              ...(localConfig.projectTypes || []), 
              { name: newProjectTypeName.trim(), color: newProjectTypeColor }
            ] 
          });
          setNewProjectTypeName('');
          setNewProjectTypeColor('#3b82f6');
          setHasChanges(true);
      }
  }

  const removeProjectType = (name: string) => {
      setLocalConfig({ ...localConfig, projectTypes: localConfig.projectTypes.filter(t => t.name !== name) });
      setHasChanges(true);
  }

  // --- Status Labels Handlers ---
  const handleStatusLabelChange = (key: string, field: 'label' | 'color', value: string) => {
    setLocalConfig({
      ...localConfig,
      statusLabels: { 
          ...localConfig.statusLabels, 
          [key]: { ...localConfig.statusLabels[key], [field]: value } 
      }
    });
    setHasChanges(true);
  };

  // --- ID Config Handlers ---
  const handleIdConfigChange = (type: 'quote' | 'project', field: keyof IdConfig, value: any) => {
      const configKey = type === 'quote' ? 'quoteIdConfig' : 'projectIdConfig';
      setLocalConfig({
          ...localConfig,
          [configKey]: { ...localConfig[configKey], [field]: value }
      });
      setHasChanges(true);
  }

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setHasChanges(false);
    alert('Đã lưu cấu hình thành công!');
  };

  // Helper to preview ID
  const getPreviewId = (conf: IdConfig) => {
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const sep = conf.useSeparator ? conf.separator : '';
      const dateStr = conf.includeDate ? `${sep}${month}${year}` : '';
      const seq = String(1).padStart(conf.numberLength, '0');
      return `${conf.prefix}${dateStr}${sep}${seq}`;
  }

  const IdConfigSection = ({ title, type, conf }: { title: string, type: 'quote' | 'project', conf: IdConfig }) => (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-gray-800 flex items-center">
                  <Hash size={20} className="mr-2 text-indigo-600" /> {title}
              </h3>
              <div className="text-sm bg-gray-100 px-3 py-1 rounded-full flex items-center text-gray-600 font-mono">
                  <Eye size={14} className="mr-2"/>
                  {getPreviewId(conf)}
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tố (Prefix)</label>
                  <input 
                      type="text" 
                      value={conf.prefix}
                      onChange={(e) => handleIdConfigChange(type, 'prefix', e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ dài số thứ tự</label>
                  <input 
                      type="number" 
                      min="1" max="10"
                      value={conf.numberLength}
                      onChange={(e) => handleIdConfigChange(type, 'numberLength', parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
              </div>
              <div className="flex items-center space-x-2">
                   <input 
                      type="checkbox" 
                      id={`sep-${type}`}
                      checked={conf.useSeparator}
                      onChange={(e) => handleIdConfigChange(type, 'useSeparator', e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                   />
                   <label htmlFor={`sep-${type}`} className="text-sm text-gray-700">Sử dụng dấu ngăn cách</label>
              </div>
              {conf.useSeparator && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ký tự ngăn cách</label>
                      <input 
                          type="text" 
                          maxLength={1}
                          value={conf.separator}
                          onChange={(e) => handleIdConfigChange(type, 'separator', e.target.value)}
                          className="w-20 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 text-center"
                      />
                  </div>
              )}
              <div className="flex items-center space-x-2">
                   <input 
                      type="checkbox" 
                      id={`date-${type}`}
                      checked={conf.includeDate}
                      onChange={(e) => handleIdConfigChange(type, 'includeDate', e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                   />
                   <label htmlFor={`date-${type}`} className="text-sm text-gray-700">Kèm Tháng/Năm (MMYY)</label>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <SettingsIcon className="mr-2" /> Cấu hình hệ thống
        </h2>
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex items-center px-4 py-2 rounded-lg transition ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          <Save size={18} className="mr-2" /> Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {/* ID Configs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <IdConfigSection title="Cấu hình Mã Báo Giá" type="quote" conf={localConfig.quoteIdConfig} />
               <IdConfigSection title="Cấu hình Mã Hồ Sơ" type="project" conf={localConfig.projectIdConfig} />
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Cost Configuration - DRAWING */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <FileText size={20} className="mr-2 text-blue-600" /> Hạng mục RA BẢN VẼ
                    </h3>
                    <button onClick={() => addCostItem('drawing')} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 flex items-center">
                    <Plus size={14} className="mr-1" /> Thêm
                    </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {localConfig.drawingCostItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleCostChange('drawing', item.id, 'name', e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên chi phí"
                        />
                        <input 
                        type="number" 
                        value={item.defaultPrice} 
                        onChange={(e) => handleCostChange('drawing', item.id, 'defaultPrice', parseInt(e.target.value) || 0)}
                        className="w-32 border rounded px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        />
                        <button onClick={() => removeCostItem('drawing', item.id)} className="text-red-400 hover:text-red-600 p-2">
                        <Trash2 size={16} />
                        </button>
                    </div>
                    ))}
                    {localConfig.drawingCostItems.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">Chưa có cấu hình chi phí.</p>
                    )}
                </div>
            </div>

            {/* Cost Configuration - NEW CERT */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <CheckSquare size={20} className="mr-2 text-green-600" /> Hạng mục RA GIẤY MỚI
                    </h3>
                    <button onClick={() => addCostItem('newCert')} className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 flex items-center">
                    <Plus size={14} className="mr-1" /> Thêm
                    </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {localConfig.newCertCostItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleCostChange('newCert', item.id, 'name', e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên chi phí"
                        />
                        <input 
                        type="number" 
                        value={item.defaultPrice} 
                        onChange={(e) => handleCostChange('newCert', item.id, 'defaultPrice', parseInt(e.target.value) || 0)}
                        className="w-32 border rounded px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        />
                        <button onClick={() => removeCostItem('newCert', item.id)} className="text-red-400 hover:text-red-600 p-2">
                        <Trash2 size={16} />
                        </button>
                    </div>
                    ))}
                    {localConfig.newCertCostItems.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">Chưa có cấu hình chi phí.</p>
                    )}
                </div>
            </div>

            {/* Project Types Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <List size={20} className="mr-2 text-purple-600" /> Loại hồ sơ (Project Types)
                    </h3>
                </div>
                <div className="flex gap-2 mb-4">
                     <input 
                        type="text" 
                        value={newProjectTypeName} 
                        onChange={(e) => setNewProjectTypeName(e.target.value)}
                        placeholder="Nhập loại hồ sơ mới..."
                        className="flex-1 border rounded px-3 py-2 text-sm"
                     />
                     <input 
                        type="color" 
                        value={newProjectTypeColor} 
                        onChange={(e) => setNewProjectTypeColor(e.target.value)}
                        className="h-9 w-12 p-0 border rounded cursor-pointer"
                        title="Chọn màu"
                     />
                     <button onClick={addProjectType} className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">Thêm</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(localConfig.projectTypes || []).map((type, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                        <div className="flex items-center space-x-2">
                             <span className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }}></span>
                             <span className="text-sm font-medium">{type.name}</span>
                        </div>
                        <button onClick={() => removeProjectType(type.name)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={14} />
                        </button>
                    </div>
                    ))}
                    {(!localConfig.projectTypes || localConfig.projectTypes.length === 0) && (
                        <p className="text-sm text-gray-400 italic text-center">Chưa có loại hồ sơ nào.</p>
                    )}
                </div>
            </div>

             {/* Technician Commission Config */}
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Ruler size={20} className="mr-2 text-orange-600" /> Định mức lương khoán Kỹ thuật
                    </h3>
                    <button onClick={addCommissionRule} className="text-sm bg-orange-50 text-orange-700 px-2 py-1 rounded hover:bg-orange-100 flex items-center">
                    <Plus size={14} className="mr-1" /> Thêm định mức
                    </button>
                </div>
                <div className="space-y-3">
                    {/* Fixed Layout for Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-1 px-1">
                        <div className="col-span-3">Diện tích từ (m²)</div>
                        <div className="col-span-3">Đến (m²)</div>
                        <div className="col-span-5">Đơn giá (VNĐ)</div>
                        <div className="col-span-1"></div>
                    </div>
                    {localConfig.commissionRules.map((rule) => (
                    <div key={rule.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                            <input 
                                type="number" 
                                value={rule.minArea} 
                                onChange={(e) => handleCommissionChange(rule.id, 'minArea', parseFloat(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" 
                                value={rule.maxArea} 
                                onChange={(e) => handleCommissionChange(rule.id, 'maxArea', parseFloat(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-5">
                            <input 
                                type="number" 
                                value={rule.amount} 
                                onChange={(e) => handleCommissionChange(rule.id, 'amount', parseInt(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                        <div className="col-span-1 text-center">
                            <button onClick={() => removeCommissionRule(rule.id)} className="text-red-400 hover:text-red-600 p-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    ))}
                    {localConfig.commissionRules.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">Chưa có định mức.</p>
                    )}
                </div>
            </div>

            {/* Quote Price by Area Config */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Calculator size={20} className="mr-2 text-blue-600" /> Bảng giá Báo giá (Đô thị / Ngoài Đô thị)
                    </h3>
                    <button onClick={addQuoteAreaRule} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 flex items-center">
                    <Plus size={14} className="mr-1" /> Thêm mức
                    </button>
                </div>
                <div className="space-y-3">
                    {/* Fixed Layout for Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-1 px-1">
                        <div className="col-span-2">Từ (m²)</div>
                        <div className="col-span-2">Đến (m²)</div>
                        <div className="col-span-3 text-right">Giá Đô Thị</div>
                        <div className="col-span-3 text-right">Giá Ngoài ĐT</div>
                        <div className="col-span-1"></div>
                    </div>
                    {(localConfig.quoteAreaRules || []).map((rule) => (
                    <div key={rule.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                value={rule.minArea} 
                                onChange={(e) => handleQuoteAreaChange(rule.id, 'minArea', parseFloat(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                value={rule.maxArea} 
                                onChange={(e) => handleQuoteAreaChange(rule.id, 'maxArea', parseFloat(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" 
                                value={rule.priceUrban} 
                                onChange={(e) => handleQuoteAreaChange(rule.id, 'priceUrban', parseInt(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 font-medium text-blue-600"
                                placeholder="Đô thị"
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" 
                                value={rule.priceRural} 
                                onChange={(e) => handleQuoteAreaChange(rule.id, 'priceRural', parseInt(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 font-medium text-green-600"
                                placeholder="Ngoài ĐT"
                            />
                        </div>
                        <div className="col-span-1 text-center">
                            <button onClick={() => removeQuoteAreaRule(rule.id)} className="text-red-400 hover:text-red-600 p-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    ))}
                    {(!localConfig.quoteAreaRules || localConfig.quoteAreaRules.length === 0) && (
                        <p className="text-sm text-gray-400 italic text-center py-4">Chưa có định mức giá báo giá.</p>
                    )}
                </div>
            </div>

            {/* Status Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="mb-4 pb-2 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Tag size={20} className="mr-2 text-blue-600" /> Cấu hình Trạng thái Báo giá
                    </h3>
                </div>
                <div className="space-y-4">
                    {/* Draft */}
                    <div className="flex items-center gap-4">
                        <span className="w-1/3 text-sm font-medium text-gray-600">Nháp (Draft)</span>
                        <input 
                            type="text" 
                            value={localConfig.statusLabels[QuoteStatus.DRAFT].label} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.DRAFT, 'label', e.target.value)}
                            className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                        <input 
                            type="color" 
                            value={localConfig.statusLabels[QuoteStatus.DRAFT].color} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.DRAFT, 'color', e.target.value)}
                            className="h-9 w-12 p-0 border rounded cursor-pointer"
                        />
                    </div>
                    {/* Pending */}
                    <div className="flex items-center gap-4">
                        <span className="w-1/3 text-sm font-medium text-gray-600">Chờ duyệt</span>
                         <input 
                            type="text" 
                            value={localConfig.statusLabels[QuoteStatus.PENDING_APPROVAL].label} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.PENDING_APPROVAL, 'label', e.target.value)}
                            className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                         <input 
                            type="color" 
                            value={localConfig.statusLabels[QuoteStatus.PENDING_APPROVAL].color} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.PENDING_APPROVAL, 'color', e.target.value)}
                            className="h-9 w-12 p-0 border rounded cursor-pointer"
                        />
                    </div>
                    {/* Approved */}
                    <div className="flex items-center gap-4">
                        <span className="w-1/3 text-sm font-medium text-gray-600">Đã duyệt (Director)</span>
                         <input 
                            type="text" 
                            value={localConfig.statusLabels[QuoteStatus.APPROVED].label} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.APPROVED, 'label', e.target.value)}
                            className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                         <input 
                            type="color" 
                            value={localConfig.statusLabels[QuoteStatus.APPROVED].color} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.APPROVED, 'color', e.target.value)}
                            className="h-9 w-12 p-0 border rounded cursor-pointer"
                        />
                    </div>
                    {/* Rejected */}
                    <div className="flex items-center gap-4">
                        <span className="w-1/3 text-sm font-medium text-gray-600">Từ chối / Hủy</span>
                         <input 
                            type="text" 
                            value={localConfig.statusLabels[QuoteStatus.REJECTED].label} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.REJECTED, 'label', e.target.value)}
                            className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                         <input 
                            type="color" 
                            value={localConfig.statusLabels[QuoteStatus.REJECTED].color} 
                            onChange={(e) => handleStatusLabelChange(QuoteStatus.REJECTED, 'color', e.target.value)}
                            className="h-9 w-12 p-0 border rounded cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CauHinh;
