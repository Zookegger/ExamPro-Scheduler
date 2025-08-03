function AccessDeniedPage() {
    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card border-danger">
                        <div className="card-header bg-danger text-white text-center">
                            <h3 className="mb-0">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Truy cập bị từ chối / Access Denied
                            </h3>
                        </div>
                        <div className="card-body text-center">
                            <p className="text-muted mb-3">
                                Bạn không có quyền truy cập vào trang này.
                            </p>
                            <p className="text-muted mb-4">
                                You don't have permission to access this page.
                            </p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => window.history.back()}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Quay lại / Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccessDeniedPage;