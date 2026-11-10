// frontend/src/pages/student/StudentLayout.jsx
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StudentSidebar from '../../components/StudentSidebar'

export default function StudentLayout() {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2 p-0">
            <StudentSidebar />
          </div>
          <div className="col-md-10 p-4" style={{ minHeight: '85vh' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}