// Import all management pages
import ManageExamPage from "./ManageExamPage";
import ManageRoomPage from "./ManageRoomPage";
import ManageSchedulePage from "./ManageSchedulePage";
import ManageSubjectPage from "./ManageSubjectPage";
import ManageUserPage from "./ManageUserPage";

// Create package object with clean names
const ManagementPages = {
    Exam: ManageExamPage,
    Room: ManageRoomPage,
    Schedule: ManageSchedulePage,
    Subject: ManageSubjectPage,
    User: ManageUserPage
};

// Export as default package
export default ManagementPages;

// Also export individual components (gives flexibility)
export {
    ManageExamPage as Exam,
    ManageRoomPage as Room,
    ManageSchedulePage as Schedule,
    ManageSubjectPage as Subject,
    ManageUserPage as User
};
