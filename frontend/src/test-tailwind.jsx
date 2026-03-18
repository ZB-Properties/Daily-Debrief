import React from 'react';

const TestTailwind = () => {
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">✅ Tailwind Test</h1>
        <p className="text-blue-100">If you can see this with blue background and white text, Tailwind is working!</p>
        <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
          Test Button
        </button>
      </div>
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-gray-900 dark:text-white">Dark mode test - toggle theme to see change</p>
      </div>
    </div>
  );
};

export default TestTailwind;