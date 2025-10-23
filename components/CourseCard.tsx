import React from 'react';
import type { Course } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import CalendarIcon from './icons/CalendarIcon';


interface CourseCardProps {
  course: Course;
  onSelect: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const uploadedLectures = course.lectures.filter(l => l.file).length;
  const totalLectures = course.lectures.length;
  
  const uploadedSections = course.sections.filter(s => s.file).length;
  const totalSections = course.sections.length;
  
  const completedItems = course.lectures.filter(l => l.completed).length + course.sections.filter(s => s.completed).length;
  const totalItems = totalLectures + totalSections;
  
  const isCourseComplete = totalItems > 0 && completedItems === totalItems;

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="p-6 flex-grow relative">
        {isCourseComplete && (
            <div className="absolute top-3 left-3 flex items-center bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                مكتمل
            </div>
        )}
        <h3 className="text-xl font-bold text-gray-800 mb-1">{course.nameAr}</h3>
        <p className="text-sm text-gray-500 mb-4">{course.nameEn}</p>
        
        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-blue-600">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{course.doctor}</span>
                </div>
                {course.lectureDay && (
                    <div className="flex items-center text-gray-500">
                        <CalendarIcon className="w-4 h-4 ml-1" />
                        <span>{course.lectureDay}</span>
                    </div>
                )}
            </div>

            {course.taName && (
                <div className="flex items-center justify-between text-teal-600">
                    <div className="flex items-center">
                        <UserGroupIcon className="w-5 h-5 ml-2" />
                        <span className="font-semibold">{course.taName}</span>
                    </div>
                     {course.sectionDay && (
                        <div className="flex items-center text-gray-500">
                            <CalendarIcon className="w-4 h-4 ml-1" />
                            <span>{course.sectionDay}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
              <span>المحاضرات المرفوعة:</span>
              <span className="font-bold text-gray-800">{totalLectures} / {uploadedLectures}</span>
          </div>
          <div className="flex justify-between">
              <span>السكاشن المرفوعة:</span>
              <span className="font-bold text-gray-800">{totalSections} / {uploadedSections}</span>
          </div>
            <div className="flex justify-between">
              <span>التقدم:</span>
              <span className="font-bold text-blue-600">{totalItems} / {completedItems}</span>
          </div>
      </div>
      <div className="bg-blue-500 text-white text-center px-6 py-3 font-semibold hover:bg-blue-600 transition-colors">
        <span>عرض التفاصيل</span>
      </div>
    </div>
  );
};

export default CourseCard;