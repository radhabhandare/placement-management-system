// frontend/src/pages/admin/AdminLayout.jsx
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import AdminSidebar from '../../components/AdminSidebar'

export default function AdminLayout() {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2 p-0">
            <AdminSidebar />
          </div>
          <div className="col-md-10 p-4" style={{ minHeight: '85vh' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}