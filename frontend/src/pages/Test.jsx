import React from 'react';

const Test = () => {
  console.log('🧪 Test page rendering');
  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ TEST PAGE</h1>
      <p style={{ fontSize: '20px' }}>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: 'white',
          color: '#764ba2',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Test Button
      </button>
    </div>
  );
};

export default Test;