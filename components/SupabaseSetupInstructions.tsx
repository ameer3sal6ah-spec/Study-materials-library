import React from 'react';

const SupabaseSetupInstructions: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 mb-4">خطأ في الإعداد: Supabase غير مُهيأ</h1>
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          يبدو أنك لم تقم بإعداد بيانات الاتصال بقاعدة بيانات Supabase. لمنع تعطل التطبيق، تم عرض هذه الصفحة الإرشادية.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mb-3 border-b dark:border-slate-600 pb-2">الخطوات المطلوبة</h2>
        <ol className="list-decimal list-inside space-y-4 text-gray-700 dark:text-slate-300">
          <li>
            اذهب إلى لوحة تحكم مشروعك في <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline font-semibold">Supabase</a>.
          </li>
          <li>
            من القائمة الجانبية، اذهب إلى <strong>Project Settings</strong> (أيقونة الترس) ثم اختر قسم <strong>API</strong>.
          </li>
          <li>
            في قسم <strong>Project API keys</strong>، ستجد مفتاحين. انسخ قيمة <strong>Project URL</strong> و مفتاح <strong><code>anon</code></strong> <strong><code>public</code></strong>.
          </li>
          <li>
            افتح ملف <code>supabaseClient.ts</code> في مشروعك.
          </li>
          <li>
            استبدل القيم الافتراضية <code>'YOUR_SUPABASE_URL'</code> و <code>'YOUR_SUPABASE_ANON_KEY'</code> بالقيم التي نسختها.
            <pre className="bg-gray-100 dark:bg-slate-900 p-4 rounded-md mt-2 text-sm text-left dir-ltr overflow-x-auto">
              <code>
                <span className="text-gray-500 dark:text-slate-500">// Before</span>
                <br />
                const supabaseUrl = 'YOUR_SUPABASE_URL';
                <br />
                const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
                <br />
                <br />
                <span className="text-gray-500 dark:text-slate-500">// After (Example)</span>
                <br />
                const supabaseUrl = 'https://abcdefg.supabase.co';
                <br />
                const supabaseAnonKey = 'eyJh...';
              </code>
            </pre>
          </li>
           <li>
            احفظ الملف. سيتم إعادة تحميل التطبيق تلقائيًا ويعمل بشكل صحيح.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseSetupInstructions;