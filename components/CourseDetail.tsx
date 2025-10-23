import React from 'react';
import type { Course, Lecture, Section, FileObject } from '../types';
import BackIcon from './icons/BackIcon';
import UploadIcon from './icons/UploadIcon';
import FileIcon from './icons/FileIcon';
import CheckIcon from './icons/CheckIcon';
import EmptyCheckIcon from './icons/EmptyCheckIcon';
import AddIcon from './icons/AddIcon';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onFileUpload: (courseId: string, type: 'lecture' | 'section', itemId: string, file: File) => Promise<void>;
  onViewFile: (file: FileObject) => void;
  onToggleComplete: (courseId: string, type: 'lecture' | 'section', itemId: string) => void;
  onAddItem: (courseId: string, type: 'lecture' | 'section') => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack, onFileUpload, onViewFile, onToggleComplete, onAddItem }) => {

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'lecture' | 'section', itemId: string) => {
    if (e.target.files && e.target.files[0]) {
      await onFileUpload(course.id, type, itemId, e.target.files[0]);
    }
    e.target.value = ''; // Reset input to allow re-uploading the same file
  };
  
  const renderItems = (items: (Lecture | Section)[], type: 'lecture' | 'section') => {
    return items.map(item => (
      <li key={item.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm mb-3">
        <button 
          onClick={() => onToggleComplete(course.id, type, item.id)} 
          className="p-2 -ml-2 text-gray-400 hover:text-green-500 transition-colors"
          aria-label={item.completed ? 'وضع علامة غير مكتمل' : 'وضع علامة مكتمل'}
        >
          {item.completed ? <CheckIcon className="w-6 h-6 text-green-500" /> : <EmptyCheckIcon className="w-6 h-6" />}
        </button>
        <div className="flex-1 min-w-0 mx-2">
          <p className="font-semibold text-gray-700 truncate">{item.name}</p>
          {item.file ? (
            <button onClick={() => onViewFile(item.file!)} className="flex items-center text-sm text-blue-600 hover:underline mt-1 text-right w-full"
              title={item.file.name}
            >
              <FileIcon className="w-4 h-4 ml-1 flex-shrink-0" />
              <span className="truncate">{item.file.name}</span>
            </button>
          ) : (
            <p className="text-sm text-gray-400 mt-1">لم يتم رفع ملف</p>
          )}
        </div>
        <label className="ml-2 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-md transition duration-300 flex items-center">
          <UploadIcon className="w-5 h-5" />
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e, type, item.id)}
          />
        </label>
      </li>
    ));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{course.nameAr}</h2>
          <p className="text-gray-500">{course.doctor}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          <BackIcon className="w-5 h-5 mr-2"/>
          <span>رجوع</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">المحاضرات</h3>
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col h-[32rem]">
            <ul className="space-y-2 flex-grow overflow-y-auto pr-2">
              {renderItems(course.lectures, 'lecture')}
            </ul>
            <div className="mt-4 flex justify-center border-t pt-4">
                <button 
                    onClick={() => onAddItem(course.id, 'lecture')}
                    className="flex items-center justify-center w-full bg-green-100 hover:bg-green-200 text-green-800 font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                    <AddIcon className="w-5 h-5 mr-2" />
                    إضافة محاضرة جديدة
                </button>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-4">
             <h3 className="text-2xl font-semibold text-gray-700">السكاشن والفصول</h3>
             {course.taName && (
                <span className="text-md font-medium text-gray-500">({course.taName})</span>
             )}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col h-[32rem]">
            <ul className="space-y-2 flex-grow overflow-y-auto pr-2">
              {renderItems(course.sections, 'section')}
            </ul>
            <div className="mt-4 flex justify-center border-t pt-4">
                <button 
                    onClick={() => onAddItem(course.id, 'section')}
                    className="flex items-center justify-center w-full bg-green-100 hover:bg-green-200 text-green-800 font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                    <AddIcon className="w-5 h-5 mr-2" />
                    إضافة سكشن جديد
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
