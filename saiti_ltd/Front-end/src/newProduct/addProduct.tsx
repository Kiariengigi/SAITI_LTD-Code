import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import axios from '../api/axios'

// ── Types ────────────────────────────────────────────────────────
interface FormData {
  productName:       string
  description:       string
  productImage:      string
  category:          string
  unitOfMeasure:     string
  price:             string
  currentStockLevel: string
  reorderPoint:      string
  isActive:          boolean
}

interface FieldError {
  [key: string]: string
}

const CATEGORIES = [
  'Beverages',
  'Grains & Cereals',
  'Dairy',
  'Toiletries & Personal Care',
  'Cleaning Products',
  'Snacks & Confectionery',
  'Cooking Oils & Fats',
  'Fresh Produce',
  'Meat & Poultry',
  'Other',
]

const UNITS = [
  { value: 'unit',   label: 'Unit (pcs)' },
  { value: 'kg',     label: 'Kilogram (kg)' },
  { value: 'g',      label: 'Gram (g)' },
  { value: 'litre',  label: 'Litre (L)' },
  { value: 'ml',     label: 'Millilitre (ml)' },
  { value: 'box',    label: 'Box' },
  { value: 'crate',  label: 'Crate' },
  { value: 'bag',    label: 'Bag' },
  { value: 'dozen',  label: 'Dozen' },
]

const MAX_IMAGE_SIZE_MB = 4

// ── Client-side validation ────────────────────────────────────────
function validateForm(data: FormData): FieldError {
  const errors: FieldError = {}

  if (!data.productName.trim())
    errors.productName = 'Product name is required'
  else if (data.productName.trim().length < 2)
    errors.productName = 'Product name must be at least 2 characters'

  if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0)
    errors.price = 'Enter a valid price greater than 0'

  if (data.currentStockLevel && (isNaN(Number(data.currentStockLevel)) || Number(data.currentStockLevel) < 0))
    errors.currentStockLevel = 'Stock level cannot be negative'

  if (data.reorderPoint && (isNaN(Number(data.reorderPoint)) || Number(data.reorderPoint) < 0))
    errors.reorderPoint = 'Reorder point cannot be negative'

  return errors
}

