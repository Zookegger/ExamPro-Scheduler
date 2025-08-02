import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate,} from 'react-router-dom';
import { login } from "../services/apiService";

function LoginPage({ set_is_logged_in, set_current_user_id, set_current_user_name, set_current_full_name, set_current_user_role }) {
	const [user_name, set_user_name] = useState("");
	const [password, set_password] = useState("");
	const [validation_message, set_validation_message] = useState("");
	const [is_loading, set_is_loading] = useState(false);
	const navigate = useNavigate();

	const handle_submit = async (e) => {
		e.preventDefault();
        set_is_loading(true);
		console.log("Login attempted: ", { user_name, password });
		try {
			const result = await login({ user_name, password });
			
			if (result.success) {
				set_validation_message(result.message || "Đăng nhập thành công!");
				set_is_logged_in(true);
				set_current_user_id(result.user.user_id);
				set_current_user_name(result.user.user_name);
				set_current_full_name(result.user.full_name);
				set_current_user_role(result.user.role);
				
				// Forward to main page
				
				navigate('/');
			}
			else {
				set_validation_message(result.message || "Đăng nhập thất bại");
			}
		} catch (error) {
			console.log('Login API error: ', error);
	        set_validation_message("Lỗi kết nối máy chủ");
		} finally {
			set_is_loading(false);
		}
	};

	return (
		<div className="d-flex align-items-center justify-content-center mt-5">
			<div
				className="card mt-5 shadow"
				style={{ maxWidth: "480px", width: "100%" }}
			>
				<div className="card-header bg-secondary text-white">
					<h3 className="fw-bold">Đăng nhập</h3>
				</div>
				<div className="card-body bg-body text-start">
					{validation_message && (
						<div className={`alert ${validation_message === "Đăng nhập thành công" ? "alert-success" : "alert-danger"} py-2 mb-2`}>
							{validation_message}
						</div>
					)}
                    <form onSubmit={handle_submit} id="loginForm" autoComplete="on">
						<div className="mb-3">
							<label
								htmlFor="user_name"
								className="form-label"
							>
								Tên tài khoản
							</label>
							<input
								type="text"
								id="user_name"
								name="user_name"
                                value={user_name}
								onChange={(e) => set_user_name(e.target.value)}
								className="form-control form-control-lg"
								placeholder="Nhập tài khoản"
								autoComplete="on"
                                required
							/>
						</div>
						<div className="mb-3">
							<label
								htmlFor="password"
								className="form-label"
							>
								Mật khẩu
							</label>
							<input
								type="password"
								id="password"
								name="password"
                                value={password}
								onChange={(e) => set_password(e.target.value)}
								className="form-control form-control-lg"
								placeholder="Nhập mật khẩu"
								autoComplete="on"
                                required
							/>
						</div>
                        <Link to="/forgot-password">Quên mật khẩu</Link>
					</form>
				</div>
				<div className="card-footer">
					<button
						type="submit"
						className="btn btn-primary btn-lg fw-semibold"
						form="loginForm"
                        disabled={is_loading}
					>
						{ is_loading ? "Đang đăng nhập..." : "Đăng nhập" }
					</button>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
