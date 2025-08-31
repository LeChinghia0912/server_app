import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById } from "../api/products";
import { getColors } from "../api/colors";
import { getSizes } from "../api/sizes";
import { resolveImageFromProduct, formatCurrency, placeholderSvg } from "../utils/product";

const PLACEHOLDER_SVG = placeholderSvg(800, 800);

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [colors, setColors] = useState([]);
  const [sizesList, setSizesList] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getProductById(id);
        const data = res?.data || res;
        if (mounted) setProduct(data);
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
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const [colorsRes, sizesRes] = await Promise.all([
          getColors(),
          getSizes(),
        ]);
        if (!mounted) return;
        const colorsList = Array.isArray(colorsRes)
          ? colorsRes
          : colorsRes?.data ?? [];
        const sizesArr = Array.isArray(sizesRes)
          ? sizesRes
          : sizesRes?.data ?? [];
        setColors(colorsList);
        setSizesList(sizesArr);
      } catch (_) {
        // Non-blocking: if colors/sizes fail, UI will fallback to product fields
      }
    }
    loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const mainImage = useMemo(
    () => resolveImageFromProduct(product || {}),
    [product]
  );
  const colorOptions = useMemo(() => {
    if (Array.isArray(colors) && colors.length)
      return colors.map((c) => c?.name ?? c).filter(Boolean);
    const raw =
      product?.colors ||
      product?.colorOptions ||
      product?.options?.colors ||
      product?.availableColors ||
      [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    return arr.map((c) => c?.name ?? c).filter(Boolean);
  }, [colors, product]);
  const sizeOptions = useMemo(() => {
    if (Array.isArray(sizesList) && sizesList.length)
      return sizesList.map((s) => s?.name ?? s).filter(Boolean);
    const raw =
      product?.sizes ||
      product?.sizeOptions ||
      product?.options?.sizes ||
      product?.availableSizes ||
      [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    return arr.map((s) => s?.name ?? s).filter(Boolean);
  }, [sizesList, product]);

  const sku = product?.sku || product?.SKU || product?.code || "";
  const rating = Number(product?.rating || product?.stars || 0);
  const originalPrice = Number(
    product?.originalPrice ||
      product?.price_before_discount ||
      product?.priceOld ||
      0
  );
  const price = Number.parseFloat(product?.price) || 0;
  const discountPercent =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : Number(product?.discount) || 0;

  if (loading)
    return <div className="container-xxl py-4">Đang tải sản phẩm...</div>;
  if (error)
    return <div className="container-xxl py-4 text-danger">{error}</div>;
  if (!product)
    return <div className="container-xxl py-4">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="container-xxl py-4">
      <button className="btn btn-link px-0 mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Quay lại
      </button>
      <div className="row g-4">
        <div className="col-12 col-md-6">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product?.name || product?.title || "Product image"}
              className="img-fluid rounded border"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_SVG;
              }}
            />
          ) : (
            <div className="ratio ratio-1x1 bg-light rounded border" />
          )}
        </div>
        <div className="col-12 col-md-6">
          <h3 className="mb-1">
            {product?.name || product?.title || "No name"}
          </h3>
          <div className="d-flex align-items-center gap-3 mb-2">
            {sku ? <div className="text-muted">SKU: {sku}</div> : null}
            <div className="d-flex align-items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <i
                  key={i}
                  className={`bi ${
                    i <= Math.round(rating)
                      ? "bi-star-fill text-warning"
                      : "bi-star text-warning"
                  }`}
                ></i>
              ))}
            </div>
            <div className="text-muted">(0 đánh giá)</div>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="h3 text-dark mb-0">{formatCurrency(price)}</div>
            {originalPrice > price ? (
              <div className="text-muted text-decoration-line-through">
                {formatCurrency(originalPrice)}
              </div>
            ) : null}
            {discountPercent > 0 ? (
              <span className="badge bg-danger-subtle text-danger px-3 py-2">
                -{discountPercent}%
              </span>
            ) : null}
          </div>

          {colorOptions.length > 0 ? (
            <>
              <div className="mb-2 fw-semibold">
                Màu sắc{selectedColor ? (
                  <>
                    {": "}
                    <span className="fw-normal">{selectedColor}</span>
                  </>
                ) : null}
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                {colorOptions.map((name) => {
                  const key = name;
                  const active = selectedColor === name;
                  return (
                    <button
                      key={key}
                      className={`btn btn-sm ${
                        active ? "btn-dark" : "btn-outline-secondary"
                      }`}
                      onClick={() => setSelectedColor(name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {sizeOptions.length > 0 ? (
            <>
              <div className="mb-2 fw-semibold">Kích thước</div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    className={`btn ${
                      selectedSize === s ? "btn-dark" : "btn-outline-secondary"
                    }`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <div className="mb-3 text-muted d-flex align-items-center gap-2">
            <i className="bi bi-pencil-square"></i>
            Kiểm tra size của bạn
          </div>

          <div className="mb-2 fw-semibold">Số lượng</div>
          <div className="d-inline-flex align-items-stretch border rounded overflow-hidden mb-3">
            <button
              className="btn btn-light"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <div className="px-3 d-flex align-items-center">{quantity}</div>
            <button
              className="btn btn-light"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
            <button className="btn btn-dark px-4">THÊM VÀO GIỎ</button>
            <button className="btn btn-outline-secondary px-4">MUA HÀNG</button>
            <button className="btn btn-outline-secondary px-3">
              <i className="bi bi-heart"></i>
            </button>
          </div>

          <button className="btn btn-link px-0">Tìm tại cửa hàng</button>

          {typeof product?.stock !== "undefined" ? (
            <div className="text-muted mt-3">Tồn kho: {product.stock}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
