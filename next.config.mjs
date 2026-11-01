/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "chromadb",
    "@chroma-core/default-embed",
    "@huggingface/transformers",
  ],
};

export default nextConfig;
