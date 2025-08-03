import React from "react";
import { Link } from "react-router-dom";

/**
 * Breadcrumb Component
 * 
 * Provides navigation breadcrumbs for the ExamPro admin interface.
 * Shows the current page hierarchy and allows quick navigation back to parent pages.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of breadcrumb items
 * @param {string} props.items[].label - Display text for the breadcrumb
 * @param {string} [props.items[].path] - Navigation path (omit for current page)
 * @param {string} [props.items[].icon] - Bootstrap icon class
 * 
 * @example
 * // Basic usage
 * <Breadcrumb items={[
 *   { label: 'Dashboard', path: '/', icon: 'bi-speedometer2' },
 *   { label: 'Quản lý', icon: 'bi-gear' },
 *   { label: 'Người dùng' }
 * ]} />
 */
function Breadcrumb({ items = [] }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb bg-light px-3 py-2 rounded">
                {items.map((item, index) => {
                    const is_last = index === items.length - 1;
                    
                    return (
                        <li 
                            key={index} 
                            className={`breadcrumb-item ${is_last ? 'active' : ''}`}
                            aria-current={is_last ? 'page' : undefined}
                        >
                            {is_last ? (
                                // Current page (no link)
                                <span className="text-muted">
                                    {item.icon && <i className={`${item.icon} me-1`}></i>}
                                    {item.label}
                                </span>
                            ) : (
                                // Navigable breadcrumb
                                <Link 
                                    to={item.path} 
                                    className="text-decoration-none"
                                    title={`Về ${item.label}`}
                                >
                                    {item.icon && <i className={`${item.icon} me-1`}></i>}
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
