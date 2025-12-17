
import React, { useState, useEffect } from 'react';
import { Quote, QuoteStatus, QuoteType, Customer, User, Role, SystemConfig, QuoteItem, Attachment } from '../types';
import { FilePlus, Send, CheckSquare, XSquare, Eye, Edit, Trash2, Plus, X, Clock, Check, FileText, Upload, Paperclip, File as FileIcon, Image as ImageIcon, Loader2, Search, UserCheck, CheckCircle } from 'lucide-react';
import { uploadFile } from '../utils';

interface BaoGiaProps {
  quotes: Quote[];
  customers: Customer[];
  currentUser: User;
  systemConfig: SystemConfig;
  directors: User[]; // Pass directors list to find who to notify
  onAddQuote: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
  onNotify: (userId: string, title: string, message: string) => void; // Notification handler
}

const BaoGia: React.FC<BaoGiaProps> = ({ 
  quotes, 
  customers, 
  currentUser, 
  systemConfig,
  directors,
  onAddQuote, 
  onUpdateQuote,
  onNotify
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    customerId: string;
    status: QuoteStatus;
    type: QuoteType;
    items: QuoteItem[];
    attachments: Attachment[]; // Added attachments
    area: number; // Diện tích để tính tiền
    landType: 'URBAN' | 'RURAL'; // Loại đất
    locationPrice: number; // Giá vị trí đất
    isCustomerAccepted: boolean;
  }>({
    customerId: '',
    status: QuoteStatus.DRAFT,
    type: 'DRAWING',
    items: [],
    attachments: [],
    area: 0,
    landType: 'URBAN',
    locationPrice: 0,
    isCustomerAccepted: false,
  });

  const [isUploading, setIsUploading] = useState(false);

  // Helper to get default items based on type
  // CRITICAL FIX: Ensure we access the correct config array based on type
  const getDefaultItems = (type: QuoteType) => {
      const configKey = type === 'DRAWING' ? 'drawingCostItems' : 'newCertCostItems';
      // Safety check in case config is not fully loaded yet
      const items = systemConfig[configKey] || []; 
      return items.map(conf => ({
          id: conf.id, 
          name: conf.name,
          price: conf.defaultPrice,
          isEnabled: true, // Default to true
          isCustom: false
      }));
  };

  // Init form data when opening modal
  useEffect(() => {
    if (isModalOpen) {
      if (editingQuote) {
        setFormData({
          customerId: editingQuote.customerId,
          status: editingQuote.status,
          type: editingQuote.type || 'DRAWING', // Default fallback
          items: JSON.parse(JSON.stringify(editingQuote.items)), // Deep copy
          attachments: editingQuote.attachments || [],
          area: editingQuote.area || 0,
          landType: editingQuote.landType || 'URBAN',
          locationPrice: editingQuote.locationPrice || 0,
          isCustomerAccepted: editingQuote.isCustomerAccepted || false
        });
      } else {
        // Create New
        // FIX: Explicitly call getDefaultItems with 'DRAWING' (default type)
        const initialItems = getDefaultItems('DRAWING');
        setFormData({
          customerId: customers.length > 0 ? customers[0].id : '',
          status: QuoteStatus.DRAFT,
          type: 'DRAWING', // Default Type
          items: initialItems, 
          attachments: [],
          area: 0,
          landType: 'URBAN',
          locationPrice: 0,
          isCustomerAccepted: false
        });
      }
    }
  }, [isModalOpen, editingQuote, customers, systemConfig]); // Added systemConfig to dependencies to react to config load

  // --- Handlers ---
  
  const handleTypeChange = (newType: QuoteType) => {
      if (isStrictlyLocked) return;
      
      // If items were modified, ask for confirmation? (Optional, kept simple here)
      // We just reload the default items for the new type
      setFormData(prev => ({
          ...prev,
          type: newType,
          items: getDefaultItems(newType)
      }));
  }

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // Logic: Auto-calculate Price based on Area OR Land Type change
  const calculateQuotePrice = (area: number, type: 'URBAN' | 'RURAL') => {
      const rule = systemConfig.quoteAreaRules?.find(r => area >= r.minArea && area <= r.maxArea);
      if (!rule) return 0;
      return type === 'URBAN' ? rule.priceUrban : rule.priceRural;
  };

  // Helper function to update auto-calculated items (Inspection Fee, Tax)
  const updateAutoCalculatedItems = (items: QuoteItem[], area: number, landType: 'URBAN' | 'RURAL', locationPrice: number) => {
      // 1. Calculate Base Survey Price
      const surveyPrice = calculateQuotePrice(area, landType);
      
      // Find Survey Item (ID '1') and Minutes Item (ID '3') for Inspection Fee logic
      const surveyItem = items.find(i => i.id === '1');
      const minutesItem = items.find(i => i.id === '3');
      const surveyCost = surveyItem?.isEnabled ? surveyPrice : 0;
      const minutesCost = minutesItem?.isEnabled ? (minutesItem.price || 0) : 0;

      return items.map(item => {
          // A. Update "Đo đạc hiện trạng" (ID '1')
          if (item.id === '1') {
              return { ...item, price: surveyPrice };
          }
          // B. Update "Phí kiểm tra bản vẽ" (ID '5') = (Đo đạc + Kí BB) * 25%
          if (item.id === '5') {
              const totalForInspect = surveyCost + minutesCost;
              return { ...item, price: totalForInspect * 0.25 };
          }
          // C. Update "Thuế Chuyển nhượng" (ID '16') = (DT * 2.5) * ViTri
          if (item.id === '16') {
              return { ...item, price: (area * 2.5) * locationPrice };
          }
          // D. Update "Thuế Chuyển MĐSD" (ID '19') = DT * ViTri
          if (item.id === '19') {
              return { ...item, price: area * locationPrice };
          }
          return item;
      });
  }

  const handleAreaChange = (newArea: number) => {
      const updatedItems = updateAutoCalculatedItems(formData.items, newArea, formData.landType, formData.locationPrice);
      setFormData(prev => ({ ...prev, area: newArea, items: updatedItems }));
  }

  const handleLandTypeChange = (newType: 'URBAN' | 'RURAL') => {
      const updatedItems = updateAutoCalculatedItems(formData.items, formData.area, newType, formData.locationPrice);
      setFormData(prev => ({ ...prev, landType: newType, items: updatedItems }));
  }

  const handleLocationPriceChange = (newPrice: number) => {
      const updatedItems = updateAutoCalculatedItems(formData.items, formData.area, formData.landType, newPrice);
      setFormData(prev => ({ ...prev, locationPrice: newPrice, items: updatedItems }));
  }

  // Also re-trigger calculation when toggling specific items (like Survey or Minutes)
  const handleItemToggle = (index: number, checked: boolean) => {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], isEnabled: checked };
      
      // If toggling items that affect calculation, we need to recalc others
      const recalcedItems = updateAutoCalculatedItems(newItems, formData.area, formData.landType, formData.locationPrice);
      setFormData({ ...formData, items: recalcedItems });
  }

  const handleAddCustomItem = () => {
    const newItem: QuoteItem = {
      id: `CUSTOM-${Date.now()}`,
      name: 'Chi phí khác',
      price: 0,
      isEnabled: true,
      isCustom: true
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return item.isEnabled ? sum + item.price : sum;
    }, 0);
  };

  // --- File Upload Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const files = Array.from(e.target.files);
          const newAttachments: Attachment[] = [];

          try {
            for (const file of files) {
                const url = await uploadFile(file);
                const isPdf = file.type === 'application/pdf';
                
                newAttachments.push({
                    id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: isPdf ? 'PDF' : 'IMAGE',
                    url: url,
                    uploadDate: new Date().toISOString().split('T')[0]
                });
            }
            setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
          } catch (error) {
              alert("Lỗi khi tải file lên.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleRemoveAttachment = (id: string) => {
      setFormData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  }

  const generateNewId = () => {
      const conf = systemConfig.quoteIdConfig;
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const sep = conf.useSeparator ? conf.separator : '';
      const dateStr = conf.includeDate ? `${sep}${month}${year}` : '';
      
      // Simple Sequence Mock: Count existing + 1 + Random for uniqueness in demo
      const seqNum = quotes.length + 1; 
      const seqStr = String(seqNum).padStart(conf.numberLength, '0');
      
      return `${conf.prefix}${dateStr}${sep}${seqStr}`;
  }

  const handleSubmit = (e: React.FormEvent, overrideStatus?: QuoteStatus) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    const totalAmount = calculateTotal();
    const finalStatus = overrideStatus || formData.status;
    let quoteId = editingQuote ? editingQuote.id : generateNewId();

    // Auto-save logic
    if (editingQuote) {
        onUpdateQuote({
            ...editingQuote,
            customerId: formData.customerId,
            customerName: customer?.name || 'Unknown',
            status: finalStatus,
            type: formData.type,
            items: formData.items,
            totalAmount: totalAmount,
            attachments: formData.attachments,
            area: formData.area,
            landType: formData.landType,
            locationPrice: formData.locationPrice,
            isCustomerAccepted: formData.isCustomerAccepted
        });
    } else {
        onAddQuote({
            id: quoteId,
            customerId: formData.customerId,
            customerName: customer?.name || 'Unknown',
            status: finalStatus,
            type: formData.type,
            createdDate: new Date().toISOString().split('T')[0],
            items: formData.items,
            totalAmount: totalAmount,
            attachments: formData.attachments,
            area: formData.area,
            landType: formData.landType,
            locationPrice: formData.locationPrice,
            isCustomerAccepted: false
        });
    }

    // Trigger Notification for Director if Status is PENDING_APPROVAL
    if (finalStatus === QuoteStatus.PENDING_APPROVAL) {
        // Find Director (In real app, filter by office. Here, assume first Director or broadcast)
        const director = directors.find(d => d.role === Role.DIRECTOR); 
        if (director) {
            onNotify(
                director.id, 
                'Duyệt Báo giá', 
                `Kế toán gửi duyệt báo giá ${quoteId} - ${formatCurrency(totalAmount)}đ`
            );
            console.log(`[SYSTEM] Sent notification to ${director.email}`);
        }
    }

    setIsModalOpen(false);
  };

  // Quick Action for Customer Acceptance (from Table)
  const toggleCustomerAccepted = (quote: Quote) => {
      const updated = { ...quote, isCustomerAccepted: !quote.isCustomerAccepted };
      onUpdateQuote(updated);
  }

  // Helper function to format number with dots
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN');
  };

  // Helper function to parse formatted string back to number
  const parseCurrency = (str: string) => {
    return parseInt(str.replace(/\./g, '')) || 0;
  };

  // Logic locks
  const isDirector = currentUser.role === Role.DIRECTOR;
  const isAccountant = currentUser.role === Role.ACCOUNTANT;
  const isApproved = editingQuote?.status === QuoteStatus.APPROVED;
  const isPending = editingQuote?.status === QuoteStatus.PENDING_APPROVAL;
  
  // Strict Lock: If approved, no one can edit details (except customer accepted status toggle by director/accountant)
  const isStrictlyLocked = isApproved;

  const getStatusBadge = (status: QuoteStatus) => {
    const statusConfig = systemConfig.statusLabels[status];
    const label = statusConfig ? statusConfig.label : status;
    // Use configured color
    const color = statusConfig ? statusConfig.color : '#6b7280';
    return (
        <span 
            className="px-2 py-1 rounded text-xs font-medium border"
            style={{ 
                backgroundColor: `${color}20`, 
                color: color, 
                borderColor: `${color}40`
            }}
        >
            {label}
        </span>
    );
  };

  // Filter Quotes
  const filteredQuotes = quotes.filter(q => 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Báo giá & Hợp đồng</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm mã, khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
            </div>
            <button 
                onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shrink-0"
            >
                <FilePlus size={18} className="mr-2" /> Tạo báo giá
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
                <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mã BG</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Tổng tiền</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{quote.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        {quote.type === 'DRAWING' ? 'Ra Bản Vẽ' : 'Ra Giấy Mới'}
                    </td>
                    <td className="px-6 py-4">{quote.customerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{quote.createdDate}</td>
                    <td className="px-6 py-4 text-right font-medium text-lg">{formatCurrency(quote.totalAmount)} đ</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                            {getStatusBadge(quote.status)}
                            {quote.status === QuoteStatus.APPROVED && (
                                <button 
                                    onClick={() => toggleCustomerAccepted(quote)}
                                    className={`text-xs px-2 py-0.5 rounded-full flex items-center w-fit border transition cursor-pointer ${
                                        quote.isCustomerAccepted 
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }`}
                                    title="Click để đổi trạng thái"
                                >
                                    {quote.isCustomerAccepted ? <CheckCircle size={10} className="mr-1"/> : <UserCheck size={10} className="mr-1"/>} 
                                    {quote.isCustomerAccepted ? 'Khách chốt' : 'Chưa chốt'}
                                </button>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex space-x-3 text-gray-500">
                        <button 
                        onClick={() => { setEditingQuote(quote); setIsModalOpen(true); }}
                        className="hover:text-blue-600 flex items-center" 
                        title={quote.status === QuoteStatus.APPROVED ? "Xem chi tiết / Cập nhật chốt" : "Sửa / Duyệt"}
                        >
                        {quote.status === QuoteStatus.APPROVED ? <Eye size={18}/> : <Edit size={18}/>}
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Modern Modal Create/Edit Quote */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
            
            {/* 1. Header with Workflow Status */}
            <div className="px-6 py-4 border-b bg-gray-50 flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingQuote ? `Báo giá #${editingQuote.id}` : 'Tạo Báo giá mới'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {editingQuote ? `Ngày tạo: ${editingQuote.createdDate}` : 'Vui lòng điền thông tin bên dưới'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Workflow Steps Visual */}
                <div className="flex items-center w-full max-w-2xl mx-auto">
                    {/* Step 1: Draft */}
                    <div className={`flex flex-col items-center flex-1 ${formData.status === QuoteStatus.DRAFT ? 'text-blue-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${formData.status === QuoteStatus.DRAFT ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-300 bg-white'}`}>1</div>
                        <span className="text-xs font-medium">Nháp (Draft)</span>
                    </div>
                    <div className={`flex-1 h-0.5 ${formData.status !== QuoteStatus.DRAFT ? 'bg-blue-600' : 'bg-gray-300'}`}></div>

                    {/* Step 2: Pending Approval */}
                    <div className={`flex flex-col items-center flex-1 ${formData.status === QuoteStatus.PENDING_APPROVAL ? 'text-yellow-600' : (formData.status === QuoteStatus.APPROVED || formData.status === QuoteStatus.REJECTED ? 'text-gray-500' : 'text-gray-400')}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${formData.status === QuoteStatus.PENDING_APPROVAL ? 'border-yellow-500 bg-yellow-50 font-bold' : (formData.status === QuoteStatus.APPROVED || formData.status === QuoteStatus.REJECTED ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white')}`}>
                            {formData.status === QuoteStatus.APPROVED || formData.status === QuoteStatus.REJECTED ? <Check size={16}/> : '2'}
                        </div>
                        <span className="text-xs font-medium">Chờ duyệt</span>
                    </div>
                    <div className={`flex-1 h-0.5 ${formData.status === QuoteStatus.APPROVED || formData.status === QuoteStatus.REJECTED ? 'bg-blue-600' : 'bg-gray-300'}`}></div>

                    {/* Step 3: Approved/Rejected */}
                    <div className={`flex flex-col items-center flex-1 ${formData.status === QuoteStatus.APPROVED ? 'text-green-600' : (formData.status === QuoteStatus.REJECTED ? 'text-red-600' : 'text-gray-400')}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${formData.status === QuoteStatus.APPROVED ? 'border-green-600 bg-green-50' : (formData.status === QuoteStatus.REJECTED ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white')}`}>
                            {formData.status === QuoteStatus.APPROVED ? <Check size={16}/> : (formData.status === QuoteStatus.REJECTED ? <X size={16}/> : '3')}
                        </div>
                        <span className="text-xs font-medium">
                            {formData.status === QuoteStatus.REJECTED ? 'Từ chối' : 'Hoàn tất'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* 2. Body */}
            <form id="quote-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              
              {/* Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                   <select 
                     disabled={isStrictlyLocked}
                     required
                     value={formData.customerId}
                     onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                     className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                   >
                     <option value="">-- Chọn khách hàng --</option>
                     {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ngày lập</label>
                   <div className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-700 flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400"/>
                        {editingQuote ? editingQuote.createdDate : new Date().toISOString().split('T')[0]}
                   </div>
                </div>
              </div>

              {/* Area Input for Auto-calculation */}
              {!isStrictlyLocked && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                          <div className="flex-1">
                              <label className="block text-sm font-bold text-blue-800 mb-1">Nhập Diện tích (m²)</label>
                              <input 
                                  type="number" 
                                  step="0.1"
                                  value={formData.area || ''}
                                  onChange={(e) => handleAreaChange(parseFloat(e.target.value) || 0)}
                                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono text-blue-900"
                                  placeholder="Nhập diện tích..."
                              />
                          </div>
                          <div className="flex-1">
                              <label className="block text-sm font-bold text-blue-800 mb-1">Giá vị trí đất (VNĐ/m²)</label>
                              <input 
                                  type="text" 
                                  value={formatCurrency(formData.locationPrice)}
                                  onChange={(e) => handleLocationPriceChange(parseCurrency(e.target.value))}
                                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono text-blue-900"
                                  placeholder="Nhập giá đất..."
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Khu vực</label>
                              <div className="flex items-center space-x-4 bg-white border rounded px-3 py-2">
                                  <label className="flex items-center cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name="landType" 
                                        value="URBAN" 
                                        checked={formData.landType === 'URBAN'}
                                        onChange={() => handleLandTypeChange('URBAN')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Đô thị</span>
                                  </label>
                                  <label className="flex items-center cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name="landType" 
                                        value="RURAL" 
                                        checked={formData.landType === 'RURAL'}
                                        onChange={() => handleLandTypeChange('RURAL')}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Ngoài Đô thị</span>
                                  </label>
                              </div>
                          </div>
                      </div>
                      <div className="text-xs text-blue-600 italic border-t border-blue-100 pt-2">
                          * Hệ thống tự động tính: 
                          <span className="font-semibold mx-1">Phí đo đạc</span>, 
                          <span className="font-semibold mx-1">Phí kiểm tra (25%)</span>, 
                          <span className="font-semibold mx-1">Thuế CN (DT*2.5*Giá)</span> và 
                          <span className="font-semibold mx-1">Thuế CMĐSD (DT*Giá)</span>.
                      </div>
                  </div>
              )}

              {/* Items Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-4">
                      <h4 className="font-bold text-gray-800 flex items-center">
                        Chi tiết hạng mục & Chi phí
                      </h4>
                      {/* TYPE SWITCHER */}
                      {!isStrictlyLocked && (
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                              <button 
                                type="button"
                                onClick={() => handleTypeChange('DRAWING')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition ${formData.type === 'DRAWING' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                  Ra Bản Vẽ
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleTypeChange('NEW_CERTIFICATE')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition ${formData.type === 'NEW_CERTIFICATE' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                  Ra Giấy Mới
                              </button>
                          </div>
                      )}
                  </div>
                  {!isStrictlyLocked && (
                    <button 
                        type="button" 
                        onClick={handleAddCustomItem}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center transition"
                    >
                        <Plus size={14} className="mr-1"/> Thêm dòng khác
                    </button>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center">#</th>
                                <th className="px-4 py-3 text-left">Nội dung công việc</th>
                                <th className="px-4 py-3 w-48 text-right">Đơn giá (VNĐ)</th>
                                {!isStrictlyLocked && <th className="px-4 py-3 w-12"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {formData.items.map((item, index) => (
                                <tr key={index} className={!item.isEnabled ? 'bg-gray-50/50' : 'hover:bg-gray-50 transition'}>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox"
                                            disabled={isStrictlyLocked}
                                            checked={item.isEnabled}
                                            onChange={(e) => handleItemToggle(index, e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.isCustom && !isStrictlyLocked ? (
                                            <input 
                                                type="text" 
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-1"
                                                placeholder="Nhập tên loại chi phí..."
                                            />
                                        ) : (
                                            <span className={`${item.isEnabled ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>{item.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="text" 
                                            disabled={isStrictlyLocked || !item.isEnabled}
                                            value={formatCurrency(item.price)}
                                            onChange={(e) => handleItemChange(index, 'price', parseCurrency(e.target.value))}
                                            className="w-full text-right border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-none disabled:text-gray-500 font-mono"
                                        />
                                    </td>
                                    {!isStrictlyLocked && (
                                        <td className="px-4 py-3 text-center">
                                            {item.isCustom && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t">
                            <tr>
                                <td colSpan={2} className="px-4 py-4 text-right text-gray-700 font-bold">Tổng thành tiền:</td>
                                <td className="px-4 py-4 text-right text-blue-700 text-xl font-bold font-mono">
                                    {formatCurrency(calculateTotal())} đ
                                </td>
                                {!isStrictlyLocked && <td></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
              </div>

               {/* Attachments Section */}
               <div className="mb-4">
                 <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                     <Paperclip size={18} className="mr-2"/> Tài liệu đính kèm (Sổ đỏ, Giấy tờ đất...)
                 </h4>
                 <div className="bg-gray-50 p-3 rounded border border-gray-200">
                     {!isStrictlyLocked && (
                        <div className="flex gap-2 mb-3">
                             <div className="relative flex-1">
                                 <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*,application/pdf"
                                    multiple
                                    onChange={handleFileChange}
                                 />
                                 <div className="border rounded px-3 py-2 text-sm bg-white text-gray-500 text-center flex items-center justify-center hover:bg-gray-100 cursor-pointer">
                                     <Upload size={16} className="mr-2"/> 
                                     {isUploading ? "Đang tải lên..." : "Click để tải ảnh/Sổ đỏ"}
                                 </div>
                             </div>
                        </div>
                     )}
                     <div className="space-y-1">
                         {(formData.attachments || []).map(att => (
                             <div key={att.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                                 <div className="flex items-center overflow-hidden">
                                     {att.type === 'PDF' ? <FileIcon size={14} className="text-red-500 mr-2 shrink-0"/> : <ImageIcon size={14} className="text-blue-500 mr-2 shrink-0"/>}
                                     <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center truncate">
                                         {att.name}
                                         <Eye size={12} className="ml-2 text-gray-400 hover:text-blue-600"/>
                                     </a>
                                 </div>
                                 {!isStrictlyLocked && (
                                    <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={14}/>
                                    </button>
                                 )}
                             </div>
                         ))}
                         {isUploading && (
                             <div className="text-xs text-blue-600 flex items-center animate-pulse">
                                 <Loader2 size={12} className="mr-1 animate-spin" /> Đang xử lý file...
                             </div>
                         )}
                         {!isUploading && (formData.attachments || []).length === 0 && <p className="text-xs text-gray-400 italic">Chưa có tài liệu nào.</p>}
                     </div>
                 </div>
               </div>

            </form>
            
            {/* 3. Action Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                 {/* Left status info */}
                 <div className="text-sm text-gray-500 italic">
                    {isStrictlyLocked ? 'Báo giá đã duyệt.' : ''}
                 </div>

                 {/* Right Action Buttons */}
                 <div className="flex space-x-3">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                    >
                        Đóng
                    </button>
                    
                    {/* LOGIC FOR ACCOUNTANT / STAFF */}
                    {!isDirector && !isStrictlyLocked && (
                         <>
                            {/* Save Draft Button */}
                            <button 
                                onClick={(e) => handleSubmit(e, QuoteStatus.DRAFT)}
                                className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 font-medium"
                            >
                                Lưu Nháp
                            </button>
                            {/* Submit Button */}
                            <button 
                                onClick={(e) => handleSubmit(e, QuoteStatus.PENDING_APPROVAL)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-bold shadow-md"
                            >
                                <Send size={18} className="mr-2" /> Trình Giám Đốc
                            </button>
                         </>
                    )}

                    {/* LOGIC FOR DIRECTOR */}
                    {isDirector && isPending && (
                        <>
                            <button 
                                onClick={(e) => handleSubmit(e, QuoteStatus.REJECTED)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium flex items-center"
                            >
                                <XSquare size={18} className="mr-2" /> Từ chối / Trả lại
                            </button>
                            <button 
                                onClick={(e) => handleSubmit(e, QuoteStatus.APPROVED)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md flex items-center"
                            >
                                <CheckSquare size={18} className="mr-2" /> Phê Duyệt & Ký
                            </button>
                        </>
                    )}

                    {/* If Approved, show Toggle Customer Acceptance */}
                    {isApproved && (
                        <button 
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({...prev, isCustomerAccepted: !prev.isCustomerAccepted}));
                                // Trigger save immediately
                                setTimeout(() => document.getElementById('quote-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 100);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center shadow-sm border ${formData.isCustomerAccepted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            {formData.isCustomerAccepted ? <CheckCircle size={18} className="mr-2"/> : <UserCheck size={18} className="mr-2"/>}
                            {formData.isCustomerAccepted ? 'Khách Đã Chốt' : 'Đánh dấu Khách Chốt'}
                        </button>
                    )}

                    {/* If Draft, Director can also just save/edit */}
                    {isDirector && !isPending && !isStrictlyLocked && (
                         <button 
                            onClick={(e) => handleSubmit(e, formData.status)} // Keep current status
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"
                        >
                            Lưu Thay Đổi
                        </button>
                    )}
                 </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaoGia;
