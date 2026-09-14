import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerProducts } from "../sellerSlice";
import { deleteProductApi, toggleProductStatusApi } from "../sellerApi";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import "./MyProducts.css";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const MyProducts = () => {
  const dispatch = useDispatch();
  const { products, productsLoading, productsPagination } = useSelector((state) => state.seller || {});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchSellerProducts({ search: search.trim() || undefined, isActive: status === "all" ? undefined : status, limit: 20 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [dispatch, search, status]);

  const refresh = () => dispatch(fetchSellerProducts({ search: search.trim() || undefined, isActive: status === "all" ? undefined : status, limit: 20 }));

  const toggle = async (id) => {
    try { await toggleProductStatusApi(id); refresh(); }
    catch (error) { window.alert(error?.response?.data?.message || "Unable to update product status."); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try { await deleteProductApi(id); refresh(); }
    catch (error) { window.alert(error?.response?.data?.message || "Unable to delete product."); }
  };

  return <div className="seller-products-page">
    <div className="seller-products-heading"><div><span>CATALOG MANAGEMENT</span><h2>My Products</h2><p>Manage products, pricing, stock and availability.</p></div><button className="seller-primary-btn" onClick={() => setAddOpen(true)}><FiPlus /> Add Product</button></div>
    <div className="seller-products-toolbar"><div className="seller-product-search"><FiSearch/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."/></div><div className="seller-product-tabs">{[["all","All"],["true","Active"],["false","Inactive"]].map(([key,label])=><button key={key} className={status===key?"active":""} onClick={()=>setStatus(key)}>{label}</button>)}</div></div>
    <div className="seller-products-card"><div className="seller-products-card-head"><strong>{productsPagination?.totalProducts ?? products.length} products</strong><span>Keep stock and status up to date.</span></div><div className="seller-products-table-wrap">{productsLoading ? <div className="seller-products-state">Loading products...</div> : !products.length ? <div className="seller-products-state"><FiPackage/><strong>No products found</strong><span>Try another search or add your first product.</span></div> : <table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map((p)=><tr key={p._id}><td><div className="seller-product-cell">{p.images?.[0]?<img src={p.images[0]} alt={p.name}/>:<div className="seller-product-placeholder"><FiPackage/></div>}<div><strong>{p.name}</strong><small>{p.slug || "No slug"}</small></div></div></td><td>{p.category?.name || "—"}</td><td><strong>{money(p.finalPrice ?? p.basePrice)}</strong>{p.discount>0&&<small className="seller-old-price">{money(p.basePrice)}</small>}</td><td><span className={Number(p.totalStock)<=Number(p.lowStockThreshold||0)?"low-stock":""}>{p.totalStock ?? 0} units</span></td><td><span className={`seller-product-status ${p.isActive!==false?"active":"inactive"}`}>{p.isActive!==false?"Active":"Inactive"}</span></td><td><div className="seller-product-actions"><button title="Toggle status" onClick={()=>toggle(p._id)}>{p.isActive!==false?<FiToggleRight/>:<FiToggleLeft/>}</button><button title="Edit" onClick={()=>setEditProduct(p)}><FiEdit2/></button><button title="Delete" className="danger" onClick={()=>remove(p._id)}><FiTrash2/></button></div></td></tr>)}</tbody></table>}</div></div>
    {addOpen&&<AddProductModal onClose={()=>{setAddOpen(false);refresh();}}/>}
    {editProduct&&<EditProductModal product={editProduct} onClose={()=>{setEditProduct(null);refresh();}}/>}
  </div>;
};
export default MyProducts;
