"use client";
import dynamic from "next/dynamic";

const LazyMyMap = dynamic(() => import("@/components/MyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-green-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 text-green-3000 mx-auto mb-4"></div>
        <p className="text-white font-medium">Map Loading...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <LazyMyMap />
    </div>
  );
}
