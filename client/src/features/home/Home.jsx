import "./Home.css";
import HeroSection from "./component/HeroSection";
import ServiceFeatures from "./component/ServiceFeature";
import CategorySection from "./component/CategorieSection";
import DealOfTheDay from "./component/DelayofDate";
import PromoBanners from "./component/PromoBanner";
import NewArrivals from "./component/NewArrival";
import Newsletter from "./component/NewsLetter";

const Home = () => (
  <main className="home-page">
    <HeroSection />
    <ServiceFeatures />
    <CategorySection />
    <DealOfTheDay />
    <PromoBanners />
    <NewArrivals />
    <Newsletter />
  </main>
);
export default Home;
