// App.tsx
import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import SupplierPanel from "./supplierpanel";
import ProductsPanel from "./productpanel";
import { SUPPLIER, PRODUCTS } from "./Types";
import axios from "../api/axios";
import { uploadImageToCloudinary } from "../api/cloudinary";

// ── Hero Banner ───────────────────────────────────────────────────────────────

interface ProfileSummary {
  fullName: string;
  companyName: string;
  location: string;
  roleType: string;
  Logo?: string | null;
  businessBanner?: string | null;
}

function HeroBanner({
  bannerUrl,
  uploading,
  onBannerClick,
  onBannerChange,
}: {
  bannerUrl: string | null;
  companyName: string;
  location: string;
  roleType: string;
  uploading: boolean;
  onBannerClick: () => void;
  onBannerChange: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="position-relative overflow-hidden flex-shrink-0"
      style={{
        height: 180,
        background: bannerUrl
          ? `linear-gradient(180deg, rgba(17,17,17,0.08), rgba(17,17,17,0.48)), url(${bannerUrl}) center/cover no-repeat`
          : "linear-gradient(135deg, #7c5024 0%, #c8870a 40%, #8b4513 70%, #3d2008 100%)",
      }}
    >
      {!bannerUrl && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="position-absolute"
              style={{
                width: `${60 + i * 40}px`,
                height: `${60 + i * 40}px`,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                transform: `rotate(${25 + i * 8}deg)`,
                left: `${i * 18}%`,
                top: `${-20 + i * 12}%`,
              }}
            />
          ))}
        </>
      )}

      <div
        className="position-absolute top-0 end-0 p-3"
        style={{ zIndex: 2 }}
      >
        <button
          type="button"
          className="btn btn-sm btn-light shadow-sm"
          onClick={() => {
            onBannerClick();
            inputRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? "Uploading banner..." : "Change banner"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="d-none"
          onChange={(e) => onBannerChange(e.target.files?.[0])}
        />
      </div>

      <div className="position-absolute bottom-0 start-0 p-4 text-white" style={{ zIndex: 1 }}>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("user/info", { withCredentials: true });
        const user = response.data?.data?.user;

        if (!user) return;

        setProfile({
          fullName: user.fullName ?? "Supplier",
          companyName: user.companyName ?? user.fullName ?? "Supplier",
          location: user.location ?? "Location not set",
          roleType: String(user.roleType ?? "merchant").toUpperCase(),
          Logo: user.Logo ?? null,
          businessBanner: user.businessBanner ?? null,
        });
        setBannerUrl(user.businessBanner ?? null);
      } catch (error) {
        console.error("Failed to fetch profile details:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleBannerChange = async (file: File | undefined) => {
    if (!file) return;

    setBannerUploading(true);
    try {
      const upload = await uploadImageToCloudinary(file, "saiti/business-banners");
      await axios.patch(
        "user/media",
        { businessBanner: upload.secureUrl },
        { withCredentials: true }
      );
      setBannerUrl(upload.secureUrl);
      setProfile((prev) => prev ? { ...prev, businessBanner: upload.secureUrl } : prev);
    } catch (error) {
      console.error("Failed to update banner:", error);
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        body { background: #f5f5f5; }

        /* Bootstrap active page-link colour override */
        .page-item.active .page-link {
          background-color: #111 !important;
          border-color: #111 !important;
          color: #fff !important;
        }

        /* Soften Bootstrap table-hover shade */
        .table-hover > tbody > tr:hover > * {
          --bs-table-bg-state: rgba(0,0,0,0.02);
        }
      `}</style>

      {/* Bootstrap CSS via CDN */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossOrigin="anonymous"
      />

      <div className="d-flex flex-column min-vh-100">
        <Header
          brandName="SAITI_LTD"
          userName={SUPPLIER.name.replace(" ", "_")}
          userRole="Supplier"
        />

        <HeroBanner
          bannerUrl={bannerUrl}
          companyName={profile?.companyName ?? SUPPLIER.name}
          location={profile?.location ?? SUPPLIER.location}
          roleType={profile?.roleType ?? "MERCHANT"}
          uploading={bannerUploading}
          onBannerClick={() => undefined}
          onBannerChange={handleBannerChange}
        />

        {/* Main content — overlaps banner with negative margin */}
        <div
          className="d-flex gap-3 flex-grow-1 px-4 pb-4"
          style={{ marginTop: -80 }}
        >
          <SupplierPanel supplier={SUPPLIER} />
          <ProductsPanel products={PRODUCTS} />
        </div>
      </div>
    </>
  );
}