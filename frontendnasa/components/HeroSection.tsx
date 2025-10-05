"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Badge } from "./ui/badge";
import DotGrid from "./ui/DotGrid";
import { ScrollTrigger, SplitText } from "gsap/all";
import Image from "next/image";
import landing1 from "@/public/landing1.png";
import landing2 from "@/public/landing2.png";

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

export default function HeroSection() {
  useGSAP(() => {
    gsap.to("#landing1", {
      rotate: -40,
      opacity: 1,
      scale: 0.9,
      duration: 1,
      ease: "power2.inOut",
    });

    gsap.to("#landing2", {
      rotate: 20,
      opacity: 1,
      scale: 1.5,
      duration: 1,
      ease: "power2.inOut",
    });

    const split = SplitText.create("#hero-title", {
      type: "chars",
    });

    // 2. Animate the resulting characters
    gsap.from(split.chars, {
      duration: 0.5,
      y: 20,
      opacity: 0,
      stagger: 0.05, // Stagger the animation of each character
      ease: "power2.out",
    });

    gsap.to(".animate-fade-in-delay", {
      opacity: 1,
      duration: 1,
      ease: "power2.inOut",
    });

    gsap.to("#hero-subtitle", {
      opacity: 1,
      duration: 1,
      ease: "power2.inOut",
    });

    gsap.to("#landing1", {
      opacity: 1,
      duration: 1,
      ease: "power2.inOut",
    });

    gsap.to("#landing2", {
      opacity: 1,
      duration: 1,
      ease: "power2.inOut",
    });
  });

  return (
    <section className="w-full h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 z-0">
        <DotGrid
          dotSize={8}
          gap={20}
          baseColor="#16a34a"
          activeColor="#22c55e"
          proximity={100}
          shockRadius={200}
          shockStrength={3}
          resistance={800}
          returnDuration={1.2}
        />
      </div>
      <div className="w-full  flex justify-center items-center">
        <Image
          id="landing1"
          src={landing1}
          alt="landing1"
          className="object-cover"
          width={300}
          height={300}
        />
      </div>

      {/* Content */}
      <div className="text-center z-10 max-w-4xl mx-auto px-6 w-full">
        <h1 id="hero-title" className="text-6xl font-bold text-white mb-6  ">
          <span className="text-white">Green</span>{" "}
          <span className="text-emerald-400">Radar</span>
        </h1>
        <p
          id="hero-subtitle"
          className="text-2xl text-green-200 mb-8 animate-fade-in-delay"
        >
          Data-Driven Green Space Management{" "}
        </p>

        <div className="flex gap-3 justify-center items-center animate-fade-in-delay-2">
          <Badge
            id="hero-badge-1"
            variant="outline"
            className="text-green-200 border-green-400/50 bg-green-500/10 hover:bg-green-500/20 transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width="36"
                height="36"
                className="text-emerald-400"
              >
                <defs>
                  <clipPath id="__lottie_element_59">
                    <rect width="32" height="32" x="0" y="0"></rect>
                  </clipPath>
                </defs>
                <g clipPath="url(#__lottie_element_59)">
                  <g
                    transform="matrix(0.12479999661445618,0,0,0.12479999661445618,4.986400604248047,4.986400604248047)"
                    opacity="1"
                  >
                    <g opacity="1" transform="matrix(1,0,0,1,88.25,88.25)">
                      <path
                        fill="white"
                        fillOpacity="1"
                        d=" M-3.9000000953674316,-84.94999694824219 C-5.28000020980835,-79.47000122070312 -7.079999923706055,-74.13999938964844 -9.319999694824219,-68.93000030517578 C-15.15999984741211,-55.369998931884766 -23.15999984741211,-43.5 -33.33000183105469,-33.33000183105469 C-43.5,-23.170000076293945 -55.369998931884766,-15.15999984741211 -68.93000030517578,-9.319999694824219 C-74.12999725341797,-7.079999923706055 -79.47000122070312,-5.28000020980835 -84.94999694824219,-3.9000000953674316 C-86.73999786376953,-3.450000047683716 -88,-1.850000023841858 -88,0 C-88,1.850000023841858 -86.73999786376953,3.450000047683716 -84.94999694824219,3.9000000953674316 C-79.47000122070312,5.28000020980835 -74.13999938964844,7.079999923706055 -68.93000030517578,9.319999694824219 C-55.369998931884766,15.15999984741211 -43.5099983215332,23.15999984741211 -33.33000183105469,33.33000183105469 C-23.15999984741211,43.5 -15.149999618530273,55.369998931884766 -9.319999694824219,68.93000030517578 C-7.079999923706055,74.12999725341797 -5.28000020980835,79.47000122070312 -3.9000000953674316,84.94999694824219 C-3.450000047683716,86.73999786376953 -1.840000033378601,88 0,88 C1.850000023841858,88 3.450000047683716,86.73999786376953 3.9000000953674316,84.94999694824219 C5.28000020980835,79.47000122070312 7.079999923706055,74.13999938964844 9.319999694824219,68.93000030517578 C15.15999984741211,55.369998931884766 23.15999984741211,43.5099983215332 33.33000183105469,33.33000183105469 C43.5,23.15999984741211 55.369998931884766,15.149999618530273 68.93000030517578,9.319999694824219 C74.12999725341797,7.079999923706055 79.47000122070312,5.28000020980835 84.94999694824219,3.9000000953674316 C86.73999786376953,3.450000047683716 88,1.840000033378601 88,0 C88,-1.850000023841858 86.73999786376953,-3.450000047683716 84.94999694824219,-3.9000000953674316 C79.47000122070312,-5.28000020980835 74.13999938964844,-7.079999923706055 68.93000030517578,-9.319999694824219 C55.369998931884766,-15.15999984741211 43.5099983215332,-23.15999984741211 33.33000183105469,-33.33000183105469 C23.15999984741211,-43.5 15.149999618530273,-55.369998931884766 9.319999694824219,-68.93000030517578 C7.079999923706055,-74.12999725341797 5.28000020980835,-79.47000122070312 3.9000000953674316,-84.94999694824219 C3.450000047683716,-86.73999786376953 1.850000023841858,-88 0,-88 C-1.850000023841858,-88 -3.450000047683716,-86.73999786376953 -3.9000000953674316,-84.94999694824219z"
                      ></path>
                    </g>
                  </g>
                </g>
              </svg>
              <span className="text-white text-sm font-bold">AI Powered</span>
            </div>
          </Badge>
          <Badge
            id="hero-badge-2"
            className="text-white border-green-300/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="36"
                height="36"
                fill="currentColor"
              >
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                <path d="M19 15L20.5 18.5L24 20L20.5 21.5L19 25L17.5 21.5L14 20L17.5 18.5L19 15Z" />
                <path d="M5 15L6.5 18.5L10 20L6.5 21.5L5 25L3.5 21.5L0 20L3.5 18.5L5 15Z" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <path d="M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12S9.79 8 12 8 16 9.79 16 12 14.21 16 12 16Z" />
              </svg>
              <span className="text-white text-sm font-bold">
                NASA Satellite Data
              </span>
            </div>
          </Badge>
        </div>
      </div>

      <div className="w-full h-full flex justify-center items-center">
        <Image
          id="landing2"
          src={landing2}
          alt="landing2"
          className="object-cover"
          width={600}
          height={600}
        />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
