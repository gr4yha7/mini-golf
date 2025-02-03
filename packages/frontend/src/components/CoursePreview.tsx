import { useEffect, useRef } from 'react';
import type { CourseObject } from '../types/shared';
import { CourseRenderer } from '../renderer/courseRenderer';

interface CoursePreviewProps {
  course: CourseObject[];
  width?: number;
  height?: number;
  onLoad?: () => void;
}

export function CoursePreview({ 
  course, 
  width = 800, 
  height = 600,
  onLoad 
}: CoursePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CourseRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    rendererRef.current = new CourseRenderer(containerRef.current, {
      shadows: true,
      antialias: true
    });

    rendererRef.current.renderCourse(course);
    rendererRef.current.animate();
    onLoad?.();

    return () => {
      rendererRef.current?.dispose();
    };
  }, [course, onLoad]);

  return (
    <div 
      ref={containerRef} 
      style={{ width, height }}
      className="relative rounded-lg overflow-hidden shadow-lg"
    />
  );
} 