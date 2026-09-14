import { motion } from "framer-motion";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";

const services = [
  {
    id: 1,
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    id: 2,
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment",
  },
  {
    id: 3,
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30 days return policy",
  },
  {
    id: 4,
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer support",
  },
];

const ServiceFeatures = () => {
  return (
    <section className="service-features">
      <div className="service-container">
        {services.map((service, index) => {
          const Icon = service.icon;

          return (
            <motion.div
              key={service.id}
              className="service-item"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              whileHover={{ y: -4 }}
            >
              <div className="service-icon">
                <Icon size={25} strokeWidth={1.8} />
              </div>

              <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceFeatures;