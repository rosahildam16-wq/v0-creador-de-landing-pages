"use client"

import React, { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface NetflixRowProps {
    title: string
    children: React.ReactNode
}

export function NetflixRow({ title, children }: NetflixRowProps) {
    const rowRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current
            const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth
            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
        }
    }

    return (
        <div className="group relative flex flex-col gap-3 py-4">
            <h2 className="px-1 text-lg font-black tracking-tight text-white/90 uppercase">{title}</h2>

            <div className="relative">
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 z-10 hidden w-12 items-center justify-center bg-black/60 opacity-0 transition-opacity hover:bg-black/80 group-hover:flex group-hover:opacity-100"
                >
                    <ChevronLeft className="h-8 w-8 text-white" />
                </button>

                <div
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto px-1 pb-4 scrollbar-hide"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {children}
                </div>

                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-10 hidden w-12 items-center justify-center bg-black/60 opacity-0 transition-opacity hover:bg-black/80 group-hover:flex group-hover:opacity-100"
                >
                    <ChevronRight className="h-8 w-8 text-white" />
                </button>
            </div>
        </div>
    )
}
