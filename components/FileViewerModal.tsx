import React from 'react';
import type { FileObject } from '../types';
import CloseIcon from './icons/CloseIcon';

interface FileViewerModalProps {
  file: FileObject;
  onClose: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, onClose }) => {

  const renderContent = () => {
    const isViewable = file.type.startsWith('image/') || file.type === 'application/pdf';
    
    if (file.publicUrl && isViewable) {
      if (file.type.startsWith('image/')) {
        return <img src={file.publicUrl} alt={file.name} className="w-full h-full object-contain" />;
      }
      if (file.type === 'application/pdf') {
        return <iframe src={file.publicUrl} title={file.name} className="w-full h-full border-0"></iframe>;
      }
    }

    // Fallback for non-viewable files or if URL is somehow missing
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-8 text-center rounded-b-lg">
        <p className="text-xl font-semibold text-gray-700 mb-4">
          لا يمكن عرض هذا النوع من الملفات مباشرة.
        </p>
        <p className="text-gray-500 mb-6">
          نوع الملف: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{file.type || 'غير معروف'}</span>
        </p>
        <a 
          href={file.publicUrl} 
          download={file.name}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          تنزيل الملف
        </a>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg text-gray-800 truncate" title={file.name}>{file.name}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
            aria-label="إغلاق"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 p-2 overflow-auto bg-gray-200">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