// ================================================================
// Page Component
// ================================================================
export default function AddProductPage() {

    const navigate = useNavigate()
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState<FormData>({
    productName:       '',
    description:       '',
    productImage:      '',
    category:          '',
    unitOfMeasure:     'unit',
    price:             '',
    currentStockLevel: '0',
    reorderPoint:      '0',
    isActive:          true,
  })

  const [errors,    setErrors]    = useState<FieldError>({})
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')

  // ── Handlers ───────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear field error on change
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
    setServerErr(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fieldErrors = validateForm(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    setServerErr(null)

    try {
      await axios.post('products/add', {
        productName:       form.productName.trim(),
        description:       form.description.trim() || null,
        productImage:      form.productImage || null,
        category:          form.category || null,
        unitOfMeasure:     form.unitOfMeasure,
        price:             parseFloat(form.price),
        currentStockLevel: parseFloat(form.currentStockLevel) || 0,
        reorderPoint:      parseFloat(form.reorderPoint) || 0,
        isActive:          form.isActive,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })

      setSuccess(true)
      setTimeout(() => navigate('/profile'), 1800)
    } catch (err: any) {
      const data = err.response?.data
      console.error('Product add error:', err);
      
      if (data?.errors) {
        // Handle validation errors from backend
        const apiErrors: FieldError = {}
        Object.entries(data.errors).forEach(([field, messages]: [string, any]) => {
          apiErrors[field] = Array.isArray(messages) ? messages[0] : messages
        })
        setErrors(apiErrors)
      } else if (data?.message) {
        // Handle general error message from backend
        setServerErr(data.message)
      } else {
        // Fallback error message
        setServerErr(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({
      productName: '', description: '', productImage: '', category: '',
      unitOfMeasure: 'unit', price: '',
      currentStockLevel: '0', reorderPoint: '0', isActive: true,
    })
    setSelectedImageName('')
    if (imageInputRef.current) imageInputRef.current.value = ''
    setErrors({})
    setServerErr(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, productImage: 'Please choose an image file.' }))
      e.target.value = ''
      return
    }

    const maxImageSize = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if (file.size > maxImageSize) {
      setErrors((prev) => ({
        ...prev,
        productImage: `Image must be ${MAX_IMAGE_SIZE_MB}MB or less.`,
      }))
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        productImage: typeof reader.result === 'string' ? reader.result : '',
      }))
      setSelectedImageName(file.name)
      setErrors((prev) => {
        const next = { ...prev }
        delete next.productImage
        return next
      })
    }
    reader.readAsDataURL(file)
    setServerErr(null)
  }

  const removeImage = () => {
    setForm((prev) => ({ ...prev, productImage: '' }))
    setSelectedImageName('')
    if (imageInputRef.current) imageInputRef.current.value = ''
    setErrors((prev) => {
      const next = { ...prev }
      delete next.productImage
      return next
    })
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span className="sep">›</span>
          <Link to="/profile">Products</Link>
          <span className="sep">›</span>
          <span>Add New</span>
        </div>
        <h1 className="page-title">Add New Product</h1>
        <p className="page-sub">
          Fill in the details below to list a new product in the Saiti distribution network.
        </p>
      </div>

      {/* ── Success banner ────────────────────────────── */}
      {success && (
        <div className="banner banner--success" role="alert">
          <span className="banner__icon">✓</span>
          <div>
            <strong>Product created successfully!</strong>
            <p>Redirecting you to your products list…</p>
          </div>
        </div>
      )}

      {/* ── Server error banner ───────────────────────── */}
      {serverErr && (
        <div className="banner banner--error" role="alert">
          <span className="banner__icon">!</span>
          <div>
            <strong>Error</strong>
            <p>{serverErr}</p>
          </div>
        </div>
      )}

      {/* ── Form ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="product-form">

        {/* Section: Basic info */}
        <section className="form-section">
          <h2 className="section-title">
            <span className="section-num">01</span>
            Basic information
          </h2>

          {/* Product name */}
          <div className={`field ${errors.productName ? 'field--error' : ''}`}>
            <label htmlFor="productName" className="field__label">
              Product name <span className="required">*</span>
            </label>
            <input
              id="productName"
              name="productName"
              type="text"
              className="field__input"
              placeholder="e.g. Unga wa Sembe 2kg"
              value={form.productName}
              onChange={handleChange}
              maxLength={255}
              autoFocus
            />
            {errors.productName && (
              <span className="field__error">{errors.productName}</span>
            )}
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="description" className="field__label">
              Description
              <span className="field__optional">Optional</span>
            </label>
            <textarea
              id="description"
              name="description"
              className="field__textarea"
              placeholder="Briefly describe the product — packaging, variants, storage requirements…"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={1000}
            />
            <span className="field__count">{form.description.length}/1000</span>
          </div>

          <div className={`field ${errors.productImage ? 'field--error' : ''}`}>
            <label htmlFor="productImage" className="field__label">
              Product image
              <span className="field__optional">Optional</span>
            </label>

            <label htmlFor="productImage" className="image-upload">
              <span className="image-upload__title">Click to upload image</span>
              <span className="image-upload__sub">PNG, JPG, WEBP up to {MAX_IMAGE_SIZE_MB}MB</span>
              {selectedImageName && (
                <span className="image-upload__file">Selected: {selectedImageName}</span>
              )}
            </label>

            <input
              id="productImage"
              name="productImage"
              type="file"
              accept="image/*"
              className="field__file"
              ref={imageInputRef}
              onChange={handleImageSelect}
            />

            {form.productImage && (
              <div className="image-preview">
                <img src={form.productImage} alt="Product preview" className="image-preview__img" />
                <button type="button" className="btn btn--ghost-danger" onClick={removeImage}>
                  Remove image
                </button>
              </div>
            )}

            {errors.productImage && (
              <span className="field__error">{errors.productImage}</span>
            )}
          </div>

          {/* Category + Unit row */}
          <div className="field-row">
            <div className="field">
              <label htmlFor="category" className="field__label">
                Category
                <span className="field__optional">Optional</span>
              </label>
              <select
                id="category"
                name="category"
                className="field__select"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="unitOfMeasure" className="field__label">
                Unit of measure <span className="required">*</span>
              </label>
              <select
                id="unitOfMeasure"
                name="unitOfMeasure"
                className="field__select"
                value={form.unitOfMeasure}
                onChange={handleChange}
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section: Pricing */}
        <section className="form-section">
          <h2 className="section-title">
            <span className="section-num">02</span>
            Pricing
          </h2>

          <div className={`field field--prefix ${errors.price ? 'field--error' : ''}`}>
            <label htmlFor="price" className="field__label">
              Selling price (KES) <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-prefix">KES</span>
              <input
                id="price"
                name="price"
                type="number"
                className="field__input field__input--prefixed"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
              />
            </div>
            {errors.price && (
              <span className="field__error">{errors.price}</span>
            )}
          </div>
        </section>

        {/* Section: Stock */}
        <section className="form-section">
          <h2 className="section-title">
            <span className="section-num">03</span>
            Stock levels
          </h2>

          <div className="field-row">
            <div className={`field ${errors.currentStockLevel ? 'field--error' : ''}`}>
              <label htmlFor="currentStockLevel" className="field__label">
                Current stock
              </label>
              <div className="input-wrapper">
                <input
                  id="currentStockLevel"
                  name="currentStockLevel"
                  type="number"
                  className="field__input"
                  placeholder="0"
                  value={form.currentStockLevel}
                  onChange={handleChange}
                  min="0"
                  step="0.001"
                />
                <span className="input-suffix">{form.unitOfMeasure}</span>
              </div>
              {errors.currentStockLevel && (
                <span className="field__error">{errors.currentStockLevel}</span>
              )}
              <span className="field__hint">
                Opening stock — logged automatically in the stock store
              </span>
            </div>

            <div className={`field ${errors.reorderPoint ? 'field--error' : ''}`}>
              <label htmlFor="reorderPoint" className="field__label">
                Reorder point
              </label>
              <div className="input-wrapper">
                <input
                  id="reorderPoint"
                  name="reorderPoint"
                  type="number"
                  className="field__input"
                  placeholder="0"
                  value={form.reorderPoint}
                  onChange={handleChange}
                  min="0"
                  step="0.001"
                />
                <span className="input-suffix">{form.unitOfMeasure}</span>
              </div>
              {errors.reorderPoint && (
                <span className="field__error">{errors.reorderPoint}</span>
              )}
              <span className="field__hint">
                AI sends a stockout warning when stock falls below this level
              </span>
            </div>
          </div>
        </section>

        {/* Section: Status */}
        <section className="form-section form-section--inline">
          <div className="toggle-row">
            <div>
              <h2 className="section-title section-title--inline">
                <span className="section-num">04</span>
                Listing status
              </h2>
              <p className="toggle-desc">
                {form.isActive
                  ? 'Product is visible to wholesalers and merchants.'
                  : 'Product is hidden — wholesalers cannot place orders yet.'}
              </p>
            </div>
            <label className="toggle" htmlFor="isActive">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                className="toggle__input"
                checked={form.isActive}
                onChange={handleChange}
              />
              <span className="toggle__track">
                <span className="toggle__thumb" />
              </span>
              <span className="toggle__label">
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
        </section>

        {/* ── Actions ─────────────────────────────────── */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={loading}
          >
            Clear form
          </button>
          <Link to="/profile" className="btn btn--secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Saving…
              </>
            ) : success ? (
              <>✓ Saved!</>
            ) : (
              'Add product'
            )}
          </button>
        </div>
      </form>

      {/* ── Styles ───────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #f7f6f2;
          --surface:  #ffffff;
          --border:   #e2e0d8;
          --border-focus: #1a1a1a;
          --text:     #1a1a1a;
          --text-sub: #6b6860;
          --accent:   #2d5a3d;
          --accent-light: #e8f0eb;
          --error:    #c0392b;
          --error-bg: #fdf3f2;
          --success:  #1e7e4f;
          --success-bg: #edf7f2;
          --num-bg:   #1a1a1a;
          --num-color: #f7f6f2;
          --radius:   10px;
          --shadow:   0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
        }

        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

        .page-wrapper {
          max-width: 740px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* Header */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-sub);
          margin-bottom: 24px;
        }
        .breadcrumb a { color: var(--text-sub); text-decoration: none; }
        .breadcrumb a:hover { color: var(--text); }
        .sep { opacity: .4; }
        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .page-sub {
          color: var(--text-sub);
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 40px;
        }

        /* Banners */
        .banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          border-radius: var(--radius);
          margin-bottom: 28px;
          font-size: 14px;
          animation: slideDown .25s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .banner--success { background: var(--success-bg); border: 1px solid #a8dbc0; color: var(--success); }
        .banner--error   { background: var(--error-bg);   border: 1px solid #f5b7b1; color: var(--error); }
        .banner__icon {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px; flex-shrink: 0;
        }
        .banner--success .banner__icon { background: var(--success); color: white; }
        .banner--error   .banner__icon { background: var(--error);   color: white; }
        .banner strong { display: block; font-weight: 600; margin-bottom: 2px; }
        .banner p { opacity: .8; margin: 0; }

        /* Form */
        .product-form { display: flex; flex-direction: column; gap: 4px; }

        /* Sections */
        .form-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px 32px;
          margin-bottom: 16px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-section--inline { flex-direction: row; align-items: center; justify-content: space-between; }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2px;
        }
        .section-title--inline { margin-bottom: 0; }
        .section-num {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          background: var(--num-bg);
          color: var(--num-color);
          padding: 2px 7px;
          border-radius: 4px;
          font-family: 'DM Sans', monospace;
        }

        /* Fields */
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 560px) {
          .field-row { grid-template-columns: 1fr; }
          .form-section { padding: 20px; }
          .form-section--inline { flex-direction: column; align-items: flex-start; gap: 16px; }
        }

        .field__label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .required { color: var(--error); font-size: 12px; }
        .field__optional {
          font-size: 11px;
          color: var(--text-sub);
          background: #f0eeea;
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 400;
        }

        .field__input,
        .field__textarea,
        .field__select {
          width: 100%;
          padding: 10px 13px;
          border: 1.5px solid var(--border);
          border-radius: 7px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          background: var(--bg);
          transition: border-color .15s, box-shadow .15s;
          outline: none;
          appearance: none;
        }
        .field__input::placeholder,
        .field__textarea::placeholder { color: #b0ae a8; opacity: 1; }
        .field__input:focus,
        .field__textarea:focus,
        .field__select:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(26,26,26,.07);
          background: white;
        }
        .field--error .field__input,
        .field--error .field__textarea,
        .field--error .field__select {
          border-color: var(--error);
        }
        .field__textarea { resize: vertical; min-height: 80px; }
        .field__select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b6860' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 13px center;
          padding-right: 36px;
          cursor: pointer;
        }
        .field__error {
          font-size: 12px;
          color: var(--error);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .field__error::before { content: '⚠'; font-size: 11px; }
        .field__hint {
          font-size: 12px;
          color: var(--text-sub);
          line-height: 1.4;
        }
        .field__count {
          font-size: 11px;
          color: var(--text-sub);
          text-align: right;
          margin-top: -4px;
        }

        .field__file {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .image-upload {
          border: 1.5px dashed var(--border);
          border-radius: 8px;
          background: var(--bg);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .image-upload:hover {
          border-color: var(--border-focus);
          background: #fcfcfb;
        }
        .image-upload__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .image-upload__sub {
          font-size: 12px;
          color: var(--text-sub);
        }
        .image-upload__file {
          margin-top: 2px;
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
        }

        .image-preview {
          margin-top: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: white;
        }
        .image-preview__img {
          width: 66px;
          height: 66px;
          object-fit: cover;
          border-radius: 7px;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }

        /* Input with prefix/suffix */
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-prefix {
          position: absolute;
          left: 13px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-sub);
          pointer-events: none;
          z-index: 1;
        }
        .input-suffix {
          position: absolute;
          right: 13px;
          font-size: 12px;
          color: var(--text-sub);
          pointer-events: none;
          background: #f0eeea;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .field__input--prefixed { padding-left: 46px; }

        /* Toggle */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 24px;
        }
        .toggle-desc {
          font-size: 13px;
          color: var(--text-sub);
          margin-top: 4px;
          max-width: 380px;
        }
        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .toggle__input { position: absolute; opacity: 0; width: 0; height: 0; }
        .toggle__track {
          width: 44px; height: 24px;
          background: var(--border);
          border-radius: 12px;
          position: relative;
          transition: background .2s;
          flex-shrink: 0;
        }
        .toggle__input:checked ~ .toggle__track { background: var(--accent); }
        .toggle__thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }
        .toggle__input:checked ~ .toggle__track .toggle__thumb { transform: translateX(20px); }
        .toggle__label { font-size: 13px; font-weight: 500; color: var(--text); min-width: 52px; }

        /* Actions */
        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 8px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 7px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all .15s;
          text-decoration: none;
          white-space: nowrap;
        }
        .btn:disabled { opacity: .6; cursor: not-allowed; }

        .btn--primary {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        .btn--primary:hover:not(:disabled) {
          background: #234d33;
          border-color: #234d33;
        }
        .btn--secondary {
          background: white;
          color: var(--text);
          border-color: var(--border);
        }
        .btn--secondary:hover { background: var(--bg); }
        .btn--ghost {
          background: transparent;
          color: var(--text-sub);
          border-color: transparent;
          padding-left: 8px;
          margin-right: auto;
        }
        .btn--ghost:hover:not(:disabled) { color: var(--text); }
        .btn--ghost-danger {
          color: var(--error);
          border-color: #f3d1cc;
          background: #fff7f6;
          padding: 7px 11px;
          font-size: 12px;
        }
        .btn--ghost-danger:hover:not(:disabled) {
          background: #fdecea;
          border-color: #efb4ab;
        }

        /* Spinner */
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}