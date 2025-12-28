// Quick Test Widget - Minimal để test
import React from 'react'

const QuickTestWidget = () => {
    console.log('QuickTestWidget rendering...')
    
    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                backgroundColor: 'red',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 9999,
                border: '2px solid white'
            }}
            onClick={() => alert('Widget clicked!')}
        >
            TEST
        </div>
    )
}

export default QuickTestWidget