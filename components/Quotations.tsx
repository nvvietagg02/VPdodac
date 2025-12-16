import React, { useState, useEffect } from 'react';
import { Quote, QuoteStatus, Customer, User, Role, SystemConfig, QuoteItem } from '../types';
import { FilePlus, Send, CheckSquare, XSquare, Eye, Edit, Trash2, Plus, X, Clock, Check, FileText } from 'lucide-react';

interface QuotationsProps {
  quotes: Quote[];
  customers: Customer[];
  currentUser: User;
  systemConfig: SystemConfig;
  directors: User[]; // Pass directors list to find who to notify
  onAddQuote: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
  onNotify: (userId: string, title: string, message: string) => void; // Notification handler
}

const Quotations: React.FC<QuotationsProps> = ({ 
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

  // Form State
  const [formData, setFormData] = useState<{
    customerId: string;
    status: QuoteStatus;
    items: QuoteItem[];
  }>({
    customerId: '',
    status: QuoteStatus.DRAFT,
    items: []
  });

  // Init form data when opening modal
  useEffect(() => {
    if (isModalOpen) {
      if (editingQuote) {
        setFormData({
          customerId: editingQuote.customerId,
          status: editingQuote.status,
          items: JSON.parse(JSON.stringify(editingQuote.items)) // Deep copy
        });
      } else {
        // Create New: Load items from System Config
        const defaultItems: QuoteItem[] = systemConfig.costItems.map(conf => ({
          id: conf.id, 
          name: conf.name,
          price: conf.defaultPrice,
          isEnabled: true,
          isCustom: false
        }));
        setFormData({
          customerId: customers.length > 0 ? customers[0].id : '',
          status: QuoteStatus.DRAFT,
          items: defaultItems
        });
      }
    }
  }, [isModalOpen, editingQuote, customers, systemConfig]);

  // --- Handlers ---
  
  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

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
            items: formData.items,
            totalAmount: totalAmount
        });
    } else {
        onAddQuote({
            id: quoteId,
            customerId: formData.customerId,
            customerName: customer?.name || 'Unknown',
            status: finalStatus,
            createdDate: new Date().toISOString().split('T')[0],
            items: formData.items,
            totalAmount: totalAmount
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
  
  // Strict Lock: If approved, no one can edit details. 
  const isStrictlyLocked = isApproved;

  const getStatusBadge = (status: QuoteStatus) => {
    const statusConfig = systemConfig.statusLabels[status];
    const label = statusConfig ? statusConfig.label : status;
    switch (status) {
      case QuoteStatus.DRAFT: return <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">{label}</span>;
      case QuoteStatus.PENDING_APPROVAL: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{label}</span>;
      case QuoteStatus.APPROVED: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{label}</span>;
      case QuoteStatus.REJECTED: return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{label}</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{label}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Báo giá & Hợp đồng</h2>
        <button 
          onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FilePlus size={18} className="mr-2" /> Tạo báo giá
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mã BG</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Tổng tiền</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-blue-600">{quote.id}</td>
                <td className="px-6 py-4">{quote.customerName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{quote.createdDate}</td>
                <td className="px-6 py-4 text-right font-medium text-lg">{formatCurrency(quote.totalAmount)} đ</td>
                <td className="px-6 py-4">{getStatusBadge(quote.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-3 text-gray-500">
                    <button 
                      onClick={() => { setEditingQuote(quote); setIsModalOpen(true); }}
                      className="hover:text-blue-600 flex items-center" 
                      title={quote.status === QuoteStatus.APPROVED ? "Xem chi tiết" : "Sửa / Duyệt"}
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

              {/* Items Table */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-800 flex items-center">
                    Chi tiết hạng mục & Chi phí
                  </h4>
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
                                            onChange={(e) => handleItemChange(index, 'isEnabled', e.target.checked)}
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
            </form>
            
            {/* 3. Action Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                 {/* Left status info */}
                 <div className="text-sm text-gray-500 italic">
                    {isStrictlyLocked ? 'Báo giá đã khóa, không thể chỉnh sửa.' : ''}
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

export default Quotations;