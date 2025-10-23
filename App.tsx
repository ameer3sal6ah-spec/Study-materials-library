import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import type { Course, CourseShell, FileObject, Lecture, Section } from './types';
import { COURSES_DATA } from './constants';
import CourseCard from './components/CourseCard';
import CourseDetail from './components/CourseDetail';
import Header from './components/Header';
import FileViewerModal from './components/FileViewerModal';
import ImportIcon from './components/icons/ImportIcon';
import ResetIcon from './components/icons/ResetIcon';
import InfoIcon from './components/icons/InfoIcon';
import SupabaseSetupInstructions from './components/SupabaseSetupInstructions';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const BUCKET_NAME = 'course-files'; // Supabase storage bucket name

const App: React.FC = () => {
  // First, check if Supabase is configured. If not, show setup instructions.
  if (!supabase) {
    return <SupabaseSetupInstructions />;
  }

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewingFile, setViewingFile] = useState<FileObject | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);

  const fetchCourses = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lectures (*),
          sections (*)
        `);

      if (error) throw error;

      const assembledCourses: Course[] = data.map(course => ({
        ...course,
        lectures: course.lectures.sort((a: Lecture, b: Lecture) => a.name.localeCompare(b.name, undefined, { numeric: true })),
        sections: course.sections.sort((a: Section, b: Section) => a.name.localeCompare(b.name, undefined, { numeric: true })),
      }));

      setCourses(assembledCourses);

    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Error fetching data from Supabase:", error);
      alert(`فشل تحميل البيانات من قاعدة البيانات.\n\nالخطأ: ${errorMessage}\n\nيرجى التأكد من أن الجداول تم إنشاؤها بشكل صحيح وأن سياسات RLS تسمح بالوصول.`);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSelectCourse = (course: Course) => setSelectedCourse(course);
  const handleBack = () => setSelectedCourse(null);
  const handleViewFile = (file: FileObject) => setViewingFile(file);
  const handleCloseViewer = () => setViewingFile(null);

  const handleFileUpload = async (courseId: string, type: 'lecture' | 'section', itemId: string, file: File) => {
    const filePath = `${courseId}/${type}-${itemId}-${file.name.replace(/\s/g, '_')}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });
    if (uploadError) {
      console.error('Upload Error:', uploadError);
      if (uploadError.message && uploadError.message.includes('security policy')) {
          alert('فشل رفع الملف: خطأ في الصلاحيات.\n\nيرجى التأكد من إضافة سياسات الأمان (RLS) لحاوية التخزين (Storage) في Supabase للسماح بعمليات الرفع (INSERT/UPDATE).');
      } else {
          alert(`فشل رفع الملف: ${uploadError.message}`);
      }
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    const fileObject: FileObject = {
      name: file.name,
      path: filePath,
      publicUrl,
      type: file.type,
    };

    // Update the record in the database
    const tableName = type === 'lecture' ? 'lectures' : 'sections';
    const { error: dbError } = await supabase.from(tableName).update({ file: fileObject }).eq('id', itemId);

    if (dbError) {
      console.error('DB Update Error:', dbError);
      alert(`فشل تحديث بيانات الملف في قاعدة البيانات: ${dbError.message}`);
      // Cleanup: remove the uploaded file from storage if DB update fails to avoid orphans
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      return;
    }

    // Optimistically update local state for better UX
    const updatedCourses = courses.map(c => {
        if (c.id === courseId) {
            const list = type === 'lecture' ? c.lectures : c.sections;
            const updatedList = list.map(item => item.id === itemId ? { ...item, file: fileObject } : item);
            const updatedCourse = { ...c, ...(type === 'lecture' ? { lectures: updatedList } : { sections: updatedList }) };
            if (selectedCourse?.id === courseId) {
                setSelectedCourse(updatedCourse);
            }
            return updatedCourse;
        }
        return c;
    });
    setCourses(updatedCourses);
  };

  const handleToggleComplete = async (courseId: string, type: 'lecture' | 'section', itemId: string) => {
    const targetItem = courses
      .find(c => c.id === courseId)?.[type === 'lecture' ? 'lectures' : 'sections']
      .find(item => item.id === itemId);

    if (!targetItem) return;

    const newStatus = !targetItem.completed;
    const tableName = type === 'lecture' ? 'lectures' : 'sections';

    const { error } = await supabase.from(tableName).update({ completed: newStatus }).eq('id', itemId);
    if (error) {
        console.error('Toggle Complete Error:', error);
        alert(`فشل تحديث حالة الإنجاز: ${error.message}`);
        return;
    }
    
    // Optimistic update
    const updatedCourses = courses.map(c => {
        if (c.id === courseId) {
            const list = type === 'lecture' ? c.lectures : c.sections;
            const updatedList = list.map(item => item.id === itemId ? { ...item, completed: newStatus } : item);
            const updatedCourse = { ...c, ...(type === 'lecture' ? { lectures: updatedList } : { sections: updatedList }) };
            if(selectedCourse?.id === courseId) setSelectedCourse(updatedCourse);
            return updatedCourse;
        }
        return c;
    });
    setCourses(updatedCourses);
  };
  
  const handleAddItem = async (courseId: string, type: 'lecture' | 'section') => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const list = type === 'lecture' ? course.lectures : course.sections;
    const newItemName = `${type === 'lecture' ? 'المحاضرة' : 'السكشن'} ${list.length + 1}`;
    const tableName = type === 'lecture' ? 'lectures' : 'sections';

    const { data, error } = await supabase.from(tableName).insert({
      name: newItemName,
      course_id: courseId,
      completed: false
    }).select().single();

    if (error || !data) {
      console.error("Error adding new item:", error);
      alert(`فشل إضافة عنصر جديد: ${error?.message || 'بيانات غير صالحة'}`);
      return;
    }

    // Add to local state
    const newItem = data as (Lecture | Section);
    const updatedCourses = courses.map(c => {
        if (c.id === courseId) {
            const updatedList = [...list, newItem];
            const updatedCourse = { ...c, ...(type === 'lecture' ? { lectures: updatedList } : { sections: updatedList }) };
            if(selectedCourse?.id === courseId) setSelectedCourse(updatedCourse);
            return updatedCourse;
        }
        return c;
    });
    setCourses(updatedCourses);
  };


  const handleScheduleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
        alert('الرجاء رفع ملف PDF فقط.');
        if(file) event.target.value = '';
        return;
    }

    setIsAnalyzing(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64Content = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: `
                        حلل ملف PDF هذا الذي يحتوي على جدول دراسي جامعي.
                        المهمة هي استخراج قائمة فريدة من المواد الدراسية.
                        لكل مادة فريدة، استخرج المعلومات التالية:
                        1.  اسم المادة باللغة العربية (nameAr).
                        2.  اسم المادة باللغة الإنجليزية (nameEn).
                        3.  اسم الدكتور المسؤول عن المحاضرات (doctor).
                        4.  اسم المعيد المسؤول عن السكاشن (taName). قد لا يكون المعيد مذكوراً دائماً.
                        5.  يوم المحاضرة الأسبوعي (lectureDay)، مثل "السبت" أو "الاثنين".
                        6.  يوم السكشن الأسبوعي (sectionDay)، مثل "الأحد" أو "الأربعاء".

                        ملاحظات هامة:
                        - المادة الواحدة لها دكتور واحد ومعيد واحد. لا تكرر المادة. اجمع المحاضرات والسكاشن تحت مادة واحدة.
                        - إذا كان هناك عدة أيام للمحاضرات أو السكاشن، اختر واحداً فقط لكل منهما.
                        - إذا كان اليوم غير مذكور، اترك الحقل فارغاً.
                        - تجاهل أي معلومات أخرى مثل الأوقات، الأماكن، أو أرقام القاعات.
                        - يجب أن يكون الناتج بصيغة JSON عبارة عن مصفوفة من الكائنات.
                        - كل كائن يجب أن يحتوي على المفاتيح التالية: "nameAr", "nameEn", "doctor", "taName" (إذا وجد), "lectureDay" (إذا وجد), و "sectionDay" (إذا وجد).
                        - إذا كان اسم المادة باللغة الإنجليزية غير متوفر، استنتجه من الاسم العربي.
                    `},
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: base64Content,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            nameAr: { type: Type.STRING },
                            nameEn: { type: Type.STRING },
                            doctor: { type: Type.STRING },
                            taName: { type: Type.STRING },
                            lectureDay: { type: Type.STRING },
                            sectionDay: { type: Type.STRING },
                        },
                        required: ["nameAr", "nameEn", "doctor"],
                    },
                },
            },
        });
        
        const parsedShells: CourseShell[] = JSON.parse(response.text);
        if (!Array.isArray(parsedShells) || parsedShells.length === 0) {
            throw new Error("لم يتمكن الذكاء الاصطناعي من استخراج أي مواد.");
        }

        // Clear existing data and insert new schedule
        await supabase.from('lectures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { data: newCourses, error: courseInsertError } = await supabase.from('courses').insert(parsedShells).select();
        if (courseInsertError) throw courseInsertError;
        
        // Create default lectures and sections for new courses
        const lecturesToInsert = newCourses.flatMap(c => Array.from({ length: 12 }, (_, i) => ({ course_id: c.id, name: `المحاضرة ${i + 1}`, completed: false })));
        const sectionsToInsert = newCourses.flatMap(c => Array.from({ length: 12 }, (_, i) => ({ course_id: c.id, name: `السكشن ${i + 1}`, completed: false })));
        
        await supabase.from('lectures').insert(lecturesToInsert);
        await supabase.from('sections').insert(sectionsToInsert);

        alert('تم تحليل واستيراد الجدول بنجاح!');
        await fetchCourses(); // Refresh data from DB
        setSelectedCourse(null);

    } catch (error) {
        console.error("Schedule Upload Error:", error);
        alert(`فشل تحليل الجدول: ${(error as Error).message}.`);
    } finally {
        setIsAnalyzing(false);
        event.target.value = '';
    }
  };

  const handleResetSchedule = async () => {
    if (window.confirm('هل أنت متأكد؟ سيتم حذف الجدول الحالي واستبداله بالجدول الافتراضي.')) {
        setIsAnalyzing(true);
        try {
            // Clear all data
            await supabase.from('lectures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // Insert default courses
            const { data: newCourses, error: courseInsertError } = await supabase.from('courses').insert(COURSES_DATA).select();
            if (courseInsertError) throw courseInsertError;

            // Insert default lectures/sections for them
            const lecturesToInsert = newCourses.flatMap(c => Array.from({ length: 12 }, (_, i) => ({ course_id: c.id, name: `المحاضرة ${i + 1}`, completed: false })));
            const sectionsToInsert = newCourses.flatMap(c => Array.from({ length: 12 }, (_, i) => ({ course_id: c.id, name: `السكشن ${i + 1}`, completed: false })));
            
            await supabase.from('lectures').insert(lecturesToInsert);
            await supabase.from('sections').insert(sectionsToInsert);

            await fetchCourses();
            setSelectedCourse(null);
        } catch (error) {
            console.error('Reset Error:', error);
            alert(`فشل إعادة تعيين الجدول: ${(error as Error).message}`);
        } finally {
            setIsAnalyzing(false);
        }
    }
  };

  const renderContent = () => {
    if (isPageLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    if (selectedCourse) {
      return (
        <CourseDetail
          course={selectedCourse}
          onBack={handleBack}
          onFileUpload={handleFileUpload}
          onViewFile={handleViewFile}
          onToggleComplete={handleToggleComplete}
          onAddItem={handleAddItem}
        />
      );
    }
    // Main page content... (No changes needed here from previous version)
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-2 border-b-2 border-blue-500">
          <h2 className="text-3xl font-bold text-gray-700 mb-4 sm:mb-0">
            المواد الدراسية
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative group">
                <InfoIcon className="w-6 h-6 text-gray-500 cursor-pointer" />
                <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <p className='font-bold mb-1'>استيراد الجدول الدراسي بملف PDF:</p>
                    <p>ارفع جدولك الدراسي بصيغة PDF وسيقوم الذكاء الاصطناعي بتحليله تلقائيًا لإنشاء قائمة المواد الخاصة بك.</p>
                    <p className='mt-2'>لأفضل النتائج، تأكد من أن الجدول واضح ويحتوي على اسم المادة (عربي/انجليزي) واسم الدكتور.</p>
                </div>
            </div>
            <label className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition duration-300 cursor-pointer ${
                isAnalyzing 
                ? 'bg-gray-400 text-gray-800 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}>
                {isAnalyzing ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري التحليل...</span>
                    </>
                ) : (
                    <>
                    <ImportIcon className="w-5 h-5"/>
                    <span>استيراد جدول PDF</span>
                    </>
                )}
                <input type="file" accept=".pdf" className="hidden" onChange={handleScheduleUpload} disabled={isAnalyzing} />
            </label>
             <button onClick={handleResetSchedule} disabled={isAnalyzing} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                <ResetIcon className="w-5 h-5"/>
                <span>إعادة تعيين</span>
            </button>
          </div>
        </div>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={() => handleSelectCourse(course)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-gray-700">لا توجد مواد دراسية</h3>
            <p className="text-gray-500 mt-2">
              يبدو أن قائمتك فارغة. يمكنك البدء عبر استيراد جدولك الدراسي بصيغة PDF أو إعادة التعيين للوضع الافتراضي.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <footer className="text-center p-4 mt-8 text-gray-500">
        <p>&copy; 2024 مكتبة المواد الدراسية. جميع الحقوق محفوظة.</p>
      </footer>
      {viewingFile && <FileViewerModal file={viewingFile} onClose={handleCloseViewer} />}
    </div>
  );
};

export default App;