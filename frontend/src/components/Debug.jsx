import React from 'react';

const Debug = ({ name, children }) => {
  console.log(`🔍 [${name}] Rendering -`, {
    hasChildren: !!children,
    childrenType: children ? typeof children : 'none'
  });
  
  return (
    <div style={{ border: '2px solid red', margin: '10px', padding: '10px' }}>
      <h3 style={{ color: 'red' }}>🔍 {name} Component</h3>
      {children ? (
        <div style={{ border: '1px dashed blue', padding: '5px' }}>
          {children}
        </div>
      ) : (
        <p style={{ color: 'orange' }}>⚠️ No children/content</p>
      )}
    </div>
  );
};

export default Debug;