"use client"

import React from "react"
import Link from "next/link"
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"

interface NetflixCardProps {
    course: any
    basePath: string
    progress?: number
}

export function NetflixCard({ course, basePath, progress }: NetflixCardProps) {
    return (
        <div className="group relative min-w-[300px] sm:min-w-[320px] scroll-snap-align-start transition-all duration-300 hover:z-20 hover:scale-110">
            <Link href={`${basePath}/${course.id}`}>
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-900 border border-white/5">
                    <img
                        src={course.thumbnail || `/course-placeholders/${course.id % 5}.jpg`}
                        alt={course.titulo}
                        className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-50"
                    />

                    {/* Logo overlay (simple text for now) */}
                    <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                        <span className="text-xl font-black text-white drop-shadow-lg tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                            {course.titulo}
                        </span>
                    </div>

                    {/* Progress bar */}
                    {progress !== undefined && (
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Hover Info (Simplified Netflix style) */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                            <Play className="h-4 w-4 fill-current" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-black/40 text-white hover:border-white">
                            <Plus className="h-4 w-4" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-black/40 text-white hover:border-white ml-auto">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <span>{progress !== undefined ? `${progress}% completado` : "Nuevo Contenido"}</span>
                        <span className="border border-white/40 px-1 text-white">4K</span>
                    </div>
                </div>
            </Link>
        </div>
    )
}
