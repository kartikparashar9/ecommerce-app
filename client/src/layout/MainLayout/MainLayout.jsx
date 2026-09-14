import { Outlet } from "react-router-dom";
import Navbar from "../../features/navbar/component/Navbar";
import Footer from "../../features/footer/component/Footer";

const MainLayout = () => {
    return (
        <div className="main-layout">
            <header>
                <Navbar />
            </header>

            <main>
                <Outlet />
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
};

export default MainLayout;