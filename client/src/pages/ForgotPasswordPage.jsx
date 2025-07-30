import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function ForgotPasswordPage() {
    const [email, set_email] = useState("");
    const [is_loading, set_is_loading] = useState(false);

    const handle_submission = (e) => {
        e.preventDefault();
        set_is_loading(true);
		
        console.log("Email sent to ", email);

        setTimeout(() => {
            set_is_loading(false) 
        },5000);
    };

    return (
        <div className="d-flex align-items-center justify-content-center mt-5">
            <div className="card mt-5 " style={{maxWidth: '480px', width: '100%'}}>
                <div className="card-header">
                    <h3>Quên mật khẩu</h3>
                </div>
                <div className="card-body">
                    <div className="card-text">Nhập email học viên đã dùng để đăng ký</div>
                    
                    <form onSubmit={handle_submission}>
                        <div className="btn-group w-100 mt-3" style={{maxHeight: "59px"}}>
                            <div className="form-floating w-75">
                                <input className="form-control" type="email" name="email" id="email" placeholder="" value={email} onChange={(e) => set_email(e.target.value)}/>
                                <label htmlFor="email">Địa chỉ email</label>
                            </div>
                            <button type="submit" disabled={is_loading} className="btn btn-primary px-3 fw-semibold w-25" >{is_loading ? "Đang gửi..." : "Gửi"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;