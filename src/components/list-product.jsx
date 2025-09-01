import "../styles/list-product.scss";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api/products";
import { normalizeProduct, formatCurrency, placeholderSvg } from "../utils/product";

const PLACEHOLDER_SVG = placeholderSvg(600, 900);

function ProductCard({ product }) {
  return (
    <div className="product-card">
      {product.discount ? (
        <div className={`badge ${product.discount >= 50 ? "badge--hot" : ""}`}>
          -{product.discount}
          <span>%</span>
        </div>
      ) : null}
      <Link className="thumb" to={`/products/${product.id}`}>
        {product.image ? (
          <>
            <img
              className="main"
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_SVG;
              }}
            />
            <img
              className="hover"
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_SVG;
              }}
            />
          </>
        ) : (
          <div className="placeholder" aria-label="No image" />
        )}
      </Link>
      <div className="info">
        <Link
          className="title"
          to={`/products/${product.id}`}
          title={product.name}
        >
          {product.name}
        </Link>
        <div className="desc">{product.description}</div>
        <div className="price">
          <ins>{formatCurrency(product.price)}</ins>
        </div>
        <button className="add" aria-label="Thêm vào giỏ">
          <i className="bi bi-bag"></i>
        </button>
      </div>
    </div>
  );
}

export default function ListProduct() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getProducts();
        const list = Array.isArray(res)
          ? res
          : res?.data || res?.items || res?.products || [];
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.createdAt || a.created_at || 0).getTime();
          const db = new Date(b.createdAt || b.created_at || 0).getTime();
          return db - da;
        });
        const normalized = (sorted.length ? sorted.slice(0, 5) : list).map(
          normalizeProduct
        );

        if (mounted) setProducts(normalized);
      } catch (e) {
        if (mounted) setError(e?.message || "Không thể tải sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) return <div className="py-4">Đang tải sản phẩm...</div>;
    if (error) return <div className="text-danger py-4">{error}</div>;
    if (!products.length) return <div className="py-4">Chưa có sản phẩm.</div>;
    return products.map((p) => <ProductCard key={p.id} product={p} />);
  }, [loading, error, products]);

  return (
    <div className="product-grid">
      {content}
      <div className="grid-footer">
        <a className="btn btn-outline-dark px-4" href="#">
          Xem tất cả
        </a>
      </div>
    </div>
  );
}
