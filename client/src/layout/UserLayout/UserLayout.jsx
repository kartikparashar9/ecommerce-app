import { Outlet } from "react-router-dom";

const UserLayout = () => {
    return (
        <div className="user-layout">
            <aside>
                {/* User Sidebar */}
            </aside>

            <div className="user-content">
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;