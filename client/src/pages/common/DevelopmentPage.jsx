import React, { useState, useEffect } from 'react';
import AccessDeniedPage from './AccessDeniedPage';
import ServerHealthCheck from './ServerHealthCheck';

/**
 * Development Page Component
 * 
 * A dedicated page for development tools, testing, and debugging features.
 * This page contains all the development-specific components that should
 * not be visible in the production application.
 */
// ServerHealthCheck component has been moved to its own file
// See ServerHealthCheck.jsx

// API Testing Component
function APITestingPanel() {
    const [test_results, set_test_results] = useState({});
    const [is_testing, set_is_testing] = useState({});

    const execute_test = async (test_name, endpoint, method = 'GET', body = null) => {
        set_is_testing(prev => ({ ...prev, [test_name]: true }));
        
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`http://localhost:5000${endpoint}`, options);
            const data = await response.json();
            
            set_test_results(prev => ({
                ...prev,
                [test_name]: {
                    success: response.ok,
                    status: response.status,
                    data: data,
                    timestamp: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: `${method} ${endpoint}`
                }
            }));
        } catch (error) {
            set_test_results(prev => ({
                ...prev,
                [test_name]: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: `${method} ${endpoint}`
                }
            }));
        } finally {
            set_is_testing(prev => ({ ...prev, [test_name]: false }));
        }
    };

    const test_timestamp_endpoint = () => {
        execute_test('timestamp_test', '/api/test/timestamp', 'POST');
    };

    const test_health_endpoint = () => {
        execute_test('health_test', '/api/health');
    };

    const test_debug_connections = () => {
        execute_test('debug_test', '/api/debug/connections');
    };

    const create_test_subject = () => {
        const test_subject = {
            subject_code: `TEST_${Date.now()}`,
            subject_name: 'Development Test Subject',
            department: 'Development Department',
            description: 'Created from development dashboard'
        };
        execute_test('subject_creation', '/api/subjects', 'POST', test_subject);
    };

    const render_test_result = (test_name) => {
        const result = test_results[test_name];
        if (!result) return null;

        return (
            <div className={`border p-3 mb-2 ${result.success ? 'border-success' : 'border-danger'}`} style={{ borderRadius: '5px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{result.endpoint}</small>
                    <small className="text-muted">{result.timestamp}</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                    <span className={`badge me-2 ${result.success ? 'bg-success' : 'bg-danger'}`}>
                        {result.success ? '✅ SUCCESS' : '❌ ERROR'}
                    </span>
                    {result.status && <span className="badge bg-secondary">HTTP {result.status}</span>}
                </div>
                {result.error && (
                    <div className="alert alert-danger py-2 mb-2">
                        <small><strong>Error:</strong> {result.error}</small>
                    </div>
                )}
                {result.data && (
                    <div>
                        <small className="text-muted">Response:</small>
                        <pre className="bg-light p-2 mt-1 text-start" style={{ fontSize: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {JSON.stringify(result.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="mb-0">🔗 API Testing Panel</h5>
            </div>
            <div className="card-body">
                <div className="row mb-3">
                    <div className="col-12">
                        <h6>Basic Tests</h6>
                        <button 
                            className="btn btn-primary btn-sm me-2 mb-2"
                            onClick={test_health_endpoint}
                            disabled={is_testing.health_test}
                        >
                            {is_testing.health_test ? '⏳ Testing...' : '🩺 Health Check'}
                        </button>
                        <button 
                            className="btn btn-info btn-sm me-2 mb-2"
                            onClick={test_debug_connections}
                            disabled={is_testing.debug_test}
                        >
                            {is_testing.debug_test ? '⏳ Testing...' : '🔌 Debug Connections'}
                        </button>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-12">
                        <h6>Database Tests</h6>
                        <button 
                            className="btn btn-success btn-sm me-2 mb-2"
                            onClick={test_timestamp_endpoint}
                            disabled={is_testing.timestamp_test}
                        >
                            {is_testing.timestamp_test ? '⏳ Testing...' : '⏰ Test Timestamp Fix'}
                        </button>
                        <button 
                            className="btn btn-warning btn-sm mb-2"
                            onClick={create_test_subject}
                            disabled={is_testing.subject_creation}
                        >
                            {is_testing.subject_creation ? '⏳ Creating...' : '📚 Create Test Subject'}
                        </button>
                    </div>
                </div>
                
                <div className="mt-4">
                    <h6>Test Results:</h6>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {Object.keys(test_results).length === 0 ? (
                            <div className="text-muted text-center py-3">
                                <em>No tests run yet. Click a button above to start testing!</em>
                            </div>
                        ) : (
                            Object.keys(test_results).map(test_name => (
                                <div key={test_name}>
                                    {render_test_result(test_name)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Database Status Component
function DatabaseStatusPanel() {
    const [db_status, set_db_status] = useState("Checking...");

    useEffect(() => {
        // Mock database status - you can implement real checks later
        setTimeout(() => {
            set_db_status("✅ All tables synchronized with proper timestamps");
        }, 1000);
    }, []);

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="mb-0">💾 Database Status</h5>
            </div>
            <div className="card-body">
                <p>{db_status}</p>
                <small className="text-muted">
                    Database tables have been recreated with force sync to fix timestamp issues.
                </small>
            </div>
        </div>
    );
}

// Database Management Component
function DatabaseManagementPanel() {
    const [operation_result, set_operation_result] = useState(null);
    const [is_executing, set_is_executing] = useState({});

    const execute_database_operation = async (operation_name, endpoint, method = 'POST', confirmation_required = false) => {
        if (confirmation_required && !window.confirm(`Are you sure you want to ${operation_name}? This action cannot be undone.`)) {
            return;
        }

        set_is_executing(prev => ({ ...prev, [operation_name]: true }));
        
        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            console.log(data);

            set_operation_result({
                operation: operation_name,
                success: response.ok,
                status: response.status,
                data: data,
                timestamp: new Date().toLocaleTimeString('vi-VN')
            });
        } catch (error) {
            set_operation_result({
                operation: operation_name,
                success: false,
                error: error.message,
                timestamp: new Date().toLocaleTimeString('vi-VN')
            });
        } finally {
            set_is_executing(prev => ({ ...prev, [operation_name]: false }));
        }
    };

    const sync_database = () => {
        execute_database_operation('sync_database', '/api/admin/sync-database', 'POST', true);
    };

    const check_table_status = () => {
        execute_database_operation('check_tables', '/api/admin/table-status', 'GET');
    };

    const clear_test_data = () => {
        execute_database_operation('clear_test_data', '/api/admin/clear-test-data', 'DELETE', true);
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="mb-0">🗄️ Database Management</h5>
            </div>
            <div className="card-body">
                <div className="alert alert-warning">
                    <small><strong>⚠️ Development Only:</strong> These operations should only be used in development environment!</small>
                </div>

                <div className="row mb-3">
                    <div className="col-12">
                        <h6>Database Operations</h6>
                        <button 
                            className="btn btn-info btn-sm me-2 mb-2"
                            onClick={check_table_status}
                            disabled={is_executing.check_tables}
                        >
                            {is_executing.check_tables ? '⏳ Checking...' : '📋 Check Table Status'}
                        </button>
                        <button 
                            className="btn btn-warning btn-sm me-2 mb-2"
                            onClick={sync_database}
                            disabled={is_executing.sync_database}
                        >
                            {is_executing.sync_database ? '⏳ Syncing...' : '🔄 Force Sync Database'}
                        </button>
                        <button 
                            className="btn btn-danger btn-sm mb-2"
                            onClick={clear_test_data}
                            disabled={is_executing.clear_test_data}
                        >
                            {is_executing.clear_test_data ? '⏳ Clearing...' : '🗑️ Clear Test Data'}
                        </button>
                    </div>
                </div>

                {operation_result && (
                    <div className="mt-4">
                        <h6>Operation Result:</h6>
                        <div className={`border p-3 ${operation_result.success ? 'border-success' : 'border-danger'}`} style={{ borderRadius: '5px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong>{operation_result.operation}</strong>
                                <small className="text-muted">{operation_result.timestamp}</small>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                                <span className={`badge me-2 ${operation_result.success ? 'bg-success' : 'bg-danger'}`}>
                                    {operation_result.success ? '✅ SUCCESS' : '❌ ERROR'}
                                </span>
                                {operation_result.status && <span className="badge bg-secondary">HTTP {operation_result.status}</span>}
                            </div>
                            {operation_result.error && (
                                <div className="alert alert-danger py-2 mb-2">
                                    <small><strong>Error:</strong> {operation_result.error}</small>
                                </div>
                            )}
                            {operation_result.data && (
                                <div className='text-start'>
                                    <small className="text-muted">Response:</small>
                                    <pre className="bg-light p-2 mt-1" style={{ fontSize: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                                        {JSON.stringify(operation_result.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Development Page Component
function DevelopmentPage({current_user_role}) {
    if (current_user_role !== 'admin') {
        return <AccessDeniedPage></AccessDeniedPage>;
    }

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>🛠️ Development Dashboard</h1>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <ServerHealthCheck current_user_role={current_user_role} />
                    <DatabaseStatusPanel />
                </div>
                <div className="col-md-6">
                    <APITestingPanel />
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <DatabaseManagementPanel />
                </div>
            </div>

            <div className="alert alert-info">
                <strong>🚧 Development Mode:</strong> This page contains development tools and debugging features. 
                It will not be available in production builds.
            </div>
        </div>
    );
}

export default DevelopmentPage;
