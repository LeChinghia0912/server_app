import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById } from "../api/products";
import { getColors } from "../api/colors";
import { getSizes } from "../api/sizes";
import { resolveImageFromProduct, formatCurrency, placeholderSvg, pickVariantsFromProduct, extractColorOptionsFrom, extractSizeOptionsFrom, resolveVariantId, normalizeVariant } from "../utils/product";
import { addToCart } from "../api/cart";
import { showToast } from "../utils/toast";
import { getVariantsByProductId } from "../api/variants";

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
  const [saving, setSaving] = useState(false);
  const [variantsState, setVariantsState] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getProductById(id);
        const data = res?.data || res;
        if (mounted) setProduct(data);
        // Load variants explicitly
        try {
          const list = await getVariantsByProductId(data?.id || id);
          if (mounted) setVariantsState(Array.isArray(list) ? list : []);
        } catch (_) {}
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
  // Extract variants in a resilient way
  const variants = useMemo(() => (Array.isArray(variantsState) && variantsState.length ? variantsState : pickVariantsFromProduct(product)), [variantsState, product]);

  // Build color/size options preferably from variants so names match
  const colorOptions = useMemo(() => extractColorOptionsFrom(variants, colors.length ? colors : (product?.colors || product?.colorOptions || product?.options?.colors || product?.availableColors || [])), [variants, colors, product]);
  const sizeOptions = useMemo(() => extractSizeOptionsFrom(variants, sizesList.length ? sizesList : (product?.sizes || product?.sizeOptions || product?.options?.sizes || product?.availableSizes || [])), [variants, sizesList, product]);

  // Auto-select defaults if only one option is available
  useEffect(() => {
    if (!selectedColor && colorOptions.length === 1) setSelectedColor(colorOptions[0]);
  }, [colorOptions, selectedColor]);
  useEffect(() => {
    if (!selectedSize && sizeOptions.length === 1) setSelectedSize(sizeOptions[0]);
  }, [sizeOptions, selectedSize]);

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

  // Try to infer variant_id from selected color/size
  const variantId = useMemo(() => resolveVariantId({ variants, product, selectedColor, selectedSize }), [variants, product, selectedColor, selectedSize]);
  const selectedVariant = useMemo(() => {
    const list = Array.isArray(variants) ? variants : []
    const v = list.find(v => (v.id ?? v._id ?? v.uuid) === variantId)
    return normalizeVariant(v)
  }, [variants, variantId])

  const maxStock = Number.isFinite(Number(selectedVariant?.stock)) ? Number(selectedVariant.stock) : (Number(product?.stock) || 0)
  const outOfStock = maxStock <= 0

  useEffect(() => {
    // When variant changes, reset or clamp quantity to available stock
    setQuantity(q => {
      if (outOfStock) return 1
      const n = Number.isFinite(maxStock) && maxStock > 0 ? Math.min(q || 1, maxStock) : (q || 1)
      return n
    })
  }, [variantId, maxStock, outOfStock])

  async function handleAddToCart() {
    try {
      if (!variantId) {
        console.warn('Variant could not be resolved. Please select color/size.')
        showToast({ variant: 'danger', message: 'Không xác định được biến thể sản phẩm. Vui lòng chọn màu/size.' });
        return;
      }
      if (outOfStock) {
        showToast({ variant: 'warning', message: 'Biến thể đã hết hàng' })
        return
      }
      if (quantity > maxStock) {
        showToast({ variant: 'warning', message: `Chỉ còn ${maxStock} sản phẩm trong kho` })
        return
      }
      setSaving(true);
      const payload = { variantId, quantity: quantity || 1 }
      const response = await addToCart(payload);
      showToast({ message: 'Đã thêm vào giỏ hàng' });
      window.dispatchEvent(new CustomEvent('cart:changed'));
    } catch (e) {
      showToast({ variant: 'danger', message: e?.message || 'Thêm vào giỏ hàng thất bại' });
    } finally {
      setSaving(false);
    }
  }

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
              {typeof selectedVariant?.stock !== "undefined" ? (
                <div className="text-muted mt-3"><h5>Tồn kho: {selectedVariant.stock}</h5></div>
              ) : null}
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
              disabled={outOfStock || quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <div className="px-3 d-flex align-items-center">{quantity}</div>
            <button
              className="btn btn-light"
              disabled={outOfStock || (Number.isFinite(maxStock) && maxStock > 0 && quantity >= maxStock)}
              onClick={() => setQuantity((q) => (Number.isFinite(maxStock) && maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1))}
            >
              +
            </button>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
            <button className="btn btn-dark px-4" disabled={saving || outOfStock} onClick={handleAddToCart}>{saving ? 'ĐANG THÊM...' : (outOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ')}</button>
            <button className="btn btn-outline-secondary px-4">MUA HÀNG</button>
            <button className="btn btn-outline-secondary px-3">
              <i className="bi bi-heart"></i>
            </button>
          </div>

          <button className="btn btn-link px-0">Tìm tại cửa hàng</button>

          
        </div>
      </div>
    </div>
  );
}
