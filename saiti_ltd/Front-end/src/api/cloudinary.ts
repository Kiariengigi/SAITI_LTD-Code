export interface CloudinaryUploadResult {
    secureUrl: string;
    publicId: string;
}

const getCloudinaryConfig = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.");
    }

    return { cloudName, uploadPreset };
};

export async function uploadImageToCloudinary(file: File, folder?: string): Promise<CloudinaryUploadResult> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Only image files can be uploaded.");
    }

    const { cloudName, uploadPreset } = getCloudinaryConfig();
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    if (folder) {
        formData.append("folder", folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
        secureUrl: data.secure_url as string,
        publicId: data.public_id as string,
    };
}