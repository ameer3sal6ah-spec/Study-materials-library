
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-3xl font-bold text-blue-600">
          مكتبة المواد الدراسية
        </h1>
        <p className="text-gray-500 mt-1">
          مكانك الوحيد لتنظيم جميع موادك الدراسية بسهولة.
        </p>
      </div>
    </header>
  );
};

export default Header;
