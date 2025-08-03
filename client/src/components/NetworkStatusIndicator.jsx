import React from 'react';

/**
 * Network Status Indicator Component
 * 
 * Displays a floating network connection status indicator that:
 * - Shows red "Mất kết nối mạng" when disconnected
 * - Shows green "Đã kết nối" when reconnected
 * - Animates in/out based on connection status
 * - Only appears for logged-in users
 * 
 * @param {Object} props
 * @param {boolean} props.show_network_icon - Whether to show the indicator
 * @param {string} props.network_animation_class - CSS animation class
 * @param {boolean} props.is_connected - WebSocket connection status
 */
function NetworkStatusIndicator({ 
    show_network_icon, 
    network_animation_class, 
    is_connected 
}) {
    if (!show_network_icon) {
        return null;
    }

    return (
        <div 
            className={`network-status-indicator ${network_animation_class}`}
            style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                backgroundColor: is_connected ? '#28a745' : '#dc3545',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                animation: is_connected 
                    ? 'networkConnected 0.8s ease-out forwards' 
                    : 'networkDisconnected 0.3s ease-out'
            }}
        >
            <i className={`bi ${is_connected ? 'bi-wifi' : 'bi-wifi-off'}`}></i>
            <span>
                {is_connected ? 'Đã kết nối' : 'Mất kết nối mạng'}
            </span>
        </div>
    );
}

export default NetworkStatusIndicator;
